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
| Infrastructure | `lib/infrastructure/**`                 | Implements domain interfaces: Supabase repositories, the Gemini LLM service and the Nominatim reverse geocoder. |
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
Do **not** use a bare `npm run lint` as the gate: on a clean tree it reports ~6,512 problems
(1,088 errors, 5,424 warnings, exit 1) because the committed bundle output under
`hr_website/hr_website/.next/**` gets linted (only the root-anchored `.next/**` is ignored). No page or
route carries a lint error any more, so the count is not a quality signal about this app: untracked
dev-server output in that same folder can double it — run `git clean -f -- hr_website/hr_website` before
measuring. Don't fix unrelated findings and don't silence them — changing the ignore pattern is a
separate, approved task.
**There is no test runner in this repository** — never claim tests were run. Verify with the typecheck,
targeted lint, the endpoint or page you changed and `/api-docs`. Adding a test runner, CI or Docker is an
**ask first** change.

## Repo map

```text
hr_website/
├── app/                          # App Router
│   ├── api/_lib/requireCaller.ts # requireCaller() / requireCapability("…") — session + role gate (SCRUM-59)
│   ├── api/<resource>/route.ts   # Route handlers (thin controllers)
│   ├── api/<resource>/[id]/...   # Nested resources (requests/[id]/review, notifications/[id]/read)
│   ├── api/swagger/route.ts      # Serves the generated public/swagger.json
│   ├── api-docs/                 # Swagger UI page
│   ├── <segment>/page.tsx        # Screens: revenue, requests, shifts, attendance,
│   │                             #          employee-status, reports, notifications, chat
│   ├── page.tsx                  # Dashboard
│   ├── layout.tsx                # Shell: Sidebar + Header + Be Vietnam Pro font
│   └── globals.css
├── components/                   # Header.tsx, Sidebar.tsx, ProfileProvider.tsx, LocationPickerMap*.tsx (Leaflet)
├── lib/
│   ├── accessPolicy.ts           # Capability table + screen→capability map (SCRUM-59)
│   ├── domain/branchScope.ts     # canManageBranch() / defaultBranchId() — who may manage a branch (SCRUM-61)
│   ├── domain/entities/          # Plain interfaces (DB-backed fields stay snake_case)
│   ├── domain/errors/            # Typed error classes, one per case
│   ├── domain/repositories/      # I<Name>Repository / service interfaces
│   ├── domain/roles.ts           # OWNER / MANAGER / EMPLOYEE, normalizeRole() (CHU → MANAGER)
│   ├── usecases/                 # One class per business action + businessDay.ts helper
│   │                             # + branchScope.ts (assertBranchManagedBy, SCRUM-61)
│   ├── infrastructure/           # supabaseClient.ts, Supabase*Repository.ts, GeminiLLMService.ts,
│   │                             # NominatimReverseGeocodingService.ts, EdgeFunctionStaffProvisioningService.ts
│   ├── publicPaths.ts            # Screens rendered outside the shell (proxy.ts + Header/Sidebar)
│   ├── geo/vietnamOutline.ts     # Generated Vietnam land outline — never edit by hand
│   ├── geo/vietnam.ts            # isInsideVietnam() point-in-polygon + VIETNAM_BOUNDS envelope
│   └── swagger.ts                # OpenAPI definition + shared component schemas
├── scripts/generate-swagger.ts   # Builds public/swagger.json; exits 1 when no paths are found
├── scripts/ingest-knowledge.ts   # docs/*.md → chunks + embeddings → supabase/sql/knowledge_seed.sql
├── scripts/extract-vietnam-outline.mjs # Natural Earth 1:10m → lib/geo/vietnamOutline.ts (manual regen)
├── docs/                         # Source documents for the AI knowledge base (README.md is skipped)
├── supabase/sql/SCRUM-*.sql      # Idempotent schema/RLS/RPC scripts applied by hand
└── public/swagger.json           # Generated — never edit by hand
```

## Route handler recipe

Copy the shape of an existing Supabase-backed handler (`app/api/revenue/open/route.ts`) instead of
inventing one. Every route is Supabase-backed now — the in-memory mock store was deleted once the last
screen (employee status) moved to the `get_employee_status` RPC — so a new resource follows this recipe
end to end and adds its own `supabase/sql/SCRUM-*.sql` script. The reference implementations are
`app/api/branches/route.ts` (shared `_lib` parser, write path), `app/api/schedules/route.ts` (embedded
selects, `409` on a business conflict), `app/api/attendance/route.ts` (many filters, RPC-backed sibling
in `app/api/employee-status/route.ts`) and `app/api/users/[id]/route.ts` (role-gated update with the rules
that must not live in SQL).

1. Export `async function GET|POST|PUT|PATCH|DELETE(request: Request | NextRequest)` — default export
   is not allowed here. Respond only with `NextResponse.json(body, { status })`.
   When two handlers of the same resource validate the same body, share the parser from a private folder
   (`app/api/<resource>/_lib/<name>.ts` — `_folder` is opted out of routing) instead of duplicating it or
   pushing HTTP parsing into a use case. `app/api/branches/_lib/branchRequest.ts` is the reference.
