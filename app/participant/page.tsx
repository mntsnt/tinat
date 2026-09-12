import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Wallet, CheckCircle, BookOpen, Compass, ArrowRight } from "lucide-react";

export default async function ParticipantDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      wallet: true,
      bookmarks: {
        include: { study: true },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
      responses: {
        include: {
          study: {
            select: {
              id: true,
              title: true,
              rewardCredits: true,
              researcher: { select: { name: true } },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!user || user.role !== "PARTICIPANT") redirect("/dashboard");

  const studies = await prisma.study.findMany({
    where: { status: "ACTIVE" },
    include: {
      researcher: { select: { name: true } },
      _count: { select: { questions: true, responses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const completedStudyIds = new Set(user.responses.map((r) => r.studyId));
  const availableStudies = studies.filter(
    (s) =>
      !completedStudyIds.has(s.id) &&
      (s.participantTarget === 0 || s._count.responses < s.participantTarget)
  );

  const totalCreditsEarned = user.responses.reduce(
    (total, r) => total + r.study.rewardCredits,
    0
  );

  const statsCards = [
    {
      label: "Wallet Balance",
      value: `${(user.wallet?.balance ?? 0).toLocaleString()} TC`,
      sub: `${totalCreditsEarned.toLocaleString()} TC earned total`,
      icon: <Wallet className="w-5 h-5" />,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
      href: "/participant/wallet",
    },
    {
      label: "Studies Completed",
      value: user.responses.length,
      sub: "All time submissions",
      icon: <CheckCircle className="w-5 h-5" />,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
      href: "/participant/history",
    },
    {
      label: "Available Studies",
      value: availableStudies.length,
      sub: "Open for participation",
      icon: <Compass className="w-5 h-5" />,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400",
      href: "/participant/studies",
    },
    {
      label: "Saved Studies",
      value: user.bookmarks.length,
      sub: "Bookmarked by you",
      icon: <BookOpen className="w-5 h-5" />,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
      href: "/participant/studies",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 md:py-10 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back, {user.name.split(" ")[0]} 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Here's what's happening with your account today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsCards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {card.label}
                    </p>
                    <p className="text-2xl font-bold text-foreground leading-none">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1.5">{card.sub}</p>
                  </div>
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${card.color}`}>
                    {card.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Submissions</CardTitle>
            <Link href="/participant/history">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {user.responses.length === 0 ? (
              <div className="text-center py-10">
                <CheckCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No submissions yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete a study to see your history here.
                </p>
                <Link href="/participant/studies" className="mt-4 inline-block">
                  <Button size="sm">Browse Studies</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {user.responses.slice(0, 5).map((response) => (
                  <div
                    key={response.id}
                    className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {response.study.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {response.submittedAt.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant={response.study.rewardCredits > 0 ? "success" : "secondary"} className="ml-3 flex-shrink-0">
                      {response.study.rewardCredits > 0 ? `+${response.study.rewardCredits} TC` : "Volunteer"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Saved / Bookmarked Studies */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Saved Studies</CardTitle>
            <Link href="/participant/studies">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                Browse more <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {user.bookmarks.length === 0 ? (
              <div className="text-center py-10">
                <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm font-medium text-foreground">No saved studies</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Bookmark studies you want to come back to.
                </p>
                <Link href="/participant/studies" className="mt-4 inline-block">
                  <Button size="sm">Discover Studies</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {user.bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.study.id}
                    className="flex items-center justify-between py-2.5 border-b border-border last:border-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {bookmark.study.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {bookmark.study.rewardCredits > 0 ? `${bookmark.study.rewardCredits} TC reward` : "Open Data Collection"}
                      </p>
                    </div>
                    <Link href={`/participant/studies/${bookmark.study.id}`} className="ml-3 flex-shrink-0">
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Available Studies Preview */}
      {availableStudies.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">New Studies Available</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{availableStudies.length} studies open for you</p>
            </div>
            <Link href="/participant/studies">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableStudies.slice(0, 3).map((study) => (
              <Card key={study.id} className="hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    {study.rewardCredits > 0 ? (
                      <Badge variant="success">{study.rewardCredits} TC</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">Open Data</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {study._count.questions} questions
                    </span>
                  </div>
                  {study.category && (
                    <div className="mb-1">
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {study.category}
                      </span>
                    </div>
                  )}
                  <CardTitle className="text-sm leading-snug line-clamp-2">
                    {study.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {study.description || "No description provided."}
                  </p>
                </CardContent>
                <CardFooter className="pt-0">
                  <Link href={`/participant/studies/${study.id}`} className="w-full">
                    <Button variant="outline" size="sm" className="w-full">
                      Start Study
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
