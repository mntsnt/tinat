import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import WithdrawalActions from "./WithdrawalActions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { getButtonClasses } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

export default async function AdminWithdrawalsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!admin || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const withdrawals = await prisma.withdrawal.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { name: true, email: true, phone: true, institution: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-5xl">
      <div className="mb-8">
        <Link href="/admin" className={getButtonClasses("ghost", "md", "-ml-4 mb-4")}>
          &larr; Back to Admin Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Withdrawal Requests</h1>
            <p className="text-muted-foreground mt-1">Review and process participant payout requests.</p>
          </div>
          <Badge variant="warning" className="text-sm px-3 py-1">
            {withdrawals.length} Pending
          </Badge>
        </div>
      </div>

      {withdrawals.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="mb-2 text-xl font-semibold text-foreground">All caught up!</h3>
            <p className="text-muted-foreground">There are no pending withdrawal requests at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id} className="flex flex-col border-amber-200 dark:border-amber-900/50">
              <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900/30 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={withdrawal.method === "TELEBIRR" ? "success" : "secondary"}>
                    {withdrawal.method}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">
                    {withdrawal.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {withdrawal.amount} <span className="text-base font-normal text-muted-foreground">TC</span>
                </CardTitle>
                <CardDescription className="text-foreground font-medium break-all">
                  Acc: {withdrawal.accountInfo}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pt-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">User</span>
                    <div className="font-medium text-foreground">{withdrawal.user.name}</div>
                    <div className="text-muted-foreground">{withdrawal.user.email}</div>
                  </div>
                  
                  {(withdrawal.user.phone || withdrawal.user.institution) && (
                    <div className="pt-3 border-t border-border">
                      {withdrawal.user.phone && (
                        <div className="mb-1"><span className="text-muted-foreground">Phone:</span> {withdrawal.user.phone}</div>
                      )}
                      {withdrawal.user.institution && (
                        <div><span className="text-muted-foreground">Institution:</span> {withdrawal.user.institution}</div>
                      )}
                    </div>
                  )}
                </div>
                <WithdrawalActions withdrawalId={withdrawal.id} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
