CREATE TABLE "ProjectDiscussionReaction" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDiscussionReaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectDiscussionReplyReaction" (
    "id" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectDiscussionReplyReaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProjectDiscussionReaction_discussionId_userId_key"
ON "ProjectDiscussionReaction"("discussionId", "userId");
CREATE INDEX "ProjectDiscussionReaction_discussionId_idx"
ON "ProjectDiscussionReaction"("discussionId");
CREATE UNIQUE INDEX "ProjectDiscussionReplyReaction_replyId_userId_key"
ON "ProjectDiscussionReplyReaction"("replyId", "userId");
CREATE INDEX "ProjectDiscussionReplyReaction_replyId_idx"
ON "ProjectDiscussionReplyReaction"("replyId");

ALTER TABLE "ProjectDiscussionReaction"
ADD CONSTRAINT "ProjectDiscussionReaction_discussionId_fkey"
FOREIGN KEY ("discussionId") REFERENCES "ProjectDiscussion"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectDiscussionReaction"
ADD CONSTRAINT "ProjectDiscussionReaction_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectDiscussionReplyReaction"
ADD CONSTRAINT "ProjectDiscussionReplyReaction_replyId_fkey"
FOREIGN KEY ("replyId") REFERENCES "ProjectDiscussionReply"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectDiscussionReplyReaction"
ADD CONSTRAINT "ProjectDiscussionReplyReaction_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
