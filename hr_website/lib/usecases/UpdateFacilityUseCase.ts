import type {
  Facility,
  UpdateFacilityInput,
} from "@/lib/domain/entities/Facility";
import { FacilityNotFoundError } from "@/lib/domain/errors/FacilityNotFoundError";
import type { IBranchRepository } from "@/lib/domain/repositories/IBranchRepository";
import type { IFacilityRepository } from "@/lib/domain/repositories/IFacilityRepository";
import { assertBranchManagedBy } from "@/lib/usecases/branchScope";
import { normalizeFacilityWriteInput } from "@/lib/usecases/facilityInput";

/** The caller as the route handler knows it, always from the session and never from the body. */
export type UpdateFacilityUseCaseInput = UpdateFacilityInput & {
  callerId: string;
  callerRole: string;
};

export class UpdateFacilityUseCase {
  constructor(
    private readonly facilityRepository: IFacilityRepository,
    private readonly branchRepository: IBranchRepository,
  ) {}

  async execute(
    id: string,
    input: UpdateFacilityUseCaseInput,
  ): Promise<Facility> {
    const normalized = normalizeFacilityWriteInput(input);

    // The stored row says which branch the caller has to manage (SCRUM-61).
    const existing = await this.facilityRepository.findById(id);

    if (!existing) {
      throw new FacilityNotFoundError();
    }

    const caller = { userId: input.callerId, role: input.callerRole };

    await assertBranchManagedBy(
      this.branchRepository,
      existing.branch_id,
      caller,
    );

    // Moving equipment to another branch is the same rule from the other side, and the `with check`
    // half of `facilities_update_managers` refuses it in the database too.
    if (normalized.branchId !== existing.branch_id) {
      await assertBranchManagedBy(
        this.branchRepository,
        normalized.branchId,
        caller,
      );
    }

    return this.facilityRepository.update(id, normalized);
  }
}
