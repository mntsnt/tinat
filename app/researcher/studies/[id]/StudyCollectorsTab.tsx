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
import { useConfirm } from "../../../components/ui/ConfirmDialog";

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
  amountDueCents: number;
  paidAmountCents: number;
  outstandingAmountCents: number;
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

interface CollectorFunding {
  collectorsNeeded: number;
  payType: "FIXED" | "PER_RESPONSE" | null;
  payRateCents: number;
  budgetCents: number;
  paymentsEnabled: boolean;
  payments: Array<{
    id: string;
    bank: string;
    transactionReference: string;
    expectedAmountCents: number;
    verifiedAmountCents: number | null;
    status: "PENDING" | "VERIFIED" | "FAILED";
    failureReason: string | null;
    createdAt: string;
  }>;
  payouts: Array<{
    id: string;
    collectorUserId: string;
    amountCents: number;
    paymentReference: string;
    createdAt: string;
  }>;
}

interface Props {
  studyId: string;
  studyTitle: string;
}

export function StudyCollectorsTab({ studyId, studyTitle }: Props) {
  const { confirm, alert } = useConfirm();
  const [collectors, setCollectors] = useState<AssignedCollector[]>([]);
  const [applications, setApplications] = useState<CollectorApplication[]>([]);
  const [collectorFunding, setCollectorFunding] = useState<CollectorFunding | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [fundingBank, setFundingBank] = useState("cbe");
  const [fundingReference, setFundingReference] = useState("");
  const [fundingAccountSuffix, setFundingAccountSuffix] = useState("");
  const [fundingPhone, setFundingPhone] = useState("");
  const [fundingLoading, setFundingLoading] = useState(false);
  const [fundingMessage, setFundingMessage] = useState<string | null>(null);
  const [payoutInputs, setPayoutInputs] = useState<Record<string, { amount: string; reference: string }>>({});
  const [applicationMessage, setApplicationMessage] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  // Direct assign form state
  const [assignIdentifier, setAssignIdentifier] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignMessage, setAssignMessage] = useState<{
    type: "success" | "warning" | "error";
    text: string;
  } | null>(null);

  const fetchCollectorData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/studies/${studyId}/collectors`);
      if (res.ok) {
        const data = await res.json();
        setCollectors(data.collectors || []);
        setApplications(data.applications || []);
        setCollectorFunding(data.collectorFunding || null);
      }
    } catch (err) {
      console.error("Failed to load collectors:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFunding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingReference.trim()) return;

    try {
      setFundingLoading(true);
      setFundingMessage(null);
      const res = await fetch(`/api/studies/${studyId}/collector-funding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bank: fundingBank,
          reference: fundingReference.trim(),
          accountSuffix: fundingAccountSuffix.trim(),
          phone: fundingPhone.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not verify this transfer.");
      setFundingMessage(data.message || "Payment verification started.");
      await fetchCollectorData();
    } catch (err) {
      setFundingMessage(err instanceof Error ? err.message : "Could not verify this transfer.");
    } finally {
      setFundingLoading(false);
    }
  };

  const handleRecordPayout = async (collectorUserId: string) => {
    const payoutInput = payoutInputs[collectorUserId];
    if (!payoutInput?.amount || !payoutInput.reference?.trim()) return;

    try {
      setActionLoading(`payout_${collectorUserId}`);
      const res = await fetch(`/api/studies/${studyId}/collector-payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectorUserId,
          amount: payoutInput.amount,
          paymentReference: payoutInput.reference.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not record this payout.");
      setPayoutInputs((current) => ({ ...current, [collectorUserId]: { amount: "", reference: "" } }));
      await fetchCollectorData();
    } catch (err) {
      setApplicationMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Could not record this payout.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchCollectorData();
  }, [studyId]);

  const handleApplicationDecision = async (applicationId: string, status: "APPROVED" | "DECLINED") => {
    try {
      setActionLoading(applicationId);
      setApplicationMessage(null);
      const res = await fetch(`/api/studies/${studyId}/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update this application.");
      setApplicationMessage({
        type: data.emailSent === false ? "warning" : "success",
        text: data.message || "Application decision saved.",
      });
      await fetchCollectorData();
    } catch (err) {
      setApplicationMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Could not update this application.",
      });
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

      setAssignMessage({
        type: data.emailSent === false ? "warning" : "success",
        text: data.message || "Collector assigned successfully!",
      });
      setAssignIdentifier("");
      await fetchCollectorData();
    } catch (err: any) {
      setAssignMessage({ type: "error", text: err.message || "Failed to assign collector" });
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveCollector = async (userId: string, userName: string) => {
    const ok = await confirm({
      title: "Remove Field Collector",
      message: `Are you sure you want to remove ${userName} from data collection for this study?`,
      confirmText: "Remove Collector",
      variant: "danger",
    });
    if (!ok) return;

    try {
      setActionLoading(`remove_${userId}`);
      const res = await fetch(`/api/studies/${studyId}/collectors?userId=${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        await alert({
          title: "Remove Failed",
          message: data.error || "Could not remove the collector. Please try again.",
          variant: "danger",
        });
        return;
      }

      await fetchCollectorData();
    } catch (err) {
      console.error("Remove failed:", err);
      await alert({
        title: "Remove Failed",
        message: "Could not remove the collector. Please try again.",
        variant: "danger",
      });
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

      {collectorFunding && collectorFunding.collectorsNeeded > 0 && collectorFunding.budgetCents === 0 && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Free (Volunteer) Field Collection</p>
                <p className="text-xs text-muted-foreground">
                  This study is configured for {collectorFunding.collectorsNeeded} volunteer field enumerator{collectorFunding.collectorsNeeded === 1 ? "" : "s"}. No bank deposit or verification required.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white self-start sm:self-auto">
              0.00 ETB · Free
            </span>
          </CardContent>
        </Card>
      )}

      {collectorFunding && collectorFunding.budgetCents > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Collector ETB funding</CardTitle>
            <CardDescription>
              Required for {collectorFunding.collectorsNeeded} collector position{collectorFunding.collectorsNeeded === 1 ? "" : "s"}.
              This amount is separate from participant TC rewards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/50 p-4">
              <span className="text-sm text-muted-foreground">
                {collectorFunding.payType === "FIXED"
                  ? `${(collectorFunding.payRateCents / 100).toFixed(2)} ETB per collector`
                  : `${(collectorFunding.payRateCents / 100).toFixed(2)} ETB per response`}
              </span>
              <strong className="text-lg text-foreground">
                Required: {(collectorFunding.budgetCents / 100).toFixed(2)} ETB
              </strong>
            </div>

            {collectorFunding.payments.some((payment) =>
              payment.status === "VERIFIED" &&
              payment.verifiedAmountCents === collectorFunding.budgetCents
            ) ? (
              <p role="status" className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Collector budget payment verified. Collectors can be approved up to the requested limit.
              </p>
            ) : collectorFunding.paymentsEnabled ? (
              <form onSubmit={handleVerifyFunding} className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Transfer the exact amount to Tinat’s registered settlement account, then enter the transaction details for verification.
                </p>
                <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={fundingBank}
                    onChange={(e) => setFundingBank(e.target.value)}
                    aria-label="Payment bank or wallet"
                  >
                    <option value="cbe">CBE</option>
                    <option value="boa">Bank of Abyssinia</option>
                    <option value="telebirr">Telebirr</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="cbebirr">CBE Birr</option>
                    <option value="dashen">Dashen</option>
                    <option value="awash">Awash</option>
                    <option value="siinqee">Siinqee</option>
                    <option value="kaafiebirr">Kaafi E-Birr</option>
                    <option value="coopayebirr">Coopay E-Birr</option>
                  </select>
                  <Input
                    value={fundingReference}
                    onChange={(e) => setFundingReference(e.target.value)}
                    placeholder="Transaction / receipt reference"
                    maxLength={255}
                    required
                  />
                  <Button type="submit" disabled={fundingLoading || !fundingReference.trim()}>
                    {fundingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify transfer"}
                  </Button>
                </div>
                {fundingBank === "boa" && (
                  <Input
                    inputMode="numeric"
                    value={fundingAccountSuffix}
                    onChange={(e) => setFundingAccountSuffix(e.target.value)}
                    placeholder="Bank of Abyssinia 5-digit account suffix"
                    maxLength={5}
                    required
                  />
                )}
                {fundingBank === "cbe" && (
                  <Input
                    inputMode="numeric"
                    value={fundingAccountSuffix}
                    onChange={(e) => setFundingAccountSuffix(e.target.value)}
                    placeholder="Optional 8-digit suffix for legacy CBE FT references"
                    maxLength={8}
                  />
                )}
                {fundingBank === "cbebirr" && (
                  <Input
                    inputMode="tel"
                    value={fundingPhone}
                    onChange={(e) => setFundingPhone(e.target.value)}
                    placeholder="CBE Birr phone number"
                    required
                  />
                )}
                {fundingMessage && <p role="status" className="text-sm text-muted-foreground">{fundingMessage}</p>}
                {collectorFunding.payments.some((payment) => payment.status === "PENDING") && (
                  <Button type="button" variant="outline" size="sm" onClick={fetchCollectorData}>
                    Refresh verification status
                  </Button>
                )}
              </form>
            ) : (
              <p role="status" className="text-sm text-amber-700 dark:text-amber-300">
                Verify.et cash funding is not enabled or configured on this server yet.
              </p>
            )}

            {collectorFunding.payments.length > 0 && (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verification history</p>
                {collectorFunding.payments.map((payment) => (
                  <div key={payment.id} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {payment.bank.toUpperCase()} · {payment.transactionReference} · {(payment.expectedAmountCents / 100).toFixed(2)} ETB
                    </span>
                    <span className={payment.status === "VERIFIED" ? "text-emerald-600" : payment.status === "FAILED" ? "text-destructive" : "text-amber-600"}>
                      {payment.status === "VERIFIED" ? "Verified" : payment.status === "FAILED" ? payment.failureReason || "Not verified" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                  : assignMessage.type === "warning"
                    ? "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30"
                    : "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30"
              }`}
              role={assignMessage.type === "error" ? "alert" : "status"}
            >
              {assignMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : assignMessage.type === "warning" ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
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
          {applicationMessage && (
            <div
              role={applicationMessage.type === "error" ? "alert" : "status"}
              className={`mb-4 flex items-start gap-2 rounded-lg border p-3 text-xs ${
                applicationMessage.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                  : applicationMessage.type === "warning"
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300"
                    : "border-destructive/20 bg-destructive/5 text-destructive"
              }`}
            >
              {applicationMessage.type === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{applicationMessage.text}</span>
            </div>
          )}
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
            <div className="rounded-xl border border-border overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border">
                  <tr>
                    <th className="py-3 px-4">Collector</th>
                    <th className="py-3 px-4">Assigned On</th>
                    <th className="py-3 px-4 text-center">Responses Gathered</th>
                    <th className="py-3 px-4">ETB Payout</th>
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
                      <td className="py-3.5 px-4 min-w-64">
                        {collectorFunding?.budgetCents === 0 ? (
                          <div className="space-y-1 text-xs">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                              Free / Volunteer
                            </span>
                            <p className="text-muted-foreground text-[11px]">No cash compensation required</p>
                          </div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            <p>Due: {(c.amountDueCents / 100).toFixed(2)} ETB</p>
                            <p className="text-muted-foreground">Paid: {(c.paidAmountCents / 100).toFixed(2)} ETB</p>
                            <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                              Outstanding: {(c.outstandingAmountCents / 100).toFixed(2)} ETB
                            </p>
                            {collectorFunding?.payouts
                              .filter((payout) => payout.collectorUserId === c.userId)
                              .map((payout) => (
                                <p key={payout.id} className="break-all text-[11px] text-muted-foreground">
                                  Paid {(payout.amountCents / 100).toFixed(2)} ETB · {payout.paymentReference}
                                </p>
                              ))}
                          </div>
                        )}
                        {collectorFunding && collectorFunding.budgetCents > 0 && c.outstandingAmountCents > 0 && collectorFunding?.paymentsEnabled && (
                          <div className="mt-2 flex min-w-56 flex-col gap-2">
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              placeholder="Amount in ETB"
                              value={payoutInputs[c.userId]?.amount ?? ""}
                              onChange={(e) => setPayoutInputs((current) => ({
                                ...current,
                                [c.userId]: {
                                  amount: e.target.value,
                                  reference: current[c.userId]?.reference ?? "",
                                },
                              }))}
                            />
                            <Input
                              placeholder="External transfer reference"
                              maxLength={255}
                              value={payoutInputs[c.userId]?.reference ?? ""}
                              onChange={(e) => setPayoutInputs((current) => ({
                                ...current,
                                [c.userId]: {
                                  amount: current[c.userId]?.amount ?? "",
                                  reference: e.target.value,
                                },
                              }))}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={
                                actionLoading === `payout_${c.userId}` ||
                                !payoutInputs[c.userId]?.amount ||
                                !payoutInputs[c.userId]?.reference?.trim()
                              }
                              onClick={() => handleRecordPayout(c.userId)}
                            >
                              {actionLoading === `payout_${c.userId}` ? "Recording..." : "Record payout"}
                            </Button>
                            <span className="text-[11px] text-muted-foreground">
                              Record only after the external ETB transfer has been sent.
                            </span>
                          </div>
                        )}
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
