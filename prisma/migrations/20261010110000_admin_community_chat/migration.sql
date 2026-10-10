CREATE TABLE "AdminChatMessage" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" VARCHAR(1500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminChatMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminChatMessage_channel_createdAt_idx"
ON "AdminChatMessage"("channel", "createdAt");

CREATE INDEX "AdminChatMessage_senderId_createdAt_idx"
ON "AdminChatMessage"("senderId", "createdAt");

ALTER TABLE "AdminChatMessage"
ADD CONSTRAINT "AdminChatMessage_senderId_fkey"
FOREIGN KEY ("senderId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
