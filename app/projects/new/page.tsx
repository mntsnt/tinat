"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Stethoscope,
  Microscope,
  FileSearch,
  GraduationCap,
  HeartPulse,
  Users2,
  BookOpen,
  FlaskConical,
  ShieldCheck,
  AlertCircle,
  Plus,
  Trash2,
  Lock,
  Globe2,
} from "lucide-react";

interface TeamInvite {
  email: string;
  role: string;
}

const TEMPLATES = [
  {
    id: "CROSS_SECTIONAL",
    title: "Cross-Sectional / Observational",
    badge: "Most common",
    icon: Stethoscope,
    description: "Prevalence, risk factor assessment, baseline clinical surveys.",
  },
  {
    id: "CLINICAL_TRIAL",
    title: "Randomized Controlled Trial",
    badge: "CONSORT",
    icon: Microscope,
    description: "Interventional medicine with trial registration and adverse event logs.",
  },
  {
    id: "SYSTEMATIC_REVIEW",
    title: "Systematic Review & Meta-Analysis",
    badge: "PRISMA 2020",
    icon: FileSearch,
    description: "Dual screening, risk-of-bias assessment, and synthesis templates.",
  },
  {
    id: "THESIS_DISSERTATION",
    title: "Medical Thesis & Dissertation",
    badge: "Postgraduate",
    icon: GraduationCap,
    description: "Structured for residents, masters, and PhD candidates.",
  },
  {
    id: "PUBLIC_HEALTH",
    title: "Public Health Cohort Study",
    badge: "Epidemiology",
    icon: HeartPulse,
    description: "Longitudinal tracking and community stakeholder engagement.",
  },
  {
    id: "COMMUNITY_HEALTH",
    title: "Community-Based Participatory",
    badge: "CBPR",
    icon: Users2,
    description: "Community advisory boards and qualitative research methods.",
  },
  {
    id: "MEDICAL_EDUCATION",
    title: "Medical Education Research",
    badge: "MedEd",
    icon: BookOpen,
    description: "Curriculum interventions, OSCE assessments, workforce inquiries.",
  },
  {
    id: "GENERAL",
    title: "General Health Research",
    badge: "Flexible",
    icon: FlaskConical,
    description: "A clean, customizable foundation for any research methodology.",
  },
];

