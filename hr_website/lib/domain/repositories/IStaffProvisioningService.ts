import type { InviteRole } from "@/lib/domain/entities/OrganizationInvite";
import type { StaffProvisionResult } from "@/lib/domain/entities/StaffProvisionResult";

/**
 * The privileged half of SCRUM-52: creating a Supabase Auth account for someone else needs the
 * service-role key, which only the `staff-account` Edge Function holds. The web app calls it with
 * the *caller's* access token and never sees a secret.
 */
export interface IStaffProvisioningService {
  /** True when the function answers — the screen hides the form instead of failing every time. */
  isAvailable(callerToken: string): Promise<boolean>;
  createAccount(input: {
    callerToken: string;
    email: string;
    fullName: string;
    role: InviteRole;
    password: string;
  }): Promise<StaffProvisionResult>;
  /** Gives an existing member of the organization a new temporary password. */
  resetPassword(input: {
    callerToken: string;
    userId: string;
    password: string;
  }): Promise<StaffProvisionResult>;
}