# Frontend integration — Klonixpharback API

This document is the **single integration guide** for web clients talking to this backend. The product UI is built from a **shadcn/ui dashboard template** (React, Radix primitives, Tailwind): keep shell patterns—sidebar, header, cards, tables—and wire them to this API. Pair with **`docs/API_ENDPOINTS.md`** (complete route table), **`docs/E2E_FULL_FLOW.postman_collection.json`**, and **`docs/E2E_POSTMAN_README.md`**. For an AI-ready build prompt, see **`docs/FRONTEND_AI_PROMPT.md`**.

---

## 0. UI stack (shadcn dashboard template)

| Topic | Guidance |
|--------|----------|
| **Stack** | **shadcn/ui** on **React** + **Tailwind** (template-provided layout: e.g. sidebar nav, top bar, main content). Prefer template **Card**, **Table**, **Form** + **react-hook-form**, **Dialog** / **Sheet**, **Button**, **Input**, **Label**, **Select**, **Badge** for density-appropriate admin and training UIs. |
| **Feedback** | Use **sonner** `toast` (or template default) for API failures: show `message`, log `errorCode` for support. **403 `MUST_CHANGE_PASSWORD`** should redirect to a dedicated full-page or modal flow using **change-password** API, not a toast-only. |
| **Auth UX** | **Tenant login** form: three fields — **Company code** (`organization`), **Employee ID**, **Password** — not a single email field. Optional separate **platform admin** login screen using email + password. |
| **Data tables** | Lists from **`GET /api/admin/users`**, **§6a** company assignment APIs, SOPs, audit: use shadcn **Table** + skeleton/empty states; handle nullable **`email`** columns (show `—` when null). |
| **Files** | SOP upload and logo upload: native `input type="file"` or dropzone inside a **Dialog**; `multipart/form-data` to the endpoints in **§6** (training) and **§7** (branding). |

Extend the template with new routes; do not replace the dashboard shell unless product explicitly requires it.

---

## 1. Basics

| Topic | Detail |
|--------|--------|
| **Base URL** | Your deployed API origin (e.g. `https://klonixpharback.onrender.com`) or `http://localhost:5000` in dev. No trailing slash required. |
| **API prefix** | REST routes live under **`/api/...`** (e.g. `/api/auth/login`). Health checks: **`/health`**, **`/ready`**. |
| **Content type** | JSON bodies: `Content-Type: application/json`. File uploads: `multipart/form-data` (SOP PDF, company logo). |
| **CORS** | Server enables CORS for browser apps; ensure your frontend origin is allowed in deployment config if you lock origins. |
| **Request tracing** | Responses may include **`x-request-id`**. Send **`x-request-id`** from the client if you want correlated logs. |

---

## 2. Authentication

### 2.1 JWT (Bearer)

- After a successful login, the API returns a **`token`** (JWT).
- Send it on protected routes:  
  `Authorization: Bearer <token>`
- Tokens are stateless; there is no server-side “logout” endpoint required — drop the token on the client. Default expiry is **1 day** (see server `jwt.sign` options).

### 2.2 Who logs in how

| User type | Endpoint | Body shape | Success response (typical) |
|-----------|----------|------------|----------------------------|
| **Platform admin** (SaaS operator) | `POST /api/platform/login` | `{ "identifier": "<email>", "password": "..." }` | `{ "token", "role": "PLATFORM_ADMIN", "name" }` |
| **Platform admin** (alternate) | `POST /api/auth/login` | Same, with **no** `organization` field | Same shape as above |
| **Tenant user** (company) | `POST /api/auth/login` | `{ "organization", "employeeId", "password" }` | `{ "token", "role", "name", "employeeId", "email", "companyName", "mustChangePassword" }` |

- **`organization`**: company **`employeeIdPrefix`** (e.g. `ACME`) **or** company **`licenseId`** (case-insensitive). Not the internal company UUID.
- **`employeeId`**: full ID including prefix for most users (e.g. `ACME-2`).
- **`email`** in the tenant login response may be **`null`** for users created without an email.

