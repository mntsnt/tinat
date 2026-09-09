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

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ResearchStudyPage({ params }: Props) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const study = await prisma.study.findUnique({
    where: { id },
    include: {
      questions: { include: { options: true, rows: true }, orderBy: { order: "asc" } },
      responses: { include: { answers: true }, orderBy: { submittedAt: "desc" } },
      likes: true,
      comments: {
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

  const totalResponses = activeStudy.responses.length;
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
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <Link href="/researcher" className={getButtonClasses("ghost", "md", "-ml-4 mb-4")}>
          &larr; Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{study.title}</h1>
            {study.description && <p className="text-muted-foreground mt-2 max-w-3xl">{study.description}</p>}
          </div>
          <div className="flex gap-2">
            <Badge variant={study.status === "ACTIVE" ? "success" : study.status === "COMPLETED" ? "secondary" : "warning"} className="text-sm">
              {study.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Study Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {study.status === "DRAFT" && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800 mb-2">This study is currently a draft and is not visible to participants.</p>
                {study.budgetCredits <= 0 ? (
                  <div>
                    <p className="text-sm text-blue-900 mb-3">This study has no budget. You can publish it as an unpaid volunteer study.</p>
                    <PublishUnfundedButton studyId={study.id} />
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-blue-900 mb-3">Fund this study to make it available to participants.</p>
                    <FundStudyButton studyId={study.id} amount={study.budgetCredits} />
                  </div>
                )}
              </div>
            )}
            {study.status === "ACTIVE" && <p className="text-muted-foreground">This study is active and available to participants.</p>}
            {study.status === "PAUSED" && <p className="text-muted-foreground">This study is paused and is currently not available to participants.</p>}
            {study.status === "COMPLETED" && <p className="text-muted-foreground">This study has been completed.</p>}
            
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

      <div className="grid gap-6 md:grid-cols-2 mb-12">
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
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <dt className="text-sm text-muted-foreground mb-1">Likes</dt>
                <dd className="text-2xl font-bold text-foreground">{study.likes.length}</dd>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <dt className="text-sm text-muted-foreground mb-1">Comments</dt>
                <dd className="text-2xl font-bold text-foreground">{study.comments.length}</dd>
              </div>
            </dl>
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

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Data Analysis</h2>
      </div>

      <div className="mb-8">
        <AIAnalysisTab studyId={study.id} responsesCount={totalResponses} />
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
                              <a href="#" className="text-blue-500 hover:underline">{answer.textValue}</a>
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

      {/* Researcher Comments View */}
      <div className="mt-12 mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Discussion ({study.comments.length})</h2>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          {study.comments.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No comments from participants yet.</p>
          ) : (
            study.comments.map((comment) => (
              <div key={comment.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                  {comment.user.avatarUrl ? (
                    <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="font-semibold text-primary">{comment.user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1 bg-muted/30 rounded-2xl rounded-tl-none p-4 border border-border">
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <span className="font-semibold text-sm">{comment.user.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.text}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}