import type { Attendance } from "@/lib/domain/entities/Attendance";
import { AttendanceComplaintForbiddenError } from "@/lib/domain/errors/AttendanceComplaintForbiddenError";
import { AttendanceNotFoundError } from "@/lib/domain/errors/AttendanceNotFoundError";
import type { IAttendanceRepository } from "@/lib/domain/repositories/IAttendanceRepository";

const MANAGER_ROLES = new Set(["OWNER", "CHU"]);

export type ResolveAttendanceComplaintInput = {
  attendanceId: string;
  resolverId: string;
  resolverRole: string;
};

export class ResolveAttendanceComplaintUseCase {
  constructor(private readonly attendanceRepository: IAttendanceRepository) {}

  async execute(input: ResolveAttendanceComplaintInput): Promise<Attendance> {
    // Closing a complaint is a management decision, so only a manager may do it — unlike raising
    // one, which the employee themselves does from the mobile app.
    if (!MANAGER_ROLES.has(input.resolverRole.trim().toUpperCase())) {
      throw new AttendanceComplaintForbiddenError();
    }

    const record = await this.attendanceRepository.findById(input.attendanceId);

    if (!record) {
      throw new AttendanceNotFoundError();
    }

    if (!record.complaint) {
      throw new Error("This attendance record has no complaint to resolve.");
    }

    return this.attendanceRepository.resolveComplaint(
      record.id,
      input.resolverId,
    );
  }
}