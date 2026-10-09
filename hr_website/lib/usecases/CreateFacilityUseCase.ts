import type {
  CreateFacilityInput,
  Facility,
} from "@/lib/domain/entities/Facility";
import type { IBranchRepository } from "@/lib/domain/repositories/IBranchRepository";
import type { IFacilityRepository } from "@/lib/domain/repositories/IFacilityRepository";
import { assertBranchManagedBy } from "@/lib/usecases/branchScope";
import { normalizeFacilityWriteInput } from "@/lib/usecases/facilityInput";

/** The caller as the route handler knows it, always from the session and never from the body. */
export type CreateFacilityUseCaseInput = CreateFacilityInput & {
  callerId: string;
  callerRole: string;
};

export class CreateFacilityUseCase {
  constructor(
    private readonly facilityRepository: IFacilityRepository,
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(input: CreateFacilityUseCaseInput): Promise<Facility> {
    // SCRUM-61: the inventory belongs to a branch, so a manager may only add to their own.
    await assertBranchManagedBy(this.branchRepository, input.branchId, {
      userId: input.callerId,
      role: input.callerRole,
    });

    return this.facilityRepository.create(normalizeFacilityWriteInput(input));
  }
}
