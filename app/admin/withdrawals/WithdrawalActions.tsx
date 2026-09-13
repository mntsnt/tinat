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

  const [loading, setLoading] = useState<"APPROVE" | "APPROVE_MANUAL" | "REJECT" | null>(null);
  const [error, setError] = useState("");
  const [showManualOption, setShowManualOption] = useState(false);

  async function processWithdrawal(action: "APPROVE" | "APPROVE_MANUAL" | "REJECT") {
    let message = "";
    if (action === "APPROVE") {
      message = "Are you sure you want to approve this withdrawal? Chapa will initiate the transfer to the user's account.";
    } else if (action === "APPROVE_MANUAL") {
      message = "Are you sure you want to mark this withdrawal as manually disbursed? The request will be marked Approved without calling Chapa.";
    } else {
      message = "Are you sure you want to reject this withdrawal? The participant will receive their credits back.";
    }

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
        const errMessage = data.error || "Failed to process withdrawal.";
        setError(typeof errMessage === "string" ? errMessage : JSON.stringify(errMessage));
        if (data.requiresManualOption || action === "APPROVE") {
          setShowManualOption(true);
        }
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
        <div className="rounded-md bg-red-50 dark:bg-red-950/40 p-2.5 mb-2 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300">
          <p className="font-semibold mb-1">Notice</p>
          <p>{error}</p>
        </div>
      )}

      <div className="flex gap-2 w-full">
        <Button
          type="button"
          className="flex-1 text-xs"
          variant="success"
          isLoading={loading === "APPROVE"}
          disabled={loading !== null}
          onClick={() => processWithdrawal("APPROVE")}
        >
          Approve via Chapa
        </Button>
        <Button
          type="button"
          className="flex-1 text-xs"
          variant="outline"
          isLoading={loading === "REJECT"}
          disabled={loading !== null}
          onClick={() => processWithdrawal("REJECT")}
        >
          Reject & Refund
        </Button>
      </div>

      {showManualOption && (
        <div className="pt-2 border-t border-border mt-1">
          <Button
            type="button"
            className="w-full text-xs"
            variant="secondary"
            isLoading={loading === "APPROVE_MANUAL"}
            disabled={loading !== null}
            onClick={() => processWithdrawal("APPROVE_MANUAL")}
          >
            Mark as Manually Paid (Telebirr/Bank Direct)
          </Button>
        </div>
      )}
    </div>
  );
}
