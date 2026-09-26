
const fs = require("fs");
let schema = fs.readFileSync("prisma/schema.prisma", "utf8");

if (!schema.includes("collectionSessions CollectionSession[] @relation(\"CollectorSessions\")")) {
  schema = schema.replace(
    /collectionSessions\s+CollectionSession\[\]/,
    "collectionSessions CollectionSession[] @relation(\"CollectorSessions\")"
  );
}

if (!schema.includes("collectionSessions CollectionSession[]")) {
  schema = schema.replace(
    /dataCollectors\s+StudyDataCollector\[\]/,
    "dataCollectors StudyDataCollector[]\n  collectionSessions CollectionSession[]"
  );
}

fs.writeFileSync("prisma/schema.prisma", schema);