const CATEGORIES = [
  "Public Health & Epidemiology",
  "Cardiology & Cardiovascular Medicine",
  "Internal Medicine",
  "Infectious Diseases & Global Health",
  "Oncology & Cancer Research",
  "Pediatrics & Child Health",
  "Neurology & Mental Health",
  "Obstetrics & Gynecology",
  "Surgery & Anesthesiology",
  "Health Policy & Systems",
  "Nutrition & Metabolic Health",
  "Medical Education",
  "Other Health Discipline",
];

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("CROSS_SECTIONAL");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [institution, setInstitution] = useState("");
  const [visibility, setVisibility] = useState<"TEAM" | "PRIVATE" | "PUBLIC">("TEAM");

  // Step 2
  const [researchQuestion, setResearchQuestion] = useState("");
  const [ethicsCommittee, setEthicsCommittee] = useState("");
  const [ethicsApprovalNumber, setEthicsApprovalNumber] = useState("");
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [newInviteRole, setNewInviteRole] = useState("RESEARCHER");

  function addInvite() {
    if (!newInviteEmail.trim() || !newInviteEmail.includes("@")) return;
    setInvites([...invites, { email: newInviteEmail.trim(), role: newInviteRole }]);
    setNewInviteEmail("");
    setNewInviteRole("RESEARCHER");
  }

  function removeInvite(index: number) {
    setInvites(invites.filter((_, i) => i !== index));
  }

  async function handleLaunch() {
    if (!title.trim()) {
      setError("Please enter a project title.");
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        studyDesign: template,
        templateId: template,
        category,
        institution: institution.trim() || null,
        visibility,
        researchQuestion: researchQuestion.trim() || null,
        ethicsCommittee: ethicsCommittee.trim() || null,
        ethicsApprovalNumber: ethicsApprovalNumber.trim() || null,
        initialMembers: invites,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create project");
      router.push(`/projects/${data.project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : "An unexpected error occurred");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Link */}
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>

        {/* Header + Stepper */}
        <div className="mb-7">
          <h1 className="text-xl font-bold tracking-tight text-foreground">New research project</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up your workspace in two quick steps.
          </p>

          <div className="mt-5 flex items-center gap-3">
            {[
              { num: 1, label: "Scope & template" },
              { num: 2, label: "Details & team" },
            ].map((s, i) => {
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <div key={s.num} className="flex items-center gap-2">
                  {i > 0 && <div className="h-px w-8 bg-border" />}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => s.num < step && setStep(s.num)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isPast
                          ? "bg-emerald-500 text-white"
                          : isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5" /> : s.num}
                    </button>
                    <span className={`text-sm font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Project title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prevalence of Hypertension in Urban Clinics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Discipline
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Institution
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Addis Ababa University"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Study Design */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Study design template
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {TEMPLATES.map((tmpl) => {
                    const Icon = tmpl.icon;
                    const isSelected = template === tmpl.id;
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => setTemplate(tmpl.id)}
                        className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className={`mt-0.5 p-1.5 rounded-md shrink-0 ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-semibold text-foreground leading-tight">{tmpl.title}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-snug">{tmpl.description}</p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5 ml-auto" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Visibility</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "TEAM", title: "Team only", icon: Lock },
                    { id: "PRIVATE", title: "Private", icon: Lock },
                    { id: "PUBLIC", title: "Open science", icon: Globe2 },
                  ] as const).map((v) => {
                    const Icon = v.icon;
                    return (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => setVisibility(v.id)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-colors ${
                          visibility === v.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20 text-foreground"
                            : "border-border hover:bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{v.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Research question - optional */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Research question <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="State your primary inquiry or PICO question..."
                  value={researchQuestion}
                  onChange={(e) => setResearchQuestion(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                />
              </div>

              {/* Ethics */}
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  IRB / Ethics (optional)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Committee</label>
                    <input
                      type="text"
                      placeholder="e.g. AAU IRB"
                      value={ethicsCommittee}
                      onChange={(e) => setEthicsCommittee(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Approval number</label>
                    <input
                      type="text"
                      placeholder="e.g. IRB/2026/049"
                      value={ethicsApprovalNumber}
                      onChange={(e) => setEthicsApprovalNumber(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">You can add these later once approval is granted.</p>
              </div>

              {/* Invite team */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Invite team <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="email"
                    placeholder="colleague@university.edu"
                    value={newInviteEmail}
                    onChange={(e) => setNewInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInvite())}
                    className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <select
                    value={newInviteRole}
                    onChange={(e) => setNewInviteRole(e.target.value)}
                    className="rounded-md border border-input bg-background px-2.5 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="PRINCIPAL_INVESTIGATOR">Co-PI</option>
                    <option value="RESEARCHER">Researcher</option>
                    <option value="DATA_ANALYST">Data Analyst</option>
                    <option value="RESEARCH_ASSISTANT">Assistant</option>
                    <option value="ADVISOR_VIEWER">Advisor</option>
                  </select>
                  <button
                    type="button"
                    onClick={addInvite}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {invites.length > 0 && (
                  <div className="space-y-1.5">
                    {invites.map((inv, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-md border border-border bg-muted/30 text-sm"
                      >
                        <span className="font-medium text-foreground">{inv.email}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {inv.role.replace(/_/g, " ")}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeInvite(idx)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Nav Buttons */}
          <div className="mt-8 pt-5 border-t border-border flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 2 ? (
              <button
                type="button"
                onClick={() => {
                  if (!title.trim()) {
                    setError("Please enter a project title before continuing.");
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleLaunch}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Launch workspace"
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
