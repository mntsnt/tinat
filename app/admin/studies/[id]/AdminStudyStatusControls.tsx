"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../components/ui/Button";
import { useConfirm } from "@/app/components/ui/ConfirmDialog";

interface Props {
  studyId: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED";
  budgetValid: boolean;
}

export function AdminStudyStatusControls({ studyId, status, budgetValid }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { confirm, alert } = useConfirm();

  const updateStatus = async (newStatus: string) => {
    if (newStatus === "PAUSED" || newStatus === "COMPLETED") {
      const ok = await confirm({
        title: "Change Study Status",
        message: `Are you sure you want to mark this study as ${newStatus}?`,
        variant: newStatus === "COMPLETED" ? "danger" : "warning",
        confirmText: `Set to ${newStatus}`,
      });
      if (!ok) {
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
        await alert({
          title: "Update Failed",
          message: data.error || "Failed to update status",
          variant: "danger",
        });
      } else {
        router.refresh();
      }
    } catch (err) {
      await alert({
        title: "Connection Error",
        message: "An unexpected error occurred",
        variant: "danger",
      });
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