2. Dynamic segments: `context: { params: Promise<{ id: string }> }`, then `const { id } = await context.params;`.
3. Parse the body with a local request type whose fields are `unknown`:
   `try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }`
4. Validate by hand — UUIDs against a module-level `UUID_PATTERN`, numbers with `Number.isFinite`,
   enums with a `Set` (`REPORT_PERIODS`), calendar dates with an explicit round-trip check. Return
   `400` with a message naming the offending fields. Never trust the payload, even for ids.
   An *optional* field is omitted **or `null`**, because screens clear them with `value || null`
   (`close_note: closeNote.trim() || null`): test it as
   `value === undefined || value === null || typeof value === "string"` — never as
   `value !== undefined && typeof value !== "string"`, which rejects `null` and turns the ordinary
   "left blank" case into a `400` (that is what made `PUT /api/revenue/close` fail whenever the note
   box was empty, while typing a note worked). `app/api/branches/_lib/branchRequest.ts` and
   `app/api/organizations/invites/route.ts` are the references.
5. Authenticate and authorize in one call: `const caller = await requireCapability("schedule:manage");`
   then `if (!caller.ok) return caller.response;` (`app/api/_lib/requireCaller.ts`) — it answers `401`
   without a session, `403` without a `users` row and `403` when the role does not hold that capability,
   which is the same table `proxy.ts`, the sidebar and the pages read (`lib/accessPolicy.ts`). Use the
   bare `requireCaller()` only for a route every signed-in member may call, and the raw
   `createSupabaseServerClient()` + `supabase.auth.getUser()` pair only when a route needs the session
   for something else (e.g. `GET /api/branches`). Ownership fields (`created_by`, `closed_by`,
   `approver_id`, `corrector_id`) always come from `caller.userId`, never from the body — and pass
   `caller.role` into a use case that re-checks the rule.
   A capability is the *first* of three layers, not the only one: the use case repeats the rule for the
   caller it is given and RLS (`is_organization_manager()` / `is_organization_owner()`, SCRUM-59/60) is
   what actually decides which rows exist.
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
  `get_revenue_report`, `get_employee_status`, `match_company_documents`, `match_user_contracts`.
  A reporting RPC must be `security invoker` (the default) so RLS still filters what the caller sees,
  and its date default must be computed in Asia/Bangkok, not from `current_date`.
- Schema, indexes, RLS policies, triggers and RPCs live as plain SQL in `supabase/sql/SCRUM-<n>_<name>.sql`
  and must be **run by hand** in Supabase Dashboard → SQL Editor (there is no migration runner or Supabase CLI here).
  New scripts are idempotent (`create table if not exists`, `drop policy if exists` before `create policy`),
  enable RLS and grant the narrowest policy. Never edit a script that has already been applied — add a new one.
- Tables in use: `users` (with `role` — `OWNER`/`MANAGER` can review requests, run the timesheet and the
  schedule, and manage the facilities and revenue, while only `OWNER` manages branches, staff accounts and
  the organization itself (SCRUM-59) — and
  `is_active`, false meaning the account left the company), `organizations` /
  `organization_join_codes` / `organization_invites` / `organization_join_attempts` (SCRUM-51: the
  tenant, its join code, the register of accounts that may spend that code, and the join audit trail),
  `requests`,
  `shifts` (**the shift template catalogue** — name + hours, written by SCRUM-30, seeded per organization by
  SCRUM-58 and read by quick search),
  `shift_assignments` (the schedule: one employee × one template × one `work_date`), `attendance` (the
  timesheet: one employee × one `work_date`, GPS point + distance, photo, complaint, verification),
  `facilities`, `daily_revenue`, `branches`, `notifications`, `notification_settings`, plus the chat
  document/contract tables.
- Business time is **Asia/Bangkok (UTC+7, no DST)** while timestamps are stored/served in UTC.
  Convert with `Intl.DateTimeFormat` + `Date.UTC(y, m - 1, d, -7)` (`lib/usecases/businessDay.ts`,
  `GetRevenueReportUseCase`). Do not "simplify" this to the server timezone.
- `lib/mock/adminStore.ts` was deleted with SCRUM-22: there is no demo data left, and every screen reads a
  table or an RPC. Do not reintroduce a mock store — a screen that has no table yet is a prototype that
  should say so in its own file, not a shared in-memory module.

## API documentation

- Every `app/api/**/route.ts` starts with a JSDoc `@swagger` block: path, method, `summary`, `tags`,
  `parameters`/`requestBody` and every `responses` entry. An endpoint without that block is undocumented.
- Shared schemas live in `lib/swagger.ts` (`components.schemas`) and are referenced with
  `$ref: '#/components/schemas/...'`; errors use `ErrorResponse`. Add new shared shapes there, not inline.
- `public/swagger.json` is generated by `scripts/generate-swagger.ts` (`failOnErrors: true`, exits `1`
  when zero paths are found, wired to `predev`/`prebuild`). Never hand-edit it — regenerate it.
