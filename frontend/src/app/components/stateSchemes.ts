/**
 * ILLUSTRATIVE per-state welfare scheme data for the India impact map.
 *
 * ---------------------------------------------------------------------
 *  THIS IS NOT LIVE GOVERNMENT DATA AND MUST NEVER BE PRESENTED AS SUCH.
 * ---------------------------------------------------------------------
 *
 * The backend exposes only a limited national scheme registry
 * (listSchemes in src/lib/api.ts) and provides no per-state eligibility,
 * benefit amounts, or coverage figures. The programme *names* below are
 * genuine state schemes, but the amounts, categories, and their
 * association with any citizen profile are illustrative and were written
 * for demonstration purposes only.
 *
 * Every surface rendering this data must carry a visible demo-data
 * label. See DEMO_DATA_LABEL below and the notice in IndiaImpactMap.
 */

export type StateScheme = {
  /** Programme name as publicly known. */
  name: string;
  /** One key detail - benefit amount, cover, or status. */
  detail: string;
  /** Short category, used as the card badge. */
  category: string;
};

/** Rendered on every card showing illustrative data. Keep it legible. */
export const DEMO_DATA_LABEL = "DEMO DATA";

/** Used for states and UTs without a specific list. */
const NATIONAL_SCHEMES: StateScheme[] = [
  { name: "PM KISAN", detail: "₹6,000 / yr", category: "Agriculture" },
  { name: "AB PM-JAY", detail: "₹5,00,000 / yr", category: "Health" },
  { name: "PM Shram Yogi Maandhan", detail: "₹36,000 / yr pension", category: "Labour" },
  { name: "NSP Post Matric", detail: "₹18,000 / yr", category: "Education" },
];

