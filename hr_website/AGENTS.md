<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Working rules for AI coding agents on the **Humora HR Website**.
`CLAUDE.md` imports this file (`@AGENTS.md`) — keep this the single source of truth and
don't duplicate the rules there.

## Project

Next.js 16 (App Router) + TypeScript admin web app for the HR & shift operations of a
coffee-chain: per-shift revenue declaration, staff-request approval, shift scheduling,
attendance, employee status, notifications, quick search and an AI policy/contract
assistant. The backend is Supabase (PostgreSQL + Auth + RLS) — there is no custom API
server, no ORM and no background worker in this app.

| Layer          | Where                                   | Rule                                                                                                   |
| -------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Route handlers | `app/api/**/route.ts`                   | HTTP only: parse, authenticate, call one use case, map errors to status codes. No queries, no rules.    |
| Use cases      | `lib/usecases/*UseCase.ts`              | Business rules; depend only on `lib/domain` interfaces passed into the constructor.                     |
| Domain         | `lib/domain/**`                         | Entities, repository/service interfaces, typed errors. Framework-free (no Next.js or Supabase imports). |
| Infrastructure | `lib/infrastructure/**`                 | Implements domain interfaces: Supabase repositories and the Gemini LLM service.                         |
| UI             | `app/<segment>/page.tsx`, `components/` | App Router pages, Vietnamese copy, Tailwind v4 + lucide-react.                                          |

## Repository context

The git repository root is the **parent** directory `D:\HR`, which holds three separate apps:

```text
D:\HR\                <- repository root: README.md, package.json and node_modules are committed here
├── hr_website\       <- THIS app. Run every command from this folder.
├── hr_mobile_app\    <- separate Flutter client (has its own AGENTS.md)
└── landing_website\  <- separate Next.js landing site (has its own AGENTS.md)
```

- Always work from `hr_website/`; installing or building at `D:\HR` picks up the wrong `package.json`.
- Paths printed by `git status` / `git diff` are repo-relative (`hr_website/lib/...`).
- Committed build output already exists at `hr_website/hr_website/.next/**` — leave it alone and never add more of it.

## Commands

Run from `hr_website/` with **npm** (the lockfile is `package-lock.json`).

