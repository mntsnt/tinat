import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ShieldAlert, AlertTriangle, CheckCircle2, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { AdminModerationList } from "./AdminModerationList";

export default async function AdminModerationPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const reports = await prisma.moderationReport.findMany({
    orderBy: [{ status: "asc" }, { deadline: "asc" }],
    include: {
      reporter: {
        select: { id: true, name: true, email: true },
      },
      study: {
        select: { id: true, title: true, status: true },
      },
    },
  });

  const now = new Date();
  const openCount = reports.filter((r) => r.status === "OPEN").length;
  const overdueCount = reports.filter(
    (r) => (r.status === "OPEN" || r.status === "INVESTIGATING") && new Date(r.deadline) < now
  ).length;
  const resolvedCount = reports.filter((r) => r.status === "RESOLVED").length;

  return (
    <div className="w-full px-4 py-6 md:px-7 md:py-8 space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-red-500/10 text-red-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-red-600">
            Governance & Content Moderation
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Moderation & Incident Queue
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review participant and community reports under our 7-day statutory governance SLA.
        </p>
      </div>

      {/* SLA Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-card space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Open Reports</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{openCount}</div>
          <p className="text-xs text-muted-foreground">Awaiting moderator triage</p>
        </div>

        <div className="p-5 rounded-2xl border border-destructive/30 bg-destructive/5 space-y-1">
          <div className="flex items-center justify-between text-xs text-destructive font-medium">
            <span>SLA Overdue (&gt; 7 Days)</span>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold text-destructive">{overdueCount}</div>
          <p className="text-xs text-destructive/80">Exceeded 7-day resolution window</p>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-600 font-medium">
            <span>Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">{resolvedCount}</div>
          <p className="text-xs text-muted-foreground">Actioned and documented</p>
        </div>
      </div>

      {/* Moderation List Client Component */}
      <AdminModerationList initialReports={reports as any} />
    </div>
  );
}
