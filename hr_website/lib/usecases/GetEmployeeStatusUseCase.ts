import type {
  EmployeeStatus,
  EmployeeStatusFilters,
} from "@/lib/domain/entities/EmployeeStatus";
import type { IEmployeeStatusRepository } from "@/lib/domain/repositories/IEmployeeStatusRepository";
import { getBusinessDay } from "@/lib/usecases/businessDay";

export type EmployeeStatusSnapshot = {
  /** When the snapshot was taken, so the screen can show "cập nhật lúc ...". */
  updatedAt: string;
  /** The business day (Asia/Bangkok) the snapshot describes. */
  workDate: string;
  statuses: EmployeeStatus[];
};

export class GetEmployeeStatusUseCase {
  constructor(
    private readonly employeeStatusRepository: IEmployeeStatusRepository,
    // Nondeterminism is injected so the snapshot timestamp stays testable.
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    filters: EmployeeStatusFilters = {},
  ): Promise<EmployeeStatusSnapshot> {
    const now = this.now();
    const statuses = await this.employeeStatusRepository.findAll(filters);

    return {
      updatedAt: now.toISOString(),
      // The RPC answers for one business day; when nobody is listed the day still has to be
      // shown, so it is derived here with the same Asia/Bangkok rule.
      workDate: statuses[0]?.work_date ?? filters.workDate ?? getBusinessDay(now),
      statuses,
    };
  }
}