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
| `/attendance`      | Bảng công            | Timesheet review: giờ vào/ra, vị trí theo bán kính chi nhánh, khiếu nại (SCRUM-21/22/29) |
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
| AI assistant      | `@google/generative-ai` — `text-embedding-004` embeddings + `gemini-1.5-flash` answers |
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
| `GET /api/employee-status`           | session           | RPC `get_employee_status`     | One row per person for one business day (Asia/Bangkok), derived from the schedule + timesheet; filters `branch_id`, `work_date`                       |
| `GET /api/notifications`             | session           | `notifications`               | Paginated: `page` (≥1), `page_size` (≤100, default 20) → `{ data, total, page, page_size }`                                                          |
| `PATCH /api/notifications/{id}/read` | session           | `notifications`               | Marks one notification read; `400` if `id` is not a UUID, `404` if it does not belong to you                                                         |
| `GET /api/notifications/settings`    | session           | `notification_settings`       | Channel preferences of the caller                                                                                                                    |
| `PUT /api/notifications/settings`    | session           | `notification_settings`       | Body `{ settings: [{ channel, enabled }] }`, upserted per `(user_id, channel)`                                                                       |
| `GET /api/search`                    | session + profile | `users`, `requests`, `shifts` | `q` (≥2 characters) and `type=all\|users\|requests\|shifts`; up to 10 rows per group; `403` when the account has no user profile                     |
| `GET /api/branches`                  | session           | `branches`                    | Branch list sorted by name, including the GPS geofence (`latitude`, `longitude`, `attendance_radius`)                                                 |
| `POST /api/branches`                 | session           | `branches`                    | Body `{ name, address?, manager_id?, latitude?, longitude?, attendance_radius? }` → `201`; `400` when the coordinates or radius are invalid; writes need an `OWNER`/`CHU` role (RLS) |
| `PUT /api/branches/{id}`             | session           | `branches`                    | Replaces the editable fields of one branch; `400` if `id` is not a UUID, `404` when the branch is missing or not updatable                          |
| `GET /api/users`                     | —                 | `users`                       | `?id=<uuid>` → `{ id, full_name, role }`; `404` when unknown                                                                                         |
| `POST /api/chat/ask`                 | session           | Gemini + vector RPCs          | Body `{ question }` → `{ answer, sources[] }`; answers only from retrieved internal documents                                                        |
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

Tables the API touches: `users` (its `role` gates approvals — `OWNER`/`CHU`), `requests`, `shifts`
(the template catalogue), `shift_assignments` (the schedule), `attendance`, `daily_revenue`, `branches`,
`facilities`, `notifications`, `notification_settings`.

The AI assistant additionally depends on `match_company_documents` / `match_user_contracts` and their
embedding tables. Those objects are not covered by the scripts in this repository, so the chat endpoint
only works against a Supabase project where they already exist.

Rules for new database work:

- Add a **new** `supabase/sql/SCRUM-<n>_<name>.sql`; never edit a script that has already been applied.
- Keep scripts idempotent (`create table if not exists`, `drop policy if exists` before `create policy`),
  enable RLS on every new table and grant the narrowest policy (`auth.uid()` based).
- Timestamps are stored and served in **UTC**, while the business day is computed in **Asia/Bangkok
  (UTC+7, no DST)** — see `lib/usecases/businessDay.ts`. The unique index on `daily_revenue` uses the
  Bangkok date too, so a duplicate `409` can come from the database rather than from the use case.

## AI assistant (Trợ lý AI)

`POST /api/chat/ask` is a retrieval-augmented flow:

1. `GeminiLLMService.createEmbedding` embeds the question with `text-embedding-004`.
2. `SupabaseVectorSearchRepository` runs `match_company_documents` and `match_user_contracts` in parallel
   (five chunks each), keeping personal contracts scoped to the calling user.
3. The merged context goes to `gemini-1.5-flash`, which must answer **only** from that context, cite the
   source document, and return a fixed "không có thông tin" sentence when nothing matches.

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

