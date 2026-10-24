"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Download,
  Trash2,
  FileSpreadsheet,
  Users,
  HelpCircle,
  PlayCircle,
  PauseCircle,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card, CardContent } from "../components/ui/Card";

type TinatForm = {
  id: string;
  title: string;
  description: string | null;
  status: "ACTIVE" | "PAUSED" | "DRAFT" | "COMPLETED";
  createdAt: string;
  _count: {
    questions: number;
    responses: number;
  };
};

export default function FormsDashboardPage() {
  const [forms, setForms] = useState<TinatForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  async function fetchForms() {
    try {
      setLoading(true);
      const res = await fetch("/api/forms");
      if (res.ok) {
        const data = await res.json();
        setForms(data.forms || []);
      }
    } catch (error) {
      console.error("Failed to load forms:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleCopyLink(formId: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/f/${formId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(formId);
    setTimeout(() => setCopiedId(null), 2500);
  }

  async function handleToggleStatus(form: TinatForm) {
    const newStatus = form.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      setTogglingId(form.id);
      const res = await fetch(`/api/forms/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setForms((prev) =>
          prev.map((f) => (f.id === form.id ? { ...f, status: newStatus } : f))
        );
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDeleteForm(formId: string) {
    if (!confirm("Are you sure you want to delete this form and all its responses?")) {
      return;
    }
    try {
      setDeletingId(formId);
      const res = await fetch(`/api/forms/${formId}`, { method: "DELETE" });
      if (res.ok) {
        setForms((prev) => prev.filter((f) => f.id !== formId));
      }
    } catch (error) {
      console.error("Failed to delete form:", error);
    } finally {
      setDeletingId(null);
    }
  }

  const filteredForms = forms.filter((f) =>
    f.title.toLowerCase().includes(search.toLowerCase())
  );

  const totalResponses = forms.reduce((acc, f) => acc + (f._count?.responses || 0), 0);
  const totalActive = forms.filter((f) => f.status === "ACTIVE").length;

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <ClipboardList className="h-6 w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tinat Forms</h1>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-xs">
              <Sparkles className="h-3 w-3 mr-1" /> Simple & Open
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Create Google Forms-style surveys, share with anyone without requiring them to sign in, and export responses to Excel anytime.
          </p>
        </div>

        <Link href="/forms/new">
          <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Form</span>
          </Button>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-none">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-600 rounded-xl">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Forms
              </div>
              <div className="text-2xl font-bold mt-0.5">{forms.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Total Submissions
              </div>
              <div className="text-2xl font-bold mt-0.5">{totalResponses}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
              <PlayCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Accepting Responses
              </div>
              <div className="text-2xl font-bold mt-0.5">{totalActive}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      {forms.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search your forms..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
      )}

      {/* Forms List / Empty State */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground text-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
          <div>Loading your Tinat Forms...</div>
        </div>
      ) : forms.length === 0 ? (
        <div className="border border-dashed rounded-2xl p-12 text-center bg-muted/20">
          <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-600 mb-4">
            <ClipboardList className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-semibold">No Tinat Forms created yet</h3>
          <p className="text-muted-foreground text-sm max-w-md mx-auto mt-1 mb-6">
            You don’t need to be an academic researcher to collect survey data! Create simple questionnaires for school, events, feedback, or projects and collect responses with zero sign-in barrier for respondents.
          </p>
          <Link href="/forms/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Form
            </Button>
          </Link>
        </div>
      ) : filteredForms.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No forms matching "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredForms.map((form) => {
            const isCopied = copiedId === form.id;
            const isActive = form.status === "ACTIVE";

            return (
              <Card key={form.id} className="border shadow-none hover:border-emerald-500/40 transition-all flex flex-col justify-between">
                <CardContent className="p-5 space-y-4">
                  {/* Top line: status badge & date */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleToggleStatus(form)}
                      disabled={togglingId === form.id}
                      className="group flex items-center gap-1.5 focus:outline-none cursor-pointer"
                      title={isActive ? "Click to pause responses" : "Click to accept responses"}
                    >
                      <Badge
                        variant={isActive ? "success" : "secondary"}
                        className={`text-xs capitalize font-medium flex items-center gap-1 ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isActive ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Accepting Responses
                          </>
                        ) : (
                          <>
                            <PauseCircle className="h-3 w-3" />
                            Paused
                          </>
                        )}
                      </Badge>
                    </button>

                    <span className="text-xs text-muted-foreground">
                      {new Date(form.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-semibold text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {form.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[2rem]">
                      {form.description || "No description provided."}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1 border-t">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5" />
                      {form._count.questions} {form._count.questions === 1 ? "question" : "questions"}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-foreground">
                      <Users className="h-3.5 w-3.5 text-emerald-600" />
                      {form._count.responses} {form._count.responses === 1 ? "response" : "responses"}
                    </span>
                  </div>

                  {/* Actions Bar */}
                  <div className="space-y-2 pt-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link href={`/forms/${form.id}/responses`} className="w-full">
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          <Users className="h-3.5 w-3.5 mr-1" />
                          View Data
                        </Button>
                      </Link>

                      <a
                        href={`/api/forms/${form.id}/export?format=xlsx`}
                        download
                        className="w-full"
                      >
                        <Button variant="outline" size="sm" className="w-full text-xs">
                          <FileSpreadsheet className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                          Export .xlsx
                        </Button>
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => handleCopyLink(form.id)}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                            Link Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5 mr-1" />
                            Copy Link
                          </>
                        )}
                      </Button>

                      <Link href={`/f/${form.id}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="px-2" title="Open form in new tab">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-2 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteForm(form.id)}
                        disabled={deletingId === form.id}
                        title="Delete Form"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
