import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export interface PlatformIntelligence {
  timestamp: string;
  users: {
    total: number;
    participants: number;
    researchers: number;
    collectors: number;
    admins: number;
    emailVerified: number;
    faydaVerified: number;
    signupsToday: number;
    signupsThisWeek: number;
    signupsThisMonth: number;
    recentUsers: Array<{
      name: string;
      role: string;
      institution: string | null;
      isVerified: boolean;
      createdAt: string;
    }>;
  };
  studies: {
    total: number;
    active: number;
    draft: number;
    completed: number;
    paused: number;
    fieldStudies: number;
    totalResponses: number;
    responsesToday: number;
    responsesThisWeek: number;
    topStudies: Array<{
      id: string;
      title: string;
      category: string | null;
      status: string;
      researcherName: string;
      responsesCount: number;
      questionsCount: number;
      isFieldStudy: boolean;
    }>;
    recentStudies: Array<{
      id: string;
      title: string;
      category: string | null;
      status: string;
      createdAt: string;
    }>;
  };
  forms: {
    total: number;
    active: number;
    totalResponses: number;
    topForms: Array<{
      id: string;
      title: string;
      responsesCount: number;
      questionsCount: number;
      status: string;
    }>;
  };
  verifications: {
    pending: number;
    verified: number;
    rejected: number;
    pendingList: Array<{
      id: string;
      userName: string;
      role: string;
      institution: string | null;
      verificationType: string;
      submittedAt: string;
    }>;
  };
  governance: {
    openModerationReports: number;
    pendingEthicsApprovals: number;
  };
  financials: {
    totalTcSpent: number;
    totalEtbPaid: number;
    totalPayoutRecords: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    resourceType: string | null;
    userName: string | null;
    createdAt: string;
    description: string | null;
  }>;
}

async function safeQuery<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error("Platform intelligence query error (using fallback):", error);
    return fallback;
  }
}

type TopStudyRaw = Prisma.StudyGetPayload<{
  include: {
    researcher: { select: { name: true } };
    _count: { select: { responses: true; questions: true } };
  };
}>;

type PendingVerificationRaw = Prisma.VerificationGetPayload<{
  include: {
    user: { select: { name: true; role: true; institution: true } };
  };
}>;

type ActivityLogRaw = Prisma.ActivityLogGetPayload<{
  include: {
    user: { select: { name: true } };
  };
}>;

