import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Button, getButtonClasses } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

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
    .filter((tx) => tx.type === "EARN" || tx.type === "REFUND")
    .reduce((total, tx) => total + tx.amount, 0);

  const totalWithdrawn = transactions
    .filter((tx) => tx.type === "WITHDRAW")
    .reduce((total, tx) => total + tx.amount, 0);

  function formatTransactionType(type: string) {
    switch (type) {
      case "EARN": return "Earned";
      case "SPEND": return "Spent";
      case "WITHDRAW": return "Withdrawal";
      case "REFUND": return "Refund";
      case "ADJUSTMENT": return "Adjustment";
      default: return type;
    }
  }

  function getTransactionBadge(type: string) {
    if (type === "EARN" || type === "REFUND") return <Badge variant="success">{formatTransactionType(type)}</Badge>;
    if (type === "WITHDRAW" || type === "SPEND") return <Badge variant="warning">{formatTransactionType(type)}</Badge>;
    return <Badge variant="secondary">{formatTransactionType(type)}</Badge>;
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <Link href="/participant" className={getButtonClasses("ghost", "md", "-ml-4 mb-4")}>
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Wallet</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-10">
        <Card className="md:col-span-1 bg-primary text-primary-foreground border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {balance} <span className="text-xl font-normal text-muted-foreground">TC</span>
            </div>
            <div className="mt-6">
              <Link href="/participant/wallet/withdraw" className="block w-full">
                <Button className="w-full bg-card text-foreground hover:bg-muted">
                  Withdraw Credits
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Credit Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="flex flex-col p-4 bg-muted/50 rounded-lg border border-border">
                <span className="text-sm text-muted-foreground mb-1">Total Earned</span>
                <span className="text-2xl font-bold text-foreground">{totalEarned} TC</span>
              </div>
              <div className="flex flex-col p-4 bg-muted/50 rounded-lg border border-border">
                <span className="text-sm text-muted-foreground mb-1">Total Withdrawn</span>
                <span className="text-2xl font-bold text-foreground">{totalWithdrawn} TC</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>A record of all your earnings and withdrawals.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              You don't have any transactions yet.
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => {
                const isPositive = tx.type === "EARN" || tx.type === "REFUND" || tx.type === "ADJUSTMENT";
                return (
                  <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-col mb-2 sm:mb-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getTransactionBadge(tx.type)}
                        <span className="text-sm text-muted-foreground">
                          {tx.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                      {tx.reason && <p className="text-sm font-medium text-foreground">{tx.reason}</p>}
                    </div>
                    <div className={`text-lg font-bold ${isPositive ? "text-success" : "text-amber-600"}`}>
                      {isPositive ? "+" : "-"}{tx.amount} TC
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
