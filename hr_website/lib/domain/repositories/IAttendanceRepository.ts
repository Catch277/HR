import type {
  Attendance,
  AttendanceCorrectionInput,
  AttendanceFilters,
} from "@/lib/domain/entities/Attendance";

export interface IAttendanceRepository {
  findAll(filters: AttendanceFilters): Promise<Attendance[]>;
  findById(id: string): Promise<Attendance | null>;
  /** Stores the employee's khiếu nại against an existing record (SCRUM-29) and marks it OPEN. */
  recordComplaint(id: string, complaint: string): Promise<Attendance>;
  /** Closes an open complaint (SCRUM-23). */
  resolveComplaint(id: string, resolverId: string): Promise<Attendance>;
  /** Fixes the times of a record and records who did it and why (SCRUM-23). */
  correct(
    id: string,
    input: AttendanceCorrectionInput & { correctorId: string; correctedAt: string },
  ): Promise<Attendance>;
  /** Marks a record as reviewed by a manager: `verified_by` + `verified_at`. */
  verify(id: string, verifierId: string): Promise<Attendance>;
}