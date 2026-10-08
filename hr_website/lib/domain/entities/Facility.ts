export const FACILITY_CATEGORIES = [
  "KITCHEN",
  "COLD_STORAGE",
  "FURNITURE",
  "ELECTRICAL",
  "CLEANING",
  "OTHER",
] as const;

export type FacilityCategory = (typeof FACILITY_CATEGORIES)[number];

/**
 * `MAINTENANCE` means "đang sửa chữa" and `BROKEN` means "hỏng, chờ xử lý" — both are the
 * states the maintenance workflow (SCRUM-46) acts on, so they are stored separately even
 * though the screens group them together.
 */
export const FACILITY_CONDITIONS = [
  "GOOD",
  "FAIR",
  "MAINTENANCE",
  "BROKEN",
] as const;

export type FacilityCondition = (typeof FACILITY_CONDITIONS)[number];

export interface Facility {
  id: string;
  branch_id: string;
  name: string;
  code: string | null;
  category: FacilityCategory;
  quantity: number;
  condition: FacilityCondition;
  last_checked_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFacilityInput {
  branchId: string;
  name: string;
  code: string | null;
  category: FacilityCategory;
  quantity: number;
  condition: FacilityCondition;
  lastCheckedAt: string | null;
  note: string | null;
}

export type UpdateFacilityInput = CreateFacilityInput;
