export const STAFF_ROLES = ["OWNER", "CHU", "EMPLOYEE"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/**
 * A row of the staff directory (SCRUM-24). Deliberately a separate shape from `User`, which the
 * session endpoint reads: the login path must keep working even before the scripts that add
 * `is_active` are applied, so it never selects this column.
 */
export interface StaffMember {
  id: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface UpdateStaffInput {
  role: StaffRole;
  isActive: boolean;
}