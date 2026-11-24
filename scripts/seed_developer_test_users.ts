import 'dotenv/config';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

async function main() {
  console.log('========================================================');
  console.log('🚀 Generating Fully-Verified Developer Test Accounts');
  console.log('========================================================\n');

  const sharedPassword = 'TinatDev2026!';
  const passwordHash = await bcrypt.hash(sharedPassword, 10);
  console.log('✅ Hashed shared password:', sharedPassword);

  // Common accepted legal terms and verification flags
  const legalConsent = {
    isVerified: true,
    faydaVerified: true,
    faydaVerifiedAt: new Date(),
    termsAcceptedVersion: '1.0',
    termsAcceptedAt: new Date(),
    charterAcceptedVersion: '1.0',
    charterAcceptedAt: new Date(),
    codeOfConductAcceptedVersion: '1.0',
    codeOfConductAcceptedAt: new Date(),
    dpaAcceptedVersion: '1.0',
    dpaAcceptedAt: new Date(),
    privacyNoticeVersion: '1.0',
    privacyAcceptedAt: new Date(),
  };

  // -------------------------------------------------------------------------
  // 1. ADMIN USER: admin@tinat.et
  // -------------------------------------------------------------------------
  const adminEmail = 'admin@tinat.et';
  const adminFan = crypto.createHash('sha256').update('ET-FAYDA-ADM-2026-0001').digest('hex');

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash,
      role: 'ADMIN',
      name: 'System Administrator',
      username: 'tinat_admin',
      phone: '+251911000001',
      bio: 'Tinat Health Network Lead Platform Administrator & Security Controller.',
      ...legalConsent,
    },
    create: {
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      name: 'System Administrator',
      username: 'tinat_admin',
      phone: '+251911000001',
      bio: 'Tinat Health Network Lead Platform Administrator & Security Controller.',
      faydaFanHash: adminFan,
      ...legalConsent,
    },
  });

  // Admin Wallet & Ledger Account
  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: { balance: 10000, totalEarned: 10000, totalWithdrawn: 0 },
    create: {
      userId: admin.id,
      balance: 10000,
      totalEarned: 10000,
      totalWithdrawn: 0,
    },
  });

  await prisma.ledgerAccount.upsert({
    where: { userId: admin.id },
    update: { balance: 10000 },
    create: {
      id: `la_${admin.id}`,
      kind: 'USER_WALLET',
      userId: admin.id,
      balance: 10000,
    },
  });

  // Admin Notifications
  await prisma.notification.deleteMany({ where: { userId: admin.id } });
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        title: 'Admin Console Initialized 🛡️',
        message: 'Platform governance, user management, and geographic reach are fully operational.',
        isRead: false,
        linkUrl: '/admin',
      },
      {
        userId: admin.id,
        title: 'Pending Withdrawal Alert 💳',
        message: 'A new participant withdrawal request (50 ETB via CBE Birr) requires review.',
        isRead: false,
        linkUrl: '/admin/withdrawals',
      },
    ],
  });

  console.log(`✅ [ADMIN] created/upserted: ${admin.name} (${admin.email})`);

  // -------------------------------------------------------------------------
  // 2. RESEARCHER USER: researcher@tinat.et
  // -------------------------------------------------------------------------
  const researcherEmail = 'researcher@tinat.et';
  const researcherFan = crypto.createHash('sha256').update('ET-FAYDA-RES-2026-0002').digest('hex');

  const researcher = await prisma.user.upsert({
    where: { email: researcherEmail },
    update: {
      passwordHash,
      role: 'RESEARCHER',
      name: 'Dr. Dawit Alemayehu',
      username: 'dr_dawit',
      phone: '+251911223344',
      institution: "St. Paul's Hospital Millennium Medical College (SPHMMC)",
      fieldOfStudy: 'Public Health & Clinical Epidemiology',
      bio: 'Associate Professor of Public Health at SPHMMC. Lead investigator in maternal-child nutrition, community epidemiology, and health surveillance in Ethiopia.',
      ...legalConsent,
    },
    create: {
      email: researcherEmail,
      passwordHash,
      role: 'RESEARCHER',
      name: 'Dr. Dawit Alemayehu',
      username: 'dr_dawit',
      phone: '+251911223344',
      institution: "St. Paul's Hospital Millennium Medical College (SPHMMC)",
      fieldOfStudy: 'Public Health & Clinical Epidemiology',
      bio: 'Associate Professor of Public Health at SPHMMC. Lead investigator in maternal-child nutrition, community epidemiology, and health surveillance in Ethiopia.',
      faydaFanHash: researcherFan,
      ...legalConsent,
    },
  });

  // Researcher Wallet & Ledger Account
  const researcherWallet = await prisma.wallet.upsert({
    where: { userId: researcher.id },
    update: { balance: 5000, totalEarned: 5000, totalWithdrawn: 0 },
    create: {
      userId: researcher.id,
      balance: 5000,
      totalEarned: 5000,
      totalWithdrawn: 0,
    },
  });

  await prisma.ledgerAccount.upsert({
    where: { userId: researcher.id },
    update: { balance: 5000 },
    create: {
      id: `la_${researcher.id}`,
      kind: 'USER_WALLET',
      userId: researcher.id,
      balance: 5000,
    },
  });

  // Researcher Grant Transaction
  const researcherGrantKey = `grant-${researcher.id}-init`;
  const existingGrant = await prisma.tinatCreditTransaction.findUnique({
    where: { idempotencyKey: researcherGrantKey },
  });
  if (!existingGrant) {
    await prisma.tinatCreditTransaction.create({
      data: {
        walletId: researcherWallet.id,
        amount: 5000,
        type: 'ADMIN_ADJUSTMENT',
        reason: 'SPHMMC Institutional Research Grant & Reward Allocation',
        idempotencyKey: researcherGrantKey,
        balanceAfter: 5000,
      },
    });
  }

  // Researcher Studies
  const studyTitle = 'Addis Ababa Maternal & Infant Nutrition Surveillance (SPHMMC)';
  let study = await prisma.study.findFirst({
    where: { researcherId: researcher.id, title: studyTitle },
  });

  if (!study) {
    study = await prisma.study.create({
      data: {
        title: studyTitle,
        description:
          'Comprehensive health surveillance study conducted by SPHMMC Department of Public Health evaluating maternal dietary diversity, antenatal clinic attendance, micronutrient supplementation, and early infant feeding practices across health facilities in Addis Ababa.',
        bannerTheme: 'canopy',
        status: 'ACTIVE',
        fundingType: 'FUNDED',
        studyType: 'SURVEY',
        category: 'Maternal & Child Health',
        creditPerResponse: 25,
        creditBudget: 2500,
        creditsSpent: 125,
        rewardCredits: 25,
        participantTarget: 100,
        targetPopulation: 'Postpartum mothers, caregivers, and primary health clinic attendees in Addis Ababa',
        populationDescription: 'Mothers with infants under 2 years attending routine immunization or postnatal checkups.',
        objective:
          'Measure compliance with recommended infant feeding practices and assess barriers to accessing free micronutrient supplements in primary health posts.',
        ethicsExempt: true,
        ethicsExemptionReason: 'SPHMMC Institutional Health Research Ethics Review Board #IRB-2026-088',
        researcherId: researcher.id,
      },
    });

    // Create 6 Questions for the Study
    const q1 = await prisma.question.create({
      data: {
        studyId: study.id,
        text: 'What primary health post or clinic do you usually visit for maternal and child healthcare?',
        type: 'SHORT_TEXT',
        required: true,
        order: 1,
      },
    });

    const q2 = await prisma.question.create({
      data: {
        studyId: study.id,
        text: 'What is your primary source of infant nutrition and vaccination advice?',
        type: 'SINGLE_CHOICE',
        required: true,
        order: 2,
        options: {
          create: [
            { text: 'Health Extension Worker (HEW)', value: 'HEW', order: 1 },
            { text: 'Primary Health Center Nurse / Doctor', value: 'CLINIC_STAFF', order: 2 },
            { text: 'Hospital Specialist / Pediatrician', value: 'SPECIALIST', order: 3 },
            { text: 'Family Members & Community Elders', value: 'FAMILY', order: 4 },
          ],
        },
      },
    });

    const q3 = await prisma.question.create({
      data: {
        studyId: study.id,
        text: 'How many routine antenatal care (ANC) checkups did you complete during your last pregnancy?',
        type: 'NUMBER',
        required: true,
        order: 3,
      },
    });

    const q4 = await prisma.question.create({
      data: {
        studyId: study.id,
        text: 'Did you receive iron and folic acid (IFA) supplements free of charge at the health facility?',
        type: 'YES_NO',
        required: true,
        order: 4,
      },
    });

    const q5 = await prisma.question.create({
      data: {
        studyId: study.id,
        text: 'On a scale of 1 to 5, how satisfied were you with the nutritional counseling provided by the healthcare staff?',
        type: 'LINEAR_SCALE',
        required: true,
        order: 5,
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Very Dissatisfied',
        scaleMaxLabel: 'Very Satisfied',
      },
    });

    const q6 = await prisma.question.create({
      data: {
        studyId: study.id,
        text: 'What additional health or nutritional support would most benefit mothers and children in your kebele?',
        type: 'LONG_TEXT',
        required: false,
        order: 6,
      },
    });

    console.log(`✅ Created Study "${study.title}" with 6 questions.`);
  }

  // Ask Profile for Dr. Dawit
  const askProfile = await prisma.askProfile.upsert({
    where: { userId: researcher.id },
    update: {
      username: 'dr_dawit',
      displayName: 'Dr. Dawit Alemayehu',
      bio: 'Associate Professor of Public Health at SPHMMC. Ask me about clinical trials, epidemiology, and public health in Ethiopia.',
      theme: 'emerald',
      isEnabled: true,
      allowPublicAnswers: true,
    },
    create: {
      userId: researcher.id,
      username: 'dr_dawit',
      displayName: 'Dr. Dawit Alemayehu',
      bio: 'Associate Professor of Public Health at SPHMMC. Ask me about clinical trials, epidemiology, and public health in Ethiopia.',
      theme: 'emerald',
      isEnabled: true,
      allowPublicAnswers: true,
    },
  });

  // Seed 2 Q&As on Tinat Ask
  await prisma.askQuestion.deleteMany({ where: { profileId: askProfile.id } });
  await prisma.askQuestion.createMany({
    data: [
      {
        profileId: askProfile.id,
        questionText: 'What are the most effective community-level strategies to prevent infant malnutrition in rural kebeles?',
        status: 'ANSWERED',
        isPublic: true,
        answerText:
          'Combining monthly growth monitoring with direct maternal counseling by health extension workers has demonstrated a 32% reduction in early acute malnutrition markers in pilot woredas.',
        answeredAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        profileId: askProfile.id,
        questionText: 'Can university health informatics students participate in field data collection on Tinat?',
        status: 'ANSWERED',
        isPublic: true,
        answerText:
          'Yes! Qualified medical and health informatics students can apply to become accredited data collectors and access anonymized research registries for academic research.',
        answeredAt: new Date(Date.now() - 86400000),
      },
    ],
  });

  // Seed Researcher AI Conversation
  const existingAiConv = await prisma.aIConversation.findFirst({
    where: { userId: researcher.id },
  });
  if (!existingAiConv) {
    const conv = await prisma.aIConversation.create({
      data: {
        userId: researcher.id,
        title: 'Epidemiological Bias Analysis',
        studyId: study.id,
      },
    });
    await prisma.aIMessage.createMany({
      data: [
        {
          conversationId: conv.id,
          role: 'USER',
          content: 'Analyze potential bias vectors in retrospective maternal health survey sampling across urban kebeles.',
        },
        {
          conversationId: conv.id,
          role: 'ASSISTANT',
          content:
            'Key bias vectors in urban retrospective maternal surveys include: 1) Recall bias on prenatal visit frequency, 2) Selection bias toward mothers who deliver in health facilities versus home births, and 3) Socioeconomic skewing based on clinic catchment hours. We recommend cluster-stratified sampling across public health centers combined with community health worker home visits.',
        },
      ],
    });
  }

  // Researcher Notifications
  await prisma.notification.deleteMany({ where: { userId: researcher.id } });
  await prisma.notification.createMany({
    data: [
      {
        userId: researcher.id,
        title: 'Welcome Dr. Dawit! 🔬',
        message: 'Your researcher workspace is verified with SPHMMC. You can now publish studies, track live analytics, and use Tinat AI.',
        isRead: true,
        linkUrl: '/researcher',
      },
      {
        userId: researcher.id,
        title: 'New Responses Received 📊',
        message: 'Your study "Addis Ababa Maternal & Infant Nutrition Surveillance" has received new participant submissions.',
        isRead: false,
        linkUrl: `/researcher/studies/${study.id}`,
      },
    ],
  });

  console.log(`✅ [RESEARCHER] created/upserted: ${researcher.name} (${researcher.email})`);

  // -------------------------------------------------------------------------
  // 3. PARTICIPANT USER: participant@tinat.et
  // -------------------------------------------------------------------------
  const participantEmail = 'participant@tinat.et';
  const participantFan = crypto.createHash('sha256').update('ET-FAYDA-PAR-2026-0003').digest('hex');

  const participant = await prisma.user.upsert({
    where: { email: participantEmail },
    update: {
      passwordHash,
      role: 'PARTICIPANT',
      name: 'Bethlehem Tadesse',
      username: 'bethlehem_aau',
      phone: '+251911987654',
      institution: 'Addis Ababa University (AAU)',
      fieldOfStudy: 'Health Informatics',
      yearOfStudy: 4,
      bio: 'Health Informatics student at AAU. Active research participant and community health contributor.',
      ...legalConsent,
    },
    create: {
      email: participantEmail,
      passwordHash,
      role: 'PARTICIPANT',
      name: 'Bethlehem Tadesse',
      username: 'bethlehem_aau',
      phone: '+251911987654',
      institution: 'Addis Ababa University (AAU)',
      fieldOfStudy: 'Health Informatics',
      yearOfStudy: 4,
      bio: 'Health Informatics student at AAU. Active research participant and community health contributor.',
      faydaFanHash: participantFan,
      ...legalConsent,
    },
  });

  // Participant Wallet & Ledger Account
  const participantWallet = await prisma.wallet.upsert({
    where: { userId: participant.id },
    update: {
      balance: 250,
      pendingBalance: 50,
      totalEarned: 350,
      totalWithdrawn: 100,
    },
    create: {
      userId: participant.id,
      balance: 250,
      pendingBalance: 50,
      totalEarned: 350,
      totalWithdrawn: 100,
    },
  });

  await prisma.ledgerAccount.upsert({
    where: { userId: participant.id },
    update: { balance: 250 },
    create: {
      id: `la_${participant.id}`,
      kind: 'USER_WALLET',
      userId: participant.id,
      balance: 250,
    },
  });

  // Participant Transactions (Append-Only / Idempotent)
  const participantTransactions = [
    {
      walletId: participantWallet.id,
      amount: 200,
      type: 'REWARD_CREDIT' as const,
      reason: 'Completed study: Addis Ababa Maternal & Infant Nutrition Surveillance',
      idempotencyKey: `reward-${study.id}-${participant.id}-1`,
      balanceAfter: 200,
      createdAt: new Date(Date.now() - 86400000 * 5),
    },
    {
      walletId: participantWallet.id,
      amount: 150,
      type: 'REWARD_CREDIT' as const,
      reason: 'Completed study: Sheger City Community Health Census',
      idempotencyKey: `reward-sheger-${participant.id}-2`,
      balanceAfter: 350,
      createdAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      walletId: participantWallet.id,
      amount: -100,
      type: 'WITHDRAW' as const,
      reason: 'Telebirr payout transfer (+251911987654)',
      idempotencyKey: `withdraw-tb-${participant.id}-1`,
      balanceAfter: 250,
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
  ];

  for (const tx of participantTransactions) {
    const existingTx = await prisma.tinatCreditTransaction.findUnique({
      where: { idempotencyKey: tx.idempotencyKey },
    });
    if (!existingTx) {
      await prisma.tinatCreditTransaction.create({ data: tx });
    }
  }

  // Participant Withdrawals
  const existingWithdrawals = await prisma.withdrawal.findMany({
    where: { userId: participant.id },
  });
  if (existingWithdrawals.length === 0) {
    await prisma.withdrawal.createMany({
      data: [
        {
          userId: participant.id,
          amount: 100,
          method: 'TELEBIRR',
          accountInfo: '+251911987654 (Bethlehem Tadesse)',
          status: 'COMPLETED',
          createdAt: new Date(Date.now() - 86400000 * 2),
        },
        {
          userId: participant.id,
          amount: 50,
          method: 'CBE_BIRR',
          accountInfo: '+251911987654 (Bethlehem Tadesse)',
          status: 'PENDING',
          createdAt: new Date(Date.now() - 3600000 * 4),
        },
      ],
    });
  }

  // Study Interactions (Bookmark, Like, Rating)
  await prisma.studyBookmark.upsert({
    where: { userId_studyId: { userId: participant.id, studyId: study.id } },
    update: {},
    create: { userId: participant.id, studyId: study.id },
  });

  await prisma.studyLike.upsert({
    where: { userId_studyId: { userId: participant.id, studyId: study.id } },
    update: {},
    create: { userId: participant.id, studyId: study.id },
  });

  await prisma.studyRating.upsert({
    where: { userId_studyId: { userId: participant.id, studyId: study.id } },
    update: { rating: 5, feedback: 'Clear and respectful clinical questions. Excellent experience.' },
    create: {
      userId: participant.id,
      studyId: study.id,
      rating: 5,
      feedback: 'Clear and respectful clinical questions. Excellent experience.',
    },
  });

  // Link Participant to Study and Submit Bethlehem's Response
  const respondentCode = `RESP-${participant.id.slice(-6).toUpperCase()}`;
  await prisma.participantLink.upsert({
    where: { studyId_userId: { studyId: study.id, userId: participant.id } },
    update: { respondentCode },
    create: {
      studyId: study.id,
      userId: participant.id,
      respondentCode,
    },
  });

  // Fetch questions for Dr. Dawit's study
  const questions = await prisma.question.findMany({
    where: { studyId: study.id },
    orderBy: { order: 'asc' },
  });

  // Ensure response exists for Bethlehem
  let response = await prisma.response.findUnique({
    where: { studyId_respondentCode: { studyId: study.id, respondentCode } },
  });

  if (!response) {
    response = await prisma.response.create({
      data: {
        studyId: study.id,
        respondentCode,
        collectionMethod: 'SELF',
        submittedAt: new Date(Date.now() - 86400000 * 4),
      },
    });

    if (questions.length >= 6) {
      await prisma.answer.createMany({
        data: [
          { responseId: response.id, questionId: questions[0].id, textValue: 'Kolfe Keranio Health Center' },
          { responseId: response.id, questionId: questions[1].id, textValue: 'Health Extension Worker (HEW)' },
          { responseId: response.id, questionId: questions[2].id, numberValue: 4 },
          { responseId: response.id, questionId: questions[3].id, textValue: 'true' },
          { responseId: response.id, questionId: questions[4].id, numberValue: 5 },
          {
            responseId: response.id,
            questionId: questions[5].id,
            textValue: 'More weekend nutritional counseling workshops would be very beneficial for working mothers.',
          },
        ],
      });
    }
  }

  // Seed 4 additional simulated responses for rich researcher charts
  const simulatedAnswers = [
    { code: 'RESP-SIM-001', facility: 'Lideta Health Center', source: 'Primary Health Center Nurse / Doctor', anc: 3, ifa: 'true', rating: 4, comment: 'Shorter wait times would help.' },
    { code: 'RESP-SIM-002', facility: 'Bole 17 Health Post', source: 'Hospital Specialist / Pediatrician', anc: 5, ifa: 'true', rating: 5, comment: 'Staff was very helpful and professional.' },
    { code: 'RESP-SIM-003', facility: 'Yeka Health Center', source: 'Health Extension Worker (HEW)', anc: 2, ifa: 'false', rating: 3, comment: 'Clinics ran out of iron tablets last month.' },
    { code: 'RESP-SIM-004', facility: 'Arada Health Post', source: 'Family Members & Community Elders', anc: 4, ifa: 'true', rating: 4, comment: 'Information pamphlets in Amharic were easy to read.' },
  ];

  for (const sim of simulatedAnswers) {
    const existingSimResp = await prisma.response.findUnique({
      where: { studyId_respondentCode: { studyId: study.id, respondentCode: sim.code } },
    });
    if (!existingSimResp && questions.length >= 6) {
      const simResp = await prisma.response.create({
        data: {
          studyId: study.id,
          respondentCode: sim.code,
          collectionMethod: 'SELF',
          submittedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 3)),
        },
      });
      await prisma.answer.createMany({
        data: [
          { responseId: simResp.id, questionId: questions[0].id, textValue: sim.facility },
          { responseId: simResp.id, questionId: questions[1].id, textValue: sim.source },
          { responseId: simResp.id, questionId: questions[2].id, numberValue: sim.anc },
          { responseId: simResp.id, questionId: questions[3].id, textValue: sim.ifa },
          { responseId: simResp.id, questionId: questions[4].id, numberValue: sim.rating },
          { responseId: simResp.id, questionId: questions[5].id, textValue: sim.comment },
        ],
      });
    }
  }

  // Participant Notifications
  await prisma.notification.deleteMany({ where: { userId: participant.id } });
  await prisma.notification.createMany({
    data: [
      {
        userId: participant.id,
        title: 'Welcome Bethlehem! 🌟',
        message: 'Your Fayda identity is verified and your digital Field Contributor Pass is active.',
        isRead: true,
        linkUrl: '/participant',
      },
      {
        userId: participant.id,
        title: 'Reward Credited 💰',
        message: 'You received 25 TC for completing "Addis Ababa Maternal & Infant Nutrition Surveillance".',
        isRead: false,
        linkUrl: '/participant/wallet',
      },
      {
        userId: participant.id,
        title: 'Withdrawal Processed 📱',
        message: '100 ETB was successfully sent to your Telebirr account (+251911987654).',
        isRead: false,
        linkUrl: '/participant/wallet',
      },
    ],
  });

  console.log(`✅ [PARTICIPANT] created/upserted: ${participant.name} (${participant.email})`);

  console.log('\n========================================================');
  console.log('🎉 All 3 Test Users Successfully Generated & Verified!');
  console.log('========================================================\n');
}

main()
  .catch((e) => {
    console.error('Error generating test users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
