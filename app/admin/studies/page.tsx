import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Search } from "lucide-react";

export default async function AdminStudiesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const studies = await prisma.study.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      researcher: {
        select: {
          name: true,
          email: true,
        },
      },
      _count: {
        select: { responses: true }
      }
    },
  });

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Studies</h1>
          <p className="text-muted-foreground mt-1">View and administer all research studies on the platform.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Studies</CardTitle>
          <CardDescription>A list of {studies.length} studies across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="py-3 px-4 font-medium text-muted-foreground">Title & Status</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Researcher</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground">Progress</th>
                  <th className="py-3 px-4 font-medium text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {studies.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No studies found.
                    </td>
                  </tr>
                ) : (
                  studies.map((study) => {
                    const remaining = study.budgetCredits - study.creditsPaid;
                    
                    return (
                      <tr key={study.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground line-clamp-1">{study.title}</div>
                          <Badge 
                            variant={
                              study.status === "ACTIVE" ? "success" 
                              : study.status === "COMPLETED" ? "secondary" 
                              : study.status === "PAUSED" ? "warning"
                              : "outline"
                            } 
                            className="mt-1"
                          >
                            {study.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-medium">{study.researcher.name}</div>
                          <div className="text-xs text-muted-foreground">{study.researcher.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                            <span>Participants: <strong className="text-foreground">{study._count.responses}</strong> / {study.participantTarget || '∞'}</span>
                            <span>Remaining TC: <strong className="text-foreground">{remaining}</strong></span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Link href={`/admin/studies/${study.id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
