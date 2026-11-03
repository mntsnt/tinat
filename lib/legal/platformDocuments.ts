import { createHash } from "crypto";

export const PLATFORM_DOCUMENT_VERSIONS = {
  TERMS: "2026-11-03",
  PRIVACY: "2026-11-03",
  SUMMARY: "2026-11-03",
} as const;

export interface DocumentSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export const TERMS_OF_USE_SECTIONS: DocumentSection[] = [
  {
    id: "terms-acceptance",
    title: "1. Acceptance of Terms",
    paragraphs: [
      "By creating an account, signing in, or accessing the Tinat research platform (\"Tinat\", \"we\", \"us\", or \"our\"), you agree to be bound by these Terms of Use. If you do not agree to all terms, you must not access or use the platform.",
      "Tinat provides academic, clinical, and public health research software infrastructure operated in compliance with the laws of Ethiopia.",
    ],
  },
  {
    id: "terms-purpose",
    title: "2. Platform Purpose & Scope",
    paragraphs: [
      "Tinat is an observational research, survey design, and scientific collaboration platform built for universities, researchers, medical students, clinicians, and NGOs. Tinat facilitates participant recruitment, questionnaire design, and data organization under researcher-directed protocols.",
      "Tinat is not a medical provider. The platform does not provide medical advice, clinical diagnosis, treatment recommendations, or emergency response services. Clinical drug trials and invasive medical device experiments are strictly prohibited on the platform.",
    ],
  },
  {
    id: "terms-eligibility",
    title: "3. User Eligibility & Roles",
    paragraphs: [
      "You must be at least 18 years old to create an account or participate in research on Tinat. Studies directly recruiting minors under 18 years of age are not supported.",
      "Users may register as Participants or Researchers. Account holders must provide accurate, current information. Impersonation of other individuals, institutions, or health authorities is grounds for immediate termination.",
    ],
  },
  {
    id: "terms-credits",
    title: "4. Tinat Credits (TC) & Non-Monetary Tokenomics",
    paragraphs: [
      "Tinat Credits (TC) are non-monetary platform tokens used exclusively to recognize and reward voluntary research participation and study funding. Tinat Credits have zero cash value, cannot be redeemed for fiat currency (including Telebirr, CBE, or bank transfers), cannot be transferred between users, and cannot be purchased with money.",
      "All credit transactions are recorded in an atomic double-entry ledger. Credits do not constitute a deposit, bank account, e-money, or financial instrument under National Bank of Ethiopia regulations.",
    ],
  },
  {
    id: "terms-conduct",
    title: "5. Prohibited Conduct",
    paragraphs: [
      "Users agree not to: (a) submit fraudulent, automated, or duplicate survey responses; (b) attempt to deanonymize, re-identify, or contact research participants outside authorized study protocols; (c) upload malware, malicious scripts, or unauthorized tracking software; (d) bypass or tamper with security checks, rate limits, or verification protocols; (e) harvest biometric facial data or voiceprints.",
    ],
  },
  {
    id: "terms-liability",
    title: "6. Limitation of Liability & Termination",
    paragraphs: [
      "To the maximum extent permitted by applicable law, Tinat and its operators shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use of the platform.",
      "Tinat reserves the right to suspend or terminate accounts that violate these Terms of Use or applicable Ethiopian research regulations.",
    ],
  },
];