- Consumers: `/api-docs` renders Swagger UI, `GET /api/swagger` returns the JSON spec.
- Revenue flows are tracked as `SCRUM-39` (open), `SCRUM-40` (close), `SCRUM-44` (report),
  `SCRUM-48` (notifications), `SCRUM-49` (quick search), the timesheet as `SCRUM-21` with review
  (corrections + khiếu nại) as `SCRUM-23`, staff administration as `SCRUM-24`, and the tenant model
  as `SCRUM-51` (organizations, join code, register, join RPCs), `SCRUM-52` (owner-created accounts
  through the `staff-account` Edge Function), `SCRUM-53` (organization scoping of the operational
  tables), `SCRUM-59` (the three-level role model: `CHU` → `MANAGER`, `is_organization_owner()`, the
  owner-only policies) and `SCRUM-60` (the per-role *read* scope) — cite the ticket in the code docs you
  touch. Branch management is ticket `SCRUM-61` (a chi nhánh trưởng only writes the branch they head,
  deleting a branch is owner-only and refuses while it still has data).

## UI & i18n conventions

- New screens are `app/<segment>/page.tsx`; register them in `components/Sidebar.tsx` (lucide-react icon
  + Vietnamese label) so navigation stays complete (add it to `SHELL_LESS_PATHS` in
  `lib/publicPaths.ts` instead when it must render without the navigation, as `/onboarding` and
  `/change-password` do). A screen that is a one-off setup step rather than a daily destination belongs
  in neither list: `/organization` is reached from onboarding and from the organization card in the
  sidebar footer, and `proxy.ts` redirects an account without an organization to `/onboarding`, so the
  card link serves the owner and the newcomer alike. `app/layout.tsx` owns the shell and the
  Be Vietnam Pro font; only add `"use client"` when state, effects or browser APIs are used.
- Tailwind CSS v4 (no `tailwind.config.*`; the PostCSS plugin is `@tailwindcss/postcss`). Reuse the
  existing visual language: primary `#0C66E4` with `blue-50` tints, surfaces `#F8F9FF`/`#F3F6FC`,
  `rounded-xl`/`rounded-2xl`, `border-slate-200/80`, small uppercase section labels, `lucide-react` icons.
- **Never write a literal hex in a component.** Use the semantic tokens from `app/globals.css`:
  `bg-surface` (panels — replaced every `bg-white`), `bg-app` (page canvas), `bg-surface-muted`,
  `bg-canvas`, `bg-primary` / `text-primary` / `border-primary` / `hover:bg-primary-strong`. They resolve
  per theme, which is what makes the dark mode work; a hex cannot. Need a new colour? Add a token, and
  remember `--color-white` is shared by `bg-surface` and `text-white`, so it is never re-pointed.
- Theme: `components/ThemeToggle.tsx` (Sáng / Tối / Theo hệ thống) writes `localStorage["humora-theme"]`
  and toggles `.dark` on `<html>`; `app/layout.tsx` applies it before first paint with an inline script
  (keep `suppressHydrationWarning` on `<html>`), and `.dark` re-points Tailwind's palette variables so
  screens need no `dark:` variants. Use `dark:` only for a genuine exception (e.g. the Swagger UI frame).
- Currency via `new Intl.NumberFormat("vi-VN")`, dates/sizes as `vi-VN`; keep copy in Vietnamese.
- Every screen is Supabase-backed: `/` (Tổng quan), `/revenue`, `/reports`, `/notifications` and `/chat`
  (Trợ lý AI → `POST /api/chat/ask`) all fetch `/api/*`, and so do the two header widgets — the search box
  (`GET /api/search`) and the bell badge (`GET /api/notifications?unread=true&page_size=1`, where `total`
  is the unread count). `/chat` is stateless — the endpoint takes one question and answers
  `{ answer, sources }` — so the conversation lives in component state and the screen must not invent a
  history, a confidence score or a step list. Wire a page to `/api/*` with real data when a task calls for
  it, and preserve the existing layout and loading/empty states.
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
- Weaken or bypass RLS, or swap the request-scoped Supabase client for an admin/service-role client. The
  single privileged path is the `staff-account` Edge Function: it authorizes the *caller's* JWT, requires
  `OWNER` of an organization, and its service-role key stays in Supabase's own secrets — never in
  this app, its env files or a client bundle.
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
  committed bundles under `hr_website/hr_website/.next/**` are linted. Scope lint to the files you
  changed; changing the ignore pattern needs approval.
- Supabase numeric columns come back as strings; repositories coerce with `Number(...)`.
- RLS decides visibility, so the same query returns different rows per session — check the policies in
  `supabase/sql/*.sql` before debugging an "empty" or "not found" result, and remember RPCs must respect
  `auth.uid()`.
- A missing `users` row for a signed-in account is a `403` (see `/api/search`), not a `401` — `401` means
  no session at all. `users.role` gates approvals (`OWNER`/`MANAGER` through `request:review` in
`ReviewRequestUseCase`), and
  `PATCH /api/requests/[id]/review` now runs on the real `requests` table: the route reads the role from
  the session's profile, the use case rejects other roles and the `requests_update_managers` policy
  (SCRUM-41) repeats that check in the database. Never go back to trusting a role sent in the body.
