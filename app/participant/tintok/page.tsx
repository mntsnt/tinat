import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPlatformConsent } from "@/lib/legal/consentService";
import { TinTokFeedClient, TintokStudyItem } from "./TinTokFeedClient";

export const metadata = {
  title: "TinTok Micro-Studies | Tinat Health Research",
  description: "Card-style micro-surveys for quick health insights.",
};

export default async function TinTokPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?redirect=/participant/tintok");
  }

  const consent = await checkPlatformConsent(session.userId);
  if (!consent.hasValidConsent) {
    redirect("/agreement?redirect=/participant/tintok");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      participantLinks: true,
    },
  });

  if (!user || user.role !== "PARTICIPANT") {
    redirect("/dashboard");
  }

  if (!user.isVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(user.email)}`);
  }

  // 1. Fetch active TinTok studies with valid ethics approval
  const rawStudies = await prisma.study.findMany({
    where: {
      format: "TINTOK",
      status: "ACTIVE",
      ethicsApproval: {
        status: "VERIFIED",
        expiryDate: { gt: new Date() },
      },
    },
    include: {
      researcher: {
        select: {
          id: true,
          name: true,
          institution: true,
          isVerified: true,
          avatarUrl: true,
        },
      },
      questions: {
        include: {
          options: { orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      },
      consentForms: {
        take: 1,
        orderBy: { version: "desc" },
      },
      parentStudy: {
        select: {
          id: true,
          title: true,
          status: true,
          estimatedMinutes: true,
          rewardCredits: true,
          fundingType: true,
          ethicsApproval: {
            select: { status: true, expiryDate: true },
          },
        },
      },
      _count: {
        select: { responses: true, questions: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Identify studies the user completed
  const completedStudyIds = new Set(user.participantLinks.map((l) => l.studyId));

  // 3. Filter eligible studies (exclude completed, cross-mode excluded, and exhausted budget)
  const eligibleStudies: TintokStudyItem[] = [];

  for (const s of rawStudies) {
    // Already completed this Tintok study
    if (completedStudyIds.has(s.id)) continue;

    // Cross-mode exclusion: if user completed parent standard study
    if (s.parentStudyId && completedStudyIds.has(s.parentStudyId)) continue;

    // Target reached
    if (s.participantTarget > 0 && s._count.responses >= s.participantTarget) continue;

    // Budget exhausted (for funded studies)
    const isFunded = s.fundingType === "FUNDED" || s.rewardCredits > 0;
    const remaining = s.budgetCredits - s.creditsPaid;
    if (isFunded && s.rewardCredits > 0 && remaining < s.rewardCredits) continue;

    // Check if user already consented to this study
    const userLink = user.participantLinks.find((l) => l.studyId === s.id);
    let hasConsented = false;
    if (userLink && s.consentForms[0]) {
      const consentRecord = await prisma.consentRecord.findFirst({
        where: {
          consentFormId: s.consentForms[0].id,
          respondentCode: userLink.respondentCode,
          withdrawnAt: null,
        },
      });
      hasConsented = Boolean(consentRecord);
    }

    eligibleStudies.push({
      id: s.id,
      title: s.title,
      description: s.description,
      objective: s.objective,
      category: s.category,
      estimatedMinutes: s.estimatedMinutes,
      fundingType: s.fundingType,
      rewardCredits: s.rewardCredits,
      participantTarget: s.participantTarget,
      researcher: s.researcher,
      questions: s.questions.map((q) => ({
        id: q.id,
        order: q.order,
        text: q.text,
        type: q.type,
        required: q.required,
        scaleMin: q.scaleMin,
        scaleMax: q.scaleMax,
        scaleMinLabel: q.scaleMinLabel,
        scaleMaxLabel: q.scaleMaxLabel,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          value: o.value,
          order: o.order,
        })),
      })),
      consentForms: s.consentForms.map((c) => ({
        id: c.id,
        version: c.version,
      })),
      parentStudy: s.parentStudy
        ? {
            id: s.parentStudy.id,
            title: s.parentStudy.title,
            status: s.parentStudy.status,
            estimatedMinutes: s.parentStudy.estimatedMinutes,
            rewardCredits: s.parentStudy.rewardCredits,
            fundingType: s.parentStudy.fundingType,
          }
        : null,
      teaserLinkEnabled: Boolean(s.teaserLinkEnabled),
      hasConsented,
    });
  }

  return <TinTokFeedClient studies={eligibleStudies} currentUserId={session.userId} />;
}
