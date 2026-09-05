import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { getButtonClasses } from "../../../components/ui/Button";
import { AdminStudyStatusControls } from "./AdminStudyStatusControls";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminStudyDetailPage({ params }: Props) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { id } = await params;

  const study = await prisma.study.findUnique({
    where: { id },
    include: {
      researcher: true,
      questions: {
        include: { options: true },
        orderBy: { order: "asc" }
      },
      _count: {
        select: { responses: true }
      }
    },
  });

  if (!study) {
    notFound();
  }

  const remainingCredits = study.budgetCredits - study.creditsPaid;
  const participantTargetReached = study.participantTarget > 0 && study._count.responses >= study.participantTarget;
  
  const budgetValid = study.budgetCredits > 0 && study.rewardCredits > 0 && remainingCredits >= study.rewardCredits && study.questions.length > 0;

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 flex flex-col gap-4">
        <div>
          <Link href="/admin/studies" className={getButtonClasses("ghost", "sm", "-ml-3 mb-2 text-muted-foreground")}>
            &larr; Back to Studies
          </Link>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{study.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={study.status === "ACTIVE" ? "success" : study.status === "COMPLETED" ? "secondary" : study.status === "PAUSED" ? "warning" : "outline"}>
                  {study.status}
                </Badge>
                <span className="text-sm text-muted-foreground">ID: {study.id}</span>
              </div>
            </div>
            <div>
              <AdminStudyStatusControls studyId={study.id} status={study.status} budgetValid={budgetValid} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Study Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <strong className="text-foreground block mb-1">Description:</strong>
              <p className="text-muted-foreground">{study.description || "No description provided."}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong className="text-foreground block mb-1">Researcher:</strong>
                <p className="text-muted-foreground">{study.researcher.name} ({study.researcher.email})</p>
              </div>
              <div>
                <strong className="text-foreground block mb-1">Created At:</strong>
                <p className="text-muted-foreground">{study.createdAt.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Responses</span>
                <span className="font-medium text-foreground">{study._count.responses} / {study.participantTarget > 0 ? study.participantTarget : "∞"}</span>
              </div>
              {participantTargetReached && (
                <p className="text-xs text-amber-600 mt-1 font-medium">Participant target reached.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Funding Economy</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <dt className="text-sm text-muted-foreground">Reward per Participant</dt>
                <dd className="font-semibold text-foreground">{study.rewardCredits} TC</dd>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <dt className="text-sm text-muted-foreground">Total Budget</dt>
                <dd className="font-semibold text-foreground">{study.budgetCredits} TC</dd>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <dt className="text-sm text-muted-foreground">Credits Paid</dt>
                <dd className="font-semibold text-foreground">{study.creditsPaid} TC</dd>
              </div>
              <div className="flex justify-between items-center pb-3">
                <dt className="text-sm text-muted-foreground">Remaining Budget</dt>
                <dd className="font-semibold text-foreground">{remainingCredits} TC</dd>
              </div>
            </dl>
            {study.budgetCredits > 0 && (
              <div className="mt-4">
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, (study.creditsPaid / study.budgetCredits) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">Questions ({study.questions.length})</h2>
        <div className="space-y-4">
          {study.questions.map((q, i) => (
            <Card key={q.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-start gap-2">
                  <span className="text-muted-foreground">{i + 1}.</span>
                  {q.text}
                </CardTitle>
                <CardDescription>
                  Type: {q.type} {q.required && <Badge variant="secondary" className="ml-2 py-0">Required</Badge>}
                </CardDescription>
              </CardHeader>
              {q.options && q.options.length > 0 && (
                <CardContent>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    {q.options.map(opt => (
                      <li key={opt.id}>{opt.text}</li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          ))}
          {study.questions.length === 0 && (
            <p className="text-muted-foreground text-sm">No questions added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
