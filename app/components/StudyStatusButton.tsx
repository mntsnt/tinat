"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/Button";
import { useConfirm } from "./ui/ConfirmDialog";

type Props = {
  studyId: string;
  currentStatus: string;
};

export default function StudyStatusButton({
  studyId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const { confirm, alert } = useConfirm();
  const [loading, setLoading] = useState(false);

  async function changeStatus(status: "ACTIVE" | "PAUSED" | "COMPLETED") {
    const message =
      status === "COMPLETED"
        ? "Are you sure you want to complete this study? Participants will no longer be able to submit responses."
        : status === "PAUSED"
          ? "Pause this study? Participants will no longer be able to submit responses."
          : "Resume this study?";

    const ok = await confirm({
      title: "Update Study Status",
      message,
      variant: status === "COMPLETED" ? "danger" : "warning",
      confirmText: status === "COMPLETED" ? "Complete Study" : status === "PAUSED" ? "Pause Study" : "Resume Study",
    });
    if (!ok) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/auth/studies/${studyId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        await alert({
          title: "Update Failed",
          message: data.error || "Failed to update study.",
          variant: "danger",
        });
        return;
      }

      router.refresh();
    } catch {
      await alert({
        title: "Connection Error",
        message: "Unable to connect to the server.",
        variant: "danger",
      });
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === "COMPLETED") {
    return <p className="text-sm font-medium text-muted-foreground">Study completed</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === "ACTIVE" && (
        <Button
          variant="outline"
          size="sm"
          isLoading={loading}
          onClick={() => changeStatus("PAUSED")}
        >
          Pause
        </Button>
      )}

      {currentStatus === "PAUSED" && (
        <Button
          variant="outline"
          size="sm"
          isLoading={loading}
          onClick={() => changeStatus("ACTIVE")}
        >
          Resume
        </Button>
      )}

      {(currentStatus === "ACTIVE" || currentStatus === "PAUSED") && (
        <Button
          variant="outline"
          size="sm"
          isLoading={loading}
          onClick={() => changeStatus("COMPLETED")}
        >
          Complete
        </Button>
      )}
    </div>
  );
}
