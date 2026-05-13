# API endpoints (reference)

Base path: **`/api`** (except **`/health`**, **`/ready`**, **`/`**).

Auth: **`Authorization: Bearer <token>`** unless noted. Roles are enforced per route.

## System

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/health` | — | Liveness |
| GET | `/ready` | — | DB connectivity |
| GET | `/` | — | API root |
| GET | `/api/init-platform-admin` | Header `x-init-key` | Dev-only; requires `DEV_INIT_KEY` |

## Auth (`/api/auth`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| POST | `/login` | — | Body: `organization`, `employeeId`, `password` |
| POST | `/set-password` | — | Invite token + new password |
| POST | `/change-password` | User | `currentPassword`, `newPassword` |

## Platform (`/api/platform`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| POST | `/login` | — | `identifier`, `password` |
| POST | `/onboard` | `PLATFORM_ADMIN` | New tenant + super-admin invite |

## Admin org (`/api/admin`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| GET | `/company` | Tenant | Company profile |
| POST | `/company/logo` | `ADMIN` | Logo upload (multipart) |
| GET | `/departments` | Tenant | List departments |
| POST | `/departments` | `ADMIN` | Create department |
| POST | `/users` | `ADMIN` | Create user |
| POST | `/users/bulk` | `ADMIN` | Bulk create |
| GET | `/users` | `ADMIN`, `TRAINER` | List users |
| PATCH | `/users/:id/role` | `ADMIN` | Change role |
| GET | `/stats` | `ADMIN`, `TRAINER` | Dashboard stats |

## SOPs (`/api/sops`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| POST | `/upload` | `ADMIN`, `TRAINER` | Multipart: `file`, `title`, `version`, optional `category`, `parentSopId`. **409** `SOP_DUPLICATE_TITLE_VERSION` if same company already has that title+version (trimmed). |
| GET | `/` | `ADMIN`, `TRAINER`, `AUDITOR`, `EMPLOYEE` | Query: `category`, `status`, `search` |
| GET | `/:id/file` | `ADMIN`, `TRAINER`, `AUDITOR`, `EMPLOYEE` | Signed URL / redirect for PDF |
| PATCH | `/:id/status` | `ADMIN`, `TRAINER` | Body: `status` (`ACTIVE` \| `ARCHIVED` \| `DRAFT` \| `UNDER_REVIEW`), `reason` (≥10 chars), `password` (re-auth / e-sign) |
| GET | `/:id/study` | Authenticated | AI summary / flashcards (cached) |
| POST | `/:id/chat` | Authenticated | Body: `question` |
| POST | `/:id/revise` | `ADMIN`, `TRAINER` | Body: `version`, `reason` (≥10); clones row as **DRAFT** |

## Quizzes (`/api/quizzes`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| POST | `/manual` | `ADMIN`, `TRAINER` | Manual MCQ set for `sopId` |
| GET | `/sop/:sopId` | Authenticated | Quizzes for SOP |

## Assignments (`/api/assignments`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| GET | `/my` | User | My assignments |
| GET | `/my-training` | User | Training dashboard |
| GET | `/company/stats` | `ADMIN`, `TRAINER`, `AUDITOR` | Tenant-only (`companyId` on JWT). Counts by status, pass/fail completed, avg score among passes, overdue **PENDING** with past deadline, lockouts, number of users with ≥1 assignment. |
| GET | `/company` | `ADMIN`, `TRAINER`, `AUDITOR` | Paginated company-wide assignments. Query: `page`, `limit` (max 100), optional `userId`, `assignmentId`, `status`, `quizId`, `sopId`, `search` (trainee name contains), `overdueOnly=true` (pending + past deadline). Each row includes trainee, quiz, SOP metadata, and `sopDisplayUrl` when resolvable. |
| GET | `/company/users/:userId` | `ADMIN`, `TRAINER`, `AUDITOR` | **Per-user training dossier:** trainee profile, all-time summary (`byStatus`, pass/fail counts, avg score among passes, `lastCompletedAt`), plus paginated `assignments` (query `page`, `limit`, optional `status`). |
| POST | `/` | `ADMIN`, `TRAINER` | Assign quiz to user |
| POST | `/bulk-department` | `ADMIN`, `TRAINER` | Bulk assign by department |
| GET | `/:id/certificate` | User / privileged | Certificate signed URL |
| POST | `/:id/submit` | User | Submit answers; e-sign flow |
| PATCH | `/:id/unlock` | `ADMIN`, `TRAINER` | Body: `reason` (≥10), `password` — unlock **LOCKED_OUT** |

**Platform (`PLATFORM_ADMIN`)** tokens have no `companyId`; these company report routes return **403** `TENANT_REQUIRED`. Cross-tenant assignment APIs are not implemented.

## Analytics (`/api/analytics`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| GET | `/compliance` | `ADMIN`, `TRAINER`, `AUDITOR` | |
| GET | `/risk-report` | `ADMIN`, `TRAINER`, `AUDITOR` | |
| GET | `/sop-difficulty` | `ADMIN`, `TRAINER` | |

## Export (`/api/export`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| GET | `/training-report` | `ADMIN`, `AUDITOR` | |

## Notifications (`/api/notifications`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| GET | `/` | User | List for current user |
| PATCH | `/:id/read` | User | Mark one read |
| PATCH | `/read-all` | User | Mark all read |

## Audit (`/api/audit`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| GET | `/platform` | `PLATFORM_ADMIN` | Platform-wide logs |
| GET | `/company` | `ADMIN`, `AUDITOR` | Company feed; query `page`, `limit` |
| GET | `/:id` | Tenant | Log detail |
| GET | `/:id/verify` | Authenticated | Integrity check |

## E-signatures (`/api/esignatures`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| GET | `/` | User | List |
| GET | `/:id/verify` | User | Verify record |

---

The Postman collection **`postman/E2E_FULL_FLOW.postman_collection.json`** covers a **happy path**, not every row above. Use this document when wiring the full UI or extra tooling.