- Dates: store and serve UTC (`toISOString()`), compute business days in `Asia/Bangkok` — the unique index
  on `daily_revenue` also uses the Bangkok date, so a "duplicate" 409 can come from the database, not the use case.
- `public.users` has **no script of its own** — it was hand-created in the dashboard before any ticket, which
  is why `SCRUM-50_user_registration.sql` only fills the gaps (`create table if not exists` + `add column if
  not exists`) and why nothing but that trigger creates the profile row for a new auth account. Add a public
  screen (like `/register`) by extending `lib/publicPaths.ts`; `proxy.ts`, `Header` and `Sidebar` all read it.
  SCRUM-50 also created the narrow `users_select_own` read policy; `SCRUM-24_staff_admin.sql` replaced it with
  `users_select_authenticated` (the staff directory) and added `users_update_managers`, so that is where the
  read and write rules live now.
- `public.notifications`, `public.notification_settings` and `public.requests` were hand-made the same way, so
  `SCRUM-48` and `SCRUM-41` — both written with `create table if not exists` — never added what they declare:
  `notifications` had `content` instead of `body` and neither `related_entity_*` column, `notification_settings`
  had no `id`, and `requests` had no `requests_user_id_fkey`. `SCRUM-55_schema_gap_fill.sql` is the gap-fill
  (columns, the `content` → `body` copy, the key, the FK, and SCRUM-48's indexes/trigger/policies restated
  idempotently). A 500 from `/api/notifications`, `/api/notifications/settings` or `/api/requests` almost
  always means it has not been applied yet.
- When a screen answers 500 and the route logs a generic message, the database speaks plainly through
  PostgREST: `GET {NEXT_PUBLIC_SUPABASE_URL}/rest/v1/<table>?select=<column>&limit=1` with the anon key answers
  `42703 column ... does not exist` for a missing column and `PGRST200 Could not find a relationship ...` for
  a missing foreign key (RLS hides rows, not the error). That is how the SCRUM-55 gaps were found — the
  `latest` browser session is not needed, and nothing sensitive is returned.
- `public.shifts` is a shift **template** ("Ca sáng", 08:00–17:00) and `public.shift_assignments` is the
  schedule — do not merge them. Overlap detection lives in the use case
  (`lib/usecases/shiftOverlap.ts`) because only it can compare the hours of two templates; the database only
  guards the exact duplicate with a unique index on `(employee_id, work_date, shift_id)`.
- The shift catalogue is **per organization** (SCRUM-53 put `organization_id = current_organization_id()`
  into `shifts_select_authenticated`), while SCRUM-30's four seeds were written before the column existed,
  so they carry `organization_id = null` and are invisible to every signed-in member. That is why the
  "Ca làm việc" picker on `/schedules` could be empty while the screen was healthy: reading worked, there
  was nothing to read. `supabase/sql/SCRUM-58_shift_catalogue.sql` adopts those legacy rows when the project
  has exactly one organization, seeds the standard names for every organization that is missing one and adds
  an `after insert` trigger on `public.organizations` so a new tenant is seeded on creation — nothing in the
  app can insert a template (`shifts` has a SELECT policy only), so the database is the only owner of the
  catalogue.
- `/schedules` picks the employee from the SCRUM-24 directory (`GET /api/users`), not from `/api/search`:
  the picker needs `is_active` to leave out the accounts that have quit, and the directory already holds the
  name, role and that flag. A non-manager gets `403` from the directory and reads "chỉ chủ sở hữu/quản lý
  mới xem được danh sách nhân sự" — acceptable, because `shift_assignments_insert_managers` lets only
  `OWNER`/`MANAGER` write a shift at all. The exclusion is deliberately a **UI** rule: somebody deactivated after
  being scheduled keeps their assignment (it stays editable and is shown with `(đã nghỉ)`), so a blanket
  check inside `CreateShiftAssignmentUseCase` would break that legitimate edit.
- Embedded PostgREST selects (`employee:users (id, full_name)`) defeat the client's type inference: `data`
  comes back as `GenericStringError`, so those casts go through `unknown` and the row type is normalised in
  the repository. A to-one embedding can also arrive as an array, so normalise with a `firstOf` helper.
- An embed must **name its foreign key** whenever the target table is reachable twice:
  `employee:users!attendance_employee_id_fkey (id, full_name)`. `attendance` (employee + verifier +
  corrector), `shift_assignments` (employee + creator), `requests` (requester + approver) and the records
  tables all point at `users` more than once, and PostgREST answers `PGRST201` ("more than one relationship
  was found") instead of guessing — a 500 on an otherwise healthy screen. Add a third FK to a table and every
  unqualified embed into it breaks at runtime, not at compile time.
- The tenant model (SCRUM-51/53) lives in RLS and `security definer` RPCs, not in application logic:
  `join_organization` demands **both** the right code *and* a register row for the caller's email (so a
  leaked or guessed code is useless to an outsider), `create_organization` is what makes somebody an
  `OWNER` — registering grants nothing — and every operational table carries `organization_id` whose
  column default is `current_organization_id()` (that is why the mobile check-in needed no change).
  `proxy.ts` owns the two onboarding redirects (`/onboarding` while the account has no organization,
  `/change-password` while `must_change_password` is set) and skips them when the `users` row or those
  columns are missing, so a half-applied database cannot lock everyone out.
