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
| GET | `/assignments` | `PLATFORM_ADMIN` | **Phase 3:** Cross-tenant assignment list. Query: `page`, `limit` (max 100), optional `companyId`, `status`, `userId`, `quizId`, `sopId`, `search` (trainee name). Response **`{ page, limit, total, data }`**. Rows include trainee, **company** (name, prefix, licenseId), quiz + SOP metadata; **no** signed PDF URLs. Writes platform audit **`PLATFORM_ASSIGNMENTS_QUERY`**. |
| GET | `/assignments/stats` | `PLATFORM_ADMIN` | **Phase 3:** Cross-tenant assignment KPI stats. Optional query `companyId`. Response mirrors tenant stats (counts by status, completed pass/fail, avg score among passes, overdue pending, locked-out). Writes platform audit **`PLATFORM_ASSIGNMENTS_STATS_QUERY`**. |
| GET | `/companies/assignment-stats` | `PLATFORM_ADMIN` | **Phase 3:** Per-company assignment KPIs (platform support view). Query: `page`, `limit` (max 100), optional `companyStatus` (`ACTIVE` \| `SUSPENDED` \| `TERMINATED`). Response **`{ page, limit, totalCompanies, data }`**, where each row includes `company` metadata + `stats`. Writes platform audit **`PLATFORM_COMPANY_ASSIGNMENT_STATS_QUERY`**. |

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
| POST | `/upload` | `ADMIN`, `TRAINER` | Multipart: `file`, `title`, `version`, optional `category`, `parentSopId`. Creates SOP as **DRAFT** (Phase 2); **`PATCH …/status` → ACTIVE** (ADMIN e-sign) before assign. **409** `SOP_DUPLICATE_TITLE_VERSION` duplicate title+version. |
| GET | `/` | `ADMIN`, `TRAINER`, `AUDITOR`, `EMPLOYEE` | **EMPLOYEE:** only **ACTIVE** SOPs (status query ignored). Others: query `category`, `status`, `search`. |
| GET | `/:id/file` | `ADMIN`, `TRAINER`, `AUDITOR`, `EMPLOYEE` | Signed URL for PDF. **EMPLOYEE:** only if SOP **ACTIVE** (**403** `SOP_NOT_ACCESSIBLE`). |
| PATCH | `/:id/status` | `ADMIN`, `TRAINER`, `SUPER_ADMIN` | Body: `status`, `reason` (≥10), `password`. **Phase 2:** transition **to** **ACTIVE** from any non-ACTIVE state requires **ADMIN** or **SUPER_ADMIN** (**403** `SOP_ACTIVATION_FORBIDDEN` for **TRAINER**). |
| GET | `/:id/study` | Authenticated | AI summary / flashcards. **EMPLOYEE:** only **ACTIVE** SOPs (**403** `SOP_NOT_ACCESSIBLE`). |
| POST | `/:id/chat` | Authenticated | Body: `question`. **EMPLOYEE:** only **ACTIVE** SOPs (**403** `SOP_NOT_ACCESSIBLE`). |
| POST | `/:id/revise` | `ADMIN`, `TRAINER` | Body: `version`, `reason` (≥10); clones row as **DRAFT** |

## Quizzes (`/api/quizzes`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| POST | `/manual` | `ADMIN`, `TRAINER` | Manual MCQ set for `sopId` |
| GET | `/sop/:sopId` | Authenticated | Quizzes for SOP. **EMPLOYEE:** only if SOP **ACTIVE** (**403** `SOP_NOT_ACCESSIBLE`). |

## Assignments (`/api/assignments`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| GET | `/my` | User | My assignments (includes Phase 1 snapshot fields when set) |
| GET | `/my-training` | User | Training dashboard |
| GET | `/company/stats` | `ADMIN`, `TRAINER`, `AUDITOR` | Tenant-only (`companyId` on JWT). Counts by status, pass/fail completed, avg score among passes, overdue **PENDING** with past deadline, lockouts, number of users with ≥1 assignment. |
| GET | `/company` | `ADMIN`, `TRAINER`, `AUDITOR` | Paginated company-wide assignments. Query: `page`, `limit` (max 100), optional `userId`, `assignmentId`, `status`, `quizId`, `sopId`, `search` (trainee name contains), `overdueOnly=true` (pending + past deadline). Each row includes trainee, quiz, SOP metadata, and `sopDisplayUrl` when resolvable. |
| GET | `/company/users/:userId` | `ADMIN`, `TRAINER`, `AUDITOR` | **Per-user training dossier:** trainee profile, all-time summary (`byStatus`, pass/fail counts, avg score among passes, `lastCompletedAt`), plus paginated `assignments` (query `page`, `limit`, optional `status`). |
| POST | `/` | `ADMIN`, `TRAINER` | **Phase 1+2:** SOP **ACTIVE**; **409** `SOP_NOT_ASSIGNABLE` / **`ASSIGNMENT_ALREADY_EXISTS`** if duplicate user+quiz. Snapshots on create. |
| POST | `/bulk-department` | `ADMIN`, `TRAINER` | Same as `POST /` plus **dedupe**: skips users who already have this `quizId`. Response **`created`**, **`skipped`**, **`departmentUserCount`**. |
| GET | `/:id/certificate` | User / privileged | Certificate signed URL |
| POST | `/:id/submit` | User | Submit answers; e-sign flow |
| PATCH | `/:id/unlock` | `ADMIN`, `TRAINER` | Body: `reason` (≥10), `password` — unlock **LOCKED_OUT** |

