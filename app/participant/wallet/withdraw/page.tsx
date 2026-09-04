"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  balance: number;
};

export default function WithdrawalForm({
  balance,
}: Props) {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [method, setMethod] =
    useState("TELEBIRR");
  const [accountInfo, setAccountInfo] =
    useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const withdrawalAmount = Number(amount);

    if (
      !Number.isInteger(withdrawalAmount) ||
      withdrawalAmount <= 0
    ) {
      setError(
        "Enter a valid withdrawal amount."
      );
      return;
    }

    if (withdrawalAmount > balance) {
      setError(
        "You do not have enough Tinat Credits."
      );
      return;
    }

    if (!accountInfo.trim()) {
      setError(
        "Please enter your account or phone information."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/auth/withdrawals",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: withdrawalAmount,
            method,
            accountInfo:
              accountInfo.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Failed to submit withdrawal."
        );
        return;
      }

      setSuccess(
        "Withdrawal request submitted successfully."
      );

      setAmount("");
      setAccountInfo("");

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
    <form onSubmit={handleSubmit}>
      <h1>Withdraw Tinat Credits</h1>

      <p>
        Available balance:{" "}
        <strong>{balance} TC</strong>
      </p>

      <hr />

      <section>
        <label htmlFor="amount">
          Withdrawal amount
        </label>

        <br />

        <input
          id="amount"
          type="number"
          min="1"
          max={balance}
          step="1"
          value={amount}
          onChange={(event) =>
            setAmount(event.target.value)
          }
          placeholder="Enter amount"
          disabled={loading}
        />

        <span> TC</span>
      </section>

      <br />

      <section>
        <label htmlFor="method">
          Withdrawal method
        </label>

        <br />

        <select
          id="method"
          value={method}
          onChange={(event) =>
            setMethod(event.target.value)
          }
          disabled={loading}
        >
          <option value="TELEBIRR">
            Telebirr
          </option>

          <option value="BANK">
            Bank Transfer
          </option>
        </select>
      </section>

      <br />

      <section>
        <label htmlFor="accountInfo">
          {method === "TELEBIRR"
            ? "Telebirr phone number"
            : "Bank account information"}
        </label>

        <br />

        <input
          id="accountInfo"
          type="text"
          value={accountInfo}
          onChange={(event) =>
            setAccountInfo(
              event.target.value
            )
          }
          placeholder={
            method === "TELEBIRR"
              ? "09XXXXXXXX"
              : "Bank name and account number"
          }
          maxLength={100}
          disabled={loading}
        />
      </section>

      <br />

      {error && (
        <p>
          <strong>{error}</strong>
        </p>
      )}

      {success && (
        <p>
          <strong>{success}</strong>
        </p>
      )}

      <button
        type="submit"
        disabled={loading || balance <= 0}
      >
        {loading
          ? "Submitting..."
          : "Request Withdrawal"}
      </button>
    </form>
  );
}
