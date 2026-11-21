import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { formatCredits } from "@/lib/config/features";
import { checkIsUserCollector } from "@/lib/collector/status";
import { InteractiveWalletCard } from "./InteractiveWalletCard";
import {
  Wallet,
  ArrowRight,
  Sparkles,
  ArrowUpRight,
  ClipboardList,
  ShieldCheck,
  CheckCircle2,
  Coins,
  CreditCard,
  Wifi,
  History,
  TrendingUp,
  Banknote,
  Gift,
  ChevronRight,
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
          transactions: { orderBy: { createdAt: "desc" }, take: 15 },
        },
      },
      participantLinks: {
        include: {
          study: {
            select: {
              id: true,
              title: true,
              rewardCredits: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user || (user.role !== "PARTICIPANT" && user.role !== "DATA_COLLECTOR")) {
    redirect("/dashboard");
  }

  // Check if user is a field data collector
  const isCollectorStatus =
    user.role === "DATA_COLLECTOR" ||
    (await checkIsUserCollector(user.id));

  // Field collector statistics (if applicable)
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
          },
        },
      },
    }),
    prisma.response.groupBy({
      by: ["studyId"],
      where: { collectorId: user.id },
      _count: { id: true },
    }),
    prisma.collectorPayout.findMany({
      where: { collectorUserId: user.id },
      select: { amountCents: true },
    }),
  ]);

  const responsesMap = new Map<string, number>();
  let totalResponsesCollected = 0;
  for (const group of collectedResponsesGrouped) {
    responsesMap.set(group.studyId, group._count.id);
    totalResponsesCollected += group._count.id;
  }

  let totalEarnedEtbCents = 0;
  for (const assignment of assignedStudies) {
    const s = assignment.study;
    const count = responsesMap.get(s.id) || 0;
    if (s.collectorPayType === "FIXED") {
      totalEarnedEtbCents += count > 0 ? s.collectorPayRateCents : 0;
    } else if (s.collectorPayType === "PER_RESPONSE") {
      totalEarnedEtbCents += count * s.collectorPayRateCents;
    }
  }

  const totalPaidEtbCents = collectorPayouts.reduce((sum, p) => sum + p.amountCents, 0);
  const pendingEtbCents = Math.max(0, totalEarnedEtbCents - totalPaidEtbCents);

  const isCollector =
    isCollectorStatus ||
    assignedStudies.length > 0 ||
    totalResponsesCollected > 0 ||
    collectorPayouts.length > 0;

  // Participant Wallet metrics
  const balance = user.wallet?.balance ?? 0;
  const transactions = user.wallet?.transactions ?? [];

  const totalEarnedCredits = transactions
    .filter((tx) => tx.type === "EARN" || tx.type === "REFUND" || tx.type === "REWARD_CREDIT")
    .reduce((total, tx) => total + tx.amount, 0);

  const cardMemberId = user.id.slice(-4).toUpperCase();

  return (
    <div className="w-full px-4 py-6 md:px-7 md:py-8 space-y-8 max-w-6xl mx-auto">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link href="/participant" className="hover:text-foreground transition-colors">
              Participant
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Wallet &amp; Card</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            My Wallet
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/participant/studies"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Earn Credits
          </Link>
          {isCollector && (
            <Link
              href="/collector/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
              Field Portal
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Mastercard Virtual Card & Balance Hub */}
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Interactive 3D Mastercard-Style Virtual Card */}
        <div className="lg:col-span-5 flex justify-center lg:justify-start">
          <InteractiveWalletCard
            balance={balance}
            cardMemberId={cardMemberId}
            userName={user.name}
            isCollector={isCollector}
          />
        </div>

        {/* Right Column: Minimal Balance Summary & Quick Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
                <Coins className="w-3.5 h-3.5 text-emerald-500" />
                <span>Available TC</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {formatCredits(balance)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Participation credits
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span>Lifetime Earned</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {formatCredits(totalEarnedCredits)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Total study rewards
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 shadow-2xs">
              <div className="flex items-center gap-2 text-muted-foreground mb-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                <span>Submissions</span>
              </div>
              <p className="text-xl font-bold text-foreground">
                {user.participantLinks.length}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Completed studies
              </p>
            </div>
          </div>

          {/* Active Field Collector Compensation Bar (if collector) */}
          {isCollector && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 text-white">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">
                      Field Enumerator Accruals
                    </p>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      ETB Birr
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Accrued: <span className="font-bold text-foreground">{(pendingEtbCents / 100).toFixed(2)} ETB</span> &bull; {totalResponsesCollected} door-to-door surveys submitted.
                  </p>
                </div>
              </div>
              <Link
                href="/collector/dashboard"
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
              >
                Collection tasks &rarr;
              </Link>
            </div>
          )}

          {/* Quick Info & Action Bar */}
          <div className="rounded-xl border border-border bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Rewards are automatically deposited upon verified questionnaire completion.
              </span>
            </div>
            <Link
              href="/participant/studies"
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline shrink-0"
            >
              Browse active studies <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Minimal Transaction Ledger */}
      <Card className="border border-border/80">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              Recent Reward Activity
            </CardTitle>
            <CardDescription className="text-xs">
              Ledger of credits earned from research studies and field surveys.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <Coins className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No reward transactions yet</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Participate in verified health research surveys to earn credits on your card.
              </p>
              <Link
                href="/participant/studies"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Browse Studies
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx) => {
                const isPositive =
                  tx.type === "EARN" ||
                  tx.type === "REFUND" ||
                  tx.type === "REWARD_CREDIT" ||
                  tx.type === "ADMIN_ADJUSTMENT";

                return (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div className={`p-2 rounded-lg shrink-0 ${isPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {tx.reason || (isPositive ? "Research Study Reward" : "Credit Adjustment")}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {tx.createdAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-sm font-bold font-mono ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                        {isPositive ? "+" : "-"}
                        {formatCredits(tx.amount)} TC
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
