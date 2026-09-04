import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import LogoutButton from "../components/LogoutButton";

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.userId,
    },
  });

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // --------------------------------------------------
  // PLATFORM STATISTICS
  // --------------------------------------------------

  const [
    totalUsers,
    totalParticipants,
    totalResearchers,
    totalStudies,
    draftStudies,
    activeStudies,
    completedStudies,
    totalResponses,
    pendingWithdrawals,
    totalWithdrawals,
    walletTotals,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.user.count({
      where: {
        role: "PARTICIPANT",
      },
    }),

    prisma.user.count({
      where: {
        role: "RESEARCHER",
      },
    }),

    prisma.study.count(),

    prisma.study.count({
      where: {
        status: "DRAFT",
      },
    }),

    prisma.study.count({
      where: {
        status: "ACTIVE",
      },
    }),

    prisma.study.count({
      where: {
        status: "COMPLETED",
      },
    }),

    prisma.response.count(),

    prisma.withdrawal.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.withdrawal.count(),

    prisma.wallet.aggregate({
      _sum: {
        balance: true,
      },
    }),
  ]);

  const totalCredits =
    walletTotals._sum.balance ?? 0;

  return (
    <main>
      <h1>Tinat Admin Dashboard</h1>

      <p>
        Welcome, <strong>{user.name}</strong>
      </p>

      <hr />

      {/* -------------------------------------------- */}
      {/* USERS */}
      {/* -------------------------------------------- */}

      <section>
        <h2>Users</h2>

        <p>
          Total users:{" "}
          <strong>{totalUsers}</strong>
        </p>

        <p>
          Participants:{" "}
          <strong>{totalParticipants}</strong>
        </p>

        <p>
          Researchers:{" "}
          <strong>{totalResearchers}</strong>
        </p>
      </section>

      <hr />

      {/* -------------------------------------------- */}
      {/* RESEARCH */}
      {/* -------------------------------------------- */}

      <section>
        <h2>Research</h2>

        <p>
          Total studies:{" "}
          <strong>{totalStudies}</strong>
        </p>

        <p>
          Draft studies:{" "}
          <strong>{draftStudies}</strong>
        </p>

        <p>
          Active studies:{" "}
          <strong>{activeStudies}</strong>
        </p>

        <p>
          Completed studies:{" "}
          <strong>{completedStudies}</strong>
        </p>

        <p>
          Total responses:{" "}
          <strong>{totalResponses}</strong>
        </p>
      </section>

      <hr />

      {/* -------------------------------------------- */}
      {/* TINAT CREDITS */}
      {/* -------------------------------------------- */}

      <section>
        <h2>Tinat Credits</h2>

        <p>
          Credits currently held by participants:{" "}
          <strong>{totalCredits} TC</strong>
        </p>
      </section>

      <hr />

      {/* -------------------------------------------- */}
      {/* WITHDRAWALS */}
      {/* -------------------------------------------- */}

      <section>
        <h2>Withdrawals</h2>

        <p>
          Pending requests:{" "}
          <strong>{pendingWithdrawals}</strong>
        </p>

        <p>
          Total withdrawal requests:{" "}
          <strong>{totalWithdrawals}</strong>
        </p>

        <Link href="/admin/withdrawals">
          → Manage Withdrawal Requests
        </Link>
      </section>

      <hr />

      {/* -------------------------------------------- */}
      {/* QUICK ACTIONS */}
      {/* -------------------------------------------- */}

      <section>
        <h2>Quick Actions</h2>

        <p>
          <Link href="/admin/withdrawals">
            Withdrawal Management
          </Link>
        </p>
      </section>

      <hr />

      <LogoutButton />
    </main>
  );
}