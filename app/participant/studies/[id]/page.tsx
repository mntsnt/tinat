import { notFound, redirect } from "next/navigation";
import { getSession } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import Link from "next/link";
import { Lock } from "lucide-react";
import StudyQuestionnaire from "./StudyQuestionnaire";
import { ButtonLink } from "../../../components/ui/Button";

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
          id: true,
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
      dataCollectors: {
        where: { userId: session.userId },
        select: { id: true },
      },
      assignedParticipants: {
        where: { userId: session.userId },
        select: { id: true },
      },
    },
  });

  if (!study || study.status === "DRAFT") {
    notFound();
  }

  // Private study access enforcement: only owner, admin, assigned collectors, or assigned participants
  if (study.isPrivate) {
    const isOwner = study.researcherId === session.userId;
    const currentUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    const isAdmin = currentUser?.role === "ADMIN";
    const isAssignedCollector = study.dataCollectors.length > 0;
    const isAssignedParticipant = study.assignedParticipants.length > 0;

    if (!isOwner && !isAdmin && !isAssignedCollector && !isAssignedParticipant) {
      return (
        <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
          <div className="bg-muted/40 border border-border p-8 rounded-2xl max-w-md w-full shadow-sm space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Private Study</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This research is private and restricted. Only participants directly assigned by the researcher or deployed field collectors have permission to access it.
            </p>
            <div className="pt-2">
              <ButtonLink href="/participant/studies" className="w-full">
                Browse Public Studies
              </ButtonLink>
            </div>
          </div>
        </div>
      );
    }
  }

  const isCompletedOrPaused = study.status === "COMPLETED" || study.status === "PAUSED";
  const targetReached = study.participantTarget > 0 && study._count.responses >= study.participantTarget;
  const cannotParticipate = isCompletedOrPaused || targetReached;

  if (cannotParticipate) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center text-center">
        <div className="bg-muted/50 border border-border p-6 rounded-lg max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Study Closed</h2>
          <p className="text-muted-foreground mb-6">
            {isCompletedOrPaused 
              ? "This study is currently paused or has already been completed." 
              : "This study has reached its participant target and is no longer accepting responses."}
          </p>
          <ButtonLink href="/participant/studies" className="w-full">
            Back to Discover
          </ButtonLink>
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
    />
  );
}

