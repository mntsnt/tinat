import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Database,
  HeartPulse,
  Mail,
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

  const [
    databaseHealth,
    totalUsers,
    participantCount,
    researcherCount,
    totalStudies,
    activeStudies,
    totalResponses,
    responsesToday,
    pendingVerifications,
    failedPayments,
    recentLogs,
    dailyUsers,
    dailyStudies,
    dailyResponses,
  ] = await Promise.all([
    (async () => {
      const startedAt = process.hrtime.bigint();
      try {
        await prisma.$queryRaw`SELECT 1`;
        return {
          status: "online" as const,
          latencyMs: Math.round(Number(process.hrtime.bigint() - startedAt) / 1_000_000),
        };
      } catch (error) {
        console.error("Admin dashboard database health check failed:", error);
        return { status: "offline" as const, latencyMs: null };
      }
    })(),
    prisma.user.count(),
    prisma.user.count({ where: { role: "PARTICIPANT" } }),
    prisma.user.count({ where: { role: "RESEARCHER" } }),
    prisma.study.count(),
    prisma.study.count({ where: { status: "ACTIVE" } }),
    prisma.response.count(),
    prisma.response.count({ where: { submittedAt: { gte: startOfToday } } }),
    prisma.verification.count({ where: { status: "PENDING" } }),
    prisma.studyPayment.count({ where: { status: "FAILED" } }),
    prisma.activityLog.findMany({
      take: 5,
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
  ]);

  const userMap = new Map(dailyUsers.map((item) => [item.day, Number(item.count)]));
  const studyMap = new Map(dailyStudies.map((item) => [item.day, Number(item.count)]));
  const responseMap = new Map(dailyResponses.map((item) => [item.day, Number(item.count)]));

  const chartData = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(thirtyDaysAgo);
    date.setUTCDate(date.getUTCDate() + index);
    const key = dayKey(date);

    return {
      date: key.slice(5),
      users: userMap.get(key) ?? 0,
      studies: studyMap.get(key) ?? 0,
      responses: responseMap.get(key) ?? 0,
    };
  });

  const aiConfigured = isAnyKeySet("GEMINI_API_KEY", "GOOGLE_AI_KEY", "GOOGLE_API_KEY");
  const integrations = [
    {
      name: "Database",
      detail: databaseHealth.status === "online" ? `${databaseHealth.latencyMs} ms` : "Connection failed",
      configured: databaseHealth.status === "online",
      icon: Database,
    },
    {
      name: "AI assistance",
      detail: aiConfigured ? "Configured" : "Not configured",
      configured: aiConfigured,
      icon: Sparkles,
    },
    {
      name: "Email delivery",
      detail: process.env.SMTP_USER && process.env.SMTP_PASS ? "Configured" : "Not configured",
      configured: Boolean(process.env.SMTP_USER && process.env.SMTP_PASS),
      icon: Mail,
    },
  ];

  const metrics = [
    {
      label: "People",
      value: totalUsers,
      detail: `${participantCount} participants · ${researcherCount} researchers`,
      href: "/admin/users",
      icon: Users,
      accent: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    },
    {
      label: "Studies",
      value: totalStudies,
      detail: `${activeStudies} currently active`,
      href: "/admin/studies",
      icon: BookOpen,
      accent: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
    },
    {
      label: "Responses",
      value: totalResponses,
      detail: `${responsesToday} submitted today`,
      href: "/admin/studies",
      icon: Activity,
      accent: "text-violet-600 bg-violet-50 dark:bg-violet-900/20 dark:text-violet-400",
    },
    {
      label: "Needs review",
      value: pendingVerifications,
      detail: `${pendingVerifications} verification requests pending review`,
      href: "/admin/verifications",
      icon: ShieldCheck,
      accent:
        pendingVerifications > 0
          ? "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
          : "text-muted-foreground bg-muted",
    },
  ];

  function roleLabel(role: string) {
    return role.toLowerCase().replace(/^\w/, (character) => character.toUpperCase());
  }

  return (
    <div className="container mx-auto max-w-[1440px] space-y-6 px-4 py-6 md:px-7 md:py-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Tinat platform control
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operations overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A clear view of platform activity and items needing attention.
          </p>
        </div>
        <div
          className={`flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-xs font-medium sm:self-auto ${
            databaseHealth.status === "online"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
              : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
          }`}
        >
          {databaseHealth.status === "online" ? (
            <CheckCircle2 className="h-3.5 w-3.5" />
          ) : (
            <AlertTriangle className="h-3.5 w-3.5" />
          )}
          {databaseHealth.status === "online" ? "Database connected" : "Database connection issue"}
        </div>
      </header>

      <section aria-label="Platform key metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Link href={metric.href} key={metric.label} className="group block">
            <Card className="h-full transition-colors group-hover:border-primary/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">{metric.value.toLocaleString()}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
                  </div>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${metric.accent}`}>
                    <metric.icon className="h-4 w-4" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      <AdminCharts growthData={chartData} />

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">System status</CardTitle>
            <CardDescription>Core infrastructure and external service connectivity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {integrations.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{item.detail}</span>
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      item.configured ? "bg-emerald-600" : "bg-muted-foreground/40"
                    }`}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Items needing attention</CardTitle>
            <CardDescription>Approvals and operational anomalies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/admin/verifications"
              className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
            >
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span className="flex-1 text-xs font-medium text-foreground">Identity verifications</span>
              <span className="text-xs text-muted-foreground">{pendingVerifications} pending</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <Link
              href="/admin/logs"
              className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
            >
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span className="flex-1 text-xs font-medium text-foreground">Failed payments</span>
              <span className="text-xs text-muted-foreground">{failedPayments}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
            <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 sm:grid-cols-3">
              {[
                { label: "People", href: "/admin/users", icon: Users },
                { label: "Studies", href: "/admin/studies", icon: BookOpen },
                { label: "Settings", href: "/admin/settings", icon: Settings2 },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                  <ArrowRight className="ml-auto h-3 w-3" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-base">Recent platform activity</CardTitle>
              <CardDescription>Latest recorded actions across Tinat</CardDescription>
            </div>
            <Link
              href="/admin/logs"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Audit log <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentLogs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No recorded activity yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {recentLogs.map((log) => (
                  <div key={log.id} className="flex min-w-0 items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-foreground">
                        {log.action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (character) => character.toUpperCase())}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                        {log.user?.name ?? "System"}
                        {log.user?.role && ` · ${roleLabel(log.user.role)}`}
                        {" · "}
                        {log.createdAt.toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
