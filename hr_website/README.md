# Humora HR Website

Web admin for the HR & shift operations of **Humora**: declare and reconcile
per-shift revenue, approve staff requests, schedule shifts, record attendance, see who is working
right now, deliver notifications, search everything quickly, and answer policy/contract questions
with an AI assistant powered by Google Gemini.

It is a **Next.js 16 (App Router) + TypeScript** application in which **Supabase is the whole
backend** (PostgreSQL + Auth + Row Level Security). Route handlers under `app/api/` authenticate the
caller, run one use case and return JSON — there is no separate API server, no ORM and no background
worker.

## What it does

| Screen (`app/`)    | Vietnamese label     | Purpose                                                                         |
| ------------------ | -------------------- | ------------------------------------------------------------------------------- |
| `/`                | Tổng quan            | Landing dashboard with headline KPIs                                            |
| `/branches`        | Quản lý chi nhánh    | Branch registry: address, manager, GPS geofence and attendance radius (SCRUM-47) |
| `/facilities`      | Cơ sở vật chất       | Per-branch equipment registry with quantity and condition (SCRUM-45/46)         |
| `/revenue`         | Doanh thu            | Declare opening cash, count the drawer, reconcile closing revenue (SCRUM-39/40) |
| `/requests`        | Đơn từ               | Review leave / shift-swap / adjustment requests, approve or reject (SCRUM-41)   |
| `/schedules`       | Lịch làm việc        | Weekly shift schedule: assign an employee to a shift template per day (SCRUM-30) |
| `/employee-status` | Trạng thái nhân viên | Live roster: đang làm, chưa vào ca, nghỉ phép, đã tan ca, không có ca (SCRUM-22) |
| `/attendance`      | Bảng công            | Timesheet review: giờ vào/ra, vị trí theo bán kính chi nhánh, sửa giờ, khiếu nại (SCRUM-21/22/23/29) |
| `/staff`           | Quản lý nhân sự      | Staff administration: roles, cho nghỉ việc / kích hoạt lại (SCRUM-24)           |
| `/organization`    | Tổ chức              | Organization home: join code, the register of accounts, tạo tài khoản có mật khẩu tạm (SCRUM-51/52). Reached from onboarding and from the organization card in the sidebar — deliberately not a navigation tab |
| `/onboarding`      | Bắt đầu              | Create an organization or join one with its code — where an account with no organization lands (SCRUM-51) |
| `/reports`         | Báo cáo              | Revenue reporting and analysis screen (SCRUM-44 provides the aggregation API)   |
| `/notifications`   | Thông báo            | In-app notification feed and per-channel settings (SCRUM-48)                    |
| `/chat`            | Trợ lý AI            | Ask about internal policies and your own contract                               |
| `/login`, `/register` | Đăng nhập / Đăng ký | Supabase Auth sign-in and self-registration (both render outside the app shell) |
| `/api-docs`        | —                    | Swagger UI for every endpoint                                                   |

Quick search (SCRUM-49) is reachable from the header search box and from `GET /api/search`.

## Tech stack

| Concern           | Choice                                                                                 |
| ----------------- | -------------------------------------------------------------------------------------- |
| Framework         | Next.js 16 (App Router, Turbopack) + React 19                                          |
| Language          | TypeScript 5 with `strict: true`, no `any`                                             |
| Backend / data    | Supabase — PostgreSQL, Auth, Row Level Security, SQL RPC functions                     |
| Supabase client   | `@supabase/ssr` request-scoped server client (App Router cookies)                      |
| AI assistant      | `@google/generative-ai` — `gemini-embedding-001` embeddings (768 dims) + `gemini-3.5-flash` answers |
| Styling           | Tailwind CSS v4 (`@tailwindcss/postcss`), `lucide-react`, Be Vietnam Pro font          |
| API documentation | `next-swagger-doc` from JSDoc `@swagger` blocks + `swagger-ui-react`                   |
| Tooling           | npm, ESLint 9 (`eslint-config-next`), `tsx` for generator scripts                      |

## Architecture

Clean Architecture with a one-way dependency flow: HTTP concerns stay in the route handlers, business
rules live in use cases, and only the infrastructure layer knows about Supabase.

```text
app/api/**/route.ts        Route handler   parse • validate • authenticate • map errors → HTTP status
        │ constructs
        ▼
lib/usecases/*UseCase.ts   Use case        business rules; depends on interfaces only
        │ depends on
        ▼
lib/domain/**              Domain          entities (snake_case), I*Repository / ILLMService, typed errors
        ▲ implements
        │
lib/infrastructure/**      Infrastructure  Supabase*Repository, GeminiLLMService, supabaseClient
```

- A use case never imports Next.js or Supabase; a repository never contains business rules.
- Every request goes through `createSupabaseServerClient()`, which builds a client from the caller's
  cookies — so **RLS decides what data a request can see**, and no service-role key exists in the code.
- Aggregation and semantic search are pushed into the database as RPCs (`get_revenue_report`,
  `get_employee_status`, `match_company_documents`, `match_user_contracts`) rather than done in JavaScript.

## Project structure

```text
hr_website/
├── app/
│   ├── api/                      Route handlers, one folder per resource (each with a `@swagger` block)
│   ├── api-docs/                 Swagger UI page
│   ├── login/page.tsx            Sign-in screen (rendered outside the app shell)
│   ├── register/page.tsx         Self-registration screen (same, needs SCRUM-50 applied)
│   ├── <segment>/page.tsx        Screens: branches, facilities, revenue, requests, schedules,
│   │                             attendance, employee-status, reports, notifications, chat
│   │                             (+ dashboard at app/page.tsx)
│   ├── layout.tsx                Root layout: Be Vietnam Pro font + the Sidebar/Header shell
│   └── globals.css
├── components/                   Header.tsx (quick search + session user + sign-out), Sidebar.tsx (navigation)
├── proxy.ts                      Route protection + Supabase session refresh (Next.js 16 proxy, née middleware)
├── lib/
│   ├── domain/entities/          Plain interfaces; DB-backed fields stay snake_case
│   ├── domain/errors/            Typed error classes (RevenueAlreadyDeclaredError, ...)
│   ├── domain/repositories/      IRevenueRepository, INotificationRepository, ILLMService, ...
│   ├── usecases/                 One class per business action + businessDay.ts (Asia/Bangkok helper)
│   ├── infrastructure/           supabaseClient.ts, Supabase*Repository.ts, GeminiLLMService.ts
│   ├── publicPaths.ts            Screens that hide the shell (/login, /register) — see proxy.ts
│   └── swagger.ts                OpenAPI definition + shared component schemas
├── scripts/generate-swagger.ts   Writes public/swagger.json (runs via predev / prebuild)
├── scripts/ingest-knowledge.ts   Chunks docs/ → embeds → writes supabase/sql/knowledge_seed.sql
├── docs/                         Source documents (.md/.txt) for the AI knowledge base
├── supabase/sql/                 Idempotent SQL scripts, applied by hand (see Database)
├── public/swagger.json           Generated — never edit by hand
└── AGENTS.md / CLAUDE.md         Agent and contributor rules (single source of truth)
```

