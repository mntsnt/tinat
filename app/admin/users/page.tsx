import { redirect } from "next/navigation";
import Link from "next/link";

import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export default async function AdminUsersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
    select: {
      role: true,
    },
  });

  if (!admin || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      institution: true,
      fieldOfStudy: true,
      yearOfStudy: true,
      createdAt: true,

      wallet: {
        select: {
          balance: true,
        },
      },

      _count: {
        select: {
          studies: true,
          responses: true,
          withdrawals: true,
        },
      },
    },
  });

  return (
    <main>
      <h1>Manage Users</h1>

      <p>
        Total users: <strong>{users.length}</strong>
      </p>

      <hr />

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div>
          {users.map((user) => (
            <article key={user.id}>
              <h2>{user.name}</h2>

              <p>
                <strong>Email:</strong> {user.email}
              </p>

              <p>
                <strong>Role:</strong> {user.role}
              </p>

              {user.institution && (
                <p>
                  <strong>Institution:</strong>{" "}
                  {user.institution}
                </p>
              )}

              {user.fieldOfStudy && (
                <p>
                  <strong>Field:</strong>{" "}
                  {user.fieldOfStudy}
                </p>
              )}

              {user.yearOfStudy && (
                <p>
                  <strong>Year:</strong>{" "}
                  {user.yearOfStudy}
                </p>
              )}

              <p>
                <strong>Joined:</strong>{" "}
                {user.createdAt.toLocaleDateString()}
              </p>

              {user.role === "PARTICIPANT" && (
                <>
                  <p>
                    <strong>Tinat Credits:</strong>{" "}
                    {user.wallet?.balance ?? 0} TC
                  </p>

                  <p>
                    <strong>Studies completed:</strong>{" "}
                    {user._count.responses}
                  </p>

                  <p>
                    <strong>Withdrawals:</strong>{" "}
                    {user._count.withdrawals}
                  </p>
                </>
              )}

              {user.role === "RESEARCHER" && (
                <p>
                  <strong>Studies created:</strong>{" "}
                  {user._count.studies}
                </p>
              )}

              <hr />
            </article>
          ))}
        </div>
      )}

      <Link href="/admin">
        ← Back to Admin Dashboard
      </Link>
    </main>
  );
}