- The two policy helpers — `public.current_organization_id()` and `public.is_organization_manager()` —
  must stay **`security definer`** (SCRUM-54). Both read `public.users`, and the `users` policies call
  them, so as invoker functions the policy re-enters itself on the inner read and every profile read
  fails with `stack depth limit exceeded`; the same error silently disables the `/onboarding` redirect,
  which is what makes the organization feature look missing after login. Never "simplify" them back to
  invoker, and never inline a `select … from public.users` into a policy on `users`.
  `public.is_organization_owner()` (SCRUM-59) is the third one and follows the same rule.
- The three-level role model (SCRUM-59/60) is one table in the app and one set of policies in the database,
  and they must agree:
  - `lib/domain/roles.ts` owns the vocabulary (`OWNER`/`MANAGER`/`EMPLOYEE`, `normalizeRole` mapping the
    legacy `CHU` → `MANAGER`) and `lib/accessPolicy.ts` owns the capability table plus the
    screen→capability map. Compare roles only through those two files — never `role === "CHU"`.
  - `requireCapability("…")` (`app/api/_lib/requireCaller.ts`) is what a route handler starts with, and
    `useProfile().can("…")` (`components/ProfileProvider.tsx`) is what hides a control the role may not
    use. Adding a screen means adding its capability to `SCREEN_ACCESS` (`proxy.ts` bounces a deep link
    and `Sidebar` filters the link with the same row) and a page whose buttons a lower role may not press
    has to hide them — a `403` a click away is a bug in the page, not a feature.
  - The middle level is `MANAGER`; `CHU` survives only as an alias in `normalizeRole` and in the
    pre-SCRUM-59 SQL scripts (never edit an applied script — the rename lives in `SCRUM-59_role_model.sql`).
  - Deploy order is `SCRUM-59` → app **and** the redeployed `staff-account` Edge Function (its
    `INVITE_ROLES` and owner check used to spell `CHU`) → `SCRUM-60`, because `SCRUM-60` narrows reads that
    an older bundle would still be querying → `SCRUM-61` together with the build that ships it, since the
    branch scope only makes writes stricter.
