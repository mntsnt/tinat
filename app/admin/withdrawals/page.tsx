import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import WithdrawalActions from "./WithdrawalActions";

export default async function AdminWithdrawalsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  if (!admin || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const withdrawals =
    await prisma.withdrawal.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            institution: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  return (
    <main>
      <Link href="/admin">
        ← Admin Dashboard
      </Link>

      <h1>Withdrawal Requests</h1>

      <p>
        Pending requests:{" "}
        <strong>{withdrawals.length}</strong>
      </p>

      <hr />

      {withdrawals.length === 0 ? (
        <p>
          There are no pending withdrawal requests.
        </p>
      ) : (
        <div>
          {withdrawals.map((withdrawal) => (
            <article key={withdrawal.id}>
              <h2>
                {withdrawal.user.name}
              </h2>

              <p>
                Amount:{" "}
                <strong>
                  {withdrawal.amount} TC
                </strong>
              </p>

              <p>
                Method:{" "}
                <strong>
                  {withdrawal.method}
                </strong>
              </p>

              <p>
                Account:{" "}
                <strong>
                  {withdrawal.accountInfo}
                </strong>
              </p>

              <p>
                Email:{" "}
                {withdrawal.user.email}
              </p>

              {withdrawal.user.phone && (
                <p>
                  Phone:{" "}
                  {withdrawal.user.phone}
                </p>
              )}

              {withdrawal.user.institution && (
                <p>
                  Institution:{" "}
                  {withdrawal.user.institution}
                </p>
              )}

              <p>
                Requested:{" "}
                {withdrawal.createdAt.toLocaleString()}
              </p>

              <WithdrawalActions
                withdrawalId={withdrawal.id}
              />

              <hr />
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