export async function getPlatformIntelligenceSummary(): Promise<PlatformIntelligence> {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const sevenDaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(startOfToday.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    participants,
    researchers,
    collectors,
    admins,
    emailVerified,
    faydaVerified,
    signupsToday,
    signupsThisWeek,
    signupsThisMonth,
    recentUsersRaw,
    totalStudies,
    activeStudies,
    draftStudies,
    completedStudies,
    pausedStudies,
    fieldStudies,
    totalResponses,
    responsesToday,
    responsesThisWeek,
    topStudiesRaw,
    recentStudiesRaw,
    formsRaw,
    pendingVerifications,
    verifiedVerifications,
    rejectedVerifications,
    pendingVerificationsRaw,
    openModerationReports,
    pendingEthicsApprovals,
    tcAggregate,
    collectorPayoutsAggregate,
    totalPayoutRecords,
    recentActivityRaw,
  ] = await Promise.all([
    // User metrics
    safeQuery(prisma.user.count(), 0),
    safeQuery(prisma.user.count({ where: { role: "PARTICIPANT" } }), 0),
    safeQuery(prisma.user.count({ where: { role: "RESEARCHER" } }), 0),
    safeQuery(prisma.user.count({ where: { role: "DATA_COLLECTOR" } }), 0),
    safeQuery(prisma.user.count({ where: { role: "ADMIN" } }), 0),
    safeQuery(prisma.user.count({ where: { isVerified: true } }), 0),
    safeQuery(prisma.user.count({ where: { faydaVerified: true } }), 0),
    safeQuery(prisma.user.count({ where: { createdAt: { gte: startOfToday } } }), 0),
    safeQuery(prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }), 0),
    safeQuery(prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }), 0),
    safeQuery(
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          name: true,
          role: true,
          institution: true,
          isVerified: true,
          createdAt: true,
        },
      }),
      []
    ),

    // Study metrics
    safeQuery(prisma.study.count(), 0),
    safeQuery(prisma.study.count({ where: { status: "ACTIVE" } }), 0),
    safeQuery(prisma.study.count({ where: { status: "DRAFT" } }), 0),
    safeQuery(prisma.study.count({ where: { status: "COMPLETED" } }), 0),
    safeQuery(prisma.study.count({ where: { status: "PAUSED" } }), 0),
    safeQuery(prisma.study.count({ where: { collectorsNeeded: { gt: 0 } } }), 0),
    safeQuery(prisma.response.count(), 0),
    safeQuery(prisma.response.count({ where: { submittedAt: { gte: startOfToday } } }), 0),
    safeQuery(prisma.response.count({ where: { submittedAt: { gte: sevenDaysAgo } } }), 0),
    safeQuery<TopStudyRaw[]>(
      prisma.study.findMany({
        where: { status: "ACTIVE" },
        orderBy: { responses: { _count: "desc" } },
        take: 6,
        include: {
          researcher: { select: { name: true } },
          _count: { select: { responses: true, questions: true } },
        },
      }),
      []
    ),
    safeQuery(
      prisma.study.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          createdAt: true,
        },
      }),
      []
    ),

    // Forms metrics (studies categorized as "Tinat Form" or tagged)
    safeQuery(
      prisma.study.findMany({
        where: {
          OR: [{ category: "Tinat Form" }, { tags: { has: "Tinat Form" } }],
        },
        select: {
          id: true,
          title: true,
          status: true,
          _count: { select: { responses: true, questions: true } },
        },
        orderBy: { responses: { _count: "desc" } },
      }),
      []
    ),

    // Verifications
    safeQuery(prisma.verification.count({ where: { status: "PENDING" } }), 0),
    safeQuery(prisma.verification.count({ where: { status: "VERIFIED" } }), 0),
    safeQuery(prisma.verification.count({ where: { status: "REJECTED" } }), 0),
    safeQuery<PendingVerificationRaw[]>(
      prisma.verification.findMany({
        where: { status: "PENDING" },
        orderBy: { submittedAt: "desc" },
        take: 5,
        include: {
          user: { select: { name: true, role: true, institution: true } },
        },
      }),
      []
    ),

    // Governance & Moderation
    safeQuery(
      prisma.moderationReport.count({
        where: { status: { in: ["OPEN", "INVESTIGATING"] } },
      }),
      0
    ),
    safeQuery(
      prisma.ethicsApproval.count({
        where: { status: "PENDING" },
      }),
      0
    ),

    // Financials
    safeQuery(prisma.study.aggregate({ _sum: { creditsSpent: true } }), { _sum: { creditsSpent: 0 } }),
    safeQuery(
      prisma.collectorPayout.aggregate({
        _sum: { amountCents: true },
      }),
      { _sum: { amountCents: 0 } }
    ),
    safeQuery(prisma.collectorPayout.count(), 0),

    // Recent activity
    safeQuery<ActivityLogRaw[]>(
      prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          user: { select: { name: true } },
        },
      }),
      []
    ),
  ]);

  const activeForms = formsRaw.filter((f) => f.status === "ACTIVE").length;
  const totalFormResponses = formsRaw.reduce((sum, f) => sum + f._count.responses, 0);
  const totalEtbPaid = Math.round((collectorPayoutsAggregate._sum?.amountCents || 0) / 100);

  return {
    timestamp: now.toISOString(),
    users: {
      total: totalUsers,
      participants,
      researchers,
      collectors,
      admins,
      emailVerified,
      faydaVerified,
      signupsToday,
      signupsThisWeek,
      signupsThisMonth,
      recentUsers: recentUsersRaw.map((u) => ({
        name: u.name,
        role: u.role,
        institution: u.institution,
        isVerified: u.isVerified,
        createdAt: u.createdAt.toISOString(),
      })),
    },
    studies: {
      total: totalStudies,
      active: activeStudies,
      draft: draftStudies,
      completed: completedStudies,
      paused: pausedStudies,
      fieldStudies,
      totalResponses,
      responsesToday,
      responsesThisWeek,
      topStudies: topStudiesRaw.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        status: s.status,
        researcherName: s.researcher.name,
        responsesCount: s._count.responses,
        questionsCount: s._count.questions,
        isFieldStudy: s.collectorsNeeded > 0 || s.collectorPayRateCents > 0,
      })),
      recentStudies: recentStudiesRaw.map((s) => ({
        id: s.id,
        title: s.title,
        category: s.category,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      })),
    },
    forms: {
      total: formsRaw.length,
      active: activeForms,
      totalResponses: totalFormResponses,
      topForms: formsRaw.slice(0, 5).map((f) => ({
        id: f.id,
        title: f.title,
        responsesCount: f._count.responses,
        questionsCount: f._count.questions,
        status: f.status,
      })),
    },
    verifications: {
      pending: pendingVerifications,
      verified: verifiedVerifications,
      rejected: rejectedVerifications,
      pendingList: pendingVerificationsRaw.map((v) => ({
        id: v.id,
        userName: v.user.name,
        role: v.user.role,
        institution: v.user.institution,
        verificationType: v.verificationType,
        submittedAt: v.submittedAt.toISOString(),
      })),
    },
    governance: {
      openModerationReports,
      pendingEthicsApprovals,
    },
    financials: {
      totalTcSpent: tcAggregate._sum.creditsSpent || 0,
      totalEtbPaid,
      totalPayoutRecords,
    },
    recentActivity: recentActivityRaw.map((a) => ({
      id: a.id,
      action: a.action,
      resourceType: a.resourceType,
      userName: a.user?.name || "System",
      createdAt: a.createdAt.toISOString(),
      description: a.description,
    })),
  };
}

