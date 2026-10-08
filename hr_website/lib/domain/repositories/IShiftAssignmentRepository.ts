import type {
  CreateShiftAssignmentInput,
  ShiftAssignment,
  ShiftAssignmentFilters,
  UpdateShiftAssignmentInput,
} from "@/lib/domain/entities/Shift";

export interface IShiftAssignmentRepository {
  findAll(filters: ShiftAssignmentFilters): Promise<ShiftAssignment[]>;
  create(input: CreateShiftAssignmentInput): Promise<ShiftAssignment>;
  update(
    id: string,
    input: UpdateShiftAssignmentInput,
  ): Promise<ShiftAssignment>;
  delete(id: string): Promise<void>;
}
