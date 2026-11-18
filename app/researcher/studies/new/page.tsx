"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button, ButtonLink, getButtonClasses } from "../../../components/ui/Button";
import {
  HEALTH_CATEGORIES,
  MEDICAL_DISCLAIMER,
  HealthCategory,
} from "@/lib/healthCategories";
import {
  Coins,
  ClipboardCheck,
  Stethoscope,
  Clock,
  Users,
  Target,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Check,
  ShieldAlert,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { STUDY_BANNERS, type StudyBannerTheme } from "@/lib/studyBanners";
import { StudyBanner as StudyBannerPreview } from "../../../components/studies/StudyBanner";
import { calculateStudyRewardCredits } from "@/lib/credits/studyRewards";

type Question = {
  text: string;
  type: string;
  required: boolean;
  options: string[];
  rows?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
};

export default function CreateStudyPage() {
  const router = useRouter();

  const [category, setCategory] = useState<HealthCategory>("Public Health");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [targetPopulation, setTargetPopulation] = useState("");
  const [populationDescription, setPopulationDescription] = useState("");
  const [recruitmentMethod, setRecruitmentMethod] = useState("Online voluntary cohort");
  const [containsSensitiveTopics, setContainsSensitiveTopics] = useState(false);
  const [involvesMinors, setInvolvesMinors] = useState(false);
  const [safetyProtocolText, setSafetyProtocolText] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(5);
  const [bannerTheme, setBannerTheme] = useState<StudyBannerTheme>("canopy");

  const [participantTarget, setParticipantTarget] = useState(25);
  const [collectorsNeeded, setCollectorsNeeded] = useState(0);
  const [collectorPayType, setCollectorPayType] = useState<"FIXED" | "PER_RESPONSE">("FIXED");
  const [collectorPayRate, setCollectorPayRate] = useState("0.00");
  const [publishImmediately, setPublishImmediately] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([
    { text: "", type: "SHORT_TEXT", required: true, options: [] },
  ]);

  // Platform-determined participant TC reward (calculated from duration and question depth)
  const rewardCredits = calculateStudyRewardCredits(estimatedMinutes, questions.length);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [faydaVerified, setFaydaVerified] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/fayda-verify")
      .then((res) => res.json())
      .then((data) => setFaydaVerified(Boolean(data.faydaVerified)))
      .catch(() => {});
  }, []);

  const validCollectorPayRate = /^\d{1,9}(?:\.\d{1,2})?$/.test(collectorPayRate);
  const collectorPayRateCents = validCollectorPayRate
    ? Math.round(Number(collectorPayRate) * 100)
    : 0;
  const collectorBudgetCents =
    collectorsNeeded <= 0 || collectorPayRateCents <= 0
      ? 0
      : (collectorPayType === "FIXED" ? collectorsNeeded : participantTarget) * collectorPayRateCents;

  function addQuestion() {
    setQuestions([...questions, { text: "", type: "SHORT_TEXT", required: true, options: [] }]);
  }

  function removeQuestion(index: number) {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function moveQuestionUp(index: number) {
    if (index === 0) return;
    const updated = [...questions];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setQuestions(updated);
  }

  function moveQuestionDown(index: number) {
    if (index === questions.length - 1) return;
    const updated = [...questions];
    [updated[index + 1], updated[index]] = [updated[index], updated[index + 1]];
    setQuestions(updated);
  }

  function updateQuestion<K extends keyof Question>(index: number, field: K, value: Question[K]) {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-setup defaults when switching types
    if (field === "type") {
      const type = value as string;
      if (type === "LINEAR_SCALE" && updated[index].scaleMin === undefined) {
        updated[index].scaleMin = 1;
        updated[index].scaleMax = 5;
        updated[index].scaleMinLabel = "Low / Strongly Disagree";
        updated[index].scaleMaxLabel = "High / Strongly Agree";
      }
      if (
        (type === "MULTIPLE_CHOICE_GRID" || type === "CHECKBOX_GRID") &&
        (!updated[index].rows || updated[index].rows.length === 0)
      ) {
        updated[index].rows = ["Item 1"];
        if (updated[index].options.length === 0) {
          updated[index].options = ["Option 1"];
        }
      }
      if (
        (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE" || type === "DROPDOWN") &&
        updated[index].options.length === 0
      ) {
        updated[index].options = ["Option 1"];
      }
    }

    setQuestions(updated);
  }

  async function handleSubmit() {
    setError("");

    if (!title.trim()) return setError("Please enter a study title.");
    if (!category) return setError("Please select a health research category.");
    if (participantTarget <= 0) {
      return setError("Participant target must be at least 1.");
    }
    if (
      collectorsNeeded > 0 &&
      (!validCollectorPayRate ||
        !Number.isSafeInteger(collectorPayRateCents) ||
        collectorPayRateCents <= 0 ||
        collectorPayRateCents > 2_147_483_647)
    ) {
      return setError("Set a valid ETB payment rate for the requested collectors.");
    }
    if (questions.some((q) => !q.text.trim())) {
      return setError("Every question must contain question text.");
    }

    for (const q of questions) {
      if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN", "MULTIPLE_CHOICE_GRID", "CHECKBOX_GRID"].includes(q.type)) {
        if (q.options.length === 0 || q.options.some((o) => !o.trim())) {
          return setError(`Please add valid options/columns for "${q.text}".`);
        }
      }
      if (["MULTIPLE_CHOICE_GRID", "CHECKBOX_GRID"].includes(q.type)) {
        if (!q.rows || q.rows.length === 0 || q.rows.some((r) => !r.trim())) {
          return setError(`Please add valid rows for "${q.text}".`);
        }
      }
      if (q.type === "LINEAR_SCALE") {
        if (typeof q.scaleMin !== "number" || typeof q.scaleMax !== "number" || q.scaleMin >= q.scaleMax) {
          return setError(`Please set a valid scale (min < max) for "${q.text}".`);
        }
      }
    }

    if (publishImmediately && faydaVerified === false) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return setError(
        "You must verify your identity with your Ethiopian Fayda National ID in Settings before publishing a research study."
      );
    }

    setLoading(true);

    try {
      const response = await fetch("/api/studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          bannerTheme,
          studyType: "SURVEY",
          fundingType: "FREE",
          category,
          objective,
          targetPopulation,
          populationDescription,
          recruitmentMethod,
          containsSensitiveTopics,
          involvesMinors,
          safetyProtocolText,
          estimatedMinutes,
          rewardCredits,
          participantTarget,
          collectorsNeeded,
          collectorPayType: collectorsNeeded > 0 ? collectorPayType : null,
          collectorPayRateCents: collectorsNeeded > 0 ? collectorPayRateCents : 0,
          budgetCredits: 0,
          questions,
          publishImmediately,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create study.");
        return;
      }

      router.push(`/researcher/studies/${data.study.id}`);
      router.refresh();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-4xl">
      <div className="mb-8">
        <Link href="/researcher" className={getButtonClasses("ghost", "md", "-ml-4 mb-4")}>
          &larr; Back to Dashboard
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Stethoscope className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Medical & Health Research
          </span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Create Health Study</h1>
        <p className="text-muted-foreground mt-1">
          Design your clinical questionnaire or health survey and define participant criteria.
        </p>
      </div>

      {faydaVerified === false && (
        <div className="rounded-xl p-4 bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block text-sm mb-0.5 text-foreground">
                Fayda National ID Verification Required to Publish
              </span>
              Researchers must verify their identity using their Ethiopian Fayda National ID before publishing research studies. You may design your questionnaire now, but publishing requires a verified Fayda credential.
            </div>
          </div>
          <ButtonLink href="/researcher/settings#verification" variant="outline" size="sm" className="shrink-0 border-amber-500/40 text-xs">
            Verify Fayda
          </ButtonLink>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 mb-8 text-destructive text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Study Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              Study & Health Profile
            </CardTitle>
            <CardDescription>
              Categorize your health study to reach the right participants and medical cohorts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-medium text-foreground">
                  Study Title <span className="text-destructive">*</span>
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Assessment of Sleep Quality and Cognitive Fatigue in Medical Interns"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  Health Research Category <span className="text-destructive">*</span>
                </label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HealthCategory)}
                >
                  {HEALTH_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  Estimated Completion Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                  value={estimatedMinutes}
                  onChange={(e) => setEstimatedMinutes(Math.max(1, Number(e.target.value)))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
                <Target className="w-4 h-4 text-muted-foreground" />
                Research Objective / Hypothesis
              </label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                rows={2}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="E.g., To determine the correlation between night shifts and self-reported burnout metrics among clinical trainees."
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground flex items-center gap-1.5">
                <Users className="w-4 h-4 text-muted-foreground" />
                Target Population & Eligibility
              </label>
              <Input
                value={targetPopulation}
                onChange={(e) => setTargetPopulation(e.target.value)}
                placeholder="E.g., Medical interns, nurses, or adult patients aged 18-65"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">
                Detailed Description & Methodology
              </label>
              <textarea
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the study background, ethical compliance, and what participants will experience."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Study banner</CardTitle>
            <CardDescription>
              Choose a visual theme for your study. You can change this choice before creating the study.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <fieldset>
              <legend className="sr-only">Choose a study banner</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {STUDY_BANNERS.map((banner) => {
                  const isSelected = bannerTheme === banner.id;

                  return (
                    <button
                      key={banner.id}
                      type="button"
                      aria-label={`Choose ${banner.name} banner`}
                      aria-pressed={isSelected}
                      onClick={() => setBannerTheme(banner.id)}
                      className={`group rounded-xl border-2 p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-500/5"
                          : "border-border hover:border-emerald-500/50"
                      }`}
                    >
                      <span className="relative block">
                        <StudyBannerPreview
                          theme={banner.id}
                          className="h-20 rounded-lg"
                        />
                        {isSelected && (
                          <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-emerald-700 shadow-sm">
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </span>
                      <span className="mt-2 block text-sm font-medium text-foreground">
                        {banner.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </CardContent>
        </Card>

        {/* Participant Target & Platform Rewards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" />
              Participant Capacity & Platform Rewards
            </CardTitle>
            <CardDescription>
              Participants receive platform-standardized Tinat Credits (TC) upon completing your study. No funding deposit is required from researchers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-foreground">
                    Platform-Determined Participant Reward
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" /> Auto-Standardized
                  </span>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      +{rewardCredits} <span className="text-xs font-semibold text-muted-foreground uppercase">TC / response</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Calculated for {estimatedMinutes} min &bull; {questions.length} {questions.length === 1 ? "question" : "questions"}
                    </p>
                  </div>
                  <Coins className="w-7 h-7 text-emerald-600/40" />
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Tinat automatically issues these credits to participants when they submit valid responses at zero cost to you.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Participant Target Cap <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                    value={participantTarget}
                    onChange={(e) => setParticipantTarget(Math.max(1, Number(e.target.value)))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of participant responses. The study automatically closes when reached.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={publishImmediately}
                      onChange={(e) => setPublishImmediately(e.target.checked)}
                      className="rounded border-input text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-sm font-semibold text-foreground">
                      Publish Immediately as Active
                    </span>
                  </label>
                  <p className="text-xs text-muted-foreground pl-6.5">
                    If unchecked, the study is saved as a Draft so you can review before activating.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Field Collector ETB Budget
            </CardTitle>
            <CardDescription>
              This real-money collector budget is separate from participant Tinat Credits.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Collectors needed</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={collectorsNeeded}
                  onChange={(e) => setCollectorsNeeded(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Payment model</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={collectorPayType}
                  onChange={(e) => setCollectorPayType(e.target.value as "FIXED" | "PER_RESPONSE")}
                  disabled={collectorsNeeded === 0}
                >
                  <option value="FIXED">Fixed amount per collector</option>
                  <option value="PER_RESPONSE">Amount per collected response</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">
                  {collectorPayType === "FIXED" ? "ETB per collector" : "ETB per response"}
                </label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={collectorPayRate}
                  onChange={(e) => setCollectorPayRate(e.target.value)}
                  disabled={collectorsNeeded === 0}
                />
              </div>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground text-sm">Maximum collector budget</p>
                <p className="text-xs text-muted-foreground">
                  {collectorsNeeded === 0
                    ? "No paid field collectors requested."
                    : collectorPayType === "FIXED"
                      ? `${collectorsNeeded} collectors × ${Number(collectorPayRate || 0).toFixed(2)} ETB`
                      : `${participantTarget} target responses × ${Number(collectorPayRate || 0).toFixed(2)} ETB`}
                </p>
              </div>
              <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                {(collectorBudgetCents / 100).toFixed(2)} ETB
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Researchers will submit a bank or mobile-money transaction reference. Verify.et must confirm the full amount reached Tinat before the study can be activated. Collector payouts are sent manually and recorded separately.
            </p>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Questions & Questionnaire</h2>
              <p className="text-sm text-muted-foreground">Add survey questions, rating scales, or checklists.</p>
            </div>
            <Button variant="outline" size="sm" onClick={addQuestion}>
              + Add Question
            </Button>
          </div>

          <div className="space-y-4">
            {questions.map((q, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    Question {idx + 1}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveQuestionUp(idx)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:pointer-events-none transition-colors"
                      title="Move question up"
                      aria-label="Move question up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === questions.length - 1}
                      onClick={() => moveQuestionDown(idx)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-20 disabled:pointer-events-none transition-colors"
                      title="Move question down"
                      aria-label="Move question down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="text-xs text-destructive hover:underline ml-2"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="md:col-span-2 space-y-1.5">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase">
                        Question Text
                      </label>
                      <Input
                        value={q.text}
                        onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                        placeholder="E.g., How many hours of uninterrupted sleep do you average per night?"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase">
                        Response Type
                      </label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
                        value={q.type}
                        onChange={(e) => updateQuestion(idx, "type", e.target.value)}
                      >
                        <option value="SHORT_TEXT">Short Text</option>
                        <option value="LONG_TEXT">Long Text / Paragraph</option>
                        <option value="SINGLE_CHOICE">Single Choice (Radio)</option>
                        <option value="MULTIPLE_CHOICE">Multiple Choice (Checkboxes)</option>
                        <option value="DROPDOWN">Dropdown</option>
                        <option value="NUMBER">Number</option>
                        <option value="YES_NO">Yes / No</option>
                        <option value="LINEAR_SCALE">Linear Rating Scale</option>
                        <option value="DATE">Date</option>
                        <option value="TIME">Time</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`req-${idx}`}
                      checked={q.required}
                      onChange={(e) => updateQuestion(idx, "required", e.target.checked)}
                      className="rounded border-input text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <label htmlFor={`req-${idx}`} className="text-xs font-medium text-foreground cursor-pointer">
                      Required question
                    </label>
                  </div>

                  {/* Options editor for choice types */}
                  {["SINGLE_CHOICE", "MULTIPLE_CHOICE", "DROPDOWN"].includes(q.type) && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <label className="block text-xs font-semibold text-muted-foreground uppercase">
                        Choices / Options
                      </label>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex gap-2 items-center">
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const opts = [...q.options];
                              opts[optIdx] = e.target.value;
                              updateQuestion(idx, "options", opts);
                            }}
                            placeholder={`Option ${optIdx + 1}`}
                          />
                          {q.options.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const opts = q.options.filter((_, i) => i !== optIdx);
                                updateQuestion(idx, "options", opts);
                              }}
                              className="text-xs text-destructive hover:underline px-2"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => updateQuestion(idx, "options", [...q.options, ""])}
                      >
                        + Add Option
                      </Button>
                    </div>
                  )}

                  {/* Linear Scale Editor */}
                  {q.type === "LINEAR_SCALE" && (
                    <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Min Label (1)</label>
                        <Input
                          value={q.scaleMinLabel || ""}
                          onChange={(e) => updateQuestion(idx, "scaleMinLabel", e.target.value)}
                          placeholder="e.g., Strongly Disagree"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Max Label (5)</label>
                        <Input
                          value={q.scaleMaxLabel || ""}
                          onChange={(e) => updateQuestion(idx, "scaleMaxLabel", e.target.value)}
                          placeholder="e.g., Strongly Agree"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
            <Button
              type="button"
              variant="outline"
              onClick={addQuestion}
              className="w-full border-dashed border-2 py-4 text-sm font-semibold hover:border-emerald-600 hover:text-emerald-600"
            >
              + Add Another Question
            </Button>
        </div>

        {/* Medical Research Disclaimer */}
        <div className="rounded-xl p-4 bg-muted/40 border border-border text-xs text-muted-foreground leading-relaxed flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-foreground">Health Research Protocol Notice: </span>
            {MEDICAL_DISCLAIMER} Please ensure your questionnaire respects participant privacy and ethical guidelines for human subjects data collection.
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-border">
          <Button size="lg" onClick={handleSubmit} isLoading={loading} disabled={involvesMinors || loading} className="px-8">
            {publishImmediately
              ? "Publish Health Study"
              : "Create Study"}
          </Button>
        </div>
      </div>
    </div>
  );
}
