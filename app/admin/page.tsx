import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { getButtonClasses } from "../components/ui/Button";
import { Users, BookOpen, Activity, CreditCard, TrendingUp, Clock, CheckCircle } from "lucide-react";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const [
    totalUsers,
    totalParticipants,
    totalResearchers,
    totalStudies,
    draftStudies,
    activeStudies,
    completedStudies,
    totalResponses,
    pendingWithdrawals,
    totalWithdrawals,
    walletTotals,
    recentLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "PARTICIPANT" } }),
    prisma.user.count({ where: { role: "RESEARCHER" } }),
    prisma.study.count(),
    prisma.study.count({ where: { status: "DRAFT" } }),
    prisma.study.count({ where: { status: "ACTIVE" } }),
    prisma.study.count({ where: { status: "COMPLETED" } }),
    prisma.response.count(),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.withdrawal.count(),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, role: true } } },
    }),
  ]);

  const totalCredits = walletTotals._sum.balance ?? 0;

  const statCards = [
    {
      label: "Total Users",
      value: totalUsers,
      sub: `${totalParticipants} participants · ${totalResearchers} researchers`,
      icon: <Users className="w-5 h-5" />,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    },
    {
      label: "Active Studies",
      value: activeStudies,
      sub: `${draftStudies} draft · ${completedStudies} completed`,
      icon: <BookOpen className="w-5 h-5" />,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
    },
    {
      label: "Total Responses",
      value: totalResponses,
      sub: `Across ${totalStudies} studies`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400",
    },
    {
      label: "Pending Withdrawals",
      value: pendingWithdrawals,
      sub: `${totalWithdrawals} total requests`,
      icon: <CreditCard className="w-5 h-5" />,
      color:
        pendingWithdrawals > 0
          ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
          : "text-muted-foreground bg-muted",
      urgent: pendingWithdrawals > 0,
    },
  ];

  function actionLabel(action: string) {
    return action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  }

  function roleColor(role: string) {
    if (role === "ADMIN") return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
    if (role === "RESEARCHER") return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300";
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 md:py-10 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide metrics and quick actions</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((card) => (
          <Card
            key={card.label}
            className={card.urgent ? "border-amber-300 dark:border-amber-700 shadow-amber-100 dark:shadow-none" : ""}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold text-foreground leading-none">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{card.sub}</p>
                </div>
                <div className={`p-2.5 rounded-xl flex-shrink-0 ${card.color}`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* System Economy */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System Economy</CardTitle>
            <CardDescription>Credits circulating across all wallets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border bg-gradient-to-br from-muted/60 to-muted/20 p-6 text-center">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Total Credits in Wallets
              </p>
              <p className="text-4xl font-bold text-foreground">
                {totalCredits.toLocaleString()}
                <span className="text-lg text-muted-foreground font-normal ml-1">TC</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Jump to administrative tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/admin/withdrawals"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/60 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Withdrawal Management</p>
                <p className="text-xs text-muted-foreground">Process payout requests</p>
              </div>
              {pendingWithdrawals > 0 && (
                <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                  {pendingWithdrawals}
                </span>
              )}
            </Link>
            <Link
              href="/admin/studies"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/60 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Manage Studies</p>
                <p className="text-xs text-muted-foreground">Monitor & control research</p>
              </div>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/60 transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">User Management</p>
                <p className="text-xs text-muted-foreground">View and manage all users</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Activity</CardTitle>
              <CardDescription>Latest platform events</CardDescription>
            </div>
            <Link
              href="/admin/logs"
              className={getButtonClasses("outline", "sm")}
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No activity yet
              </div>
            ) : (
              <div className="space-y-3">
                {recentLogs.map((log: { id: string; action: string; createdAt: Date; user?: { name: string; role: string } | null }) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-foreground">{log.user?.name ?? "System"}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${roleColor(log.user?.role ?? "")}`}>
                          {log.user?.role ?? ""}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{actionLabel(log.action)}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}