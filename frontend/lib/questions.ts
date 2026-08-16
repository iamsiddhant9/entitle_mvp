// Questionnaire configuration for the assistant flow.
// Field names and values must match the backend profile vocabulary exactly
// (see docs/api-contract.md, "Profile fields" table).

import type {
  Gender,
  MaritalStatus,
  Occupation,
  ResidenceArea,
} from "./api";

export interface ProfileAnswers {
  age: number | null;
  gender: Gender | null;
  state: string | null;
  residence_area: ResidenceArea | null;
  occupation: Occupation | null;
  income: number | null;
  marital_status: MaritalStatus | null;
  land_owned: boolean | null;
  house_owned: boolean | null;
  bank_account: boolean | null;
  income_tax_payer: boolean | null;
  disability: boolean | null;
  has_daughter_under_10: boolean | null;
  aadhaar_linked: boolean | null;
}

export type ProfileField = keyof ProfileAnswers;
export type AnswerValue = string | number | boolean | null;

export const EMPTY_ANSWERS: ProfileAnswers = {
  age: null,
  gender: null,
  state: null,
  residence_area: null,
  occupation: null,
  income: null,
  marital_status: null,
  land_owned: null,
  house_owned: null,
  bank_account: null,
  income_tax_payer: null,
  disability: null,
  has_daughter_under_10: null,
  aadhaar_linked: null,
};

export type QuestionType = "number" | "chips" | "select" | "boolean";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuickPick {
  label: string;
  value: number;
}

export interface Question {
  field: ProfileField;
  type: QuestionType;
  title: string;
  subtitle?: string;
  options?: QuestionOption[];
  quickPicks?: QuickPick[];
  min?: number;
  max?: number;
  unit?: string;
  placeholder?: string;
}

export interface QuestionStep {
  title: string;
  questions: Question[];
}

/** All 28 states + 8 union territories, full names as the rule engine expects. */
export const INDIAN_STATES: string[] = [
  // States
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  // Union territories
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
];

const OCCUPATION_OPTIONS: QuestionOption[] = [
  { value: "farmer", label: "Farmer" },
  { value: "student", label: "Student" },
  { value: "artisan", label: "Artisan / Craftsperson" },
  { value: "self_employed", label: "Self-employed" },
  { value: "small_business", label: "Small business owner" },
  { value: "salaried", label: "Salaried employee" },
  { value: "unorganized_worker", label: "Unorganised worker" },
  { value: "daily_wage", label: "Daily-wage worker" },
  { value: "unemployed", label: "Unemployed" },
  { value: "other", label: "Other" },
];

export const STEPS: QuestionStep[] = [
  {
    title: "About you",
    questions: [
      {
        field: "age",
        type: "number",
        title: "How old are you?",
        subtitle: "Your age in completed years.",
        min: 0,
        max: 120,
        unit: "years",
        placeholder: "e.g. 32",
      },
      {
        field: "gender",
        type: "chips",
        title: "What is your gender?",
        options: [
          { value: "female", label: "Female" },
          { value: "male", label: "Male" },
          { value: "other", label: "Other" },
        ],
      },
      {
        field: "state",
        type: "select",
        title: "Which state or union territory do you live in?",
        subtitle: "Some schemes — like Ladli Behna — are specific to a state.",
        options: INDIAN_STATES.map((s) => ({ value: s, label: s })),
      },
      {
        field: "residence_area",
        type: "chips",
        title: "Where do you live?",
        options: [
          { value: "rural", label: "Village / Rural area" },
          { value: "urban", label: "Town / City" },
        ],
      },
    ],
  },
  {
    title: "Work & income",
    questions: [
      {
        field: "occupation",
        type: "chips",
        title: "What best describes your work?",
        options: OCCUPATION_OPTIONS,
      },
      {
        field: "income",
        type: "number",
        title: "What is your family’s annual income?",
        subtitle: "Total yearly income of your household, in rupees.",
        min: 0,
        max: 100000000,
        unit: "₹",
        placeholder: "e.g. 150000",
        quickPicks: [
          { label: "Under ₹1 lakh", value: 90000 },
          { label: "₹1–2.5 lakh", value: 200000 },
          { label: "₹2.5–5 lakh", value: 400000 },
          { label: "Over ₹5 lakh", value: 600000 },
        ],
      },
      {
        field: "income_tax_payer",
        type: "boolean",
        title: "Do you or your family pay income tax?",
      },
    ],
  },
  {
    title: "Household",
    questions: [
      {
        field: "marital_status",
        type: "chips",
        title: "What is your marital status?",
        options: [
          { value: "single", label: "Single" },
          { value: "married", label: "Married" },
          { value: "widowed", label: "Widowed" },
          { value: "divorced", label: "Divorced" },
        ],
      },
      {
        field: "land_owned",
        type: "boolean",
        title: "Do you or your family own cultivable land?",
      },
      {
        field: "house_owned",
        type: "boolean",
        title: "Does your family own a pucca house?",
        subtitle: "A pucca house has solid brick or concrete walls and roof.",
      },
      {
        field: "has_daughter_under_10",
        type: "boolean",
        title: "Do you have a daughter below 10 years?",
      },
    ],
  },
  {
    title: "Access",
    questions: [
      {
        field: "bank_account",
        type: "boolean",
        title: "Do you have a bank account?",
        subtitle: "Any bank or post-office account, including Jan Dhan.",
      },
      {
        field: "aadhaar_linked",
        type: "boolean",
        title: "Is your Aadhaar linked to your mobile number?",
      },
      {
        field: "disability",
        type: "boolean",
        title: "Are you a person with a disability?",
      },
    ],
  },
];

export interface FlatQuestion extends Question {
  stepIndex: number;
  stepTitle: string;
}

export const ALL_QUESTIONS: FlatQuestion[] = STEPS.flatMap((step, stepIndex) =>
  step.questions.map((q) => ({ ...q, stepIndex, stepTitle: step.title }))
);
