"""
Single integration point for Google Gemini.

Design rule of the platform: AI explains decisions, it never makes them.
Every function here degrades gracefully — if GEMINI_API_KEY is unset, the
google-genai package is missing, or the API call fails, we fall back to
deterministic template text built from the rule engine's output, so the
platform is fully demoable offline.
"""
import json
import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def _client():
    """Return a configured google-genai client, or None if unavailable."""
    if not settings.GEMINI_API_KEY:
        return None
    try:
        from google import genai

        return genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception:  # pragma: no cover - import/config issues
        logger.warning("google-genai unavailable; using fallback explanations", exc_info=True)
        return None


def _generate_text(contents):
    client = _client()
    if client is None:
        return None
    try:
        response = client.models.generate_content(model=settings.GEMINI_MODEL, contents=contents)
        text = (response.text or "").strip()
        return text or None
    except Exception:
        logger.warning("Gemini generate_content failed; using fallback", exc_info=True)
        return None


def label_for(rule):
    """Human-readable form of one rule condition."""
    if rule.get("label"):
        return rule["label"]
    op_words = {"eq": "must be", "neq": "must not be", "lte": "must be at most",
                "gte": "must be at least", "lt": "must be below", "gt": "must be above", "in": "must be one of"}
    value = rule.get("value")
    if isinstance(value, list):
        value = ", ".join(str(v) for v in value)
    return "{} {} {}".format(rule.get("field", "?"), op_words.get(rule.get("op"), rule.get("op")), value)


STATUS_HEADLINES = {
    "en": {
        "eligible": "Good news — you are eligible for {scheme}.",
        "near_miss": "You are very close to qualifying for {scheme}.",
        "not_eligible": "You are not currently eligible for {scheme}.",
    },
    "hi": {
        "eligible": "खुशखबरी — आप {scheme} के लिए पात्र हैं।",
        "near_miss": "आप {scheme} के लिए पात्रता के बहुत करीब हैं।",
        "not_eligible": "आप अभी {scheme} के लिए पात्र नहीं हैं।",
    },
}

SECTION_HEADINGS = {
    "en": {"met": "Conditions you meet:", "missing": "Conditions you do not meet yet:", "benefit": "Benefit:"},
    "hi": {"met": "जो शर्तें आप पूरी करते हैं:", "missing": "जो शर्तें अभी पूरी नहीं हुई हैं:", "benefit": "लाभ:"},
}


def _template_explanation(result, scheme, language):
    lang = language if language in STATUS_HEADLINES else "en"
    lines = [STATUS_HEADLINES[lang][result.status].format(scheme=scheme.name)]
    if result.matched_rules:
        lines.append(SECTION_HEADINGS[lang]["met"])
        lines.extend("• {}".format(label_for(rule)) for rule in result.matched_rules)
    if result.missing_rules:
        lines.append(SECTION_HEADINGS[lang]["missing"])
        lines.extend("• {}".format(label_for(rule)) for rule in result.missing_rules)
    if result.status == "eligible" and scheme.benefit:
        lines.append("{} {}".format(SECTION_HEADINGS[lang]["benefit"], scheme.benefit))
    return "\n".join(lines)


def explain_result(result, scheme, language="en"):
    """
    Natural-language explanation of an eligibility decision. The decision
    itself (status + matched/missing rules) is fixed input from the rule
    engine; Gemini only rephrases it.
    """
    language_name = "Hindi" if language == "hi" else "English"
    prompt = (
        "You are ENTITLE, an assistant that explains Indian government welfare eligibility decisions "
        "to citizens in simple, warm, plain {language} (6th-grade reading level).\n"
        "A deterministic rule engine already made this decision — do NOT change or second-guess it, "
        "only explain it.\n\n"
        "Scheme: {name}\nBenefit: {benefit}\nDecision: {status}\n"
        "Conditions satisfied: {matched}\nConditions NOT satisfied: {missing}\n\n"
        "Write 2-4 short sentences explaining the decision. If conditions are not satisfied, state "
        "plainly what is missing and what would need to change. Do not invent any extra criteria, "
        "amounts or promises. Reply in {language} only, plain text without markdown."
    ).format(
        language=language_name,
        name=scheme.name,
        benefit=scheme.benefit or "—",
        status=result.status,
        matched=json.dumps([label_for(r) for r in result.matched_rules], ensure_ascii=False),
        missing=json.dumps([label_for(r) for r in result.missing_rules], ensure_ascii=False),
    )
    return _generate_text(prompt) or _template_explanation(result, scheme, language)


