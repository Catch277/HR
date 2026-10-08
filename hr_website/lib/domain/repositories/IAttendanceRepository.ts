import type {
  Attendance,
  AttendanceFilters,
} from "@/lib/domain/entities/Attendance";

export interface IAttendanceRepository {
  findAll(filters: AttendanceFilters): Promise<Attendance[]>;
  findById(id: string): Promise<Attendance | null>;
  /** Stores the employee's khiếu nại against an existing record (SCRUM-29). */
  recordComplaint(id: string, complaint: string): Promise<Attendance>;
  /** Marks a record as reviewed by a manager: `verified_by` + `verified_at`. */
  verify(id: string, verifierId: string): Promise<Attendance>;
}