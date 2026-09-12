import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Search, Bookmark, BookmarkCheck, Stethoscope, Coins, ClipboardCheck, Clock, Users, AlertCircle } from "lucide-react";
import { toggleBookmark } from "./actions";
import { HEALTH_CATEGORIES, MEDICAL_DISCLAIMER } from "@/lib/healthCategories";

export default async function StudyDiscoveryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; type?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { bookmarks: true, responses: true },
  });

  if (!user || user.role !== "PARTICIPANT") redirect("/dashboard");

  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";
  const selectedCategory = resolvedParams.category || "";
  const selectedType = resolvedParams.type || "";

  const whereClause: any = {
    status: "ACTIVE",
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { objective: { contains: query, mode: "insensitive" } },
            { targetPopulation: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(selectedCategory
      ? {
          OR: [
            { category: selectedCategory },
            { tags: { has: selectedCategory } },
          ],
        }
      : {}),
    ...(selectedType === "FUNDED"
      ? {
          OR: [{ studyType: "FUNDED" }, { rewardCredits: { gt: 0 } }],
        }
      : selectedType === "FREE_DATA_COLLECTION"
      ? {
          OR: [{ studyType: "FREE_DATA_COLLECTION" }, { rewardCredits: 0 }],
        }
      : {}),
  };

  const studies = await prisma.study.findMany({
    where: whereClause,
    include: {
      researcher: { select: { name: true, isVerified: true, institution: true } },
      _count: { select: { questions: true, responses: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const completedStudyIds = new Set(user.responses.map((r) => r.studyId));
  const bookmarkedStudyIds = new Set(user.bookmarks.map((b) => b.studyId));

  const availableStudies = studies.filter(
    (study) =>
      !completedStudyIds.has(study.id) &&
      (study.participantTarget === 0 || study._count.responses < study.participantTarget)
  );

  return (
    <div className="container mx-auto px-4 py-8 md:px-6">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Health Research Discovery
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Medical & Health Studies
          </h1>
          <p className="text-muted-foreground mt-1">
            Contribute to academic investigations, clinical studies, and community health data collection.
          </p>
        </div>
      </div>

      {/* Study Type Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-3 overflow-x-auto">
        <Link
          href={`/participant/studies?${new URLSearchParams({
            ...(query ? { q: query } : {}),
            ...(selectedCategory ? { category: selectedCategory } : {}),
          }).toString()}`}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
            !selectedType
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          All Studies
        </Link>
        <Link
          href={`/participant/studies?${new URLSearchParams({
            type: "FUNDED",
            ...(query ? { q: query } : {}),
            ...(selectedCategory ? { category: selectedCategory } : {}),
          }).toString()}`}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            selectedType === "FUNDED"
              ? "bg-emerald-600 text-white font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Coins className="w-4 h-4" />
          Funded Studies (Earn TC)
        </Link>
        <Link
          href={`/participant/studies?${new URLSearchParams({
            type: "FREE_DATA_COLLECTION",
            ...(query ? { q: query } : {}),
            ...(selectedCategory ? { category: selectedCategory } : {}),
          }).toString()}`}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            selectedType === "FREE_DATA_COLLECTION"
              ? "bg-blue-600 text-white font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          Open Data Collection (Volunteer)
        </Link>
      </div>

      {/* Search & Category Filter Section */}
      <div className="mb-8 space-y-4">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search medical topics, objectives, or diseases..."
              className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
            />
          </div>

          <select
            name="category"
            defaultValue={selectedCategory}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors sm:w-64"
          >
            <option value="">All Health Categories</option>
            {HEALTH_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {selectedType && <input type="hidden" name="type" value={selectedType} />}

          <Button type="submit">Search</Button>

          {(query || selectedCategory || selectedType) && (
            <Link href="/participant/studies">
              <Button variant="outline">Clear Filters</Button>
            </Link>
          )}
        </form>

        {/* Popular Category Chips */}
        <div className="flex flex-wrap gap-1.5 items-center pt-1">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Categories:</span>
          {HEALTH_CATEGORIES.slice(0, 7).map((cat) => (
            <Link
              key={cat}
              href={`/participant/studies?${new URLSearchParams({
                category: cat,
                ...(query ? { q: query } : {}),
                ...(selectedType ? { type: selectedType } : {}),
              }).toString()}`}
            >
              <Badge
                variant={selectedCategory === cat ? "default" : "secondary"}
                className="cursor-pointer text-xs transition-colors hover:bg-primary/20"
              >
                {cat}
              </Badge>
            </Link>
          ))}
        </div>
      </div>

      {/* Studies Listing */}
      {availableStudies.length === 0 ? (
        <Card className="bg-muted/30 border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Stethoscope className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="mb-2 text-xl font-semibold text-foreground">No studies found</h3>
            <p className="text-muted-foreground max-w-sm text-sm">
              We couldn't find any active health studies matching your search filters. Try clearing filters or exploring other health categories.
            </p>
            <Link href="/participant/studies" className="mt-4">
              <Button variant="outline" size="sm">
                View All Studies
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {availableStudies.map((study) => {
            const isBookmarked = bookmarkedStudyIds.has(study.id);
            const isFunded = study.studyType === "FUNDED" && study.rewardCredits > 0;
            const spotsRemaining =
              study.participantTarget > 0
                ? study.participantTarget - study._count.responses
                : null;

            return (
              <Card
                key={study.id}
                className="flex flex-col group hover:border-primary/50 transition-all shadow-sm hover:shadow-md relative overflow-hidden"
              >
                {/* Category Top Banner */}
                <div className="px-6 pt-5 pb-0 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full truncate max-w-[180px]">
                    {study.category || "Health Research"}
                  </span>

                  {isFunded ? (
                    <Badge className="bg-emerald-600 text-white font-bold border-0 text-xs px-2.5">
                      {study.rewardCredits} TC
                    </Badge>
                  ) : (
                    <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                      Volunteer
                    </span>
                  )}
                </div>

                <CardHeader className="pt-3 pb-2">
                  <CardTitle className="line-clamp-2 leading-snug text-lg group-hover:text-primary transition-colors">
                    {study.title}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1.5 text-xs">
                    <span>By {study.researcher.name}</span>
                    {study.researcher.institution && (
                      <span className="text-muted-foreground truncate">
                        &bull; {study.researcher.institution}
                      </span>
                    )}
                    {study.researcher.isVerified && (
                      <span
                        className="inline-block rounded-full bg-blue-100 dark:bg-blue-900/40 p-0.5 shrink-0"
                        title="Verified Researcher"
                      >
                        <svg className="h-3 w-3 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-3 pb-4">
                  {study.objective ? (
                    <p className="text-xs text-foreground/80 line-clamp-2 italic bg-muted/40 p-2 rounded-md">
                      "{study.objective}"
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {study.description || "No description provided."}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{study.estimatedMinutes || 5} mins
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {study._count.questions} questions
                    </span>
                    {study.targetPopulation && (
                      <span className="truncate max-w-full text-[11px] text-muted-foreground/90 bg-muted px-2 py-0.5 rounded">
                        Cohort: {study.targetPopulation}
                      </span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col items-start gap-3 border-t border-border pt-4 mt-auto">
                  {spotsRemaining !== null && (
                    <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
                      <div className="w-full bg-muted rounded-full h-1.5 mr-3 overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, (study._count.responses / study.participantTarget) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="whitespace-nowrap font-medium text-foreground text-[11px]">
                        {spotsRemaining} spots left
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 w-full">
                    <form
                      action={async () => {
                        "use server";
                        await toggleBookmark(study.id);
                      }}
                      className="shrink-0"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        type="submit"
                        title={isBookmarked ? "Remove Bookmark" : "Save for later"}
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <Bookmark className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </form>
                    <Link href={`/participant/studies/${study.id}`} className="flex-1">
                      <Button className="w-full">
                        {isFunded ? "Participate & Earn" : "Participate"}
                      </Button>
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Health Protocol Notice */}
      <div className="mt-12 p-4 rounded-xl bg-muted/40 border border-border flex items-start gap-3 text-xs text-muted-foreground">
        <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground">Medical Research Notice: </span>
          {MEDICAL_DISCLAIMER}
        </div>
      </div>
    </div>
  );
}
