/**
 * Tinat Research Governance, Policy Registry & Review Classification
 * Compliant with Ethiopian Personal Data Protection Proclamation 1321/2024
 * and National Research Ethics Guidelines.
 */

export const CURRENT_POLICY_VERSIONS = {
  TERMS: "2026-11-03",
  PRIVACY: "2026-11-03",
  CHARTER: "2026-11-03",
  CODE_OF_CONDUCT: "2026-11-03",
  DPA: "2026-11-03",
} as const;

export interface TopicPolicy {
  id: string;
  category: "PROHIBITED" | "EXTRA_REVIEW";
  name: string;
  description: string;
  rationale: string;
}

export const PROHIBITED_TOPICS: TopicPolicy[] = [
  {
    id: "involves_minors",
    category: "PROHIBITED",
    name: "Studies Involving Minors (< 18)",
    description: "Research recruiting or directly collecting data from children under 18 years of age.",
    rationale: "Tinat currently lacks physical guardian identity verification and minor assent verification infrastructure required under Ethiopian child protection standards.",
  },
  {
    id: "clinical_intervention_trials",
    category: "PROHIBITED",
    name: "Clinical Drug & Invasive Device Trials",
    description: "Phase I-IV clinical drug trials, investigational vaccine administration, or invasive clinical procedures.",
    rationale: "Tinat is an observational and survey platform only. Clinical trials must be conducted under direct regulatory supervision by EFDA and accredited clinical sites.",
  },
  {
    id: "biometric_harvesting",
    category: "PROHIBITED",
    name: "Biometric & Facial Scraping",
    description: "Capturing facial recognition, iris scans, fingerprints, or raw voiceprints for identification.",
    rationale: "Prohibited under Proclamation 1321/2024 unless authorized by law with strict biometric cryptographic controls.",
  },
  {
    id: "coercive_financial",
    category: "PROHIBITED",
    name: "Coercive or Deceptive Financial Schemes",
    description: "Promises of cash payouts, loan applications, or lotteries masquerading as research.",
    rationale: "Violates Tinat no-cash credit policy and National Bank of Ethiopia financial consumer regulations.",
  },
];

export const EXTRA_REVIEW_TOPICS: TopicPolicy[] = [
  {
    id: "mental_health_distress",
    category: "EXTRA_REVIEW",
    name: "Severe Mental Health & Distress",
    description: "Surveys inquiring about suicide ideation, self-harm, or severe psychiatric crisis.",
    rationale: "Requires active safety protocol, immediate helpline resources (952 / 6055), and specialized Institutional Review Board (IRB) verification.",
  },
  {
    id: "stigmatized_conditions",
    category: "EXTRA_REVIEW",
    name: "Stigmatized Health Conditions",
    description: "HIV/AIDS, tuberculosis, reproductive health, or stigmatized chronic illnesses.",
    rationale: "Requires enhanced pseudonymization, respondent-code isolation, and strict de-identification before export.",
  },
  {
    id: "gender_based_violence",
    category: "EXTRA_REVIEW",
    name: "Gender-Based Violence & Abuse",
    description: "Interpersonal trauma, domestic abuse, or sexual harassment experiences.",
    rationale: "High participant vulnerability; safety protocol, helpline disclosure, and double-admin review required.",
  },
  {
    id: "vulnerable_populations",
    category: "EXTRA_REVIEW",
    name: "Displaced & Vulnerable Populations",
    description: "Internally displaced persons (IDPs), refugees, or historically marginalized groups.",
    rationale: "Risk of vulnerability exploitation; requires community consent assessment and 4-eyes administrative review.",
  },
];

export function checkResearcherAgreements(user: {
  codeOfConductAcceptedAt?: Date | string | null;
  dpaAcceptedAt?: Date | string | null;
}): { canCreateStudy: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!user.codeOfConductAcceptedAt) {
    missing.push("Code of Conduct");
  }
  if (!user.dpaAcceptedAt) {
    missing.push("Data Processing Agreement (DPA)");
  }
  return {
    canCreateStudy: missing.length === 0,
    missing,
  };
}
