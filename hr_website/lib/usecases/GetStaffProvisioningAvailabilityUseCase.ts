import type { IStaffProvisioningService } from "@/lib/domain/repositories/IStaffProvisioningService";

export type GetStaffProvisioningAvailabilityInput = {
  callerToken: string;
};

/**
 * Answers whether the `staff-account` Edge Function is deployed (SCRUM-52). The screen asks once
 * and only then offers "Tạo tài khoản cho nhân viên"; without it the button would fail every time
 * and invite-based onboarding has to be explained anyway.
 */
export class GetStaffProvisioningAvailabilityUseCase {
  constructor(
    private readonly staffProvisioningService: IStaffProvisioningService,
  ) {}

  async execute(input: GetStaffProvisioningAvailabilityInput): Promise<boolean> {
    return this.staffProvisioningService.isAvailable(input.callerToken);
  }
}