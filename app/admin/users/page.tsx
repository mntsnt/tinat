import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { getButtonClasses } from "../../components/ui/Button";
import { AdminUsersClient } from "./AdminUsersClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management | Tinat Admin",
  description: "Search, filter, and manage registered participants, researchers, and administrators.",
};

export default async function AdminUsersPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!admin || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      institution: true,
      fieldOfStudy: true,
      yearOfStudy: true,
      createdAt: true,
      faydaVerified: true,
      faydaVerifiedAt: true,
      wallet: { select: { balance: true } },
      _count: {
        select: {
          studies: true,
          participantLinks: true,
        },
      },
    },
  });

  return (
    <div className="w-full px-4 py-6 md:px-7 md:py-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link href="/admin" className={getButtonClasses("ghost", "sm", "-ml-3 mb-2")}>
            &larr; Back to Admin Dashboard
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              User Management
            </h1>
            <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              {users.length} Registered
            </span>
          </div>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Search, filter, and inspect registered health researchers, study participants, and data collectors.
          </p>
        </div>
      </div>

      <AdminUsersClient initialUsers={users} />
    </div>
  );
}