### 2.3 First-time password flows (important)

| Situation | What the UI must do |
|-----------|----------------------|
| **Company super admin** (created by **platform onboard**) | User is **not** verified until they call **`POST /api/auth/set-password`** with `{ "token", "password" }` from the **invite link** (UUID token in query). Then they log in with **organization + employeeId + password**. |
| **Other users** (created by **`POST /api/admin/users`** or **bulk**) | No invite link. API returns **`temporaryPassword`** once. User logs in with org + employeeId + that password. Response includes **`mustChangePassword: true`**. Client **must** call **`POST /api/auth/change-password`** with `Authorization: Bearer <token>` and `{ "currentPassword", "newPassword" }`, then replace the stored JWT with the **`token`** returned. Until then, other **`/api/*`** calls return **`403`** with **`errorCode`: `MUST_CHANGE_PASSWORD`**. |

### 2.4 Errors (auth-shaped)

| HTTP | When |
|------|------|
| **400** | Validation (`VALIDATION_ERROR`, body often includes `details` with Zod issues). |
| **401** | Wrong password / unknown user (`AUTH_INVALID_CREDENTIALS` or similar). |
| **403** | `AUTH_NOT_VERIFIED`, `ACCOUNT_SUSPENDED`, **`MUST_CHANGE_PASSWORD`** (see above). |

---

## 3. Standard error envelope

Most structured errors use:

```json
{
  "message": "Human-readable summary",
  "errorCode": "MACHINE_CODE",
  "details": {}
}
```

- **`errorCode`** is what the UI should branch on (stable-ish). Examples: `VALIDATION_ERROR`, `AUTH_INVALID_CREDENTIALS`, `MUST_CHANGE_PASSWORD`, `ASSIGNMENT_NOT_FOUND`, `USER_EMPLOYEE_ID_EXISTS`.
- **`details`** may be present (e.g. extra string from Prisma, or Zod `issues` array for `VALIDATION_ERROR`).
- **500** responses use the same pattern with `errorCode: "INTERNAL_ERROR"` where applicable.

---

## 4. Platform vs tenant routes

| Prefix | Who | Notes |
|--------|-----|--------|
| **`/api/platform/*`** | `PLATFORM_ADMIN` JWT | **`POST /login`**, **`POST /onboard`**, **`GET /assignments`** (Phase 3 — cross-tenant assignment list; query `page`, `limit`, optional `companyId`, `status`, `userId`, `quizId`, `sopId`, `search`; response has no signed SOP URLs). |
| **`/api/admin/*`** | Tenant **`ADMIN`** / **`SUPER_ADMIN`** (and some reads for **TRAINER** / **AUDITOR** per route) | Company users, departments, branding, stats. |
| **`/api/auth/*`** | Public or mixed | Login, set-password, change-password. |
| **`/api/sops/*`**, **`/api/quizzes/*`**, **`/api/assignments/*`**, etc. | Authenticated tenant users (roles vary per route) | Employee **`/my`** routes; **§6a** company assignment reports (**`/company/*`**) for admin/trainer/auditor. See **`docs/API_ENDPOINTS.md`**. |

**`SUPER_ADMIN`** is treated like **`ADMIN`** anywhere the code authorizes `ADMIN`, except where explicitly restricted (e.g. role changes).

---

## 5. User lifecycle (admin UI)

### 5.1 Create single user — `POST /api/admin/users`

**Body (typical):**

- `name`, `role` (`ADMIN` | `TRAINER` | `EMPLOYEE` | `AUDITOR`), `reason` (required, min length for audit).
- **`email`**: optional. Omit for floor workers; set for people who should receive email notifications.
- **`employeeId`**: optional. Empty/omit → server assigns next **`{PREFIX}-{n}`**. Digits only (e.g. `"42"`) → **`{PREFIX}-42`**. Any other non-empty string → used as full employee ID (unique per company).
- **`departmentId`**: optional UUID.

