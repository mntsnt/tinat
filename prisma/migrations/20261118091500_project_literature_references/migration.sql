CREATE TABLE "ProjectLiteratureReference" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "addedById" TEXT NOT NULL,
  "arxivId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "abstract" TEXT NOT NULL,
  "authors" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "publishedAt" TIMESTAMP(3),
  "primaryCategory" TEXT,
  "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "doi" TEXT,
  "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectLiteratureReference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectLiteratureReference_projectId_arxivId_key"
  ON "ProjectLiteratureReference"("projectId", "arxivId");
CREATE INDEX "ProjectLiteratureReference_projectId_savedAt_idx"
  ON "ProjectLiteratureReference"("projectId", "savedAt");

ALTER TABLE "ProjectLiteratureReference"
  ADD CONSTRAINT "ProjectLiteratureReference_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectLiteratureReference"
  ADD CONSTRAINT "ProjectLiteratureReference_addedById_fkey"
  FOREIGN KEY ("addedById") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
