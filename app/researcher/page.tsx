import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import StudyStatusButton from "../components/StudyStatusButton";
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { BookOpen, Users, TrendingUp, Coins, ArrowRight, FilePlus } from "lucide-react";

export default async function ResearcherDashboard() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== "RESEARCHER") redirect("/dashboard");

  const studies = await prisma.study.findMany({
    where: { researcherId: user.id },
    include: {
      _count: { select: { questions: true, responses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalResponses = studies.reduce((sum, s) => sum + s._count.responses, 0);
  const activeStudies = studies.filter((s) => s.status === "ACTIVE").length;
  const totalSpend = studies.reduce((sum, s) => sum + s.creditsPaid, 0);

  const statCards = [
    {
      label: "Total Studies",
      value: studies.length,
      sub: `${activeStudies} currently active`,
      icon: <BookOpen className="w-5 h-5" />,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-400",
    },
    {
      label: "Total Responses",
      value: totalResponses,
      sub: "Across all your studies",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
    },
    {
      label: "Active Studies",
      value: activeStudies,
      sub: "Collecting responses now",
      icon: <Users className="w-5 h-5" />,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400",
    },
    {
      label: "Credits Paid Out",
      value: `${totalSpend.toLocaleString()} TC`,
      sub: "To participants",
      icon: <Coins className="w-5 h-5" />,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
    },
  ];

  function statusVariant(status: string) {
    if (status === "ACTIVE") return "success";
    if (status === "COMPLETED") return "secondary";
    return "warning";
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-8 md:py-10 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your research studies and track responses.
          </p>
        </div>
        <Link href="/researcher/studies/new">
          <Button className="gap-2">
            <FilePlus className="w-4 h-4" />
            Create New Study
          </Button>
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((card) => (
          <Card key={card.label}>
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

      {/* Studies Section */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">My Research Studies</h2>
          <Link href="/researcher/studies">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {studies.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">No studies yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Create your first study to start gathering data from participants.
              </p>
              <Link href="/researcher/studies/new">
                <Button className="gap-2">
                  <FilePlus className="w-4 h-4" />
                  Create Your First Study
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {studies.map((study) => (
              <Card key={study.id} className="flex flex-col hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={statusVariant(study.status) as "success" | "secondary" | "warning"}>
                      {study.status}
                    </Badge>
                    {/* Fixed: proper contrast for TC badge - explicit colors instead of relying on bg-emerald-50 */}
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {study.rewardCredits} TC / response
                    </span>
                  </div>
                  <CardTitle className="text-sm leading-snug line-clamp-2">
                    {study.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-3">
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                    {study.description || "No description provided."}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex flex-col rounded-lg bg-muted/60 p-2.5">
                      <span className="text-muted-foreground">Questions</span>
                      <span className="font-bold text-foreground text-base mt-0.5">
                        {study._count.questions}
                      </span>
                    </div>
                    <div className="flex flex-col rounded-lg bg-muted/60 p-2.5">
                      <span className="text-muted-foreground">Responses</span>
                      <span className="font-bold text-foreground text-base mt-0.5">
                        {study._count.responses}
                        {study.participantTarget > 0 && (
                          <span className="text-xs font-normal text-muted-foreground">
                            /{study.participantTarget}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-2 border-t border-border pt-3 mt-auto">
                  <StudyStatusButton studyId={study.id} currentStatus={study.status} />
                  <Link href={`/researcher/studies/${study.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      Details <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}