export function formatPlatformIntelligencePrompt(stats: PlatformIntelligence): string {
  return `You are the Tinat Platform Intelligence Copilot, an expert administrative assistant designed specifically for Tinat system administrators.

You have real-time, live operational visibility across the entire Tinat research ecosystem in Ethiopia.
Your mission is to provide clear, direct, and factual answers in clean, plain English with exact metrics.

=======================================================
CURRENT LIVE TINAT PLATFORM INTELLIGENCE:
Timestamp: ${stats.timestamp}

1. USERS:
- Total Registered Users: ${stats.users.total}
- Role Breakdown:
  * Researchers: ${stats.users.researchers}
  * Participants: ${stats.users.participants}
  * Field Enumerators (Collectors): ${stats.users.collectors}
  * Administrators: ${stats.users.admins}
- Identity & Verification:
  * Email Verified: ${stats.users.emailVerified} (${stats.users.total > 0 ? Math.round((stats.users.emailVerified / stats.users.total) * 100) : 0}%)
  * Fayda National ID Verified: ${stats.users.faydaVerified}
- User Growth:
  * Signed up Today: ${stats.users.signupsToday}
  * Signed up this Week (past 7 days): ${stats.users.signupsThisWeek}
  * Signed up this Month (past 30 days): ${stats.users.signupsThisMonth}
- Recent Registrations:
${stats.users.recentUsers.map((u) => `  * ${u.name} (${u.role}${u.institution ? `, ${u.institution}` : ""}) - Joined ${u.createdAt.slice(0, 10)} [${u.isVerified ? "Verified" : "Unverified"}]`).join("\n") || "  * No recent registrations"}

2. HEALTH STUDIES:
- Total Studies Created: ${stats.studies.total}
- Status Breakdown:
  * Active (currently collecting responses): ${stats.studies.active}
  * Drafts: ${stats.studies.draft}
  * Completed: ${stats.studies.completed}
  * Paused: ${stats.studies.paused}
- Study Modalities:
  * Field Collection Studies (In-person with enumerators): ${stats.studies.fieldStudies}
- Responses Collected:
  * All-Time Responses: ${stats.studies.totalResponses}
  * Submitted Today: ${stats.studies.responsesToday}
  * Submitted this Week: ${stats.studies.responsesThisWeek}
- Top Active Studies by Response Count:
${stats.studies.topStudies.map((s, idx) => `  ${idx + 1}. "${s.title}" (${s.category || "General"}) by ${s.researcherName} - ${s.responsesCount} responses, ${s.questionsCount} questions [${s.isFieldStudy ? "Field Study" : "Digital"}]`).join("\n") || "  * No active studies"}

3. TINAT FORMS (STANDALONE FORMS):
- Total Standalone Forms: ${stats.forms.total} (Active: ${stats.forms.active})
- Total Form Responses Collected: ${stats.forms.totalResponses}
- Top Forms:
${stats.forms.topForms.map((f, idx) => `  ${idx + 1}. "${f.title}" (${f.status}) - ${f.responsesCount} responses, ${f.questionsCount} questions`).join("\n") || "  * No standalone forms created yet"}

4. VERIFICATIONS & GOVERNANCE:
- Academic/Researcher Verifications:
  * Pending Admin Review: ${stats.verifications.pending}
  * Verified: ${stats.verifications.verified}
  * Rejected: ${stats.verifications.rejected}
- Pending Verification Queue:
${stats.verifications.pendingList.map((v) => `  * ${v.userName} (${v.role}${v.institution ? `, ${v.institution}` : ""}) - Type: ${v.verificationType} [Submitted: ${v.submittedAt.slice(0, 10)}]`).join("\n") || "  * All verifications up to date (Queue empty)"}
- Moderation & Ethics:
  * Open Moderation Reports: ${stats.governance.openModerationReports}
  * Pending Ethics Board Approvals: ${stats.governance.pendingEthicsApprovals}

5. FINANCIALS & INCENTIVES:
- Total Tinat Credits (TC) Spent on Studies: ${stats.financials.totalTcSpent} TC
- Total Field Collector ETB Compensations Paid: ${stats.financials.totalEtbPaid} ETB
- Recorded Enumerator Payout Count: ${stats.financials.totalPayoutRecords}

6. RECENT PLATFORM ACTIVITY LOGS:
${stats.recentActivity.map((a) => `  * [${a.createdAt.slice(0, 16).replace("T", " ")}] ${a.action}${a.resourceType ? ` on ${a.resourceType}` : ""} by ${a.userName}${a.description ? ` (${a.description})` : ""}`).join("\n") || "  * No recent logs"}
=======================================================

GUIDELINES FOR YOUR RESPONSE:
1. Always ground your answer strictly in the numbers above. Never fabricate statistics.
2. Format answers with clean Markdown, bullet points, and tables when comparing multiple items.
3. Be direct, professional, and concise. Avoid robotic fluff or buzzwords.
4. If an admin asks for an action (e.g. "approve this verification"), remind them that they can perform the action in the corresponding Admin Console tab (e.g. /admin/verifications, /admin/studies, /admin/users).
5. If something requires attention (like pending verifications or open moderation reports), highlight it clearly.`;
}

