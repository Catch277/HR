import type {
  ShiftAssignment,
  UpdateShiftAssignmentInput,
} from "@/lib/domain/entities/Shift";
import { ShiftNotFoundError } from "@/lib/domain/errors/ShiftNotFoundError";
import type { IShiftAssignmentRepository } from "@/lib/domain/repositories/IShiftAssignmentRepository";
import type { IShiftRepository } from "@/lib/domain/repositories/IShiftRepository";
import { normalizeShiftAssignmentWriteInput } from "@/lib/usecases/shiftAssignmentInput";
import { assertNoOverlappingShift } from "@/lib/usecases/shiftOverlap";

export class UpdateShiftAssignmentUseCase {
  constructor(
    private readonly assignmentRepository: IShiftAssignmentRepository,
    private readonly shiftRepository: IShiftRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateShiftAssignmentInput,
  ): Promise<ShiftAssignment> {
    const normalized = normalizeShiftAssignmentWriteInput(input);
    const shift = await this.shiftRepository.findById(normalized.shiftId);

    if (!shift) {
      throw new ShiftNotFoundError();
    }

    if (normalized.status === "SCHEDULED") {
      await assertNoOverlappingShift(this.assignmentRepository, {
        employeeId: normalized.employeeId,
        workDate: normalized.workDate,
        shift,
        ignoreAssignmentId: id,
      });
    }

    return this.assignmentRepository.update(id, normalized);
  }
}
