import type { IFacilityRepository } from "@/lib/domain/repositories/IFacilityRepository";

export class DeleteFacilityUseCase {
  constructor(private readonly facilityRepository: IFacilityRepository) {}

  async execute(id: string): Promise<void> {
    await this.facilityRepository.delete(id);
  }
}
