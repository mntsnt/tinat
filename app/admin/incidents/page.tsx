"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
  Bell,
  Eye,
} from "lucide-react";
import { Button, ButtonLink } from "../../components/ui/Button";

type Incident = {
  id: string;
  type: string;
  severity: string;
  category: string;
  description: string;
  detectedAt: string;
  dataAffected: string | null;
  notifiedParties: string | null;
  status: string;
  resolved: boolean;
  createdAt: string;
};

export default function AdminIncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: "UNAUTHORIZED_ACCESS_ATTEMPT",
    severity: "HIGH",
    category: "DATA_PROTECTION",
    description: "",
    dataAffected: "",
    notifiedParties: "DPO, Technical Security Lead",
    status: "OPEN",
  });
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  async function loadIncidents() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/incidents");
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
      }
    } catch (err) {
      console.error("Failed to load incidents:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIncidents();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create incident");

      setMessage({ text: "Security incident recorded successfully.", type: "success" });
      setModalOpen(false);
      setForm({
        type: "UNAUTHORIZED_ACCESS_ATTEMPT",
        severity: "HIGH",
        category: "DATA_PROTECTION",
        description: "",
        dataAffected: "",
        notifiedParties: "DPO, Technical Security Lead",
        status: "OPEN",
      });
      loadIncidents();
    } catch (err: any) {
      setMessage({ text: err.message || "Failed to record incident.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const res = await fetch(`/api/admin/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        loadIncidents();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
      case "HIGH":
        return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "RESOLVED":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
      case "CONTAINED":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
      case "NOTIFIED":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20";
      default:
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
    }
  };

  return (
    <div className="w-full px-4 py-6 md:px-7 md:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <ButtonLink href="/admin" variant="ghost" size="sm" className="gap-2 text-xs mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </ButtonLink>
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            Security & Breach Governance
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Security Incidents & Breach Workflow
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage data breaches, security events, and regulatory notifications under Proclamation 1321/2024 Article 35.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadIncidents} disabled={loading} className="gap-1.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={() => setModalOpen(true)} className="gap-1.5 text-xs">
            <Plus className="w-4 h-4" /> Report New Incident
          </Button>
        </div>
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

      {/* Incidents Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Active & Historical Incidents ({incidents.length})
          </span>
          <span className="text-xs text-muted-foreground">
            Statutory Breach Notification: 72-Hour Threshold
          </span>
        </div>

        {incidents.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No incidents recorded. Platform operates in standard secure state.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Detected</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Data Affected</th>
                  <th className="p-3">Notified Parties</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3 font-semibold text-foreground">{inc.type}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${getSeverityBadge(inc.severity)}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground whitespace-nowrap">
                      {new Date(inc.detectedAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 max-w-xs truncate" title={inc.description}>
                      {inc.description}
                    </td>
                    <td className="p-3 max-w-xs truncate text-muted-foreground" title={inc.dataAffected || "None specified"}>
                      {inc.dataAffected || "N/A"}
                    </td>
                    <td className="p-3 max-w-xs truncate text-muted-foreground" title={inc.notifiedParties || "None"}>
                      {inc.notifiedParties || "Internal Only"}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[10px] font-bold ${getStatusBadge(inc.status)}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <select
                        value={inc.status}
                        onChange={(e) => handleStatusChange(inc.id, e.target.value)}
                        className="rounded border border-input bg-background px-2 py-1 text-xs text-foreground outline-none"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="INVESTIGATING">INVESTIGATING</option>
                        <option value="CONTAINED">CONTAINED</option>
                        <option value="NOTIFIED">NOTIFIED</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Incident Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-base">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              Log Security Incident / Breach
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Incident Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-foreground"
                >
                  <option value="UNAUTHORIZED_ACCESS_ATTEMPT">Unauthorized Access Attempt</option>
                  <option value="PERSONAL_DATA_BREACH">Personal Data Breach (Proclamation Art. 35)</option>
                  <option value="CREDENTIAL_COMPROMISE">Credential Compromise</option>
                  <option value="DATA_EXFILTRATION_ATTEMPT">Data Exfiltration Attempt</option>
                  <option value="SUSPECTED_RESEARCH_FRAUD">Suspected Research Multi-Accounting Fraud</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-foreground mb-1">Severity Level</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background p-2 text-foreground"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-foreground mb-1">Initial Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background p-2 text-foreground"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="CONTAINED">CONTAINED</option>
                    <option value="NOTIFIED">NOTIFIED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Description & Forensic Details</label>
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detail the detection vector, timeline, affected services, and technical observations..."
                  className="w-full rounded-lg border border-input bg-background p-2 text-foreground"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Data / Subjects Affected</label>
                <input
                  type="text"
                  value={form.dataAffected}
                  onChange={(e) => setForm({ ...form, dataAffected: e.target.value })}
                  placeholder="e.g. 15 participant profiles, no research answers compromised"
                  className="w-full rounded-lg border border-input bg-background p-2 text-foreground"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Notified Parties</label>
                <input
                  type="text"
                  value={form.notifiedParties}
                  onChange={(e) => setForm({ ...form, notifiedParties: e.target.value })}
                  placeholder="e.g. DPO, Supervisory Authority, Affected Subjects"
                  className="w-full rounded-lg border border-input bg-background p-2 text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? "Logging Incident..." : "Confirm & Record Incident"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
