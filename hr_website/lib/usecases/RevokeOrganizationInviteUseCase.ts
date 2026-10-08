import { OrganizationForbiddenError } from "@/lib/domain/errors/OrganizationForbiddenError";
import type { IOrganizationInviteRepository } from "@/lib/domain/repositories/IOrganizationInviteRepository";

const MANAGER_ROLES = new Set(["OWNER", "CHU"]);

export type RevokeOrganizationInviteInput = {
  callerRole: string;
  inviteId: string;
};

/**
 * Withdraws an invite that has not been claimed. Once somebody has joined, removing them is a
 * staff action (`is_active = false` on /staff), not an invite action.
 */
export class RevokeOrganizationInviteUseCase {
  constructor(
    private readonly inviteRepository: IOrganizationInviteRepository,
  ) {}

  async execute(input: RevokeOrganizationInviteInput): Promise<void> {
    if (!MANAGER_ROLES.has(input.callerRole.trim().toUpperCase())) {
      throw new OrganizationForbiddenError();
    }

    await this.inviteRepository.revoke(input.inviteId);
  }
}