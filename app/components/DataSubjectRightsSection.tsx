"use client";

import { useState, useEffect } from "react";
import { Download, Trash2, Shield, CheckCircle2, AlertTriangle, FileText, RefreshCw } from "lucide-react";
import { Button } from "./ui/Button";

type DSRRequest = {
  id: string;
  type: string;
  status: string;
  reason: string | null;
  dueDate: string;
  completedAt: string | null;
  createdAt: string;
};

export function DataSubjectRightsSection({ userId }: { userId: string }) {
  const [downloading, setDownloading] = useState(false);
  const [requests, setRequests] = useState<DSRRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [acknowledgedHold, setAcknowledgedHold] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function loadRequests() {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/user/dsr/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Failed to load DSR requests:", err);
    } finally {
      setLoadingRequests(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  async function handleDownloadData() {
    setDownloading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/dsr/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tinat_personal_data_${userId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setMessage({ text: "Personal data exported successfully in structured JSON format.", type: "success" });
      loadRequests();
    } catch (err) {
      setMessage({ text: "Failed to download personal data. Please try again.", type: "error" });
    } finally {
      setDownloading(false);
    }
  }

  async function handleDeleteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!acknowledgedHold || deleteReason.trim().length < 5) return;

    setDeleteSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/user/dsr/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: deleteReason,
          confirmAcknowledgment: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit erasure request");

      setMessage({
        text: "Account erasure request submitted. Per Proclamation 1321/2024 Art. 24, your request will be processed within 30 days.",
        type: "success",
      });
      setDeleteModalOpen(false);
      setDeleteReason("");
      setAcknowledgedHold(false);
      loadRequests();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to submit erasure request.", type: "error" });
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Shield className="w-4 h-4" />
          Data Protection & Privacy
        </div>
        <h2 className="text-base font-bold text-foreground">
          Data-Subject Rights & Governance
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Under the Ethiopian Personal Data Protection Proclamation 1321/2024, you have statutory rights regarding your personal and demographic data.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
          }`}
        >
          {message.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Grid of Rights */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Right to Data Portability */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <Download className="w-4 h-4 text-primary" />
              Right to Access & Portability
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Download a complete JSON export of all personal profile information, transaction records, activity logs, and consent history.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadData}
            disabled={downloading}
            className="w-full gap-2 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? "Generating Export..." : "Download Personal Data (JSON)"}
          </Button>
        </div>

        {/* Right to Erasure */}
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
              <Trash2 className="w-4 h-4 text-red-600" />
              Right to Erasure (Deletion)
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Request formal account erasure. Direct personal identifiers will be purged within the 30-day statutory timeline under Proclamation 1321/2024.
            </p>
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setDeleteModalOpen(true)}
            className="w-full gap-2 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Request Account Erasure
          </Button>
        </div>
      </div>

      {/* Requests History */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Statutory Requests Register
          </div>
          <Button variant="ghost" size="sm" onClick={loadRequests} disabled={loadingRequests} className="h-7 px-2 text-xs gap-1">
            <RefreshCw className={`w-3 h-3 ${loadingRequests ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {requests.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">
            No data-subject requests recorded.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-muted-foreground">
                <tr>
                  <th className="pb-2 font-medium">Request Type</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Submitted</th>
                  <th className="pb-2 font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td className="py-2 font-medium text-foreground">{req.type}</td>
                    <td className="py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                          req.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="py-2 text-muted-foreground">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="py-2 text-muted-foreground">{new Date(req.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Erasure Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              Request Account Erasure
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              In accordance with Article 24 of the Ethiopian Personal Data Protection Proclamation 1321/2024, your request will be executed within 30 days. Direct personal identifiers (name, email, phone) will be permanently purged.
            </p>

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Statutory Retention Hold
              </div>
              <p className="leading-relaxed">
                Under Ethiopian financial compliance regulations and double-entry accounting standards, credit transaction journals and historical balance audit lines cannot be deleted and will remain pseudonymized.
              </p>
            </div>

            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Reason for Erasure Request:
                </label>
                <textarea
                  required
                  rows={3}
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Please specify why you are requesting account deletion..."
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-xs text-foreground outline-none focus:border-primary/50"
                />
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  required
                  checked={acknowledgedHold}
                  onChange={(e) => setAcknowledgedHold(e.target.checked)}
                  className="mt-0.5 rounded border-border"
                />
                <span>
                  I acknowledge that financial audit records and double-entry accounting lines will be pseudonymized rather than destroyed.
                </span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteModalOpen(false)}
                  disabled={deleteSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={deleteSubmitting || !acknowledgedHold || deleteReason.trim().length < 5}
                >
                  {deleteSubmitting ? "Submitting Request..." : "Confirm Erasure Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
