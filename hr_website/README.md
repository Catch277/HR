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
| `/revenue`         | Doanh thu            | Declare opening cash, count the drawer, reconcile closing revenue (SCRUM-39/40) |
| `/requests`        | Đơn từ               | Review leave / shift-swap / adjustment requests, approve or reject (SCRUM-41)   |
| `/shifts`          | Xếp ca               | Weekly shift schedule: create, update and delete assignments (SCRUM-33)         |
| `/employee-status` | Trạng thái nhân viên | Who is working, who has not started, who is on leave / resigned                 |
| `/attendance`      | Bảng công            | Timesheet per day and shift, with a complaint ("khiếu nại") flow                |
| `/reports`         | Báo cáo              | Revenue reporting and analysis screen (SCRUM-44 provides the aggregation API)   |
| `/notifications`   | Thông báo            | In-app notification feed and per-channel settings (SCRUM-48)                    |
| `/chat`            | Trợ lý AI            | Ask about internal policies and your own contract                               |
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
  `match_company_documents`, `match_user_contracts`) rather than done in JavaScript.

## Project structure

```text
hr_website/
├── app/
│   ├── api/                      Route handlers, one folder per resource (each with a `@swagger` block)
│   ├── api-docs/                 Swagger UI page
│   ├── <segment>/page.tsx        Screens: revenue, requests, shifts, attendance, employee-status,
│   │                             reports, notifications, chat (+ dashboard at app/page.tsx)
│   ├── layout.tsx                Shell: Sidebar + Header + Be Vietnam Pro font
│   └── globals.css
├── components/                   Header.tsx (quick search + user menu), Sidebar.tsx (navigation)
├── lib/
│   ├── domain/entities/          Plain interfaces; DB-backed fields stay snake_case
│   ├── domain/errors/            Typed error classes (RevenueAlreadyDeclaredError, ...)
│   ├── domain/repositories/      IRevenueRepository, INotificationRepository, ILLMService, ...
│   ├── usecases/                 One class per business action + businessDay.ts (Asia/Bangkok helper)
│   ├── infrastructure/           supabaseClient.ts, Supabase*Repository.ts, GeminiLLMService.ts
│   ├── mock/adminStore.ts        In-memory demo data for screens that have no table yet
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
answers `401` without one; **demo** means the route reads/writes the in-memory `lib/mock/adminStore.ts`.
Each route file documents itself with a JSDoc `@swagger` block.

| Method & path                        | Auth              | Data source                   | Notes                                                                                                                                                |
| ------------------------------------ | ----------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/revenue/open`             | session           | `daily_revenue`               | Body `{ branch_id, open_amount }` → `201`; `409` if the branch already declared today; `400` on bad input                                            |
| `PUT /api/revenue/close`             | session           | `daily_revenue`               | Body `{ branch_id, close_amount, close_note?, close_image_url? }` → `{ revenue, revenue_difference }`; `404` without an opening record               |
| `GET /api/revenue/report`            | session           | RPC `get_revenue_report`      | `branch_id?`, `period=day\|week\|month\|quarter\|year` (default `day`), `date=YYYY-MM-DD`; returns series, summary and period-over-period comparison |
| `GET /api/requests`                  | demo              | mock store                    | Filters `status`, `branch_id` (the value `all` disables a filter)                                                                                    |
| `PATCH /api/requests/{id}/review`    | demo              | mock store                    | `{ status: "APPROVED" \| "REJECTED", reject_reason? }`; a reason is required to reject; `404` for unknown id                                         |
| `GET /api/shifts`                    | demo              | mock store                    | Filters `branch_id`, `start_date`, `end_date`                                                                                                        |
| `POST /api/shifts`                   | demo              | mock store                    | Body `{ employee_id, date, branch_id, shift_id }` → `201`; `409` on overlapping or invalid data                                                      |
| `PATCH /api/shifts/{id}`             | demo              | mock store                    | Partial update of an assignment                                                                                                                      |
| `DELETE /api/shifts/{id}`            | demo              | mock store                    | Deletes an assignment (`404` when missing)                                                                                                           |
| `GET /api/attendance`                | demo              | mock store                    | Filters `branch_id`, `employee_id`                                                                                                                   |
| `POST /api/attendance/complaints`    | demo              | mock store                    | Body `{ attendance_id, complaint }` → `201` (the complaint flow in Bảng công)                                                                        |
| `GET /api/employee-status`           | demo              | mock store                    | Returns `{ updated_at, data }`                                                                                                                       |
| `GET /api/notifications`             | session           | `notifications`               | Paginated: `page` (≥1), `page_size` (≤100, default 20) → `{ data, total, page, page_size }`                                                          |
| `PATCH /api/notifications/{id}/read` | session           | `notifications`               | Marks one notification read; `400` if `id` is not a UUID, `404` if it does not belong to you                                                         |
| `GET /api/notifications/settings`    | session           | `notification_settings`       | Channel preferences of the caller                                                                                                                    |
| `PUT /api/notifications/settings`    | session           | `notification_settings`       | Body `{ settings: [{ channel, enabled }] }`, upserted per `(user_id, channel)`                                                                       |
| `GET /api/search`                    | session + profile | `users`, `requests`, `shifts` | `q` (≥2 characters) and `type=all\|users\|requests\|shifts`; up to 10 rows per group; `403` when the account has no user profile                     |
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
# Authenticated calls need the Supabase session cookie (copy it from the browser, or just use /api-docs).
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

