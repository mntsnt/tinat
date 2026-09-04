import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import StudyStatusButton from "../components/StudyStatusButton";

export default async function ResearcherDashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  if (!user || user.role !== "RESEARCHER") {
    redirect("/dashboard");
  }

  const studies = await prisma.study.findMany({
    where: {
      researcherId: user.id,
    },
    include: {
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

  return (
    <main>
      <h1>Researcher Dashboard</h1>

      <h2>Welcome, {user.name}</h2>

      <div>
        <Link href="/researcher/studies/new">
          Create New Study
        </Link>
      </div>

      <hr />

      <h2>My Research</h2>

      {studies.length === 0 ? (
        <p>You haven&apos;t created any studies yet.</p>
      ) : (
        <div>
          {studies.map((study) => (
            <article key={study.id}>
              <h3>{study.title}</h3>

              <p>
                {study.description ||
                  "No description provided."}
              </p>

              <p>
                Status: <strong>{study.status}</strong>
              </p>

              <p>
                Questions: {study._count.questions}
              </p>

              <p>
                Participants: {study._count.responses}
              </p>

              <p>
                Reward: {study.rewardCredits} TC
              </p>

              <StudyStatusButton
                studyId={study.id}
                currentStatus={study.status}
              />

              <Link href={`/researcher/studies/${study.id}`}>
                View Results
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}