- **Supabase-backed and real:** revenue open / close / report, branches (list, create, update with the GPS
  geofence), facilities (per-branch equipment registry), the shift catalogue and the weekly schedule,
  staff requests (list + role-gated approve/reject), attendance (timesheet, geofence verdict, complaints,
  manager verification), the live employee status RPC, notifications and notification settings, quick
  search, user lookup, and the AI assistant endpoint.
- **No demo data left:** `lib/mock/adminStore.ts` was deleted together with its last consumer, once
  trạng thái nhân viên moved to `get_employee_status`. Every screen now reads a table or an RPC.
- **UI prototypes:** the revenue, reports, notifications and chat screens render hard-coded demo data, and
  the header search simulates its results instead of calling `GET /api/search`. `app/branches/page.tsx` is
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
| Edits on Bảng công / Xếp ca disappear after a reload                  | Expected: those screens use the in-memory mock store                                                                           |
| `/schedules` shows the shift picker empty                             | `public.shifts` has no templates — run `supabase/sql/SCRUM-30_schedule.sql`, which seeds `Ca sáng` / `Ca chiều` / `Ca tối` / `Nghỉ` |
| Scheduling answers `409`, or `/schedules` shows no employee name      | `409` means the employee already has an overlapping shift that day (by design). A blank name means the `users` SELECT policy hides the profile from the embedded join |
| Every row of `/api/schedules` has `employee: null`                    | RLS on `public.users` does not let the caller read that profile; SCRUM-49's trigram index on `users.full_name` implies a directory read policy should exist |
| Duyệt đơn answers `403`                                               | The account has no `public.users` row, or its `role` is neither `OWNER` nor `CHU` — run `SCRUM-50` and promote the account |
| `/requests` lists nothing although rows exist                         | `requests_select_authenticated` (SCRUM-41) is missing, so RLS hides every row from the session                                                                |
| Bảng công is empty                                                    | `public.attendance` does not exist yet — run `supabase/sql/SCRUM-21_attendance.sql`; the rows themselves are inserted by the mobile check-in                             |
| An employee cannot correct their own check-in time                    | By design: `attendance_guard_self_update` lets them complete the record (giờ ra, ghi chú, khiếu nại) while only an `OWNER`/`CHU` may change the check-in facts. Have a manager verify the record instead |
| `403` on Xác nhận / khiếu nại                                         | The account has no `public.users` row, or its role is neither `OWNER` nor `CHU`                                                                               |
| `/employee-status` lists only your own account                        | `get_employee_status` is `security invoker`, so the `users` SELECT policy decides: a policy that only exposes the caller's row shows a one-row roster                  |
| `/employee-status` lists everyone as "Không có ca hôm nay"            | Nothing is scheduled (run `SCRUM-30_schedule.sql`, then add assignments) and/or nobody has checked in — the roster is derived from those two tables                             |

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
  là toàn bộ backend; Gemini `text-embedding-004` + `gemini-1.5-flash` cho trợ lý AI. Không có server API
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
  việc, đơn từ, bảng công (chấm công + vị trí theo bán kính chi nhánh + khiếu nại + xác minh của quản lý),
  trạng thái nhân viên (RPC `get_employee_status`), thông báo, tìm kiếm và chat AI; không còn dữ liệu mẫu
  (`lib/mock/adminStore.ts` đã bị xoá), check-in/out do app mobile ghi và web chỉ duyệt. Đã có màn hình đăng
  nhập `/login` và đăng ký `/register` (route `/api/auth/*` → use case → `SupabaseAuthService`) với
  `proxy.ts` chuyển hướng khi chưa có phiên; cần chạy `SCRUM-50_user_registration.sql` để tài khoản đăng ký
  có hồ sơ trong `public.users` (vai trò mặc định `EMPLOYEE`, quyền quản lý do chủ sở hữu cấp); chưa có test
  hay CI.
- **Múi giờ:** dữ liệu lưu ở UTC, ngày nghiệp vụ tính theo `Asia/Bangkok` (UTC+7).
