"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/Button";

interface Props {
  studyId: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
  budgetValid: boolean;
}

export function AdminStudyStatusControls({ studyId, status, budgetValid }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const updateStatus = async (newStatus: string) => {
    if (newStatus === "PAUSED" || newStatus === "COMPLETED") {
      if (!window.confirm(`Are you sure you want to mark this study as ${newStatus}?`)) {
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/auth/admin/studies/${studyId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update status");
      } else {
        router.refresh();
      }
    } catch (err) {
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (status === "COMPLETED") {
    return (
      <Button variant="secondary" disabled>
        Completed
      </Button>
    );
  }

  if (status === "DRAFT") {
    return (
      <div className="flex gap-2">
        <Button 
          variant="success" 
          onClick={() => updateStatus("ACTIVE")} 
          isLoading={loading}
          disabled={!budgetValid}
          title={!budgetValid ? "Cannot activate: Missing budget, rewards, or questions." : ""}
        >
          Activate Study
        </Button>
        <Button variant="outline" onClick={() => updateStatus("COMPLETED")} isLoading={loading}>
          Mark as Completed
        </Button>
      </div>
    );
  }

  if (status === "ACTIVE") {
    return (
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => updateStatus("PAUSED")} isLoading={loading}>
          Pause Study
        </Button>
        <Button variant="outline" onClick={() => updateStatus("COMPLETED")} isLoading={loading}>
          Complete Study
        </Button>
      </div>
    );
  }

  if (status === "PAUSED") {
    return (
      <div className="flex gap-2">
        <Button variant="success" onClick={() => updateStatus("ACTIVE")} isLoading={loading}>
          Resume Study
        </Button>
        <Button variant="outline" onClick={() => updateStatus("COMPLETED")} isLoading={loading}>
          Complete Study
        </Button>
      </div>
    );
  }

  return null;
}
