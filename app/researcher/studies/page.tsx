import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import StudyStatusButton from "../../components/StudyStatusButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { BookOpen, FilePlus, ArrowRight } from "lucide-react";

export default async function ResearcherStudiesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || user.role !== "RESEARCHER") {
    redirect("/dashboard");
  }

  const studies = await prisma.study.findMany({
    where: { researcherId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { questions: true, responses: true }
      }
    },
  });

  function statusVariant(status: string) {
    if (status === "ACTIVE") return "success";
    if (status === "COMPLETED") return "secondary";
    return "warning";
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Studies</h1>
          <p className="text-muted-foreground mt-1">Manage and track your research studies.</p>
        </div>
        <Link href="/researcher/studies/new">
          <Button className="gap-2">
            <FilePlus className="w-4 h-4" />
            Create New Study
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
                  {study.rewardCredits > 0 ? (
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {study.rewardCredits} TC / response
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Free Data Collection
                    </span>
                  )}
                </div>
                {study.category && (
                  <div className="mb-1">
                    <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {study.category}
                    </span>
                  </div>
                )}
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
  );
}
