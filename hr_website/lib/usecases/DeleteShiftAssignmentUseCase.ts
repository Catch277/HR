import type { IShiftAssignmentRepository } from "@/lib/domain/repositories/IShiftAssignmentRepository";

export class DeleteShiftAssignmentUseCase {
  constructor(
    private readonly assignmentRepository: IShiftAssignmentRepository,
  ) {}

  async execute(id: string): Promise<void> {
    await this.assignmentRepository.delete(id);
  }
}
