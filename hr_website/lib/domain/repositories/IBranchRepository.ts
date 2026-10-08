import type {
  Branch,
  CreateBranchInput,
  UpdateBranchInput,
} from "@/lib/domain/entities/Branch";

export interface IBranchRepository {
  findAll(): Promise<Branch[]>;
  create(input: CreateBranchInput): Promise<Branch>;
  update(id: string, input: UpdateBranchInput): Promise<Branch>;
}
