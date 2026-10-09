export interface Branch {
  id: string;
  name: string;
  address: string | null;
  manager_id: string | null;
  latitude: number | null;
  longitude: number | null;
  attendance_radius: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBranchInput {
  name: string;
  address: string | null;
  managerId: string | null;
  latitude: number | null;
  longitude: number | null;
  attendanceRadius: number;
}

export interface UpdateBranchInput {
  name: string;
  address: string | null;
  managerId: string | null;
  latitude: number | null;
  longitude: number | null;
  attendanceRadius: number;
}

/**
 * How much operational data still points at one branch (SCRUM-61). All four are zero for a branch that
 * may be deleted: `attendance`, `shift_assignments` and `facilities` would cascade away with it, and
 * `daily_revenue` counts rows whose `branch_id` has no foreign key, so deleting would orphan them.
 */
export interface BranchDependents {
  attendance: number;
  assignments: number;
  facilities: number;
  revenue: number;
}

/** True when the branch holds nothing that a delete would destroy or orphan. */
export function isBranchEmpty(dependents: BranchDependents): boolean {
  return (
    dependents.attendance === 0 &&
    dependents.assignments === 0 &&
    dependents.facilities === 0 &&
    dependents.revenue === 0
  );
}
