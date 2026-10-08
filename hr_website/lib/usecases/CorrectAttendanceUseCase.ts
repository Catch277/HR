import type {
  Attendance,
  AttendanceCorrectionInput,
} from "@/lib/domain/entities/Attendance";
import { ATTENDANCE_STATUSES } from "@/lib/domain/entities/Attendance";
import { AttendanceCorrectionForbiddenError } from "@/lib/domain/errors/AttendanceCorrectionForbiddenError";
import type { IAttendanceRepository } from "@/lib/domain/repositories/IAttendanceRepository";

const MANAGER_ROLES = new Set(["OWNER", "CHU"]);
const STATUS_SET: ReadonlySet<string> = new Set(ATTENDANCE_STATUSES);
const MAX_REASON_LENGTH = 500;

export type CorrectAttendanceInput = AttendanceCorrectionInput & {
  attendanceId: string;
  correctorId: string;
  correctorRole: string;
};

export class CorrectAttendanceUseCase {
  constructor(
    private readonly attendanceRepository: IAttendanceRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: CorrectAttendanceInput): Promise<Attendance> {
    if (!MANAGER_ROLES.has(input.correctorRole.trim().toUpperCase())) {
      throw new AttendanceCorrectionForbiddenError();
    }

    // A correction is a payroll-affecting edit, so it always carries who asked for it and why.
    const correctionReason = input.correctionReason.trim();

    if (!correctionReason || correctionReason.length > MAX_REASON_LENGTH) {
      throw new Error(
        `correction_reason must be a non-empty string of at most ${MAX_REASON_LENGTH} characters.`,
      );
    }

    if (!STATUS_SET.has(input.status)) {
      throw new Error(`status must be one of ${ATTENDANCE_STATUSES.join(", ")}.`);
    }

    // The database enforces the same rule (attendance_period_check), but a 400 with the reason
    // beats surfacing a constraint violation as a 500.
    if (
      input.checkInAt &&
      input.checkOutAt &&
      new Date(input.checkOutAt).getTime() < new Date(input.checkInAt).getTime()
    ) {
      throw new Error("check_out_at must not be earlier than check_in_at.");
    }

    return this.attendanceRepository.correct(input.attendanceId, {
      checkInAt: input.checkInAt,
      checkOutAt: input.checkOutAt,
      status: input.status,
      note: input.note,
      correctionReason,
      correctorId: input.correctorId,
      correctedAt: this.now().toISOString(),
    });
  }
}