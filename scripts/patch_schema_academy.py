schema_path = r"C:\Users\hp\Desktop\Tinat Project\Tinat\app\prisma\schema.prisma"

with open(schema_path, "r", encoding="utf-8") as f:
    content = f.read()

# Check if already added
if "model AcademyProgress" in content:
    print("Academy models already present in schema.prisma")
    exit(0)

# Add relations to User model
user_target = "  platformConsentRecords          PlatformConsentRecord[]\n}"
user_replacement = """  platformConsentRecords          PlatformConsentRecord[]
  academyProgress                 AcademyProgress[]
  academyQuizAttempts             AcademyQuizAttempt[]
  academyNotes                    AcademyNote[]
  academyCertificates             AcademyCertificate[]
}"""

if user_target in content:
    content = content.replace(user_target, user_replacement, 1)
    print("Added relations to model User.")
else:
    print("Error: Could not find user_target in schema.prisma")
    exit(1)

# Add models at end
models_to_append = """

// ==========================================
// TINAT ACADEMY: USER STATE & CREDENTIALS
// ==========================================

model AcademyProgress {
  id           String    @id @default(cuid())
  userId       String
  moduleSlug   String
  lessonSlug   String
  completed    Boolean   @default(false)
  completedAt  DateTime?
  lastReadAt   DateTime  @default(now())
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, moduleSlug, lessonSlug])
  @@index([userId, moduleSlug])
}

model AcademyQuizAttempt {
  id             String    @id @default(cuid())
  userId         String?
  moduleSlug     String
  score          Float
  totalQuestions Int
  correctCount   Int
  passed         Boolean
  answersPayload Json
  createdAt      DateTime  @default(now())

  user           User?     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, moduleSlug])
}

model AcademyNote {
  id         String   @id @default(cuid())
  userId     String
  lessonSlug String
  content    String
  selection  String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, lessonSlug])
}

model AcademyCertificate {
  id               String   @id @default(cuid())
  verificationCode String   @unique @default(cuid())
  userId           String
  learnerName      String
  type             String   // "MODULE" | "PATH"
  targetSlug       String
  title            String
  issueDate        DateTime @default(now())
  averageScore     Float

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([verificationCode])
  @@index([userId])
}
"""

content += models_to_append

with open(schema_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Successfully updated prisma/schema.prisma with Academy models!")
