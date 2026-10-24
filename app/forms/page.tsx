"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  FileSpreadsheet,
  Users,
  HelpCircle,
  PlayCircle,
  PauseCircle,
  Search,
  ArrowRight,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { StudyBanner } from "../components/studies/StudyBanner";

type TinatForm = {
  id: string;
  title: string;
  description: string | null;
  bannerTheme?: string;
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
    setTimeout(() => setCopiedId(null), 2000);
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
  const totalPaused = forms.filter((f) => f.status === "PAUSED").length;

  const statsCards = [
    {
      label: "Total Forms",
      value: forms.length,
      sub: "Forms created",
      icon: <ClipboardList className="w-5 h-5" />,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400",
    },
    {
      label: "Submissions Collected",
      value: totalResponses,
      sub: "All time entries",
      icon: <Users className="w-5 h-5" />,
      color: "text-primary bg-primary/5 dark:bg-primary/15",
    },
    {
      label: "Active Surveys",
      value: totalActive,
      sub: "Accepting responses",
      icon: <PlayCircle className="w-5 h-5" />,
      color: "text-cyan-800 bg-cyan-50 dark:bg-cyan-950/40 dark:text-cyan-300",
    },
    {
      label: "Paused Surveys",
      value: totalPaused,
      sub: "Closed for submissions",
      icon: <PauseCircle className="w-5 h-5" />,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400",
    },
  ];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:px-7 md:py-8">
      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Tinat Forms
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create simple surveys, collect responses from anyone without login, and export your data instantly.
          </p>
        </div>
        <Link href="/forms/new">
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Create New Form
          </Button>
        </Link>
      </div>

      {/* Stat Cards Row (identical design to participant dashboard) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statsCards.map((card) => (
          <Card key={card.label} className="hover:border-primary/40 transition-colors h-full">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    {card.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground leading-none">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-1.5">{card.sub}</p>
                </div>
                <div className={`flex-shrink-0 rounded-md p-2 ${card.color}`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search Input */}
      {forms.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search forms by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      )}

      {/* Forms Grid or Empty State */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground text-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <div>Loading your Tinat Forms...</div>
        </div>
      ) : forms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/5 dark:bg-primary/20 flex items-center justify-center mb-4">
              <ClipboardList className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">No Tinat Forms yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              You do not need to be an academic researcher to collect survey data. Create simple questionnaires and collect responses from anyone with zero sign-in barrier.
            </p>
            <Link href="/forms/new">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Form
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredForms.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground text-sm">
          No forms matching &quot;{search}&quot;.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredForms.map((form) => {
            const isCopied = copiedId === form.id;
            const isActive = form.status === "ACTIVE";

            return (
              <Card
                key={form.id}
                className="flex flex-col overflow-hidden hover:border-primary/40 transition-colors"
              >
                <StudyBanner theme={form.bannerTheme || "canopy"} className="h-20" />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <button
                      onClick={() => handleToggleStatus(form)}
                      disabled={togglingId === form.id}
                      className="cursor-pointer"
                      title={isActive ? "Click to pause responses" : "Click to accept responses"}
                    >
                      <Badge variant={isActive ? "success" : "secondary"}>
                        {isActive ? "Accepting Responses" : "Paused"}
                      </Badge>
                    </button>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Tinat Form
                    </span>
                  </div>

                  <CardTitle className="text-base line-clamp-1">{form.title}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {form.description || "No description provided."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="pb-3 flex-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="h-3.5 w-3.5" />
                      {form._count.questions} questions
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      {form._count.responses} responses
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2 w-full">
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
                        Export
                      </Button>
                    </a>
                  </div>

                  <div className="flex items-center gap-2 w-full">
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
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
