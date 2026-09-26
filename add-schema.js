
const fs = require("fs");
let schema = fs.readFileSync("prisma/schema.prisma", "utf8");

if (!schema.includes("model CollectionSession")) {
  const sessionModel = `
model CollectionSession {
  id          String   @id @default(cuid())
  studyId     String
  collectorId String
  startTime   DateTime @default(now())
  endTime     DateTime?
  status      SessionStatus @default(ACTIVE)

  study       Study    @relation(fields: [studyId], references: [id], onDelete: Cascade)
  collector   User     @relation("CollectorSessions", fields: [collectorId], references: [id], onDelete: Cascade)
  responses   Response[] @relation("SessionResponses")

  @@index([studyId])
  @@index([collectorId])
}

enum SessionStatus {
  ACTIVE
  PAUSED
  COMPLETED
}
`;
  schema += sessionModel;
}

if (!schema.includes("collectionSessionId String?")) {
  schema = schema.replace(
    /collectorId\s+String\?/,
    "collectorId      String?\n  collectionSessionId String?"
  );
  
  schema = schema.replace(
    /collector\s+User\?\s+@relation\("CollectedResponses", fields: \[collectorId\], references: \[id\], onDelete: SetNull\)/,
    "collector        User?            @relation(\"CollectedResponses\", fields: [collectorId], references: [id], onDelete: SetNull)\n  session          CollectionSession? @relation(\"SessionResponses\", fields: [collectionSessionId], references: [id], onDelete: SetNull)"
  );
}

fs.writeFileSync("prisma/schema.prisma", schema);

