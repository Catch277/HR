import type {
  StaffMember,
  UpdateStaffInput,
} from "@/lib/domain/entities/StaffMember";
import type { User } from "@/lib/domain/entities/User";

export interface IUserRepository {
  getById(id: string): Promise<User | null>;
  /** The staff directory (SCRUM-24); OWNER/CHU only, enforced by RLS and the use case. */
  findAll(): Promise<StaffMember[]>;
  /** Changes a role and/or the employment state of one account. */
  update(id: string, input: UpdateStaffInput): Promise<StaffMember>;
}
