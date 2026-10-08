/**
 * HTTP-layer payload parsing shared by `POST /api/facilities` and `PUT /api/facilities/[id]`.
 *
 * It lives in a private folder (`_lib`, opted out of routing) so both route handlers keep the
 * same validation without duplicating it, and so request parsing stays in the HTTP layer
 * instead of leaking into the use cases. Mirrors `app/api/branches/_lib/branchRequest.ts`.
 */
import {
  FACILITY_CATEGORIES,
  FACILITY_CONDITIONS,
  type FacilityCategory,
  type FacilityCondition,
} from "@/lib/domain/entities/Facility";

export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_QUANTITY = 9999;

const CATEGORY_SET: ReadonlySet<string> = new Set(FACILITY_CATEGORIES);
const CONDITION_SET: ReadonlySet<string> = new Set(FACILITY_CONDITIONS);

export type ParsedFacilityRequest = {
  branchId: string;
  name: string;
  code: string | null;
  category: FacilityCategory;
  quantity: number;
  condition: FacilityCondition;
  lastCheckedAt: string | null;
  note: string | null;
};

export type FacilityRequestResult =
  | { ok: true; input: ParsedFacilityRequest }
  | { ok: false; error: string };

/** Round-trips the calendar date so `2026-02-31` is rejected instead of rolling into March. */
export function isCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

function isOptionalText(value: unknown, maxLength: number): boolean {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "string" && value.length <= maxLength)
  );
}

export function parseFacilityRequest(payload: unknown): FacilityRequestResult {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, error: "The request body must be a JSON object." };
  }

  const body = payload as Record<string, unknown>;

  if (typeof body.branch_id !== "string" || !UUID_PATTERN.test(body.branch_id)) {
    return { ok: false, error: "branch_id is required and must be a UUID." };
  }

  const name = body.name;

  if (
    typeof name !== "string" ||
    name.trim().length === 0 ||
    name.trim().length > 120
  ) {
    return {
      ok: false,
      error:
        "name is required and must be a non-empty string of at most 120 characters.",
    };
  }

  if (!isOptionalText(body.code, 60)) {
    return { ok: false, error: "code must be a string of at most 60 characters." };
  }

  if (!isOptionalText(body.note, 500)) {
    return { ok: false, error: "note must be a string of at most 500 characters." };
  }

  const rawCategory = body.category ?? "OTHER";

  if (typeof rawCategory !== "string" || !CATEGORY_SET.has(rawCategory)) {
    return {
      ok: false,
      error: `category must be one of ${FACILITY_CATEGORIES.join(", ")}.`,
    };
  }

  const rawCondition = body.condition ?? "GOOD";

  if (typeof rawCondition !== "string" || !CONDITION_SET.has(rawCondition)) {
    return {
      ok: false,
      error: `condition must be one of ${FACILITY_CONDITIONS.join(", ")}.`,
    };
  }

  const rawQuantity = body.quantity ?? 1;

  if (
    typeof rawQuantity !== "number" ||
    !Number.isInteger(rawQuantity) ||
    rawQuantity < 1 ||
    rawQuantity > MAX_QUANTITY
  ) {
    return {
      ok: false,
      error: `quantity must be a whole number between 1 and ${MAX_QUANTITY}.`,
    };
  }

  const rawCheckedAt = body.last_checked_at;

  if (
    rawCheckedAt !== undefined &&
    rawCheckedAt !== null &&
    (typeof rawCheckedAt !== "string" || !isCalendarDate(rawCheckedAt))
  ) {
    return {
      ok: false,
      error: "last_checked_at must be a calendar date (YYYY-MM-DD) or null.",
    };
  }

  return {
    ok: true,
    input: {
      branchId: body.branch_id,
      name,
      code: typeof body.code === "string" ? body.code : null,
      category: rawCategory as FacilityCategory,
      quantity: rawQuantity,
      condition: rawCondition as FacilityCondition,
      lastCheckedAt: typeof rawCheckedAt === "string" ? rawCheckedAt : null,
      note: typeof body.note === "string" ? body.note : null,
    },
  };
}