**Success `201`:**

```json
{
  "message": "User created...",
  "userId": "<uuid>",
  "employeeId": "PREFIX-5",
  "temporaryPassword": "<plain text once>"
}
```

If **`email`** was sent, it may be echoed under **`email`**. Password is **never** returned again.

### 5.2 Bulk — `POST /api/admin/users/bulk`

**Body:**

```json
{
  "reason": "min 5 chars...",
  "users": [
    { "name": "...", "role": "EMPLOYEE", "employeeId": "", "departmentId": "..." },
    { "name": "...", "role": "TRAINER" }
  ]
}
```

Each user: same optional **`email`**, **`employeeId`**, **`departmentId`** rules as single create.

**Success `201`:**

```json
{
  "message": "N users imported successfully",
  "users": [
    { "employeeId": "...", "temporaryPassword": "..." }
  ]
}
```

`email` appears in a row only if you supplied one.

---

## 6. Training flow (employee UI)

1. **List assignments** — `GET /api/assignments/my` or **`GET /api/assignments/my-training`** (Bearer employee). Each item includes `quiz.sop` with:
   - **`fileUrl`** — stored object key or legacy absolute URL (do not embed as long-term public link if it is a storage key).
   - **`sopDisplayUrl`** — short-lived **HTTPS signed URL** for opening the PDF in the browser (same signing rules as `GET /api/sops/:id/file`). **`sopSignedUrlExpiresInSeconds`** matches server TTL (default **600**). If signing fails, both URL fields are **`null`**.
   - Refresh the list or call **`GET /api/sops/:sopId/file`** again before expiry if the user keeps the page open a long time.
2. **Load quiz** — from assignment include, or `GET /api/quizzes/sop/:sopId` as needed.
3. **Submit** — `POST /api/assignments/:id/submit` with body:
   ```json
   {
     "answers": [
       { "questionIndex": 0, "selectedAnswer": "<exact string match to quiz.correctAnswer>" }
     ],
     "signature": { "value": "...", "meaning": "..." }
   }
   ```
4. **Score** — Server compares `selectedAnswer` to stored `correctAnswer` per index; pass threshold typically **≥ 80%**.
5. **Certificate** — On pass, backend may issue a certificate; **`GET /api/assignments/:id/certificate`** returns **`{ signedUrl, expiresInSeconds, assignmentId }`** (shape may vary slightly — inspect response in Network tab).

**Phase 1 (backend) — assignment integrity**

- **`POST /api/assignments`** and **`POST /api/assignments/bulk-department`** only allow quizzes whose linked SOP is **`ACTIVE`**. Otherwise **409** with **`errorCode`: `SOP_NOT_ASSIGNABLE`** and `details` including `sopId` and `status`.
- New assignments persist **frozen-at-assign** fields: **`assignedSopId`**, **`assignedSopTitle`**, **`assignedSopVersion`**, **`assignedQuizDifficulty`**. Prefer these in **admin / audit** views for “what was assigned at the time”; live `quiz.sop` may drift if metadata changes. Rows created before Phase 1 migration may have **`null`** snapshots.

**Phase 2 (backend) — DRAFT / publish / learner visibility**

- **`POST /api/sops/upload`** creates **`DRAFT`**; response includes **`status`**. **`PATCH /api/sops/:id/status`** to **`ACTIVE`** (reason + password) is **publish**; only **ADMIN** / **SUPER_ADMIN** may activate (**403** `SOP_ACTIVATION_FORBIDDEN` for **TRAINER**).
- **Employees:** only **ACTIVE** SOPs in **`GET /api/sops`**; **403** `SOP_NOT_ACCESSIBLE` on file, study, chat, **`GET /api/quizzes/sop/:sopId`** for other statuses.
- **`POST /api/assignments`:** **409** `ASSIGNMENT_ALREADY_EXISTS` if duplicate user+quiz. **`bulk-department`:** response **`created`**, **`skipped`**, **`departmentUserCount`**.

