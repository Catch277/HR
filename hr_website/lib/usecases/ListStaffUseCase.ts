import type { StaffMember } from "@/lib/domain/entities/StaffMember";
import { StaffForbiddenError } from "@/lib/domain/errors/StaffForbiddenError";
import type { IUserRepository } from "@/lib/domain/repositories/IUserRepository";

const MANAGER_ROLES = new Set(["OWNER", "CHU"]);

export type ListStaffInput = {
  callerRole: string;
};

export class ListStaffUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ListStaffInput): Promise<StaffMember[]> {
    // The staff directory is narrower than the `users` read policy on purpose: the table also
    // backs the schedule and request embeds, but only a manager needs the whole list.
    if (!MANAGER_ROLES.has(input.callerRole.trim().toUpperCase())) {
      throw new StaffForbiddenError();
    }

    return this.userRepository.findAll();
  }
}