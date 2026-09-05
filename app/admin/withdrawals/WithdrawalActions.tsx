"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../components/ui/Button";

type Props = {
  withdrawalId: string;
};

export default function WithdrawalActions({
  withdrawalId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] = useState<"APPROVE" | "REJECT" | null>(null);
  const [error, setError] = useState("");

  async function processWithdrawal(action: "APPROVE" | "REJECT") {
    const message =
      action === "APPROVE"
        ? "Are you sure you want to approve this withdrawal? Make sure you have transferred the funds to the user."
        : "Are you sure you want to reject this withdrawal? The participant will receive their credits back.";

    if (!window.confirm(message)) {
      return;
    }

    setLoading(action);
    setError("");

    try {
      const response = await fetch(`/api/auth/admin/withdrawals/${withdrawalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to process withdrawal.");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 w-full mt-4">
      {error && (
        <div className="rounded-md bg-red-50 p-2 mb-2 border border-red-100">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}
      <div className="flex gap-2 w-full">
        <Button
          type="button"
          className="flex-1"
          variant="success"
          isLoading={loading === "APPROVE"}
          disabled={loading !== null}
          onClick={() => processWithdrawal("APPROVE")}
        >
          Approve Payout
        </Button>
        <Button
          type="button"
          className="flex-1"
          variant="outline"
          isLoading={loading === "REJECT"}
          disabled={loading !== null}
          onClick={() => processWithdrawal("REJECT")}
        >
          Reject & Refund
        </Button>
      </div>
    </div>
  );
}