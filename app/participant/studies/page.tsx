import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Search, Bookmark, BookmarkCheck } from "lucide-react";
import { toggleBookmark } from "./actions";

export default async function StudyDiscoveryPage({
  searchParams,
}: {
  searchParams: { q?: string; tag?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { bookmarks: true, responses: true },
  });

  if (!user || user.role !== "PARTICIPANT") redirect("/dashboard");

  const query = searchParams.q || "";
  const selectedTag = searchParams.tag || "";

  const studies = await prisma.study.findMany({
    where: { 
      status: "ACTIVE",
      title: { contains: query, mode: "insensitive" },
      ...(selectedTag ? { tags: { has: selectedTag } } : {}),
    },
    include: {
      researcher: { select: { name: true, isVerified: true } },
      _count: { select: { questions: true, responses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const completedStudyIds = new Set(user.responses.map(r => r.studyId));
  const bookmarkedStudyIds = new Set(user.bookmarks.map(b => b.studyId));

  const availableStudies = studies.filter(
    (study) =>
      !completedStudyIds.has(study.id) &&
      (study.participantTarget === 0 || study._count.responses < study.participantTarget)
  );

  // Get all unique tags for filter
  const allTags = await prisma.study.findMany({
    where: { status: "ACTIVE" },
    select: { tags: true },
  });
  const uniqueTags = Array.from(new Set(allTags.flatMap(s => s.tags)));

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Discover Studies</h1>
          <p className="text-muted-foreground mt-1">Find and participate in research that matches your interests.</p>
        </div>
      </div>

      <div className="mb-8 space-y-4">
        <form className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search studies..."
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            />
          </div>
          <Button type="submit">Search</Button>
          {(query || selectedTag) && (
            <Link href="/participant/studies">
              <Button variant="outline">Clear Filters</Button>
            </Link>
          )}
        </form>

        {uniqueTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground py-1">Popular Tags:</span>
            {uniqueTags.map(tag => (
              <Link key={tag} href={`/participant/studies?tag=${tag}${query ? '&q='+query : ''}`}>
                <Badge variant={selectedTag === tag ? "default" : "secondary"} className="cursor-pointer">
                  {tag}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      {availableStudies.length === 0 ? (
        <Card className="bg-muted/50 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">No studies found</h3>
            <p className="text-muted-foreground max-w-sm">We couldn't find any active studies matching your filters or eligibility criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {availableStudies.map((study) => {
            const isBookmarked = bookmarkedStudyIds.has(study.id);
            const spotsRemaining = study.participantTarget > 0 ? study.participantTarget - study._count.responses : null;

            return (
              <Card key={study.id} className="flex flex-col group hover:border-primary/50 transition-colors relative">
                <CardHeader>
                  <div className="mb-3 flex justify-between items-start">
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary">{study._count.questions} questions</Badge>
                      {study.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    <Badge variant="success" className="shrink-0 bg-success/15 text-success hover:bg-success/25 border-0">
                      {study.rewardCredits} TC
                    </Badge>
                  </div>
                  <CardTitle className="line-clamp-2 leading-snug pr-8">{study.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    By {study.researcher.name} 
                    {study.researcher.isVerified && (
                      <span className="inline-block rounded-full bg-blue-100 p-0.5" title="Verified Researcher">
                        <svg className="h-3 w-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {study.description || "No description provided."}
                  </p>
                </CardContent>
                <CardFooter className="flex flex-col items-start gap-4 border-t border-border pt-4 mt-auto">
                  {spotsRemaining !== null && (
                    <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
                      <div className="w-full bg-muted rounded-full h-1.5 mr-4 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${(study._count.responses / study.participantTarget) * 100}%` }} />
                      </div>
                      <span className="whitespace-nowrap font-medium text-foreground">{spotsRemaining} spots left</span>
                    </div>
                  )}
                  <div className="flex gap-2 w-full">
                    <form action={async () => { "use server"; await toggleBookmark(study.id); }} className="shrink-0">
                      <Button variant="outline" size="icon" type="submit" title={isBookmarked ? "Remove Bookmark" : "Save for later"}>
                        {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4 text-muted-foreground" />}
                      </Button>
                    </form>
                    <Link href={`/participant/studies/${study.id}`} className="flex-1">
                      <Button className="w-full">View Details</Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
