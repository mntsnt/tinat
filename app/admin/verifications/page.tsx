"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, ShieldQuestion, CheckCircle, XCircle } from "lucide-react";

type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

interface Verification {
  id: string;
  verificationType: string;
  status: VerificationStatus;
  submittedAt: string;
  verificationReference?: string;
  user: { id: string; name: string; email: string; };
  reviewedBy?: { name: string; };
}

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED">("PENDING");

  useEffect(() => {
    fetchVerifications();
  }, [activeTab]);

  const fetchVerifications = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/verifications?status=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setVerifications(data.verifications || []);
      }
    } catch (error) {
      console.error("Failed to fetch verifications", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      if (res.ok) {
        fetchVerifications();
      }
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const tabs = ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"] as const;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
          Verification Requests
        </h1>
        <p className="text-gray-600 mt-2">Manage identity verifications for Researchers and Data Collectors.</p>
      </div>

      <div className="flex border-b border-gray-200 space-x-8 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 px-2 font-medium text-sm transition-colors ${
              activeTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Loading requests...</div>
      ) : verifications.length === 0 ? (
        <div className="py-12 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          No {activeTab.toLowerCase()} requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {verifications.map((v) => (
            <div key={v.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{v.user.name}</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                    {v.verificationType}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    v.status === "VERIFIED" ? "bg-emerald-100 text-emerald-800" :
                    v.status === "PENDING" ? "bg-blue-100 text-blue-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    {v.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 grid grid-cols-2 gap-x-8 gap-y-1">
                  <p><strong>Email:</strong> {v.user.email}</p>
                  <p><strong>Ref (FAN):</strong> {v.verificationReference || "N/A"}</p>
                  <p><strong>Submitted:</strong> {new Date(v.submittedAt).toLocaleDateString()}</p>
                  {v.reviewedBy && <p><strong>Reviewed by:</strong> {v.reviewedBy.name}</p>}
                </div>
              </div>
              
              {activeTab === "PENDING" && (
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => handleUpdateStatus(v.id, "VERIFIED")}
                    className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-md hover:bg-emerald-100 transition text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button 
                    onClick={() => {
                      const reason = prompt("Enter rejection reason (optional):");
                      if (reason !== null) handleUpdateStatus(v.id, "REJECTED", reason);
                    }}
                    className="flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2 rounded-md hover:bg-rose-100 transition text-sm font-medium"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
              {activeTab === "VERIFIED" && (
                <div className="flex gap-2 shrink-0">
                   <button 
                    onClick={() => {
                      const confirm = window.confirm("Are you sure you want to suspend this user's verification?");
                      if (confirm) handleUpdateStatus(v.id, "SUSPENDED");
                    }}
                    className="flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2 rounded-md hover:bg-rose-100 transition text-sm font-medium"
                  >
                    <ShieldAlert className="w-4 h-4" /> Suspend
                  </button>
                </div>
              )}
              {activeTab === "SUSPENDED" && (
                <div className="flex gap-2 shrink-0">
                   <button 
                    onClick={() => handleUpdateStatus(v.id, "VERIFIED")}
                    className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-md hover:bg-emerald-100 transition text-sm font-medium"
                  >
                    <CheckCircle className="w-4 h-4" /> Restore
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