## Getting started

### Prerequisites

- **Node.js 20+** and **npm** (developed on Node 22 / npm 10).
- A **Supabase project** (URL + anon key) with the objects from `supabase/sql/` applied.
- A **Google Gemini API key** if you want the AI assistant to answer questions.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create `.env.local` in this folder (it is git-ignored — never commit it):

| Variable                        | Purpose                                                                 |
| ------------------------------- | ----------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL                                                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key — authorisation is enforced by RLS, not here |
| `GEMINI_API_KEY`                | Gemini key used for embeddings and chat answers                         |

Missing values do not break the build: the request that needs them throws at runtime
(`createSupabaseServerClient`, `GeminiLLMService`).

### 3. Create the database objects

Run the scripts in `supabase/sql/` from **Supabase Dashboard → SQL Editor**, in the order listed in
[Database & Supabase](#database--supabase).

### 4. Run

```bash
npm run dev      # http://localhost:3000 — predev regenerates public/swagger.json first
npm run build    # production build (may need outbound access to fonts.googleapis.com)
npm start        # serve the production build
```

Then open <http://localhost:3000> for the app and <http://localhost:3000/api-docs> for the API reference.

## API reference

Everything returns JSON. **session** means the handler requires a Supabase Auth session cookie and
answers `401` without one; **public** means the route needs no session (`POST /api/auth/sign-in` and
`POST /api/auth/sign-up`). There are **no demo endpoints any more** — every route reads a real table or
an RPC, and the in-memory mock store is gone.
Each route file documents itself with a JSDoc `@swagger` block.

| Method & path                        | Auth              | Data source                   | Notes                                                                                                                                                |
| ------------------------------------ | ----------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/auth/sign-in`             | public            | Supabase Auth                 | Body `{ email, password }` → `{ userId, email }` plus the session cookies; `401` on wrong credentials, `400` on invalid input                       |
| `POST /api/auth/sign-up`             | public            | Supabase Auth + `users`       | Body `{ email, password, full_name }` → `201` `{ userId, email, emailConfirmationRequired }`; `409` when the email is taken, `400` on invalid input. The `users` profile row comes from the `SCRUM-50` trigger |
| `POST /api/auth/sign-out`            | session           | Supabase Auth                 | Clears the session cookies; safe to call without an active session                                                                                   |
| `GET /api/auth/session`              | session           | `users`                       | Profile of the signed-in account; `401` without a session, `404` when the account has no `users` row                                                 |
| `POST /api/revenue/open`             | session           | `daily_revenue`               | Body `{ branch_id, open_amount }` → `201`; `409` if the branch already declared today; `400` on bad input                                            |
| `PUT /api/revenue/close`             | session           | `daily_revenue`               | Body `{ branch_id, close_amount, close_note?, close_image_url? }` → `{ revenue, revenue_difference }`; `404` without an opening record               |
| `GET /api/revenue/report`            | session           | RPC `get_revenue_report`      | `branch_id?`, `period=day\|week\|month\|quarter\|year` (default `day`), `date=YYYY-MM-DD`; returns series, summary and period-over-period comparison |
| `GET /api/revenue`                   | session           | `daily_revenue`               | Row-level sibling of the report: `branch_id?`, `days=1..31` (default 7, Asia/Bangkok business days), `status=open\|closed\|all` → the records, newest first, capped at 100 |
| `GET /api/requests`                  | session           | `requests`                    | Approval queue (SCRUM-41) with the requester name embedded; filters `status`, `branch_id` (the value `all` disables a filter)                        |
| `PATCH /api/requests/{id}/review`    | session + role    | `requests`                    | `{ status: "APPROVED" \| "REJECTED", reject_reason? }` → the updated request; a reason is required to reject; `403` unless the caller is `OWNER`/`CHU` |
| `GET /api/shifts`                    | session           | `shifts` (catalogue)          | The shift templates (`Ca sáng` 08:00–17:00, ...) that `/api/schedules` assigns; `branch_id = null` means every branch                          |
| `GET /api/schedules`                 | session           | `shift_assignments`           | Filters `branch_id`, `employee_id`, `start_date`, `end_date`; each row embeds the employee name and the shift hours                          |
| `POST /api/schedules`                | session           | `shift_assignments`           | Body `{ employee_id, branch_id, shift_id, work_date, status?, note? }` → `201`; `409` when the employee already has an overlapping shift, `404` for an unknown template |
| `PUT /api/schedules/{id}`            | session           | `shift_assignments`           | Replaces the editable fields of one assignment; `400` if `id` is not a UUID, `404` when missing, `409` on overlap                            |
| `DELETE /api/schedules/{id}`         | session           | `shift_assignments`           | Removes one assignment (`404` when missing)                                                                                                 |
| `GET /api/facilities`                | session           | `facilities`                  | Per-branch equipment, optionally filtered by `branch_id`                                                                                    |
| `POST /api/facilities`               | session           | `facilities`                  | Body `{ branch_id, name, code?, category?, quantity?, condition?, last_checked_at?, note? }` → `201`; writes need an `OWNER`/`CHU` role (RLS) |
| `PUT /api/facilities/{id}`           | session           | `facilities`                  | Replaces the editable fields of one facility; `404` when missing or not updatable                                                           |
| `DELETE /api/facilities/{id}`        | session           | `facilities`                  | Retires a facility from the registry (`404` when missing)                                                                                   |
| `GET /api/attendance`                | session           | `attendance`                  | Timesheet with the employee, the shift hours and the branch geofence embedded; filters `branch_id`, `employee_id`, `status`, `start_date`, `end_date` |
| `POST /api/attendance/complaints`    | session           | `attendance`                  | Body `{ attendance_id, complaint }` → `201`; the employee on the record or an `OWNER`/`CHU` manager may raise it, anyone else gets `403`              |
| `PATCH /api/attendance/{id}/verify`  | session + role    | `attendance`                  | Stamps `verified_by`/`verified_at` on one record (the web review action); `403` unless the caller is `OWNER`/`CHU`                                     |
| `PATCH /api/attendance/{id}`         | session + role    | `attendance`                  | Sửa giờ: replaces giờ vào/ra, `status` and note, and stamps `corrected_by`/`corrected_at` with the mandatory `correction_reason`; `400` when giờ ra precedes giờ vào, `403` unless the caller is `OWNER`/`CHU` |
| `PATCH /api/attendance/complaints/{id}` | session + role | `attendance`                  | Body `{ status: "RESOLVED" }` → closes an open khiếu nại and stamps `complaint_resolved_by`/`complaint_resolved_at`; `400` when the record has no complaint, `403` unless the caller is `OWNER`/`CHU` |
| `GET /api/employee-status`           | session           | RPC `get_employee_status`     | One row per person for one business day (Asia/Bangkok), derived from the schedule + timesheet; filters `branch_id`, `work_date`                       |
| `GET /api/notifications`             | session           | `notifications`               | Paginated: `page` (≥1), `page_size` (≤100, default 20) → `{ data, total, page, page_size }`                                                          |
| `PATCH /api/notifications/{id}/read` | session           | `notifications`               | Marks one notification read; `400` if `id` is not a UUID, `404` if it does not belong to you                                                         |
| `GET /api/notifications/settings`    | session           | `notification_settings`       | Channel preferences of the caller                                                                                                                    |
| `PUT /api/notifications/settings`    | session           | `notification_settings`       | Body `{ settings: [{ channel, enabled }] }`, upserted per `(user_id, channel)`                                                                       |
| `GET /api/search`                    | session + profile | `users`, `requests`, `shifts` | `q` (≥2 characters) and `type=all\|users\|requests\|shifts`; up to 10 rows per group; `403` when the account has no user profile                     |
| `GET /api/branches`                  | session           | `branches`                    | Branch list sorted by name, including the GPS geofence (`latitude`, `longitude`, `attendance_radius`)                                                 |
| `POST /api/branches`                 | session           | `branches`                    | Body `{ name, address?, manager_id?, latitude?, longitude?, attendance_radius? }` → `201`; `400` when the coordinates or radius are invalid; writes need an `OWNER`/`CHU` role (RLS) |
| `PUT /api/branches/{id}`             | session           | `branches`                    | Replaces the editable fields of one branch; `400` if `id` is not a UUID, `404` when the branch is missing or not updatable                          |
| `GET /api/users`                     | session           | `users`                       | `?id=<uuid>` → `{ id, full_name, role }` (`404` when unknown); without `id` → the staff directory including `is_active`, `403` unless the caller is `OWNER`/`CHU` |
| `PATCH /api/users/{id}`              | session + role    | `users`                       | Body `{ role, is_active }` → the updated staff member; `403` unless `OWNER`/`CHU`, only an `OWNER` may grant or revoke the `OWNER` role, and nobody may change their own role or deactivate themselves |
| `POST /api/organizations`            | session           | `organizations`               | Body `{ name }` → `201`; creates the caller's organization and makes them its `OWNER` (registering grants nothing); `409` when they already belong to one |
| `GET /api/organizations/current`     | session           | `organizations` + `users`     | `{ organization, code, member_count, pending_invite_count }`; `organization` is null while the caller has none, and `code` is null unless they are `OWNER`/`CHU` (RLS keeps it) |
| `PATCH /api/organizations/current`   | session + role    | `organizations`               | Body `{ name?, rotate_code? }` → the updated summary; renaming needs `OWNER`/`CHU`, rotating the join code (`regenerate_organization_code`) needs `OWNER` |
| `POST /api/organizations/join`       | session           | RPC `join_organization`       | Body `{ code }` → the summary. **Two factors**: the code must match *and* the caller's email must be on that organization's register; an outsider with the code gets `403`, ten failed attempts per hour get `429`, already being in an organization gets `409` |
| `GET /api/organizations/invites`     | session + role    | `organization_invites`        | The register of accounts (`invite` = asked an existing account, `provisioned` = created with a temporary password); `403` unless `OWNER`/`CHU` |
| `POST /api/organizations/invites`    | session + role    | `organization_invites`        | Body `{ email, full_name?, role? }` → `201`; `role` is capped at `CHU` (an invite never mints an `OWNER`), `409` when the address is already listed |
| `DELETE /api/organizations/invites/{id}` | session + role | `organization_invites`        | Withdraws an unclaimed invite (`404` for another organization's row, `400` for a non-UUID id) |
| `GET /api/organizations/accounts`    | session + role    | Edge Function probe           | `{ available }` — whether the `staff-account` Edge Function is deployed, so the screen can hide a form that would always fail |
| `POST /api/organizations/accounts`   | session + role    | Edge Function (service role)  | Body `{ email, password, full_name?, role? }` → `201`; creates a real Supabase Auth account with the owner-chosen temporary password, adds it to the register and flags `must_change_password`; `503` when the function is not deployed, `409` when the email exists |
| `POST /api/organizations/accounts/password` | session + role | Edge Function (service role) | Body `{ user_id, password }` → replaces a member's temporary password; the function refuses any account outside the caller's organization (`403`) |
| `POST /api/auth/change-password`     | session           | Supabase Auth + `complete_password_change` | Body `{ password }` → the caller's own new password (no service role) and clears `must_change_password`, which is what the `/change-password` gate reads |
| `POST /api/chat/ask`                 | session           | Gemini + vector RPCs          | Body `{ question }` → `{ answer, sources[] }`; answers only from retrieved internal documents                                                        |
| `GET /api/chat/sources`              | session           | `company_documents` + `user_contracts` | What the assistant can read: `{ companyDocuments, userContracts }`, each `{ totalChunks, documents[], truncated }` — the corpus check behind the Trợ lý AI screen's "Nguồn tri thức" panel |
| `GET /api/swagger`                   | —                 | generated spec                | Serves `public/swagger.json`                                                                                                                         |

Status conventions: `400` invalid input, `401` no session, `403` not allowed (for example a role that
cannot approve), `404` missing row, `409` duplicate or conflicting state.

### Interactive documentation

- `/api-docs` — Swagger UI. Because it runs in the browser it reuses your Supabase session cookie, which
  makes it the easiest way to exercise the authenticated endpoints.
- `GET /api/swagger` — the raw OpenAPI 3 document.
- `public/swagger.json` is generated by `scripts/generate-swagger.ts` (wired to `predev`/`prebuild`), and
  that script exits `1` when no paths are found — so a malformed `@swagger` block stops `dev` and `build`.
  Never edit the file by hand; regenerate it.

### Example requests

```bash
# Authenticated calls need the Supabase session cookie: sign in at /login, or use /api-docs,
# which reuses your browser cookie.
# Declare opening revenue for a branch:
curl -X POST http://localhost:3000/api/revenue/open \
  -H "Content-Type: application/json" -b "<supabase-auth-cookie>" \
  -d '{"branch_id":"11111111-1111-1111-1111-111111111111","open_amount":1500000}'

# Close the shift — the response adds the difference between closing and opening amounts:
curl -X PUT http://localhost:3000/api/revenue/close \
  -H "Content-Type: application/json" -b "<supabase-auth-cookie>" \
  -d '{"branch_id":"11111111-1111-1111-1111-111111111111","close_amount":2200000,"close_note":"Đối soát cuối ca"}'

# Monthly revenue report for one branch:
curl "http://localhost:3000/api/revenue/report?branch_id=11111111-1111-1111-1111-111111111111&period=month&date=2026-09-29" \
  -b "<supabase-auth-cookie>"

# Quick search across users, requests and shifts:
curl "http://localhost:3000/api/search?q=ca%20sang&type=all" -b "<supabase-auth-cookie>"

# Ask the AI assistant about an internal policy:
curl -X POST http://localhost:3000/api/chat/ask \
  -H "Content-Type: application/json" -b "<supabase-auth-cookie>" \
  -d '{"question":"Chính sách nghỉ phép năm của công ty là bao nhiêu ngày?"}'
```

Every endpoint above requires a session cookie, and the data is real: the last mock screen (trạng thái
nhân viên) moved to the `get_employee_status` RPC, and `lib/mock/adminStore.ts` was deleted with it.

```bash
# Approve a staff request (OWNER/CHU only — everyone else gets 403):
curl -X PATCH http://localhost:3000/api/requests/11111111-1111-4111-8111-111111111111/review \
  -H "Content-Type: application/json" -b "<supabase-auth-cookie>" \
  -d '{"status":"APPROVED"}'
```

## Database & Supabase

The schema lives as plain SQL in `supabase/sql/` and is applied **by hand** in Supabase Dashboard → SQL
Editor (there is no migration runner or Supabase CLI here). Apply it in this order:

| #   | Script                              | What it creates                                                                                                                                                                                             |
| --- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `SCRUM-39_daily_revenue.sql`        | `public.daily_revenue` (`id`, `branch_id`, `open_amount`, `created_at`, `created_by`), a unique index allowing one opening declaration per branch per business day (UTC+7), plus RLS select/insert policies |
| 2   | `SCRUM-40_update_revenue.sql`       | The closing columns (`close_amount`, `close_note`, `close_image_url`, `closed_by`, `closed_at`) and `audit_log jsonb`, plus an update policy requiring `closed_by = auth.uid()`                             |
| 3   | `SCRUM-44_revenue_report.sql`       | RPC `get_revenue_report(p_branch_id, p_start_at, p_end_at, p_bucket)` aggregating closed shifts into `day`/`month` buckets in Asia/Bangkok                                                                  |
| 4   | `SCRUM-48_notifications.sql`        | `notifications` and `notification_settings` (`UNIQUE (user_id, channel)`), indexes, an `updated_at` trigger and per-user RLS policies                                                                       |
| 5   | `SCRUM-49_quick_search_indexes.sql` | The `pg_trgm` extension plus GIN indexes on `users.full_name`, `requests.request_type`, `requests.status` and `shifts.name` used by the `ILIKE` quick search                                                |
| 6   | `SCRUM-47_branches.sql`             | `public.branches` (name, address, `manager_id`, `latitude`/`longitude`, `attendance_radius` in metres) with idempotent `add column if not exists`, check constraints for the radius bounds and the coordinate pair, plus RLS: read for every authenticated user, write for `OWNER`/`CHU` |
| 7   | `SCRUM-50_user_registration.sql`    | Fills the gaps in the hand-created `public.users`, defaults `role` to `EMPLOYEE`, adds the `on_auth_user_created` trigger (+ backfill) so every auth account gets a profile row, and the narrow `users_select_own` policy that `/api/auth/session` needs |
| 8   | `SCRUM-45_facilities.sql`           | `public.facilities` (per-branch equipment: name, `code`, `category`, `quantity`, `condition`, `last_checked_at`, `note`) with check constraints, indexes on `branch_id`/`condition` and RLS: read for every authenticated user, write for `OWNER`/`CHU` |
| 9   | `SCRUM-30_schedule.sql`             | The `public.shifts` catalogue (columns added if missing + the standard `Ca sáng` / `Ca chiều` / `Ca tối` / `Nghỉ` seeds) and `public.shift_assignments` (one employee × one template × one `work_date`, unique per triple, `status`, `created_by default auth.uid()`) with indexes and the same RLS model |
| 10  | `SCRUM-41_request_review.sql`       | Fills the gaps in the hand-created `public.requests`, adds the `requests_user_id_fkey` foreign key the requester-name join needs (`not valid`, so legacy rows are not re-checked), the `status` check, four indexes and RLS: read for authenticated, insert only your own `PENDING` request, approve/reject for `OWNER`/`CHU` |
| 11  | `SCRUM-21_attendance.sql`           | `public.attendance` (new): giờ vào/ra, GPS điểm chấm công + khoảng cách tới tâm chi nhánh (database tự tính lại từ toạ độ), ảnh xác minh, `status`, khiếu nại và xác minh của quản lý. Constraints (status, distance ≥ 0, ra ≥ vào), 4 indexes, RLS (read for authenticated, insert/update own, update for `OWNER`/`CHU`) plus two triggers: `attendance_guard_self_update` locks the check-in facts for non-managers and `attendance_compute_distance` keeps the stored distance consistent with the stored point |
| 12  | `SCRUM-22_employee_status.sql`      | `users.is_active` (whether an account still works here, because "nghỉ việc" cannot be derived) and the `get_employee_status(p_branch_id, p_work_date)` RPC: one row per person per business day, `security invoker` so the underlying RLS still filters, executable by `authenticated` only |
| 13  | `SCRUM-23_attendance_review.sql`    | The Bảng công review columns on `public.attendance`: `corrected_by`/`corrected_at`/`correction_reason` (a CHECK keeps the reason and the timestamp together, so a correction is always auditable) and the khiếu nại lifecycle `complaint_status` (`OPEN`/`RESOLVED`, existing complaints backfilled to `OPEN`), `complaint_resolved_by`/`complaint_resolved_at` + an index on the status. No RLS change: `attendance_update_managers` already permits it |
| 14  | `SCRUM-24_staff_admin.sql`          | Quản lý nhân sự: `users.is_active` (repeated from SCRUM-22 so this script stands alone), the read policy `users_select_authenticated` — the directory is only id, name, role, `is_active` and `created_at`, no salary or contact data — and `users_update_managers` (only `OWNER`/`CHU` may change a role or the employment state; no insert policy, because accounts are created by sign-up) |
| 15  | `SCRUM-51_organizations.sql`        | Tổ chức: `organizations`, `organization_join_codes` (the code sits in its own table because RLS filters rows, not columns — its policy keeps it to `OWNER`/`CHU`), `organization_invites` (the register of accounts, `source` `invite`/`provisioned`), `organization_join_attempts` (audit + the 10-per-hour throttle), `users.organization_id`, `users.must_change_password`, the helper functions `current_organization_id()` / `is_organization_manager()` and the `security definer` RPCs `create_organization` / `join_organization` / `regenerate_organization_code` / `complete_password_change`. Also narrows `users_select_authenticated` and `users_update_managers` to the caller's organization, which is what stops the schedule/requests/attendance embeds from mixing tenants |
| 16  | `SCRUM-53_tenant_scope.sql`         | `organization_id` on the operational tables (`branches`, `shifts`, `shift_assignments`, `attendance`, `requests`, `facilities`, `daily_revenue`) with `default public.current_organization_id()` so the mobile check-in keeps inserting unchanged, an index per table, every policy rewritten to add the organization predicate — the original conditions are kept verbatim, a rewrite must never end up looser — plus a backfill that assigns the pre-existing rows when exactly one organization exists, and a verification query block. Notifications are left alone: `user_id = auth.uid()` is already narrower |
| 17  | `SCRUM-54_fix_organization_policy_recursion.sql` | Makes `current_organization_id()` and `is_organization_manager()` **`security definer`**. Both read `public.users` and the `users` policies call them, so as `security invoker` the policy re-entered itself on the inner read and every profile read failed with `stack depth limit exceeded` — which is what made `/organization` answer 500 and stopped the post-login `/onboarding` redirect from firing. Safe because each helper answers only about the caller (`where id = auth.uid()`); run it **after SCRUM-51** |
| 18  | `SCRUM-55_schema_gap_fill.sql`      | Gap-fills the three tables that already existed here when SCRUM-41/48 were written, so their `create table if not exists` was a no-op: adds `notifications.body` / `related_entity_type` / `related_entity_id` (copying the hand-made `content` into `body`), gives `notification_settings` its `id` (backfilled, then keyed) plus the `(user_id, channel)` uniqueness the settings upsert conflicts on, restates SCRUM-48's indexes, trigger and five policies idempotently, and adds the `requests_user_id_fkey` foreign key the `requester` embed resolves through. Without it `/api/notifications`, `/api/notifications/settings` and `/api/requests` answer 500 |
| 19  | `SCRUM-56_requests_foreign_key.sql` | Creates `requests_user_id_fkey` (the relationship the `requester:users!requests_user_id_fkey` embed needs — the copy in SCRUM-55 did not land, and `requests` has no foreign keys at all) plus the two `_user_id_fkey` keys SCRUM-48 declares, finishes `notification_settings`' primary key and its `(user_id, channel)` uniqueness, **prints a relkind/constraint report** and ends with `notify pgrst, 'reload schema'`. Read the Messages tab: every failure is caught and reported with the database's own error text instead of stopping the script |

Tables the API touches: `users` (its `role` gates approvals — `OWNER`/`CHU`), `requests`, `shifts`
(the template catalogue), `shift_assignments` (the schedule), `attendance`, `daily_revenue`, `branches`,
`facilities`, `notifications`, `notification_settings`.

The AI assistant additionally depends on `match_company_documents` / `match_user_contracts` and their
embedding tables. Those objects are not covered by the scripts in this repository, so the chat endpoint
only works against a Supabase project where they already exist.

### The `staff-account` Edge Function (SCRUM-52, optional)

Creating a Supabase Auth account *for somebody else* needs the service-role key, which this app
deliberately does not have. That single capability therefore lives in an Edge Function:

- **Source (deployed by hand):** `supabase/functions/staff-account/index.ts`. There is no Supabase CLI or
  Docker in this repository, so deploy it from the Dashboard: **Edge Functions → Create a new function →
  name it `staff-account` → paste the file → Deploy**. Keep JWT verification **ON**; `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` are supplied by the platform, and no secret is added to this app.
- **Why it looks "wrong" in an editor:** that folder is Deno, not Node, so the root `tsconfig.json`
  excludes `supabase/functions/**` from `npx tsc --noEmit` and the app's lint/type gates do not cover it
  (`supabase/functions/deno.json` marks it as a Deno project). An editor without the Deno extension
  reports `Cannot find name 'Deno'` and `Cannot find module 'jsr:@supabase/supabase-js@2'` for it — those
  are not real errors. Install the Deno VS Code extension (or run `deno check
  supabase/functions/staff-account/index.ts`) and they stop; the Edge runtime bundles the file at deploy.
- **How it is called:** `POST /api/organizations/accounts` forwards the *caller's* access token, so the
  function authorizes the user (it re-reads their profile and requires `OWNER`/`CHU` of an organization)
  rather than trusting this app. The URL is derived from `NEXT_PUBLIC_SUPABASE_URL` as
  `…/functions/v1/staff-account`; set `STAFF_ACCOUNT_FUNCTION_URL` to override it if you rename the
  function.
- **Behaviour without it:** `GET /api/organizations/accounts` answers `{ available, reason, detail }`
  where `reason` is one of `ready`, `not_deployed`, `unauthenticated` (the function refused the session
  token — keep "Verify JWT" on), `not_allowed` (this account is not `OWNER`/`CHU` of an organization) or
  `misconfigured` (deployed but answering 5xx, e.g. missing secrets). The `/organization` screen shows the
  instruction that matches the reason instead of a form that would always fail, and the invite path
  (`POST /api/organizations/invites`) still onboards people.
- **What it does:** creates the account with `email_confirm: true` and the owner-typed temporary
  password, sets `must_change_password`, and writes the register row (`source = 'provisioned'`). The
  password is never stored or logged. It also serves `action: "reset_password"` for a member of the
  caller's own organization. Guardrails: field validation, JWT verification, the organization/role
  check, and a 20-accounts-per-organization-per-hour limit. It refuses to hand over a login that cannot
  work — if the `on_auth_user_created` trigger from `SCRUM-50_user_registration.sql` is missing, the
  account would have no `public.users` row, so the function answers `500` telling you to apply that
  script rather than returning `201`.

Rules for new database work:

- Add a **new** `supabase/sql/SCRUM-<n>_<name>.sql`; never edit a script that has already been applied.
- Keep scripts idempotent (`create table if not exists`, `drop policy if exists` before `create policy`),
  enable RLS on every new table and grant the narrowest policy (`auth.uid()` based).
- Timestamps are stored and served in **UTC**, while the business day is computed in **Asia/Bangkok
  (UTC+7, no DST)** — see `lib/usecases/businessDay.ts`. The unique index on `daily_revenue` uses the
  Bangkok date too, so a duplicate `409` can come from the database rather than from the use case.

## AI assistant (Trợ lý AI)

`POST /api/chat/ask` is a retrieval-augmented flow:

1. `GeminiLLMService.createEmbedding` embeds the question with `gemini-embedding-001`, pinning
   `outputDimensionality: 768` so the vector matches the existing `vector(768)` columns.
2. `SupabaseVectorSearchRepository` runs `match_company_documents` and `match_user_contracts` in parallel
   (five chunks each), keeping personal contracts scoped to the calling user. Both RPCs take
   `match_threshold` with **no default**, so the argument is mandatory — omitting it fails with
   `PGRST202` rather than returning an empty list.
3. The merged context goes to `gemini-3.5-flash`, which must answer **only** from that context, cite the
   source document, and return a fixed "không có thông tin" sentence when nothing matches.

The models are pinned, not aliased: `text-embedding-004` and `gemini-1.5-flash` now answer `404`
("no longer available") and the `gemini-flash-latest` alias measured 2/4 calls failing with `503
high demand`. Verify a candidate with `GET /v1beta/models?key=…` before switching.

**Loading documents:** put `.md` / `.txt` files in `docs/` — one file per document, and the first `#`
heading becomes the citation title — then run `npx tsx scripts/ingest-knowledge.ts`. It chunks the text
(`--max-chars`, default 1000, split on blank lines), embeds every chunk with `gemini-embedding-001` at
768 dims, and writes `supabase/sql/knowledge_seed.sql` to paste into the SQL Editor: this repo holds no
service-role key on purpose, so the privileged write happens in the editor, where `postgres` owns the
tables. Re-running is safe — the generated script deletes exactly the titles present in the source
folder before inserting, so edits replace rather than duplicate. Contracts are per person:
`npx tsx scripts/ingest-knowledge.ts --table user_contracts --user-id <uuid> --source docs/contracts`.
Details and conventions: `docs/README.md`.
(company-wide, columns `id, content, embedding, title, created_at`) and `user_contracts` (rows scoped to
the caller by `user_id`, same columns). `GET /api/chat/sources` reports both, and the screen's "Nguồn
tri thức" panel renders it: total chunks plus the document titles with their chunk counts. When both are
empty every question legitimately answers "Tôi không có thông tin về vấn đề này…", because the prompt
forbids answering outside the retrieved context. Nothing in this repo creates or fills those tables, so
an empty corpus is a data task: chunk the source text, embed each chunk with `gemini-embedding-001` at
**768 dims** (`outputDimensionality: 768`, matching the vector columns the old model produced) and
insert `{ content, title, embedding }`. Check the real column types and row counts in the SQL Editor —
`select count(*) from public.company_documents;` and
`select format_type(atttypid, atttypmod) from pg_attribute where attrelid = 'public.company_documents'::regclass and attname = 'embedding';`.

Model names, the prompt and that fallback sentence live in
`lib/infrastructure/GeminiLLMService.ts`; changing them is a product decision (it costs money and changes
answers).

## Scripts

| Command                               | What it does                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| `npm install`                         | Install dependencies                                                               |
| `npm run dev`                         | Dev server on <http://localhost:3000> (`predev` regenerates `public/swagger.json`) |
| `npm run build`                       | Production build (`prebuild` regenerates the spec first)                           |
| `npm start`                           | Serve the production build                                                         |
| `npm run lint`                        | ESLint over the repo (see the status note below — currently not green)             |
| `npx tsc --noEmit`                    | Typecheck — the gate that currently passes                                         |
| `npx tsx scripts/generate-swagger.ts` | Regenerate `public/swagger.json` manually                                          |

There is **no test runner** in this repository, so "verified" means: typecheck, targeted lint on the
files you touched, and exercising the endpoint or page — plus `/api-docs` when you add a route.

## Contributing

- `AGENTS.md` (imported by `CLAUDE.md`) is the single source of truth for conventions and boundaries —
  read it before changing code.
- Keep the layering intact: route handler → use case → repository. Business rules never live in a route
  handler and database calls never live in a use case.
- Every new API route needs a JSDoc `@swagger` block; add shared response schemas to `lib/swagger.ts`.
- Branches `feat/…` / `fix/…` / `chore/…`, conventional commits, one logical change per commit, and quote
  the SCRUM ticket (`SCRUM-44`) when the work maps to one.

## Current status and limitations

An honest snapshot of what is real and what is still a prototype:

- **Supabase-backed and real:** revenue open / close / report / record list, branches (list, create, update
  with the GPS
  geofence), facilities (per-branch equipment registry), the shift catalogue and the weekly schedule,
  staff requests (list + role-gated approve/reject), attendance (timesheet, geofence verdict, complaints,
  manager verification), the live employee status RPC, notifications and notification settings, quick
  search, user lookup, and the AI assistant endpoint.
- **No demo data left:** `lib/mock/adminStore.ts` was deleted together with its last consumer, once
  trạng thái nhân viên moved to `get_employee_status`. Every screen now reads a table or an RPC.
- **UI prototypes:** the header search still simulates its results instead of calling
  `GET /api/search`; every screen including `/chat` (Trợ lý AI) is wired to its API now. `/chat` posts
  the question to `POST /api/chat/ask` and renders the returned `answer` together with the `sources`
  it was built from — each with the document name and the vector search's similarity — so the
  citation panel is real data, not decoration. Conversations live in component state only (the
  endpoint is stateless) and a failed call stays in the transcript with a `Thử lại` button. The five
  navigation screens are wired too: `/` (Tổng quan)
  composes `get_employee_status`, the request queue, today's timesheet and the monthly revenue report;
  `/revenue` opens and closes the business day per branch and lists the last week from `GET /api/revenue`;
  `/reports` is a thin view over `get_revenue_report` with period, branch and date filters; `/notifications`
  reads the paginated feed, marks items read one call at a time (there is no bulk endpoint) and edits the
  channel settings. `app/branches/page.tsx` is
  wired to `/api/branches`; it deliberately has no branch-manager picker yet, because choosing a manager
  needs a staff-list endpoint and exposing staff rows is a PII decision (`AGENTS.md` → ask first). The
  `branches.manager_id` column and the API field already exist, so only the picker is missing.
  `app/facilities/page.tsx` and `app/schedules/page.tsx` are wired to their APIs as well; the schedule
  picks a person by searching `GET /api/search?type=users` rather than listing all staff, for the same PII
  reason, and `/api/schedules` embeds the employee name and shift hours so one request fills the week.
  `app/requests/page.tsx` is wired to the real `requests` table too; it shows the requester name from the
  embedded `users` row, so a missing profile would only cost the name (it is not a PII decision because the
  queue is the point of the screen). `app/attendance/page.tsx` is the review half of attendance: it reads
  `/api/attendance`, judges the check-in point against `branches.attendance_radius`, records khiếu nại and
  lets a manager verify a record — check-in and check-out themselves stay in the mobile app.
- **Sign-in and self-registration are real and server-side:** `app/login/page.tsx` and
  `app/register/page.tsx` post to `/api/auth/sign-in` and `/api/auth/sign-up` (route → use case →
  `SupabaseAuthService`), Supabase Auth sets the session cookies, and `proxy.ts` redirects unauthenticated
  page requests to `/login?next=…` while every route handler still answers `401` on its own. The
  `/api/auth/session` route exposes the signed-in profile to the shell header. `lib/publicPaths.ts` is the
  single list of screens that hide the shell (`/login`, `/register`).
- **Registration needs `SCRUM-50_user_registration.sql`.** Sign-up creates the `auth.users` account and the
  trigger creates the matching `public.users` row with the default role `EMPLOYEE`; without that script the
  account exists but has no profile, so `/api/auth/session` answers `404` and the header shows no name. New
  accounts are never privileged — `OWNER`/`CHU` is granted by an owner (the promote snippet is at the end of
  the script). If the Supabase project has *Confirm email* enabled, the response carries
  `emailConfirmationRequired: true` and the screen asks the user to open the confirmation link, because no
  session can be created before the address is verified.
- **No tests, no CI, no Docker.** `npx tsc --noEmit` passes; `npm run lint` is currently red with **6,512
  problems (1,088 errors, 5,424 warnings)** on a clean tree (measured on this branch) because the
  committed bundle output under `hr_website/hr_website/.next/**` gets linted. Those are the *bundles*, not
  the app: no page or route carries a lint error any more. Scope lint to the files you changed, and note
  that untracked dev-server output in the same folder inflates the number (it doubled it once) — `git clean
  -f -- hr_website/hr_website` restores the baseline.

## Troubleshooting

| Symptom                                                               | Cause and fix                                                                                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.`  | `.env.local` is missing or incomplete — add both Supabase variables                                                            |
| `Missing GEMINI_API_KEY environment variable.`                        | Set `GEMINI_API_KEY`; only `/api/chat/ask` needs it                                                                            |
| Every API call answers `401`                                          | No Supabase session cookie — sign in at `/login` first (pages are redirected by `proxy.ts`, APIs answer JSON `401`)           |
| A page request redirects to `/login` although you expect to be signed in | No valid session cookie: sign in again, or check `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`                 |
| Registered successfully but the header shows no name and `/api/auth/session` answers `404` | The account has no `public.users` row — apply `supabase/sql/SCRUM-50_user_registration.sql` (it backfills existing accounts) |
| `POST /api/auth/sign-up` answers `201` but signing in fails with `email_not_confirmed` | Supabase *Confirm email* is enabled: open the link in the confirmation email first, or turn the setting off in Auth → Providers → Email |
| `POST /api/auth/sign-up` answers `500` on a suspiciously empty project | The `public.users` table is missing or has a `role` enum without an `EMPLOYEE` label — run `SCRUM-50` and adjust that literal |
| `npm run dev` / `npm run build` stops with "Không tìm thấy path nào…" | `scripts/generate-swagger.ts` found zero paths: one of the `@swagger` blocks no longer parses                                  |
| A query returns an empty list or `404` although rows clearly exist    | RLS is filtering by session (`auth.uid()`) — review the policies in `supabase/sql/*.sql`                                       |
| `409` when declaring opening revenue                                  | A declaration already exists for that branch and business day (Asia/Bangkok); the unique index catches concurrent requests too |
| `npm run build` fails while fetching fonts                            | Be Vietnam Pro comes from `next/font/google` and needs outbound network access                                                 |
| Edits on Bảng công / Xếp ca disappear after a reload                  | They should not: both screens write through the API, so a lost change means the request failed — read the rose banner and the server log                                                         |
| `/schedules` shows the shift picker empty                             | `public.shifts` has no templates — run `supabase/sql/SCRUM-30_schedule.sql`, which seeds `Ca sáng` / `Ca chiều` / `Ca tối` / `Nghỉ` |
| Scheduling answers `409`, or `/schedules` shows no employee name      | `409` means the employee already has an overlapping shift that day (by design). A blank name means the `users` SELECT policy hides the profile from the embedded join |
| Every row of `/api/schedules` has `employee: null`                    | The `users` SELECT policy hides that profile from the embedded join — run `supabase/sql/SCRUM-24_staff_admin.sql`, which creates `users_select_authenticated`                                                  |
| Duyệt đơn answers `403`                                               | The account has no `public.users` row, or its `role` is neither `OWNER` nor `CHU` — run `SCRUM-50` and promote the account |
| `/requests` lists nothing although rows exist                         | `requests_select_authenticated` (SCRUM-41) is missing, so RLS hides every row from the session                                                                |
| Bảng công is empty                                                    | `public.attendance` does not exist yet — run `supabase/sql/SCRUM-21_attendance.sql`; the rows themselves are inserted by the mobile check-in                             |
| An employee cannot correct their own check-in time                    | By design: `attendance_guard_self_update` lets them complete the record (giờ ra, ghi chú, khiếu nại) while only an `OWNER`/`CHU` may change the check-in facts. Have a manager verify the record instead |
| `403` on Xác nhận / khiếu nại                                         | The account has no `public.users` row, or its role is neither `OWNER` nor `CHU`                                                                               |
| `/employee-status` lists only your own account                        | `get_employee_status` is `security invoker`, so the `users` SELECT policy decides: a policy that only exposes the caller's row shows a one-row roster                  |
| `/notifications`, `/api/requests` show "Unable to retrieve …" (500)   | Those tables were hand-made before SCRUM-41/48, so their `create table if not exists` never added the declared columns and the `requests_user_id_fkey` foreign key — run `supabase/sql/SCRUM-55_schema_gap_fill.sql`, then `SCRUM-56_requests_foreign_key.sql` if `/api/requests` is still 500 (read its Messages output: it reports the reason). The server log names the exact cause too (`column notifications.body does not exist`, `PGRST200 Could not find a relationship`) |
| `/employee-status` lists everyone as "Không có ca hôm nay"            | Nothing is scheduled (run `SCRUM-30_schedule.sql`, then add assignments) and/or nobody has checked in — the roster is derived from those two tables                             |
| "Unable to retrieve attendance." (or requests / schedule / employee status) | That screen's `GET` answered `500`; the banner is deliberately generic, so the real cause is in the server log (`Failed to …`). The usual reasons: the feature's SQL script is not applied yet — `SCRUM-41` for requests, `SCRUM-22` for employee status — or the session has no `public.users` row |
| `PGRST201` "more than one relationship was found for 'attendance' and 'users'" | Two foreign keys point at `users` (`employee_id` + `verified_by`, or `employee_id` + `created_by`), so PostgREST will not guess. The repositories name the foreign key explicitly (`employee:users!attendance_employee_id_fkey`) — keep that hint when editing a select |
| `PGRST202` "Could not find the function public.get_employee_status"   | The RPC is missing: run `supabase/sql/SCRUM-22_employee_status.sql`                                                                                                            |
| Sửa giờ / đổi vai trò answers `400` with "You cannot change your own…" | By design: an `OWNER` cannot demote or deactivate themselves, so the last owner cannot lock everyone out of the admin app                                                       |
| "Unable to retrieve the organization." (or 500 on `/organization`)   | `SCRUM-51_organizations.sql` is not applied — the `organizations` table and the join RPCs are missing                                                                          |
| `Unable to load user: stack depth limit exceeded` (500 on `/organization` and `/api/auth/session`) | The organization helpers still read `public.users` as `security invoker`, so the `users` policy re-enters itself. Run `supabase/sql/SCRUM-54_fix_organization_policy_recursion.sql`. The same error stops the `/onboarding` redirect, which makes the organization feature look missing after login |
| Login drops you on the dashboard although you are in no organization | Either `SCRUM-51` is not applied (the gate cannot read `organization_id` and skips itself rather than looping) or `SCRUM-54` has not fixed the profile read. Open `/onboarding` directly to check — it is reachable at any time |
| Every screen redirects to `/onboarding`                              | Not a bug: the signed-in account belongs to no organization yet. Create one there (you become its `OWNER`) or join with a code. `proxy.ts` owns that redirect              |
| `403` on join although the code is right                             | The account's email is not on that organization's register — this is the anti-outsider rule. The owner adds it on `/organization`; the message says so                      |
| `429` when joining                                                   | Ten failed join attempts by that account in the last hour (`organization_join_attempts` is both the trail and the throttle)                                                   |
| "The staff account service is not available." (`503`)                | The `staff-account` Edge Function is not deployed yet — deploy it (see "The `staff-account` Edge Function") or onboard people with an invite instead                          |
| `/organization` shows the amber "chức năng này chưa được bật" note   | Read the sentence: the probe (`GET /api/organizations/accounts`) says which case it is — `not_deployed` (deploy the function), `not_allowed` (your account needs an organization and `OWNER`/`CHU`), `unauthenticated` (turn "Verify JWT" back on) or `misconfigured` (the function answers 5xx: check its secrets and logs) |
| Attendance / revenue / schedules look empty after `SCRUM-53`         | The rows still have `organization_id = null`: the script's backfill only runs when exactly one organization exists. Assign them with the `update` statements printed at the end of that script, then re-run its second verification query |

## Related documents

| File / URL                            | Content                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `AGENTS.md` (imported by `CLAUDE.md`) | Rules for AI agents and contributors: architecture, conventions, boundaries, gotchas |
| `design.md`                           | Design system reference measured from the shipped screens: colour/type tokens, component recipes, screen conventions |
| `/api-docs`, `GET /api/swagger`       | Always-current API reference generated from the route JSDoc                          |
| `supabase/sql/SCRUM-*.sql`            | The authoritative schema: tables, indexes, RLS policies and RPC functions            |

This README documents the `hr_website` app only. The repository root (one level up) also contains
`hr_mobile_app` (Flutter) and `landing_website` (Next.js), each with its own documentation.

## Tổng quan nhanh (Tiếng Việt)

- **Đây là gì:** web admin quản lý nhân sự và vận hành ca cho Humora — khai báo doanh thu
  đầu/cuối ca, duyệt đơn từ, xếp ca, bảng công, trạng thái nhân viên, thông báo, tìm kiếm nhanh và trợ lý
  AI hỏi đáp chính sách/hợp đồng.
- **Công nghệ:** Next.js 16 (App Router) + TypeScript + Tailwind v4; Supabase (PostgreSQL, Auth, RLS, RPC)
  là toàn bộ backend; Gemini `gemini-embedding-001` (768 chiều) + `gemini-3.5-flash` cho trợ lý AI. Không có server API
  riêng và không dùng ORM.
- **Kiến trúc:** Clean Architecture — `app/api/**/route.ts` chỉ nhận request, xác thực rồi gọi đúng một use
  case; nghiệp vụ nằm trong `lib/usecases`; `lib/infrastructure` (Supabase, Gemini) triển khai các interface
  khai báo trong `lib/domain`.
- **Chạy dự án:** tạo `.env.local` gồm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `GEMINI_API_KEY`; chạy các script trong `supabase/sql/` bằng Supabase SQL Editor; sau đó `npm install` và
  `npm run dev`.
- **Tài liệu API:** mọi route phải có khối JSDoc `@swagger`; xem `/api-docs` hoặc `GET /api/swagger`.
  `public/swagger.json` là file sinh tự động, không sửa tay.
- **Trạng thái:** toàn bộ màn hình đã dùng Supabase thật — doanh thu, chi nhánh, cơ sở vật chất, lịch làm
  việc, đơn từ, bảng công (chấm công + vị trí theo bán kính chi nhánh + khiếu nại + xác minh và sửa giờ của
  quản lý), trạng thái nhân viên (RPC `get_employee_status`), quản lý nhân sự (vai trò, cho nghỉ việc),
  thông báo, tìm kiếm và chat AI; không còn dữ liệu mẫu
  (`lib/mock/adminStore.ts` đã bị xoá), check-in/out do app mobile ghi và web chỉ duyệt. Đã có màn hình đăng
  nhập `/login` và đăng ký `/register` (route `/api/auth/*` → use case → `SupabaseAuthService`) với
  `proxy.ts` chuyển hướng khi chưa có phiên; cần chạy `SCRUM-50_user_registration.sql` để tài khoản đăng ký
  có hồ sơ trong `public.users` (vai trò mặc định `EMPLOYEE`, quyền quản lý do chủ sở hữu cấp); chưa có test
  hay CI.
- **Múi giờ:** dữ liệu lưu ở UTC, ngày nghiệp vụ tính theo `Asia/Bangkok` (UTC+7).
