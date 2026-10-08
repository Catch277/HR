import type { InviteRole } from "@/lib/domain/entities/OrganizationInvite";
import type { StaffProvisionResult } from "@/lib/domain/entities/StaffProvisionResult";
import { StaffAccountEmailTakenError } from "@/lib/domain/errors/StaffAccountEmailTakenError";
import { StaffProvisioningForbiddenError } from "@/lib/domain/errors/StaffProvisioningForbiddenError";
import { StaffProvisioningInputError } from "@/lib/domain/errors/StaffProvisioningInputError";
import { StaffProvisioningRateLimitedError } from "@/lib/domain/errors/StaffProvisioningRateLimitedError";
import { StaffProvisioningUnavailableError } from "@/lib/domain/errors/StaffProvisioningUnavailableError";
import type { IStaffProvisioningService } from "@/lib/domain/repositories/IStaffProvisioningService";

/**
 * Calls the `staff-account` Edge Function (SCRUM-52), which is deployed by hand next to the API
 * (see the README). The URL is derived from `NEXT_PUBLIC_SUPABASE_URL` — `<project>.supabase.co/
 * functions/v1/staff-account` — so no new required variable is needed; `STAFF_ACCOUNT_FUNCTION_URL`
 * overrides it when a project renames the function.
 *
 * The caller's access token travels in the `Authorization` header: the function authorizes the
 * *user*, not this app, which is why no shared secret lives here.
 */
const FUNCTION_PATH = "functions/v1/staff-account";

function functionUrl(): string | null {
  const explicit = process.env.STAFF_ACCOUNT_FUNCTION_URL;

  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return null;
  }

  return `${supabaseUrl.replace(/\/+$/, "")}/${FUNCTION_PATH}`;
}

function throwForStatus(status: number, message: string): never {
  if (status === 401) {
    throw new Error(
      "The staff account service rejected the session token. Sign in again and retry.",
    );
  }

  if (status === 403) {
    throw new StaffProvisioningForbiddenError();
  }

  if (status === 409) {
    throw new StaffAccountEmailTakenError();
  }

  if (status === 429) {
    throw new StaffProvisioningRateLimitedError();
  }

  if (status === 400 || status === 422) {
    throw new StaffProvisioningInputError(
      message || "A field of the account is invalid.",
    );
  }

  // 404 means the function is not deployed under that name.
  if (status === 404) {
    throw new StaffProvisioningUnavailableError();
  }

  throw new Error(
    `The staff account service failed: ${message || `HTTP ${status}`}`,
  );
}

export class EdgeFunctionStaffProvisioningService
  implements IStaffProvisioningService
{
  async isAvailable(callerToken: string): Promise<boolean> {
    const url = functionUrl();

    if (!url) {
      return false;
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${callerToken}` },
        cache: "no-store",
      });

      return response.ok;
    } catch {
      // Not deployed, no DNS, offline project: the screen simply hides the form.
      return false;
    }
  }

  async createAccount(input: {
    callerToken: string;
    email: string;
    fullName: string;
    role: InviteRole;
    password: string;
  }): Promise<StaffProvisionResult> {
    return this.call(input.callerToken, {
      action: "create",
      email: input.email,
      full_name: input.fullName,
      role: input.role,
      password: input.password,
    });
  }

  async resetPassword(input: {
    callerToken: string;
    userId: string;
    password: string;
  }): Promise<StaffProvisionResult> {
    return this.call(input.callerToken, {
      action: "reset_password",
      user_id: input.userId,
      password: input.password,
    });
  }

  private async call(
    callerToken: string,
    payload: Record<string, unknown>,
  ): Promise<StaffProvisionResult> {
    const url = functionUrl();

    if (!url) {
      throw new StaffProvisioningUnavailableError();
    }

    let response: Response;

    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${callerToken}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
    } catch {
      throw new StaffProvisioningUnavailableError();
    }

    if (!response.ok) {
      const message = await response
        .json()
        .then((data: { error?: string }) => data.error ?? "")
        .catch(() => "");

      throwForStatus(response.status, message);
    }

    const data = (await response.json()) as StaffProvisionResult;

    return {
      user_id: data.user_id,
      email: data.email,
      must_change_password: data.must_change_password === true,
    };
  }
}