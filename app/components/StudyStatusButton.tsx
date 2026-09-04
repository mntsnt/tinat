"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  studyId: string;
  currentStatus: string;
};

export default function StudyStatusButton({
  studyId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function changeStatus(status: "ACTIVE" | "PAUSED" | "COMPLETED") {
    const message =
      status === "COMPLETED"
        ? "Are you sure you want to complete this study? Participants will no longer be able to submit responses."
        : status === "PAUSED"
          ? "Pause this study? Participants will no longer be able to submit responses."
          : "Resume this study?";

    if (!window.confirm(message)) {
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
        alert(data.error || "Failed to update study.");
        return;
      }

      router.refresh();
    } catch {
      alert("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === "COMPLETED") {
    return <p><strong>Study completed</strong></p>;
  }

  return (
    <div>
      {currentStatus === "ACTIVE" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => changeStatus("PAUSED")}
        >
          {loading ? "Updating..." : "Pause Study"}
        </button>
      )}

      {currentStatus === "PAUSED" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => changeStatus("ACTIVE")}
        >
          {loading ? "Updating..." : "Resume Study"}
        </button>
      )}

      {(currentStatus === "ACTIVE" || currentStatus === "PAUSED") && (
        <button
          type="button"
          disabled={loading}
          onClick={() => changeStatus("COMPLETED")}
        >
          {loading ? "Updating..." : "Complete Study"}
        </button>
      )}
    </div>
  );
}
