import type {
  RevenueRecord,
  UpdateCloseRevenueInput,
} from "@/lib/domain/entities/RevenueRecord";
import { OpenRevenueNotFoundError } from "@/lib/domain/errors/OpenRevenueNotFoundError";
import type { IRevenueRepository } from "@/lib/domain/repositories/IRevenueRepository";
import { getBusinessDayRange } from "@/lib/usecases/businessDay";

export type DeclareCloseRevenueInput = UpdateCloseRevenueInput & {
  branchId: string;
};

export type DeclareCloseRevenueResult = {
  revenue: RevenueRecord;
  revenue_difference: number;
};

export class DeclareCloseRevenueUseCase {
  constructor(
    private readonly revenueRepository: IRevenueRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    input: DeclareCloseRevenueInput,
  ): Promise<DeclareCloseRevenueResult> {
    if (!Number.isFinite(input.closeAmount) || input.closeAmount < 0) {
      throw new Error("close_amount must be a non-negative number.");
    }

    const { start, end } = getBusinessDayRange(this.now());
    const openRevenue = await this.revenueRepository.findByBranchInPeriod(
      input.branchId,
      start,
      end,
    );

    if (!openRevenue) {
      throw new OpenRevenueNotFoundError();
    }

    const revenue = await this.revenueRepository.updateCloseRevenue(
      openRevenue.id,
      input,
    );

    return {
      revenue,
      revenue_difference: input.closeAmount - Number(openRevenue.open_amount),
    };
  }
}
