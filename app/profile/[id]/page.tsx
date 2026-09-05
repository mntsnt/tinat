import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { UserCircle } from "lucide-react";

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      studies: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      }
    }
  });

  if (!user) notFound();

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 max-w-4xl">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
        <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center shrink-0 border-4 border-background shadow-lg">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="h-full w-full rounded-full object-cover" />
          ) : (
            <UserCircle className="h-20 w-20 text-muted-foreground" />
          )}
        </div>
        <div className="text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
            <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
            {user.role === "RESEARCHER" && user.isVerified && (
              <Badge variant="success" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Verified Researcher</Badge>
            )}
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            {user.institution || "Independent Researcher"} 
            {user.fieldOfStudy && ` • ${user.fieldOfStudy}`}
          </p>
          <p className="max-w-2xl text-foreground leading-relaxed">
            {user.bio || "This user hasn't added a bio yet."}
          </p>
        </div>
      </div>

      {user.role === "RESEARCHER" && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Active Studies</h2>
          {user.studies.length === 0 ? (
            <p className="text-muted-foreground">No active studies at the moment.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {user.studies.map(study => (
                <Card key={study.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{study.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{study.description}</p>
                    <Badge variant="outline" className="text-success">{study.rewardCredits} TC</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
