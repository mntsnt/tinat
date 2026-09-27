import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";

export default async function AILayout({ children }: { children: ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  if (!user || user.role !== "RESEARCHER") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
