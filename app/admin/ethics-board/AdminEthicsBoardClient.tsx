"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Award,
  BookOpen,
  Plus,
  Loader2,
  CheckCircle2,
  Building,
  Calendar,
} from "lucide-react";
import { Button } from "@/app/components/ui/Button";

interface Member {
  id: string;
  name: string;
  title: string;
  institution: string;
  role: string;
  appointedAt: string | Date;
  isActive: boolean;
}

interface Decision {
  id: string;
  title: string;
  meetingDate: string | Date;
  summary: string;
  resolution: string;
  publishedAt: string | Date;
}

export function AdminEthicsBoardClient({
  initialMembers,
  initialDecisions,
}: {
  initialMembers: Member[];
  initialDecisions: Decision[];
}) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [decisions, setDecisions] = useState<Decision[]>(initialDecisions);

  // Forms state
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);

  const [memberName, setMemberName] = useState("");
  const [memberTitle, setMemberTitle] = useState("");
  const [memberInstitution, setMemberInstitution] = useState("");
  const [memberRole, setMemberRole] = useState("External Bioethics Specialist");

  const [decisionTitle, setDecisionTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [summary, setSummary] = useState("");
  const [resolution, setResolution] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!memberName.trim() || !memberInstitution.trim()) {
      return setError("Name and Institution are required.");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/ethics-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "MEMBER",
          name: memberName,
          title: memberTitle || "Advisory Board Member",
          institution: memberInstitution,
          role: memberRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add board member.");
      } else {
        setShowMemberModal(false);
        setMemberName("");
        setMemberTitle("");
        setMemberInstitution("");
        router.refresh();
      }
    } catch {
      setError("Network error adding board member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!decisionTitle.trim() || !summary.trim() || !resolution.trim()) {
      return setError("Title, Summary, and Resolution are required.");
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/ethics-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "DECISION",
          title: decisionTitle,
          meetingDate: meetingDate || new Date().toISOString(),
          summary,
          resolution,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to publish decision.");
      } else {
        setShowDecisionModal(false);
        setDecisionTitle("");
        setMeetingDate("");
        setSummary("");
        setResolution("");
        router.refresh();
      }
    } catch {
      setError("Network error publishing decision.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      {/* SECTION 1: APPOINTED MEMBERS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Ethics Advisory Board Members
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Independent bioethics specialists, legal counsel, and community representatives.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setShowMemberModal(true);
              setError("");
            }}
            className="text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" /> Appoint Member
          </Button>
        </div>

        {members.length === 0 ? (
          <div className="p-8 rounded-2xl border border-border bg-card text-center text-xs text-muted-foreground">
            No board members appointed yet. Click above to record appointments.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((m) => (
              <div key={m.id} className="p-4 rounded-xl border border-border bg-card space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-sm text-foreground">{m.name}</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600">
                    Active
                  </span>
                </div>
                <div className="text-muted-foreground">
                  <p className="font-medium text-foreground">{m.title}</p>
                  <p className="flex items-center gap-1 mt-0.5">
                    <Building className="w-3 h-3 text-muted-foreground" /> {m.institution}
                  </p>
                  <p className="text-[11px] mt-1 text-muted-foreground">Role: {m.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: ADVISORY DECISIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              Published Board Resolutions & Determinations
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Formal guidance and ethical rulings published on the public transparency report.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setShowDecisionModal(true);
              setError("");
            }}
            className="text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Publish Resolution
          </Button>
        </div>

        {decisions.length === 0 ? (
          <div className="p-8 rounded-2xl border border-border bg-card text-center text-xs text-muted-foreground">
            No formal resolutions published yet.
          </div>
        ) : (
          <div className="space-y-3">
            {decisions.map((d) => (
              <div key={d.id} className="p-4 rounded-xl border border-border bg-card text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{d.title}</span>
                  <span className="text-muted-foreground flex items-center gap-1 text-[11px]">
                    <Calendar className="w-3 h-3" /> {new Date(d.meetingDate).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{d.summary}</p>
                <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 font-medium text-emerald-800 dark:text-emerald-300">
                  Resolution: {d.resolution}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APPOINT MEMBER MODAL */}
      {showMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-foreground">Appoint Ethics Advisory Board Member</h3>
            {error && (
              <div className="p-2 rounded bg-destructive/10 text-destructive font-medium">{error}</div>
            )}
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Dr. Meron Tadesse"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Academic / Clinical Title</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  value={memberTitle}
                  onChange={(e) => setMemberTitle(e.target.value)}
                  placeholder="Associate Professor of Bioethics"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Institution *</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  value={memberInstitution}
                  onChange={(e) => setMemberInstitution(e.target.value)}
                  placeholder="Addis Ababa University, College of Health Sciences"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Advisory Role *</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  value={memberRole}
                  onChange={(e) => setMemberRole(e.target.value)}
                  placeholder="Chairperson / Bioethics Specialist"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowMemberModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="bg-primary text-primary-foreground">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Appointment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLISH RESOLUTION MODAL */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-foreground">Publish Advisory Board Resolution</h3>
            {error && (
              <div className="p-2 rounded bg-destructive/10 text-destructive font-medium">{error}</div>
            )}
            <form onSubmit={handleAddDecision} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Resolution Title *</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  value={decisionTitle}
                  onChange={(e) => setDecisionTitle(e.target.value)}
                  placeholder="E.g., Determination on Coded Respondent Linkage Security"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Meeting Date</label>
                <input
                  type="date"
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Summary of Deliberation *</label>
                <textarea
                  required
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Summarize the board's review and findings..."
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Official Resolution / Ruling *</label>
                <textarea
                  required
                  rows={2}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="State the formal binding resolution..."
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowDecisionModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting} className="bg-primary text-primary-foreground">
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Publish Resolution"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
