import type {
  CreateFacilityInput,
  Facility,
  UpdateFacilityInput,
} from "@/lib/domain/entities/Facility";

export interface IFacilityRepository {
  findAll(branchId?: string): Promise<Facility[]>;
  create(input: CreateFacilityInput): Promise<Facility>;
  update(id: string, input: UpdateFacilityInput): Promise<Facility>;
  delete(id: string): Promise<void>;
}
