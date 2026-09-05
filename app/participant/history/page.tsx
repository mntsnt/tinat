import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { RatingForm } from "./RatingForm";
import Link from "next/link";
import { Button } from "../../components/ui/Button";

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      responses: {
        include: {
          study: {
            include: {
              researcher: { select: { name: true } },
              ratings: { where: { userId: session.userId } },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      },
    },
  });

  if (!user || user.role !== "PARTICIPANT") redirect("/dashboard");

  const totalEarned = user.responses.reduce((sum, r) => sum + r.study.rewardCredits, 0);

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Research History</h1>
          <p className="text-muted-foreground mt-1">Review the studies you've participated in and the credits you've earned.</p>
        </div>
        <div className="bg-primary/10 text-primary px-4 py-2 rounded-lg font-medium">
          Total Earned: {totalEarned} TC
        </div>
      </div>

      {user.responses.length === 0 ? (
        <Card className="bg-muted/50 border-dashed text-center py-16">
          <CardContent>
            <h3 className="mb-2 text-xl font-semibold text-foreground">No history yet</h3>
            <p className="text-muted-foreground mb-4 max-w-sm mx-auto">You haven't participated in any studies yet. Discover new studies to start earning Tinat Credits.</p>
            <Link href="/participant/studies">
              <Button>Browse Studies</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {user.responses.map((response) => {
            const study = response.study;
            const rating = study.ratings[0];

            return (
              <Card key={response.id} className="flex flex-col">
                <CardHeader>
                  <div className="mb-2 flex justify-between items-start">
                    <Badge variant="outline" className="text-muted-foreground">
                      Completed on {response.submittedAt.toLocaleDateString()}
                    </Badge>
                    <Badge variant="success">+{study.rewardCredits} TC</Badge>
                  </div>
                  <CardTitle className="line-clamp-2">{study.title}</CardTitle>
                  <CardDescription>By {study.researcher.name}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end">
                  <RatingForm 
                    studyId={study.id} 
                    initialRating={rating?.rating} 
                    initialFeedback={rating?.feedback || ""} 
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
