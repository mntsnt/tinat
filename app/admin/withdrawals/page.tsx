import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import WithdrawalActions from "./WithdrawalActions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { getButtonClasses } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { formatCredits, CREDITS_DISCLAIMER } from "@/lib/config/features";
import { AlertCircle, ShieldAlert } from "lucide-react";

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
    include: {
      user: { select: { name: true, email: true, phone: true, institution: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const pendingCount = withdrawals.filter((w) => w.status === "PENDING").length;

  return (
    <div className="container mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-7 md:py-8">
      <div className="mb-6">
        <Link href="/admin" className={getButtonClasses("ghost", "md", "-ml-4 mb-4")}>
          &larr; Back to Admin Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Withdrawal Requests (Read-Only)</h1>
            <p className="text-muted-foreground mt-1">Historical participant withdrawal records. Disbursals are currently paused.</p>
          </div>
          <Badge variant="warning" className="text-sm px-3 py-1">
            {pendingCount} Pending
          </Badge>
        </div>
      </div>

      {/* Paused Notice Banner */}
      <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold block text-sm mb-0.5 text-foreground">
            Disbursements and Payouts Are Paused
          </span>
          Per ADR 0001, external payment gateways and fiat withdrawals are disabled. This screen displays historical withdrawal records for compliance and accounting auditing. {CREDITS_DISCLAIMER}
        </div>
      </div>

      {withdrawals.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="mb-2 text-xl font-semibold text-foreground">No records found</h3>
            <p className="text-muted-foreground">There are no historical withdrawal records in the system.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id} className="flex flex-col border-border">
              <CardHeader className="bg-muted/30 border-b border-border pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant={withdrawal.status === "APPROVED" ? "success" : withdrawal.status === "PENDING" ? "warning" : "secondary"}>
                    {withdrawal.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">
                    {withdrawal.createdAt.toLocaleDateString()}
                  </span>
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {formatCredits(withdrawal.amount)}
                </CardTitle>
                <CardDescription className="text-foreground font-medium break-all">
                  Method: {withdrawal.method} • Acc: {withdrawal.accountInfo}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pt-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">User</span>
                    <div className="font-medium text-foreground">{withdrawal.user.name}</div>
                    <div className="text-muted-foreground text-xs">{withdrawal.user.email}</div>
                  </div>
                  
                  {(withdrawal.user.phone || withdrawal.user.institution) && (
                    <div className="pt-2 border-t border-border text-xs">
                      {withdrawal.user.phone && (
                        <div className="mb-1"><span className="text-muted-foreground">Phone:</span> {withdrawal.user.phone}</div>
                      )}
                      {withdrawal.user.institution && (
                        <div><span className="text-muted-foreground">Institution:</span> {withdrawal.user.institution}</div>
                      )}
                    </div>
                  )}
                </div>
                <WithdrawalActions status={withdrawal.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
