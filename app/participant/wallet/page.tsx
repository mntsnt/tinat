import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { getButtonClasses } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { formatCredits } from "@/lib/config/features";
import { checkIsUserCollector } from "@/lib/collector/status";
import {
  Coins,
  Banknote,
  Wallet,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ClipboardList,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default async function ParticipantWalletPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      wallet: {
        include: {
          transactions: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!user || (user.role !== "PARTICIPANT" && user.role !== "DATA_COLLECTOR")) {
    redirect("/dashboard");
  }

  // Check if user is a field collector
  const isCollectorStatus =
    user.role === "DATA_COLLECTOR" ||
    (await checkIsUserCollector(user.id));

  // Load collector data (assignments, field responses, and settled ETB payouts)
  const [assignedStudies, collectedResponsesGrouped, collectorPayouts] = await Promise.all([
    prisma.studyDataCollector.findMany({
      where: { userId: user.id },
      include: {
        study: {
          select: {
            id: true,
            title: true,
            status: true,
            collectorPayType: true,
            collectorPayRateCents: true,
            researcher: { select: { name: true } },
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    }),
    prisma.response.groupBy({
      by: ["studyId"],
      where: { collectorId: user.id },
      _count: { id: true },
    }),
    prisma.collectorPayout.findMany({
      where: { collectorUserId: user.id },
      include: {
        study: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const responsesMap = new Map<string, number>();
  let totalResponsesCollected = 0;
  for (const group of collectedResponsesGrouped) {
    responsesMap.set(group.studyId, group._count.id);
    totalResponsesCollected += group._count.id;
  }

  // Calculate ETB earnings per study after starting field collection
  const studyEarnings = assignedStudies.map((assignment) => {
    const s = assignment.study;
    const responsesCount = responsesMap.get(s.id) || 0;
    let earnedCents = 0;
    if (s.collectorPayType === "FIXED") {
      // Fixed compensation activates once field collection has started (at least 1 response collected)
      earnedCents = responsesCount > 0 ? s.collectorPayRateCents : 0;
    } else if (s.collectorPayType === "PER_RESPONSE") {
      earnedCents = responsesCount * s.collectorPayRateCents;
    }
    return {
      studyId: s.id,
      title: s.title,
      researcherName: s.researcher?.name || "Researcher",
      status: s.status,
      payType: s.collectorPayType,
      payRateCents: s.collectorPayRateCents,
      responsesCount,
      earnedCents,
    };
  });

  const totalEarnedEtbCents = studyEarnings.reduce((sum, s) => sum + s.earnedCents, 0);
  const totalPaidEtbCents = collectorPayouts.reduce((sum, p) => sum + p.amountCents, 0);
  const pendingEtbCents = Math.max(0, totalEarnedEtbCents - totalPaidEtbCents);

  const isCollector =
    isCollectorStatus ||
    assignedStudies.length > 0 ||
    totalResponsesCollected > 0 ||
    collectorPayouts.length > 0;

  // Participant Tinat Credits (TC) metrics
  const balance = user.wallet?.balance ?? 0;
  const transactions = user.wallet?.transactions ?? [];

  const totalEarnedCredits = transactions
    .filter((tx) => tx.type === "EARN" || tx.type === "REFUND" || tx.type === "REWARD_CREDIT")
    .reduce((total, tx) => total + tx.amount, 0);

  function formatTransactionType(type: string) {
    switch (type) {
      case "REWARD_CREDIT":
      case "EARN":
        return "Reward";
      case "REFUND":
        return "Refund";
      case "ADMIN_ADJUSTMENT":
      case "ADJUSTMENT":
        return "Adjustment";
      case "SPEND":
        return "Spent";
      case "WITHDRAW":
        return "Archived";
      default:
        return type;
    }
  }

  function getTransactionBadge(type: string) {
    if (type === "EARN" || type === "REFUND" || type === "REWARD_CREDIT") {
      return <Badge variant="success">{formatTransactionType(type)}</Badge>;
    }
    if (type === "WITHDRAW" || type === "SPEND") {
      return <Badge variant="secondary">{formatTransactionType(type)}</Badge>;
    }
    return <Badge variant="secondary">{formatTransactionType(type)}</Badge>;
  }

  return (
    <div className="w-full px-4 py-6 md:px-7 md:py-8 space-y-10">
      {/* Header */}
      <div>
        <Link href="/participant" className={getButtonClasses("ghost", "md", "-ml-4 mb-4")}>
          &larr; Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Wallet className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">My Wallet</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your field data collection earnings and study participation rewards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isCollector && (
              <Badge className="bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs px-3 py-1 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Field Collector Active
              </Badge>
            )}
            <Badge variant="outline" className="text-xs px-3 py-1 font-semibold">
              Ethiopian Birr &bull; Tinat Credits
            </Badge>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DECK 1: FIELD DATA COLLECTION COMPENSATION (ETB)
          Shows the amount of ETB a participant has after starting field collection
         ───────────────────────────────────────────────────────────── */}
      {isCollector ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/[0.07] via-card to-card p-5 md:p-7 shadow-sm space-y-6">
          {/* Deck Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">Field Collection Compensation</h2>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                    ETB Wallet
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Real-money compensation accrued for gathering verified field responses on assigned studies.
                </p>
              </div>
            </div>

            <Link
              href="/collector/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition self-start sm:self-auto"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Field Collection Tasks</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* ETB Metrics Deck */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Accrued / Payable Balance */}
            <div className="p-4 rounded-xl bg-card border border-emerald-500/30 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
                Accrued Balance
              </span>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {(pendingEtbCents / 100).toFixed(2)}{" "}
                <span className="text-sm font-semibold text-muted-foreground">ETB</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Payable by researchers upon study verification.
              </p>
            </div>

            {/* Lifetime Earned */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
                Lifetime ETB Earned
              </span>
              <div className="text-3xl font-black text-foreground">
                {(totalEarnedEtbCents / 100).toFixed(2)}{" "}
                <span className="text-sm font-semibold text-muted-foreground">ETB</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Total compensation accrued from field surveys.
              </p>
            </div>

            {/* Total Paid Out */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
                Disbursed to Date
              </span>
              <div className="text-3xl font-black text-foreground">
                {(totalPaidEtbCents / 100).toFixed(2)}{" "}
                <span className="text-sm font-semibold text-muted-foreground">ETB</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                {collectorPayouts.length} settled payout disbursement(s).
              </p>
            </div>

            {/* Surveys Collected */}
            <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
                Surveys Collected
              </span>
              <div className="text-3xl font-black text-foreground">
                {totalResponsesCollected}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Across {assignedStudies.length} study assignment(s).
              </p>
            </div>
          </div>

          {/* Assigned Studies & Rate Deck */}
          <div className="bg-card rounded-xl border border-border p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Active Field Collection Assignments</h3>
                <p className="text-xs text-muted-foreground">
                  Compensation rates and accrued earnings per assigned research study.
                </p>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {studyEarnings.length} {studyEarnings.length === 1 ? "Study" : "Studies"}
              </span>
            </div>

            {studyEarnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
                <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                <p className="font-semibold text-foreground">No active study assignments yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Once assigned by a researcher, your collection compensation rates and progress will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {studyEarnings.map((study) => (
                  <div
                    key={study.studyId}
                    className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-foreground truncate">
                          {study.title}
                        </span>
                        <Badge
                          variant={study.status === "ACTIVE" ? "success" : "secondary"}
                          className="text-[10px] uppercase font-bold"
                        >
                          {study.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground/70" />
                        Researcher: Dr. {study.researcherName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 text-sm">
                      <div className="text-left md:text-right">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold block">
                          Compensation Rate
                        </span>
                        <span className="font-bold text-foreground text-xs sm:text-sm">
                          {study.payType === "FIXED"
                            ? `${(study.payRateCents / 100).toFixed(2)} ETB (Fixed)`
                            : `${(study.payRateCents / 100).toFixed(2)} ETB / response`}
                        </span>
                      </div>

                      <div className="text-left md:text-right">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold block">
                          Collected
                        </span>
                        <span className="font-bold text-foreground text-xs sm:text-sm">
                          {study.responsesCount} responses
                        </span>
                      </div>

                      <div className="text-left md:text-right min-w-[90px]">
                        <span className="text-[11px] text-muted-foreground uppercase font-semibold block">
                          Accrued ETB
                        </span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                          {(study.earnedCents / 100).toFixed(2)} ETB
                        </span>
                      </div>

                      <Link
                        href={`/collector/studies/${study.studyId}/collect`}
                        className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition flex-shrink-0"
                        title="Collect Responses"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settled ETB Payouts Deck */}
          {collectorPayouts.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4 md:p-5">
              <div className="mb-4">
                <h3 className="text-base font-bold text-foreground">Disbursed Field Payouts</h3>
                <p className="text-xs text-muted-foreground">
                  Official disbursement receipts verified and settled by study researchers.
                </p>
              </div>

              <div className="space-y-3">
                {collectorPayouts.map((payout) => (
                  <div
                    key={payout.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0 gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="success" className="text-[10px]">
                          Settled
                        </Badge>
                        <span className="text-xs font-mono font-medium text-foreground">
                          Ref: {payout.paymentReference}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          &bull; {payout.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Study: <span className="text-foreground font-medium">{payout.study?.title || "Research Study"}</span>
                      </p>
                    </div>

                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      +{(payout.amountCents / 100).toFixed(2)} ETB
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Invitation / Program Card for non-collectors */
        <div className="rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.03] p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                Field Data Collection Program (ETB)
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                  Earn Real Money
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                Participants who become data collectors can conduct in-person surveys on behalf of researchers and earn direct ETB cash compensation. When you are assigned as a collector and start field collection, your ETB wallet deck activates here.
              </p>
            </div>
          </div>
          <Link
            href="/collector/dashboard"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition whitespace-nowrap self-start md:self-auto"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Field Collection Portal</span>
          </Link>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DECK 2: RESEARCH PARTICIPATION CREDITS (TC)
          Platform-determined credits for survey participation
         ───────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Coins className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Tinat Credits (TC) Wallet</h2>
            <p className="text-xs text-muted-foreground">
              Standardized platform credits automatically awarded for completing research surveys.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 bg-card border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Available Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-foreground">
                {formatCredits(balance)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Standardized platform credits awarded for participating in verified research studies.
              </p>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Credit Recognition Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col p-4 bg-muted/50 rounded-lg border border-border">
                  <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                    Lifetime Earned
                  </span>
                  <span className="text-2xl font-bold text-foreground">{formatCredits(totalEarnedCredits)}</span>
                </div>
                <div className="flex flex-col p-4 bg-muted/50 rounded-lg border border-border">
                  <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">
                    Total Transactions
                  </span>
                  <span className="text-2xl font-bold text-foreground">{transactions.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Credit Transaction History</CardTitle>
            <CardDescription>A complete ledger record of all your earned study rewards.</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                You don&apos;t have any credit transactions yet. Complete funded research studies to earn credits.
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((tx) => {
                  const isPositive =
                    tx.type === "EARN" ||
                    tx.type === "REFUND" ||
                    tx.type === "REWARD_CREDIT" ||
                    tx.type === "ADMIN_ADJUSTMENT";
                  return (
                    <div
                      key={tx.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex flex-col mb-2 sm:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getTransactionBadge(tx.type)}
                          <span className="text-xs text-muted-foreground">
                            {tx.createdAt.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        {tx.reason && <p className="text-sm font-medium text-foreground">{tx.reason}</p>}
                      </div>
                      <div
                        className={`text-base font-bold ${
                          isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                        }`}
                      >
                        {isPositive ? "+" : "-"}
                        {formatCredits(tx.amount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
