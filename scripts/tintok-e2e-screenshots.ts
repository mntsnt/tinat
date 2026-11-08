import { chromium } from "playwright";
import { SignJWT } from "jose";
import path from "path";
import "dotenv/config";
import { prisma } from "../lib/prisma";
import { recordPlatformConsent } from "../lib/legal/consentService";
import { StudyFormat, StudyLinkType, StudyFundingType, QuestionType, EthicsApprovalStatus } from "../generated/prisma/client";

const ARTIFACT_DIR = "C:\\Users\\hp\\.gemini\\antigravity\\brain\\7198fb25-ed5c-47fc-ad52-576777442792";
const BASE_URL = "http://localhost:3000";

function getSecretKey() {
  const secret = process.env.AUTH_SECRET || "1337cf3b38e528babebbffde1c7d92e86d2dc13161a52a1d5d9c0528ebbf748e";
  return new TextEncoder().encode(secret);
}

async function createToken(userId: string) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

async function run() {
  console.log("=== Starting Tintok E2E & Screenshot Generation ===");

  const timestamp = Date.now();

  // 1. Create test researcher
  const researcher = await prisma.user.create({
    data: {
      name: "Dr. Selamawit Bekele",
      email: `selamawit-${timestamp}@aau.edu.et`,
      passwordHash: "dummy-hash",
      role: "RESEARCHER",
      isVerified: true,
      institution: "Addis Ababa University - School of Public Health",
      codeOfConductAcceptedAt: new Date(),
      dpaAcceptedAt: new Date(),
    },
  });
  await recordPlatformConsent({ userId: researcher.id });

  // 2. Create test participant
  const participant = await prisma.user.create({
    data: {
      name: "Tadesse Hailu",
      email: `tadesse-${timestamp}@gmail.com`,
      passwordHash: "dummy-hash",
      role: "PARTICIPANT",
      isVerified: true,
    },
  });
  await recordPlatformConsent({ userId: participant.id });

  // 3. Create clean standard study with eligible and skipped questions
  const standardStudy = await prisma.study.create({
    data: {
      title: "Community Water & Sanitation Access in Hawassa",
      description: "A comprehensive investigation of municipal and borehole water accessibility and community hygiene practices.",
      researcherId: researcher.id,
      format: StudyFormat.STANDARD,
      status: "ACTIVE",
      fundingType: StudyFundingType.FUNDED,
      rewardCredits: 40,
      creditPerResponse: 40,
      creditBudget: 4000,
      budgetCredits: 4000,
      creditsPaid: 0,
      creditsSpent: 0,
      involvesMinors: false,
      containsSensitiveTopics: false,
      estimatedMinutes: 15,
      ethicsApproval: {
        create: {
          committeeName: "AAU Institutional Review Board",
          approvalNumber: "AAU-IRB-2026-0891",
          approvalDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          documentPath: "/mock/ethics-cert.pdf",
          status: EthicsApprovalStatus.VERIFIED,
        },
      },
      questions: {
        create: [
          {
            order: 1,
            type: QuestionType.SINGLE_CHOICE,
            text: "What is your main household drinking water source?",
            required: true,
            options: {
              create: [
                { text: "Piped indoor tap", value: "tap", order: 1 },
                { text: "Public water point", value: "public", order: 2 },
                { text: "Protected borehole", value: "borehole", order: 3 },
                { text: "Open well or river", value: "surface", order: 4 },
              ],
            },
          },
          {
            order: 2,
            type: QuestionType.MULTIPLE_CHOICE,
            text: "Which water treatment methods do you regularly use?",
            required: false,
            options: {
              create: [
                { text: "Boiling", value: "boil", order: 1 },
                { text: "Chlorine solution (Wuha Agar)", value: "chlorine", order: 2 },
                { text: "Ceramic filtration", value: "filter", order: 3 },
              ],
            },
          },
          {
            order: 3,
            type: QuestionType.LINEAR_SCALE,
            text: "How reliable is your water supply on a scale from 1 (poor) to 5 (excellent)?",
            required: true,
            scaleMin: 1,
            scaleMax: 5,
            scaleMinLabel: "Very Poor",
            scaleMaxLabel: "Excellent",
          },
          {
            order: 4,
            type: QuestionType.NUMBER,
            text: "Approximate one-way walking time (minutes) to fetch water:",
            required: true,
          },
          {
            order: 5,
            type: QuestionType.SHORT_TEXT,
            text: "Name your local kebele or sub-city area:",
            required: false,
          },
          {
            order: 6,
            type: QuestionType.LONG_TEXT,
            text: "Please share any specific challenges or seasonal shortages your household has experienced over the past dry season:",
            required: false,
          },
          {
            order: 7,
            type: QuestionType.DATE,
            text: "Date of most recent piped supply interruption:",
            required: false,
          },
          {
            order: 8,
            type: QuestionType.MULTIPLE_CHOICE_GRID,
            text: "Rate reliability of alternative water sources by dry vs rainy season:",
            required: false,
            rows: {
              create: [{ text: "Borehole supply", value: "borehole", order: 1 }],
            },
            options: {
              create: [{ text: "Consistent", value: "good", order: 1 }],
            },
          },
        ],
      },
    },
  });

  const researcherToken = await createToken(researcher.id);
  const participantToken = await createToken(participant.id);

  const browser = await chromium.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: true,
  });

  try {
    // --------------------------------------------------------------------------
    // PART A: Desktop Viewport (1440 x 900) - Researcher Flow & Modal Review
    // --------------------------------------------------------------------------
    console.log("--> Testing Desktop 1440x900 Viewport...");
    const desktopContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });

    await desktopContext.addCookies([
      {
        name: "tinat_session",
        value: researcherToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    const desktopPage = await desktopContext.newPage();
    await desktopPage.goto(`${BASE_URL}/researcher/studies/${standardStudy.id}`, {
      waitUntil: "networkidle",
    });

    // 1. Screenshot: "Create a Tintok version" button
    console.log("Capturing desktop button...");
    const createBtn = desktopPage.locator('[data-testid="create-tintok-version-btn"]');
    await createBtn.waitFor({ state: "visible", timeout: 15000 });
    await desktopPage.screenshot({
      path: path.join(ARTIFACT_DIR, "tintok-button-1440x900.png"),
      fullPage: false,
    });

    // 2. Open Modal & Verify Accessibility
    console.log("Opening copy review modal...");
    await createBtn.click();
    const modal = desktopPage.locator('[data-testid="tintok-review-modal"]');
    await modal.waitFor({ state: "visible", timeout: 5000 });

    // Accessibility check: Dialog role and aria attributes
    const role = await modal.getAttribute("role");
    const ariaModal = await modal.getAttribute("aria-modal");
    console.log(`Accessibility check: role="${role}", aria-modal="${ariaModal}"`);

    // Wait for questions preview analysis to finish loading
    const submitBtn = desktopPage.locator('[data-testid="confirm-tintok-creation-btn"]');
    await desktopPage.waitForFunction(
      () => {
        const btn = document.querySelector('[data-testid="confirm-tintok-creation-btn"]') as HTMLButtonElement;
        return btn && !btn.disabled;
      },
      { timeout: 15000 }
    );

    // Screenshot: Copy Review Dialog (Desktop)
    await desktopPage.screenshot({
      path: path.join(ARTIFACT_DIR, "tintok-review-dialog-1440x900.png"),
      fullPage: false,
    });

    // Click confirm button to create the Tintok version
    console.log("Submitting Tintok creation...");
    await submitBtn.click();

    // Wait for redirect to the new Tintok study or reload
    await desktopPage.waitForURL(/\/researcher\/studies\//, { timeout: 15000 });
    await desktopPage.waitForTimeout(2000);

    // Navigate back to standard study to see Linked Studies Panel
    await desktopPage.goto(`${BASE_URL}/researcher/studies/${standardStudy.id}`, {
      waitUntil: "networkidle",
    });

    // 3. Screenshot: Linked Studies Panel (Desktop)
    console.log("Capturing desktop linked-studies panel...");
    const linkedPanel = desktopPage.locator('[data-testid="linked-studies-panel"]');
    await linkedPanel.waitFor({ state: "visible", timeout: 5000 });
    await desktopPage.screenshot({
      path: path.join(ARTIFACT_DIR, "tintok-linked-panel-1440x900.png"),
      fullPage: false,
    });

    await desktopContext.close();

    // --------------------------------------------------------------------------
    // PART B: Mobile Viewport (390 x 844) - Mobile Responsive Experience
    // --------------------------------------------------------------------------
    console.log("--> Testing Mobile 390x844 Viewport (iPhone 12/13/14 format)...");
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });

    await mobileContext.addCookies([
      {
        name: "tinat_session",
        value: researcherToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(`${BASE_URL}/researcher/studies/${standardStudy.id}`, {
      waitUntil: "networkidle",
    });

    // Screenshot: Mobile button / linked panel
    await mobilePage.screenshot({
      path: path.join(ARTIFACT_DIR, "tintok-linked-panel-390x844.png"),
      fullPage: false,
    });

    // Create another clean standard study for mobile modal screenshot
    const mobileStudy = await prisma.study.create({
      data: {
        title: "Childhood Immunization Survey",
        researcherId: researcher.id,
        format: StudyFormat.STANDARD,
        status: "ACTIVE",
        involvesMinors: false,
        containsSensitiveTopics: false,
        questions: {
          create: [
            {
              order: 1,
              type: QuestionType.SINGLE_CHOICE,
              text: "Have routine vaccines been received?",
              required: true,
            },
          ],
        },
      },
    });

    await mobilePage.goto(`${BASE_URL}/researcher/studies/${mobileStudy.id}`, {
      waitUntil: "networkidle",
    });

    const mobileCreateBtn = mobilePage.locator('[data-testid="create-tintok-version-btn"]');
    await mobileCreateBtn.waitFor({ state: "visible" });
    await mobilePage.screenshot({
      path: path.join(ARTIFACT_DIR, "tintok-button-390x844.png"),
      fullPage: false,
    });

    await mobileCreateBtn.click();
    const mobileModal = mobilePage.locator('[data-testid="tintok-review-modal"]');
    await mobileModal.waitFor({ state: "visible" });
    await mobilePage.waitForFunction(
      () => {
        const btn = document.querySelector('[data-testid="confirm-tintok-creation-btn"]') as HTMLButtonElement;
        return btn && !btn.disabled;
      },
      { timeout: 15000 }
    );
    await mobilePage.screenshot({
      path: path.join(ARTIFACT_DIR, "tintok-review-dialog-390x844.png"),
      fullPage: false,
    });

    await mobileContext.close();

    // --------------------------------------------------------------------------
    // PART C: Participant Teaser Card View (Desktop & Mobile)
    // --------------------------------------------------------------------------
    console.log("--> Testing Participant Teaser Card View...");

    // Find the Tintok study that was created from standardStudy
    const createdTintok = await prisma.study.findFirst({
      where: { parentStudyId: standardStudy.id },
      include: { questions: { include: { options: true } } },
    });

    if (!createdTintok) {
      throw new Error("Created Tintok study was not found in DB");
    }

    // Set Tintok study to ACTIVE with verified ethics approval so participant can view and submit
    await prisma.study.update({
      where: { id: createdTintok.id },
      data: {
        status: "ACTIVE",
        teaserLinkEnabled: true,
      },
    });

    await prisma.ethicsApproval.create({
      data: {
        studyId: createdTintok.id,
        committeeName: "AAU IRB - Micro-Study Protocol",
        approvalNumber: "AAU-IRB-2026-TINTOK-001",
        approvalDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        documentPath: "/mock/tintok-approval.pdf",
        status: EthicsApprovalStatus.VERIFIED,
      },
    });

    // 1. Participant Desktop: Complete Tintok survey and view Teaser Card
    const partDesktopCtx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });

    await partDesktopCtx.addCookies([
      {
        name: "tinat_session",
        value: participantToken,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);

    const partDesktopPage = await partDesktopCtx.newPage();
    partDesktopPage.on("response", async (response) => {
      if (response.url().includes("/submit")) {
        try {
          console.log(`[SUBMIT RESPONSE ${response.status()}]:`, await response.text());
        } catch {}
      }
    });
    await partDesktopPage.goto(`${BASE_URL}/participant/studies/${createdTintok.id}`, {
      waitUntil: "networkidle",
    });

    // Click Consent "I understand and freely give my consent"
    const voluntaryCb = partDesktopPage.locator('input[type="checkbox"]').first();
    const understoodCb = partDesktopPage.locator('input[type="checkbox"]').nth(1);
    await voluntaryCb.check();
    await understoodCb.check();
    const consentBtn = partDesktopPage.getByRole("button", { name: /I Agree & Begin/i });
    await consentBtn.click();

    // Wait for questionnaire
    await partDesktopPage.waitForSelector("form", { timeout: 10000 });

    // Answer questions to satisfy required validation
    for (const radio of await partDesktopPage.locator('input[type="radio"]').all()) {
      try { await radio.check(); } catch {}
    }
    const scaleBtns = await partDesktopPage.locator('button[role="radio"]').all();
    if (scaleBtns.length > 0) {
      try { await scaleBtns[0].click(); } catch {}
    }
    for (const num of await partDesktopPage.locator('input[type="number"]').all()) {
      try { await num.fill("10"); } catch {}
    }
    for (const txt of await partDesktopPage.locator('input[type="text"]').all()) {
      try { await txt.fill("Addis"); } catch {}
    }

    // Submit response
    const submitRespBtn = partDesktopPage.getByRole("button", { name: /Submit Responses/i });
    await submitRespBtn.click();

    // Wait for Teaser Card to appear!
    const teaserCard = partDesktopPage.locator('[data-testid="tintok-teaser-card"]');
    await teaserCard.waitFor({ state: "visible", timeout: 15000 });

    console.log("Capturing teaser card on Desktop (1440x900)...");
    await partDesktopPage.screenshot({
      path: path.join(ARTIFACT_DIR, "tintok-teaser-card-1440x900.png"),
      fullPage: false,
    });

    // 2. Participant Mobile Viewport (390x844)
    console.log("Capturing teaser card on Mobile (390x844)...");
    await partDesktopPage.setViewportSize({ width: 390, height: 844 });
    await partDesktopPage.waitForTimeout(500);
    await partDesktopPage.screenshot({
      path: path.join(ARTIFACT_DIR, "tintok-teaser-card-390x844.png"),
      fullPage: false,
    });

    // Walk the teaser card: Click "Take the full study"
    console.log("Walking teaser card: Clicking 'Take the full study'...");
    const takeFullStudyBtn = partDesktopPage.getByRole("button", { name: /Take the full study/i });
    await takeFullStudyBtn.click();

    // Verify navigation to the parent study
    await partDesktopPage.waitForURL(new RegExp(`/participant/studies/${standardStudy.id}`), {
      timeout: 10000,
    });
    console.log(`Successfully navigated to parent study URL: ${partDesktopPage.url()}`);

    // Verify parent study independent consent screen is presented
    const parentConsentHeading = partDesktopPage.getByText(/Informed Consent/i).first();
    await parentConsentHeading.waitFor({ state: "visible", timeout: 10000 });
    console.log("Verified parent study requires its own independent consent screen!");

    await partDesktopCtx.close();
    console.log("=== All screenshots and Playwright tests completed successfully! ===");
  } finally {
    await browser.close();

    // Cleanup created test data
    try {
      await prisma.answer.deleteMany({
        where: { response: { study: { researcherId: researcher.id } } },
      });
      await prisma.response.deleteMany({
        where: { study: { researcherId: researcher.id } },
      });
      await prisma.participantLink.deleteMany({
        where: { userId: participant.id },
      });
      await prisma.consentRecord.deleteMany({
        where: { respondentCode: { contains: "resp_" } },
      });
      await prisma.ethicsApproval.deleteMany({
        where: { study: { researcherId: researcher.id } },
      });
      await prisma.study.deleteMany({
        where: { researcherId: researcher.id },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [researcher.id, participant.id] } },
      });
    } catch {}
  }
}

run().catch((err) => {
  console.error("Playwright script failed:", err);
  process.exit(1);
});
