import type {
  CreateRevenueRecordInput,
  RevenueRecord,
  UpdateCloseRevenueInput,
} from "@/lib/domain/entities/RevenueRecord";

export interface IRevenueRepository {
  findByBranchInPeriod(
    branchId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<RevenueRecord | null>;
  create(input: CreateRevenueRecordInput): Promise<RevenueRecord>;
  updateCloseRevenue(
    id: string,
    input: UpdateCloseRevenueInput,
  ): Promise<RevenueRecord>;
}
