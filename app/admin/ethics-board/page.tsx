import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Building, Award, Users, BookOpen } from "lucide-react";
import { AdminEthicsBoardClient } from "./AdminEthicsBoardClient";

export default async function AdminEthicsBoardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });
  if (!user || user.role !== "ADMIN") redirect("/dashboard");

  const members = await prisma.ethicsBoardMember.findMany({
    orderBy: { appointedAt: "asc" },
  });

  const decisions = await prisma.ethicsBoardDecision.findMany({
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="w-full px-4 py-6 md:px-7 md:py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
            <Building className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Institutional Oversight
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Ethics Advisory Board Governance
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage appointed external research ethics board members and publish official board resolutions.
        </p>
      </div>

      <AdminEthicsBoardClient
        initialMembers={members as any}
        initialDecisions={decisions as any}
      />
    </div>
  );
}