export function generateLocalPlatformAnswer(query: string, stats: PlatformIntelligence): string {
  const q = query.toLowerCase();

  // 1. General Overview ("What's going on", "overview", "summary", "pulse")
  const isOverview =
    q.includes("what's going on") ||
    q.includes("whats going on") ||
    q.includes("overview") ||
    q.includes("summary") ||
    q.includes("pulse") ||
    q.includes("everything") ||
    q.includes("how is the platform") ||
    q.includes("platform status");

  if (isOverview) {
    let response = `### Tinat Platform Health & Operational Overview\n\n`;
    response += `Here is what is happening across Tinat right now:\n\n`;

    response += `#### 1. Members & Growth\n`;
    response += `* **${stats.users.total} total members** across the platform (${stats.users.researchers} researchers, ${stats.users.participants} participants, ${stats.users.collectors} field enumerators).\n`;
    response += `* **${stats.users.signupsThisWeek} new signups** in the past 7 days (${stats.users.signupsToday} today).\n`;
    response += `* **${stats.users.emailVerified} verified accounts** (${stats.users.faydaVerified} with Fayda National ID).\n\n`;

    response += `#### 2. Studies & Responses\n`;
    response += `* **${stats.studies.active} active studies** currently accepting responses (out of ${stats.studies.total} total studies).\n`;
    response += `* **${stats.studies.totalResponses.toLocaleString()} total responses** recorded across all investigations (${stats.studies.responsesThisWeek.toLocaleString()} this week).\n`;
    if (stats.studies.topStudies[0]) {
      response += `* Leading active study: **"${stats.studies.topStudies[0].title}"** with ${stats.studies.topStudies[0].responsesCount} responses.\n`;
    }
    response += `\n`;

    response += `#### 3. Standalone Forms\n`;
    response += `* **${stats.forms.total} Tinat Forms** created (${stats.forms.active} active), with **${stats.forms.totalResponses}** total responses collected.\n\n`;

    response += `#### 4. Governance & Action Items\n`;
    if (stats.verifications.pending > 0 || stats.governance.openModerationReports > 0) {
      response += `⚠️ **Attention needed:**\n`;
      if (stats.verifications.pending > 0) response += `* **${stats.verifications.pending} pending researcher verifications** awaiting review.\n`;
      if (stats.governance.openModerationReports > 0) response += `* **${stats.governance.openModerationReports} open moderation reports** to investigate.\n`;
    } else {
      response += `* ✅ No pending verifications or moderation alerts right now.\n`;
    }

    return response;
  }

  // 2. Verifications / Alerts / Pending
  if (q.includes("verification") || q.includes("pending") || q.includes("alert") || q.includes("action") || q.includes("moderation")) {
    const pendingCount = stats.verifications.pending;
    const reportsCount = stats.governance.openModerationReports;
    const ethicsCount = stats.governance.pendingEthicsApprovals;

    let response = `### Platform Action Items & Governance\n\n`;
    response += `* **Pending Researcher Verifications:** **${pendingCount}**\n`;
    response += `* **Open Moderation Reports:** **${reportsCount}**\n`;
    response += `* **Pending Ethics Approvals:** **${ethicsCount}**\n\n`;

    if (stats.verifications.pendingList.length > 0) {
      response += `#### Pending Verification Queue:\n`;
      stats.verifications.pendingList.forEach((v, idx) => {
        response += `${idx + 1}. **${v.userName}** (${v.role}${v.institution ? ` at ${v.institution}` : ""}) — Type: \`${v.verificationType}\` (Submitted: ${v.submittedAt.slice(0, 10)})\n`;
      });
      response += `\n*You can review and approve these under **Admin &rarr; Verifications**.*`;
    } else {
      response += `All academic verifications are currently up to date!`;
    }
    return response;
  }

  // 3. Standalone Forms
  if (/\bforms?\b/i.test(q) || q.includes("tinat form")) {
    let response = `### Standalone Tinat Forms Overview\n\n`;
    response += `* **Total Forms Created:** **${stats.forms.total}**\n`;
    response += `* **Active Forms:** **${stats.forms.active}**\n`;
    response += `* **Total Responses Collected on Forms:** **${stats.forms.totalResponses}**\n\n`;

    if (stats.forms.topForms.length > 0) {
      response += `#### Most Active Forms:\n`;
      stats.forms.topForms.forEach((f, idx) => {
        response += `${idx + 1}. **${f.title}** — ${f.responsesCount} responses (${f.questionsCount} questions, status: ${f.status})\n`;
      });
    } else {
      response += `No standalone forms have been created yet.`;
    }
    return response;
  }

  // 3. Studies / Responses / Research
  if (q.includes("study") || q.includes("studies") || q.includes("response") || q.includes("research")) {
    let response = `### Health Studies & Research Data Overview\n\n`;
    response += `* **Total Studies:** **${stats.studies.total}**\n`;
    response += `  - Active (Collecting Data): **${stats.studies.active}**\n`;
    response += `  - Drafts: **${stats.studies.draft}**\n`;
    response += `  - Completed: **${stats.studies.completed}**\n`;
    response += `  - Paused: **${stats.studies.paused}**\n`;
    response += `  - In-Person Field Studies: **${stats.studies.fieldStudies}**\n\n`;

    response += `* **Response Volume:**\n`;
    response += `  - Total All-Time Responses: **${stats.studies.totalResponses.toLocaleString()}**\n`;
    response += `  - Submitted in Last 7 Days: **${stats.studies.responsesThisWeek.toLocaleString()}**\n`;
    response += `  - Submitted Today: **${stats.studies.responsesToday.toLocaleString()}**\n\n`;

    if (stats.studies.topStudies.length > 0) {
      response += `#### Top Studies by Response Volume:\n`;
      stats.studies.topStudies.forEach((s, idx) => {
        response += `${idx + 1}. **${s.title}** — **${s.responsesCount}** responses (${s.category || "General"}, by ${s.researcherName})\n`;
      });
    }
    return response;
  }

  // 4. Users / Members / Demographics
  if (q.includes("user") || q.includes("member") || q.includes("researcher") || q.includes("participant") || q.includes("collector") || q.includes("signup")) {
    let response = `### Platform User Demographics & Growth\n\n`;
    response += `* **Total Registered Members:** **${stats.users.total}**\n`;
    response += `  - Participants: **${stats.users.participants}**\n`;
    response += `  - Researchers: **${stats.users.researchers}**\n`;
    response += `  - Field Enumerators: **${stats.users.collectors}**\n`;
    response += `  - Admins: **${stats.users.admins}**\n\n`;

    response += `* **Verification Status:**\n`;
    response += `  - Email Verified: **${stats.users.emailVerified}** (${stats.users.total > 0 ? Math.round((stats.users.emailVerified / stats.users.total) * 100) : 0}%)\n`;
    response += `  - Fayda National ID Verified: **${stats.users.faydaVerified}**\n\n`;

    response += `* **Recent Signups:**\n`;
    response += `  - Today: **${stats.users.signupsToday}**\n`;
    response += `  - Past 7 Days: **${stats.users.signupsThisWeek}**\n`;
    response += `  - Past 30 Days: **${stats.users.signupsThisMonth}**\n\n`;

    if (stats.users.recentUsers.length > 0) {
      response += `#### Recently Registered Members:\n`;
      stats.users.recentUsers.forEach((u) => {
        response += `* **${u.name}** (${u.role}${u.institution ? `, ${u.institution}` : ""}) — Joined ${u.createdAt.slice(0, 10)}\n`;
      });
    }
    return response;
  }

  // 5. Financials / Rewards / ETB / TC
  if (q.includes("reward") || q.includes("credit") || q.includes("tc") || q.includes("etb") || q.includes("birr") || q.includes("money") || q.includes("payout")) {
    let response = `### Rewards & Financial Balances\n\n`;
    response += `* **Total TC Distributed to Participants:** **${stats.financials.totalTcSpent.toLocaleString()} TC**\n`;
    response += `* **Total Compensation Paid to Field Enumerators:** **${stats.financials.totalEtbPaid.toLocaleString()} ETB**\n`;
    response += `* **Total Payout Records:** **${stats.financials.totalPayoutRecords}**\n`;
    return response;
  }

  // 6. Default: Comprehensive Platform Overview ("What's going on")
  let response = `### Tinat Platform Health & Operational Overview\n\n`;
  response += `Here is what is happening across Tinat right now:\n\n`;

  response += `#### 1. Members & Growth\n`;
  response += `* **${stats.users.total} total members** across the platform (${stats.users.researchers} researchers, ${stats.users.participants} participants, ${stats.users.collectors} field enumerators).\n`;
  response += `* **${stats.users.signupsThisWeek} new signups** in the past 7 days (${stats.users.signupsToday} today).\n`;
  response += `* **${stats.users.emailVerified} verified accounts** (${stats.users.faydaVerified} with Fayda National ID).\n\n`;

  response += `#### 2. Studies & Responses\n`;
  response += `* **${stats.studies.active} active studies** currently accepting responses (out of ${stats.studies.total} total studies).\n`;
  response += `* **${stats.studies.totalResponses.toLocaleString()} total responses** recorded across all investigations (${stats.studies.responsesThisWeek.toLocaleString()} this week).\n`;
  if (stats.studies.topStudies[0]) {
    response += `* Leading active study: **"${stats.studies.topStudies[0].title}"** with ${stats.studies.topStudies[0].responsesCount} responses.\n`;
  }
  response += `\n`;

  response += `#### 3. Standalone Forms\n`;
  response += `* **${stats.forms.total} Tinat Forms** created (${stats.forms.active} active), with **${stats.forms.totalResponses}** total responses collected.\n\n`;

  response += `#### 4. Governance & Action Items\n`;
  if (stats.verifications.pending > 0 || stats.governance.openModerationReports > 0) {
    response += `⚠️ **Attention needed:**\n`;
    if (stats.verifications.pending > 0) response += `* **${stats.verifications.pending} pending researcher verifications** awaiting review.\n`;
    if (stats.governance.openModerationReports > 0) response += `* **${stats.governance.openModerationReports} open moderation reports** to investigate.\n`;
  } else {
    response += `* ✅ No pending verifications or moderation alerts right now.\n`;
  }

  return response;
}
