"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderKanban,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  ShieldCheck,
  Building,
  Mail,
  ArrowRight,
  Clock,
} from "lucide-react";

export default function ProjectInvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);
  const [actionDone, setActionDone] = useState<"ACCEPTED" | "DECLINED" | null>(null);

  useEffect(() => {
    fetchInvite();
  }, [token]);

  async function fetchInvite() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/invite/${token}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invitation not found or expired");
      }
      setInvitation(data.invitation);
    } catch (err: any) {
      setError(err.message || "Failed to load invitation");
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: "ACCEPT" | "DECLINE") {
    setActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/invite/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/login?redirect=/projects/invite/${token}`;
          return;
        }
        throw new Error(data.error || "Failed to process invitation");
      }

      setActionDone(action === "ACCEPT" ? "ACCEPTED" : "DECLINED");
      if (action === "ACCEPT") {
        setTimeout(() => {
          router.push(`/projects/${data.projectId}`);
        }, 1200);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading Collaboration Invitation...
          </p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl border border-rose-200 dark:border-rose-900 bg-white dark:bg-slate-900 text-center shadow-xs">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invitation Unavailable</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {error || "This invitation link is invalid or has expired."}
          </p>
          <Link
            href="/projects"
            className="mt-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
          >
            Go to Projects
          </Link>
        </div>
      </div>
    );
  }

  const { project, inviter } = invitation;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-xl">
        {actionDone === "ACCEPTED" ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Invitation Accepted!</h2>
            <p className="text-xs text-slate-500 mt-1">Redirecting you to the research workspace...</p>
          </div>
        ) : actionDone === "DECLINED" ? (
          <div className="text-center py-6">
            <XCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Invitation Declined</h2>
            <p className="text-xs text-slate-500 mt-1">You have declined this project collaboration request.</p>
            <Link
              href="/projects"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
            >
              Back to Projects
            </Link>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs mb-2 uppercase tracking-wider">
              <FolderKanban className="w-4 h-4" />
              Research Collaboration Request
            </div>

            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {project.title}
            </h1>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {project.studyDesign}
              </span>
              {project.institution && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  {project.institution}
                </span>
              )}
            </div>

            {project.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
                {project.description}
              </p>
            )}

            {/* Invitation Details Card */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Invited By:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {inviter.name} ({inviter.email})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Offered Role:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {invitation.role.replace(/_/g, " ")}
                </span>
              </div>
              {invitation.message && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-medium">Personal Note:</span>
                  <p className="mt-0.5 text-slate-700 dark:text-slate-300 italic">
                    "{invitation.message}"
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={acting}
                onClick={() => handleAction("DECLINE")}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
              >
                Decline
              </button>
              <button
                type="button"
                disabled={acting}
                onClick={() => handleAction("ACCEPT")}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                {acting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Accept & Open Workspace
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
