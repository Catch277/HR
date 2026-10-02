# HR Website — Project Summary

## Overview

This project is an HR Website backend foundation built with Next.js App Router, TypeScript, Supabase, and Clean Architecture. It currently provides a request-scoped Supabase server client, generated OpenAPI documentation, a sample user API, and opening/closing revenue declaration APIs.

## Technology

- Next.js 16 (App Router) and React 19
- TypeScript
- Supabase (`@supabase/ssr` and `@supabase/supabase-js`)
- OpenAPI 3 via `next-swagger-doc`
- Swagger UI via `swagger-ui-react`
- ESLint and Tailwind CSS

## Architecture

The `lib/` directory follows Clean Architecture boundaries:

```text
lib/
├── domain/          # Framework-independent entities, repository contracts, domain errors
├── usecases/        # Business rules; depend only on domain contracts
└── infrastructure/  # Supabase implementation and request-scoped client
```

Route Handlers under `app/api/` are thin controllers. They validate HTTP input, authenticate when necessary, instantiate a use case, and format HTTP responses. Database access is implemented in infrastructure repositories rather than route files.

## Supabase configuration

The server client is at `lib/infrastructure/supabaseClient.ts`. It uses `@supabase/ssr`, Next.js App Router cookies, and these environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

The client is created per request. API routes can use its authenticated Supabase session through `supabase.auth.getUser()`.

## API documentation

| URL | Purpose |
| --- | --- |
| `GET /api/swagger` | OpenAPI JSON specification |
| `/api-docs` | Interactive Swagger UI |

Swagger configuration lives in `lib/swagger.ts`. Every API route should start with a JSDoc `@swagger` block so it appears in the documentation.

## Available APIs

### Get user

```http
GET /api/users?id=<user-uuid>
```

Returns the user fields `id`, `full_name`, and `role` from the `users` table. The implementation is split between `User`, `IUserRepository`, `SupabaseUserRepository`, and `GetUserUseCase`.

### Declare opening revenue (SCRUM-39)

```http
POST /api/revenue/open
Content-Type: application/json

{
  "branch_id": "<branch-uuid>",
  "open_amount": 1500000
}
```

The API requires an authenticated Supabase user. It derives `created_by` from that user's session rather than accepting it from the request body.

| Result | HTTP status |
| --- | --- |
| Opening declaration created | `201` |
| Invalid JSON or input | `400` |
| No authenticated user | `401` |
| The branch already declared opening revenue today | `409` |
| Unexpected server/database error | `500` |

The business day uses `Asia/Bangkok` (UTC+7). The use case checks for an existing declaration and the database additionally enforces it with a unique index, including concurrent requests.

### Required Supabase SQL

Before using the revenue API, run [SCRUM-39_daily_revenue.sql](supabase/sql/SCRUM-39_daily_revenue.sql) in **Supabase Dashboard → SQL Editor**. It creates:

- `public.daily_revenue` with `id`, `branch_id`, `open_amount`, `created_at`, and `created_by`
- A one-declaration-per-branch-per-business-day unique index
- Row Level Security policies for authenticated reads and self-authored inserts

Then run [SCRUM-40_update_revenue.sql](supabase/sql/SCRUM-40_update_revenue.sql) to add the closing-revenue fields, `audit_log`, and the Row Level Security policy required for updates.

### Review requests (SCRUM-41)

- `GET /api/requests?branch_id=<uuid>&request_type=<type>&status=<status>` returns requests matching any supplied filters.
- `PATCH /api/requests/<request-id>/review` accepts `APPROVED` or `REJECTED`; rejecting requires `reject_reason`.

The reviewing account is derived from the Supabase session. Only `OWNER` and `CHU` roles from the `users` table can review; every review records the authenticated user as `approver_id` and updates `updated_at`.

### Revenue reports (SCRUM-44)

`GET /api/revenue/report?branch_id=<uuid>&period=month&date=2026-09-29` returns closed-shift revenue (`close_amount - open_amount`) for a day, week, month, quarter, or year. It includes time-series points, totals, and a comparison with the preceding equivalent period.

Run [SCRUM-44_revenue_report.sql](supabase/sql/SCRUM-44_revenue_report.sql) to create the PostgreSQL aggregation RPC used by the report repository.

### Quick search (SCRUM-49)

`GET /api/search?q=<keyword>&type=<all|users|requests|shifts>` returns up to 10 results per requested group. It requires a Supabase session and a user profile with a role; each query runs through the current session so Supabase RLS determines the returned data scope.

Run [SCRUM-49_quick_search_indexes.sql](supabase/sql/SCRUM-49_quick_search_indexes.sql) to add `pg_trgm` indexes for fast `ILIKE` search. The script assumes `shifts.name` is the shift display-name column.

## Useful commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

## Current validation status

- ESLint passes.
- TypeScript checks pass with `npx tsc --noEmit`.
- Swagger JSON includes the user and revenue endpoints.
- The production build may require outbound access to `fonts.googleapis.com` because the starter layout imports Geist through `next/font/google`.