def _template_answer(question, scheme):
    if scheme is not None:
        parts = [scheme.description or scheme.name]
        if scheme.benefit:
            parts.append("Benefit: {}.".format(scheme.benefit))
        parts.append("For complete and current details, see the official portal.")
        return " ".join(parts)
    return (
        "ENTITLE covers 12 central and state welfare schemes across agriculture, housing, health, "
        "education, finance, pension, insurance, skills and labour. Complete your profile in the "
        "assistant to see exactly which schemes you qualify for."
    )


def answer_question(question, scheme=None):
    """Grounded Q&A about a scheme. Returns (answer, source_url)."""
    source_url = scheme.source_url if scheme is not None else ""
    grounding = ""
    if scheme is not None:
        grounding = (
            "Scheme: {name}\nDescription: {description}\nBenefit: {benefit}\n"
            "Eligibility rules (authoritative): {rules}\nOfficial portal: {url}\n"
        ).format(
            name=scheme.name,
            description=scheme.description,
            benefit=scheme.benefit,
            rules=json.dumps(scheme.rules_json, ensure_ascii=False),
            url=scheme.source_url,
        )
    prompt = (
        "You are ENTITLE, a helpful assistant for Indian government welfare schemes. Answer the "
        "citizen's question in 2-4 plain, factual sentences using ONLY the grounding information "
        "below. If the answer is not in the grounding, say you are not sure and point them to the "
        "official portal. Never invent amounts, dates or criteria. Plain text, no markdown.\n\n"
        "{grounding}\nQuestion: {question}"
    ).format(grounding=grounding or "(no specific scheme selected)", question=question)
    answer = _generate_text(prompt) or _template_answer(question, scheme)
    return answer, source_url


DOC_FIELD_HINTS = {
    "aadhaar_card": '{"name": "...", "aadhaar_no": "mask all but last 4 digits as XXXX-XXXX-1234", "dob": "YYYY-MM-DD"}',
    "land_ownership_document": '{"owner_name": "...", "survey_no": "...", "area": "..."}',
    "income_certificate": '{"name": "...", "annual_income": 0, "issue_date": "YYYY-MM-DD", "expiry_date": "YYYY-MM-DD"}',
    "bank_passbook": '{"name": "...", "bank_name": "...", "account_no": "mask all but last 4 digits"}',
    "ration_card": '{"name": "...", "card_no": "mask all but last 4 digits", "category": "..."}',
    "birth_certificate": '{"name": "...", "dob": "YYYY-MM-DD"}',
}


def extract_document_fields(file_bytes, mime_type, doc_type):
    """
    Gemini Vision extraction of key fields from an uploaded document image.
    Returns a dict ({} when Gemini is unavailable or the response is unusable).
    """
    client = _client()
    if client is None:
        return {}
    hint = DOC_FIELD_HINTS.get(doc_type, '{"name": "..."}')
    prompt = (
        "Extract the key fields from this Indian government document image ({doc_type}). "
        "Respond with ONLY a JSON object shaped like {hint}. Use null for unreadable fields. "
        "Mask sensitive numbers as instructed. No markdown, no commentary."
    ).format(doc_type=doc_type, hint=hint)
    try:
        from google.genai import types

        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents=[types.Part.from_bytes(data=file_bytes, mime_type=mime_type), prompt],
        )
        text = (response.text or "").strip()
        if text.startswith("```"):
            text = text.strip("`")
            text = text[text.index("{"):] if "{" in text else text
        if text.endswith("```"):
            text = text[: text.rindex("}") + 1]
        data = json.loads(text)
        return data if isinstance(data, dict) else {}
    except Exception:
        logger.warning("Gemini vision extraction failed", exc_info=True)
        return {}
