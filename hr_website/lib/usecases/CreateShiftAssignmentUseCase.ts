import type {
  CreateShiftAssignmentInput,
  ShiftAssignment,
} from "@/lib/domain/entities/Shift";
import { ShiftNotFoundError } from "@/lib/domain/errors/ShiftNotFoundError";
import type { IShiftAssignmentRepository } from "@/lib/domain/repositories/IShiftAssignmentRepository";
import type { IShiftRepository } from "@/lib/domain/repositories/IShiftRepository";
import { normalizeShiftAssignmentWriteInput } from "@/lib/usecases/shiftAssignmentInput";
import { assertNoOverlappingShift } from "@/lib/usecases/shiftOverlap";

export class CreateShiftAssignmentUseCase {
  constructor(
    private readonly assignmentRepository: IShiftAssignmentRepository,
    private readonly shiftRepository: IShiftRepository,
  ) {}

  async execute(input: CreateShiftAssignmentInput): Promise<ShiftAssignment> {
    const normalized = normalizeShiftAssignmentWriteInput(input);
    const shift = await this.shiftRepository.findById(normalized.shiftId);

    if (!shift) {
      throw new ShiftNotFoundError();
    }

    // Only a work assignment can clash, so a day off skips the check.
    if (normalized.status === "SCHEDULED") {
      await assertNoOverlappingShift(this.assignmentRepository, {
        employeeId: normalized.employeeId,
        workDate: normalized.workDate,
        shift,
      });
    }

    return this.assignmentRepository.create(normalized);
  }
}
