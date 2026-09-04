import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import FundStudyButton from "../../../components/FundStudyButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ResearchStudyPage({
  params,
}: Props) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const study = await prisma.study.findUnique({
    where: {
      id,
    },
    include: {
      questions: {
        include: {
          options: true,
        },
        orderBy: {
          order: "asc",
        },
      },
      responses: {
        include: {
          answers: true,
        },
        orderBy: {
          submittedAt: "desc",
        },
      },
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

  const remainingCredits = Math.max(
    0,
    study.budgetCredits - study.creditsPaid
  );

  const participantTargetReached =
    study.participantTarget > 0 &&
    totalResponses >= study.participantTarget;

  const fundingComplete =
    study.budgetCredits > 0 &&
    study.creditsPaid >= study.budgetCredits;

  function getAnswer(
    response: (typeof activeStudy.responses)[number],
    questionId: string
  ) {
    return response.answers.find(
      (answer) => answer.questionId === questionId
    );
  }

  function percentage(count: number) {
    if (totalResponses === 0) {
      return 0;
    }

    return Math.round(
      (count / totalResponses) * 100
    );
  }

  return (
    <main>
      {/* --------------------------------------------- */}
      {/* HEADER */}
      {/* --------------------------------------------- */}

      <header>
        <Link href="/researcher">
          ← Back to Researcher Dashboard
        </Link>

        <h1>{study.title}</h1>

        {study.description && (
          <p>{study.description}</p>
        )}
      </header>

      <hr />

      {/* --------------------------------------------- */}
      {/* STUDY STATUS */}
      {/* --------------------------------------------- */}

      <section>
        <h2>Study Status</h2>

        <p>
          Status:{" "}
          <strong>{study.status}</strong>
        </p>

        {study.status === "DRAFT" && (
          <div>
            <p>
              This study is currently a draft and is
              not visible to participants.
            </p>

            {study.budgetCredits <= 0 ? (
              <p>
                <strong>
                  Set a valid study budget before
                  funding this study.
                </strong>
              </p>
            ) : (
              <div>
                <p>
                  Fund this study to make it available
                  to participants.
                </p>

                <FundStudyButton
                  studyId={study.id}
                  amount={study.budgetCredits}
                />
              </div>
            )}
          </div>
        )}

        {study.status === "ACTIVE" && (
          <p>
            This study is active and available to
            participants.
          </p>
        )}

        {study.status === "PAUSED" && (
          <p>
            This study is paused and is currently not
            available to participants.
          </p>
        )}

        {study.status === "COMPLETED" && (
          <p>
            This study has been completed.
          </p>
        )}

        {participantTargetReached && (
          <p>
            <strong>
              The participant target has been reached.
            </strong>
          </p>
        )}

        {fundingComplete && (
          <p>
            <strong>
              The full study budget has been used.
            </strong>
          </p>
        )}
      </section>

      <hr />

      {/* --------------------------------------------- */}
      {/* STUDY OVERVIEW */}
      {/* --------------------------------------------- */}

      <section>
        <h2>Study Overview</h2>

        <p>
          Participants:{" "}
          <strong>{totalResponses}</strong>

          {study.participantTarget > 0 && (
            <>
              {" / "}
              <strong>
                {study.participantTarget}
              </strong>
            </>
          )}
        </p>

        <p>
          Questions:{" "}
          <strong>
            {study.questions.length}
          </strong>
        </p>

        <p>
          Reward per participant:{" "}
          <strong>
            {study.rewardCredits} TC
          </strong>
        </p>

        <p>
          Participant target:{" "}
          <strong>
            {study.participantTarget > 0
              ? study.participantTarget
              : "No limit"}
          </strong>
        </p>
      </section>

      <hr />

      {/* --------------------------------------------- */}
      {/* FUNDING */}
      {/* --------------------------------------------- */}

      <section>
        <h2>Funding</h2>

        <p>
          Total budget:{" "}
          <strong>
            {study.budgetCredits} TC
          </strong>
        </p>

        <p>
          Credits paid:{" "}
          <strong>
            {study.creditsPaid} TC
          </strong>
        </p>

        <p>
          Remaining:{" "}
          <strong>
            {remainingCredits} TC
          </strong>
        </p>

        {study.budgetCredits > 0 && (
          <>
            <p>
              Funding used:{" "}
              <strong>
                {Math.min(
                  100,
                  Math.round(
                    (study.creditsPaid /
                      study.budgetCredits) *
                      100
                  )
                )}
                %
              </strong>
            </p>

            <progress
              value={Math.min(
                study.creditsPaid,
                study.budgetCredits
              )}
              max={study.budgetCredits}
            />
          </>
        )}

        {study.status === "DRAFT" &&
          study.budgetCredits > 0 && (
            <div>
              <p>
                <strong>
                  Funding required
                </strong>
              </p>

              <p>
                You need to fund this study before
                participants can access it.
              </p>

              <FundStudyButton
                studyId={study.id}
                amount={study.budgetCredits}
              />
            </div>
          )}

        {study.status === "ACTIVE" &&
          !fundingComplete && (
            <p>
              The study is currently funded and active.
            </p>
          )}

        {fundingComplete && (
          <p>
            <strong>
              Full budget funded.
            </strong>
          </p>
        )}
      </section>

      <hr />

      {/* --------------------------------------------- */}
      {/* EXPORT */}
      {/* --------------------------------------------- */}

      <section>
        <h2>Export Data</h2>

        <p>
          Download the responses collected from this
          study.
        </p>

        <a
          href={`/api/auth/studies/${study.id}/export`}
        >
          Export CSV
        </a>

        {" | "}

        <a
          href={`/api/auth/studies/${study.id}/export/excel`}
        >
          Export Excel
        </a>
      </section>

      <hr />

      {/* --------------------------------------------- */}
      {/* DATA ANALYSIS */}
      {/* --------------------------------------------- */}

      <section>
        <h2>Data Analysis</h2>

        {totalResponses === 0 ? (
          <p>
            Analysis will appear when participants
            submit responses.
          </p>
        ) : (
          study.questions.map((question) => {
            const answers = study.responses
              .map((response) =>
                getAnswer(response, question.id)
              )
              .filter(
                (
                  answer
                ): answer is NonNullable<
                  typeof answer
                > => Boolean(answer)
              );

            return (
              <article key={question.id}>
                <h3>{question.text}</h3>

                <p>
                  Responses:{" "}
                  <strong>
                    {answers.length}
                  </strong>
                </p>

                {/* NUMBER */}

                {question.type === "NUMBER" && (
                  (() => {
                    const numbers = answers
                      .map(
                        (answer) =>
                          answer.numberValue
                      )
                      .filter(
                        (
                          value
                        ): value is number =>
                          value !== null &&
                          value !== undefined
                      );

                    if (numbers.length === 0) {
                      return (
                        <p>
                          No numerical data available.
                        </p>
                      );
                    }

                    const sum = numbers.reduce(
                      (a, b) => a + b,
                      0
                    );

                    const average =
                      sum / numbers.length;

                    return (
                      <div>
                        <p>
                          Average:{" "}
                          <strong>
                            {average.toFixed(2)}
                          </strong>
                        </p>

                        <p>
                          Minimum:{" "}
                          <strong>
                            {Math.min(...numbers)}
                          </strong>
                        </p>

                        <p>
                          Maximum:{" "}
                          <strong>
                            {Math.max(...numbers)}
                          </strong>
                        </p>
                      </div>
                    );
                  })()
                )}

                {/* YES / NO */}

                {question.type === "YES_NO" && (
                  (() => {
                    const yes =
                      answers.filter(
                        (answer) =>
                          answer.textValue === "Yes"
                      ).length;

                    const no =
                      answers.filter(
                        (answer) =>
                          answer.textValue === "No"
                      ).length;

                    return (
                      <div>
                        <p>
                          Yes:{" "}
                          <strong>{yes}</strong>{" "}
                          ({percentage(yes)}%)
                        </p>

                        <p>
                          No:{" "}
                          <strong>{no}</strong>{" "}
                          ({percentage(no)}%)
                        </p>
                      </div>
                    );
                  })()
                )}

                {/* SINGLE CHOICE */}

                {question.type ===
                  "SINGLE_CHOICE" && (
                  <div>
                    {question.options.map(
                      (option) => {
                        const count =
                          answers.filter(
                            (answer) =>
                              answer.textValue ===
                              option.value
                          ).length;

                        return (
                          <p key={option.id}>
                            {option.text}:{" "}
                            <strong>
                              {count}
                            </strong>{" "}
                            ({percentage(count)}%)
                          </p>
                        );
                      }
                    )}
                  </div>
                )}

                {/* MULTIPLE CHOICE */}

                {question.type ===
                  "MULTIPLE_CHOICE" && (
                  <div>
                    {question.options.map(
                      (option) => {
                        let count = 0;

                        answers.forEach(
                          (answer) => {
                            if (
                              !answer.textValue
                            ) {
                              return;
                            }

                            try {
                              const selected =
                                JSON.parse(
                                  answer.textValue
                                );

                              if (
                                Array.isArray(
                                  selected
                                ) &&
                                selected.includes(
                                  option.value
                                )
                              ) {
                                count++;
                              }
                            } catch {
                              // Ignore malformed data
                            }
                          }
                        );

                        return (
                          <p key={option.id}>
                            {option.text}:{" "}
                            <strong>
                              {count}
                            </strong>{" "}
                            ({percentage(count)}%)
                          </p>
                        );
                      }
                    )}
                  </div>
                )}

                {/* TEXT / DATE */}

                {(question.type ===
                  "SHORT_TEXT" ||
                  question.type ===
                    "LONG_TEXT" ||
                  question.type === "DATE") && (
                  <div>
                    <h4>Responses</h4>

                    {answers.length === 0 ? (
                      <p>
                        No responses.
                      </p>
                    ) : (
                      answers.map((answer) => (
                        <p key={answer.id}>
                          {answer.textValue}
                        </p>
                      ))
                    )}
                  </div>
                )}

                <hr />
              </article>
            );
          })
        )}
      </section>

      <br />

      <Link href="/researcher">
        ← Back to Researcher Dashboard
      </Link>
    </main>
  );
}