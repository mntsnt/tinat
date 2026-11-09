import { prisma } from "../lib/prisma";

async function seed() {
  console.log("Starting TinTok micro-studies seed...");

  // 1. Locate verified researcher (Dr. Samuel Bekele or fallback)
  let researcher = await prisma.user.findUnique({
    where: { email: "samuel@gmail.com" },
  });

  if (!researcher) {
    researcher = await prisma.user.findFirst({
      where: { role: "RESEARCHER" },
    });
  }

  if (!researcher) {
    throw new Error("No researcher found to attach studies to.");
  }

  console.log(`Using researcher: ${researcher.name} (${researcher.email}, ID: ${researcher.id})`);

  // Ensure researcher has accepted Code of Conduct and DPA
  await prisma.user.update({
    where: { id: researcher.id },
    data: {
      codeOfConductAcceptedVersion: "1.0",
      codeOfConductAcceptedAt: new Date(),
      dpaAcceptedVersion: "1.0",
      dpaAcceptedAt: new Date(),
      faydaVerified: true,
      faydaVerifiedAt: new Date(),
    },
  });

  // Find admin for ethics verification
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  const studiesToSeed = [
    {
      id: "tintok_caffeine_sleep_2026",
      title: "Daily Caffeine Intake & Sleep Quality Micro-Survey",
      description: "Brief 5-card micro-study investigating caffeine habits and evening sleep hygiene.",
      objective: "Assessing correlations between afternoon caffeine consumption, sleep latency, and self-reported sleep quality among urban residents.",
      category: "Public Health",
      format: "TINTOK" as const,
      status: "ACTIVE" as const,
      fundingType: "FUNDED" as const,
      rewardCredits: 5,
      budgetCredits: 500,
      creditsPaid: 0,
      participantTarget: 100,
      estimatedMinutes: 2,
      involvesMinors: false,
      containsSensitiveTopics: false,
      teaserLinkEnabled: false,
      ethicsApprovalNumber: "IRB-TINTOK-2026-001",
      questions: [
        {
          order: 1,
          type: "SINGLE_CHOICE" as const,
          text: "How many caffeinated beverages (coffee, tea, energy drinks) do you drink each day?",
          required: true,
          options: [
            { text: "None", value: "none", order: 1 },
            { text: "1 – 2 cups", value: "1_2_cups", order: 2 },
            { text: "3 – 4 cups", value: "3_4_cups", order: 3 },
            { text: "5 or more cups", value: "5_plus_cups", order: 4 },
          ],
        },
        {
          order: 2,
          type: "SINGLE_CHOICE" as const,
          text: "What time do you usually drink your last caffeinated beverage?",
          required: true,
          options: [
            { text: "Before 12:00 PM (Noon)", value: "before_noon", order: 1 },
            { text: "Between 12:00 PM and 5:00 PM", value: "afternoon", order: 2 },
            { text: "Between 5:00 PM and 8:00 PM", value: "evening", order: 3 },
            { text: "After 8:00 PM", value: "late_night", order: 4 },
          ],
        },
        {
          order: 3,
          type: "LINEAR_SCALE" as const,
          text: "How would you rate your overall sleep quality over the past week?",
          required: true,
          scaleMin: 1,
          scaleMax: 5,
          scaleMinLabel: "Very Poor",
          scaleMaxLabel: "Excellent",
          options: [],
        },
        {
          order: 4,
          type: "NUMBER" as const,
          text: "Approximately how many minutes does it take you to fall asleep at night?",
          required: true,
          options: [],
        },
        {
          order: 5,
          type: "SHORT_TEXT" as const,
          text: "What is your primary evening wind-down activity before sleep?",
          required: false,
          options: [],
        },
      ],
    },
    {
      id: "tintok_workplace_hydration_2026",
      title: "Workplace Hydration & Afternoon Alertness",
      description: "Quick 4-card micro-study on daytime fluid consumption and alertness.",
      objective: "Evaluating workplace fluid intake patterns and their relationship to reported afternoon fatigue and focus.",
      category: "Nutrition & Dietetics",
      format: "TINTOK" as const,
      status: "ACTIVE" as const,
      fundingType: "FUNDED" as const,
      rewardCredits: 10,
      budgetCredits: 1000,
      creditsPaid: 0,
      participantTarget: 100,
      estimatedMinutes: 2,
      involvesMinors: false,
      containsSensitiveTopics: false,
      teaserLinkEnabled: false,
      ethicsApprovalNumber: "IRB-TINTOK-2026-002",
      questions: [
        {
          order: 1,
          type: "SINGLE_CHOICE" as const,
          text: "How much plain water do you typically drink during an average work day?",
          required: true,
          options: [
            { text: "Under 1 liter (< 4 glasses)", value: "under_1l", order: 1 },
            { text: "1 to 2 liters (4–8 glasses)", value: "1_2l", order: 2 },
            { text: "2 to 3 liters (8–12 glasses)", value: "2_3l", order: 3 },
            { text: "More than 3 liters", value: "over_3l", order: 4 },
          ],
        },
        {
          order: 2,
          type: "MULTIPLE_CHOICE" as const,
          text: "Which symptoms of fatigue do you commonly notice in the mid-afternoon?",
          required: true,
          options: [
            { text: "Afternoon brain fog", value: "brain_fog", order: 1 },
            { text: "Mild headache", value: "headache", order: 2 },
            { text: "Dry mouth / thirst", value: "thirst", order: 3 },
            { text: "Drowsiness or low energy", value: "drowsiness", order: 4 },
            { text: "None of the above", value: "none", order: 5 },
          ],
        },
        {
          order: 3,
          type: "LINEAR_SCALE" as const,
          text: "Rate your usual alertness level between 2:00 PM and 4:00 PM:",
          required: true,
          scaleMin: 1,
          scaleMax: 5,
          scaleMinLabel: "Sluggish",
          scaleMaxLabel: "Fully Alert",
          options: [],
        },
        {
          order: 4,
          type: "SHORT_TEXT" as const,
          text: "What workplace habit helps you maintain focus throughout the day?",
          required: false,
          options: [],
        },
      ],
    },
    {
      id: "tintok_antibiotic_awareness_2026",
      title: "Community Antibiotic Awareness & Safe Disposal",
      description: "Volunteer community micro-survey supporting antimicrobial resistance education.",
      objective: "Surveying public knowledge on appropriate antibiotic use, course completion, and household medication disposal.",
      category: "Infectious Diseases",
      format: "TINTOK" as const,
      status: "ACTIVE" as const,
      fundingType: "FREE" as const,
      rewardCredits: 0,
      budgetCredits: 0,
      creditsPaid: 0,
      participantTarget: 200,
      estimatedMinutes: 2,
      involvesMinors: false,
      containsSensitiveTopics: false,
      teaserLinkEnabled: false,
      ethicsApprovalNumber: "IRB-TINTOK-2026-003",
      questions: [
        {
          order: 1,
          type: "SINGLE_CHOICE" as const,
          text: "If you feel completely recovered before finishing an antibiotic prescription, what do you do?",
          required: true,
          options: [
            { text: "Complete the full course as prescribed", value: "complete_course", order: 1 },
            { text: "Stop taking the medicine immediately", value: "stop_early", order: 2 },
            { text: "Save remainder for future illness", value: "save_remainder", order: 3 },
          ],
        },
        {
          order: 2,
          type: "SINGLE_CHOICE" as const,
          text: "Have you ever taken antibiotics without a prescription for a common cold?",
          required: true,
          options: [
            { text: "Never", value: "never", order: 1 },
            { text: "Once or twice", value: "once_twice", order: 2 },
            { text: "Multiple times", value: "multiple_times", order: 3 },
          ],
        },
        {
          order: 3,
          type: "LINEAR_SCALE" as const,
          text: "How confident are you in recognizing which conditions require antibiotics?",
          required: true,
          scaleMin: 1,
          scaleMax: 5,
          scaleMinLabel: "Not Confident",
          scaleMaxLabel: "Very Confident",
          options: [],
        },
        {
          order: 4,
          type: "SINGLE_CHOICE" as const,
          text: "How do you typically dispose of expired or unused medications at home?",
          required: true,
          options: [
            { text: "Return to pharmacy or clinic", value: "pharmacy", order: 1 },
            { text: "Household trash bin", value: "trash", order: 2 },
            { text: "Flush down toilet or sink", value: "flush", order: 3 },
            { text: "Keep in medicine cabinet", value: "keep", order: 4 },
          ],
        },
      ],
    },
    {
      id: "tintok_hcw_burnout_checkin_2026",
      title: "Healthcare Worker Daily Stress Check-in (Quick Version)",
      description: "Micro-study version of our clinical burnout investigation with linked comprehensive survey teaser.",
      objective: "Rapid micro-check-in assessing shift strain and recovery balance among frontline healthcare providers.",
      category: "Mental Health",
      format: "TINTOK" as const,
      status: "ACTIVE" as const,
      fundingType: "FUNDED" as const,
      rewardCredits: 8,
      budgetCredits: 800,
      creditsPaid: 0,
      participantTarget: 100,
      estimatedMinutes: 2,
      involvesMinors: false,
      containsSensitiveTopics: false,
      parentStudyId: "study_hcw_burnout_2026",
      linkType: "TINTOK_VERSION" as const,
      teaserLinkEnabled: true,
      ethicsApprovalNumber: "IRB-TINTOK-2026-004",
      questions: [
        {
          order: 1,
          type: "SINGLE_CHOICE" as const,
          text: "During clinical shifts this week, how often did you feel emotionally drained?",
          required: true,
          options: [
            { text: "Never", value: "never", order: 1 },
            { text: "Once or twice", value: "once_twice", order: 2 },
            { text: "Most shifts", value: "most_shifts", order: 3 },
            { text: "Every shift", value: "every_shift", order: 4 },
          ],
        },
        {
          order: 2,
          type: "LINEAR_SCALE" as const,
          text: "Rate your overall work-recovery balance over the past 14 days:",
          required: true,
          scaleMin: 1,
          scaleMax: 5,
          scaleMinLabel: "Depleted",
          scaleMaxLabel: "Well-Rested",
          options: [],
        },
        {
          order: 3,
          type: "NUMBER" as const,
          text: "How many hours of uninterrupted sleep did you get before your most recent shift?",
          required: true,
          options: [],
        },
        {
          order: 4,
          type: "SHORT_TEXT" as const,
          text: "What institutional adjustment would most ease your clinical workload?",
          required: false,
          options: [],
        },
      ],
    },
  ];

  for (const s of studiesToSeed) {
    console.log(`Processing study: ${s.title} (${s.id})`);

    // Clean up existing if re-running seed
    const existing = await prisma.study.findUnique({ where: { id: s.id } });
    if (existing) {
      await prisma.answer.deleteMany({ where: { question: { studyId: s.id } } }).catch(() => {});
      await prisma.questionOption.deleteMany({ where: { question: { studyId: s.id } } }).catch(() => {});
      await prisma.question.deleteMany({ where: { studyId: s.id } }).catch(() => {});
      await prisma.consentRecord.deleteMany({ where: { consentForm: { studyId: s.id } } }).catch(() => {});
      await prisma.consentForm.deleteMany({ where: { studyId: s.id } }).catch(() => {});
      await prisma.ethicsApproval.deleteMany({ where: { studyId: s.id } }).catch(() => {});
      await prisma.response.deleteMany({ where: { studyId: s.id } }).catch(() => {});
      await prisma.participantLink.deleteMany({ where: { studyId: s.id } }).catch(() => {});
      await prisma.study.delete({ where: { id: s.id } }).catch(() => {});
    }

    // Create the study
    const created = await prisma.study.create({
      data: {
        id: s.id,
        title: s.title,
        description: s.description,
        objective: s.objective,
        category: s.category,
        format: s.format,
        status: s.status,
        fundingType: s.fundingType,
        rewardCredits: s.rewardCredits,
        creditPerResponse: s.fundingType === "FUNDED" ? s.rewardCredits : 0,
        creditBudget: s.fundingType === "FUNDED" ? s.budgetCredits : 0,
        creditsSpent: 0,
        budgetCredits: s.fundingType === "FUNDED" ? s.budgetCredits : 0,
        creditsPaid: 0,
        participantTarget: s.participantTarget,
        estimatedMinutes: s.estimatedMinutes,
        involvesMinors: s.involvesMinors,
        containsSensitiveTopics: s.containsSensitiveTopics,
        researcherId: researcher.id,
        parentStudyId: s.parentStudyId || null,
        linkType: s.linkType || null,
        teaserLinkEnabled: s.teaserLinkEnabled,
      },
    });

    // Create verified ethics approval (valid for 1 full year)
    await prisma.ethicsApproval.create({
      data: {
        studyId: created.id,
        committeeName: "National Health Research Ethics Review Committee (NERC)",
        approvalNumber: s.ethicsApprovalNumber,
        approvalDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        documentPath: `/uploads/ethics/${s.id}.pdf`,
        status: "VERIFIED",
        verifiedAt: new Date(),
        verifiedByAdminId: admin?.id || null,
        adminNotes: "TinTok micro-study protocol verified. Adult non-sensitive cards with separate dataset.",
      },
    });

    // Create informed consent form
    await prisma.consentForm.create({
      data: {
        studyId: created.id,
        version: 1,
        language: "en",
        keyInformation: {
          studyTitle: s.title,
          institution: "National Health Research Initiative",
          purpose: s.objective,
          risks: "Minimal risk online micro-survey.",
          benefits: "Contribution to community health insights and non-cash Tinat Credits.",
          voluntary: "Participation is voluntary and can be stopped at any card.",
        },
        fullText: `You are invited to participate in a brief card-format health study: ${s.title}. This micro-survey takes approximately 2 minutes to complete on mobile or desktop. Participation is entirely voluntary and responses are decoupled from your profile under unguessable respondent tokens.`,
      },
    });

    // Create questions & options
    for (const q of s.questions) {
      await prisma.question.create({
        data: {
          studyId: created.id,
          order: q.order,
          type: q.type,
          text: q.text,
          required: q.required,
          scaleMin: (q as any).scaleMin ?? null,
          scaleMax: (q as any).scaleMax ?? null,
          scaleMinLabel: (q as any).scaleMinLabel ?? null,
          scaleMaxLabel: (q as any).scaleMaxLabel ?? null,
          options: {
            create: q.options.map((opt) => ({
              order: opt.order,
              text: opt.text,
              value: opt.value,
            })),
          },
        },
      });
    }

    console.log(`Successfully created TinTok study: "${s.title}" (${s.id}) with ${s.questions.length} cards.`);
  }

  console.log("Seeding complete! 4 TinTok micro-studies created and verified.");
}

seed()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
