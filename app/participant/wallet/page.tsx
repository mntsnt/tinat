import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export default async function ParticipantWalletPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    include: {
      wallet: {
        include: {
          transactions: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "PARTICIPANT") {
    redirect("/dashboard");
  }

  const balance = user.wallet?.balance ?? 0;

  const transactions =
    user.wallet?.transactions ?? [];

  const totalEarned = transactions
    .filter(
      (transaction) =>
        transaction.type === "EARN"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const totalSpent = transactions
    .filter(
      (transaction) =>
        transaction.type === "SPEND"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  const totalWithdrawn = transactions
    .filter(
      (transaction) =>
        transaction.type === "WITHDRAW"
    )
    .reduce(
      (total, transaction) =>
        total + transaction.amount,
      0
    );

  function formatTransactionType(
    type: string
  ) {
    switch (type) {
      case "EARN":
        return "Earned";

      case "SPEND":
        return "Spent";

      case "WITHDRAW":
        return "Withdrawal";

      case "REFUND":
        return "Refund";

      case "ADJUSTMENT":
        return "Adjustment";

      default:
        return type;
    }
  }

  function formatDate(date: Date) {
    return date.toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  }

  return (
    <main>
      <h1>Your Wallet</h1>

      <Link href="/participant">
        ← Back to Dashboard
      </Link>

      <hr />

      {/* --------------------------------------- */}
      {/* CURRENT BALANCE */}
      {/* --------------------------------------- */}

      <section>
        <h2>Current Balance</h2>

        <strong>
          {balance} TC
        </strong>

<Link href="/participant/wallet/withdraw">
  Withdraw Credits
</Link>

        <p>
          Tinat Credits
        </p>
      </section>

      <hr />

      {/* --------------------------------------- */}
      {/* WALLET SUMMARY */}
      {/* --------------------------------------- */}

      <section>
        <h2>Credit Summary</h2>

        <p>
          Total earned:{" "}
          <strong>
            {totalEarned} TC
          </strong>
        </p>

        <p>
          Total spent:{" "}
          <strong>
            {totalSpent} TC
          </strong>
        </p>

        <p>
          Total withdrawn:{" "}
          <strong>
            {totalWithdrawn} TC
          </strong>
        </p>
      </section>

      <hr />

      {/* --------------------------------------- */}
      {/* TRANSACTION HISTORY */}
      {/* --------------------------------------- */}

      <section>
        <h2>Transaction History</h2>

        {transactions.length === 0 ? (
          <p>
            You don&apos;t have any transactions yet.
          </p>
        ) : (
          <div>
            {transactions.map(
              (transaction) => {
                const isPositive =
                  transaction.type ===
                    "EARN" ||
                  transaction.type ===
                    "REFUND" ||
                  transaction.type ===
                    "ADJUSTMENT";

                return (
                  <article
                    key={transaction.id}
                  >
                    <h3>
                      {formatTransactionType(
                        transaction.type
                      )}
                    </h3>

                    <p>
                      <strong>
                        {isPositive
                          ? "+"
                          : "-"}
                        {transaction.amount} TC
                      </strong>
                    </p>

                    {transaction.reason && (
                      <p>
                        {transaction.reason}
                      </p>
                    )}

                    <p>
                      {formatDate(
                        transaction.createdAt
                      )}
                    </p>

                    <hr />
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      <br />

      <Link href="/participant">
        ← Back to Participant Dashboard
      </Link>
    </main>
  );
}
