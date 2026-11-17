"use client";

import { useState, useEffect } from "react";
import { ClipboardList, CheckCircle, XCircle, ChevronRight, Bell, ShieldCheck, Banknote, Wallet, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CollectorDashboardPage() {
  const router = useRouter();
  const [studies, setStudies] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [totalPaidCents, setTotalPaidCents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studiesRes, invRes] = await Promise.all([
        fetch("/api/collector/studies"),
        fetch("/api/collector/invitations")
      ]);

      if (studiesRes.ok) {
        const sData = await studiesRes.json();
        setStudies(sData.studies || []);
        setTotalPaidCents(sData.totalPaidCents || 0);
      } else {
        // If 403, maybe not verified. Redirect?
        if (studiesRes.status === 403) router.push("/verify-email");
      }

      if (invRes.ok) {
        const iData = await invRes.json();
        setInvitations(iData.invitations || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const respondToInvitation = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/collector/invitations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: id, status })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const totalResponses = studies.reduce(
    (sum, s) => sum + (s.study?._count?.responses || 0),
    0
  );

  const totalEarnedCents = studies.reduce((sum, s) => {
    const responsesCount = s.study?._count?.responses || 0;
    const payRateCents = s.study?.collectorPayRateCents || 0;
    const payType = s.study?.collectorPayType;
    if (payType === "FIXED") {
      return sum + (responsesCount > 0 ? payRateCents : 0);
    }
    if (payType === "PER_RESPONSE") {
      return sum + (responsesCount * payRateCents);
    }
    return sum;
  }, 0);

  const pendingCents = Math.max(0, totalEarnedCents - totalPaidCents);

  if (isLoading) return <div className="p-6 text-center text-muted-foreground">Loading Data Collection Dashboard...</div>;

  return (
    <div className="w-full px-4 py-6 md:px-7 md:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-emerald-600" />
          Field Data Collection
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your field collection assignments and submit responses on behalf of participants.
        </p>
      </div>

      {/* Field Collector ETB Wallet Deck */}
      <div className="mb-8 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-card to-card p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-sm">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">Field Collector ETB Wallet</h2>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Real Money ETB
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Compensation accrued after starting field data collection across assigned studies.
              </p>
            </div>
          </div>
          <Link
            href="/participant/wallet"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Wallet className="w-4 h-4" />
            <span>Open Wallet &amp; Payouts</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          <div className="p-4 rounded-xl bg-muted/40 border border-border">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
              Accrued / Payable
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {(pendingCents / 100).toFixed(2)} <span className="text-xs font-medium text-muted-foreground">ETB</span>
            </span>
            <p className="text-[11px] text-muted-foreground mt-1">Pending disbursement</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
              Lifetime Earned
            </span>
            <span className="text-2xl font-black text-foreground">
              {(totalEarnedCents / 100).toFixed(2)} <span className="text-xs font-medium text-muted-foreground">ETB</span>
            </span>
            <p className="text-[11px] text-muted-foreground mt-1">Total field earnings</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
              Total Paid Out
            </span>
            <span className="text-2xl font-black text-foreground">
              {(totalPaidCents / 100).toFixed(2)} <span className="text-xs font-medium text-muted-foreground">ETB</span>
            </span>
            <p className="text-[11px] text-muted-foreground mt-1">Settled direct payouts</p>
          </div>

          <div className="p-4 rounded-xl bg-muted/40 border border-border">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold block mb-1">
              Surveys Collected
            </span>
            <span className="text-2xl font-black text-foreground">
              {totalResponses}
            </span>
            <p className="text-[11px] text-muted-foreground mt-1">Across {studies.length} active studies</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Invitations */}
        {invitations.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-500 flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4" />
              New Study Invitations ({invitations.length})
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {invitations.map((inv) => (
                <div key={inv.id} className="bg-white dark:bg-card border border-border rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-foreground mb-1 line-clamp-1">{inv.study.title}</h4>
                  <p className="text-xs text-muted-foreground mb-4">Invited by Dr. {inv.inviter.name}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => respondToInvitation(inv.id, "ACCEPTED")}
                      className="flex-1 bg-emerald-600 text-white py-1.5 rounded-md font-medium text-xs hover:bg-emerald-700 transition"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => respondToInvitation(inv.id, "DECLINED")}
                      className="flex-1 bg-background border border-border text-foreground py-1.5 rounded-md font-medium text-xs hover:bg-muted transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assigned Studies */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">My Assigned Studies</h2>
          
          {studies.length === 0 ? (
            <div className="bg-card rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
              <ShieldCheck className="w-8 h-8 mx-auto mb-3 text-emerald-500 opacity-50" />
              <p className="font-medium text-foreground mb-1">No active assignments</p>
              <p className="text-sm">You have not been assigned to collect data for any studies yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {studies.map((s) => (
                <Link key={s.study.id} href={`/collector/studies/${s.study.id}/collect`} className="block">
                  <div className="bg-card rounded-xl border border-border p-5 hover:border-emerald-300 transition group relative shadow-sm h-full flex flex-col">
                    <div className="absolute right-4 top-5 text-muted-foreground group-hover:text-emerald-500 transition">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                    
                    <h3 className="font-semibold text-foreground pr-8 leading-snug line-clamp-2">{s.study.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1.5">Dr. {s.study.researcher.name}</p>
                    
                    <div className="mt-auto pt-4 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-medium text-xs">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {s.study._count.responses} collected
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        s.study.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-muted text-muted-foreground"
                      }`}>
                        {s.study.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
