import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { Card, CardContent } from "../../components/ui/Card";
import { getButtonClasses } from "../../components/ui/Button";

export default async function AdminLogsPage() {
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

  const logs = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100, // Limit to recent 100 logs
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link href="/admin" className={getButtonClasses("ghost", "md", "-ml-4 mb-4")}>
            &larr; Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Activity Logs</h1>
          <p className="text-muted-foreground mt-1">Monitor recent platform activity across all users.</p>
        </div>
        <div className="bg-muted/50 border border-border rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Showing</span>
          <span className="text-xl font-bold text-foreground">Last {logs.length}</span>
        </div>
      </div>

      {logs.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="mb-2 text-xl font-semibold text-foreground">No logs found</h3>
            <p className="text-muted-foreground">There is no recent activity on the platform.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th scope="col" className="px-6 py-4">Time</th>
                  <th scope="col" className="px-6 py-4">User</th>
                  <th scope="col" className="px-6 py-4">Role</th>
                  <th scope="col" className="px-6 py-4">Action</th>
                  <th scope="col" className="px-6 py-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/50/50 transition-colors">
                    <td className="px-6 py-4 align-top text-muted-foreground whitespace-nowrap text-xs">
                      {log.createdAt.toLocaleString("en-US", { 
                        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
                      })}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-foreground">{log.user?.name || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">{log.user?.email || ""}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-muted">
                        {log.user?.role || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <span className="font-medium text-foreground capitalize">
                        {log.action.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top text-muted-foreground">
                      {log.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
