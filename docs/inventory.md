# System Inventory & Architecture Index

**Auto-generated via:** `scripts/generate-inventory.ts`  
**Generated At:** 2026-11-06T11:43:41.265Z  
**Platform:** Tinat Health Research Ecosystem (Ethiopia)  
**Regulatory Standard:** Ethiopian Personal Data Protection Proclamation No. 1321/2024

---

## 1. Package & Framework Versions

| Package / Framework | Project Location | Declared Version |
| :--- | :--- | :--- |
| **Next.js** | `app` (Web Platform) | `^16.4.3` |
| **React** | `app` (Web Platform) | `19.2.8` |
| **Prisma ORM** | `app` (Database Engine) | `^7.10.0` |
| **Expo SDK** | `apps/admin-mobile` (Admin Mobile App) | `~58.0.19` |
| **React Native** | `apps/admin-mobile` (Admin Mobile App) | `0.88.0` |

---

## 2. Database Schema Summary

- **Total Models:** 60
- **Total Enums:** 34

### 2.1 Enums (34 Enums)

| Enum Name | Allowed Values Count | Values |
| :--- | :--- | :--- |
| `AIArtifactType` | 4 | `TABLE`, `FIGURE`, `MARKDOWN`, `CODE` |
| `AIMessageRole` | 4 | `USER`, `ASSISTANT`, `SYSTEM`, `TOOL` |
| `AIProvider` | 3 | `GEMINI`, `OPENROUTER`, `GROQ` |
| `AskQuestionStatus` | 4 | `UNANSWERED`, `ANSWERED`, `ARCHIVED`, `DELETED` |
| `CollectionMethod` | 2 | `SELF`, `FIELD_COLLECTED` |
| `DataSubjectRequestStatus` | 4 | `PENDING`, `IN_REVIEW`, `COMPLETED`, `REJECTED` |
| `DataSubjectRequestType` | 4 | `ACCESS`, `RECTIFICATION`, `ERASURE`, `WITHDRAW_CONSENT` |
| `DecisionStatus` | 2 | `ACTIVE`, `SUPERSEDED` |
| `EthicsApprovalStatus` | 4 | `PENDING`, `VERIFIED`, `REJECTED`, `EXPIRED` |
| `InvitationStatus` | 4 | `PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED` |
| `LedgerAccountKind` | 2 | `SYSTEM_ISSUANCE`, `USER_WALLET` |
| `ModerationStatus` | 4 | `OPEN`, `INVESTIGATING`, `RESOLVED`, `DISMISSED` |
| `PaymentStatus` | 3 | `PENDING`, `SUCCESS`, `FAILED` |
| `ProjectFileFolder` | 9 | `PROTOCOL`, `LITERATURE`, `ETHICS`, `DATA`, `ANALYSIS`, `MANUSCRIPT`, `FIGURES`, `PRESENTATIONS`, `OTHER` |
| `ProjectOutputStatus` | 5 | `DRAFT`, `IN_REVIEW`, `SUBMITTED`, `ACCEPTED`, `PUBLISHED` |
| `ProjectOutputType` | 7 | `RESEARCH_PAPER`, `POSTER`, `PRESENTATION`, `DATASET`, `ABSTRACT`, `PREPRINT`, `PUBLICATION` |
| `ProjectPhase` | 12 | `IDEA`, `PLANNING`, `LITERATURE_REVIEW`, `PROTOCOL`, `ETHICS_APPROVAL`, `DATA_COLLECTION`, `DATA_CLEANING`, `ANALYSIS`, `MANUSCRIPT`, `SUBMISSION`, `PUBLICATION`, `COMPLETED` |
| `ProjectRole` | 6 | `PROJECT_OWNER`, `PRINCIPAL_INVESTIGATOR`, `RESEARCHER`, `DATA_ANALYST`, `RESEARCH_ASSISTANT`, `ADVISOR_VIEWER` |
| `ProjectStatus` | 4 | `ACTIVE`, `PAUSED`, `COMPLETED`, `ARCHIVED` |
| `ProjectTaskPriority` | 4 | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `ProjectTaskStatus` | 5 | `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `BLOCKED`, `COMPLETED` |
| `ProjectVisibility` | 3 | `PRIVATE`, `TEAM`, `PUBLIC` |
| `QuestionType` | 13 | `SHORT_TEXT`, `LONG_TEXT`, `SINGLE_CHOICE`, `MULTIPLE_CHOICE`, `NUMBER`, `YES_NO`, `DATE`, `DROPDOWN`, `FILE_UPLOAD`, `LINEAR_SCALE`, `MULTIPLE_CHOICE_GRID`, `CHECKBOX_GRID`, `TIME` |
| `SessionStatus` | 3 | `ACTIVE`, `PAUSED`, `COMPLETED` |
| `StudyFormat` | 2 | `STANDARD`, `TINTOK` |
| `StudyFundingType` | 2 | `FREE`, `FUNDED` |
| `StudyLinkType` | 1 | `TINTOK_VERSION` |
| `StudyStatus` | 4 | `DRAFT`, `ACTIVE`, `PAUSED`, `COMPLETED` |
| `StudyType` | 4 | `SURVEY`, `OBSERVATIONAL`, `FUNDED`, `FREE_DATA_COLLECTION` |
| `TransactionType` | 7 | `EARN`, `SPEND`, `WITHDRAW`, `REFUND`, `ADJUSTMENT`, `REWARD_CREDIT`, `ADMIN_ADJUSTMENT` |
| `UserRole` | 4 | `PARTICIPANT`, `RESEARCHER`, `ADMIN`, `DATA_COLLECTOR` |
| `VerificationStatus` | 5 | `UNVERIFIED`, `PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED` |
| `VerificationType` | 2 | `RESEARCHER`, `DATA_COLLECTOR` |
| `WithdrawalStatus` | 4 | `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED` |

### 2.2 Models (60 Models)

| Model Name | Field Count | Primary Key / Index Summary |
| :--- | :--- | :--- |
| `ActivityLog` | 8 | `id: String` |
| `AdminChatMessage` | 6 | `id: String` |
| `AIArtifact` | 9 | `id: String` |
| `AIConversation` | 15 | `id: String` |
| `AIMessage` | 8 | `id: String` |
| `AIUsage` | 12 | `id: String` |
| `Answer` | 8 | `id: String` |
| `AskProfile` | 13 | `id: String` |
| `AskQuestion` | 13 | `id: String` |
| `CollectionSession` | 9 | `id: String` |
| `CollectorInvitation` | 10 | `id: String` |
| `ConsentForm` | 10 | `id: String` |
| `ConsentRecord` | 9 | `id: String` |
| `DataSubjectRequest` | 11 | `id: String` |
| `EthicsApproval` | 16 | `id: String` |
| `EthicsBoardDecision` | 8 | `id: String` |
| `EthicsBoardMember` | 9 | `id: String` |
| `IncidentLog` | 13 | `id: String` |
| `LedgerAccount` | 8 | `id: String` |
| `LedgerEntry` | 8 | `id: String` |
| `LedgerJournal` | 7 | `id: String` |
| `ModerationReport` | 16 | `id: String` |
| `Notification` | 8 | `id: String` |
| `ParticipantLink` | 7 | `id: String` |
| `PlatformConsentRecord` | 12 | `id: String` |
| `ProjectActivity` | 9 | `id: String` |
| `ProjectChatMessage` | 9 | `id: String` |
| `ProjectDecision` | 13 | `id: String` |
| `ProjectDiscussion` | 13 | `id: String` |
| `ProjectDiscussionReaction` | 6 | `id: String` |
| `ProjectDiscussionReply` | 8 | `id: String` |
| `ProjectDiscussionReplyReaction` | 6 | `id: String` |
| `ProjectFile` | 16 | `id: String` |
| `ProjectFileVersion` | 10 | `id: String` |
| `ProjectInvitation` | 12 | `id: String` |
| `ProjectLinkedStudy` | 9 | `id: String` |
| `ProjectMember` | 9 | `id: String` |
| `ProjectMilestone` | 13 | `id: String` |
| `ProjectNote` | 11 | `id: String` |
| `ProjectOutput` | 15 | `id: String` |
| `ProjectTask` | 20 | `id: String` |
| `Question` | 18 | `id: String` |
| `QuestionOption` | 6 | `id: String` |
| `QuestionRow` | 6 | `id: String` |
| `QuestionTranslation` | 8 | `id: String` |
| `ResearchProject` | 35 | `id: String` |
| `Response` | 14 | `id: String` |
| `Study` | 59 | `id: String` |
| `StudyBookmark` | 6 | `id: String` |
| `StudyComment` | 11 | `id: String` |
| `StudyDataCollector` | 6 | `id: String` |
| `StudyLike` | 6 | `id: String` |
| `StudyPayment` | 12 | `id: String` |
| `StudyRating` | 8 | `id: String` |
| `StudyTranslation` | 10 | `id: String` |
| `TinatCreditTransaction` | 9 | `id: String` |
| `User` | 72 | `id: String` |
| `Verification` | 13 | `id: String` |
| `Wallet` | 10 | `id: String` |
| `Withdrawal` | 9 | `id: String` |

---

## 3. Web Application Page Routes (50 Pages)

| Page Route | Relative Path |
| :--- | :--- |
| `/` | `app/page.tsx` |
| `/admin` | `app/admin/page.tsx` |
| `/admin/community` | `app/admin/community/page.tsx` |
| `/admin/ethics-board` | `app/admin/ethics-board/page.tsx` |
| `/admin/incidents` | `app/admin/incidents/page.tsx` |
| `/admin/logs` | `app/admin/logs/page.tsx` |
| `/admin/moderation` | `app/admin/moderation/page.tsx` |
| `/admin/settings` | `app/admin/settings/page.tsx` |
| `/admin/studies` | `app/admin/studies/page.tsx` |
| `/admin/studies/[id]` | `app/admin/studies/[id]/page.tsx` |
| `/admin/users` | `app/admin/users/page.tsx` |
| `/admin/verifications` | `app/admin/verifications/page.tsx` |
| `/admin/withdrawals` | `app/admin/withdrawals/page.tsx` |
| `/agreement` | `app/agreement/page.tsx` |
| `/ai` | `app/ai/page.tsx` |
| `/ask` | `app/ask/page.tsx` |
| `/ask/[username]` | `app/ask/[username]/page.tsx` |
| `/charter` | `app/charter/page.tsx` |
| `/code-of-conduct` | `app/code-of-conduct/page.tsx` |
| `/collector/dashboard` | `app/collector/dashboard/page.tsx` |
| `/collector/studies/[id]/collect` | `app/collector/studies/[id]/collect/page.tsx` |
| `/dashboard` | `app/dashboard/page.tsx` |
| `/dpa` | `app/dpa/page.tsx` |
| `/f/[id]` | `app/f/[id]/page.tsx` |
| `/forms` | `app/forms/page.tsx` |
| `/forms/[id]/responses` | `app/forms/[id]/responses/page.tsx` |
| `/forms/new` | `app/forms/new/page.tsx` |
| `/login` | `app/login/page.tsx` |
| `/participant` | `app/participant/page.tsx` |
| `/participant/history` | `app/participant/history/page.tsx` |
| `/participant/settings` | `app/participant/settings/page.tsx` |
| `/participant/studies` | `app/participant/studies/page.tsx` |
| `/participant/studies/[id]` | `app/participant/studies/[id]/page.tsx` |
| `/participant/wallet` | `app/participant/wallet/page.tsx` |
| `/participant/wallet/withdraw` | `app/participant/wallet/withdraw/page.tsx` |
| `/privacy` | `app/privacy/page.tsx` |
| `/profile/[id]` | `app/profile/[id]/page.tsx` |
| `/projects` | `app/projects/page.tsx` |
| `/projects/[id]` | `app/projects/[id]/page.tsx` |
| `/projects/invite/[token]` | `app/projects/invite/[token]/page.tsx` |
| `/projects/new` | `app/projects/new/page.tsx` |
| `/register` | `app/register/page.tsx` |
| `/researcher` | `app/researcher/page.tsx` |
| `/researcher/settings` | `app/researcher/settings/page.tsx` |
| `/researcher/studies` | `app/researcher/studies/page.tsx` |
| `/researcher/studies/[id]` | `app/researcher/studies/[id]/page.tsx` |
| `/researcher/studies/new` | `app/researcher/studies/new/page.tsx` |
| `/terms` | `app/terms/page.tsx` |
| `/transparency` | `app/transparency/page.tsx` |
| `/verify-email` | `app/verify-email/page.tsx` |

---

## 4. API Route Handlers (113 Handlers)

| Endpoint Path | HTTP Methods | Required Authorization / Role Gate | Source File |
| :--- | :--- | :--- | :--- |
| `/api/admin/chat/members` | `GET` | `[ADMIN]` | `app/api/admin/chat/members/route.ts` |
| `/api/admin/chat/messages` | `GET` `POST` | `[ADMIN]` | `app/api/admin/chat/messages/route.ts` |
| `/api/admin/dashboard/stats` | `GET` | `[ADMIN]` | `app/api/admin/dashboard/stats/route.ts` |
| `/api/admin/ethics-board` | `GET` `POST` | `[ADMIN]` | `app/api/admin/ethics-board/route.ts` |
| `/api/admin/incidents` | `GET` `POST` | `[ADMIN]` | `app/api/admin/incidents/route.ts` |
| `/api/admin/incidents/[id]` | `PATCH` | `[ADMIN]` | `app/api/admin/incidents/[id]/route.ts` |
| `/api/admin/investigations/resolve-respondent` | `POST` | `[ADMIN]` | `app/api/admin/investigations/resolve-respondent/route.ts` |
| `/api/admin/logs` | `GET` | `[ADMIN]` | `app/api/admin/logs/route.ts` |
| `/api/admin/moderation` | `GET` | `[ADMIN]` | `app/api/admin/moderation/route.ts` |
| `/api/admin/moderation/[id]` | `PATCH` | `[ADMIN]` | `app/api/admin/moderation/[id]/route.ts` |
| `/api/admin/studies` | `GET` | `[ADMIN]` | `app/api/admin/studies/route.ts` |
| `/api/admin/studies/[id]` | `GET` | `[ADMIN]` | `app/api/admin/studies/[id]/route.ts` |
| `/api/admin/studies/[id]/ethics` | `GET` `PATCH` | `[ADMIN]` | `app/api/admin/studies/[id]/ethics/route.ts` |
| `/api/admin/studies/[id]/status` | `PATCH` | `[ADMIN]` | `app/api/admin/studies/[id]/status/route.ts` |
| `/api/admin/users` | `GET` | `[ADMIN]` | `app/api/admin/users/route.ts` |
| `/api/admin/users/[id]` | `GET` `PATCH` | `[ADMIN]` | `app/api/admin/users/[id]/route.ts` |
| `/api/admin/verifications` | `GET` | `[ADMIN]` | `app/api/admin/verifications/route.ts` |
| `/api/admin/verifications/[id]` | `PATCH` | `[ADMIN]` | `app/api/admin/verifications/[id]/route.ts` |
| `/api/ai/analyze` | `POST` | `SESSION_CHECKED` | `app/api/ai/analyze/route.ts` |
| `/api/ai/chat` | `POST` | `SESSION_CHECKED` | `app/api/ai/chat/route.ts` |
| `/api/ai/conversations` | `GET` `POST` | `SESSION_CHECKED` | `app/api/ai/conversations/route.ts` |
| `/api/ai/conversations/[id]` | `GET` `PATCH` `DELETE` | `AUTHENTICATED_USER` | `app/api/ai/conversations/[id]/route.ts` |
| `/api/ai/conversations/[id]/messages` | `GET` `POST` | `AUTHENTICATED_USER` | `app/api/ai/conversations/[id]/messages/route.ts` |
| `/api/ask/profile` | `GET` `POST` `DELETE` | `SESSION_CHECKED` | `app/api/ask/profile/route.ts` |
| `/api/ask/questions` | `GET` | `SESSION_CHECKED` | `app/api/ask/questions/route.ts` |
| `/api/ask/questions/[id]` | `PATCH` `DELETE` | `SESSION_CHECKED` | `app/api/ask/questions/[id]/route.ts` |
| `/api/ask/submit` | `POST` | `PUBLIC / UNGUARDED` | `app/api/ask/submit/route.ts` |
| `/api/auth/admin/studies/[id]/status` | `PATCH` | `PUBLIC / UNGUARDED` | `app/api/auth/admin/studies/[id]/status/route.ts` |
| `/api/auth/admin/withdrawals` | `GET` | `[ADMIN]` | `app/api/auth/admin/withdrawals/route.ts` |
| `/api/auth/admin/withdrawals/[id]` | `PATCH` | `[ADMIN]` | `app/api/auth/admin/withdrawals/[id]/route.ts` |
| `/api/auth/avatar` | `POST` `DELETE` | `SESSION_CHECKED` | `app/api/auth/avatar/route.ts` |
| `/api/auth/callback/google` | `GET` | `PUBLIC / UNGUARDED` | `app/api/auth/callback/google/route.ts` |
| `/api/auth/fayda-preview` | `POST` | `SESSION_CHECKED` | `app/api/auth/fayda-preview/route.ts` |
| `/api/auth/fayda-verify` | `GET` `POST` | `SESSION_CHECKED` | `app/api/auth/fayda-verify/route.ts` |
| `/api/auth/google` | `GET` | `PUBLIC / UNGUARDED` | `app/api/auth/google/route.ts` |
| `/api/auth/login` | `POST` | `PUBLIC / UNGUARDED` | `app/api/auth/login/route.ts` |
| `/api/auth/logout` | `POST` | `SESSION_CHECKED` | `app/api/auth/logout/route.ts` |
| `/api/auth/payments/chapa/callback` | `GET` | `PUBLIC / UNGUARDED` | `app/api/auth/payments/chapa/callback/route.ts` |
| `/api/auth/register` | `POST` | `PUBLIC / UNGUARDED` | `app/api/auth/register/route.ts` |
| `/api/auth/resend-verification` | `POST` | `PUBLIC / UNGUARDED` | `app/api/auth/resend-verification/route.ts` |
| `/api/auth/settings` | `PATCH` | `SESSION_CHECKED` | `app/api/auth/settings/route.ts` |
| `/api/auth/studies` | `GET` `POST` | `PUBLIC / UNGUARDED` | `app/api/auth/studies/route.ts` |
| `/api/auth/studies/[id]/comment` | `POST` | `PUBLIC / UNGUARDED` | `app/api/auth/studies/[id]/comment/route.ts` |
| `/api/auth/studies/[id]/export` | `GET` | `PUBLIC / UNGUARDED` | `app/api/auth/studies/[id]/export/route.ts` |
| `/api/auth/studies/[id]/export/excel` | `GET` | `PUBLIC / UNGUARDED` | `app/api/auth/studies/[id]/export/excel/route.ts` |
| `/api/auth/studies/[id]/fund` | `POST` | `PUBLIC / UNGUARDED` | `app/api/auth/studies/[id]/fund/route.ts` |
| `/api/auth/studies/[id]/like` | `POST` | `PUBLIC / UNGUARDED` | `app/api/auth/studies/[id]/like/route.ts` |
| `/api/auth/studies/[id]/rate` | `POST` | `PUBLIC / UNGUARDED` | `app/api/auth/studies/[id]/rate/route.ts` |
| `/api/auth/studies/[id]/status` | `PATCH` | `PUBLIC / UNGUARDED` | `app/api/auth/studies/[id]/status/route.ts` |
| `/api/auth/studies/[id]/submit` | `POST` | `PUBLIC / UNGUARDED` | `app/api/auth/studies/[id]/submit/route.ts` |
| `/api/auth/verify-email` | `GET` `POST` | `PUBLIC / UNGUARDED` | `app/api/auth/verify-email/route.ts` |
| `/api/auth/withdrawals` | `POST` | `AUTHENTICATED_USER` | `app/api/auth/withdrawals/route.ts` |
| `/api/collector/invitations` | `GET` `PATCH` | `SESSION_CHECKED` | `app/api/collector/invitations/route.ts` |
| `/api/collector/sessions/[sessionId]` | `PATCH` | `SESSION_CHECKED` | `app/api/collector/sessions/[sessionId]/route.ts` |
| `/api/collector/studies` | `GET` | `SESSION_CHECKED` | `app/api/collector/studies/route.ts` |
| `/api/collector/studies/[id]/sessions` | `GET` `POST` | `AUTHENTICATED_USER` | `app/api/collector/studies/[id]/sessions/route.ts` |
| `/api/f/[id]` | `GET` | `PUBLIC / UNGUARDED` | `app/api/f/[id]/route.ts` |
| `/api/f/[id]/submit` | `POST` | `SESSION_CHECKED` | `app/api/f/[id]/submit/route.ts` |
| `/api/forms` | `GET` `POST` | `SESSION_CHECKED` | `app/api/forms/route.ts` |
| `/api/forms/[id]` | `GET` `PATCH` `DELETE` | `SESSION_CHECKED` | `app/api/forms/[id]/route.ts` |
| `/api/forms/[id]/export` | `GET` | `SESSION_CHECKED` | `app/api/forms/[id]/export/route.ts` |
| `/api/forms/[id]/responses` | `GET` | `SESSION_CHECKED` | `app/api/forms/[id]/responses/route.ts` |
| `/api/projects` | `GET` `POST` | `SESSION_CHECKED` | `app/api/projects/route.ts` |
| `/api/projects/[id]` | `GET` `PATCH` `DELETE` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/route.ts` |
| `/api/projects/[id]/ai` | `POST` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/ai/route.ts` |
| `/api/projects/[id]/chat` | `GET` `POST` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/chat/route.ts` |
| `/api/projects/[id]/decisions` | `GET` `POST` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/decisions/route.ts` |
| `/api/projects/[id]/discussions` | `GET` `POST` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/discussions/route.ts` |
| `/api/projects/[id]/discussions/[discussionId]` | `PATCH` `DELETE` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/discussions/[discussionId]/route.ts` |
| `/api/projects/[id]/discussions/[discussionId]/reaction` | `DELETE` `PUT` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/discussions/[discussionId]/reaction/route.ts` |
| `/api/projects/[id]/discussions/[discussionId]/replies/[replyId]/reaction` | `DELETE` `PUT` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/discussions/[discussionId]/replies/[replyId]/reaction/route.ts` |
| `/api/projects/[id]/discussions/[discussionId]/reply` | `POST` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/discussions/[discussionId]/reply/route.ts` |
| `/api/projects/[id]/files` | `GET` `POST` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/files/route.ts` |
| `/api/projects/[id]/files/[fileId]` | `PATCH` `DELETE` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/files/[fileId]/route.ts` |
| `/api/projects/[id]/members` | `GET` `POST` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/members/route.ts` |
| `/api/projects/[id]/members/[memberId]` | `PATCH` `DELETE` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/members/[memberId]/route.ts` |
| `/api/projects/[id]/milestones` | `GET` `POST` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/milestones/route.ts` |
| `/api/projects/[id]/milestones/[milestoneId]` | `PATCH` `DELETE` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/milestones/[milestoneId]/route.ts` |
| `/api/projects/[id]/notes` | `GET` `POST` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/notes/route.ts` |
| `/api/projects/[id]/notes/[noteId]` | `PATCH` `DELETE` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/notes/[noteId]/route.ts` |
| `/api/projects/[id]/outputs` | `GET` `POST` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/outputs/route.ts` |
| `/api/projects/[id]/outputs/[outputId]` | `PATCH` `DELETE` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/outputs/[outputId]/route.ts` |
| `/api/projects/[id]/studies` | `GET` `POST` `DELETE` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/studies/route.ts` |
| `/api/projects/[id]/tasks` | `GET` `POST` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/tasks/route.ts` |
| `/api/projects/[id]/tasks/[taskId]` | `PATCH` `DELETE` | `PUBLIC / UNGUARDED` | `app/api/projects/[id]/tasks/[taskId]/route.ts` |
| `/api/projects/invite/[token]` | `GET` `POST` | `SESSION_CHECKED` | `app/api/projects/invite/[token]/route.ts` |
| `/api/reports` | `POST` | `SESSION_CHECKED` | `app/api/reports/route.ts` |
| `/api/studies` | `GET` `POST` | `[RESEARCHER, ADMIN]` | `app/api/studies/route.ts` |
| `/api/studies/[id]` | `GET` `PATCH` `DELETE` | `RESEARCHER (OWNER) | ADMIN` | `app/api/studies/[id]/route.ts` |
| `/api/studies/[id]/collectors` | `GET` `POST` | `RESEARCHER (OWNER) | ADMIN` | `app/api/studies/[id]/collectors/route.ts` |
| `/api/studies/[id]/comment` | `POST` | `AUTHENTICATED_USER` | `app/api/studies/[id]/comment/route.ts` |
| `/api/studies/[id]/consent` | `GET` `POST` | `AUTHENTICATED_USER` | `app/api/studies/[id]/consent/route.ts` |
| `/api/studies/[id]/ethics` | `GET` `POST` | `RESEARCHER (OWNER) | ADMIN` | `app/api/studies/[id]/ethics/route.ts` |
| `/api/studies/[id]/ethics/document` | `GET` | `RESEARCHER (OWNER) | ADMIN` | `app/api/studies/[id]/ethics/document/route.ts` |
| `/api/studies/[id]/export` | `GET` | `RESEARCHER (OWNER) | ADMIN` | `app/api/studies/[id]/export/route.ts` |
| `/api/studies/[id]/export/excel` | `GET` | `RESEARCHER (OWNER) | ADMIN` | `app/api/studies/[id]/export/excel/route.ts` |
| `/api/studies/[id]/fund` | `POST` | `RESEARCHER (OWNER) | ADMIN` | `app/api/studies/[id]/fund/route.ts` |
| `/api/studies/[id]/like` | `POST` | `AUTHENTICATED_USER` | `app/api/studies/[id]/like/route.ts` |
| `/api/studies/[id]/rate` | `POST` | `AUTHENTICATED_USER` | `app/api/studies/[id]/rate/route.ts` |
| `/api/studies/[id]/responses` | `POST` | `AUTHENTICATED_USER` | `app/api/studies/[id]/responses/route.ts` |
| `/api/studies/[id]/status` | `PATCH` | `RESEARCHER (OWNER) | ADMIN` | `app/api/studies/[id]/status/route.ts` |
| `/api/studies/[id]/submit` | `POST` | `[PARTICIPANT]` | `app/api/studies/[id]/submit/route.ts` |
| `/api/studies/[id]/tintok-version` | `GET` `POST` | `SESSION_CHECKED` | `app/api/studies/[id]/tintok-version/route.ts` |
| `/api/studies/[id]/translations` | `GET` `POST` | `RESEARCHER (OWNER) | ADMIN` | `app/api/studies/[id]/translations/route.ts` |
| `/api/studies/[id]/withdraw` | `POST` | `AUTHENTICATED_USER` | `app/api/studies/[id]/withdraw/route.ts` |
| `/api/transparency` | `GET` | `PUBLIC / UNGUARDED` | `app/api/transparency/route.ts` |
| `/api/user/dsr/consent` | `POST` | `AUTHENTICATED_USER` | `app/api/user/dsr/consent/route.ts` |
| `/api/user/dsr/delete` | `POST` | `AUTHENTICATED_USER` | `app/api/user/dsr/delete/route.ts` |
| `/api/user/dsr/export` | `GET` | `AUTHENTICATED_USER` | `app/api/user/dsr/export/route.ts` |
| `/api/user/dsr/profile` | `PUT` | `AUTHENTICATED_USER` | `app/api/user/dsr/profile/route.ts` |
| `/api/user/dsr/requests` | `GET` | `AUTHENTICATED_USER` | `app/api/user/dsr/requests/route.ts` |
| `/api/user/platform-consent` | `GET` `POST` | `AUTHENTICATED_USER` | `app/api/user/platform-consent/route.ts` |
| `/api/user/policy-acceptance` | `GET` `POST` | `AUTHENTICATED_USER` | `app/api/user/policy-acceptance/route.ts` |

---

## 5. Architectural Compliance Verification Notes

1. **Authentication:** Custom session cookies (`tinat_session`) with Jose HS256 JWT tokens. NextAuth has been cleanly migrated to native Next.js Jose JWT authentication.
2. **User Roles:** Standardized across `PARTICIPANT`, `RESEARCHER`, `ADMIN`, and `DATA_COLLECTOR`.
3. **Double-Entry Ledger:** All credit movements balance to zero net sum across `LedgerEntry` and `LedgerAccount`.
4. **Data Separation:** Pseudonymized respondent codes isolate participant accounts from research response datasets under Proclamation 1321/2024.
