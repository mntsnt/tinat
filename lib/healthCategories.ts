export const HEALTH_CATEGORIES = [
  "Public Health",
  "Clinical Research",
  "Epidemiology & Biostatistics",
  "Mental & Behavioral Health",
  "Nutrition & Dietetics",
  "Maternal & Child Health",
  "Infectious Diseases",
  "Non-Communicable Diseases",
  "Medical Education & Training",
  "Healthcare Systems & Policy",
  "Community Health & NGOs",
  "Health Technology & Digital Health",
  "Biomedical Research",
  "Other Health Research",
] as const;

export type HealthCategory = (typeof HEALTH_CATEGORIES)[number];

export const STUDY_TYPES = {
  FUNDED: {
    id: "FUNDED",
    name: "Funded Research",
    shortName: "Funded",
    badge: "Participant Reward Enabled",
    description:
      "Formal academic, clinical, or grant-backed research where participants earn Tinat Credits (TC) as compensation for their time and data.",
    icon: "Coins",
  },
  FREE_DATA_COLLECTION: {
    id: "FREE_DATA_COLLECTION",
    name: "Free Data Collection",
    shortName: "Open / Volunteer",
    badge: "No Funding Required • Free to Publish",
    description:
      "Open health questionnaires, medical student projects, NGO community assessments, pilot questionnaires, and general health feedback without participant rewards.",
    icon: "ClipboardCheck",
  },
} as const;

export const MEDICAL_DISCLAIMER =
  "Tinat is a specialized platform for medical and health-related research and community data collection. Tinat does not provide medical diagnosis, clinical consultation, or medical advice.";
