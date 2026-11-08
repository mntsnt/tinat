import { notFound, redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import Link from "next/link";
import StudyQuestionnaire from "./StudyQuestionnaire";
import { Button } from "../../../components/ui/Button";
import { isCrossModeExcluded, hasUserParticipated } from "@/lib/identity/linkService";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function StudyPage(props: Props) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const { id } = await props.params;

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
        select: {
          responses: true,
          likes: true,
        },
      },
      likes: {
        where: {
          userId: session.userId,
        },
        select: {
          userId: true,
        },
      },
      comments: {
        where: { parentId: null },
        include: {
          user: { select: { name: true, avatarUrl: true, role: true } },
          replies: {
            include: { user: { select: { name: true, avatarUrl: true, role: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      parentStudy: {
        select: {
          id: true,
          title: true,
          status: true,
          fundingType: true,
          rewardCredits: true,
          estimatedMinutes: true,
          ethicsApproval: {
            select: {
              status: true,
              expiryDate: true,
            },
          },
        },
      },
    },
  });

  if (!study || study.status === "DRAFT") {
    notFound();
  }

  // Check if current participant already completed the study
  const alreadyParticipated = await hasUserParticipated({
    studyId: id,
    userId: session.userId,
  });

  if (alreadyParticipated) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="bg-card border border-border p-6 rounded-xl max-w-md w-full shadow-sm">
          <h2 className="text-xl font-bold mb-3">Already Completed</h2>
          <p className="text-muted-foreground text-sm mb-6">
            You have already submitted your responses for this study. Thank you for your contribution to health research!
          </p>
          <Link href="/participant/studies">
            <Button className="w-full">Discover More Studies</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Check cross-mode participation exclusion
  const crossMode = await isCrossModeExcluded({
    userId: session.userId,
    studyId: id,
  });

  if (crossMode.excluded) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="bg-card border border-border p-6 rounded-xl max-w-md w-full shadow-sm">
          <h2 className="text-xl font-bold mb-3">Study Unavailable</h2>
          <p className="text-muted-foreground text-sm mb-6">
            {crossMode.reason || "Cross-mode participation is not permitted for linked studies to ensure research validity."}
          </p>
          <Link href="/participant/studies">
            <Button className="w-full">Back to Discover</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Evaluate if teaser card offering full parent study is valid
  let parentTeaser: {
    id: string;
    title: string;
    estimatedMinutes: number;
    fundingType: string;
    rewardCredits: number;
  } | null = null;

  if (study.format === "TINTOK" && study.teaserLinkEnabled && study.parentStudy) {
    const parent = study.parentStudy;
    const isParentActive = parent.status === "ACTIVE";
    const ethicsExpired = parent.ethicsApproval?.expiryDate
      ? new Date(parent.ethicsApproval.expiryDate) < new Date()
      : false;
    const ethicsValid = parent.ethicsApproval?.status === "VERIFIED" && !ethicsExpired;

    if (isParentActive && ethicsValid) {
      parentTeaser = {
        id: parent.id,
        title: parent.title,
        estimatedMinutes: parent.estimatedMinutes || 10,
        fundingType: parent.fundingType,
        rewardCredits: parent.rewardCredits,
      };
    }
  }

  const isCompletedOrPaused = study.status === "COMPLETED" || study.status === "PAUSED";
  
  const remaining = study.budgetCredits - study.creditsPaid;
  const budgetExhausted = study.rewardCredits > 0 && study.rewardCredits > remaining;
  
  const targetReached = study.participantTarget > 0 && study._count.responses >= study.participantTarget;

  const cannotParticipate = isCompletedOrPaused || budgetExhausted || targetReached;

  if (cannotParticipate) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="bg-muted/50 border border-border p-6 rounded-lg max-w-md w-full">
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

  return (
    <StudyQuestionnaire
      study={study as any}
      currentUserId={session.userId}
      initialHasLiked={study.likes.length > 0}
      initialLikeCount={study._count.likes}
      parentTeaser={parentTeaser}
    />
  );
}