| Task                        | Command                                                                                   |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| Install                     | `npm install`                                                                             |
| Dev server                  | `npm run dev` (http://localhost:3000)                                                      |
| Production build            | `npm run build`                                                                           |
| Lint                        | `npm run lint`                                                                            |
| Typecheck                   | `npx tsc --noEmit`                                                                        |
| Regenerate the OpenAPI spec | `npx tsx scripts/generate-swagger.ts` (also runs automatically via `predev` / `prebuild`)  |
| Apply schema SQL            | manually in Supabase Dashboard → SQL Editor (see "Data & Supabase")                        |

Before reporting work as complete, run `npx tsc --noEmit` (passes today) and lint the files you touched,
e.g. `npx eslint app/api/revenue/report/route.ts lib/usecases/GetRevenueReportUseCase.ts`.
Do **not** use a bare `npm run lint` as the gate: it currently reports ~6521 problems
(1093 errors, 5428 warnings, exit 1) because the committed bundle output under
`hr_website/hr_website/.next/**` gets linted (only the root-anchored `.next/**` is ignored) and four pages
(`attendance`, `employee-status`, `requests`, `shifts`) carry pre-existing errors. Don't fix unrelated
findings and don't silence them — a global ignore change or those page fixes is a separate, approved task.
**There is no test runner in this repository** — never claim tests were run. Verify with the typecheck,
targeted lint, the endpoint or page you changed and `/api-docs`. Adding a test runner, CI or Docker is an
**ask first** change.

## Repo map

```text
hr_website/
├── app/                          # App Router
│   ├── api/<resource>/route.ts   # Route handlers (thin controllers)
│   ├── api/<resource>/[id]/...   # Nested resources (requests/[id]/review, notifications/[id]/read)
│   ├── api/swagger/route.ts      # Serves the generated public/swagger.json
│   ├── api-docs/                 # Swagger UI page
│   ├── <segment>/page.tsx        # Screens: revenue, requests, shifts, attendance,
│   │                             #          employee-status, reports, notifications, chat
│   ├── page.tsx                  # Dashboard
│   ├── layout.tsx                # Shell: Sidebar + Header + Be Vietnam Pro font
│   └── globals.css
├── components/                   # Header.tsx, Sidebar.tsx
├── lib/
│   ├── domain/entities/          # Plain interfaces (DB-backed fields stay snake_case)
│   ├── domain/errors/            # Typed error classes, one per case
│   ├── domain/repositories/      # I<Name>Repository / service interfaces
│   ├── usecases/                 # One class per business action + businessDay.ts helper
│   ├── infrastructure/           # supabaseClient.ts, Supabase*Repository.ts, GeminiLLMService.ts
│   ├── mock/adminStore.ts        # In-memory demo data for not-yet-migrated admin screens
│   └── swagger.ts                # OpenAPI definition + shared component schemas
├── scripts/generate-swagger.ts   # Builds public/swagger.json; exits 1 when no paths are found
├── supabase/sql/SCRUM-*.sql      # Idempotent schema/RLS/RPC scripts applied by hand
└── public/swagger.json           # Generated — never edit by hand
```

## Route handler recipe

Copy the shape of an existing Supabase-backed handler (`app/api/revenue/open/route.ts`) instead of
inventing one. The admin demo routes (`requests`, `shifts`, `attendance`, `employee-status`) read and
write `lib/mock/adminStore.ts` and deliberately skip the auth/use-case steps; when you migrate one of
them to a real table, follow this recipe and add its `supabase/sql/SCRUM-*.sql` script.

1. Export `async function GET|POST|PUT|PATCH|DELETE(request: Request | NextRequest)` — default export
   is not allowed here. Respond only with `NextResponse.json(body, { status })`.
2. Dynamic segments: `context: { params: Promise<{ id: string }> }`, then `const { id } = await context.params;`.
3. Parse the body with a local request type whose fields are `unknown`:
   `try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }`
4. Validate by hand — UUIDs against a module-level `UUID_PATTERN`, numbers with `Number.isFinite`,
   enums with a `Set` (`REPORT_PERIODS`), calendar dates with an explicit round-trip check. Return
   `400` with a message naming the offending fields. Never trust the payload, even for ids.
5. Authenticate: `const supabase = await createSupabaseServerClient();` then
   `const { data: { user }, error: authError } = await supabase.auth.getUser();` → `401` when
   `authError || !user`. Ownership fields (`created_by`, `closed_by`, `approver_id`) always come from
   `user.id`, never from the body.
6. Call exactly one use case: `await new ReviewRequestUseCase(new SupabaseRequestRepository()).execute({...})`,
   passing camelCase input.
7. Map failures: `instanceof` typed errors → `403`/`404`/`409`; anything else → `console.error("<action>", error)`
   and a generic `500` message. Never echo `error.message` or a stack trace from the catch-all branch.
8. Return `NextResponse.json(result)`; use `201` for created resources and shape-specific payloads
   (e.g. close revenue returns `{ revenue, revenue_difference }`).

## Code conventions

- Classes and interfaces: one per file, file named after the export, exported as a named export.
  `lib/` never uses default exports; `app/**/page.tsx`, `layout.tsx` and `components/` do, because Next.js requires it.
- Naming: use cases `XxxUseCase`, repositories `SupabaseXxxRepository implements IXxxRepository`,
  interfaces `IXxxRepository` / `ILLMService`, errors `XxxError` in `lib/domain/errors/`.
- Boundary naming: entities mirror DB columns in `snake_case` (`branch_id`, `created_at`, `is_read`);
  use-case inputs/params are `camelCase` (`branchId`, `closeAmount`). Repositories do the translation.
- Dependency injection through constructors only: `constructor(private readonly revenueRepository: IRevenueRepository)`.
  Infrastructure classes are instantiated in the route handler, never inside use cases or other infrastructure.
- Inject nondeterminism for repeatability: `private readonly now: () => Date = () => new Date()`
  (see `DeclareOpenRevenueUseCase`, `GetRevenueReportUseCase`).
- Domain errors extend `Error`, call `super("<message>")` and set `this.name = "<Class>"`.
  Repositories translate Supabase failures into them where the failure is expected (e.g. code `23505`
  → `RevenueAlreadyDeclaredError`); otherwise throw `new Error("<Verb> …: ${error.message}")`.
- No `any`. Narrow `unknown` with `typeof`/`in` checks; if a cast is unavoidable (Supabase RPC rows,
  `.data as T`), declare a local row type first and explain why in a comment. Supabase returns
  numeric columns as strings — coerce with `Number(...)` in the repository.
- `import type` for type-only imports; `async/await` only, no `.then()` chains; imports ordered
  `next/*` first, then `@/lib/...` (the `@/*` alias maps to the app root in `tsconfig.json`).
- Strict TypeScript is on (`strict: true`, `noEmit`); the build never emits JS from `tsc`.
- Comments explain *why* (timezone choice, RLS reasoning, generated-file warnings), not *what*.

## Data & Supabase

- Always get the client from `createSupabaseServerClient()` (`lib/infrastructure/supabaseClient.ts`).
  It is created per request from the App Router cookie store, so **RLS is the security boundary**:
  never add a service-role key, never build a second client, never bypass a policy in code.
- Repositories own every query. Select columns explicitly (never `*`), use `.maybeSingle()` when
  "no row" is a normal outcome, `.single()` when the row must exist, `.range()`/`{ count: "exact" }`
  for pagination, and throw on `error`.
- Aggregations and semantic search run through Supabase RPCs called from repositories:
  `get_revenue_report`, `match_company_documents`, `match_user_contracts`.
- Schema, indexes, RLS policies, triggers and RPCs live as plain SQL in `supabase/sql/SCRUM-<n>_<name>.sql`
  and must be **run by hand** in Supabase Dashboard → SQL Editor (there is no migration runner or Supabase CLI here).
  New scripts are idempotent (`create table if not exists`, `drop policy if exists` before `create policy`),
  enable RLS and grant the narrowest policy. Never edit a script that has already been applied — add a new one.
- Tables in use: `users` (with `role`: `OWNER`/`CHU` can review requests), `requests`, `shifts`,
  `daily_revenue`, `notifications`, `notification_settings`, plus the chat document/contract tables.
- Business time is **Asia/Bangkok (UTC+7, no DST)** while timestamps are stored/served in UTC.
  Convert with `Intl.DateTimeFormat` + `Date.UTC(y, m - 1, d, -7)` (`lib/usecases/businessDay.ts`,
  `GetRevenueReportUseCase`). Do not "simplify" this to the server timezone.
- `lib/mock/adminStore.ts` is in-memory demo data for screens that have no table yet (requests, shifts,
  attendance, employee status). Mutations reset on reload and are not shared between processes. When a
  feature becomes real, route it through a use case + repository rather than extending the mock store.

## API documentation

- Every `app/api/**/route.ts` starts with a JSDoc `@swagger` block: path, method, `summary`, `tags`,
  `parameters`/`requestBody` and every `responses` entry. An endpoint without that block is undocumented.
- Shared schemas live in `lib/swagger.ts` (`components.schemas`) and are referenced with
  `$ref: '#/components/schemas/...'`; errors use `ErrorResponse`. Add new shared shapes there, not inline.
- `public/swagger.json` is generated by `scripts/generate-swagger.ts` (`failOnErrors: true`, exits `1`
  when zero paths are found, wired to `predev`/`prebuild`). Never hand-edit it — regenerate it.
- Consumers: `/api-docs` renders Swagger UI, `GET /api/swagger` returns the JSON spec.
- Revenue flows are tracked as `SCRUM-39` (open), `SCRUM-40` (close), `SCRUM-44` (report),
  `SCRUM-48` (notifications), `SCRUM-49` (quick search) — cite the ticket in the code docs you touch.

## UI & i18n conventions

- New screens are `app/<segment>/page.tsx`; register them in `components/Sidebar.tsx` (lucide-react icon
  + Vietnamese label) so navigation stays complete. `app/layout.tsx` owns the shell and the
  Be Vietnam Pro font; only add `"use client"` when state, effects or browser APIs are used.
- Tailwind CSS v4 (no `tailwind.config.*`; the PostCSS plugin is `@tailwindcss/postcss`). Reuse the
  existing visual language: primary `#0C66E4` with `blue-50` tints, surfaces `#F8F9FF`/`#F3F6FC`,
  `rounded-xl`/`rounded-2xl`, `border-slate-200/80`, small uppercase section labels, `lucide-react` icons.
- Currency via `new Intl.NumberFormat("vi-VN")`, dates/sizes as `vi-VN`; keep copy in Vietnamese.
- Most pages currently render hard-coded demo data and the header search is simulated. Wire a page to
  `/api/*` only when the task calls for it, and preserve the existing layout and loading/empty states.
- Language: code, identifiers and English-style comments stay in English. The Chat AI module
  (`ChatAnswerUseCase`, `GeminiLLMService`, `lib/domain/entities/ChatMessage.ts` and the `@swagger` text of
  `/api/chat/ask`) is documented in Vietnamese — keep that module consistent. Do not mass-translate
  existing API error messages or `@swagger` text: clients and docs may already rely on the wording.

## Boundaries

**Never, without being asked:**

- Commit `.env.local` or any secret, real staff data or salary figures. Required variables (gitignored,
  and there is no `.env.example` yet): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `GEMINI_API_KEY`.
- Edit generated output: `public/swagger.json`, `next-env.d.ts`, anything under `.next/`.
- Add more tracked build output (the repo already contains junk at `hr_website/hr_website/.next/**`).
- Modify a `supabase/sql/*.sql` script that has already been applied — add a new one.
- Change a route's response shape, status codes or error wording that existing UI code consumes.
- Run `git push --force`, `git reset --hard`, `git checkout -- .`, or otherwise rewrite history or
  discard uncommitted work.
- Weaken or bypass RLS, or swap the request-scoped Supabase client for an admin/service-role client.
- Remove or downgrade lint/type checks (or add ignores) to make something pass.
- Touch the sibling apps `hr_mobile_app/` and `landing_website/` from here.

**Ask first:**

- Adding, upgrading or removing a dependency (including a test runner, state library or UI kit).
- Changing CI, Docker, deployment or build configuration — none exists yet, so this is a design decision.
- Anything touching auth, sessions, RLS policies, PII, payroll or salary data.
- Changing the Gemini models, prompts or API usage in `GeminiLLMService` (costs money and changes answers).

## Git & PRs

- The repository root is `D:\HR`; branch from `main` using `feat/…`, `fix/…` or `chore/…`.
- Conventional commits (`feat(api): add revenue report filters`), one logical change per commit,
  diffs kept reviewable (roughly under ~400 lines).
- Mention the SCRUM ticket (`SCRUM-44`) in the commit or PR when the work maps to one.
- PR description: what changed, why, and how you verified it (commands run, endpoints and pages checked).
- Stage only files this task touched: `git status` is repo-root relative, and unrelated churn in
  sibling apps must not be part of the change.

## Gotchas

- `npm run dev` and `npm run build` first run `scripts/generate-swagger.ts`; a broken `@swagger` block
  makes the script exit `1` and the dev server or build never starts.
- Missing env vars fail at runtime with a thrown error (`createSupabaseServerClient`, `GeminiLLMService`),
  not at build time — a page that throws "Missing NEXT_PUBLIC_SUPABASE_URL…" means `.env.local` is absent.
- `npm run build` may need outbound access to `fonts.googleapis.com` (Be Vietnam Pro via `next/font/google`).
- `next dev` re-adds the managed block at the top of this file; keep it, or every run leaves a dirty diff.
- Turbopack is pinned to the app folder via `root: process.cwd()` in `next.config.ts` — the parent
  `D:\HR` also has a `package.json`/`node_modules`, so don't remove that setting.
- `npm run lint` is currently red for reasons unrelated to any single task (see "Commands"): the
  committed bundles under `hr_website/hr_website/.next/**` are linted and four admin pages have known
  errors. Scope lint to the files you changed; changing the ignore pattern or those pages needs approval.
- Supabase numeric columns come back as strings; repositories coerce with `Number(...)`.
- RLS decides visibility, so the same query returns different rows per session — check the policies in
  `supabase/sql/*.sql` before debugging an "empty" or "not found" result, and remember RPCs must respect
  `auth.uid()`.
- A missing `users` row for a signed-in account is a `403` (see `/api/search`), not a `401` — `401` means
  no session at all. `users.role` gates approvals (`OWNER`/`CHU` in `ReviewRequestUseCase`), but
  `PATCH /api/requests/[id]/review` still runs on the mock store without auth; migrating it means wiring
  `ReviewRequestUseCase` + `SupabaseRequestRepository`, not patching the mock.
- Dates: store and serve UTC (`toISOString()`), compute business days in `Asia/Bangkok` — the unique index
  on `daily_revenue` also uses the Bangkok date, so a "duplicate" 409 can come from the database, not the use case.

## Tóm tắt (Tiếng Việt)

- Đây là web admin Next.js 16 (App Router) của **Humora HR**, dùng Supabase (PostgreSQL + Auth + RLS) làm backend.
- Kiến trúc Clean Architecture: `lib/domain` (entities, interfaces, errors) → `lib/usecases` (nghiệp vụ)
  → `lib/infrastructure` (Supabase repositories, Gemini). Route handler trong `app/api/**/route.ts` chỉ
  nhận request, xác thực, gọi đúng một use case rồi map lỗi sang mã HTTP.
- Chạy lệnh trong thư mục `hr_website/`: `npm run dev`, `npx tsc --noEmit`, `npm run build`.
  Chưa có test runner trong dự án; `npm run lint` còn lỗi tồn đọng nên chỉ lint các file mình sửa.
- Mọi route API phải có khối JSDoc `@swagger`; schema dùng chung khai báo trong `lib/swagger.ts`,
  file `public/swagger.json` là file sinh tự động, không sửa tay.
- Thay đổi CSDL viết thành file SQL mới trong `supabase/sql/` và chạy thủ công trong Supabase SQL Editor;
  không sửa file đã chạy.
- Thời gian nghiệp vụ theo `Asia/Bangkok` (UTC+7), dữ liệu lưu ở UTC; không tự ý đổi múi giờ.
