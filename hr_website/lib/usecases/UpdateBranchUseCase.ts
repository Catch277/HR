import type { Branch, UpdateBranchInput } from "@/lib/domain/entities/Branch";
import type { IBranchRepository } from "@/lib/domain/repositories/IBranchRepository";
import { normalizeBranchWriteInput } from "@/lib/usecases/branchInput";

export class UpdateBranchUseCase {
  constructor(private readonly branchRepository: IBranchRepository) {}

  async execute(id: string, input: UpdateBranchInput): Promise<Branch> {
    return this.branchRepository.update(id, normalizeBranchWriteInput(input));
  }
}