**Platform (`PLATFORM_ADMIN`)** tokens have no `companyId`; tenant **`GET /api/assignments/company*`** routes return **403** `TENANT_REQUIRED`. Cross-tenant reads use **`GET /api/platform/assignments`** (Phase 3).

## Courses (`/api/courses`) — Phase 3 catalog

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| POST | `/` | `ADMIN`, `TRAINER` | Body: `name`, `sopId`, optional `description`, `reason` (≥5). **409** `COURSE_DUPLICATE_NAME`. |
| GET | `/` | `ADMIN`, `TRAINER`, `AUDITOR`, `EMPLOYEE` | **EMPLOYEE:** only **ACTIVE** courses. Query: `status`, `search`, `sopId`. |
| GET | `/:id` | `ADMIN`, `TRAINER`, `AUDITOR`, `EMPLOYEE` | **403** `COURSE_NOT_ACCESSIBLE` for employee + non-ACTIVE. |
| PATCH | `/:id` | `ADMIN`, `TRAINER` | Body: optional `name`, `description`, `status`, `sopId`, `reason` (≥5). |

## Course groups (`/api/course-groups`) — Phase 3 catalog + assign rules

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| POST | `/` | `ADMIN`, `TRAINER` | Body: `name`, optional `description`, `reason` (≥5). **409** `COURSE_GROUP_DUPLICATE_NAME`. |
| GET | `/` | `ADMIN`, `TRAINER`, `AUDITOR`, `EMPLOYEE` | **EMPLOYEE:** only **ACTIVE** groups. Query: `status`, `search`. |
| GET | `/:id` | `ADMIN`, `TRAINER`, `AUDITOR`, `EMPLOYEE` | Includes member **courses** + linked SOP metadata. |
| PATCH | `/:id` | `ADMIN`, `TRAINER` | Body: optional `name`, `description`, `status`, `reason` (≥5). |
| POST | `/:id/courses` | `ADMIN`, `TRAINER` | Add course: `courseId`, optional `sortOrder`, `reason` (≥5). **409** `COURSE_GROUP_MEMBER_EXISTS`. |
| DELETE | `/:id/courses/:courseId` | `ADMIN`, `TRAINER` | Body or query `reason` (≥5). |
| POST | `/:id/assign-department` | `ADMIN`, `TRAINER` | Body: `departmentId`, optional `deadline`, `reason` (≥5). Assigns **first quiz per SOP** for each course in group (ACTIVE SOPs only); dedupes existing user+quiz. Response **`created`**, **`skippedSops`**, **`quizzesAssigned`**. **409** `COURSE_GROUP_EMPTY`. |

## Induction programs (`/api/induction-programs`) — Phase 3

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| POST | `/` | `ADMIN`, `TRAINER` | Body: `name`, optional `description`, `reason` (≥5). |
| GET | `/` | `ADMIN`, `TRAINER`, `AUDITOR` | List programs. Query: `status`. |
| GET | `/my` | User | Learner enrollments + step progress (syncs **COURSE** steps from passed assignments). |
| GET | `/:id` | `ADMIN`, `TRAINER`, `AUDITOR` | Program + ordered steps. |
| PATCH | `/:id` | `ADMIN`, `TRAINER` | Update name/description/status. |
| POST | `/:id/steps` | `ADMIN`, `TRAINER` | **COURSE** (`courseId`) or **ACKNOWLEDGMENT** (`ackText` ≥10). |
| POST | `/:id/enroll-user` | `ADMIN`, `TRAINER` | Body: `userId`, optional `deadline`, `reason`. Creates assignments for **COURSE** steps. |
| POST | `/:id/enroll-department` | `ADMIN`, `TRAINER` | Bulk enroll department; skips already enrolled/completed. |

