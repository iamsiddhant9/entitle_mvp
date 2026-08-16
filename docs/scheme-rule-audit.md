# ENTITLE — Scheme Rule Audit

Status of the 12 seeded eligibility rules against official sources.

**Authoritative source of the rules is `backend/apps/schemes/management/commands/seed_schemes.py`.**
The files in `docs/rules/*.json` are *generated artifacts* — `seed_schemes` **writes** them on every
run (including during the test suite). Editing a JSON file there has no effect and will be
overwritten. Change `SCHEMES_DATA` instead.

Verdict labels used below:

| Label | Meaning |
|---|---|
| **CONFIRMED** | Matches an official government source. |
| **UNVERIFIED** | Plausible, but no official source was located. |
| **DISPUTED** | Sources conflict, or the scheme itself is ambiguous. Needs a team decision. |
| **MISMODELLED** | The rule does not represent how the scheme actually works. Needs a design decision. |
| **INCOMPLETE** | The modelled conditions are correct as far as they go, but official criteria are missing. |

---

## Decisions needed from the team

1. **PMJAY** — the rule models eligibility as an income ceiling. The scheme has no income test.
   Needs a decision on how (or whether) to model it. See below.
2. **PM Scholarship** — "PM National Scholarship" does not identify a single real scheme. Needs a
   decision on which scheme this entry represents before its income ceiling means anything.
3. **Rule engine capability** — several schemes' real criteria are *sets of alternatives* (any one of
   N qualifies). The engine only ANDs conditions, so these cannot currently be expressed. This is a
   prerequisite for fixing PMJAY properly.

---

## 1. PMJAY (`pmjay`) — **MISMODELLED**

**Current rule:** `income lte 500000` (single condition).

