CREATE TABLE IF NOT EXISTS "ProjectChatMessage" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "taskId" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProjectChatMessage_projectId_createdAt_idx"
ON "ProjectChatMessage"("projectId", "createdAt");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ProjectChatMessage_projectId_fkey'
    ) THEN
        ALTER TABLE "ProjectChatMessage"
        ADD CONSTRAINT "ProjectChatMessage_projectId_fkey"
        FOREIGN KEY ("projectId") REFERENCES "ResearchProject"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'ProjectChatMessage_senderId_fkey'
    ) THEN
        ALTER TABLE "ProjectChatMessage"
        ADD CONSTRAINT "ProjectChatMessage_senderId_fkey"
        FOREIGN KEY ("senderId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END
$$;
