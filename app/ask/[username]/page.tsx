import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { AskPublicClient } from "./AskPublicClient";
import { HelpCircle, ArrowRight } from "lucide-react";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const profile = await prisma.askProfile.findUnique({
    where: { username: username.toLowerCase().trim() },
    select: { displayName: true, username: true, bio: true },
  });

  if (!profile) {
    return {
      title: "Ask Profile Not Found | Tinat Ask",
    };
  }

  return {
    title: `Ask ${profile.displayName} (@${profile.username}) anything anonymously | Tinat Ask`,
    description:
      profile.bio ||
      `Send an anonymous question or message to ${profile.displayName} on Tinat Ask! 100% anonymous, no account required.`,
    openGraph: {
      title: `Ask ${profile.displayName} anything anonymously!`,
      description:
        profile.bio ||
        `Send an anonymous question to ${profile.displayName} on Tinat Ask. 100% anonymous.`,
    },
  };
}

export default async function AskUserProfilePage({ params }: Props) {
  const { username } = await params;

  const profile = await prisma.askProfile.findUnique({
    where: { username: username.toLowerCase().trim() },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      avatarUrl: true,
      theme: true,
      isEnabled: true,
      allowPublicAnswers: true,
    },
  });

  if (!profile || !profile.isEnabled) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          Ask Page Unavailable
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          The Ask page for &ldquo;@{username}&rdquo; does not exist or has been paused by the owner.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/ask"
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
          >
            Create Your Own Ask Page <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl border border-border bg-card font-medium text-sm hover:bg-muted transition-all"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  // Fetch public answered questions if enabled
  const publicQuestions = profile.allowPublicAnswers
    ? await prisma.askQuestion.findMany({
        where: {
          profileId: profile.id,
          status: "ANSWERED",
          isPublic: true,
        },
        select: {
          id: true,
          questionText: true,
          answerText: true,
          answeredAt: true,
        },
        orderBy: { answeredAt: "desc" },
        take: 25,
      })
    : [];

  return (
    <AskPublicClient
      profile={{
        username: profile.username,
        displayName: profile.displayName || profile.username,
        bio: profile.bio,
        avatarUrl: profile.avatarUrl,
        theme: profile.theme,
        allowPublicAnswers: profile.allowPublicAnswers,
      }}
      publicQuestions={publicQuestions.map((q) => ({
        ...q,
        answeredAt: q.answeredAt ? q.answeredAt.toISOString() : null,
      }))}
    />
  );
}
