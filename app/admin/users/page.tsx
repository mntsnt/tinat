import { redirect } from "next/navigation";
import Link from "next/link";

import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { getButtonClasses } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";

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
      wallet: { select: { balance: true } },
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
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link href="/admin" className={getButtonClasses("ghost", "md", "-ml-4 mb-4")}>
            &larr; Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Users</h1>
          <p className="text-muted-foreground mt-1">View and manage all registered users on the platform.</p>
        </div>
        <div className="bg-muted/50 border border-border rounded-lg px-4 py-2 flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Total Users</span>
          <span className="text-xl font-bold text-foreground">{users.length}</span>
        </div>
      </div>

      {users.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="mb-2 text-xl font-semibold text-foreground">No users found</h3>
            <p className="text-muted-foreground">There are no users registered on the platform.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground font-semibold border-b border-border">
                <tr>
                  <th scope="col" className="px-6 py-4">User</th>
                  <th scope="col" className="px-6 py-4">Role</th>
                  <th scope="col" className="px-6 py-4">Details</th>
                  <th scope="col" className="px-6 py-4">Activity</th>
                  <th scope="col" className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50/50 transition-colors">
                    <td className="px-6 py-4 align-top">
                      <div className="font-medium text-foreground">{user.name}</div>
                      <div className="text-muted-foreground">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      <Badge variant={user.role === "ADMIN" ? "warning" : user.role === "RESEARCHER" ? "success" : "secondary"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {user.institution ? (
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <svg className="w-3 h-3 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                            {user.institution}
                          </div>
                          {user.fieldOfStudy && <div className="text-xs text-muted-foreground ml-4.5">{user.fieldOfStudy}</div>}
                          {user.yearOfStudy && <div className="text-xs text-muted-foreground ml-4.5">Year {user.yearOfStudy}</div>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">No details provided</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      {user.role === "PARTICIPANT" && (
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between w-32">
                            <span className="text-muted-foreground">Balance:</span>
                            <span className="font-medium text-foreground">{user.wallet?.balance ?? 0} TC</span>
                          </div>
                          <div className="flex justify-between w-32">
                            <span className="text-muted-foreground">Completed:</span>
                            <span className="font-medium text-foreground">{user._count.responses}</span>
                          </div>
                          <div className="flex justify-between w-32">
                            <span className="text-muted-foreground">Withdrawals:</span>
                            <span className="font-medium text-foreground">{user._count.withdrawals}</span>
                          </div>
                        </div>
                      )}
                      
                      {user.role === "RESEARCHER" && (
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between w-32">
                            <span className="text-muted-foreground">Studies:</span>
                            <span className="font-medium text-foreground">{user._count.studies} created</span>
                          </div>
                        </div>
                      )}
                      
                      {user.role === "ADMIN" && (
                        <span className="text-muted-foreground italic text-xs">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top text-muted-foreground whitespace-nowrap">
                      {user.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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