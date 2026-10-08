import { OrganizationForbiddenError } from "@/lib/domain/errors/OrganizationForbiddenError";
import type { IOrganizationRepository } from "@/lib/domain/repositories/IOrganizationRepository";

export type RotateOrganizationCodeInput = {
  callerRole: string;
};

/**
 * Replaces the join code (SCRUM-51). Owner only, matching `regenerate_organization_code`: a rotated
 * code stops working immediately, so an owner can cut off a code that leaked to the wrong people
 * without touching the invites of the accounts they meant to add.
 */
export class RotateOrganizationCodeUseCase {
  constructor(
    private readonly organizationRepository: IOrganizationRepository,
  ) {}

  async execute(input: RotateOrganizationCodeInput): Promise<string> {
    if (input.callerRole.trim().toUpperCase() !== "OWNER") {
      throw new OrganizationForbiddenError();
    }

    return this.organizationRepository.rotateJoinCode();
  }
}