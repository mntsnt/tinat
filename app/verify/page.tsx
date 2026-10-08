"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, ShieldAlert, ShieldQuestion, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

type VerificationType = "RESEARCHER" | "DATA_COLLECTOR";
type VerificationStatus = "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

interface Verification {
  id: string;
  verificationType: VerificationType;
  status: VerificationStatus;
  submittedAt: string;
  rejectionReason?: string;
  verificationReference?: string;
}

export default function VerifyPage() {
  const router = useRouter();
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<VerificationType>("RESEARCHER");
  
  const [fanNumber, setFanNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchVerifications();
  }, []);

  async function fetchVerifications() {
    try {
      const res = await fetch("/api/verification");
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

  const currentVerification = verifications.find(v => v.verificationType === activeTab);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verificationType: activeTab,
          verificationReference: fanNumber,
        })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess("Verification request submitted successfully.");
        setFanNumber("");
        fetchVerifications(); // Refresh state
      } else {
        setError(data.error || "Failed to submit request.");
      }
    } catch (err) {
      setError("A network error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen bg-muted/50"><p>Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-muted/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-foreground">Identity Verification</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-xl mx-auto">
            To protect participants and maintain research integrity, Tinat requires identity verification for core roles. 
            Your information is securely encrypted and never visible to participants or in public analytics.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border justify-center space-x-8">
          <button
            onClick={() => { setActiveTab("RESEARCHER"); setError(""); setSuccess(""); }}
            className={`pb-4 px-2 font-medium text-sm transition-colors ${
              activeTab === "RESEARCHER" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-muted-foreground"
            }`}
          >
            Become a Researcher
          </button>
          <button
            onClick={() => { setActiveTab("DATA_COLLECTOR"); setError(""); setSuccess(""); }}
            className={`pb-4 px-2 font-medium text-sm transition-colors ${
              activeTab === "DATA_COLLECTOR" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-muted-foreground"
            }`}
          >
            Become a Data Collector
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
          
          <div className="mb-6">
            <h3 className="text-xl font-bold text-foreground mb-2">
              {activeTab === "RESEARCHER" ? "Researcher Verification" : "Data Collector Verification"}
            </h3>
            <p className="text-muted-foreground text-sm">
              {activeTab === "RESEARCHER" 
                ? "Verified researchers can create studies, publish research, and recruit participants. You must verify your identity before publishing."
                : "Verified data collectors help researchers reach participants who may have limited access to smartphones or the internet."}
            </p>
          </div>

          {currentVerification && (currentVerification.status === "PENDING" || currentVerification.status === "VERIFIED" || currentVerification.status === "SUSPENDED") ? (
            <div className={`p-5 rounded-lg border ${
              currentVerification.status === "VERIFIED" ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800" :
              currentVerification.status === "PENDING" ? "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/30 dark:border-cyan-800" :
              "bg-rose-50 border-rose-200 dark:bg-rose-950/30 dark:border-rose-800"
            }`}>
              <div className="flex items-start gap-4">
                {currentVerification.status === "VERIFIED" && <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />}
                {currentVerification.status === "PENDING" && <ShieldQuestion className="w-8 h-8 text-primary shrink-0" />}
                {currentVerification.status === "SUSPENDED" && <ShieldAlert className="w-8 h-8 text-rose-600 shrink-0" />}
                
                <div>
                  <h4 className={`font-semibold ${
                    currentVerification.status === "VERIFIED" ? "text-emerald-900" :
                    currentVerification.status === "PENDING" ? "text-cyan-900 dark:text-cyan-200" : "text-rose-900 dark:text-rose-200"
                  }`}>
                    Status: {currentVerification.status}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    currentVerification.status === "VERIFIED" ? "text-emerald-700" :
                    currentVerification.status === "PENDING" ? "text-cyan-800 dark:text-cyan-300" : "text-rose-800 dark:text-rose-300"
                  }`}>
                    {currentVerification.status === "VERIFIED" && "Your identity has been successfully verified. You can now access full platform features."}
                    {currentVerification.status === "PENDING" && "Your verification request has been submitted and is currently under review by an administrator."}
                    {currentVerification.status === "SUSPENDED" && "Your verification status has been suspended. Please contact support."}
                  </p>
                  
                  {currentVerification.status === "VERIFIED" && activeTab === "RESEARCHER" && (
                    <button onClick={() => router.push("/researcher")} className="mt-4 flex items-center gap-2 bg-emerald-700 px-4 py-2 text-sm text-white transition hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500">
                      Go to Dashboard <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
              
              {currentVerification?.status === "REJECTED" && (
                <div className="rounded-md border border-rose-200 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/30">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-rose-800 dark:text-rose-200">
                    <ShieldAlert className="w-4 h-4" /> Verification Rejected
                  </h4>
                  <p className="mt-1 text-sm text-rose-800 dark:text-rose-300">Reason: {currentVerification.rejectionReason || "Please verify your information and try again."}</p>
                </div>
              )}

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  National ID (FAN Number)
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder="Enter your exact National ID number"
                    className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={fanNumber}
                    onChange={(e) => setFanNumber(e.target.value)}
                  />
                  <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Securely encrypted and never visible to other users.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${isSubmitting ? "opacity-75 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? "Submitting securely..." : "Submit for Verification"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}


