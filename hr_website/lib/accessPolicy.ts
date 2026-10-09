import { normalizeRole } from "@/lib/domain/roles";

/**
 * What a role is allowed to do, and which screen that ability belongs to (SCRUM-59).
 *
 * One table drives all three layers of the app:
 *
 * - `proxy.ts` bounces a deep link the role may not open (`canAccessScreen`),
 * - the sidebar only renders the links the role may open,
 * - a page hides the controls behind `useProfile().can("…")`,
 * - a route handler refuses the call with `403` before it reaches the use case.
 *
 * The database repeats the same rules in RLS (`is_organization_manager()` / `is_organization_owner()`),
 * so a capability added here without a matching policy — or the other way round — is a bug in one of
 * the two places, never a hole: the narrowest of the two wins.
 */
export const CAPABILITIES = [
  /** The dashboard, the notifications screen and the AI assistant: every signed-in member. */
  "dashboard:view",
  "notification:view",
  "knowledge:view",
  /** Own requests / own shifts / own timesheet — every member, narrowed to own rows by RLS. */
  "request:view",
  /**
   * File one's own đơn (SCRUM-41). Every member holds it *except the organization's `OWNER`* (SCRUM-63):
   * they stand above the approval chain, so `/requests` offers them no "Tạo đơn" and
   * `POST /api/requests` answers `403` for them. `requests_insert_own` still keeps every stored row
   * its author's own.
   */
  "request:create",
  "schedule:view",
  "attendance:view",
  /** Manager: run the operation. */
  "revenue:manage",
  "report:view",
  "employee-status:view",
  "request:review",
  "schedule:manage",
  "attendance:review",
  "facility:manage",
  "branch:view",
  /** Edit the branch you are the chi nhánh trưởng of (SCRUM-61); the use case narrows it to that one. */
  "branch:update",
  /** The staff directory (SCRUM-24) as a data source for the schedule/branch pickers. */
  "directory:view",
  /** Owner only. */
  "branch:manage",
  "staff:manage",
  "organization:manage",
] as const;

export type Capability = (typeof CAPABILITIES)[number];

const EMPLOYEE_CAPABILITIES: readonly Capability[] = [
  "dashboard:view",
  "notification:view",
  "knowledge:view",
  "request:view",
  "request:create",
  "schedule:view",
  "attendance:view",
];

const MANAGER_CAPABILITIES: readonly Capability[] = [
  ...EMPLOYEE_CAPABILITIES,
  "revenue:manage",
  "report:view",
  "employee-status:view",
  "request:review",
  "schedule:manage",
  "attendance:review",
  "facility:manage",
  "branch:view",
  "branch:update",
  "directory:view",
];

/**
 * The owner may do everything a manager may, plus own the organization: its branches, its staff
 * accounts and its settings. Written as an extension so a capability added to `MANAGER` can never
 * be forgotten for `OWNER` — with one deliberate exception: the owner does not *file* đơn, because
 * they sit above the approval chain (SCRUM-63). `ReviewRequestUseCase` still allows an owner to
 * decide their own legacy request; the screen and the API simply no longer offer the submission.
 */
const OWNER_CAPABILITIES: readonly Capability[] = [
  ...MANAGER_CAPABILITIES.filter(
    (capability) => capability !== "request:create",
  ),
  "branch:manage",
  "staff:manage",
  "organization:manage",
];

const ROLE_CAPABILITIES: Readonly<Record<string, ReadonlySet<string>>> = {
  EMPLOYEE: new Set<string>(EMPLOYEE_CAPABILITIES),
  MANAGER: new Set<string>(MANAGER_CAPABILITIES),
  OWNER: new Set<string>(OWNER_CAPABILITIES),
};

/**
 * A `security definer` RPC cannot be reached with a role the app does not know, and an account whose
 * profile row is missing answers `false` rather than throwing while a page renders.
 */
export function can(role: string | null | undefined, capability: Capability): boolean {
  return ROLE_CAPABILITIES[normalizeRole(role)]?.has(capability) ?? false;
}

/**
 * Every screen of the shell with the capability it needs, in the order the sidebar shows them.
 * `/organization` is in the table because it is gated like the others even though it is reached
 * from the organization card rather than from a navigation link (SCRUM-51).
 */
export const SCREEN_ACCESS: readonly { path: string; capability: Capability }[] = [
  { path: "/", capability: "dashboard:view" },
  { path: "/branches", capability: "branch:view" },
  { path: "/facilities", capability: "facility:manage" },
  { path: "/revenue", capability: "revenue:manage" },
  { path: "/requests", capability: "request:view" },
  { path: "/schedules", capability: "schedule:view" },
  { path: "/employee-status", capability: "employee-status:view" },
  { path: "/attendance", capability: "attendance:view" },
  { path: "/staff", capability: "staff:manage" },
  { path: "/reports", capability: "report:view" },
  { path: "/notifications", capability: "notification:view" },
  { path: "/chat", capability: "knowledge:view" },
  { path: "/organization", capability: "organization:manage" },
];

/**
 * Paths outside the table (login, register, onboarding, change-password) are not the shell's
 * business: `proxy.ts` already decides who may see those, so an unknown path is allowed here.
 */
export function canAccessScreen(
  role: string | null | undefined,
  pathname: string,
): boolean {
  const screen = SCREEN_ACCESS.find((entry) => entry.path === pathname);

  return screen ? can(role, screen.capability) : true;
}

/**
 * Where an account that may not open the current screen should land instead. Falls back to the
 * dashboard, which every role may open.
 */
export function firstAccessiblePath(role: string | null | undefined): string {
  const screen = SCREEN_ACCESS.find((entry) => can(role, entry.capability));

  return screen?.path ?? "/";
}

/** Vietnamese labels for `users.role`; the single copy the header, the pages and the search use. */
export const ROLE_LABELS: Readonly<Record<string, string>> = {
  OWNER: "Chủ sở hữu",
  MANAGER: "Quản lý chi nhánh",
  EMPLOYEE: "Nhân viên",
};

export function roleLabel(role: string | null | undefined): string {
  const normalized = normalizeRole(role);

  return ROLE_LABELS[normalized] ?? (normalized || "—");
}
