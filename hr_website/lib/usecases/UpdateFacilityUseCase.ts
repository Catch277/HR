import type {
  Facility,
  UpdateFacilityInput,
} from "@/lib/domain/entities/Facility";
import type { IFacilityRepository } from "@/lib/domain/repositories/IFacilityRepository";
import { normalizeFacilityWriteInput } from "@/lib/usecases/facilityInput";

export class UpdateFacilityUseCase {
  constructor(private readonly facilityRepository: IFacilityRepository) {}

  async execute(id: string, input: UpdateFacilityInput): Promise<Facility> {
    return this.facilityRepository.update(
      id,
      normalizeFacilityWriteInput(input),
    );
  }
}
