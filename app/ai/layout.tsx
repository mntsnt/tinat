import type { Metadata } from "next";
import { ReactNode } from "react";
import { getSession } from "../../lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "../../lib/prisma";

export const metadata: Metadata = {
  title: "Research AI Tools | Tinat",
  description: "Use research-focused AI tools within your Tinat workspace.",
};

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
