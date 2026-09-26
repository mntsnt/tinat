"use client";

import { useState, useEffect } from "react";
import { ClipboardList, CheckCircle, XCircle, ChevronRight, Bell, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CollectorDashboardPage() {
  const router = useRouter();
  const [studies, setStudies] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
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
      } else {
        // If 403, maybe not verified. Redirect?
        if (studiesRes.status === 403) router.push("/verify");
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

  if (isLoading) return <div className="p-8 text-center">Loading Data Collection Dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6 pb-12 shadow-sm rounded-b-3xl">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="w-6 h-6" />
              Data Collection
            </h1>
            <div className="bg-white/20 p-2 rounded-full relative">
              <Bell className="w-5 h-5" />
              {invitations.length > 0 && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-blue-600"></span>
              )}
            </div>
          </div>
          
          <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/20 flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-100 mb-1">Status</p>
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                Verified Collector
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-100 mb-1">Total Responses</p>
              <p className="font-bold text-2xl text-white">
                {studies.reduce((acc, s) => acc + s.study._count.responses, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6 space-y-6">
        
        {/* Invitations */}
        {invitations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-orange-100 overflow-hidden">
            <div className="bg-orange-50 px-4 py-3 border-b border-orange-100 text-sm font-semibold text-orange-800 flex items-center gap-2">
              <Bell className="w-4 h-4" />
              New Study Invitations ({invitations.length})
            </div>
            <div className="p-4 space-y-4">
              {invitations.map((inv) => (
                <div key={inv.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
                  <h4 className="font-bold text-gray-900 mb-1">{inv.study.title}</h4>
                  <p className="text-sm text-gray-600 mb-4">Invited by Dr. {inv.inviter.name}</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => respondToInvitation(inv.id, "ACCEPTED")}
                      className="flex-1 bg-emerald-600 text-white py-2 rounded-md font-medium text-sm hover:bg-emerald-700 transition"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => respondToInvitation(inv.id, "DECLINED")}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-md font-medium text-sm hover:bg-gray-50 transition"
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
          <h2 className="font-bold text-gray-900 mb-4 px-2">My Assigned Studies</h2>
          
          {studies.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              <p>You have not been assigned to any studies yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {studies.map((s) => (
                <Link key={s.study.id} href={`/collector/studies/${s.study.id}/collect`} className="block">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-blue-300 transition group relative overflow-hidden">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 pr-8">{s.study.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Dr. {s.study.researcher.name}</p>
                    
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                        <CheckCircle className="w-4 h-4" />
                        {s.study._count.responses} collected
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        s.study.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"
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
