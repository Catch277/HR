import type { Attendance } from "@/lib/domain/entities/Attendance";
import { AttendanceVerifyForbiddenError } from "@/lib/domain/errors/AttendanceVerifyForbiddenError";
import type { IAttendanceRepository } from "@/lib/domain/repositories/IAttendanceRepository";

const MANAGER_ROLES = new Set(["OWNER", "CHU"]);

export type VerifyAttendanceInput = {
  attendanceId: string;
  verifierId: string;
  verifierRole: string;
};

export class VerifyAttendanceUseCase {
  constructor(private readonly attendanceRepository: IAttendanceRepository) {}

  async execute(input: VerifyAttendanceInput): Promise<Attendance> {
    if (!MANAGER_ROLES.has(input.verifierRole.trim().toUpperCase())) {
      throw new AttendanceVerifyForbiddenError();
    }

    // `verify` throws AttendanceNotFoundError when RLS hides the row (wrong id or a branch the
    // caller may not touch).
    return this.attendanceRepository.verify(input.attendanceId, input.verifierId);
  }
}