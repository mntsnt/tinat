"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button, ButtonLink, getButtonClasses } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
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
  Calculator,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Check,
  ShieldAlert,
  ChevronUp,
  ChevronDown,
  BookOpen,
  ExternalLink,
  Search,
  Trash2,
  Globe,
  HeartHandshake,
  Banknote,
  Lock,
} from "lucide-react";
import { STUDY_BANNERS, type StudyBannerTheme } from "@/lib/studyBanners";
import { StudyBanner as StudyBannerPreview } from "../../../components/studies/StudyBanner";
import { calculateStudyRewardCredits } from "@/lib/credits/studyRewards";
import { ImageUploadField } from "../../../components/ui/ImageUploadField";

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
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <CreateStudyForm />
    </Suspense>
  );
}

function CreateStudyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const literatureTitle = searchParams.get("literatureTitle");
  const literatureArxiv = searchParams.get("literatureArxiv");
  const literatureAuthors = searchParams.get("literatureAuthors");
  const literatureAbstract = searchParams.get("literatureAbstract");

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
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverImageAspect, setCoverImageAspect] = useState<"16:9" | "1:1" | "4:3" | "3:4">("16:9");

  const [participantTarget, setParticipantTarget] = useState(25);
  const [showSampleSizeHelper, setShowSampleSizeHelper] = useState(false);
  const [helperP, setHelperP] = useState(0.5);
  const [helperMargin, setHelperMargin] = useState(0.05);
  const [helperAttrition, setHelperAttrition] = useState(10);
  const [fieldMode, setFieldMode] = useState<"NONE" | "FREE" | "PAID">("NONE");
  const [collectorsNeeded, setCollectorsNeeded] = useState(0);
  const [collectorPayType, setCollectorPayType] = useState<"FIXED" | "PER_RESPONSE">("FIXED");
  const [collectorPayRate, setCollectorPayRate] = useState("0.00");
  const [publishImmediately, setPublishImmediately] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [assignedParticipants, setAssignedParticipants] = useState<string[]>([]);
  const [participantInput, setParticipantInput] = useState("");

  function handleAddParticipant() {
    const trimmed = participantInput.trim().replace(/^@/, "");
    if (!trimmed) return;
    if (!assignedParticipants.includes(trimmed)) {
      setAssignedParticipants([...assignedParticipants, trimmed]);
    }
    setParticipantInput("");
  }

  function handleRemoveParticipant(index: number) {
    setAssignedParticipants(assignedParticipants.filter((_, i) => i !== index));
  }

  const [questions, setQuestions] = useState<Question[]>([
    { text: "", type: "SHORT_TEXT", required: true, options: [] },
  ]);

  // Platform-determined participant TC reward (calculated from duration and question depth)
  const rewardCredits = calculateStudyRewardCredits(estimatedMinutes, questions.length);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [faydaVerified, setFaydaVerified] = useState<boolean | null>(null);

  interface AttachedLiterature {
    arxivId: string;
    title: string;
    authors: string;
    abstract?: string;
    paperUrl?: string;
    pdfUrl?: string;
  }

  const [attachedLiterature, setAttachedLiterature] = useState<AttachedLiterature | null>(() => {
    if (literatureArxiv && literatureTitle) {
      return {
        arxivId: literatureArxiv,
        title: literatureTitle,
        authors: literatureAuthors || "",
        abstract: literatureAbstract || "",
        paperUrl: `https://arxiv.org/abs/${literatureArxiv}`,
        pdfUrl: `https://arxiv.org/pdf/${literatureArxiv}.pdf`,
      };
    }
    return null;
  });

  const [showLiteratureSearch, setShowLiteratureSearch] = useState(false);
  const [literatureSearchQuery, setLiteratureSearchQuery] = useState("");
  const [literatureSearching, setLiteratureSearching] = useState(false);
  const [literatureResults, setLiteratureResults] = useState<any[]>([]);
  const [literatureSearchError, setLiteratureSearchError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user?.role === "ADMIN") {
          router.replace("/admin/studies");
        } else if (data?.user?.role === "PARTICIPANT") {
          router.replace("/participant");
        }
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    fetch("/api/auth/fayda-verify")
      .then((res) => res.json())
      .then((data) => setFaydaVerified(Boolean(data.faydaVerified)))
      .catch(() => {});
  }, []);

  async function handleSearchLiterature(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const q = literatureSearchQuery.trim();
    if (!q) return;

    setLiteratureSearching(true);
    setLiteratureSearchError("");
    try {
      const res = await fetch(`/api/literature?q=${encodeURIComponent(q)}&limit=6`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to search ScholarXIV database");
      }
      const papers = Array.isArray(data.papers) ? data.papers : [];
      setLiteratureResults(papers);
      if (papers.length === 0) {
        setLiteratureSearchError("No preprint papers found matching your query.");
      }
    } catch (err: any) {
      setLiteratureSearchError(err.message || "Could not connect to ScholarXIV");
    } finally {
      setLiteratureSearching(false);
    }
  }

  function selectPaper(paper: any) {
    setAttachedLiterature({
      arxivId: paper.arxivId,
      title: paper.title,
      authors: Array.isArray(paper.authors) ? paper.authors.join(", ") : (paper.authors || ""),
      abstract: paper.abstract || "",
      paperUrl: paper.paperUrl || `https://arxiv.org/abs/${paper.arxivId}`,
      pdfUrl: paper.pdfUrl || `https://arxiv.org/pdf/${paper.arxivId}.pdf`,
    });
    setShowLiteratureSearch(false);
    setLiteratureResults([]);
    setLiteratureSearchQuery("");
  }

  function removePaper() {
    setAttachedLiterature(null);
  }

  const validCollectorPayRate = /^\d{1,9}(?:\.\d{1,2})?$/.test(collectorPayRate);
  const collectorPayRateCents =
    fieldMode === "PAID" && validCollectorPayRate
      ? Math.round(Number(collectorPayRate) * 100)
      : 0;
  const collectorBudgetCents =
    fieldMode !== "PAID" || collectorsNeeded <= 0 || collectorPayRateCents <= 0
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
    if (fieldMode === "FREE") {
      if (collectorsNeeded <= 0) {
        return setError("Please specify how many volunteer field collectors you need (at least 1).");
      }
    } else if (fieldMode === "PAID") {
      if (collectorsNeeded <= 0) {
        return setError("Please specify how many paid field collectors you need (at least 1).");
      }
      if (
        !validCollectorPayRate ||
        !Number.isSafeInteger(collectorPayRateCents) ||
        collectorPayRateCents <= 0 ||
        collectorPayRateCents > 2_147_483_647
      ) {
        return setError("Set a valid positive ETB payment rate for the requested paid collectors.");
      }
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
      let finalDescription = description;
      const finalTags: string[] = [];

      if (attachedLiterature) {
        finalTags.push(`arxiv:${attachedLiterature.arxivId}`);
        if (!description.includes(attachedLiterature.arxivId)) {
          const groundingText = `\n\n---\n**Grounded in Scientific Literature:**\n"${attachedLiterature.title}" (arXiv:${attachedLiterature.arxivId}) by ${attachedLiterature.authors || "preprinted authors"}.\nhttps://arxiv.org/abs/${attachedLiterature.arxivId}`;
          finalDescription = description.trim() ? `${description.trim()}${groundingText}` : groundingText.trim();
        }
      }

      const response = await fetch("/api/studies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: finalDescription,
          bannerTheme,
          coverImageUrl,
          coverImageAspect,
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
          collectorsNeeded: fieldMode === "NONE" ? 0 : collectorsNeeded,
          collectorPayType: fieldMode === "PAID" && collectorsNeeded > 0 ? collectorPayType : null,
          collectorPayRateCents: fieldMode === "PAID" && collectorsNeeded > 0 ? collectorPayRateCents : 0,
          budgetCredits: 0,
          questions,
          tags: finalTags,
          publishImmediately,
          isPrivate,
          assignedParticipants: isPrivate ? assignedParticipants : [],
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Create Health Study</h1>
            <p className="text-muted-foreground mt-1">
              Design your clinical questionnaire or health survey and define participant criteria.
            </p>
          </div>
          <Link
            href="/researcher/literature"
            className="inline-flex items-center gap-2 self-start rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Literature</span>
          </Link>
        </div>
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

        {/* Optional Literature Grounding Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">
                    Literature Grounding <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
                  </CardTitle>
                </div>
              </div>
              {!attachedLiterature && !showLiteratureSearch && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLiteratureSearch(true)}
                  className="text-xs self-start sm:self-auto border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                >
                  <Search className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  Select from ScholarXIV Database
                </Button>
              )}
            </div>
            <CardDescription className="text-xs mt-1">
              If you wish to ground your study with prior empirical research, you can optionally select a preprint from the ScholarXIV arXiv database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {attachedLiterature ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Attached ScholarXIV Literature
                    </span>
                    <h4 className="text-sm font-semibold text-foreground">{attachedLiterature.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      arXiv:{attachedLiterature.arxivId} &bull; {attachedLiterature.authors || "Preprinted authors"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={attachedLiterature.paperUrl || `https://arxiv.org/abs/${attachedLiterature.arxivId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline"
                    >
                      <span>arXiv</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removePaper}
                      className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2"
                      title="Remove attached literature"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-emerald-500/15">
                  <button
                    type="button"
                    onClick={() => {
                      const citation = `\n\n**Theoretical Literature Grounding (arXiv:${attachedLiterature.arxivId}):**\n"${attachedLiterature.title}" by ${attachedLiterature.authors || "preprinted authors"}.\nhttps://arxiv.org/abs/${attachedLiterature.arxivId}`;
                      if (!description.includes(attachedLiterature.arxivId)) {
                        setDescription((prev) => (prev ? `${prev.trim()}${citation}` : citation.trim()));
                      }
                    }}
                    className="text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Insert citation into study description</span>
                  </button>
                  <span className="text-muted-foreground text-xs">&bull;</span>
                  <button
                    type="button"
                    onClick={() => setShowLiteratureSearch(true)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <span>Change paper</span>
                  </button>
                </div>
              </div>
            ) : showLiteratureSearch ? (
              <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Search ScholarXIV Database
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowLiteratureSearch(false);
                      setLiteratureResults([]);
                      setLiteratureSearchError("");
                    }}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>

                <form onSubmit={handleSearchLiterature} className="flex gap-2">
                  <Input
                    placeholder="Search preprints by keyword, disease, intervention (e.g., malaria, hypertension, vaccine)..."
                    value={literatureSearchQuery}
                    onChange={(e) => setLiteratureSearchQuery(e.target.value)}
                    className="text-xs"
                    autoFocus
                  />
                  <Button type="submit" size="sm" disabled={literatureSearching || !literatureSearchQuery.trim()}>
                    {literatureSearching ? "Searching..." : "Search"}
                  </Button>
                </form>

                {literatureSearchError && (
                  <p className="text-xs text-destructive">{literatureSearchError}</p>
                )}

                {literatureResults.length > 0 && (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {literatureResults.map((paper) => (
                      <div
                        key={paper.arxivId}
                        className="rounded-lg border border-border bg-card p-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="font-semibold text-emerald-600">arXiv:{paper.arxivId}</span>
                            {paper.primaryCategory && <span>&bull; {paper.primaryCategory}</span>}
                          </div>
                          <h5 className="font-semibold text-foreground text-xs leading-snug line-clamp-2">
                            {paper.title}
                          </h5>
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {Array.isArray(paper.authors) ? paper.authors.join(", ") : paper.authors}
                          </p>
                          {paper.abstract && (
                            <p className="text-[11px] text-muted-foreground/80 line-clamp-2 pt-0.5">
                              {paper.abstract}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => selectPaper(paper)}
                          className="text-xs shrink-0 self-end sm:self-start"
                        >
                          Select Paper
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No literature selected. Your study will be created as an independent clinical or health questionnaire.
              </p>
            )}
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
            <div className="mb-5">
              <ImageUploadField
                label="Study cover image"
                value={coverImageUrl}
                aspect={coverImageAspect}
                onChange={(value, aspect) => {
                  setCoverImageUrl(value);
                  setCoverImageAspect(aspect);
                }}
              />
            </div>
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
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-foreground">
                      Participant Target Cap <span className="text-destructive">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSampleSizeHelper(!showSampleSizeHelper)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <Calculator className="h-3.5 w-3.5" />
                      {showSampleSizeHelper ? "Hide Calculator" : "Calculate Sample Size"}
                    </button>
                  </div>
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

                  {/* Integrated Sample Size Assistant */}
                  {showSampleSizeHelper && (
                    <div className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <Calculator className="h-4 w-4" /> Integrated Sample Size Estimator
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          95% CI (Z=1.96)
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-foreground mb-1">
                            Expected Prevalence ($P$): {(helperP * 100).toFixed(0)}%
                          </label>
                          <input
                            type="range"
                            min="0.05"
                            max="0.95"
                            step="0.05"
                            value={helperP}
                            onChange={(e) => setHelperP(Number(e.target.value))}
                            className="w-full accent-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-foreground mb-1">
                            Margin of Error ($d$): {(helperMargin * 100).toFixed(1)}%
                          </label>
                          <input
                            type="range"
                            min="0.02"
                            max="0.10"
                            step="0.01"
                            value={helperMargin}
                            onChange={(e) => setHelperMargin(Number(e.target.value))}
                            className="w-full accent-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-foreground mb-1">
                            Non-Response Buffer: {helperAttrition}%
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={helperAttrition}
                            onChange={(e) => setHelperAttrition(Math.max(0, Number(e.target.value)))}
                            className="w-full rounded-md border border-input bg-background p-1.5 text-xs"
                          />
                        </div>
                      </div>

                      {(() => {
                        const calculatedN = Math.ceil(
                          (1.96 * 1.96 * helperP * (1 - helperP)) /
                            (helperMargin * helperMargin) /
                            (1 - helperAttrition / 100)
                        );
                        return (
                          <div className="flex items-center justify-between border-t border-border/60 pt-3">
                            <span className="text-xs font-semibold text-foreground">
                              Estimated Target: <strong className="font-mono text-emerald-600 text-sm">{calculatedN}</strong> participants
                            </span>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setParticipantTarget(calculatedN);
                                setShowSampleSizeHelper(false);
                              }}
                              className="gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                            >
                              <Check className="h-3.5 w-3.5" /> Apply to Target
                            </Button>
                          </div>
                        );
                      })()}
                    </div>
                  )}
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

        {/* Study Visibility: Public vs Private */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-600" />
              Study Visibility &amp; Access
            </CardTitle>
            <CardDescription>
              Choose whether participants can discover this study publicly or if it is restricted to private invitees.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: Public Study */}
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  !isPrivate
                    ? "border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/30 ring-1 ring-emerald-600"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    Public Study
                  </span>
                  {!isPrivate && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Visible on the Tinat discovery feed. Any participant can search, discover, and answer this questionnaire.
                </p>
                <span className="mt-3 inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  Open Discovery
                </span>
              </button>

              {/* Option 2: Private Study */}
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  isPrivate
                    ? "border-amber-600 bg-amber-500/10 dark:bg-amber-950/30 ring-1 ring-amber-600"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600" />
                    Private Study
                  </span>
                  {isPrivate && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hidden from public discovery. Only directly assigned participants or deployed field collectors can access and submit responses.
                </p>
                <span className="mt-3 inline-flex items-center text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
                  Restricted Cohort
                </span>
              </button>
            </div>

            {/* Private Study Assignment Helper */}
            {isPrivate && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-foreground">Assign Participants to Private Study</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Enter usernames or email addresses of participants allowed to access this study. You can also assign more anytime after publishing.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter email or username..."
                    value={participantInput}
                    onChange={(e) => setParticipantInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddParticipant();
                      }
                    }}
                    className="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddParticipant}
                    className="h-9 text-xs"
                  >
                    Add
                  </Button>
                </div>

                {assignedParticipants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {assignedParticipants.map((p, idx) => (
                      <span
                        key={p}
                        className="inline-flex items-center gap-1 rounded-md bg-background border border-border px-2 py-1 text-xs text-foreground"
                      >
                        {p}
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(idx)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Field Data Collection
            </CardTitle>
            <CardDescription>
              Choose how on-the-ground enumerators collect survey responses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Field Options: Online Only vs Free (Volunteer) vs Paid (Compensated) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Online Only */}
              <button
                type="button"
                onClick={() => {
                  setFieldMode("NONE");
                  setCollectorsNeeded(0);
                }}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  fieldMode === "NONE"
                    ? "border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/30 ring-1 ring-emerald-600"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Online Only
                  </span>
                  {fieldMode === "NONE" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  No field enumerators. Participants complete the questionnaire directly via web link.
                </p>
              </button>

              {/* Option 2: Free (Volunteer) */}
              <button
                type="button"
                onClick={() => {
                  setFieldMode("FREE");
                  if (collectorsNeeded <= 0) setCollectorsNeeded(3);
                  setCollectorPayRate("0.00");
                }}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  fieldMode === "FREE"
                    ? "border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/30 ring-1 ring-emerald-600"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <HeartHandshake className="w-4 h-4 text-emerald-600" />
                    Free (Volunteer)
                  </span>
                  {fieldMode === "FREE" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Volunteer or student enumerators collect data for free. Zero ETB budget and no bank deposit.
                </p>
                <span className="mt-2 inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
                  0 ETB Cost · Instant Activation
                </span>
              </button>

              {/* Option 3: Paid (Compensated) */}
              <button
                type="button"
                onClick={() => {
                  setFieldMode("PAID");
                  if (collectorsNeeded <= 0) setCollectorsNeeded(3);
                  if (Number(collectorPayRate) <= 0) setCollectorPayRate("50.00");
                }}
                className={`flex flex-col text-left p-4 rounded-xl border transition-all ${
                  fieldMode === "PAID"
                    ? "border-emerald-600 bg-emerald-500/10 dark:bg-emerald-950/30 ring-1 ring-emerald-600"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" />
                    Paid (Compensated)
                  </span>
                  {fieldMode === "PAID" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Compensate enumerators in cash (ETB). Set fixed stipends or pay-per-response rates.
                </p>
                <span className="mt-2 inline-flex items-center text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                  ETB Escrow Required
                </span>
              </button>
            </div>

            {/* Sub-form when Free is selected */}
            {fieldMode === "FREE" && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-start gap-3">
                  <HeartHandshake className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Volunteer Field Enumerator Team</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recruit or assign student researchers, clinical interns, or volunteers. Collectors do not receive monetary compensation from the platform.
                    </p>
                  </div>
                </div>

                <div className="max-w-xs space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">Volunteer collectors needed</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={collectorsNeeded}
                    onChange={(e) => setCollectorsNeeded(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Number of volunteer positions open for direct assignment or application.
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-background border border-emerald-500/20 p-3">
                  <span className="text-xs font-medium text-foreground">Total Field Collection Cost</span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">0.00 ETB (Free)</span>
                </div>
              </div>
            )}

            {/* Sub-form when Paid is selected */}
            {fieldMode === "PAID" && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Collectors needed</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={collectorsNeeded}
                      onChange={(e) => setCollectorsNeeded(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-foreground">Payment model</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={collectorPayType}
                      onChange={(e) => setCollectorPayType(e.target.value as "FIXED" | "PER_RESPONSE")}
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
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground text-sm">Maximum collector budget</p>
                    <p className="text-xs text-muted-foreground">
                      {collectorPayType === "FIXED"
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
              </div>
            )}
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