Study and chat routes are under **`/api/sops`** (tenant JWT; SOP must belong to the user’s company).

| Method | Path | Purpose |
|--------|------|---------|
| **GET** | **`/api/sops/:sopId/study`** | Returns **summary + flashcards** JSON. Uses cached **`studyMaterials`** on the SOP when present; otherwise downloads the PDF, runs AI, saves to DB, then returns. |
| **POST** | **`/api/sops/:sopId/chat`** | Body **`{ "question": "..." }`** (min 3 chars). Returns **`{ "answer": "..." }`** using the SOP PDF context. |

Implementation lives in **`src/routes/sop.routes.ts`** (handlers for **`/:id/study`** and **`/:id/chat`**). Postman **5.5** / **5.6** in **`docs/E2E_FULL_FLOW.postman_collection.json`** exercise these routes.

---

## 6a. Company assignment reports (admin / trainer / auditor)

Use these for **tenant** dashboards: training compliance tables, per-employee history, overdue queues, and lockout follow-up. They complement **`GET /api/analytics/compliance`**, **`GET /api/analytics/risk-report`**, and **`GET /api/export/training-report`** (CSV) by returning **structured JSON** with pagination and filters.

**Auth:** `Authorization: Bearer <companyToken>` (same JWT as other tenant routes).

**Roles:** **`ADMIN`**, **`TRAINER`**, **`AUDITOR`**. **`SUPER_ADMIN`** is allowed wherever the backend maps them to **`ADMIN`**. **`EMPLOYEE`** must not call these.

**Not available on platform JWT:** **`PLATFORM_ADMIN`** tokens have **no** `companyId`. Tenant **`/api/assignments/company*`** returns **`403`** with **`errorCode`: `TENANT_REQUIRED`**. For SaaS-wide assignment rows, use **`GET /api/platform/assignments`** (Phase 3); **`GET /api/audit/platform`** remains the platform-wide audit feed.

**Reference:** full parameter list in **`docs/API_ENDPOINTS.md`** (Assignments). Postman: **6.0a–6.0c** in **`docs/E2E_FULL_FLOW.postman_collection.json`**.

### 6a.1 `GET /api/assignments/company/stats`

Single call for **KPI cards** on an admin/trainer home screen.

**Response (shape):**

```json
{
  "totalAssignments": 120,
  "byStatus": {
    "PENDING": 40,
    "IN_PROGRESS": 5,
    "COMPLETED": 70,
    "OVERDUE": 2,
    "LOCKED_OUT": 3
  },
  "completedPassedCount": 55,
  "completedFailedCount": 15,
  "averageScoreAmongPassed": 88,
  "overduePendingCount": 8,
  "lockedOutCount": 3,
  "traineesWithAssignments": 45
}
```

- **`byStatus`**: always includes every **`AssignmentStatus`** key; unused statuses are **`0`**.
- **`overduePendingCount`**: assignments with **`status: "PENDING"`** and **`deadline`** strictly before **now** (same idea as the risk report).
- **`averageScoreAmongPassed`**: mean **`score`** where **`status === "COMPLETED"`** and **`passed === true`** (rounded integer); if none, **`0`**.
- **`traineesWithAssignments`**: count of **users** in the company who have at least one assignment row.

### 6a.2 `GET /api/assignments/company`

**Paginated company-wide assignment list** for a sortable/filterable **DataTable**.

**Query parameters:**

