import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatPlatformIntelligencePrompt,
  generateLocalPlatformAnswer,
  type PlatformIntelligence,
} from "../lib/ai/admin-platform-intelligence";

const mockStats: PlatformIntelligence = {
  timestamp: "2026-11-19T07:00:00.000Z",
  users: {
    total: 150,
    participants: 120,
    researchers: 25,
    collectors: 4,
    admins: 1,
    emailVerified: 130,
    faydaVerified: 45,
    signupsToday: 5,
    signupsThisWeek: 28,
    signupsThisMonth: 90,
    recentUsers: [
      {
        name: "Dr. Abebe Bekele",
        role: "RESEARCHER",
        institution: "Addis Ababa University",
        isVerified: true,
        createdAt: "2026-11-19T06:00:00.000Z",
      },
    ],
  },
  studies: {
    total: 20,
    active: 12,
    draft: 5,
    completed: 2,
    paused: 1,
    fieldStudies: 3,
    totalResponses: 1450,
    responsesToday: 42,
    responsesThisWeek: 310,
    topStudies: [
      {
        id: "study-1",
        title: "Child Nutrition in Oromia",
        category: "Nutrition & Dietetics",
        status: "ACTIVE",
        researcherName: "Dr. Abebe Bekele",
        responsesCount: 420,
        questionsCount: 15,
        isFieldStudy: true,
      },
    ],
    recentStudies: [
      {
        id: "study-2",
        title: "Malaria Vector Surveillance",
        category: "Infectious Diseases",
        status: "ACTIVE",
        createdAt: "2026-11-18T10:00:00.000Z",
      },
    ],
  },
  forms: {
    total: 8,
    active: 6,
    totalResponses: 230,
    topForms: [
      {
        id: "form-1",
        title: "Faculty Workshop Registration",
        responsesCount: 120,
        questionsCount: 5,
        status: "ACTIVE",
      },
    ],
  },
  verifications: {
    pending: 2,
    verified: 23,
    rejected: 1,
    pendingList: [
      {
        id: "ver-1",
        userName: "Dr. Aster Tadesse",
        role: "RESEARCHER",
        institution: "Jimma University",
        verificationType: "ACADEMIC_ID",
        submittedAt: "2026-11-19T05:30:00.000Z",
      },
    ],
  },
  governance: {
    openModerationReports: 1,
    pendingEthicsApprovals: 0,
  },
  financials: {
    totalTcSpent: 4500,
    totalEtbPaid: 12500,
    totalPayoutRecords: 8,
  },
  recentActivity: [
    {
      id: "act-1",
      action: "STUDY_PUBLISHED",
      resourceType: "Study",
      userName: "Dr. Abebe Bekele",
      createdAt: "2026-11-19T06:15:00.000Z",
      description: "Published Child Nutrition in Oromia",
    },
  ],
};

test("Admin AI: formatPlatformIntelligencePrompt generates complete operational context", () => {
  const prompt = formatPlatformIntelligencePrompt(mockStats);

  assert.ok(prompt.includes("CURRENT LIVE TINAT PLATFORM INTELLIGENCE"));
  assert.ok(prompt.includes("Total Registered Users: 150"));
  assert.ok(prompt.includes("Total Studies Created: 20"));
  assert.ok(prompt.includes("Total Standalone Forms: 8"));
  assert.ok(prompt.includes("Pending Admin Review: 2"));
  assert.ok(prompt.includes("Total Field Collector ETB Compensations Paid: 12500 ETB"));
});

test("Admin AI: generateLocalPlatformAnswer handles overview query", () => {
  const answer = generateLocalPlatformAnswer("what's going on on the platform today?", mockStats);

  assert.ok(answer.includes("Tinat Platform Health & Operational Overview"));
  assert.ok(answer.includes("150 total members"));
  assert.ok(answer.includes("12 active studies"));
  assert.ok(answer.includes("8 Tinat Forms"));
  assert.ok(answer.includes("2 pending researcher verifications"));
});

test("Admin AI: generateLocalPlatformAnswer handles forms query", () => {
  const answer = generateLocalPlatformAnswer("Tell me about standalone forms", mockStats);

  assert.ok(answer.includes("Standalone Tinat Forms Overview"));
  assert.ok(answer.includes("Total Forms Created:** **8**"));
  assert.ok(answer.includes("Active Forms:** **6**"));
  assert.ok(answer.includes("Faculty Workshop Registration"));
});

test("Admin AI: generateLocalPlatformAnswer handles verifications & alerts query", () => {
  const answer = generateLocalPlatformAnswer("Are there any pending verifications?", mockStats);

  assert.ok(answer.includes("Platform Action Items & Governance"));
  assert.ok(answer.includes("Pending Researcher Verifications:** **2**"));
  assert.ok(answer.includes("Dr. Aster Tadesse"));
  assert.ok(answer.includes("Jimma University"));
});

test("Admin AI: generateLocalPlatformAnswer handles rewards & financials query", () => {
  const answer = generateLocalPlatformAnswer("What are the rewards and payouts in Birr?", mockStats);

  assert.ok(answer.includes("Rewards & Financial Balances"));
  assert.ok(answer.includes("4,500 TC"));
  assert.ok(answer.includes("12,500 ETB"));
});