const STATE_SCHEMES: Record<string, StateScheme[]> = {
  "Maharashtra": [
    { name: "Mahatma Jyotiba Phule Jan Arogya Yojana", detail: "₹1,50,000 / yr cover", category: "Health" },
    { name: "Mukhyamantri Majhi Ladki Bahin Yojana", detail: "₹1,500 / month", category: "Women" },
    { name: "Shabari Adivasi Gharkul Yojana", detail: "Housing grant", category: "Housing" },
    { name: "Annasaheb Patil Loan Scheme", detail: "Interest waiver", category: "Livelihood" },
  ],
  "Madhya Pradesh": [
    { name: "Ladli Behna Yojana", detail: "₹1,250 / month", category: "Women" },
    { name: "Mukhyamantri Kisan Kalyan Yojana", detail: "₹6,000 / yr", category: "Agriculture" },
    { name: "Sambal Yojana", detail: "Worker welfare", category: "Labour" },
    { name: "Ladli Laxmi Yojana", detail: "₹1,43,000 maturity", category: "Education" },
  ],
  "Uttar Pradesh": [
    { name: "Kanya Sumangala Yojana", detail: "₹25,000 staged", category: "Education" },
    { name: "Bhagya Laxmi Yojana", detail: "₹50,000 bond", category: "Women" },
    { name: "Mukhyamantri Yuva Swarozgar", detail: "Margin money", category: "Livelihood" },
    { name: "UP Kisan Karj Rahat", detail: "Loan relief", category: "Agriculture" },
  ],
  "Bihar": [
    { name: "Mukhyamantri Kanya Utthan Yojana", detail: "₹50,000", category: "Education" },
    { name: "Bihar Student Credit Card", detail: "₹4,00,000 loan", category: "Education" },
    { name: "Mukhyamantri Griha Sthal Kray", detail: "₹60,000", category: "Housing" },
  ],
  "Tamil Nadu": [
    { name: "Kalaignar Magalir Urimai Thogai", detail: "₹1,000 / month", category: "Women" },
    { name: "CM Comprehensive Health Insurance", detail: "₹5,00,000 / yr", category: "Health" },
    { name: "Pudhumai Penn", detail: "₹1,000 / month", category: "Education" },
  ],
  "Karnataka": [
    { name: "Gruha Lakshmi", detail: "₹2,000 / month", category: "Women" },
    { name: "Gruha Jyothi", detail: "200 units free", category: "Utilities" },
    { name: "Yuva Nidhi", detail: "₹3,000 / month", category: "Employment" },
    { name: "Anna Bhagya", detail: "10 kg rice", category: "Food" },
  ],
  "West Bengal": [
    { name: "Lakshmir Bhandar", detail: "₹1,000 / month", category: "Women" },
    { name: "Swasthya Sathi", detail: "₹5,00,000 / yr", category: "Health" },
    { name: "Kanyashree Prakalpa", detail: "₹25,000", category: "Education" },
    { name: "Krishak Bandhu", detail: "₹10,000 / yr", category: "Agriculture" },
  ],
  "Rajasthan": [
    { name: "Chiranjeevi Swasthya Bima", detail: "₹25,00,000 cover", category: "Health" },
    { name: "Palanhar Yojana", detail: "₹1,500 / month", category: "Child Welfare" },
    { name: "Indira Gandhi Shahri Rozgar", detail: "125 days work", category: "Employment" },
  ],
  "Gujarat": [
    { name: "Mukhyamantri Amrutam MA", detail: "₹5,00,000 / yr", category: "Health" },
    { name: "Namo Lakshmi Yojana", detail: "₹50,000", category: "Education" },
    { name: "Kunwarbai Nu Mameru", detail: "₹12,000", category: "Women" },
  ],
  "Kerala": [
    { name: "Karunya Arogya Suraksha", detail: "₹5,00,000 / yr", category: "Health" },
    { name: "Vidyakiranam", detail: "Education support", category: "Education" },
    { name: "Snehapoorvam", detail: "₹1,000 / month", category: "Child Welfare" },
  ],
  "Andhra Pradesh": [
    { name: "YSR Cheyutha", detail: "₹18,750 / yr", category: "Women" },
    { name: "Dr. YSR Aarogyasri", detail: "₹25,00,000 cover", category: "Health" },
    { name: "Jagananna Vidya Deevena", detail: "Fee reimbursement", category: "Education" },
  ],
  "Telangana": [
    { name: "Rythu Bandhu", detail: "₹10,000 / acre / yr", category: "Agriculture" },
    { name: "Aarogya Lakshmi", detail: "Nutrition support", category: "Health" },
    { name: "Kalyana Lakshmi", detail: "₹1,00,116", category: "Women" },
  ],
  "Punjab": [
    { name: "Mukh Mantri Punjab Health Scheme", detail: "₹5,00,000 / yr", category: "Health" },
    { name: "Ashirwad Scheme", detail: "₹51,000", category: "Women" },
    { name: "Ghar Ghar Rozgar", detail: "Placement support", category: "Employment" },
  ],
  "Odisha": [
    { name: "Biju Swasthya Kalyan Yojana", detail: "₹5,00,000 / yr", category: "Health" },
    { name: "KALIA Yojana", detail: "₹10,000 / yr", category: "Agriculture" },
    { name: "Mamata Yojana", detail: "₹5,000", category: "Maternity" },
  ],
  "Haryana": [
    { name: "Chirayu Haryana", detail: "₹5,00,000 / yr", category: "Health" },
    { name: "Ladli Social Security", detail: "₹2,750 / month", category: "Women" },
    { name: "Mukhyamantri Parivar Samridhi", detail: "₹6,000 / yr", category: "Family" },
  ],
  "Delhi": [
    { name: "Delhi Arogya Kosh", detail: "Treatment aid", category: "Health" },
    { name: "Delhi Ladli Scheme", detail: "₹36,000", category: "Women" },
    { name: "Mukhyamantri Tirth Yatra", detail: "Free travel", category: "Senior Citizens" },
  ],
  "Assam": [
    { name: "Orunodoi 2.0", detail: "₹1,250 / month", category: "Women" },
    { name: "Atal Amrit Abhiyan", detail: "₹2,00,000 / yr", category: "Health" },
    { name: "Arundhati Gold", detail: "10 g gold grant", category: "Women" },
  ],
  "Jharkhand": [
    { name: "Mukhyamantri Maiya Samman", detail: "₹1,000 / month", category: "Women" },
    { name: "Sarvjan Pension Yojana", detail: "₹1,000 / month", category: "Pension" },
    { name: "Guruji Credit Card", detail: "₹15,00,000 loan", category: "Education" },
  ],
  "Chhattisgarh": [
    { name: "Mahtari Vandan Yojana", detail: "₹1,000 / month", category: "Women" },
    { name: "Rajiv Gandhi Kisan Nyay", detail: "Input subsidy", category: "Agriculture" },
    { name: "Dhanwantari Generic Medical", detail: "Discounted medicine", category: "Health" },
  ],
  "Uttarakhand": [
    { name: "Mukhyamantri Mahalaxmi Kit", detail: "Nutrition kit", category: "Maternity" },
    { name: "Atal Ayushman Uttarakhand", detail: "₹5,00,000 / yr", category: "Health" },
    { name: "Mukhyamantri Saur Swarozgar", detail: "Solar livelihood", category: "Livelihood" },
  ],
  "Himachal Pradesh": [
    { name: "HIMCARE", detail: "₹5,00,000 / yr", category: "Health" },
    { name: "Mukhya Mantri Sukh-Aashray", detail: "Orphan care", category: "Child Welfare" },
    { name: "Indira Gandhi Pyari Behna", detail: "₹1,500 / month", category: "Women" },
  ],
};

/** Short state tag for the card indicator, e.g. "MH", "UP". */
export function stateAbbr(state: string): string {
  const words = state.split(/[\s&]+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Illustrative schemes for a state, falling back to national programmes
 * for states and UTs without a specific list.
 */
export function getSchemesForState(state: string | null): StateScheme[] {
  if (!state) return [];
  return STATE_SCHEMES[state] ?? NATIONAL_SCHEMES;
}