export const PRIVACY_NOTICE_SECTIONS: DocumentSection[] = [
  {
    id: "privacy-overview",
    title: "1. Overview & Commitment to Health Data Privacy",
    paragraphs: [
      "Tinat respects the privacy and confidentiality of all research participants and researchers. We process personal and research data in strict compliance with the Ethiopian Personal Data Protection Proclamation No. 1321/2024 and international research ethics standards (Declaration of Helsinki, CIOMS).",
      "We adhere to the principles of lawful processing, purpose specification, data minimization, accuracy, storage limitation, and cryptographic security.",
    ],
  },
  {
    id: "privacy-collection",
    title: "2. Information We Collect",
    paragraphs: [
      "We collect: (a) Account Information (name, email address, hashed password, role); (b) Identity Verification Data (Fayda eSignet authentication creates a salted, one-way cryptographic hash of your subject identifier; raw National ID numbers and biometric photos are never stored); (c) Research Answers (submitted voluntarily through questionnaires); (d) Technical Logs (truncated IP hashes and device metadata for rate limiting and fraud prevention).",
    ],
  },
  {
    id: "privacy-isolation",
    title: "3. Separation of Identity from Research Answers (Pseudonymization)",
    paragraphs: [
      "Under Proclamation No. 1321/2024, research answers on Tinat are confidential and coded (pseudonymized), not anonymous. When you submit answers to a study, your submission is linked to a randomly generated, unguessable Respondent Code.",
      "Researchers and exported datasets only receive the coded Respondent Code. The mapping between your account identity and your research answers is held in an isolated ParticipantLink database table accessible only by automated reward distribution and audited security routines.",
    ],
  },
  {
    id: "privacy-sharing",
    title: "4. Data Sharing & De-Identified Exports",
    paragraphs: [
      "We never sell, rent, or monetize personal data. Research datasets exported by researchers undergo automated de-identification safeguards including age banding, geographical generalization, and small-cell suppression (counts below 5 are suppressed to prevent deductive re-identification).",
    ],
  },
  {
    id: "privacy-rights",
    title: "5. Your Rights as a Data Subject",
    paragraphs: [
      "Under Ethiopian data protection law, you have the right to: (a) request access to your personal data; (b) request rectification of inaccurate personal details; (c) withdraw from any study at any time without penalty or loss of earned credits; (d) request deletion of your account and personal identifiers through our Data Subject Request (DSR) portal.",
    ],
  },
  {
    id: "privacy-security",
    title: "6. Cryptographic Security & Retention",
    paragraphs: [
      "All network traffic is encrypted using TLS 1.3. Passwords and sensitive identifiers are hashed using industry-standard salted algorithms (bcrypt, SHA-256). Technical IP logs and rate-limiting hashes are automatically scrubbed on a regular retention schedule.",
    ],
  },
];

export const DATA_USE_SUMMARY_SECTIONS: DocumentSection[] = [
  {
    id: "summary-data-use",
    title: "How Your Data is Used on Tinat",
    paragraphs: [
      "Here is a short, plain-language summary of how Tinat handles your personal and research data:",
    ],
    bullets: [
      "Confidential & Coded: Your research answers are tied to a randomly generated Respondent Code, not your name, email, or phone number.",
      "Identity Isolation: Researchers receive only coded responses. Researchers do not see your personal identity, contact details, or National ID.",
      "Tinat Credits Have No Cash Value: Credits (TC) are non-monetary platform tokens. They cannot be exchanged for cash, Telebirr, or bank transfers.",
      "Voluntary & Controllable: Participating in research is voluntary. You can stop answering questions or withdraw at any time.",
    ],
  },
];

export function sectionToPlainText(section: DocumentSection): string {
  let text = `${section.title}\n`;
  for (const p of section.paragraphs) {
    text += `${p}\n\n`;
  }
  if (section.bullets && section.bullets.length > 0) {
    for (const b of section.bullets) {
      text += `• ${b}\n`;
    }
    text += "\n";
  }
  return text.trim();
}

export function getTermsOfUsePlainText(): string {
  return TERMS_OF_USE_SECTIONS.map(sectionToPlainText).join("\n\n");
}

export function getPrivacyNoticePlainText(): string {
  return PRIVACY_NOTICE_SECTIONS.map(sectionToPlainText).join("\n\n");
}

export function getDataUseSummaryPlainText(): string {
  return DATA_USE_SUMMARY_SECTIONS.map(sectionToPlainText).join("\n\n");
}

export function getCombinedDocumentText(): string {
  return [
    `=== TERMS OF USE (v${PLATFORM_DOCUMENT_VERSIONS.TERMS}) ===\n`,
    getTermsOfUsePlainText(),
    `\n\n=== PRIVACY NOTICE (v${PLATFORM_DOCUMENT_VERSIONS.PRIVACY}) ===\n`,
    getPrivacyNoticePlainText(),
    `\n\n=== HOW YOUR DATA IS USED ON TINAT (v${PLATFORM_DOCUMENT_VERSIONS.SUMMARY}) ===\n`,
    getDataUseSummaryPlainText(),
  ].join("\n");
}

export function computeDocumentHash(text: string): string {
  return createHash("sha256").update(text.trim(), "utf8").digest("hex");
}

export function getPlatformDocumentPayload() {
  const combinedText = getCombinedDocumentText();
  const documentHash = computeDocumentHash(combinedText);

  return {
    termsVersion: PLATFORM_DOCUMENT_VERSIONS.TERMS,
    privacyVersion: PLATFORM_DOCUMENT_VERSIONS.PRIVACY,
    summaryVersion: PLATFORM_DOCUMENT_VERSIONS.SUMMARY,
    documentHash,
    combinedText,
    terms: TERMS_OF_USE_SECTIONS,
    privacy: PRIVACY_NOTICE_SECTIONS,
    summary: DATA_USE_SUMMARY_SECTIONS,
  };
}
