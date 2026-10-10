import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  MapPin,
  UserRound,
} from "lucide-react";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardContent } from "../../components/ui/Card";
import { StudyBanner } from "../../components/studies/StudyBanner";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Tinat administrator",
  PARTICIPANT: "Research participant",
  RESEARCHER: "Health researcher",
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, session] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        avatarUrl: true,
        bio: true,
        institution: true,
        fieldOfStudy: true,
        isVerified: true,
        createdAt: true,
        _count: { select: { responses: true } },
        studies: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: {
            id: true,
            title: true,
            description: true,
            objective: true,
            bannerTheme: true,
            rewardCredits: true,
            category: true,
            estimatedMinutes: true,
            _count: { select: { responses: true } },
          },
        },
      },
    }),
    getSession(),
  ]);

  if (!user) notFound();

  const isOwnProfile = session?.userId === user.id;
  const settingsHref =
    user.role === "ADMIN"
      ? "/admin/settings"
      : user.role === "RESEARCHER"
        ? "/researcher/settings"
        : "/participant/settings";
  const memberSince = user.createdAt.toLocaleDateString("en", {
    month: "long",
    year: "numeric",
  });
  const studyResponses = user.studies.reduce(
    (total, study) => total + study._count.responses,
    0
  );

  return (
    <main className="flex-1 bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:py-12">
        <Card className="overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-700 sm:h-36" />
          <CardContent className="px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-8 flex flex-col gap-4 sm:-mt-10 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-end gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-card bg-emerald-700 text-2xl font-semibold text-white shadow-sm sm:h-28 sm:w-28">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={`${user.name}'s profile picture`}
                      width={112}
                      height={112}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    user.name
                      .split(/\s+/)
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  )}
                </div>
                <div className="min-w-0 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                      {user.name}
                    </h1>
                    {user.isVerified && (
                      <Badge variant="success" className="inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {ROLE_LABELS[user.role] || "Tinat member"}
                  </p>
                </div>
              </div>
              {isOwnProfile && (
                <Link href={settingsHref} className="shrink-0">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    Edit profile
                  </Button>
                </Link>
              )}
            </div>

            <div className="mt-6 grid gap-6 border-t border-border pt-5 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="space-y-3">
                <p className="max-w-2xl whitespace-pre-line text-sm leading-6 text-foreground">
                  {user.bio || "This member hasn’t added a bio yet."}
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  {user.institution && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {user.institution}
                    </span>
                  )}
                  {user.fieldOfStudy && (
                    <span className="inline-flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {user.fieldOfStudy}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Joined {memberSince}
                  </span>
                </div>
              </div>

              <div className="flex gap-6 border-t border-border pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
                {user.role === "RESEARCHER" ? (
                  <>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{user.studies.length}</p>
                      <p className="text-xs text-muted-foreground">Active studies</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{studyResponses}</p>
                      <p className="text-xs text-muted-foreground">Study responses</p>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-foreground">{user._count.responses}</p>
                    <p className="text-xs text-muted-foreground">Research contributions</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {user.role === "RESEARCHER" && (
          <section className="mt-8 space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Active studies</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Research currently welcoming participants.
                </p>
              </div>
              <Link
                href="/participant/studies"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Browse all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {user.studies.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-10 text-center">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium text-foreground">No active studies yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Active studies published by this researcher will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {user.studies.map((study) => (
                  <Card key={study.id} className="overflow-hidden transition-colors hover:border-emerald-700/40">
                    <StudyBanner theme={study.bannerTheme} className="h-20" />
                    <CardContent className="space-y-3 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Badge variant="outline">{study.category || "Health research"}</Badge>
                        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          {study.rewardCredits > 0
                            ? `${study.rewardCredits} TC reward`
                            : "Volunteer study"}
                        </span>
                      </div>
                      <h3 className="font-semibold leading-snug text-foreground">{study.title}</h3>
                      <p className="line-clamp-2 text-sm leading-5 text-muted-foreground">
                        {study.objective || study.description || "A health research study on Tinat."}
                      </p>
                      <div className="flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <ClipboardCheck className="h-3.5 w-3.5" />
                          {study._count.responses} responses
                        </span>
                        <span>About {study.estimatedMinutes || 5} min</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        )}

        {user.role !== "RESEARCHER" && (
          <section className="mt-8 rounded-xl border border-border bg-card p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-700 dark:text-emerald-400">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Part of the Tinat community</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {user.role === "PARTICIPANT"
                    ? "This member contributes to health research by taking part in studies."
                    : "This account helps keep the Tinat research community running."}
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
