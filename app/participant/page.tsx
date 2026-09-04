import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import LogoutButton from "../components/LogoutButton";

export default async function ParticipantDashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    include: {
      wallet: true,
      responses: {
        include: {
          study: {
            select: {
              id: true,
              title: true,
              rewardCredits: true,
              researcher: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          submittedAt: "desc",
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "PARTICIPANT") {
    redirect("/dashboard");
  }

  // ---------------------------------------------
  // Get all active studies
  // ---------------------------------------------

  const studies = await prisma.study.findMany({
    where: {
      status: "ACTIVE",
    },
    include: {
      researcher: {
        select: {
          name: true,
        },
      },
      _count: {
        select: {
          questions: true,
          responses: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // ---------------------------------------------
  // IDs of studies already completed
  // ---------------------------------------------

  const completedStudyIds = new Set(
    user.responses.map(
      (response) => response.studyId
    )
  );

  // ---------------------------------------------
  // Only show studies not completed
  // ---------------------------------------------

  const availableStudies = studies.filter(
    (study) =>
      !completedStudyIds.has(study.id) &&
      (
        study.participantTarget === 0 ||
        study._count.responses <
          study.participantTarget
      )
  );

  // ---------------------------------------------
  // Calculate total credits earned
  // ---------------------------------------------

  const totalCreditsEarned =
    user.responses.reduce(
      (total, response) =>
        total + response.study.rewardCredits,
      0
    );

  return (
    <main>
      <h1>Participant Dashboard</h1>

      <h2>Welcome, {user.name}</h2>

<p>
  <Link href="/participant/wallet">
    View Wallet & Transaction History
  </Link>
</p>

      {/* --------------------------------------- */}
      {/* WALLET */}
      {/* --------------------------------------- */}

      <section>
        <h2>Your Tinat Credits</h2>

        <strong>
          {user.wallet?.balance ?? 0} TC
        </strong>

        <p>
          Total earned:{" "}
          <strong>
            {totalCreditsEarned} TC
          </strong>
        </p>
      </section>

      <hr />

      {/* --------------------------------------- */}
      {/* AVAILABLE RESEARCH */}
      {/* --------------------------------------- */}

      <section>
        <h2>Available Research</h2>

        {availableStudies.length === 0 ? (
          <p>
            There are no research studies available
            for you right now.
          </p>
        ) : (
          <div>
            {availableStudies.map((study) => {
              const spotsRemaining =
                study.participantTarget > 0
                  ? study.participantTarget -
                    study._count.responses
                  : null;

              return (
                <article key={study.id}>
                  <h3>{study.title}</h3>

                  <p>
                    {study.description ||
                      "No description provided."}
                  </p>

                  <p>
                    Researcher:{" "}
                    {study.researcher.name}
                  </p>

                  <p>
                    Questions:{" "}
                    {study._count.questions}
                  </p>

                  <p>
                    Reward:{" "}
                    <strong>
                      {study.rewardCredits} TC
                    </strong>
                  </p>

                  {spotsRemaining !== null && (
                    <p>
                      Participants:{" "}
                      {study._count.responses}/
                      {study.participantTarget}
                      {" "}
                      ({spotsRemaining} spots left)
                    </p>
                  )}

                  <Link
                    href={`/participant/studies/${study.id}`}
                  >
                    View Study
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <hr />

      {/* --------------------------------------- */}
      {/* COMPLETED RESEARCH */}
      {/* --------------------------------------- */}

      <section>
        <h2>Completed Research</h2>

        {user.responses.length === 0 ? (
          <p>
            You haven&apos;t completed any research
            studies yet.
          </p>
        ) : (
          <div>
            {user.responses.map((response) => (
              <article key={response.id}>
                <h3>
                  {response.study.title}
                </h3>

                <p>
                  Researcher:{" "}
                  {response.study.researcher.name}
                </p>

                <p>
                  Credits earned:{" "}
                  <strong>
                    {response.study.rewardCredits} TC
                  </strong>
                </p>

                <p>
                  Completed:{" "}
                  {response.submittedAt.toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>

                <span>
                  Completed
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <hr />

      <LogoutButton />
    </main>
  );
}
