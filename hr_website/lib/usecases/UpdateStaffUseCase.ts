import type {
  StaffMember,
  UpdateStaffInput,
} from "@/lib/domain/entities/StaffMember";
import { STAFF_ROLES } from "@/lib/domain/entities/StaffMember";
import { StaffForbiddenError } from "@/lib/domain/errors/StaffForbiddenError";
import { StaffNotFoundError } from "@/lib/domain/errors/StaffNotFoundError";
import type { IUserRepository } from "@/lib/domain/repositories/IUserRepository";

const MANAGER_ROLES = new Set(["OWNER", "CHU"]);
const ROLE_SET: ReadonlySet<string> = new Set(STAFF_ROLES);

export type ChangeStaffInput = UpdateStaffInput & {
  staffId: string;
  callerId: string;
  callerRole: string;
};

export class UpdateStaffUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ChangeStaffInput): Promise<StaffMember> {
    const callerRole = input.callerRole.trim().toUpperCase();

    if (!MANAGER_ROLES.has(callerRole)) {
      throw new StaffForbiddenError();
    }

    if (!ROLE_SET.has(input.role)) {
      throw new Error(`role must be one of ${STAFF_ROLES.join(", ")}.`);
    }

    const target = await this.userRepository.getById(input.staffId);

    if (!target) {
      throw new StaffNotFoundError();
    }

    const targetRole = target.role.trim().toUpperCase();

    // Handing out or taking away the owner role is the owner's decision, not a branch manager's.
    if (
      (input.role === "OWNER" || targetRole === "OWNER") &&
      callerRole !== "OWNER"
    ) {
      throw new StaffForbiddenError();
    }

    // Nobody should be able to lock themselves out of the admin app.
    if (
      input.staffId === input.callerId &&
      (input.role !== callerRole || !input.isActive)
    ) {
      throw new Error(
        "You cannot change your own role or deactivate your own account.",
      );
    }

    return this.userRepository.update(input.staffId, {
      role: input.role,
      isActive: input.isActive,
    });
  }
}