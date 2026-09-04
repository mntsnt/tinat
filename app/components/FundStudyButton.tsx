"use client";

import { useState } from "react";

type FundStudyButtonProps = {
  studyId: string;
  amount: number;
};

export default function FundStudyButton({
  studyId,
  amount,
}: FundStudyButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFundStudy() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/auth/studies/${studyId}/fund`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers.get("content-type") || "";

      let data: { error?: string; checkoutUrl?: string } | null = null;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Funding endpoint returned non-JSON response:", text);
      }

      if (!response.ok) {
        const message =
          typeof data?.error === "string"
            ? data.error
            : `Payment server returned ${response.status}. Check that the funding route is running.`;

        setError(message);
        return;
      }

      if (!data?.checkoutUrl) {
        setError("Chapa did not return a checkout URL.");
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Funding error:", error);
      setError("Unable to connect to the payment server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleFundStudy}
        disabled={loading}
        className="rounded bg-amber-600 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Connecting to Chapa..." : `Fund Study — ${amount} ETB`}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
