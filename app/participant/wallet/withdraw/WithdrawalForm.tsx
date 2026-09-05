"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

type Props = {
  balance: number;
};

export default function WithdrawalForm({ balance }: Props) {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("TELEBIRR");
  const [accountInfo, setAccountInfo] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const withdrawalAmount = Number(amount);

    if (!Number.isInteger(withdrawalAmount) || withdrawalAmount <= 0) {
      setError("Enter a valid withdrawal amount.");
      return;
    }

    if (withdrawalAmount > balance) {
      setError("You do not have enough Tinat Credits.");
      return;
    }

    if (!accountInfo.trim()) {
      setError("Please enter your account or phone information.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawalAmount,
          method,
          accountInfo: accountInfo.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to submit withdrawal.");
        return;
      }

      setSuccess("Withdrawal request submitted successfully.");
      setAmount("");
      setAccountInfo("");
      router.refresh();
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
          <p className="text-sm font-medium text-success">{success}</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="amount" className="block text-sm font-medium text-foreground">
          Withdrawal amount (TC)
        </label>
        <div className="relative">
          <input
            id="amount"
            type="number"
            min="1"
            max={balance}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <span className="text-muted-foreground sm:text-sm">TC</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground pt-1">Available balance: {balance} TC</p>
      </div>

      <div className="space-y-1">
        <label htmlFor="method" className="block text-sm font-medium text-foreground">
          Withdrawal method
        </label>
        <select
          id="method"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          disabled={loading}
          className="flex h-10 w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="TELEBIRR">Telebirr</option>
          <option value="BANK">Bank Transfer</option>
        </select>
      </div>

      <div className="space-y-1">
        <Input
          id="accountInfo"
          label={method === "TELEBIRR" ? "Telebirr phone number" : "Bank account information"}
          type="text"
          value={accountInfo}
          onChange={(e) => setAccountInfo(e.target.value)}
          placeholder={method === "TELEBIRR" ? "09XXXXXXXX" : "Bank name and account number"}
          maxLength={100}
          disabled={loading}
        />
      </div>

      <Button type="submit" className="w-full" isLoading={loading} disabled={balance <= 0}>
        Request Withdrawal
      </Button>
    </form>
  );
}
