import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { getButtonClasses } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { formatCredits } from "@/lib/config/features";
import { Coins } from "lucide-react";

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

  if (!user || user.role !== "PARTICIPANT") {
    redirect("/dashboard");
  }

  const balance = user.wallet?.balance ?? 0;
  const transactions = user.wallet?.transactions ?? [];

  const totalEarned = transactions
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
    <div className="container mx-auto max-w-7xl px-4 py-6 md:px-7 md:py-8">
      <div className="mb-6">
        <Link href="/participant" className={getButtonClasses("ghost", "md", "-ml-4 mb-4")}>
          &larr; Back to Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Coins className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Tinat Credits Wallet</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-10">
        <Card className="md:col-span-1 bg-card border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available Credits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-foreground">
              {formatCredits(balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Earned for participating in verified research studies.
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
                <span className="text-2xl font-bold text-foreground">{formatCredits(totalEarned)}</span>
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
          <CardTitle>Transaction History</CardTitle>
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
                const isPositive = tx.type === "EARN" || tx.type === "REFUND" || tx.type === "REWARD_CREDIT" || tx.type === "ADMIN_ADJUSTMENT";
                return (
                  <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-col mb-2 sm:mb-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTransactionBadge(tx.type)}
                        <span className="text-xs text-muted-foreground">
                          {tx.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      {tx.reason && <p className="text-sm font-medium text-foreground">{tx.reason}</p>}
                    </div>
                    <div className={`text-base font-bold ${isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                      {isPositive ? "+" : "-"}{formatCredits(tx.amount)}
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
