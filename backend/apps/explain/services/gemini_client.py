import os
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def _get_fallback_explanation(scheme_name: str, status: str, matched_rules: list, missing_rules: list, language: str = "en") -> str:
    """Generates high-quality fallback explanation if Gemini API is unavailable."""
    is_hindi = language.lower() in ("hi", "hindi")
    
    if status == "eligible":
        matched_str = ", ".join([f"{r.get('field', '').replace('_', ' ')} satisfies criteria ({r.get('op')} {r.get('value')})" for r in matched_rules])
        if is_hindi:
            return f"बधाई हो! आप {scheme_name} के लिए पूरी तरह पात्र हैं क्योंकि आपके सभी विवरण योजना के पात्रता मापदंडों को पूरा करते हैं।"
        return f"You are fully eligible for {scheme_name}! All your verified profile attributes ({matched_str or 'criteria'}) successfully meet the official guidelines."

    elif status == "near_miss":
        missing_desc = ", ".join([f"{r.get('field', '').replace('_', ' ')} (requires {r.get('op')} {r.get('value')})" for r in missing_rules])
        if is_hindi:
            return f"आप {scheme_name} के बहुत करीब हैं। केवल एक शर्त पूरी नहीं हो रही है: {missing_desc}। यदि आप इस शर्त को पूरा करते हैं या आवश्यक दस्तावेज प्रस्तुत करते हैं, तो आप पात्र हो सकते हैं।"
        return f"You are nearly eligible for {scheme_name}. You meet almost all conditions except: {missing_desc}. If your circumstances change or updated documentation is provided, you may qualify."

    else:
        missing_desc = ", ".join([f"{r.get('field', '').replace('_', ' ')} (requires {r.get('op')} {r.get('value')})" for r in missing_rules])
        if is_hindi:
            return f"वर्तमान में आप {scheme_name} के लिए पात्र नहीं हैं क्योंकि निम्नलिखित आवश्यकताएं पूरी नहीं हो रही हैं: {missing_desc}।"
        return f"Currently, you do not meet the eligibility requirements for {scheme_name} due to the following criteria: {missing_desc}."

def explain_eligibility(
    scheme_name: str,
    scheme_description: str,
    status: str,
    matched_rules: list,
    missing_rules: list,
    citizen_profile: dict = None,
    language: str = "en"
) -> str:
    """
    Generates a natural language explanation from Gemini for an eligibility result.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY', '')

    if not api_key or api_key == "your_gemini_key_here" or api_key == "your-gemini-api-key":
        return _get_fallback_explanation(scheme_name, status, matched_rules, missing_rules, language)

    prompt = f"""
You are ENTITLE AI, an empathetic government welfare assistant designed to explain welfare scheme eligibility to Indian citizens in plain, simple, and encouraging language.

Target Language: {"Hindi" if language.lower() in ("hi", "hindi") else "English"}
Scheme: {scheme_name}
Scheme Description: {scheme_description}
Evaluation Status: {status} (eligible / near_miss / not_eligible)
Matched Criteria: {matched_rules}
Missing Criteria: {missing_rules}
Citizen Profile Summary: {citizen_profile or {}}

Instructions:
1. Explain clearly WHY the citizen got this result ({status}).
2. If ELIGIBLE: Highlight the key benefit and encourage them to proceed with required documents.
3. If NEAR-MISS: Gently point out the exact 1 criterion missing and offer practical guidance.
4. If NOT ELIGIBLE: Explain simply without jargon and suggest they explore other schemes.
5. Keep it concise (2-4 sentences max), polite, and accessible to rural/first-time users. Do not use markdown header tags (#).
"""

    try:
        # Try google.genai or google.generativeai
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(prompt)
            if response and response.text:
                return response.text.strip()
        except Exception as e1:
            logger.warning(f"google.generativeai call failed: {e1}, trying google-genai...")
            from google import genai as google_genai
            client = google_genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            if response and response.text:
                return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini API invocation error: {e}. Falling back to rule-based explanation.")

    return _get_fallback_explanation(scheme_name, status, matched_rules, missing_rules, language)

def answer_knowledge_query(
    question: str,
    scheme_code: str,
    scheme_name: str,
    scheme_description: str,
    rules_json: dict,
    source_url: str,
    language: str = "en"
) -> str:
    """
    Answers a grounded Q&A knowledge query regarding a welfare scheme.
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', None) or os.environ.get('GEMINI_API_KEY', '')

    if not api_key or api_key == "your_gemini_key_here" or api_key == "your-gemini-api-key":
        return f"Under {scheme_name}, {scheme_description} You can find more official details at {source_url}."

    prompt = f"""
You are ENTITLE Knowledge Assistant, providing grounded, factual information to Indian citizens about government schemes.

Scheme Name: {scheme_name}
Scheme Code: {scheme_code}
Official Description: {scheme_description}
Eligibility Rules: {rules_json}
Official Source: {source_url}

User Question: {question}

Instructions:
- Provide an accurate, helpful answer grounded strictly in the scheme's verified details.
- Keep the tone respectful, clear, and direct (under 4 sentences).
- If the question cannot be answered from the facts, refer them to the official portal {source_url}.
"""

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        if response and response.text:
            return response.text.strip()
    except Exception as e:
        logger.error(f"Gemini Q&A error: {e}. Falling back to default grounded response.")

    return f"Under {scheme_name}, {scheme_description} You can find more official details at {source_url}."
