"use client";

import { useState } from "react";
import { Button } from "./ui/Button";

type PublishUnfundedButtonProps = {
  studyId: string;
};

export default function PublishUnfundedButton({
  studyId,
}: PublishUnfundedButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePublish() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/auth/studies/${studyId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to publish study.");
        return;
      }

      window.location.reload();
    } catch (error) {
      console.error("Publishing error:", error);
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="primary"
        className="bg-emerald-600 hover:bg-emerald-700 text-white"
        onClick={handlePublish}
        isLoading={loading}
      >
        {loading ? "Publishing..." : "Publish as Volunteer Study"}
      </Button>

      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
