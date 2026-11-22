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
  title: "Tinat Ask | Direct Q&A & Visual Decks",
  description:
    "Create your personal Q&A link. Receive private questions without account barriers, and turn your best answers into export-ready social decks.",
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
          // If conflict occurred, dashboard handles manual profile creation
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

  // --- UNAUTHENTICATED MARKETING LANDING ---
  return (
    <div className="flex-1 max-w-4xl mx-auto px-4 py-10 sm:py-16 space-y-10 sm:space-y-14">
      {/* Hero Section */}
      <div className="text-center space-y-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5" />
          Tinat Ask &bull; Direct Q&A &amp; Visual Decks
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground max-w-2xl mx-auto leading-tight">
          Ask freely. <br />
          <span className="text-emerald-600 dark:text-emerald-400">
            Answer with clarity.
          </span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Create your personal Q&amp;A link. Receive private questions without account barriers, and turn your answers into export-ready visual decks for Instagram, Telegram, and WhatsApp.
        </p>

        {/* CTA Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/register?redirect=/ask"
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-900/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            Create Your Ask Link <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login?redirect=/ask"
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-border bg-card font-medium text-sm text-foreground hover:bg-muted transition-all flex items-center justify-center"
          >
            Log In
          </Link>
        </div>

        {/* Quiet Trust Signals */}
        <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-7 pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            100% Private by default
          </span>
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Instagram Story (9:16) &amp; Post (4:5)
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Zero account required to ask
          </span>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pt-2">
        {/* Card 1 */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3 shadow-2xs hover:border-emerald-500/30 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <MessageCircleQuestion className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Direct &amp; Frictionless</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Anyone with your link can send a question in seconds without creating an account or downloading an app.
          </p>
        </div>

        {/* Card 2 */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3 shadow-2xs hover:border-emerald-500/30 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Visual Question Decks</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Turn your answers into high-resolution social cards across 10 clean themes. Ready for Instagram Stories, WhatsApp Status, and Telegram.
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-card border border-border/80 rounded-2xl p-5 space-y-3 shadow-2xs hover:border-emerald-500/30 transition-colors">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Eye className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Curated Showcase</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Keep full control over your page. Answer privately or publish your favorite answers to your public profile showcase.
          </p>
        </div>
      </div>
    </div>
  );
}
