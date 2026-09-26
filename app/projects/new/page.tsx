"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FolderKanban,
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
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
  Calendar,
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
    badge: "Most Common",
    icon: Stethoscope,
    description: "Ideal for prevalence, risk factor assessment, and baseline clinical surveys following STROBE guidelines.",
    phasesCount: 6,
    scaffoldCount: "7 Milestones • 14 Tasks",
  },
  {
    id: "CLINICAL_TRIAL",
    title: "Randomized Controlled Trial (RCT)",
    badge: "CONSORT Compliant",
    icon: Microscope,
    description: "Designed for interventional medicine, clinical trial protocol registration, DSMB review, and adverse event logs.",
    phasesCount: 8,
    scaffoldCount: "9 Milestones • 18 Tasks",
  },
  {
    id: "SYSTEMATIC_REVIEW",
    title: "Systematic Review & Meta-Analysis",
    badge: "PRISMA 2020",
    icon: FileSearch,
    description: "Includes PROSPERO registration, dual-screening workflow, risk-of-bias assessment, and synthesis templates.",
    phasesCount: 6,
    scaffoldCount: "7 Milestones • 12 Tasks",
  },
  {
    id: "THESIS_DISSERTATION",
    title: "Medical Thesis & Dissertation",
    badge: "Postgraduate & MD",
    icon: GraduationCap,
    description: "Structured for postgraduate medical residents, masters, and PhD candidates with committee defense milestones.",
    phasesCount: 6,
    scaffoldCount: "6 Milestones • 15 Tasks",
  },
  {
    id: "PUBLIC_HEALTH",
    title: "Public Health Cohort Study",
    badge: "Epidemiology",
    icon: HeartPulse,
    description: "Multi-wave longitudinal tracking, community stakeholder engagement, and policy translation frameworks.",
    phasesCount: 7,
    scaffoldCount: "8 Milestones • 16 Tasks",
  },
  {
    id: "COMMUNITY_HEALTH",
    title: "Community-Based Participatory",
    badge: "CBPR Method",
    icon: Users2,
    description: "Empowers community advisory boards, local clinic recruitment, and culturally grounded qualitative methods.",
    phasesCount: 5,
    scaffoldCount: "6 Milestones • 12 Tasks",
  },
  {
    id: "MEDICAL_EDUCATION",
    title: "Medical Education Research",
    badge: "MedEd",
    icon: BookOpen,
    description: "Curriculum intervention evaluation, OSCE assessments, resident burnout, and healthcare workforce inquiries.",
    phasesCount: 5,
    scaffoldCount: "6 Milestones • 10 Tasks",
  },
  {
    id: "GENERAL",
    title: "General Health Research",
    badge: "Flexible",
    icon: FlaskConical,
    description: "A clean, customizable foundation adaptable to any specialized bio-medical or clinical research methodology.",
    phasesCount: 5,
    scaffoldCount: "5 Milestones • 10 Tasks",
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

  // Form State
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("CROSS_SECTIONAL");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [researchArea, setResearchArea] = useState("");
  const [institution, setInstitution] = useState("");
  const [visibility, setVisibility] = useState<"TEAM" | "PRIVATE" | "PUBLIC">("TEAM");

  // Research Details
  const [researchQuestion, setResearchQuestion] = useState("");
  const [objective, setObjective] = useState("");

  // Ethics & Governance
  const [ethicsCommittee, setEthicsCommittee] = useState("");
  const [ethicsApprovalNumber, setEthicsApprovalNumber] = useState("");
  const [ethicsApprovalDate, setEthicsApprovalDate] = useState("");

  // Initial Collaborators
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
      setError("Please provide a project title");
      setStep(1);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        studyDesign: template,
        category,
        researchArea: researchArea.trim() || null,
        institution: institution.trim() || null,
        visibility,
        researchQuestion: researchQuestion.trim() || null,
        objective: objective.trim() || null,
        ethicsCommittee: ethicsCommittee.trim() || null,
        ethicsApprovalNumber: ethicsApprovalNumber.trim() || null,
        ethicsApprovalDate: ethicsApprovalDate || null,
        invites,
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      router.push(`/projects/${data.project.id}`);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to All Projects
          </Link>
        </div>

        {/* Wizard Stepper Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Create Research Project Workspace
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Set up your clinical or health research investigation with structured academic scaffolding.
          </p>

          <div className="mt-6 flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 z-0" />
            {[
              { num: 1, label: "Template & Scope" },
              { num: 2, label: "Hypothesis & Protocol" },
              { num: 3, label: "Ethics & Team" },
              { num: 4, label: "Review & Launch" },
            ].map((s) => {
              const isActive = step === s.num;
              const isPast = step > s.num;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <button
                    onClick={() => s.num < step && setStep(s.num)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPast
                        ? "bg-emerald-600 text-white"
                        : isActive
                        ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900/40"
                        : "bg-white dark:bg-slate-800 text-slate-500 border border-slate-300 dark:border-slate-700"
                    }`}
                  >
                    {isPast ? <Check className="w-4 h-4" /> : s.num}
                  </button>
                  <span
                    className={`text-[11px] mt-1.5 font-medium hidden sm:block ${
                      isActive ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-500"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Cards Container */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          {/* STEP 1: Template & Fundamentals */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                  Project Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prevalence and Determinants of Diabetic Retinopathy in Sub-Saharan Urban Clinics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                    Clinical Discipline / Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                    Affiliated Institution / Hospital
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Addis Ababa University / Black Lion Hospital"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                  />
                </div>
              </div>

              {/* Template Selection Grid */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Select Study Design & Lifecycle Template
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Each template auto-configures tailored research phases, milestones, standard task checklists, and file directories.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {TEMPLATES.map((tmpl) => {
                    const Icon = tmpl.icon;
                    const isSelected = template === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => setTemplate(tmpl.id)}
                        className={`cursor-pointer p-4 rounded-xl border transition-all text-left ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-2 rounded-lg ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {tmpl.title}
                              </h4>
                              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                                {tmpl.badge}
                              </span>
                            </div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
                          {tmpl.description}
                        </p>
                        <div className="mt-3 text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <span>{tmpl.scaffoldCount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Workspace Privacy */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-2">
                  Workspace Visibility
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "TEAM", title: "Team Only", desc: "Invited researchers only", icon: Lock },
                    { id: "PRIVATE", title: "Confidential", desc: "Strict access control", icon: Lock },
                    { id: "PUBLIC", title: "Open Science", desc: "Discoverable protocol", icon: Globe2 },
                  ].map((v) => {
                    const Icon = v.icon;
                    return (
                      <button
                        type="button"
                        key={v.id}
                        onClick={() => setVisibility(v.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          visibility === v.id
                            ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-950 dark:text-indigo-200"
                            : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold text-xs">
                          <Icon className="w-3.5 h-3.5" />
                          {v.title}
                        </div>
                        <div className="text-[10px] mt-0.5 text-slate-500">{v.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Hypothesis & Protocol */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                  Primary Research Question / Hypothesis
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  State your primary inquiry in PICO format (Population, Intervention/Exposure, Comparator, Outcome) or scientific hypothesis.
                </p>
                <textarea
                  rows={4}
                  placeholder="e.g. In adult patients with type 2 diabetes residing in urban healthcare catchment areas, does community-based peer support compared to standard care improve glycemic control (HbA1c < 7.0%) over 12 months?"
                  value={researchQuestion}
                  onChange={(e) => setResearchQuestion(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                  Primary Objective
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. To estimate the prevalence of undiagnosed hypertension and identify its associated socio-demographic and dietary correlates among adults attending primary health centers."
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                  Specific Sub-Specialty or Field
                </label>
                <input
                  type="text"
                  placeholder="e.g. Non-Communicable Diseases, Primary Care Epidemiology"
                  value={researchArea}
                  onChange={(e) => setResearchArea(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Ethics & Collaborators */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Ethics / IRB Box */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-semibold text-xs mb-3 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  Ethics & Institutional Review Board (IRB)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Ethics Committee
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AAU IRB or MOH Review"
                      value={ethicsCommittee}
                      onChange={(e) => setEthicsCommittee(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Approval / Ref Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. IRB/2026/049"
                      value={ethicsApprovalNumber}
                      onChange={(e) => setEthicsApprovalNumber(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Approval Date
                    </label>
                    <input
                      type="date"
                      value={ethicsApprovalDate}
                      onChange={(e) => setEthicsApprovalDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">
                  If pending, you can leave these blank and record approval once granted.
                </p>
              </div>

              {/* Invite Initial Collaborators */}
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
                  Invite Initial Co-Investigators & Team
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  Assign appropriate research roles. Patient and health data access is segregated based on role clearances.
                </p>

                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    type="email"
                    placeholder="collaborator@university.edu"
                    value={newInviteEmail}
                    onChange={(e) => setNewInviteEmail(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                  />
                  <select
                    value={newInviteRole}
                    onChange={(e) => setNewInviteRole(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950"
                  >
                    <option value="PRINCIPAL_INVESTIGATOR">Co-Principal Investigator</option>
                    <option value="RESEARCHER">Co-Investigator / Researcher</option>
                    <option value="DATA_ANALYST">Biostatistician / Data Analyst</option>
                    <option value="RESEARCH_ASSISTANT">Research Assistant / Coordinator</option>
                    <option value="ADVISOR_VIEWER">Academic Advisor / Reviewer</option>
                  </select>
                  <button
                    type="button"
                    onClick={addInvite}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>

                {invites.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {invites.map((inv, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">{inv.email}</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold text-[10px]">
                            {inv.role.replace(/_/g, " ")}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeInvite(idx)}
                            className="text-slate-400 hover:text-rose-500"
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

          {/* STEP 4: Review & Launch */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                <div className="flex items-center gap-2 font-bold text-sm text-indigo-900 dark:text-indigo-300 mb-1">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Ready to Auto-Scaffold Project Workspace
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 leading-relaxed">
                  Upon creation, Tinat will initialize your workspace with the pre-configured academic lifecycle, standard milestones, initial tasks, and organized research folders.
                </p>
              </div>

              {/* Project Summary Card */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Project Title:</span>
                  <span className="font-bold text-slate-900 dark:text-white max-w-sm text-right">{title}</span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Study Design:</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {TEMPLATES.find((t) => t.id === template)?.title}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Discipline / Institution:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {category} {institution ? `• ${institution}` : ""}
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500">Invited Collaborators:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {invites.length} collaborator{invites.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous Step
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (step === 1 && !title.trim()) {
                    setError("Please enter a project title before continuing.");
                    return;
                  }
                  setError(null);
                  setStep(step + 1);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={handleLaunch}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Initializing Workspace...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Launch Research Workspace
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
