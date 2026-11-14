"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  ClipboardList,
  Check,
  X,
  Clock,
  Trash2,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Phone,
  GraduationCap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { Input } from "../../../components/ui/Input";

interface CollectorUser {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  institution: string | null;
  fieldOfStudy: string | null;
}

interface AssignedCollector {
  id: string;
  studyId: string;
  userId: string;
  assignedAt: string;
  user: CollectorUser;
  responsesGathered: number;
}

interface CollectorApplication {
  id: string;
  studyId: string;
  applicantId: string;
  status: "PENDING" | "APPROVED" | "DECLINED";
  notes: string | null;
  createdAt: string;
  applicant: CollectorUser;
}

interface Props {
  studyId: string;
  studyTitle: string;
}

export function StudyCollectorsTab({ studyId, studyTitle }: Props) {
  const [collectors, setCollectors] = useState<AssignedCollector[]>([]);
  const [applications, setApplications] = useState<CollectorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Direct assign form state
  const [assignIdentifier, setAssignIdentifier] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCollectorData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/studies/${studyId}/collectors`);
      if (res.ok) {
        const data = await res.json();
        setCollectors(data.collectors || []);
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error("Failed to load collectors:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectorData();
  }, [studyId]);

  const handleApplicationDecision = async (applicationId: string, status: "APPROVED" | "DECLINED") => {
    try {
      setActionLoading(applicationId);
      const res = await fetch(`/api/studies/${studyId}/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchCollectorData();
      }
    } catch (err) {
      console.error("Decision failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDirectAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignIdentifier.trim()) return;

    try {
      setAssigning(true);
      setAssignMessage(null);

      const res = await fetch(`/api/studies/${studyId}/collectors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: assignIdentifier.trim(), directAssign: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to assign collector");
      }

      setAssignMessage({ type: "success", text: data.message || "Collector assigned successfully!" });
      setAssignIdentifier("");
      await fetchCollectorData();
    } catch (err: any) {
      setAssignMessage({ type: "error", text: err.message || "Failed to assign collector" });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveCollector = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from data collection for this study?`)) {
      return;
    }
    try {
      setActionLoading(`remove_${userId}`);
      const res = await fetch(`/api/studies/${studyId}/collectors?userId=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchCollectorData();
      }
    } catch (err) {
      console.error("Remove failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const pendingApps = applications.filter((a) => a.status === "PENDING");
  const decidedApps = applications.filter((a) => a.status !== "PENDING");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
        <span>Loading collector management...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Stat Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Active Collectors</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{collectors.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Pending Applications</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{pendingApps.length}</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-medium">Responses from Collectors</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">
                {collectors.reduce((sum, c) => sum + c.responsesGathered, 0)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <ClipboardList className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Direct Assignment Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base">Directly Assign a Field Data Collector</CardTitle>
          </div>
          <CardDescription>
            Assign a participant by their username (@handle) or email. They will immediately receive access to the Field Collector dashboard, along with an in-platform notification and email alert.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDirectAssign} className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              value={assignIdentifier}
              onChange={(e) => setAssignIdentifier(e.target.value)}
              placeholder="Enter participant username or email (e.g. @username or collector@university.edu.et)"
              className="flex-1 text-sm"
              required
            />
            <Button
              type="submit"
              disabled={assigning}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1.5"
            >
              {assigning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Assign Collector
                </>
              )}
            </Button>
          </form>

          {assignMessage && (
            <div
              className={`mt-3 p-3 rounded-lg text-xs flex items-center gap-2 ${
                assignMessage.type === "success"
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30"
              }`}
            >
              {assignMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{assignMessage.text}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Applications Queue */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <CardTitle className="text-base">
                Pending Collector Applications ({pendingApps.length})
              </CardTitle>
            </div>
            {pendingApps.length > 0 && (
              <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-0">
                Action Required
              </Badge>
            )}
          </div>
          <CardDescription>
            Participants who discovered this study on the deck and applied to become field enumerators.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingApps.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
              <Check className="w-8 h-8 text-emerald-500/40 mx-auto mb-1.5" />
              <p className="font-semibold text-foreground">No pending applications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                New collector applications from study deck discovery will show up here for your review.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {pendingApps.map((app) => (
                <div key={app.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/profile/${app.applicant.id}`}
                        title={`View ${app.applicant.name}'s profile`}
                        className="font-semibold text-sm text-foreground hover:text-emerald-600 hover:underline transition-colors"
                      >
                        {app.applicant.name}
                      </Link>
                      {app.applicant.username && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          @{app.applicant.username}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">({app.applicant.email})</span>
                      {app.applicant.phone && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          <Phone className="w-3 h-3" /> {app.applicant.phone}
                        </span>
                      )}
                    </div>

                    {(app.applicant.institution || app.applicant.fieldOfStudy) && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        {[app.applicant.institution, app.applicant.fieldOfStudy].filter(Boolean).join(" · ")}
                      </p>
                    )}

                    {app.notes && (
                      <div className="mt-2 rounded-lg bg-muted/60 p-2.5 text-xs text-foreground/90 italic border border-border">
                        &quot;{app.notes}&quot;
                      </div>
                    )}

                    <p className="text-[11px] text-muted-foreground pt-1">
                      Applied {new Date(app.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === app.id}
                      onClick={() => handleApplicationDecision(app.id, "DECLINED")}
                      className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-300/50"
                    >
                      <X className="w-3.5 h-3.5 mr-1" />
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      disabled={actionLoading === app.id}
                      onClick={() => handleApplicationDecision(app.id, "APPROVED")}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      {actionLoading === app.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      ) : (
                        <Check className="w-3.5 h-3.5 mr-1" />
                      )}
                      Approve Collector
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Data Collectors Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-base">Active Authorized Collectors ({collectors.length})</CardTitle>
          </div>
          <CardDescription>
            These collectors are authorized to administer the study in the field and collect verified participant submissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {collectors.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
              <Users className="w-8 h-8 opacity-40 mx-auto mb-1.5" />
              <p className="font-semibold text-foreground">No collectors assigned yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Use the direct assignment form above or approve incoming applications to add collectors.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Collector</th>
                    <th className="py-3 px-4">Assigned On</th>
                    <th className="py-3 px-4 text-center">Responses Gathered</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {collectors.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/profile/${c.user.id}`}
                            title={`View ${c.user.name}'s profile`}
                            className="font-semibold text-foreground text-sm hover:text-emerald-600 hover:underline transition-colors"
                          >
                            {c.user.name}
                          </Link>
                          {c.user.username && (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              @{c.user.username}
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs">{c.user.email}</div>
                        {c.user.phone && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">{c.user.phone}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(c.assignedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          {c.responsesGathered} responses
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={actionLoading === `remove_${c.userId}`}
                          onClick={() => handleRemoveCollector(c.userId, c.user.name)}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
