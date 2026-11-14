import { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AskDashboardClient } from "./components/AskDashboardClient";
import {
  Sparkles,
  ShieldCheck,
  Share2,
  Lock,
  ArrowRight,
  MessageCircleQuestion,
  Smartphone,
  Eye,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tinat Ask | Social Q&A and Question Decks",
  description:
    "Create a personal Q&A page, receive questions without an account requirement, and share selected answers as social question decks.",
};

export default async function AskPage() {
  const session = await getSession();

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        role: true,
        askProfile: true,
      },
    });

    if (user) {
      if (!user.askProfile && user.username) {
        try {
          user.askProfile = await prisma.askProfile.create({
            data: {
              userId: user.id,
              username: user.username,
              displayName: user.name,
            },
          });
        } catch {
          // In case username conflict occurred, fall back to normal flow
        }
      }
      let stats = {
        total: 0,
        unanswered: 0,
        answered: 0,
        archived: 0,
        public: 0,
      };

      if (user.askProfile) {
        const [unanswered, answered, archived, pub] = await Promise.all([
          prisma.askQuestion.count({
            where: { profileId: user.askProfile.id, status: "UNANSWERED" },
          }),
          prisma.askQuestion.count({
            where: { profileId: user.askProfile.id, status: "ANSWERED" },
          }),
          prisma.askQuestion.count({
            where: { profileId: user.askProfile.id, status: "ARCHIVED" },
          }),
          prisma.askQuestion.count({
            where: {
              profileId: user.askProfile.id,
              status: "ANSWERED",
              isPublic: true,
            },
          }),
        ]);

        stats = {
          total: unanswered + answered + archived,
          unanswered,
          answered,
          archived,
          public: pub,
        };
      }

      return (
        <AskDashboardClient
          initialProfile={user.askProfile}
          initialStats={stats}
          user={{
            name: user.name,
            username: user.username,
            email: user.email,
            role: user.role,
          }}
        />
      );
    }
  }

  // --- PUBLIC MARKETING LANDING (When unauthenticated) ---
  return (
    <div className="flex-1 max-w-5xl mx-auto px-4 py-12 sm:py-16 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          Introducing Tinat Ask • Personal Q&A
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-snug">
          Ask Anything. <br />
          <span className="bg-primary bg-clip-text text-transparent">
            Answer What Matters.
          </span>
        </h1>

        <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Create a personal Q&A page. People can submit questions without an account, and you can turn selected answers into shareable question decks.
        </p>

        {/* CTA Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register?redirect=/ask"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm sm:text-base shadow-lg hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Claim Your Free Ask Page <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login?redirect=/ask"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-border bg-card font-medium text-sm sm:text-base hover:bg-muted transition-all"
          >
            Log In
          </Link>
        </div>

        {/* Guarantee Badge */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            No sender profile attached
          </span>
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-primary" />
            Story & Post Decks
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            Questions without accounts
          </span>
        </div>
      </div>

      {/* Visual Feature Previews */}
      <div className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Honest Q&A */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <MessageCircleQuestion className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Questions without sender profiles</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Anyone with your link can send a question without creating an account. A sender&apos;s name or account profile is not attached to the saved question. IP addresses are processed temporarily in memory for rate limiting and are not saved with the question.
            </p>
          </div>

          {/* Card 2: 7 Aesthetic Decks */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">7 Aesthetic Question Decks</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Turn your answers into beautiful, high-res social graphics across 7 styles: Obsidian, Aurora, Minimal, Editorial, Cyber Pop, Clean Mint & Glass Modern.
            </p>
          </div>

          {/* Card 3: Instant Social Export */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold">Story & Post Formats</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Export in crisp 9:16 Story format for Instagram & WhatsApp Status, or 4:5 Post format for feeds. Download PNG or share directly with 1 tap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
