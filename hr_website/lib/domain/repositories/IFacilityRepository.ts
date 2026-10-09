import type {
  CreateFacilityInput,
  Facility,
  UpdateFacilityInput,
} from "@/lib/domain/entities/Facility";

export interface IFacilityRepository {
  findAll(branchId?: string): Promise<Facility[]>;
  /** One facility as the caller may see it; the write rules need its `branch_id` (SCRUM-61). */
  findById(id: string): Promise<Facility | null>;
  create(input: CreateFacilityInput): Promise<Facility>;
  update(id: string, input: UpdateFacilityInput): Promise<Facility>;
  delete(id: string): Promise<void>;
}
