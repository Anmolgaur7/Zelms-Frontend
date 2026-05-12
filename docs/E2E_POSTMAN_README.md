# E2E Postman collection — how to use it

Import **`E2E_FULL_FLOW.postman_collection.json`** into Postman.

The web app uses a **shadcn/ui dashboard template**; use this collection to mirror API calls while building **Card/Table/Form** screens against the same payloads.

**SOP study / AI chat:** requests **5.5** (`GET /api/sops/:sopId/study`) and **5.6** (`POST /api/sops/:sopId/chat`) — need **`sopId`** and **`companyToken`** (run through **5.2** first).

## Full frontend integration doc

See **`docs/FRONTEND_INTEGRATION.md`** in the repo for auth flows, error codes, optional `email` / `employeeId`, and JWT rules. **`docs/FRONTEND_AI_PROMPT.md`** has a copy-paste prompt for AI-assisted UI work.

---

## Collection variables

| Variable | Filled by | Purpose |
|----------|-----------|---------|
| **`baseUrl`** | You | API origin, e.g. `http://localhost:5000` |
| **`platformToken`** | Tests on **1.1** | `Bearer` for platform routes |
| **`companyToken`** | Tests on **2.2** | Company admin JWT |
| **`employeeToken`** | Tests on **6.2** / **6.3** | Employee JWT after login / password change |
| **`e2ePrefix`**, **`e2eAdminEmail`** | Pre-request on **1.2** if both blank | Onboard payload |
| **`verificationToken`** | Tests on **1.2** | Super-admin **set-password** |
| **`departmentId`** | Tests on **4.1** | Department UUID for invites |
| **`invitedUserId`**, **`invitedEmployeeId`**, **`employeeTempPassword`** | Tests on **4.2** | Employee used in assignments |
| **`e2eInviteEmployeeId`** | You (optional) | **4.2** optional `employeeId`; leave empty for auto |
| **`sopId`**, **`quizId`**, **`assignmentId`**, **`quizSubmitPayload`** | Later folder tests | Training flow |

---

## Response shapes (what to expect)

### Success JSON (common)

- **Login (tenant)** — `200` `{ token, role, name, employeeId, email | null, companyName, mustChangePassword }`
- **Login (platform)** — `200` `{ token, role: "PLATFORM_ADMIN", name }`
- **Onboard** — `201` `{ message, companyId, superAdminId, licenseId, logoUrl, inviteLink }` (`licenseId` may be server-generated)
- **Create user** — `201` `{ message, userId, employeeId, temporaryPassword, email? }` (`email` only if you sent one)
- **Bulk users** — `201` `{ message, users: [{ employeeId, temporaryPassword, email? }] }`
- **Change password** — `200` `{ message, token, mustChangePassword: false, role, name, employeeId, email, companyName }`

### Error JSON (common)

```json
{ "message": "...", "errorCode": "SOME_CODE", "details": {} }
```

Examples: **`VALIDATION_ERROR`** (400), **`AUTH_INVALID_CREDENTIALS`** (401), **`MUST_CHANGE_PASSWORD`** (403), **`USER_EMPLOYEE_ID_EXISTS`** (409).

---

## Run order

Run folders **0 → 9** top to bottom for a full pass. **5.2 Upload SOP** needs a real PDF and working AI/storage env or later quiz steps may fail.

**Employee path:** **6.2** (temp password) → **6.3** (change password, new token) → **6.4+**. Skipping **6.3** yields **`MUST_CHANGE_PASSWORD`** on protected calls.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **403 `MUST_CHANGE_PASSWORD`** | Run **6.3** after **6.2**. |
| **401 tenant login** | Use **organization** = prefix or license, correct **employeeId**, password (final password after **6.3**). |
| **409 duplicate prefix / email** | New onboard run or clear DB; use fresh prefix/emails. |
| **Variables empty** | Run parent steps first (e.g. **4.1** before **4.2** for `departmentId`). |

---

## Re-import after repo updates

If the collection changed in git, **re-import** or replace the collection in Postman so scripts and bodies stay in sync.