## Induction enrollments (`/api/induction-enrollments`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| POST | `/:enrollmentId/steps/:stepId/acknowledge` | User (enrollee) | **ACKNOWLEDGMENT** steps only. Body: `reason` (≥10), `password` (e-sign). |

## Training plans (`/api/training-plans`) — Phase 3 planner

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| POST | `/` | `ADMIN`, `TRAINER` | Body: `calendarYear`, `title`, `reason` (≥5). Status **DRAFT**. |
| GET | `/` | `ADMIN`, `TRAINER`, `AUDITOR` | Query: `year`, `status`. |
| GET | `/:id` | `ADMIN`, `TRAINER`, `AUDITOR` | Plan + items + reviews. |
| PATCH | `/:id` | `ADMIN`, `TRAINER` | `title`, `status` (`DRAFT` \| `ACTIVE` \| `CLOSED`). |
| POST | `/:id/items` | `ADMIN`, `TRAINER` | Line item: `label`, optional `courseId`, `sopId`, `departmentId`, `plannedMonth` (1–12). |
| POST | `/:id/reviews` | `ADMIN`, `TRAINER`, `AUDITOR` | Monthly/annual commentary: `reviewType`, `periodKey`, `commentary` (≥10), `reason`. |

## Job descriptions (`/api/job-descriptions`) — Phase 3 JD matrix

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| POST | `/` | `ADMIN`, `TRAINER` | Body: `code`, `title`, optional `description`, `reason`. |
| GET | `/`, `GET /:id` | `ADMIN`, `TRAINER`, `AUDITOR` | List / matrix detail (courses + assigned users). |
| PATCH | `/:id` | `ADMIN`, `TRAINER` | Update title/description. |
| POST | `/:id/courses` | `ADMIN`, `TRAINER` | Link required **course** to JD. |
| POST | `/:id/assign-user` | `ADMIN`, `TRAINER` | Assign JD to **user**. |

## Qualifications (`/api/qualifications`) — Phase 3 ladders

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| POST | `/` | `ADMIN`, `TRAINER` | Start request: `subjectUserId`, `qualificationType` (`EMPLOYEE` \| `TRAINER`), `reason` (≥10). Creates steps **HOD** → **HEAD_QA**. |
| GET | `/` | `ADMIN`, `TRAINER`, `AUDITOR` | List; query `status`. |
| GET | `/my` | User | Requests where you are the **subject**. |
| GET | `/:id` | `ADMIN`, `TRAINER`, `AUDITOR` | Detail + steps. |
| POST | `/:id/steps/:stepId/decide` | **HOD:** `ADMIN`, `TRAINER`, `SUPER_ADMIN`; **Head QA:** `ADMIN`, `SUPER_ADMIN` | Body: `decision` (`APPROVE` \| `REJECT`), `reason` (≥10), `password`. Sequential steps enforced. |

## Analytics (`/api/analytics`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| GET | `/compliance` | `ADMIN`, `TRAINER`, `AUDITOR` | |
| GET | `/risk-report` | `ADMIN`, `TRAINER`, `AUDITOR` | |
| GET | `/sop-difficulty` | `ADMIN`, `TRAINER` | |

## Export (`/api/export`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| GET | `/training-report` | `ADMIN`, `AUDITOR` | CSV; SOP title/version columns prefer **assignment snapshot** (`assignedSopTitle` / `assignedSopVersion`) when set (Phase 1), else live quiz→SOP. |

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
| GET | `/:id/verify` | Authenticated | Integrity check; **dev:** `docs/INTEGRITY_VERIFY_SIMULATION.md` |

## E-signatures (`/api/esignatures`)

| Method | Path | Roles | Notes |
|--------|------|-------|--------|
| GET | `/` | User | List |
| GET | `/:id/verify` | User | Verify record; **dev:** `docs/INTEGRITY_VERIFY_SIMULATION.md` |

---

The Postman collection **`postman/E2E_FULL_FLOW.postman_collection.json`** covers a **happy path**, not every row above. Use this document when wiring the full UI or extra tooling.

**Frontend implementation (screens, nav, flows):** **`docs/FRONTEND_IMPLEMENTATION_GUIDE.md`**.  
**Frontend integration (auth, errors, payloads):** **`docs/FRONTEND_INTEGRATION.md`**.  
**Dev / QA — simulating failed verify calls (e-signature + audit):** **`docs/INTEGRITY_VERIFY_SIMULATION.md`**.  
**MVP vs full-scale product messaging:** **`docs/MVP_PRODUCT_SCOPE.md`**.  
**Phase 2 evidence & deploy:** **`docs/COMPLIANCE_EVIDENCE_PACK_OUTLINE.md`**, **`docs/SECURITY_DEPLOYMENT_CHECKLIST.md`**.
