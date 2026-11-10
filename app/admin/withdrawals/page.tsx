import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export default async function AdminWithdrawalsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!admin || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Withdrawals functionality has been removed from platform administration per policy.
  redirect("/admin");
}
