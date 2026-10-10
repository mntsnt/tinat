import Link from "next/link";
import { redirect } from "next/navigation";
import os from "os";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Database,
  HeartPulse,
  Mail,
  Radio,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card";
import { AdminCharts } from "./AdminCharts";

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function integrationStatus(configured: boolean) {
  return configured ? "Configured" : "Not configured";
}

function isAnyKeySet(...keys: string[]) {
  return keys.some((key) => Boolean(process.env[key]));
}

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!admin || admin.role !== "ADMIN") redirect("/dashboard");

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const thirtyDaysAgo = new Date(startOfToday);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);
  const sixtyDaysAgo = new Date(thirtyDaysAgo);
  sixtyDaysAgo.setUTCDate(sixtyDaysAgo.getUTCDate() - 30);

  const [databaseHealth, systemInfo] = await Promise.all([
    (async () => {
      const startedAt = process.hrtime.bigint();
      try {
        await prisma.$queryRaw`SELECT 1`;
        const elapsedMilliseconds = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        return { status: "online" as const, latencyMs: Math.round(elapsedMilliseconds) };
      } catch (error) {
        console.error("Admin dashboard database health check failed:", error);
        return { status: "offline" as const, latencyMs: null };
      }
    })(),
    Promise.resolve({
      memory: process.memoryUsage(),
      uptimeSeconds: process.uptime(),
      loadAverage: os.loadavg(),
      cpuCores: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      runtimeVersion: process.version,
      platform: `${process.platform} / ${process.arch}`,
    }),
  ]);

  const [
    totalUsers,
    participantCount,
    researcherCount,
    adminCount,
    unverifiedAccounts,
    totalStudies,
    draftStudies,
    activeStudies,
    pausedStudies,
    completedStudies,
    totalResponses,
    responsesToday,
    pendingWithdrawals,
    pendingWithdrawalAmount,
    totalWithdrawals,
    pendingVerifications,
    verifiedAccounts,
    rejectedVerifications,
    suspendedVerifications,
    walletTotals,
    successfulPayments,
    failedPayments,
    activeCollectionSessions,
    recentLogs,
    dailyUsers,
    dailyStudies,
    dailyResponses,
    recentUsers,
    topStudies,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "PARTICIPANT" } }),
    prisma.user.count({ where: { role: "RESEARCHER" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { isVerified: false } }),
    prisma.study.count(),
    prisma.study.count({ where: { status: "DRAFT" } }),
    prisma.study.count({ where: { status: "ACTIVE" } }),
    prisma.study.count({ where: { status: "PAUSED" } }),
    prisma.study.count({ where: { status: "COMPLETED" } }),
    prisma.response.count(),
    prisma.response.count({ where: { submittedAt: { gte: startOfToday } } }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.withdrawal.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.withdrawal.count(),
    prisma.verification.count({ where: { status: "PENDING" } }),
    prisma.verification.count({ where: { status: "VERIFIED" } }),
    prisma.verification.count({ where: { status: "REJECTED" } }),
    prisma.verification.count({ where: { status: "SUSPENDED" } }),
    prisma.wallet.aggregate({ _sum: { balance: true } }),
    prisma.studyPayment.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.studyPayment.count({ where: { status: "FAILED" } }),
    prisma.collectionSession.count({ where: { status: "ACTIVE" } }),
    prisma.activityLog.findMany({
      take: 7,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, role: true } } },
    }),
    prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') AS day, COUNT(*) AS count
      FROM "User"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY day
    `,
    prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT TO_CHAR("createdAt", 'YYYY-MM-DD') AS day, COUNT(*) AS count
      FROM "Study"
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY day
    `,
    prisma.$queryRaw<Array<{ day: string; count: bigint }>>`
      SELECT TO_CHAR("submittedAt", 'YYYY-MM-DD') AS day, COUNT(*) AS count
      FROM "Response"
      WHERE "submittedAt" >= ${thirtyDaysAgo}
      GROUP BY day
    `,
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, role: true, createdAt: true },
    }),
    prisma.study.findMany({
      take: 5,
      where: { status: { in: ["ACTIVE", "PAUSED"] } },
      orderBy: { responses: { _count: "desc" } },
      select: {
        id: true,
        title: true,
        status: true,
        participantTarget: true,
        _count: { select: { responses: true } },
      },
    }),
  ]);

  const growthMap: Record<string, { users: number; studies: number; responses: number }> = {};
  for (let day = 0; day < 30; day += 1) {
    const date = new Date(thirtyDaysAgo);
    date.setUTCDate(date.getUTCDate() + day);
    growthMap[dayKey(date)] = { users: 0, studies: 0, responses: 0 };
  }
  dailyUsers.forEach(({ day, count }) => {
    if (growthMap[day]) growthMap[day].users = Number(count);
  });
  dailyStudies.forEach(({ day, count }) => {
    if (growthMap[day]) growthMap[day].studies = Number(count);
  });
  dailyResponses.forEach(({ day, count }) => {
    if (growthMap[day]) growthMap[day].responses = Number(count);
  });

  const [usersPreviousPeriod, usersCurrentPeriod, responsesPreviousPeriod, responsesCurrentPeriod] =
    await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.response.count({
        where: { submittedAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
      }),
      prisma.response.count({ where: { submittedAt: { gte: thirtyDaysAgo } } }),
    ]);

  const growthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${Math.round(change)}%`;
  };

  const roleDistribution = [
    { name: "Participants", value: participantCount },
    { name: "Researchers", value: researcherCount },
    { name: "Admins", value: adminCount },
  ];
  const studyStatusDistribution = [
    { name: "Active", value: activeStudies },
    { name: "Draft", value: draftStudies },
    { name: "Paused", value: pausedStudies },
    { name: "Completed", value: completedStudies },
  ];
  const verificationDistribution = [
    { name: "Pending", value: pendingVerifications },
    { name: "Verified", value: verifiedAccounts },
    { name: "Rejected", value: rejectedVerifications },
    { name: "Suspended", value: suspendedVerifications },
  ];
  const totalCredits = walletTotals._sum.balance ?? 0;
  const heapPercent = systemInfo.memory.heapTotal
    ? Math.round((systemInfo.memory.heapUsed / systemInfo.memory.heapTotal) * 100)
    : 0;
  const memoryPercent = systemInfo.totalMemory
    ? Math.round(((systemInfo.totalMemory - systemInfo.freeMemory) / systemInfo.totalMemory) * 100)
    : 0;
  const aiConfigured = isAnyKeySet(
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "GOOGLE_GEMINI_API_KEY",
    "NEXT_PUBLIC_GEMINI_API_KEY",
    "GEMINI_KEY",
    "GEMINI_API",
    "GEMINI",
    "GOOGLE_AI_API_KEY",
    "TINAT_AI_KEY",
    "OPENROUTER_API_KEY",
    "NVIDIA_API_KEY",
  );
  const smtpConfigured = Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
  const chapaConfigured = Boolean(process.env.CHAPA_SECRET_KEY);
  const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const services = [
    { name: "Database", detail: databaseHealth.status === "online" ? `${databaseHealth.latencyMs} ms` : "Connection failed", configured: databaseHealth.status === "online", icon: Database, critical: true },
    { name: "AI providers", detail: integrationStatus(aiConfigured), configured: aiConfigured, icon: Sparkles, critical: false },
    { name: "Email delivery", detail: integrationStatus(smtpConfigured), configured: smtpConfigured, icon: Mail, critical: false },
    { name: "Chapa payments", detail: integrationStatus(chapaConfigured), configured: chapaConfigured, icon: CircleDollarSign, critical: false },
    { name: "Google sign-in", detail: integrationStatus(googleConfigured), configured: googleConfigured, icon: ShieldCheck, critical: false },
  ];
  const criticalServicesHealthy = services.filter((service) => service.critical).every((service) => service.configured);

  const statCards = [
    { label: "Total users", value: totalUsers, detail: `${participantCount} participants · ${researcherCount} researchers`, trend: `${growthRate(usersCurrentPeriod, usersPreviousPeriod)} vs previous 30d`, href: "/admin/users", icon: Users, color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400" },
    { label: "Research studies", value: totalStudies, detail: `${activeStudies} active · ${pausedStudies} paused`, trend: `${draftStudies} drafts · ${completedStudies} completed`, href: "/admin/studies", icon: BookOpen, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400" },
    { label: "Responses", value: totalResponses, detail: `${responsesToday} submitted today`, trend: `${growthRate(responsesCurrentPeriod, responsesPreviousPeriod)} vs previous 30d`, href: "/admin/studies", icon: Activity, color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400" },
    { label: "Review queue", value: pendingVerifications + pendingWithdrawals, detail: `${pendingVerifications} verifications · ${pendingWithdrawals} payouts`, trend: `${(pendingWithdrawalAmount._sum.amount ?? 0).toLocaleString()} TC awaiting payout`, href: pendingVerifications > 0 ? "/admin/verifications" : "/admin/withdrawals", icon: Clock3, color: pendingVerifications + pendingWithdrawals > 0 ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400" : "text-muted-foreground bg-muted" },
  ];

  function actionLabel(action: string) {
    return action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (character) => character.toUpperCase());
  }

  function roleColor(role: string) {
    if (role === "ADMIN") return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300";
    if (role === "RESEARCHER") return "bg-cyan-50 text-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300";
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
  }

  return (
    <div className="container mx-auto max-w-[1440px] space-y-7 px-4 py-6 md:px-7 md:py-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tinat platform control</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operations overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform activity, service readiness, and the work that needs your attention.
          </p>
        </div>
        <div className={`flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-medium sm:self-auto ${
          criticalServicesHealthy
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
        }`}>
          {criticalServicesHealthy ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
          {criticalServicesHealthy ? "Database connection healthy" : "Database connection issue"}
          <span className="ml-1 text-[10px] opacity-70">Checked just now</span>
        </div>
      </header>

      <section aria-label="Platform key metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Link href={stat.href} key={stat.label} className="group block">
            <Card className="h-full transition-colors group-hover:border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                    <p className="mt-1.5 text-2xl font-bold leading-none text-foreground">{stat.value.toLocaleString()}</p>
                  </div>
                  <span className={`rounded-lg p-2 ${stat.color}`}><stat.icon className="h-4 w-4" /></span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{stat.detail}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/80">{stat.trend}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <AdminCharts
          growthData={Object.entries(growthMap).map(([date, counts]) => ({ date, ...counts }))}
          roleDistribution={roleDistribution}
          studyStatusDistribution={studyStatusDistribution}
          verificationDistribution={verificationDistribution}
        />

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><HeartPulse className="h-4 w-4 text-emerald-600" /> Service health</CardTitle>
              <CardDescription>Configuration and live connectivity checks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              {services.map((service) => (
                <div key={service.name} className="flex items-center gap-2.5 rounded-md px-1 py-2">
                  <service.icon className={`h-4 w-4 ${service.configured ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`} />
                  <span className="flex-1 text-xs font-medium text-foreground">{service.name}</span>
                  <span className="text-[11px] text-muted-foreground">{service.detail}</span>
                  <span className={`h-2 w-2 rounded-full ${service.configured ? "bg-emerald-500" : "bg-amber-500"}`} />
                </div>
              ))}
              <p className="border-t border-border pt-2 text-[10px] leading-4 text-muted-foreground">
                Integration indicators report configuration only; they do not make test transactions or send messages.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Server diagnostics</CardTitle>
              <CardDescription>Current application process snapshot</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Database ping</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full ${databaseHealth.status === "online" ? "bg-emerald-500" : "bg-rose-500"}`} />
                  {databaseHealth.latencyMs === null ? "Unavailable" : `${databaseHealth.latencyMs} ms`}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Process uptime</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {Math.floor(systemInfo.uptimeSeconds / 86400)}d {Math.floor((systemInfo.uptimeSeconds % 86400) / 3600)}h {Math.floor((systemInfo.uptimeSeconds % 3600) / 60)}m
                </p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Node heap</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{(systemInfo.memory.heapUsed / 1024 / 1024).toFixed(0)} / {(systemInfo.memory.heapTotal / 1024 / 1024).toFixed(0)} MB</p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-blue-500" style={{ width: `${heapPercent}%` }} /></div>
                <p className="mt-1 text-[10px] text-muted-foreground">{heapPercent}% heap used · {(systemInfo.memory.rss / 1024 / 1024).toFixed(0)} MB RSS</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Host memory</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{memoryPercent}% used</p>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-violet-500" style={{ width: `${memoryPercent}%` }} /></div>
                <p className="mt-1 text-[10px] text-muted-foreground">{(systemInfo.totalMemory / 1024 ** 3).toFixed(1)} GB total</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Host load · 1m</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{systemInfo.loadAverage[0] > 0 ? systemInfo.loadAverage[0].toFixed(2) : "Not reported"}</p>
                <p className="text-[10px] text-muted-foreground">{systemInfo.cpuCores} logical CPU cores</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Runtime</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{systemInfo.runtimeVersion}</p>
                <p className="text-[10px] text-muted-foreground">{systemInfo.platform}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Live collector sessions</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{activeCollectionSessions}</p>
                <p className="text-[10px] text-muted-foreground">Currently active collection sessions</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Radio className="h-4 w-4 text-blue-600" /> Platform economy</CardTitle>
            <CardDescription>Credits, payouts, and payment outcomes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between border-b border-border pb-3">
              <span className="text-xs text-muted-foreground">Credits held in wallets</span>
              <span className="text-lg font-bold text-foreground">{totalCredits.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">TC</span></span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Awaiting payout ({pendingWithdrawals} of {totalWithdrawals} requests)</span>
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">{(pendingWithdrawalAmount._sum.amount ?? 0).toLocaleString()} TC</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Successful study funding</span>
              <span className="text-sm font-semibold text-foreground">{(successfulPayments._sum.amount ?? 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Successful funding transactions</span>
              <span className="text-sm font-semibold text-foreground">{successfulPayments._count._all}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Failed payment attempts</span>
              <span className={`text-sm font-semibold ${failedPayments > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>{failedPayments}</span>
            </div>
            <Link href="/admin/withdrawals" className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">
              Review payout requests <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Needs attention</CardTitle>
            <CardDescription>Queues and exceptions for admin review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/verifications" className="flex items-center gap-3 rounded-lg border border-border p-3 transition hover:bg-muted/50">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span className="flex-1 text-xs font-medium text-foreground">Identity verifications</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${pendingVerifications ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>{pendingVerifications} pending</span>
            </Link>
            <Link href="/admin/withdrawals" className="flex items-center gap-3 rounded-lg border border-border p-3 transition hover:bg-muted/50">
              <CreditCard className="h-4 w-4 text-amber-600" />
              <span className="flex-1 text-xs font-medium text-foreground">Participant payouts</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${pendingWithdrawals ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-muted text-muted-foreground"}`}>{pendingWithdrawals} pending</span>
            </Link>
            <Link href="/admin/studies" className="flex items-center gap-3 rounded-lg border border-border p-3 transition hover:bg-muted/50">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <span className="flex-1 text-xs font-medium text-foreground">Paused studies</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{pausedStudies}</span>
            </Link>
            <Link href="/admin/logs" className="flex items-center gap-3 rounded-lg border border-border p-3 transition hover:bg-muted/50">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span className="flex-1 text-xs font-medium text-foreground">Failed payments</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{failedPayments}</span>
            </Link>
            <Link href="/admin/users" className="flex items-center gap-3 rounded-lg border border-border p-3 transition hover:bg-muted/50">
              <Users className="h-4 w-4 text-violet-600" />
              <span className="flex-1 text-xs font-medium text-foreground">Accounts awaiting email verification</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{unverifiedAccounts}</span>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
            <div><CardTitle className="text-base">Platform controls</CardTitle><CardDescription>Jump to management tools</CardDescription></div>
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { label: "Users", href: "/admin/users", icon: Users },
              { label: "Studies", href: "/admin/studies", icon: BookOpen },
              { label: "Verifications", href: "/admin/verifications", icon: ShieldCheck },
              { label: "Withdrawals", href: "/admin/withdrawals", icon: CreditCard },
              { label: "Activity logs", href: "/admin/logs", icon: Activity },
              { label: "Admin settings", href: "/admin/settings", icon: Settings2 },
            ].map((control) => (
              <Link key={control.href} href={control.href} className="flex items-center gap-2 rounded-md border border-border p-2.5 text-xs font-medium text-foreground hover:bg-muted/60">
                <control.icon className="h-3.5 w-3.5 text-muted-foreground" />{control.label}<ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <div><CardTitle className="text-base">High-activity studies</CardTitle><CardDescription>Live and paused studies with the most submissions</CardDescription></div>
            <Link href="/admin/studies" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">All studies <ArrowRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent>
            {topStudies.length === 0 ? (
              <p className="py-7 text-center text-sm text-muted-foreground">No active or paused studies yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {topStudies.map((study) => {
                  const percent = study.participantTarget > 0
                    ? Math.min(100, Math.round((study._count.responses / study.participantTarget) * 100))
                    : null;
                  return (
                    <Link key={study.id} href={`/admin/studies/${study.id}`} className="block py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-foreground">{study.title}</p>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${study.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"}`}>{study.status}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent ?? Math.min(100, study._count.responses)}%` }} /></div>
                        <span className="whitespace-nowrap text-[10px] text-muted-foreground">{study._count.responses}{study.participantTarget ? ` / ${study.participantTarget}` : ""} responses</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <div><CardTitle className="text-base">Latest registrations</CardTitle><CardDescription>Recently created platform accounts</CardDescription></div>
            <Link href="/admin/users" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Manage users <ArrowRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{user.name.slice(0, 1).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground">{user.role.toLowerCase()}</p>
                  </div>
                  <span className="whitespace-nowrap text-[10px] text-muted-foreground">{user.createdAt.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <div><CardTitle className="text-base">Recent platform activity</CardTitle><CardDescription>Latest recorded actions across Tinat</CardDescription></div>
          <Link href="/admin/logs" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">Full audit log <ArrowRight className="h-3 w-3" /></Link>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No recorded activity yet.</p>
          ) : (
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex min-w-0 items-start gap-2.5">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">{actionLabel(log.action)}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {log.user?.name ?? "System"}{" "}
                      {log.user?.role && (
                        <span className={`rounded px-1 py-0.5 text-[9px] ${roleColor(log.user.role)}`}>
                          {log.user.role.toLowerCase()}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground/70">{log.createdAt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 text-[10px] text-muted-foreground">
        <span>Metric window: last 30 days, compared with the previous 30 days.</span>
        <span>Service integration status reflects configuration only; no external transactions are triggered.</span>
      </div>
    </div>
  );
}
