import type {
  CreateFacilityInput,
  Facility,
} from "@/lib/domain/entities/Facility";
import type { IFacilityRepository } from "@/lib/domain/repositories/IFacilityRepository";
import { normalizeFacilityWriteInput } from "@/lib/usecases/facilityInput";

export class CreateFacilityUseCase {
  constructor(private readonly facilityRepository: IFacilityRepository) {}

  async execute(input: CreateFacilityInput): Promise<Facility> {
    return this.facilityRepository.create(normalizeFacilityWriteInput(input));
  }
}
