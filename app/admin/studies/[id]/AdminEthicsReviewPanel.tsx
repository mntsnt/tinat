"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Calendar,
  Building,
} from "lucide-react";
import { Button } from "../../../components/ui/Button";

interface EthicsApprovalData {
  id: string;
  committeeName: string;
  approvalNumber: string;
  approvalDate: string | Date;
  expiryDate: string | Date;
  documentPath: string;
  status: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
  adminNotes?: string | null;
  checklist?: any;
  verifiedAt?: string | Date | null;
}

interface Props {
  studyId: string;
  ethicsApproval: EthicsApprovalData | null;
  ethicsExempt: boolean;
  ethicsExemptionReason?: string | null;
}

export function AdminEthicsReviewPanel({
  studyId,
  ethicsApproval,
  ethicsExempt,
  ethicsExemptionReason,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [adminNotes, setAdminNotes] = useState(ethicsApproval?.adminNotes || "");
  const [checklist, setChecklist] = useState({
    committeeRecognized: Boolean(ethicsApproval?.checklist?.committeeRecognized),
    coversOnlineDataCollection: Boolean(ethicsApproval?.checklist?.coversOnlineDataCollection),
    incentiveDescribedCorrectly: Boolean(ethicsApproval?.checklist?.incentiveDescribedCorrectly),
    consentMatches: Boolean(ethicsApproval?.checklist?.consentMatches),
  });

  const [showExemptModal, setShowExemptModal] = useState(false);
  const [exemptionReason, setExemptionReason] = useState("");

  const handleDecision = async (status: "VERIFIED" | "REJECTED") => {
    setError("");
    if (!adminNotes.trim()) {
      return setError("Administrative review notes are required before submitting a decision.");
    }

    if (status === "VERIFIED") {
      if (
        !checklist.committeeRecognized ||
        !checklist.coversOnlineDataCollection ||
        !checklist.incentiveDescribedCorrectly ||
        !checklist.consentMatches
      ) {
        return setError("All 4 checklist requirements must be confirmed to verify ethics approval.");
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/studies/${studyId}/ethics`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes.trim(),
          checklist,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to update ethics approval status.");
      } else {
        router.refresh();
      }
    } catch {
      setError("Network error communicating with the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleGrantExemption = async () => {
    setError("");
    if (!exemptionReason.trim()) {
      return setError("A written, logged exemption reason is required to grant an ethics exemption.");
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/studies/${studyId}/ethics`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exempt: true,
          exemptionReason: exemptionReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to grant exemption.");
      } else {
        setShowExemptModal(false);
        router.refresh();
      }
    } catch {
      setError("Network error granting exemption.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-foreground">Ethics Approval Review Gate</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Verification gate confirming formal institutional ethics clearance before study activation.
          </p>
        </div>

        <div>
          {ethicsExempt ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400">
              Admin Exemption Granted
            </span>
          ) : ethicsApproval ? (
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                ethicsApproval.status === "VERIFIED"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : ethicsApproval.status === "REJECTED"
                  ? "bg-destructive/10 text-destructive"
                  : ethicsApproval.status === "EXPIRED"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Status: {ethicsApproval.status}
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
              No Document Uploaded
            </span>
          )}
        </div>
      </div>

      {/* Mandatory Statutory Copy Notice */}
      <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs text-amber-900 dark:text-amber-200">
        <strong>Statutory Notice:</strong> Tinat ethics verification is an administrative review
        gate to confirm platform protocol compliance. It does <em>not</em> replace institutional
        review board (IRB) or national ethics committee approval.
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
          {error}
        </div>
      )}

      {/* Details or Exemption State */}
      {ethicsExempt ? (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs space-y-2">
          <strong className="block text-foreground text-sm font-semibold">Exemption Details:</strong>
          <p className="text-muted-foreground">{ethicsExemptionReason}</p>
        </div>
      ) : ethicsApproval ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Building className="w-4 h-4 text-emerald-600" />
                Ethics Committee / IRB
              </span>
              <p className="text-sm font-semibold text-foreground">
                {ethicsApproval.committeeName}
              </p>
            </div>

            <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <FileText className="w-4 h-4 text-emerald-600" />
                Approval Reference Number
              </span>
              <p className="text-sm font-semibold text-foreground font-mono">
                {ethicsApproval.approvalNumber}
              </p>
            </div>

            <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Approval Date
              </span>
              <p className="text-foreground">
                {new Date(ethicsApproval.approvalDate).toLocaleDateString()}
              </p>
            </div>

            <div className="space-y-1 p-3 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                Expiry Date
              </span>
              <p className="text-foreground font-medium">
                {new Date(ethicsApproval.expiryDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Uploaded Certificate Document Link */}
          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-2 text-xs">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-foreground">Uploaded Approval Certificate</span>
            </div>
            <a
              href={`/api/studies/${studyId}/ethics/document`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
            >
              Open Stored Document <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* 4-Item Review Checklist */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Administrative Review Checklist (All Required for Verification)
            </h4>

            <div className="space-y-2 text-xs">
              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-gray-300 text-emerald-600"
                  checked={checklist.committeeRecognized}
                  onChange={(e) =>
                    setChecklist({ ...checklist, committeeRecognized: e.target.checked })
                  }
                />
                <div>
                  <span className="font-medium text-foreground block">
                    1. Committee is recognized & accredited
                  </span>
                  <span className="text-muted-foreground">
                    Issued by an accredited IRB, EPHI, NRERC, or university ethics committee.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-gray-300 text-emerald-600"
                  checked={checklist.coversOnlineDataCollection}
                  onChange={(e) =>
                    setChecklist({ ...checklist, coversOnlineDataCollection: e.target.checked })
                  }
                />
                <div>
                  <span className="font-medium text-foreground block">
                    2. Approval covers digital / online data collection
                  </span>
                  <span className="text-muted-foreground">
                    Protocol explicitly permits remote electronic questionnaires or mobile data collection.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-gray-300 text-emerald-600"
                  checked={checklist.incentiveDescribedCorrectly}
                  onChange={(e) =>
                    setChecklist({ ...checklist, incentiveDescribedCorrectly: e.target.checked })
                  }
                />
                <div>
                  <span className="font-medium text-foreground block">
                    3. Incentive described as non-cash platform credits (or none)
                  </span>
                  <span className="text-muted-foreground">
                    No promises of cash prizes, money transfers, or financial remuneration.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/30 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 rounded border-gray-300 text-emerald-600"
                  checked={checklist.consentMatches}
                  onChange={(e) =>
                    setChecklist({ ...checklist, consentMatches: e.target.checked })
                  }
                />
                <div>
                  <span className="font-medium text-foreground block">
                    4. Informed consent form matches protocol
                  </span>
                  <span className="text-muted-foreground">
                    Participant key information, risks, and voluntary withdrawal terms match the submitted instrument.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Admin Decision Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Administrative Review Notes & Rationale <span className="text-destructive">*</span>
            </label>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Record review notes, verification findings, or rejection reasons..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              size="sm"
              disabled={loading}
              onClick={() => handleDecision("VERIFIED")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Verify Ethics Approval
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={loading}
              onClick={() => handleDecision("REJECTED")}
              className="border-destructive/40 text-destructive hover:bg-destructive/10 text-xs gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject Approval
            </Button>

            <Button
              size="sm"
              variant="ghost"
              disabled={loading}
              onClick={() => setShowExemptModal(true)}
              className="text-xs text-muted-foreground"
            >
              Grant Admin Exemption
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl border border-muted bg-muted/20 text-xs text-muted-foreground flex items-center justify-between">
          <span>The researcher has not yet uploaded an Institutional Ethics Approval document.</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowExemptModal(true)}
            className="text-xs"
          >
            Grant Admin Exemption
          </Button>
        </div>
      )}

      {/* Admin Exemption Modal */}
      {showExemptModal && (
        <div className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-lg">
          <strong className="block text-sm font-semibold text-foreground">
            Grant Administrative Ethics Exemption
          </strong>
          <p className="text-xs text-muted-foreground">
            Administrative exemptions must be accompanied by a clear, logged written reason (e.g. minimal-risk institutional public health quality improvement survey).
          </p>
          <textarea
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
            rows={2}
            value={exemptionReason}
            onChange={(e) => setExemptionReason(e.target.value)}
            placeholder="State the formal administrative reason for granting an ethics exemption..."
          />
          <div className="flex gap-2 justify-end">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowExemptModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={loading || !exemptionReason.trim()}
              onClick={handleGrantExemption}
              className="bg-primary text-primary-foreground text-xs"
            >
              Confirm Exemption
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
