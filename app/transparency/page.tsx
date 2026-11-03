import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CREDITS_DISCLAIMER } from "@/lib/config/features";
import {
  ShieldCheck,
  Scale,
  Users,
  Coins,
  FileCheck,
  CheckCircle2,
  ArrowLeft,
  Building,
  Flag,
} from "lucide-react";
import { Button } from "../components/ui/Button";

export const revalidate = 60; // Revalidate every minute

export default async function PublicTransparencyPage() {
  const totalStudies = await prisma.study.count();
  const fundedStudies = await prisma.study.count({ where: { fundingType: "FUNDED" } });
  const freeStudies = await prisma.study.count({ where: { fundingType: "FREE" } });
  const activeStudies = await prisma.study.count({ where: { status: "ACTIVE" } });

  const totalParticipants = await prisma.user.count({ where: { role: "PARTICIPANT" } });
  const totalResponses = await prisma.response.count();

  const creditSums = await prisma.study.aggregate({
    _sum: {
      creditsSpent: true,
      creditBudget: true,
    },
  });

  const verifiedEthics = await prisma.ethicsApproval.count({ where: { status: "VERIFIED" } });
  const ethicsExemptions = await prisma.study.count({ where: { ethicsExempt: true } });

  const totalReports = await prisma.moderationReport.count();
  const resolvedReports = await prisma.moderationReport.count({ where: { status: "RESOLVED" } });

  const boardDecisions = await prisma.ethicsBoardDecision.findMany({
    orderBy: { publishedAt: "desc" },
    take: 5,
  });

  const boardMembers = await prisma.ethicsBoardMember.findMany({
    where: { isActive: true },
    orderBy: { appointedAt: "asc" },
  });

  return (
    <div className="container mx-auto px-4 py-12 md:py-16 max-w-5xl space-y-12">
      <div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 text-xs mb-6 -ml-3">
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Button>
        </Link>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-3">
          <Scale className="w-3.5 h-3.5" />
          Public Accountability & Governance
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Tinat Transparency Report
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">
          Open operational metrics regarding health research studies, participant safety safeguards,
          ethics review gating, and platform token accounting under Ethiopian Proclamation No. 1321/2024.
        </p>
      </div>

      {/* Main Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Research Studies</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-foreground">{totalStudies}</div>
          <div className="text-xs text-muted-foreground">
            {activeStudies} Active &bull; {fundedStudies} Funded &bull; {freeStudies} Free
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Total Participants</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-foreground">{totalParticipants.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">
            {totalResponses.toLocaleString()} completed research answers
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Ethics Approvals</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-foreground">{verifiedEthics}</div>
          <div className="text-xs text-muted-foreground">
            {ethicsExemptions} documented minimal-risk exemptions
          </div>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Credits Issued</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold text-foreground">
            {(creditSums._sum.creditsSpent || 0).toLocaleString()} TC
          </div>
          <div className="text-xs text-muted-foreground">
            0 ETB cash value (Internal tokens only)
          </div>
        </div>
      </div>

      {/* Regulatory & Safety Invariants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            Data Protection Safeguards (Proclamation 1321/2024)
          </h3>
          <ul className="text-xs space-y-2 text-muted-foreground leading-relaxed">
            <li>
              <strong>Respondent Code Separation:</strong> Research answers are strictly decoupled from participant accounts and National ID (Fayda) hashes.
            </li>
            <li>
              <strong>Automated De-identification:</strong> Direct identifiers and IP hashes are purged from export datasets; rare categories (&lt;5 respondents) are suppressed.
            </li>
            <li>
              <strong>Participant Withdrawal:</strong> Participants can stop at any time; partial responses are automatically purged upon withdrawal.
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl border border-border bg-card space-y-3">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-600" />
            Financial Consumer Protection Policy
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {CREDITS_DISCLAIMER}
          </p>
          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-xs text-emerald-800 dark:text-emerald-300">
            &#10003; <strong>Zero Real-Money Risk:</strong> All external payment gateways (Chapa, Telebirr, CBE) remain disabled behind verified feature flags. Tinat does not accept cash deposits or execute fiat payouts.
          </div>
        </div>
      </div>

      {/* Moderation & Governance SLAs */}
      <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Flag className="w-5 h-5 text-amber-600" />
              Community Moderation & Reporting Queue
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reports submitted by participants are triaged under our 7-day governance SLA.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
            7-Day SLA
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl border border-border bg-muted/20">
            <span className="text-muted-foreground block">Total Reports Received:</span>
            <span className="text-lg font-bold text-foreground">{totalReports}</span>
          </div>
          <div className="p-3 rounded-xl border border-border bg-muted/20">
            <span className="text-muted-foreground block">Resolved & Documented:</span>
            <span className="text-lg font-bold text-emerald-600">{resolvedReports}</span>
          </div>
          <div className="p-3 rounded-xl border border-border bg-muted/20">
            <span className="text-muted-foreground block">Resolution Compliance:</span>
            <span className="text-lg font-bold text-foreground">
              {totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 100}%
            </span>
          </div>
        </div>
      </div>

      {/* Ethics Advisory Board Decisions */}
      {boardDecisions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-600" />
            Recent Ethics Advisory Board Resolutions
          </h3>

          <div className="space-y-3">
            {boardDecisions.map((decision) => (
              <div key={decision.id} className="p-4 rounded-xl border border-border bg-card text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground text-sm">{decision.title}</h4>
                  <span className="text-muted-foreground">
                    Meeting: {new Date(decision.meetingDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-muted-foreground">{decision.summary}</p>
                <div className="pt-1 font-medium text-emerald-700 dark:text-emerald-400">
                  Resolution: {decision.resolution}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
