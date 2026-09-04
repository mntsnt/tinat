"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  withdrawalId: string;
};

export default function WithdrawalActions({
  withdrawalId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function processWithdrawal(
    action: "APPROVE" | "REJECT"
  ) {
    const message =
      action === "APPROVE"
        ? "Are you sure you want to approve this withdrawal?"
        : "Are you sure you want to reject this withdrawal? The participant will receive their credits back.";

    if (!window.confirm(message)) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/auth/admin/withdrawals/${withdrawalId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Failed to process withdrawal."
        );
        return;
      }

      router.refresh();
    } catch {
      setError(
        "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p>
          <strong>{error}</strong>
        </p>
      )}

      <button
        type="button"
        disabled={loading}
        onClick={() =>
          processWithdrawal("APPROVE")
        }
      >
        {loading
          ? "Processing..."
          : "Approve"}
      </button>

      {" "}

      <button
        type="button"
        disabled={loading}
        onClick={() =>
          processWithdrawal("REJECT")
        }
      >
        Reject
      </button>
    </div>
  );
}