import type { Shift } from "@/lib/domain/entities/Shift";

export const ATTENDANCE_STATUSES = [
  "ON_TIME",
  "LATE",
  "EARLY_LEAVE",
  "ABSENT",
  "INCOMPLETE",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

/**
 * The branch fields the screen needs to judge the geofence, embedded from `branch_id` so the
 * validity verdict (distance vs `attendance_radius`) needs no second request.
 */
export interface AttendanceBranch {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  attendance_radius: number;
}

/**
 * One check-in record: an employee, a work date and (usually) a scheduled shift. The GPS point
 * and the photo come from the mobile app; the web app reviews them.
 */
export interface Attendance {
  id: string;
  employee_id: string;
  branch_id: string;
  shift_id: string | null;
  work_date: string;
  check_in_at: string | null;
  check_out_at: string | null;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  /** Distance in metres between the check-in point and the branch centre (derived in the database). */
  check_in_distance_m: number | null;
  check_in_photo_url: string | null;
  check_out_photo_url: string | null;
  status: AttendanceStatus;
  note: string | null;
  complaint: string | null;
  complaint_at: string | null;
  /** `OPEN` from the moment a complaint is stored until a manager resolves it. */
  complaint_status: AttendanceComplaintStatus | null;
  complaint_resolved_by: string | null;
  complaint_resolved_at: string | null;
  verified_by: string | null;
  verified_at: string | null;
  /** Set when a manager corrected the record (SCRUM-23), with the reason they gave. */
  corrected_by: string | null;
  corrected_at: string | null;
  correction_reason: string | null;
  created_at: string;
  updated_at: string;
  /** Hydrated from the foreign keys; null when RLS hides the related row. */
  employee: { id: string; full_name: string } | null;
  branch: AttendanceBranch | null;
  shift: Shift | null;
}

export const ATTENDANCE_COMPLAINT_STATUSES = ["OPEN", "RESOLVED"] as const;

export type AttendanceComplaintStatus =
  (typeof ATTENDANCE_COMPLAINT_STATUSES)[number];

/** What a manager may fix on a record, and the reason the correction must carry. */
export interface AttendanceCorrectionInput {
  checkInAt: string | null;
  checkOutAt: string | null;
  status: AttendanceStatus;
  note: string | null;
  correctionReason: string;
}

export interface AttendanceFilters {
  branchId?: string;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface AttendanceComplaintInput {
  attendanceId: string;
  complaint: string;
}