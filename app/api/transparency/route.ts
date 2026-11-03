import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CREDITS_DISCLAIMER } from "@/lib/config/features";

export async function GET() {
  try {
    const totalStudies = await prisma.study.count();
    const fundedStudies = await prisma.study.count({ where: { fundingType: "FUNDED" } });
    const freeStudies = await prisma.study.count({ where: { fundingType: "FREE" } });
    const activeStudies = await prisma.study.count({ where: { status: "ACTIVE" } });

    const totalParticipants = await prisma.user.count({ where: { role: "PARTICIPANT" } });
    const totalResponses = await prisma.response.count();

    // Ledger TC issuance aggregates
    const creditSums = await prisma.study.aggregate({
      _sum: {
        creditsSpent: true,
        creditBudget: true,
      },
    });

    const totalEthicsApprovals = await prisma.ethicsApproval.count();
    const verifiedEthicsApprovals = await prisma.ethicsApproval.count({
      where: { status: "VERIFIED" },
    });
    const ethicsExemptions = await prisma.study.count({
      where: { ethicsExempt: true },
    });

    const totalReports = await prisma.moderationReport.count();
    const resolvedReports = await prisma.moderationReport.count({
      where: { status: "RESOLVED" },
    });
    const takedownsCount = await prisma.activityLog.count({
      where: { action: "STUDY_MODERATION_TAKEDOWN" },
    });

    // Recent Advisory Board Decisions
    const boardDecisions = await prisma.ethicsBoardDecision.findMany({
      orderBy: { publishedAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      studies: {
        total: totalStudies,
        active: activeStudies,
        funded: fundedStudies,
        free: freeStudies,
      },
      participation: {
        totalParticipants,
        totalResponses,
      },
      economy: {
        totalCreditsIssued: creditSums._sum.creditsSpent || 0,
        totalCreditBudgetAllocated: creditSums._sum.creditBudget || 0,
        currencyUnit: "TC (Tinat Credits)",
        disclaimer: CREDITS_DISCLAIMER,
      },
      ethics: {
        totalSubmitted: totalEthicsApprovals,
        verified: verifiedEthicsApprovals,
        exemptionsGranted: ethicsExemptions,
      },
      moderation: {
        totalReports,
        resolvedReports,
        takedownsCount,
        slaTargetDays: 7,
      },
      governanceDecisions: boardDecisions,
      regulatoryCompliance: {
        dataProtectionProclamation: "Ethiopian Personal Data Protection Proclamation No. 1321/2024",
        deIdentificationStandard: "K-anonymity suppressed categories (<5), respondentCode decoupling, age banding",
        financialCompliance: "Zero-cash token economy; no payment gateway integration; no money withdrawals",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate transparency report" },
      { status: 500 }
    );
  }
}
