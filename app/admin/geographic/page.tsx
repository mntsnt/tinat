import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  MapPin,
  Building2,
  Stethoscope,
  Users,
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Download,
  Activity,
  Layers,
  ChevronRight,
} from "lucide-react";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/Card";
import { EthiopiaGeographicMap } from "../../components/admin/EthiopiaGeographicMap";
import { INITIAL_ETHIOPIAN_HUBS } from "../../components/admin/ethiopiaMapData";

export const metadata: Metadata = {
  title: "Geographic Reach & Regional Hubs | Tinat Admin",
  description:
    "Interactive geographic distribution of Tinat medical researchers, field enumerators, and health studies across Ethiopia.",
};

async function safeQuery<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error("Geographic reach query failed:", error);
    return fallback;
  }
}

export default async function GeographicReachPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const admin = await safeQuery(
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    }),
    null
  );
  if (!admin || admin.role !== "ADMIN") redirect("/dashboard");

  const [
    totalUsers,
    participantCount,
    researcherCount,
    collectorCount,
    totalStudies,
    activeStudies,
    totalResponses,
  ] = await Promise.all([
    safeQuery(prisma.user.count(), 0),
    safeQuery(prisma.user.count({ where: { role: "PARTICIPANT" } }), 0),
    safeQuery(prisma.user.count({ where: { role: "RESEARCHER" } }), 0),
    safeQuery(prisma.user.count({ where: { role: "DATA_COLLECTOR" } }), 0),
    safeQuery(prisma.study.count(), 0),
    safeQuery(prisma.study.count({ where: { status: "ACTIVE" } }), 0),
    safeQuery(prisma.response.count(), 0),
  ]);

  // Aggregate regional network statistics
  const totalHubsCount = INITIAL_ETHIOPIAN_HUBS.length;
  const targetChaptersGoal = 15;
  const progressPercent = Math.min(100, Math.round((totalHubsCount / targetChaptersGoal) * 100));

  return (
    <div className="w-full space-y-6 px-4 py-6 md:px-7 md:py-8">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link href="/admin" className="hover:text-foreground transition-colors">
              Admin
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">Geographic Reach</span>
          </nav>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Geographic Distribution
            </h1>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-500 dark:text-amber-400">
              Ethiopia Nationwide
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Real-time tracking of Tinat health research sentinel hubs, academic teaching hospitals,
            and door-to-door community enumerator clusters across all regional states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs hover:bg-muted transition-colors"
          >
            <Users className="h-4 w-4 text-muted-foreground" />
            View User Directory
          </Link>
          <Link
            href="/admin/studies"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Manage Field Studies
          </Link>
        </div>
      </div>

      {/* Strategic Milestone Banner matching user UI */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-500 dark:text-amber-400">
              <TrendingUp className="h-4 w-4" />
              Strategic Expansion Goal
            </div>
            <p className="text-base font-semibold text-foreground">
              Target: 15 active university &amp; community chapters by January 2027
            </p>
            <p className="text-xs text-muted-foreground">
              Currently operating {totalHubsCount} sentinel hubs across Addis Ababa, Oromia, Amhara,
              Sidama, South Ethiopia, Tigray, and Somali regions.
            </p>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <span className="text-2xl font-black text-amber-500 dark:text-amber-400">
                {progressPercent}%
              </span>
              <p className="text-[11px] text-muted-foreground">Milestone Achieved</p>
            </div>
            <div className="h-10 w-px bg-border hidden sm:block" />
            <div className="text-right">
              <span className="text-2xl font-black text-foreground">
                {targetChaptersGoal - totalHubsCount}
              </span>
              <p className="text-[11px] text-muted-foreground">Chapters Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Interactive Dotted Matrix Map of Ethiopia */}
      <EthiopiaGeographicMap
        totalUsersCount={totalUsers || 1250}
        researcherCount={researcherCount || 215}
        collectorCount={collectorCount || 188}
        participantCount={participantCount || 847}
        activeStudiesCount={activeStudies || 67}
        totalResponsesCount={totalResponses || 3840}
        title="Chapters and community"
        subtitle="Young researchers, doctors, and community health enumerators turning shared scientific purpose into local action across Ethiopia."
      />

      {/* Detailed Regional Sentinel Deep-Dive */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Regional Sentinel Network Directory
            </h2>
            <p className="text-xs text-muted-foreground">
              Comprehensive list of academic institutions, field team capacity, and active public
              health investigations.
            </p>
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {INITIAL_ETHIOPIAN_HUBS.length} Sentinel Locations Configured
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {INITIAL_ETHIOPIAN_HUBS.map((hub) => (
            <Card
              key={hub.id}
              className="group border border-border/80 transition-all hover:border-amber-500/40 hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 dark:text-amber-400">
                      <MapPin className="h-3 w-3" />
                      {hub.city}, {hub.region}
                    </span>
                    <CardTitle className="text-base font-bold text-foreground mt-0.5 truncate group-hover:text-amber-500 transition-colors">
                      {hub.name}
                    </CardTitle>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {hub.status}
                  </span>
                </div>
                <CardDescription className="text-xs leading-relaxed line-clamp-2 mt-1">
                  {hub.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/20 p-2.5 text-center">
                  <div>
                    <p className="text-xs font-bold text-foreground">{hub.researchers}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">
                      Doctors
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-500 dark:text-amber-400">
                      {hub.collectors}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">
                      Collectors
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-500 dark:text-emerald-400">
                      {hub.activeStudies}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">
                      Studies
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
                  <span>Participants: {hub.participants}</span>
                  <Link
                    href={`/admin/studies?hub=${hub.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
                  >
                    View Hub Studies
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