| Query | Type | Description |
|--------|------|-------------|
| `page` | number (default `1`) | 1-based page. |
| `limit` | number (default `25`, max `100`) | Page size. |
| `userId` | UUID | Trainee filter. |
| `assignmentId` | UUID | Single row (if it exists in the company). |
| `status` | `PENDING` \| `IN_PROGRESS` \| `COMPLETED` \| `OVERDUE` \| `LOCKED_OUT` | Exact status filter (ignored if `overdueOnly=true`). |
| `quizId` | UUID | Filter by quiz. |
| `sopId` | UUID | Filter by SOP (via quiz’s `sopId`). |
| `search` | string (max 200) | Case-insensitive **substring** on trainee **`name`**. |
| `overdueOnly` | `"true"` \| `"false"` | When **`true`**, forces **`PENDING`** + **`deadline < now`** (overrides `status`). |

**Response:**

```json
{
  "page": 1,
  "limit": 25,
  "total": 120,
  "data": [ /* assignment rows */ ]
}
```

Each element in **`data`** matches the **employee list shape** conceptually: assignment fields (`id`, `status`, `score`, `passed`, `attempts`, `deadline`, `completedAt`, …) plus nested **`user`** (id, name, email, employeeId, role, **department**) and **`quiz`** → **`sop`** (id, title, version, category, status, `fileUrl`). **`sopDisplayUrl`** / **`sopSignedUrlExpiresInSeconds`** are added the same way as **`GET /api/assignments/my`** — use them for quick “open SOP” links in the table; refresh if expired.

**Validation:** invalid query types → **`400`** **`VALIDATION_ERROR`** (Zod `details`).

### 6a.3 `GET /api/assignments/company/users/:userId`

**Trainee training dossier**: profile + **all-time summary** + **paginated assignment history** (current and past rows).

**Path:** `:userId` must be a user in the **same company** as the token.

**Query parameters:**

| Query | Type | Description |
|--------|------|-------------|
| `page` | number (default `1`) | Page of the **`assignments.data`** list. |
| `limit` | number (default `50`, max `100`) | Page size for that list. |
| `status` | assignment status enum | Optional filter on the **paginated** list only. |

**Errors:**

| HTTP | `errorCode` | When |
|------|-------------|------|
| **403** | `TENANT_REQUIRED` | Platform token or missing company on JWT. |
| **404** | `USER_NOT_FOUND` | UUID not a user in this company. |

**Response (shape):**

```json
{
  "trainee": {
    "id": "...",
    "name": "...",
    "email": null,
    "employeeId": "ACME-12",
    "role": "EMPLOYEE",
    "createdAt": "...",
    "department": { "id": "...", "name": "Production" }
  },
  "summary": {
    "totalAssignments": 12,
    "byStatus": { "PENDING": 2, "IN_PROGRESS": 0, "COMPLETED": 9, "OVERDUE": 0, "LOCKED_OUT": 1 },
    "completedPassedCount": 8,
    "completedFailedCount": 1,
    "averageScoreAmongPassed": 91,
    "lastCompletedAt": "2026-05-01T12:00:00.000Z"
  },
  "assignments": {
    "page": 1,
    "limit": 50,
    "total": 12,
    "data": [ /* same row shape as §6a.2 */ ]
  }
}
```

- **`summary`** is **all-time** for that user (not narrowed by `status` query).
- **`assignments`** is the **paginated** slice; use **`status`** to show e.g. only **`LOCKED_OUT`** for a coach view.

### 6a.4 UI wiring suggestions

| Screen | APIs |
|--------|------|
| Admin “Training overview” | **`/company/stats`** for KPIs; **`/company?overdueOnly=true`** for an overdue table; optional **`/company?status=LOCKED_OUT`**. |
| “All assignments” searchable grid | **`/company`** with **`search`**, **`status`**, **`sopId`**, **`page`/`limit`**. |
| Employee profile → “Training history” | **`/company/users/:userId`**; link from a row in the company table using **`user.id`**. |
| Still export CSV for compliance | **`GET /api/export/training-report`** (unchanged). |

---

## 7. Branding & company context

