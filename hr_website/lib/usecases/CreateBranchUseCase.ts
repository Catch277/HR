import type { Branch, CreateBranchInput } from "@/lib/domain/entities/Branch";
import type { IBranchRepository } from "@/lib/domain/repositories/IBranchRepository";
import { normalizeBranchWriteInput } from "@/lib/usecases/branchInput";

export class CreateBranchUseCase {
  constructor(private readonly branchRepository: IBranchRepository) {}

  async execute(input: CreateBranchInput): Promise<Branch> {
    return this.branchRepository.create(normalizeBranchWriteInput(input));
  }
}
