"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Pause,
  Play,
  CheckCheck,
  ShieldAlert,
  Clock,
  Users,
  FileText,
  Tag,
  Target,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Input } from "../../../components/ui/Input";
import { StudyDeleteButton } from "../../../components/StudyDeleteButton";

interface StudySettingsTabProps {
  study: {
    id: string;
    title: string;
    category?: string | null;
    objective?: string | null;
    description?: string | null;
    status: string;
    targetPopulation?: string | null;
    estimatedMinutes?: number | null;
    participantTarget?: number;
    rewardCredits?: number;
    studyType?: string;
    responsesCount: number;
  };
}

const COMMON_CATEGORIES = [
  "Public Health & Epidemiology",
  "Cardiovascular & Metabolic Health",
  "Maternal & Child Health",
  "Infectious & Communicable Diseases",
  "Mental Health & Wellbeing",
  "Health Systems & Informatics",
  "Nutrition & Dietary Health",
  "Clinical Medicine",
];

export function StudySettingsTab({ study }: StudySettingsTabProps) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState(study.title);
  const [category, setCategory] = useState(study.category || "");
  const [objective, setObjective] = useState(study.objective || "");
  const [description, setDescription] = useState(study.description || "");
  const [targetPopulation, setTargetPopulation] = useState(study.targetPopulation || "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    study.estimatedMinutes !== null && study.estimatedMinutes !== undefined
      ? String(study.estimatedMinutes)
      : "5"
  );
  const [participantTarget, setParticipantTarget] = useState(
    study.participantTarget !== undefined && study.participantTarget !== null
      ? String(study.participantTarget)
      : "0"
  );

  // Status and submission states
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Save General Settings
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setStatusMessage(null);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/studies/${study.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category: category.trim() || null,
          objective: objective.trim() || null,
          description: description.trim() || null,
          targetPopulation: targetPopulation.trim() || null,
          estimatedMinutes: Number(estimatedMinutes) || 5,
          participantTarget: Number(participantTarget) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update study settings");
      }

      setSaveSuccess(true);
      router.refresh();
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to save settings." });
    } finally {
      setSaving(false);
    }
  }

  // Update Study Status (PAUSE / ACTIVE / COMPLETED)
  async function handleStatusChange(newStatus: "ACTIVE" | "PAUSED" | "COMPLETED") {
    setStatusLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/studies/${study.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to change status to ${newStatus}`);
      }

      setStatusMessage({
        type: "success",
        text: `Study status updated to ${newStatus}.`,
      });
      router.refresh();
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Could not update status." });
    } finally {
      setStatusLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl pb-12 animate-in fade-in duration-150">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xl font-bold tracking-tight text-foreground">Study Settings & Controls</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Manage general protocol details, study recruitment status, criteria, and administrative actions.
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
            statusMessage.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
              : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* ── CARD 1: GENERAL STUDY CONFIGURATION ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base">General Information</CardTitle>
          </div>
          <CardDescription>
            Update how your study appears across discover catalogs and participant invitation gates.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveSettings}>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Study Title *</label>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Community Hypertension & Metabolic Screening"
                className="text-sm"
              />
            </div>

            {/* Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Health Category</label>
                <div className="relative">
                  <input
                    type="text"
                    list="study-categories"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Select or enter category..."
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <datalist id="study-categories">
                    {COMMON_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Estimated Completion Time */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  Estimated Time (Minutes)
                </label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(e.target.value)}
                  placeholder="5"
                  className="text-sm"
                />
              </div>
            </div>

            {/* Participant Target Limit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                Participant Target Limit (0 for unlimited)
              </label>
              <Input
                type="number"
                min={0}
                value={participantTarget}
                onChange={(e) => setParticipantTarget(e.target.value)}
                placeholder="0"
                className="text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Current response count: {study.responsesCount} responses.
              </p>
            </div>

            {/* Target Population & Eligibility */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-muted-foreground" />
                Target Population & Criteria
              </label>
              <Input
                type="text"
                value={targetPopulation}
                onChange={(e) => setTargetPopulation(e.target.value)}
                placeholder="e.g. Adults aged 25–65 in urban health centers"
                className="text-sm"
              />
            </div>

            {/* Research Objective */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Research Objective</label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={2}
                placeholder="Concise objective or primary research question..."
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Detailed Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Detailed Description & Protocol</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Detailed explanation of the study background, methodology, and participant instructions..."
                className="w-full rounded-md border border-input bg-background p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between border-t border-border pt-4">
            <div>
              {saveSuccess && (
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Settings saved successfully!
                </span>
              )}
            </div>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* ── CARD 2: RECRUITMENT & STATUS CONTROLS ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <CardTitle className="text-base">Study Recruitment Status</CardTitle>
            </div>
            <Badge
              variant={
                study.status === "ACTIVE"
                  ? "success"
                  : study.status === "COMPLETED"
                  ? "secondary"
                  : "warning"
              }
              className="text-xs font-semibold"
            >
              {study.status}
            </Badge>
          </div>
          <CardDescription>
            Control participant intake. Pausing prevents new submissions while preserving existing data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Pause Action */}
            <div className="rounded-xl border border-border p-3.5 bg-muted/20 space-y-2 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Pause Recruitment</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Temporarily stop accepting responses.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={statusLoading || study.status === "PAUSED" || study.status === "COMPLETED"}
                onClick={() => handleStatusChange("PAUSED")}
                className="w-full gap-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 border-amber-500/30 text-xs"
              >
                <Pause className="w-3.5 h-3.5" />
                {study.status === "PAUSED" ? "Currently Paused" : "Pause Study"}
              </Button>
            </div>

            {/* Resume / Active Action */}
            <div className="rounded-xl border border-border p-3.5 bg-muted/20 space-y-2 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Resume Intake</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Open study for participant responses.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={statusLoading || study.status === "ACTIVE" || study.status === "COMPLETED"}
                onClick={() => handleStatusChange("ACTIVE")}
                className="w-full gap-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 border-emerald-500/30 text-xs"
              >
                <Play className="w-3.5 h-3.5" />
                {study.status === "ACTIVE" ? "Currently Active" : "Activate Study"}
              </Button>
            </div>

            {/* Complete Action */}
            <div className="rounded-xl border border-border p-3.5 bg-muted/20 space-y-2 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">Mark Completed</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Close study permanently once data is collected.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={statusLoading || study.status === "COMPLETED"}
                onClick={() => handleStatusChange("COMPLETED")}
                className="w-full gap-1.5 text-xs text-muted-foreground"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {study.status === "COMPLETED" ? "Study Completed" : "Complete Study"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── CARD 3: DANGER ZONE (Delete Study) ── */}
      <Card className="border-rose-500/30 bg-rose-500/[0.02]">
        <CardHeader>
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <ShieldAlert className="w-4 h-4" />
            <CardTitle className="text-base text-rose-600 dark:text-rose-400">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Permanent destructive actions for this research study.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">Delete this research study</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-lg">
                Once deleted, all questions, participant submissions, field collection logs, and analytics will be permanently removed. This action cannot be reversed.
              </p>
            </div>

            <div className="shrink-0">
              <StudyDeleteButton
                studyId={study.id}
                studyTitle={study.title}
                redirectAfterDelete="/researcher/studies"
                variant="button"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