- **`GET /api/admin/company`** — `{ name, employeeIdPrefix, licenseId, logoUrl, logoDisplayUrl, ... }` for dashboard header. **`logoDisplayUrl`** is a ready-to-use URL when the backend can resolve storage keys.
- **Logo upload** — `POST /api/admin/company/logo` with multipart field **`file`** (PNG/JPEG).

---

## 8. Rate limiting

- Global limiter applies to all routes (high ceiling).
- Stricter limiter on **`/api/auth/login`**, **`/api/auth/change-password`**, **`/api/platform/login`** — expect **429** with a JSON message if abused.

---

## 9. Postman collection

- Import **`docs/E2E_FULL_FLOW.postman_collection.json`**.
- Set **`baseUrl`** to your API.
- Run folders **in order** for a full smoke (platform → onboard → admin → SOP **upload then publish (5.2b)** → assignment → employee password change → submit).
- See **`docs/E2E_POSTMAN_README.md`** for variable behavior and troubleshooting.

---

## 10. Database migrations

After backend upgrades, run **`npx prisma migrate deploy`** (prod) or **`npx prisma db push`** (dev) as your team defines, so schema (e.g. nullable `User.email`) matches the code.

---

## 11. Related docs

| File | Content |
|------|---------|
| [`INTEGRITY_VERIFY_SIMULATION.md`](./INTEGRITY_VERIFY_SIMULATION.md) | Dev/QA: simulate failed **e-signature** and **audit** verify |
| [`MVP_PRODUCT_SCOPE.md`](./MVP_PRODUCT_SCOPE.md) | Phased MVP; Phase 2 status |
| [`COMPLIANCE_EVIDENCE_PACK_OUTLINE.md`](./COMPLIANCE_EVIDENCE_PACK_OUTLINE.md) | RTM-lite / evidence starter |
| [`SECURITY_DEPLOYMENT_CHECKLIST.md`](./SECURITY_DEPLOYMENT_CHECKLIST.md) | Deploy & secrets checklist |
| [`TENANT_LOGIN_OPTIONS.md`](./TENANT_LOGIN_OPTIONS.md) | Why `organization` + `employeeId` exists |
| [`FRONTEND_AI_PROMPT.md`](./FRONTEND_AI_PROMPT.md) | Copy-paste prompt for Cursor / Copilot |
| [`ENTERPRISE_AUDIT_ESIGN.md`](./ENTERPRISE_AUDIT_ESIGN.md) | Audit / e-sign direction |

---

## 12. Support checklist for frontend bugs

1. **403 `MUST_CHANGE_PASSWORD`** — Implement forced **change-password** screen after login when flag is true.
2. **401 on tenant login** — Confirm **`organization`** is prefix or license, not company UUID; **`employeeId`** matches server (including prefix segment).
3. **400 `VALIDATION_ERROR`** — Inspect `details.issues` for field paths.
4. **403 `TENANT_REQUIRED`** on **`/api/assignments/company*`** — Caller is **`PLATFORM_ADMIN`** or a token without `companyId`; use a **tenant** admin/trainer/auditor JWT (see **§6a**).
5. **409 `SOP_NOT_ASSIGNABLE`** on **`POST /api/assignments`** (or bulk) — Linked SOP is not **ACTIVE**. After upload, **ADMIN** must publish (`PATCH /api/sops/:id/status` → ACTIVE); see Postman **5.2b**.
6. **403 `SOP_ACTIVATION_FORBIDDEN`** — **TRAINER** cannot set SOP **ACTIVE**; only **ADMIN** / **SUPER_ADMIN**.
7. **409 `ASSIGNMENT_ALREADY_EXISTS`** — Same user already has this quiz.
8. **403 `SOP_NOT_ACCESSIBLE`** — **EMPLOYEE** requested a non-**ACTIVE** SOP (list, file, study, chat, quizzes-by-sop).
9. **Empty `companyToken`** — Run platform login → onboard → set-password → company login in order.

When in doubt, mirror the **E2E** Postman sequence against your Network tab.
