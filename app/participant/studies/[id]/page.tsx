import { notFound, redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import Link from "next/link";
import StudyQuestionnaire from "./StudyQuestionnaire";
import { Button } from "../../../components/ui/Button";

type RouteParams = {
  id?: string;
};

type Props = {
  params?: RouteParams | Promise<RouteParams>;
};

export default async function StudyPage(props: Props) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const rawParams = props?.params;
  const params = rawParams
    ? await Promise.resolve(rawParams)
    : {};

  const id = params.id;

  if (!id) {
    notFound();
  }

  const study = await prisma.study.findUnique({
    where: {
      id,
    },
    include: {
      researcher: {
        select: {
          name: true,
        },
      },
      questions: {
        include: {
          options: true,
            rows: true,
        },
        orderBy: {
          order: "asc",
        },
      },
      _count: {
        select: { responses: true }
      }
    },
  });

  if (!study || study.status === "DRAFT") {
    notFound();
  }

  const isCompletedOrPaused = study.status === "COMPLETED" || study.status === "PAUSED";
  
  const remaining = study.budgetCredits - study.creditsPaid;
  const budgetExhausted = study.rewardCredits > remaining;
  
  const targetReached = study.participantTarget > 0 && study._count.responses >= study.participantTarget;

  const cannotParticipate = isCompletedOrPaused || budgetExhausted || targetReached;

  if (cannotParticipate) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="bg-muted/50 border border-border p-8 rounded-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Study Closed</h2>
          <p className="text-muted-foreground mb-6">
            {isCompletedOrPaused 
              ? "This study is currently paused or has already been completed." 
              : "This study has reached its participant limit or budget capacity and is no longer accepting responses."}
          </p>
          <Link href="/participant/studies">
            <Button className="w-full">Back to Discover</Button>
          </Link>
        </div>
      </div>
    );
  }

  return <StudyQuestionnaire study={study} />;
}
