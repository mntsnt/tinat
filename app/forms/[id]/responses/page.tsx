"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  ExternalLink,
  Users,
  BarChart3,
  List,
  PauseCircle,
  PlayCircle,
  Search,
  HelpCircle,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Card, CardContent } from "../../../components/ui/Card";

type Question = {
  id: string;
  text: string;
  type: string;
  required: boolean;
  order: number;
  scaleMin?: number | null;
  scaleMax?: number | null;
  scaleMinLabel?: string | null;
  scaleMaxLabel?: string | null;
  options: { id: string; text: string; value: string; order: number }[];
};

type FormResponse = {
  id: string;
  submittedAt: string;
  participantName: string;
  isGuest: boolean;
  answers: Record<string, { textValue: string | null; numberValue: number | null }>;
};

type FormData = {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED";
  createdAt: string;
};

export default function FormResponsesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const formId = resolvedParams.id;

  const [form, setForm] = useState<FormData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "table">("summary");
  const [copiedLink, setCopiedLink] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchData();
  }, [formId]);

  async function fetchData() {
    try {
      setLoading(true);
      const res = await fetch(`/api/forms/${formId}/responses`);
      if (res.ok) {
        const data = await res.json();
        setForm(data.form);
        setQuestions(data.questions || []);
        setResponses(data.responses || []);
      }
    } catch (error) {
      console.error("Failed to load responses:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyShareLink() {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    navigator.clipboard.writeText(`${origin}/f/${formId}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  async function handleToggleStatus() {
    if (!form) return;
    const newStatus = form.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      setToggling(true);
      const res = await fetch(`/api/forms/${formId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setForm((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="container max-w-5xl mx-auto px-4 py-20 text-center text-muted-foreground">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
        <div>Loading form responses...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="container max-w-md mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold">Form Not Found</h2>
        <p className="text-muted-foreground text-sm mt-1 mb-6">
          This form could not be found or you do not have permission to view it.
        </p>
        <Link href="/forms">
          <Button variant="outline">Back to Forms</Button>
        </Link>
      </div>
    );
  }

  const isActive = form.status === "ACTIVE";

  const filteredResponses = responses.filter(
    (r) =>
      r.participantName.toLowerCase().includes(search.toLowerCase()) ||
      Object.values(r.answers).some((a) =>
        a.textValue?.toLowerCase().includes(search.toLowerCase())
      )
  );

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:px-7 md:py-8 space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <Link
            href="/forms"
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to All Forms
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{form.title}</h1>
            <Badge
              variant={isActive ? "success" : "secondary"}
              className={`text-xs capitalize font-medium flex items-center gap-1 ${
                isActive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isActive ? "Accepting Responses" : "Paused"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {responses.length} {responses.length === 1 ? "response" : "responses"} recorded
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={toggling}
            className="text-xs"
          >
            {isActive ? (
              <>
                <PauseCircle className="h-3.5 w-3.5 mr-1 text-amber-600" />
                Pause Form
              </>
            ) : (
              <>
                <PlayCircle className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Accept Responses
              </>
            )}
          </Button>

          {/* Copy Share Link */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyShareLink}
            className="text-xs"
          >
            {copiedLink ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy Link
              </>
            )}
          </Button>

          {/* Export to Excel */}
          <a href={`/api/forms/${formId}/export?format=xlsx`} download>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export Excel</span>
            </Button>
          </a>

          {/* Export to CSV */}
          <a href={`/api/forms/${formId}/export?format=csv`} download>
            <Button variant="outline" size="sm" className="text-xs flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </Button>
          </a>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "summary"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Summary ({responses.length})
        </button>
        <button
          onClick={() => setActiveTab("table")}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "table"
              ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <List className="h-4 w-4" />
          Individual Entries
        </button>
      </div>

      {/* Empty State */}
      {responses.length === 0 ? (
        <div className="border border-dashed rounded-xl p-12 text-center bg-muted/20">
          <div className="inline-flex p-3 rounded-full bg-emerald-500/10 text-emerald-600 mb-3">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="font-semibold text-base">Waiting for responses</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-5">
            Share your form link with respondents. As soon as someone submits, their responses and analytics will appear here in real-time.
          </p>
          <Button
            size="sm"
            onClick={handleCopyShareLink}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy Shareable Public Link
          </Button>
        </div>
      ) : activeTab === "summary" ? (
        /* Summary View (Charts & Aggregations) */
        <div className="space-y-6">
          {questions.map((question, qIdx) => {
            const hasOptions = [
              "SINGLE_CHOICE",
              "MULTIPLE_CHOICE",
              "DROPDOWN",
              "YES_NO",
            ].includes(question.type);

            // Compute counts
            const counts: Record<string, number> = {};
            let scaleSum = 0;
            let scaleCount = 0;
            const textAnswers: string[] = [];

            responses.forEach((resp) => {
              const ans = resp.answers[question.id];
              if (!ans) return;

              if (hasOptions) {
                if (ans.textValue) {
                  // Multiple choice checkboxes may be comma separated
                  const parts = ans.textValue.split(",").map((s) => s.trim());
                  parts.forEach((p) => {
                    counts[p] = (counts[p] || 0) + 1;
                  });
                }
              } else if (question.type === "LINEAR_SCALE") {
                if (ans.numberValue !== null && ans.numberValue !== undefined) {
                  const val = String(ans.numberValue);
                  counts[val] = (counts[val] || 0) + 1;
                  scaleSum += ans.numberValue;
                  scaleCount += 1;
                }
              } else {
                if (ans.textValue && ans.textValue.trim()) {
                  textAnswers.push(ans.textValue.trim());
                }
              }
            });

            const scaleAvg = scaleCount > 0 ? (scaleSum / scaleCount).toFixed(1) : null;

            return (
              <Card key={question.id} className="border shadow-none">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                        Question {qIdx + 1} • {question.type.replace("_", " ")}
                      </span>
                      <h3 className="font-semibold text-base mt-0.5">{question.text}</h3>
                    </div>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {hasOptions
                        ? `${Object.values(counts).reduce((a, b) => a + b, 0)} votes`
                        : `${textAnswers.length || scaleCount} answers`}
                    </Badge>
                  </div>

                  {/* Choice Charts */}
                  {hasOptions && (
                    <div className="space-y-2.5 pt-2">
                      {(question.type === "YES_NO"
                        ? ["Yes", "No"]
                        : question.options.map((o) => o.text)
                      ).map((opt) => {
                        const count = counts[opt] || 0;
                        const pct =
                          responses.length > 0
                            ? Math.round((count / responses.length) * 100)
                            : 0;

                        return (
                          <div key={opt} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span>{opt}</span>
                              <span className="text-muted-foreground">
                                {count} ({pct}%)
                              </span>
                            </div>
                            <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Linear Scale Average & Bars */}
                  {question.type === "LINEAR_SCALE" && (
                    <div className="space-y-4 pt-2">
                      {scaleAvg && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20">
                          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                            {scaleAvg}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Average score on a scale of 1 to 5 ({scaleCount} ratings)
                          </span>
                        </div>
                      )}

                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((val) => {
                          const count = counts[String(val)] || 0;
                          const pct =
                            scaleCount > 0 ? Math.round((count / scaleCount) * 100) : 0;
                          return (
                            <div key={val} className="flex items-center gap-3 text-xs">
                              <span className="w-4 font-semibold text-right">{val}</span>
                              <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-16 text-muted-foreground text-right">
                                {count} ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Text Answers List */}
                  {!hasOptions && question.type !== "LINEAR_SCALE" && (
                    <div className="space-y-2 pt-1 max-h-60 overflow-y-auto">
                      {textAnswers.length === 0 ? (
                        <div className="text-xs text-muted-foreground italic">
                          No text answers recorded yet.
                        </div>
                      ) : (
                        textAnswers.map((txt, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-lg bg-muted/30 border text-xs text-foreground"
                          >
                            {txt}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View: Individual Submissions */
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search responses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          <div className="border rounded-xl overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b font-medium text-muted-foreground">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3 whitespace-nowrap">Submitted</th>
                    <th className="p-3 whitespace-nowrap">Respondent</th>
                    <th className="p-3 whitespace-nowrap">Status</th>
                    {questions.map((q) => (
                      <th
                        key={q.id}
                        className="p-3 min-w-[180px] max-w-[240px] truncate"
                        title={q.text}
                      >
                        {q.text}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredResponses.map((resp, rIdx) => (
                    <tr key={resp.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3 text-center text-muted-foreground">{rIdx + 1}</td>
                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                        {new Date(resp.submittedAt).toLocaleDateString()}{" "}
                        {new Date(resp.submittedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-3 whitespace-nowrap font-medium text-foreground">
                        {resp.participantName}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-normal"
                        >
                          {resp.isGuest ? "Guest" : "Registered"}
                        </Badge>
                      </td>
                      {questions.map((q) => {
                        const ans = resp.answers[q.id];
                        const displayVal =
                          ans?.textValue ||
                          (ans?.numberValue !== null && ans?.numberValue !== undefined
                            ? String(ans.numberValue)
                            : "-");
                        return (
                          <td
                            key={q.id}
                            className="p-3 max-w-[240px] truncate text-foreground"
                            title={displayVal}
                          >
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
