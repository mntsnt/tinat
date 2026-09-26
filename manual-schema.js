
const fs = require("fs");
let schema = fs.readFileSync("prisma/schema.prisma", "utf8");

const sessionModel = `

model CollectionSession {
  id          String   @id @default(cuid())
  studyId     String
  collectorId String
  startTime   DateTime @default(now())
  endTime     DateTime?
  status      SessionStatus @default(ACTIVE)

  study       Study    @relation("StudyCollectionSessions", fields: [studyId], references: [id], onDelete: Cascade)
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

if(!schema.includes("model CollectionSession")) {
  schema += sessionModel;
}

if (!schema.includes("session          CollectionSession?")) {
  schema = schema.replace(
    /collector        User\?            @relation\("CollectedResponses", fields: \[collectorId\], references: \[id\], onDelete: SetNull\)/,
    "collector        User?            @relation(\"CollectedResponses\", fields: [collectorId], references: [id], onDelete: SetNull)\n  session          CollectionSession? @relation(\"SessionResponses\", fields: [collectionSessionId], references: [id], onDelete: SetNull)"
  );
}

if (!schema.includes("collectionSessionId String?")) {
  schema = schema.replace(
    /collectorId      String\?/,
    "collectorId      String?\n  collectionSessionId String?"
  );
}

if (!schema.includes("collectionSessions           CollectionSession\[\]")) {
  schema = schema.replace(
    /collectedResponses          Response\[\] @relation\("CollectedResponses"\)/,
    "collectedResponses          Response[] @relation(\"CollectedResponses\")\n  collectionSessions           CollectionSession[]      @relation(\"CollectorSessions\")"
  );
}

if (!schema.includes("collectionSessions   CollectionSession\[\]")) {
  schema = schema.replace(
    /collectorInvitations CollectorInvitation\[\] @relation\("StudyCollectorInvitations"\)/,
    "collectorInvitations CollectorInvitation[] @relation(\"StudyCollectorInvitations\")\n  collectionSessions   CollectionSession[] @relation(\"StudyCollectionSessions\")"
  );
}

fs.writeFileSync("prisma/schema.prisma", schema);