The demo endpoints (`/api/requests`, `/api/shifts`, `/api/attendance`, `/api/employee-status`) need no
session, and their data resets whenever the server restarts.

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

Tables the API touches: `users` (its `role` gates approvals — `OWNER`/`CHU`), `requests`, `shifts`,
`daily_revenue`, `notifications`, `notification_settings`.

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

- **Supabase-backed and real:** revenue open / close / report, notifications and notification settings,
  quick search, user lookup, and the AI assistant endpoint.
- **Demo data:** `requests`, `shifts`, `attendance` and `employee-status` still run on
  `lib/mock/adminStore.ts` — state lives in module memory, resets on reload and is not shared between
  processes. Use cases and repositories for requests already exist (`ReviewRequestUseCase` +
  `SupabaseRequestRepository`), but `PATCH /api/requests/[id]/review` still calls the mock and does not
  authenticate.
- **UI prototypes:** the revenue, reports, notifications and chat screens render hard-coded demo data, and
  the header search simulates its results instead of calling `GET /api/search`.
- **No sign-in screen** ships in this repository: sessions come from Supabase Auth (cookie based), and the
  API answers `401` when there is none.
- **No tests, no CI, no Docker.** `npx tsc --noEmit` passes; `npm run lint` is currently red (~6521
  problems) mostly because committed bundle output under `hr_website/hr_website/.next/**` gets linted,
  plus four pages with pre-existing errors. Scope lint to the files you changed.

## Troubleshooting

| Symptom                                                               | Cause and fix                                                                                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.`  | `.env.local` is missing or incomplete — add both Supabase variables                                                            |
| `Missing GEMINI_API_KEY environment variable.`                        | Set `GEMINI_API_KEY`; only `/api/chat/ask` needs it                                                                            |
| Every API call answers `401`                                          | No Supabase session cookie — authenticate first (this repository ships no login screen yet)                                    |
| `npm run dev` / `npm run build` stops with "Không tìm thấy path nào…" | `scripts/generate-swagger.ts` found zero paths: one of the `@swagger` blocks no longer parses                                  |
| A query returns an empty list or `404` although rows clearly exist    | RLS is filtering by session (`auth.uid()`) — review the policies in `supabase/sql/*.sql`                                       |
| `409` when declaring opening revenue                                  | A declaration already exists for that branch and business day (Asia/Bangkok); the unique index catches concurrent requests too |
| `npm run build` fails while fetching fonts                            | Be Vietnam Pro comes from `next/font/google` and needs outbound network access                                                 |
| Edits on Bảng công / Xếp ca disappear after a reload                  | Expected: those screens use the in-memory mock store                                                                           |

## Related documents

| File / URL                            | Content                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| `AGENTS.md` (imported by `CLAUDE.md`) | Rules for AI agents and contributors: architecture, conventions, boundaries, gotchas |
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
- **Trạng thái:** doanh thu, thông báo, tìm kiếm và chat AI đã dùng Supabase thật; đơn từ, xếp ca, bảng công
  và trạng thái nhân viên còn dùng dữ liệu mẫu trong bộ nhớ (`lib/mock/adminStore.ts`); chưa có test, CI hay
  màn hình đăng nhập.
- **Múi giờ:** dữ liệu lưu ở UTC, ngày nghiệp vụ tính theo `Asia/Bangkok` (UTC+7).
