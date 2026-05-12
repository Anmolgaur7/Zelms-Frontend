# Copy-paste prompt: build the Pharma LMS frontend against Klonixpharback

Use the text below as a **system or project prompt** in Cursor, Copilot, or similar tools when generating or refactoring the frontend.

---

```
You are implementing a web client for the "Klonixpharback" Pharma Training LMS API (Express + Prisma + JWT).

UI STACK (NON-NEGOTIABLE):
- Use the existing **shadcn/ui dashboard template** (React + Tailwind + Radix): keep the **shell** (sidebar, header, content area), typography, and spacing conventions.
- Build features with shadcn primitives: Card, Table, Form + react-hook-form, Dialog/Sheet, Button, Input, Label, Select, Badge; **sonner** (or template equivalent) for API errors.
- Tenant login UI = **company code + employee ID + password** (not email-first). Platform admin login = **email + password** on a separate path or tab.

AUTHORITATIVE BACKEND DOCS (read these in the repo before inventing endpoints):
- docs/FRONTEND_INTEGRATION.md — full integration guide, auth flows, error envelope, user create rules
- postman/E2E_FULL_FLOW.postman_collection.json — request order, bodies, and realistic flows (includes **5.5 study** / **5.6 SOP chat**)
- postman/E2E_POSTMAN_README.md — collection variables and troubleshooting

NON-NEGOTIABLE PRODUCT RULES:
1) Tenant employees log in with JSON: { organization, employeeId, password } to POST /api/auth/login.
   - organization = company employeeIdPrefix OR licenseId (string), NOT the internal company UUID.
   - employeeId = full id e.g. "ACME-2".
2) Platform admins use POST /api/platform/login with { identifier: email, password } OR POST /api/auth/login with the same body when organization is omitted.
3) Two onboarding paths:
   A) Company SUPER_ADMIN from platform onboard: uses invite token + POST /api/auth/set-password before first tenant login.
   B) Users created via POST /api/admin/users or /api/admin/users/bulk: response includes temporaryPassword; login returns mustChangePassword true; client MUST call POST /api/auth/change-password with Bearer token and { currentPassword, newPassword }, then store the new token. Until then, APIs return 403 with errorCode MUST_CHANGE_PASSWORD.
4) User.email is OPTIONAL on admin create/bulk. Omit for floor workers. If omitted, do not ask for email in UI for those personas.
5) employeeId on admin create is optional; omit or empty for auto PREFIX-n; digits only means PREFIX+digits; else full string.

HTTP CONVENTIONS:
- Send Authorization: Bearer <token> on all protected routes.
- Errors: JSON { message, errorCode, details? }. Branch UI on errorCode.
- 400 VALIDATION_ERROR: details often contains Zod issues.

IMPLEMENTATION STYLE:
- Central API client (fetch/axios) with baseURL from env (e.g. VITE_API_URL or NEXT_PUBLIC_API_URL).
- Typed DTOs where helpful; tolerate null email on user objects.
- After login, persist token securely; attach to every /api/* request except login and set-password.
- Route guard: if mustChangePassword, only allow change-password screen (+ logout) — use a full-width template page or blocking dialog consistent with the dashboard template.
- New pages live under the template layout route groups (e.g. /dashboard/...) with shared sidebar links for Admin vs Employee vs Platform where applicable.

Do not assume email-password login for tenant employees. Do not require email on employee invite forms unless the product owner explicitly wants notifications. Do not strip shadcn theme tokens or replace the dashboard shell with unrelated UI kits.
```

---

After pasting, point the AI at **`docs/FRONTEND_INTEGRATION.md`** and ask it to implement screens inside your **shadcn dashboard template** (sidebar layout, cards, tables, forms) using **Next.js** or **Vite + React** as in your repo.
