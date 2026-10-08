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
│   ├── publicPaths.ts            # Screens rendered outside the shell (proxy.ts + Header/Sidebar)
│   └── swagger.ts                # OpenAPI definition + shared component schemas
├── scripts/generate-swagger.ts   # Builds public/swagger.json; exits 1 when no paths are found
├── scripts/ingest-knowledge.ts   # docs/*.md → chunks + embeddings → supabase/sql/knowledge_seed.sql
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
  `get_revenue_report`, `get_employee_status`, `match_company_documents`, `match_user_contracts`.
  A reporting RPC must be `security invoker` (the default) so RLS still filters what the caller sees,
  and its date default must be computed in Asia/Bangkok, not from `current_date`.
- Schema, indexes, RLS policies, triggers and RPCs live as plain SQL in `supabase/sql/SCRUM-<n>_<name>.sql`
  and must be **run by hand** in Supabase Dashboard → SQL Editor (there is no migration runner or Supabase CLI here).
  New scripts are idempotent (`create table if not exists`, `drop policy if exists` before `create policy`),
  enable RLS and grant the narrowest policy. Never edit a script that has already been applied — add a new one.
- Tables in use: `users` (with `role` — `OWNER`/`CHU` can review requests and manage branches — and
  `is_active`, false meaning the account left the company), `organizations` /
  `organization_join_codes` / `organization_invites` / `organization_join_attempts` (SCRUM-51: the
  tenant, its join code, the register of accounts that may spend that code, and the join audit trail),
  `requests`,
  `shifts` (**the shift template catalogue** — name + hours, written by SCRUM-30 and read by quick search),
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
  through the `staff-account` Edge Function) and `SCRUM-53` (organization scoping of the operational
  tables) — cite the ticket in the code docs you touch.

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
- Currency via `new Intl.NumberFormat("vi-VN")`, dates/sizes as `vi-VN`; keep copy in Vietnamese.
- Every screen is Supabase-backed: `/` (Tổng quan), `/revenue`, `/reports`, `/notifications` and `/chat`
  (Trợ lý AI → `POST /api/chat/ask`) all fetch `/api/*`; only the header search still simulates its
  results. `/chat` is stateless — the endpoint takes one question and answers `{ answer, sources }` — so
  the conversation lives in component state and the screen must not invent a history, a confidence
  score or a step list. Wire a page to `/api/*` with real data when a task calls for it, and preserve
  the existing layout and loading/empty states.
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
  `OWNER`/`CHU` of an organization, and its service-role key stays in Supabase's own secrets — never in
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
  no session at all. `users.role` gates approvals (`OWNER`/`CHU` in `ReviewRequestUseCase`), and
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
- `lib/publicPaths.ts` has two lists: `PUBLIC_PATHS` (no session needed — `proxy.ts` redirects a
  signed-in visitor away) and `SHELL_LESS_PATHS` (`/onboarding`, `/change-password`: a session is
  required, the navigation is hidden because every link would bounce back, the header stays so the
  account can sign out).
  lets any signed-in account read the directory (id, name, role, `is_active`, `created_at` — nothing else),
  `users_update_managers` limits writes to `OWNER`/`CHU`, and `UpdateStaffUseCase` adds the rules the database
  cannot express (only an `OWNER` touches the `OWNER` role; nobody edits their own row). Accounts are still
  created by signing up — a service-role admin API is deliberately not used.
- The chat module reads exactly two tables — `company_documents` (`id, content, embedding, title,
  created_at`) and `user_contracts` (same columns plus `user_id`, scoped to the caller). They are not
  created by any script here, and in the current project they are **empty**, which is why every answer is
  the fixed "Tôi không có thông tin về vấn đề này…" sentence from the prompt: with no retrieved context
  the model is forbidden to invent one. `GET /api/chat/sources` + the "Nguồn tri thức" panel on `/chat`
  exist so that this is visible in the product instead of being guessed at. Embed chunks with
  `gemini-embedding-001` pinned to **768 dims** to match those `vector(768)` columns.
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
- Thay đổi CSDL viết thành file SQL mới trong `supabase/sql/` và chạy thủ công trong Supabase SQL Editor;
  không sửa file đã chạy.
- Thời gian nghiệp vụ theo `Asia/Bangkok` (UTC+7), dữ liệu lưu ở UTC; không tự ý đổi múi giờ.
