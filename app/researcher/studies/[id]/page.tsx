import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import FundStudyButton from "../../../components/FundStudyButton";
import PublishUnfundedButton from "../../../components/PublishUnfundedButton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button, getButtonClasses } from "../../../components/ui/Button";
import { AIAnalysisTab } from "./AIAnalysisTab";
import { DataVisualizationStudio } from "./DataVisualizationStudio";
import { StudyEngagement } from "./StudyEngagement";
import { StudyShareLink } from "./StudyShareLink";
import { Star, Paperclip, ShieldAlert } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

const studyViews = [
  { id: "overview", label: "Overview" },
  { id: "analysis", label: "AI analysis" },
  { id: "visualizations", label: "Data visualizations" },
  { id: "responses", label: "Responses" },
  { id: "discussion", label: "Discussion & feedback" },
] as const;

export default async function ResearchStudyPage({ params, searchParams }: Props) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const requestedView = Array.isArray(query.view) ? query.view[0] : query.view;
  const activeView = studyViews.find((view) => view.id === requestedView)?.id ?? "overview";

  const study = await prisma.study.findUnique({
    where: { id },
    include: {
      questions: { include: { options: true, rows: true }, orderBy: { order: "asc" } },
      responses: { include: { answers: true, collector: { select: { id: true, name: true } } }, orderBy: { submittedAt: "desc" } },
      likes: true,
      comments: {
        where: { parentId: null },
        include: {
          user: { select: { name: true, avatarUrl: true, role: true } },
          replies: {
            include: { user: { select: { name: true, avatarUrl: true, role: true } } },
            orderBy: { createdAt: "asc" }
          }
        },
        orderBy: { createdAt: "desc" }
      },
      ratings: {
        include: { user: { select: { name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" }
      }
    },
  });

  if (!study) {
    notFound();
  }

  const activeStudy = study!;

  if (activeStudy.researcherId !== session.userId) {
    redirect("/researcher");
  }

  const researcher = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { faydaVerified: true },
  });

  const totalResponses = activeStudy.responses.length;
  const totalComments = activeStudy.comments.reduce((total, comment) => total + 1 + comment.replies.length, 0);
  const currentUserLiked = activeStudy.likes.some((like) => like.userId === session.userId);
  const fieldCollectedResponses = activeStudy.responses.filter(r => r.collectionMethod === "FIELD_COLLECTED").length;
  const selfResponses = totalResponses - fieldCollectedResponses;

  // Group by collector
  const collectorStats = activeStudy.responses
    .filter(r => r.collectionMethod === "FIELD_COLLECTED" && r.collector)
    .reduce((acc, r) => {
      const name = r.collector!.name || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const remainingCredits = Math.max(0, study.budgetCredits - study.creditsPaid);
  const participantTargetReached = study.participantTarget > 0 && totalResponses >= study.participantTarget;
  const fundingComplete = study.budgetCredits > 0 && study.creditsPaid >= study.budgetCredits;

  function getAnswer(response: (typeof activeStudy.responses)[number], questionId: string) {
    return response.answers.find((answer) => answer.questionId === questionId);
  }

  function percentage(count: number) {
    if (totalResponses === 0) return 0;
    return Math.round((count / totalResponses) * 100);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 py-3 md:px-6 md:py-4">
      {/* ── Fixed Top Header (All Views) ── */}
      <div className="mb-3 shrink-0">
        <div className="flex items-center justify-between gap-4 mb-1.5">
          <Link href="/researcher" className={getButtonClasses("ghost", "sm", "-ml-2 inline-flex items-center text-xs text-muted-foreground hover:text-foreground")}>
            &larr; Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant={study.status === "ACTIVE" ? "success" : study.status === "COMPLETED" ? "secondary" : "warning"} className="text-xs">
              {study.status}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {study.category && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  {study.category}
                </span>
              )}
              {study.studyType === "FREE_DATA_COLLECTION" || study.rewardCredits === 0 ? (
                <span className="text-xs font-medium text-teal-700 dark:text-teal-300 bg-teal-500/10 px-2.5 py-0.5 rounded-full">
                  Open Data Collection (Free)
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                  Funded Research &bull; {study.rewardCredits} TC / response
                </span>
              )}
              {study.estimatedMinutes && (
                <span className="text-xs text-muted-foreground">
                  ~{study.estimatedMinutes} mins completion
                </span>
              )}
            </div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-foreground truncate max-w-4xl">{study.title}</h1>
          </div>
        </div>
      </div>

      {/* ── Fixed Navigation Tabs (All Views) ── */}
      <nav aria-label="Study sections" className="mb-3 shrink-0 flex gap-1 overflow-x-auto border-b border-border">
        {studyViews.map((view) => (
          <Link
            key={view.id}
            href={`/researcher/studies/${study.id}?view=${view.id}`}
            aria-current={activeView === view.id ? "page" : undefined}
            className={`shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeView === view.id
                ? "border-primary text-foreground font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {view.label}
          </Link>
        ))}
      </nav>

      {/* ── View 1: Overview ── */}
      {activeView === "overview" && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-8 space-y-6">
          {(study.objective || study.targetPopulation || study.description) && (
            <Card>
              <CardContent className="pt-4 space-y-2.5">
                {study.objective && (
                  <div className="rounded-lg bg-muted/40 p-3 border border-border">
                    <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground block mb-0.5">Research Objective:</span>
                    <p className="text-sm font-medium text-foreground italic">"{study.objective}"</p>
                  </div>
                )}
                {study.targetPopulation && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">Target Cohort:</span> {study.targetPopulation}
                  </p>
                )}
                {study.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed">{study.description}</p>
                )}
              </CardContent>
            </Card>
          )}

          <StudyShareLink studyId={study.id} />

          <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Study Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {study.status === "DRAFT" && (
              <div className="rounded-lg bg-primary/10 border border-primary/20 p-5">
                <p className="text-sm font-semibold text-foreground mb-1">
                  This health study is currently in Draft status.
                </p>
                {!researcher?.faydaVerified ? (
                  <div className="mt-3 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-semibold text-sm mb-1 flex items-center gap-1.5 text-foreground">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      Fayda National ID Verification Required to Publish
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Researchers are required to verify their identity with their Ethiopian Fayda National ID before publishing this research study.
                    </p>
                    <Link href="/researcher/settings#verification">
                      <Button variant="outline" size="sm" className="gap-1 border-amber-500/30 text-xs">
                        Verify with Fayda in Settings
                      </Button>
                    </Link>
                  </div>
                ) : study.studyType === "FREE_DATA_COLLECTION" || study.budgetCredits <= 0 ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-4">
                      This is an Open Data Collection study. No payment or deposit is required. You can publish it immediately to make it accessible to participants.
                    </p>
                    <PublishUnfundedButton studyId={study.id} label="Publish Health Study Now" />
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-muted-foreground mb-4">
                      This is a Funded Study. Fund the participant reward pool ({study.budgetCredits} TC) to make it active and visible to verified participants.
                    </p>
                    <FundStudyButton studyId={study.id} amount={study.budgetCredits} />
                  </div>
                )}
              </div>
            )}
            {study.status === "ACTIVE" && <p className="text-muted-foreground">This health study is currently active and collecting responses from participants.</p>}
            {study.status === "PAUSED" && <p className="text-muted-foreground">This study is paused and is currently not accepting participant responses.</p>}
            {study.status === "COMPLETED" && <p className="text-muted-foreground">This study has concluded data collection.</p>}
            
            {participantTargetReached && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mt-4">
                <p className="text-sm font-medium text-success">The participant target has been reached.</p>
              </div>
            )}
            
            {fundingComplete && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mt-2">
                <p className="text-sm font-medium text-success">The full study budget has been funded.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>Download the responses collected.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <a href={`/api/auth/studies/${study.id}/export`} className={getButtonClasses("outline", "md", "w-full justify-start")}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Export CSV
            </a>
            <a href={`/api/auth/studies/${study.id}/export/excel`} className={getButtonClasses("outline", "md", "w-full justify-start")}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Export Excel
            </a>
          </CardContent>
        </Card>
      </div>

          <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <dt className="text-sm text-muted-foreground mb-1">Participants</dt>
                <dd className="text-2xl font-bold text-foreground">
                  {totalResponses}
                  {study.participantTarget > 0 && <span className="text-lg font-normal text-muted-foreground"> / {study.participantTarget}</span>}
                </dd>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <dt className="text-sm text-muted-foreground mb-1">Questions</dt>
                <dd className="text-2xl font-bold text-foreground">{study.questions.length}</dd>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <dt className="text-sm text-muted-foreground mb-1">Reward per participant</dt>
                <dd className="text-2xl font-bold text-foreground">{study.rewardCredits} TC</dd>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <dt className="text-sm text-muted-foreground mb-1">Participant Target</dt>
                <dd className="text-2xl font-bold text-foreground">{study.participantTarget > 0 ? study.participantTarget : "No limit"}</dd>
              </div>
            </dl>
            
            {fieldCollectedResponses > 0 && (
              <div className="mt-6 border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3">Collection Breakdown</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 p-3 rounded-lg border border-border">
                    <dt className="text-xs text-muted-foreground mb-1">Self Responses</dt>
                    <dd className="text-lg font-bold">{selfResponses}</dd>
                  </div>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border">
                    <dt className="text-xs text-muted-foreground mb-1">Field Collected</dt>
                    <dd className="text-lg font-bold">{fieldCollectedResponses}</dd>
                  </div>
                </div>
                
                {Object.keys(collectorStats).length > 0 && (
                  <div className="mt-4">
                    <dt className="text-xs text-muted-foreground mb-2">By Data Collector:</dt>
                    <div className="space-y-2">
                      {Object.entries(collectorStats).map(([name, count]) => (
                        <div key={name} className="flex justify-between text-sm items-center bg-muted/20 px-3 py-2 rounded">
                          <span className="font-medium text-foreground">{name}</span>
                          <span className="text-muted-foreground">{count} responses</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funding</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <dt className="text-sm text-muted-foreground">Total Budget</dt>
                <dd className="font-semibold text-foreground">{study.budgetCredits} TC</dd>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <dt className="text-sm text-muted-foreground">Credits Paid</dt>
                <dd className="font-semibold text-foreground">{study.creditsPaid} TC</dd>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-border">
                <dt className="text-sm text-muted-foreground">Remaining</dt>
                <dd className="font-semibold text-foreground">{remainingCredits} TC</dd>
              </div>
            </dl>

            {study.budgetCredits > 0 && (
              <div className="mt-6 pt-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Funding Used</span>
                  <span className="font-medium text-foreground">{Math.min(100, Math.round((study.creditsPaid / study.budgetCredits) * 100))}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${Math.min(100, Math.round((study.creditsPaid / study.budgetCredits) * 100))}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </div>
      )}

      {/* ── View 2: AI Analysis ── */}
      {activeView === "analysis" && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <AIAnalysisTab
            studyId={study.id}
            studyTitle={study.title}
            responsesCount={totalResponses}
            participantTarget={study.participantTarget}
            category={study.category}
            studyType={study.studyType}
            status={study.status}
            objective={study.objective}
            description={study.description}
            targetPopulation={study.targetPopulation}
            estimatedMinutes={study.estimatedMinutes}
            rewardCredits={study.rewardCredits}
            questionCount={study.questions.length}
            fieldCollectedResponses={fieldCollectedResponses}
            selfResponses={selfResponses}
          />
        </div>
      )}

      {/* ── View 3: Data Visualizations ── */}
      {activeView === "visualizations" && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-8">
          {totalResponses > 0 ? (
            <div className="mb-6">
              <DataVisualizationStudio
                studyTitle={study.title}
                questions={study.questions}
                responses={study.responses}
                participantTarget={study.participantTarget}
              />
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <h2 className="text-lg font-semibold text-foreground">Visualizations will appear here</h2>
                <p className="mt-1 text-sm text-muted-foreground">Charts are available after participants submit responses.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── View 4: Responses ── */}
      {activeView === "responses" && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-8 space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Question-by-Question Breakdown</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Raw response tallies, linear scale averages, and frequency distributions.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
              {totalResponses} responses
            </span>
          </div>

      {totalResponses === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="mb-2 text-lg font-semibold text-foreground">No responses yet</h3>
            <p className="text-muted-foreground">Analysis will appear when participants submit responses.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {study.questions.map((question, idx) => {
            const answers = study.responses
              .map((response) => getAnswer(response, question.id))
              .filter((answer): answer is NonNullable<typeof answer> => Boolean(answer));

            return (
              <Card key={question.id}>
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                      {question.text}
                    </CardTitle>
                    <Badge variant="secondary" className="ml-4 flex-shrink-0">{answers.length} Responses</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {/* NUMBER & LINEAR SCALE */}
                  {(question.type === "NUMBER" || question.type === "LINEAR_SCALE") && (() => {
                    const numbers = answers
                      .map((answer) => answer.numberValue)
                      .filter((value): value is number => value !== null && value !== undefined);

                    if (numbers.length === 0) return <p className="text-muted-foreground text-sm">No numerical data available.</p>;

                    const sum = numbers.reduce((a, b) => a + b, 0);
                    const average = sum / numbers.length;

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-muted/50 p-3 rounded-md border border-border text-center">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Average</div>
                            <div className="text-xl font-bold text-foreground">{average.toFixed(2)}</div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-md border border-border text-center">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Minimum</div>
                            <div className="text-xl font-bold text-foreground">{Math.min(...numbers)}</div>
                          </div>
                          <div className="bg-muted/50 p-3 rounded-md border border-border text-center">
                            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Maximum</div>
                            <div className="text-xl font-bold text-foreground">{Math.max(...numbers)}</div>
                          </div>
                        </div>
                        {question.type === "LINEAR_SCALE" && (
                          <div className="mt-4 pt-4 border-t border-border">
                            <h4 className="text-sm font-medium mb-3">Distribution</h4>
                            <div className="space-y-2">
                              {Array.from({ length: (question.scaleMax || 5) - (question.scaleMin || 1) + 1 }).map((_, i) => {
                                const val = (question.scaleMin || 1) + i;
                                const count = numbers.filter(n => n === val).length;
                                return (
                                  <div key={val} className="relative pt-1">
                                    <div className="flex mb-1 items-center justify-between">
                                      <span className="text-sm font-medium text-foreground">{val}</span>
                                      <span className="text-sm font-medium text-muted-foreground">{count} ({percentage(count)}%)</span>
                                    </div>
                                    <div className="overflow-hidden h-2 text-xs flex rounded bg-muted">
                                      <div style={{ width: `${percentage(count)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-foreground justify-center bg-slate-600"></div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* YES / NO */}
                  {question.type === "YES_NO" && (() => {
                    const yes = answers.filter((answer) => answer.textValue === "Yes").length;
                    const no = answers.filter((answer) => answer.textValue === "No").length;

                    return (
                      <div className="space-y-3">
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div><span className="text-sm font-semibold inline-block py-1 px-2 uppercase rounded-full text-success bg-emerald-200">Yes</span></div>
                            <div className="text-right"><span className="text-sm font-semibold inline-block text-success">{yes} ({percentage(yes)}%)</span></div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-success/20">
                                                          <div style={{ width: `${percentage(yes)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-foreground justify-center bg-emerald-500"></div>
                          </div>
                        </div>
                        <div className="relative pt-1">
                          <div className="flex mb-2 items-center justify-between">
                            <div><span className="text-sm font-semibold inline-block py-1 px-2 uppercase rounded-full text-rose-600 bg-rose-200">No</span></div>
                            <div className="text-right"><span className="text-sm font-semibold inline-block text-rose-600">{no} ({percentage(no)}%)</span></div>
                          </div>
                          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-rose-100">
                                                          <div style={{ width: `${percentage(no)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-foreground justify-center bg-rose-500"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* SINGLE CHOICE & DROPDOWN */}
                  {(question.type === "SINGLE_CHOICE" || question.type === "DROPDOWN") && (
                    <div className="space-y-4">
                      {question.options.map((option) => {
                        const count = answers.filter((answer) => answer.textValue === option.value).length;
                        return (
                          <div key={option.id} className="relative pt-1">
                            <div className="flex mb-1 items-center justify-between">
                              <span className="text-sm font-medium text-foreground">{option.text}</span>
                              <span className="text-sm font-medium text-muted-foreground">{count} ({percentage(count)}%)</span>
                            </div>
                            <div className="overflow-hidden h-2 text-xs flex rounded bg-muted">
                                                            <div style={{ width: `${percentage(count)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-foreground justify-center bg-slate-600"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* MULTIPLE CHOICE */}
                  {question.type === "MULTIPLE_CHOICE" && (
                    <div className="space-y-4">
                      {question.options.map((option) => {
                        let count = 0;
                        answers.forEach((answer) => {
                          if (!answer.textValue) return;
                          try {
                            const selected = JSON.parse(answer.textValue);
                            if (Array.isArray(selected) && selected.includes(option.value)) {
                              count++;
                            }
                          } catch {}
                        });

                        return (
                          <div key={option.id} className="relative pt-1">
                            <div className="flex mb-1 items-center justify-between">
                              <span className="text-sm font-medium text-foreground">{option.text}</span>
                              <span className="text-sm font-medium text-muted-foreground">{count} ({percentage(count)}%)</span>
                            </div>
                            <div className="overflow-hidden h-2 text-xs flex rounded bg-muted">
                              <div style={{ width: `${percentage(count)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-slate-600"></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* GRID TYPES */}
                  {(question.type === "MULTIPLE_CHOICE_GRID" || question.type === "CHECKBOX_GRID") && (
                    <div className="space-y-6">
                      {question.rows.map((row) => (
                        <div key={row.id} className="bg-muted/30 p-4 rounded-lg border border-border">
                          <h4 className="text-sm font-semibold mb-3">{row.text}</h4>
                          <div className="space-y-3">
                            {question.options.map((option) => {
                              let count = 0;
                              answers.forEach((answer) => {
                                if (!answer.textValue) return;
                                try {
                                  const parsed = JSON.parse(answer.textValue);
                                  if (question.type === "MULTIPLE_CHOICE_GRID") {
                                    if (parsed[row.value] === option.value) count++;
                                  } else {
                                    if (Array.isArray(parsed[row.value]) && parsed[row.value].includes(option.value)) count++;
                                  }
                                } catch {}
                              });
                              return (
                                <div key={option.id} className="relative pt-1">
                                  <div className="flex mb-1 items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">{option.text}</span>
                                    <span className="text-sm font-medium text-muted-foreground">{count} ({percentage(count)}%)</span>
                                  </div>
                                  <div className="overflow-hidden h-2 text-xs flex rounded bg-muted">
                                    <div style={{ width: `${percentage(count)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-slate-600"></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TEXT / DATE / TIME / FILE_UPLOAD */}
                  {(question.type === "SHORT_TEXT" || question.type === "LONG_TEXT" || question.type === "DATE" || question.type === "TIME" || question.type === "FILE_UPLOAD") && (
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {answers.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No responses.</p>
                      ) : (
                        answers.map((answer) => (
                          <div key={answer.id} className="bg-muted/50 p-3 rounded-md border border-border text-sm text-foreground">
                            {question.type === "FILE_UPLOAD" ? (
                              <a href={answer.textValue || "#"} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1.5"><Paperclip className="w-3.5 h-3.5" /> View File</a>
                            ) : (
                              answer.textValue
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
        </div>
      )}

      {/* ── View 5: Discussion & Feedback ── */}
      {activeView === "discussion" && (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-8 space-y-6">
          <section id="study-discussion" className="scroll-mt-6 space-y-6">
      {study.ratings && study.ratings.length > 0 && (
        <div className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Participant Reviews ({study.ratings.length})</h2>
              <p className="text-sm text-muted-foreground mt-1">Verified feedback from participants who completed this study.</p>
            </div>
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {(study.ratings.reduce((acc, r) => acc + r.rating, 0) / study.ratings.length).toFixed(1)} / 5.0
              </span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {study.ratings.map((rating) => (
              <Card key={rating.id} className="border border-border">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-xs text-primary">
                        {rating.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{rating.user.name}</p>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(rating.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= rating.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {rating.feedback ? (
                    <p className="text-xs text-foreground/80 mt-2 italic bg-muted/30 p-2.5 rounded-lg border border-border/50">
                      "{rating.feedback}"
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground italic mt-1">No written feedback provided.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Researcher Comments & Threaded Discussion View */}
      <div className="mt-12 mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Discussion ({totalComments})</h2>
          <p className="text-sm text-muted-foreground mt-1">Community inquiry and researcher responses regarding this protocol.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {study.comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No comments from participants yet.</p>
          ) : (
            study.comments.map((comment) => (
              <div key={comment.id} className="space-y-3">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                    {comment.user.avatarUrl ? (
                      <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="font-semibold text-primary">{comment.user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 bg-muted/30 rounded-2xl rounded-tl-none p-4 border border-border">
                    <div className="flex items-baseline justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{comment.user.name}</span>
                        {comment.user.role === "RESEARCHER" && (
                          <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Researcher
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.text}</p>
                  </div>
                </div>

                {/* Nested Threaded Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="pl-10 sm:pl-14 space-y-3">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-xs font-semibold text-primary">
                          {reply.user.avatarUrl ? (
                            <img src={reply.user.avatarUrl} alt={reply.user.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            reply.user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 bg-card rounded-2xl rounded-tl-none p-3.5 border border-border shadow-xs">
                          <div className="flex items-baseline justify-between gap-3 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-foreground">{reply.user.name}</span>
                              {reply.user.role === "RESEARCHER" && (
                                <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.2 rounded-full border border-emerald-500/20">
                                  Researcher
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted-foreground">
                              {new Date(reply.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
          </section>
        </div>
      )}
    </div>
  );
}
