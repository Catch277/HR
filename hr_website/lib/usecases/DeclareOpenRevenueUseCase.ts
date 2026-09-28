import type {
  CreateRevenueRecordInput,
  RevenueRecord,
} from "@/lib/domain/entities/RevenueRecord";
import { RevenueAlreadyDeclaredError } from "@/lib/domain/errors/RevenueAlreadyDeclaredError";
import type { IRevenueRepository } from "@/lib/domain/repositories/IRevenueRepository";
import { getBusinessDayRange } from "@/lib/usecases/businessDay";

export class DeclareOpenRevenueUseCase {
  constructor(
    private readonly revenueRepository: IRevenueRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(input: CreateRevenueRecordInput): Promise<RevenueRecord> {
    if (!Number.isFinite(input.openAmount) || input.openAmount < 0) {
      throw new Error("open_amount must be a non-negative number.");
    }

    const { start, end } = getBusinessDayRange(this.now());
    const existingRecord = await this.revenueRepository.findByBranchInPeriod(
      input.branchId,
      start,
      end,
    );

    if (existingRecord) {
      throw new RevenueAlreadyDeclaredError();
    }

    return this.revenueRepository.create(input);
  }
}