- The branch scope (SCRUM-61) is the third axis of the role model, and it lives in the same three places:
  the capability table, the use cases and RLS.
  - `lib/domain/branchScope.ts` is the only copy of the rule — `canManageBranch(branch, viewer)` (the
    organization's `OWNER`, or the account named in `branches.manager_id`) plus `defaultBranchId()` for the
    screens — and `assertBranchManagedBy(repository, branchId, caller)`
    (`lib/usecases/branchScope.ts`) is what a use case calls. Never re-implement the comparison
    (`branch.manager_id === caller.userId`) in a route or a page: the two would drift.
  - The guard answers `403` (another branch) or `404` (unknown branch) *before* the write, so RLS never has
    to express the rule as "silently matched no row", which the caller would read as "not found".
  - Write policies ask `public.heads_branch(branch_id)` instead of `is_organization_manager()` — on
    `branches`, `daily_revenue`, `shift_assignments`, `attendance`, `facilities` and `requests` — so a
    manager who heads no branch writes nothing while still *reading* the organization (SCRUM-60). The
    helper must stay `security definer`: it reads `branches` from a policy on `branches`, which as an
    invoker function re-enters itself.
  - A branch head is a `MANAGER` and nothing else (SCRUM-63 narrowed the SCRUM-61 rule): the picker on
    `/branches` filters the directory through `isBranchHeadRole`, and `assertBranchManagerExists` answers `400`
    (`BranchManagerRoleError`) for an employee *and for the organization's owner* — the owner stands above
    every branch instead of running one. `heads_branch()` still accepts an owner so a legacy `manager_id`
    keeps working, but it grants them nothing beyond `is_organization_owner()`, and the screen flags such a
    branch as "cần gán quản lý chi nhánh" rather than pretending it is covered. Compare the role through
    `lib/domain/roles.ts` only — never re-implement the test next to it.
  - Editing a branch needs `branch:update` (a manager, their own branch); creating and deleting need
    `branch:manage` (owner only). `branches_guard_manager_change` keeps `manager_id` an owner decision —
    that column *is* the scope a manager holds, so a head editing it could hand the branch on or take a
    second one. `branches_guard_delete` refuses a branch that still has attendance, schedule, facility or
    revenue rows (the API answers the same `409` with the counts): the cascades would otherwise delete
    operational history silently, and `daily_revenue.branch_id` has no foreign key at all.
  - The screens show the restriction rather than a `403` a click away: a branch the caller does not head is
    a `disabled` option ("— chỉ xem") in every picker whose value is the target of a write (the revenue
    picker, the schedule and facility modals) and reads **Chỉ xem** in the row actions (branch, shift,
    attendance, facility, request). Read filters stay usable on purpose — reading is not managing.
- `requests_request_type_check` is a hand-made dashboard constraint, and neither PostgREST nor the app can
  read it (the root OpenAPI wants a secret key; PostgREST exposes columns and foreign keys, never a check
  definition). A vocabulary mismatch therefore stays invisible until an insert happens, and then the route
  can only answer `500 ... violates check constraint "requests_request_type_check"` — a schema mismatch
  wearing the costume of a server bug. `SCRUM-62_request_type_constraint.sql` prints the old definition and
  replaces it with the four values `REQUEST_TYPES` sends; **keep that `in (...)` list and `REQUEST_TYPES`
  identical**, because `request_type` is stored *and displayed* verbatim (the queue, the dashboard and quick
  search all read the column as-is, so machine codes would surface in the UI).
- Employee ↔ branch (SCRUM-63) is the fourth axis of the role model, and it lives in the same three places:
  - `users.branch_id` (nullable) is the branch an account belongs to; `null` means "belongs to no branch".
    It is not `branches.manager_id`: that column says who *runs* a branch (and is what `heads_branch()`
    reads for writes), this one says where somebody *works*. A manager may have either, both or neither.
  - `public.current_branch_id()` is the helper the policies read. It must stay `security definer` with
    `set search_path = public` (SCRUM-54's rule) and must never be inlined as `select … from public.users`
    into a policy on `users`.
  - The read policies of `branches`, `requests`, `attendance` and `shift_assignments` keep every SCRUM-53/60
    clause and add the branch test to the **employee half only** (`is_organization_manager()` still comes
    first, so a manager reads the whole organization); `requests_insert_own` and `attendance_insert_own` add
    the same test to their `with check`. An unassigned employee therefore reads nothing branch-scoped, files
    no đơn and checks in nowhere — that is the point of the feature, not a bug to "fix" by widening a policy.
  - `CreateRequestUseCase` answers `403` before the insert (`RequestBranchNotAssignedError` /
    `RequestBranchForbiddenError`) so the caller reads a sentence instead of a policy that matched no row, and
    `/requests` hides "Tạo đơn" for an unassigned account rather than offering a click that must fail.
  - The organization's `OWNER` files no đơn at all: `request:create` is filtered out of
    `OWNER_CAPABILITIES` in `lib/accessPolicy.ts` (so `POST /api/requests` answers `403` for them) and
    `/requests` renders no "Tạo đơn". They review every queue instead — `ReviewRequestUseCase` keeps its
    owner exception only for a *legacy* request an owner filed before this rule, which nobody else could
    decide anyway.
  - Nobody reviews their own đơn: `ReviewRequestUseCase` throws `RequestSelfReviewError` when the request is
    the approver's own — except for the organization's `OWNER`, whose own request nobody else could decide.
    `/requests` shows "Đơn của bạn" instead of the buttons for the same case (owner excepted).
  - Assignment is owner-only and rides on the existing `users_update_owners` policy through
    `PATCH /api/users/{id}` (`branch_id` omitted keeps the current branch, `null` unassigns). The column is
    readable by every member of the organization via `users_select_authenticated` (SCRUM-24) — a name next to
    a branch is not PII.
  - The organization's `OWNER` is never attached to a branch: `/staff` renders a locked "Không gán chi nhánh"
    cell for them, `toDraft`/`storedBranchId` keep a legacy `branch_id` out of the payload (so a save clears
    it instead of storing it), and `UpdateStaffUseCase` answers `400` ("You cannot assign a branch to the
    organization's owner.") for a branch on an owner while forcing `null` when somebody is *promoted* to
    `OWNER`. A `MANAGER` gets no picker either — their scope is `branches.manager_id`, and the row shows
    what they *head* ("Phụ trách: …") as plain grey text, since `is_organization_manager()` already grants
    them the whole organization. `users.branch_id` is therefore edited **only for an `EMPLOYEE`**, and the
    payload omits it for every other role (omitted keeps the stored value, per the API's contract) which is
    why the amber "Chưa gán: không thấy ca, bảng công hay gửi được đơn" warning is reserved for an
    `EMPLOYEE` as well.
  - **Deploy order: `SCRUM-62` and `SCRUM-63` before the build that ships them.** `GET /api/auth/session`
    selects `users.branch_id`, so on a database that lacks the column *every* authenticated route answers
    `500` with `column users.branch_id does not exist`. Unlike `is_active`, this column is not one the app
    can skip reading, because the shell has to know the caller's branch.
- Rewriting a policy must only ever *add* to the original condition. Re-creating one from memory and
  dropping a clause (`status = 'PENDING'`, `employee_id = auth.uid()`, the role check) is a silent
  security regression that no typecheck or lint will catch — read the previous definition first, and
  leave the verification query at the end of `SCRUM-53_tenant_scope.sql` in place.
- `supabase/functions/**` is Deno, not Node: `tsconfig.json` excludes it from `npx tsc --noEmit`
  (`deno.json` marks the folder as Deno) and it imports `npm:`/`jsr:` specifiers. An editor without the
  Deno extension therefore reports `Cannot find name 'Deno'` and the unresolved specifier for it — known
  and not real; do not "fix" it with `@ts-nocheck` (banned by the lint config) or with a shim that types
  the service-role client loosely, which is how a fake check gets mistaken for a real one. The app reaches
  it only through `EdgeFunctionStaffProvisioningService`, forwarding the caller's access token; the
  service-role key exists solely in that function's Supabase secrets and must never appear in this
  repository or in a client.
- `POST /api/organizations/accounts` answers `409` for two unrelated conflicts, so read the body rather
  than the status: `This account is already a member of the organization.` comes from the register row
  being *claimed*, while `An account already exists for this email address.` comes from `auth.users`
  already holding that address. The app keeps that distinction instead of collapsing it:
  `EdgeFunctionStaffProvisioningService` forwards the function's own sentence into
  `StaffAccountEmailTakenError` (its constructor takes it) and `/organization` matches
  `MEMBER_CONFLICT_MARKER` exported from that file, so reword neither side alone — and never write the
  marker into a catch-all sentence, which is exactly how every `409` once rendered as "đã là thành
  viên" for an address that was merely `Chờ vào tổ chức`. The second case is invisible in
  `public.users` whenever the SCRUM-50 `on_auth_user_created` trigger was missing when the account was
  made (the function then fails its own profile check with `500` and leaves an auth user behind), which
  is what makes a retry look like a phantom conflict — apply `SCRUM-50_user_registration.sql`, delete
  the leftover auth user, then create it again. `/organization` keeps this outcome on the provisioning
  form itself (`accountError` / `accountNote`) instead of the page-level banner: that banner renders
  above the summary cards, so an error raised while the form is in view is off-screen and reads as
  "nothing happened" — the owner clicks again, and the second attempt is the `409`.
- `lib/publicPaths.ts` has two lists: `PUBLIC_PATHS` (no session needed — `proxy.ts` redirects a
  signed-in visitor away) and `SHELL_LESS_PATHS` (`/onboarding`, `/change-password`: a session is
  required, the navigation is hidden because every link would bounce back, the header stays so the
  account can sign out).
  lets any signed-in account read the directory (id, name, role, `is_active`, `created_at` — nothing else),
  `users_update_managers` limits writes to `OWNER`/`MANAGER`, while `UpdateStaffUseCase` (SCRUM-59) adds the rules the database
  cannot express (only an `OWNER` touches the `OWNER` role; nobody edits their own row). Accounts are still
  created by signing up — a service-role admin API is deliberately not used.
- The chat module reads exactly two tables — `company_documents` (`id, content, embedding, title,
  created_at`) and `user_contracts` (same columns plus `user_id`, scoped to the caller). They are not
  created by any script here, and in the current project they are **empty**, which is why every answer is
  the fixed "Tôi không có thông tin về vấn đề này…" sentence from the prompt: with no retrieved context
  the model is forbidden to invent one. `GET /api/chat/sources` + the "Nguồn tri thức" panel on `/chat`
  exist so that this is visible in the product instead of being guessed at. Embed chunks with
  `gemini-embedding-001` pinned to **768 dims** to match those `vector(768)` columns.
- Branch coordinates are guarded twice, on purpose. `lib/geo/vietnam.ts` `isInsideVietnam()` is the real
  rule (point-in-polygon over `lib/geo/vietnamOutline.ts`, plus a 2 km coastal band so a GPS fix just off the
  drawn coastline is not refused) and is what `app/api/branches/_lib/branchRequest.ts` and the map picker
  call; `branches_vietnam_bounds_check` (SCRUM-57) only knows the country's envelope, because a CHECK
  constraint cannot do point-in-polygon without PostGIS. `lib/geo/vietnamOutline.ts` is **generated** by
  `scripts/extract-vietnam-outline.mjs` (Natural Earth 1:10m, a ~13 MB download — manual, deliberately not
  wired into `predev`/`prebuild`): regenerate it through that script, never by hand, and keep
  `VIETNAM_BOUNDS` the outline's envelope padded by 0.022° (~2.2 km, more than that band) — a tighter
  box would make the database refuse a coordinate the API had accepted.
- `branches.manager_id` is picked from the SCRUM-24 directory (`GET /api/users` without `id`, `OWNER`/`MANAGER`
  only — SCRUM-59 `directory:view`) and never typed: `CreateBranchUseCase`/`UpdateBranchUseCase` run `assertBranchManagerExists` on it,
  and because that profile read goes through the request-scoped client, a manager from another organization
  — or an id that does not exist — is refused with `BranchManagerNotFoundError` → `400` instead of an opaque
  foreign-key failure. A viewer without `directory:view` gets `403` from the directory and so sees
  `Đã gán`/`Chưa gán` rather than a name; that degradation is intended, not a bug.
- The address field on `/branches` is filled by `GET /api/geo/reverse`, the only outbound HTTP call besides
  Gemini: the route proxies Nominatim (OpenStreetMap — the same project as the map tiles) so that no key is
  needed and the app can identify itself through a User-Agent, which that provider's usage policy requires.
  Keep it at one lookup per pin move (the policy allows one request per second, so never wire it to a
  keystroke) and keep it server-side: the route is what applies `isInsideVietnam`, so it cannot turn into a
  free geocoding proxy for coordinates anywhere else in the world.
- `components/LocationPickerMap.tsx` is the only client-side map: a `next/dynamic({ ssr: false })` wrapper
  around `components/LocationPickerMapCanvas.tsx`, because Leaflet touches `window` while its module is
  evaluated and pulls in the outline. Colours are set with Tailwind classes on the SVG paths rather than
  through `pathOptions` — Leaflet writes an inline presentation attribute that outranks the token — and the
  dimmed "outside Vietnam" area is one polygon whose holes are the outline rings, which only works because
  Leaflet fills with `fill-rule: evenodd`.
- Attendance is split by device: the mobile app inserts the check-in (GPS point, photo) and the web app
  only reviews it. `attendance_guard_self_update` (SCRUM-21) therefore blocks an employee from editing
  their own check-in facts even though RLS lets them complete the record — do not "fix" that by widening
  the policy. `attendance_compute_distance` derives `check_in_distance_m` from the stored coordinates, so
  the distance and the point can never disagree; the *coordinates* are still whatever the device measured,
  which the server cannot independently verify.

## Tóm tắt (Tiếng Việt)

- Đây là web admin Next.js 16 (App Router) của **Humora HR**, dùng Supabase (PostgreSQL + Auth + RLS) làm backend.
- Kiến trúc Clean Architecture: `lib/domain` (entities, interfaces, errors) → `lib/usecases` (nghiệp vụ)
  → `lib/infrastructure` (Supabase repositories, Gemini). Route handler trong `app/api/**/route.ts` chỉ
  nhận request, xác thực, gọi đúng một use case rồi map lỗi sang mã HTTP.
- Chạy lệnh trong thư mục `hr_website/`: `npm run dev`, `npx tsc --noEmit`, `npm run build`.
  Chưa có test runner trong dự án; `npm run lint` còn lỗi tồn đọng nên chỉ lint các file mình sửa.
- Mọi route API phải có khối JSDoc `@swagger`; schema dùng chung khai báo trong `lib/swagger.ts`,
  file `public/swagger.json` là file sinh tự động, không sửa tay.
- Phân quyền ba cấp (SCRUM-59/60): `OWNER` / `MANAGER` / `EMPLOYEE` (giá trị cũ `CHU` được
  `normalizeRole` quy về `MANAGER`). Bảng năng lực & bảng màn hình ở `lib/accessPolicy.ts`; route handler
  bắt đầu bằng `requireCapability("…")` từ `app/api/_lib/requireCaller.ts`; trang ẩn nút bằng
  `useProfile().can(…)`; RLS (`is_organization_manager()` / `is_organization_owner()`) là lớp quyết định.
  Thứ tự triển khai: `SCRUM-59` → app + Edge Function `staff-account` → `SCRUM-60`.
- Phạm vi chi nhánh (SCRUM-61): trưởng chi nhánh (`branches.manager_id`) chỉ quản lý chi nhánh của mình.
  Quy tắc nằm ở `lib/domain/branchScope.ts` (`canManageBranch`, `defaultBranchId`) và
  `lib/usecases/branchScope.ts` (`assertBranchManagedBy` → `403`); RLS dùng helper `public.heads_branch()`
  (`security definer`) trong policy ghi của `branches`, `daily_revenue`, `shift_assignments`, `attendance`,
  `facilities`, `requests`. Tạo/xoá chi nhánh thuộc `OWNER` (`branch:manage`), sửa chi nhánh mình thuộc
  `branch:update`, và xoá chỉ thành công khi chi nhánh không còn dữ liệu (`409` kèm số lượng).
- Nhân viên thuộc một chi nhánh (SCRUM-63): `users.branch_id` + helper `public.current_branch_id()`;
  RLS thu hẹp phần **nhân viên** trong policy đọc của `branches`/`requests`/`attendance`/`shift_assignments`
  vào chi nhánh của họ, và chặn gửi đơn / chấm công khi `branch_id` còn `null`. Gán chi nhánh ở `/staff`
  (chỉ chủ sở hữu); không ai tự duyệt đơn của mình, trừ chủ sở hữu. Chạy `SCRUM-62` (ràng buộc
  `request_type`) và `SCRUM-63` **trước** khi deploy build này — `GET /api/auth/session` đọc cột mới.
- Thay đổi CSDL viết thành file SQL mới trong `supabase/sql/` và chạy thủ công trong Supabase SQL Editor;
  không sửa file đã chạy.
- Thời gian nghiệp vụ theo `Asia/Bangkok` (UTC+7), dữ liệu lưu ở UTC; không tự ý đổi múi giờ.