**What official sources say.** Ayushman Bharat PM-JAY has **no income test**. Entitlement comes from
the SECC-2011 database: deprivation categories in rural areas and 11 occupational categories in
urban areas. A Government of India NIC-hosted portal
([hpkangra.nic.in](https://hpkangra.nic.in/scheme/pmjay-ayushman-bharat-or-ab-nhpm/)) states:

> "There is no cap on family size and age in the scheme"

and lists rural criteria such as *"Families having only one room with kucha walls and kucha roof"*,
*"Female headed households with no adult male member between age 16 to 59"*, and landless households
deriving the major part of their income from manual casual labour.

Since September 2024 the scheme also covers **everyone aged 70+ irrespective of income**
([newsonair.gov.in, 12 Sep 2024](https://www.newsonair.gov.in/cabinet-approves-%e2%82%b95-lakh-health-insurance-for-senior-citizens-above-70-years)):

> "The Cabinet has given its nod to giving health coverage to all senior citizens who are 70+
> irrespective of income under Ayushman Bharat PM Jan Arogya Yojana."

**Two specific problems with the current rule:**

- **The 500000 looks like a category error.** The scheme's own description in the same record says
  *"Health cover of Rs. 5 lakhs per family per year"*. The ₹5 lakh is the **benefit cover amount**,
  and it appears to have been reused as an income ceiling. These are unrelated quantities.
- **`not_eligible` is unreachable.** With one condition and `near_miss_threshold: 1`, one missing
  condition out of one still yields `near_miss`. PMJAY therefore returns only `eligible` or
  `near_miss` for every citizen in the system, whatever their income.

**Why it was not "fixed".** The honest rule is a disjunction (SECC deprivation category **OR** urban
occupational category **OR** age 70+), and the rule engine
(`backend/apps/eligibility/services/rule_engine.py`) evaluates conditions as a conjunction only.
There is no correct value to substitute. Replacing one wrong number with another would look like a
fix while remaining wrong.

**Options for the team:**

| Option | Notes |
|---|---|
| Add OR/any-of support to the rule engine, then model the real categories | Correct, but needs new profile fields (SECC deprivation markers, occupation category) that ENTITLE does not collect. |
| Model only the unambiguous 70+ universal rule and mark the rest "check official portal" | Narrow and defensible; requires the engine change or a second scheme entry. |
| Drop PMJAY from automated evaluation and link to the official beneficiary lookup | Most honest today. NHA determines eligibility by lookup against a beneficiary database, not by computing a predicate. |
| Leave as-is, documented | Current state. The verdict PMJAY emits is not meaningful. |

---

## 2. PM Scholarship (`pm_scholarship`) — **DISPUTED (scheme identity)**

**Current rule:** `occupation eq student` AND `income lte 450000`. Name: "PM National Scholarship".
`source_url`: `https://scholarships.gov.in/`.

**The ₹3.5 lakh vs ₹4.5 lakh question is not a dispute about one scheme.** The two figures belong to
two different schemes:

| Figure | Scheme | Level | Verdict |
|---|---|---|---|
| **₹4,50,000** | PM-USP **CSSS** (Central Sector Scheme of Scholarship for College & University Students), Ministry of Education, via NSP | College / university | **OFFICIAL SOURCE CONFIRMED** |
| **₹3,50,000** | **NMMSS** (National Means-cum-Merit Scholarship Scheme), Dept. of School Education | **Class 9–12** | SECONDARY SOURCE ONLY |

CSSS ceiling, from the West Bengal Dept. of Higher Education portal
([banglaruchchashiksha.wb.gov.in](https://banglaruchchashiksha.wb.gov.in/scholarship_schemes)):

> "Annual family income from all sources should not exceed ₹4.5 lakh."

The central guidelines PDF (`scholarships.gov.in/public/schemeGuidelines/Guidelines_DOHE_CSSS.pdf`)
could not be text-extracted, so the Ministry's own wording was not read directly.

**Other schemes on the same portal have different ceilings** — PMS-SC ₹2,50,000 (secondary source);
PM-YASASVI OBC post-matric is itself **conflicting** between ₹1,50,000 and ₹2,50,000; Post-Matric for
Minorities ₹2,00,000 (secondary). **PMSS** (Prime Minister's Scholarship Scheme, Kendriya Sainik
Board / Ministry of Defence) — for wards of ex-servicemen — appears to have **no income ceiling at
all**; none is stated on [desw.gov.in](https://www.desw.gov.in/prime-ministers-scholarship-scheme-pmss)
or [ksb.gov.in](https://ksb.gov.in/introduction-pmss.htm) (absence inferred, not read as an explicit
statement).

Note also: a widely reported plan to raise the PMS-SC ceiling to ₹4.5 lakh is a **proposal, not a
notified rule** — do not treat it as current.

**Verdict.** `450000` is defensible **if and only if** this entry means PM-USP CSSS. **No value was
changed.** What the team must decide:

1. Which real scheme is this? If CSSS, rename it accordingly and keep ₹4,50,000.
2. If CSSS, the rule is **INCOMPLETE** — it omits binding criteria: above 80th percentile in Class
   XII, enrolled in a regular degree course, and not receiving any other scholarship. ENTITLE
   collects none of these, so the rule will over-report eligibility.

---

## 3. Ladli Behna (`ladli_behna_mp`) — **CONFIRMED (21), one boundary corrected**

**The 21-vs-23 question is resolved: 21 is correct, and the repo already had it.** The 23-year
minimum is historical — it applied to the first registration round only and was lowered when
registrations reopened around 25 July 2023 (The Hindu, The Statesman — secondary sources).

From the official MP Government portal [cmladlibahna.mp.gov.in](https://cmladlibahna.mp.gov.in/):

> **Minimum age:** "आवेदन के कैलेंडर वर्ष में, 01 जनवरी की स्थिति में 21 वर्ष पूर्ण कर चुकी हों"
> (must have completed 21 years as on 1 January of the year of application)
>
> **Maximum age:** "60 वर्ष की आयु से कम हो" (must be less than 60)
>
> **Income:** ineligible if "स्वयं / परिवार की सम्मिलित रूप से स्वघोषित वार्षिक आय 2.5 लाख से अधिक हो"

**Change applied (the only rule value changed in this pass):** `age lte 60` → `age lt 60`, because
the portal says *less than* 60. A 60-year-old was previously treated as eligible.

**Still unmodelled (INCOMPLETE) — recorded, not changed:**

- **Marital status.** Official: "विवाहित हो, जिनमें विधवा, तलाकशुदा एवं परित्यक्ता महिला भी सम्मिलित होंगी"
  (married, including widowed, divorced and abandoned women). ENTITLE has no such field.
  *A secondary report claims unmarried women over 21 were later included; the official portal text
  still says "विवाहित". **NOT VERIFIED** — do not act on it without a primary source.*
- **Age is assessed as on 1 January of the application year**, not on the evaluation date.
- **Exclusions** not modelled: income-tax payers, families owning more than 5 acres, four-wheeler
  owners.
- The description says ₹1,250/month; secondary sources report the amount has since risen. Not
  confirmed on the official portal — **UNVERIFIED**.

---

## 4. Remaining schemes — not individually re-verified

The nine other schemes were **not** researched against official sources in this pass. Their rules are
recorded here as **UNVERIFIED** — plausible and internally consistent, but unconfirmed. They should
not be described to stakeholders as verified.

| Scheme | Current conditions | Status |
|---|---|---|
| `pm_kisan` | occupation=farmer, land_owned=true, income ≤ 200000 | UNVERIFIED |
| `pmay_g` | income ≤ 300000, land_owned=false | UNVERIFIED |
| `pm_vishwakarma` | occupation=artisan, income ≤ 300000 | UNVERIFIED |
| `pm_mudra` | occupation in (self_employed, worker, artisan), income ≤ 1000000 | UNVERIFIED |
| `atal_pension` | age 18–40, has_bank_account=true | UNVERIFIED |
| `pm_jeevan_jyoti` | age 18–50, has_bank_account=true | UNVERIFIED |
| `pmkvy` | age 15–45, occupation in (unemployed, worker, student) | UNVERIFIED |
| `eshram` | age 16–59, occupation in (worker, artisan, farmer, self_employed, unemployed) | UNVERIFIED |
| `sukanya_samriddhi` | girl_child_age 0–10, has_bank_account=true | UNVERIFIED |

A general caution that applies to all of them: ENTITLE models eligibility as a conjunction over a
10-field self-declared profile. Most real schemes additionally depend on documentary proof, state
residency rules, household-level data, and exclusion criteria that a 10-field profile cannot capture.
Results should be presented as an indication, never as a determination.

---

## Cross-cutting issues

**`near_miss_threshold: 1` on every scheme.** For a single-condition scheme (PMJAY) this makes
`not_eligible` unreachable. For multi-condition schemes it means one unmet condition always reads as
"nearly eligible", regardless of how central that condition is — failing the state-residency check
for a Madhya Pradesh scheme is treated the same as being ₹500 over an income line.

**No provenance in the data.** `rules_json` records no source URL, no verification date, and no
confidence. A future pass should consider adding a `verified` block per scheme so the audit state
lives with the rule rather than only in this file.
