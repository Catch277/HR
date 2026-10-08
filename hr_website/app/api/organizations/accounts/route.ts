/**
 * @swagger
 * /api/organizations/accounts:
 *   get:
 *     summary: Is the staff account service available?
 *     description: |
 *       SCRUM-52: probes the `staff-account` Edge Function with the caller's own token. `available`
 *       is false when the function is not deployed, and the Tổ chức screen then offers the invite
 *       path instead of a button that would always fail.
 *     tags:
 *       - Organizations
 *     responses:
 *       200:
 *         description: Whether the function answered.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [available]
 *               properties:
 *                 available:
 *                   type: boolean
 *       401:
 *         description: Authentication is required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: The account has no user profile.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   post:
 *     summary: Create a staff account with a temporary password
 *     description: |
 *       SCRUM-52: asks the `staff-account` Edge Function — the only holder of the service-role key —
 *       to create a real Supabase Auth account for a colleague, with the temporary password the
 *       owner typed. The account is added to the organization's register (`source = provisioned`)
 *       and must change that password on first sign-in; it then joins with the organization code
 *       like any other invited account. OWNER/CHU of the organization only.
 *     tags:
 *       - Organizations
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               full_name:
 *                 type: string
 *                 maxLength: 120
 *                 nullable: true
 *               role:
 *                 type: string
 *                 enum: [EMPLOYEE, CHU]
 *                 default: EMPLOYEE
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Mật khẩu tạm; hệ thống không lưu lại, chủ sở hữu tự trao cho nhân viên.
 *     responses:
 *       201:
 *         description: The account was created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffProvisionResult'
 *       400:
 *         description: The JSON body is invalid, or a field failed validation.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication is required.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: No profile, no organization, or a role that may not manage accounts.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: The email already has an account or already belongs to the organization.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many accounts were created for this organization in the last hour.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       503:
 *         description: The staff account Edge Function is not deployed (or not reachable).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: An unexpected server error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
import { NextResponse } from "next/server";

import { EdgeFunctionStaffProvisioningService } from "@/lib/infrastructure/EdgeFunctionStaffProvisioningService";
import { GetStaffProvisioningAvailabilityUseCase } from "@/lib/usecases/GetStaffProvisioningAvailabilityUseCase";
import { ProvisionStaffAccountUseCase } from "@/lib/usecases/ProvisionStaffAccountUseCase";
import { organizationErrorResponse } from "@/app/api/organizations/_lib/organizationErrorResponse";
import { requireCaller } from "@/app/api/organizations/_lib/requireCaller";

export async function GET() {
  const caller = await requireCaller();

  if (!caller.ok) {
    return caller.response;
  }

  try {
    const getAvailability = new GetStaffProvisioningAvailabilityUseCase(
      new EdgeFunctionStaffProvisioningService(),
    );
    const available = await getAvailability.execute({
      callerToken: caller.accessToken,
    });

    return NextResponse.json({ available });
  } catch (error) {
    // A probe never fails the screen: "not available" is the answer that keeps the form hidden.
    console.error("Failed to probe the staff account service", error);
    return NextResponse.json({ available: false });
  }
}

export async function POST(request: Request) {
  let body: {
    email?: unknown;
    full_name?: unknown;
    role?: unknown;
    password?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json(
      { error: "email and password are required and must be strings." },
      { status: 400 },
    );
  }

  if (
    body.full_name !== undefined &&
    body.full_name !== null &&
    typeof body.full_name !== "string"
  ) {
    return NextResponse.json(
      { error: "full_name must be a string or null." },
      { status: 400 },
    );
  }

  const role = body.role ?? "EMPLOYEE";

  if (typeof role !== "string") {
    return NextResponse.json({ error: "role must be a string." }, { status: 400 });
  }

  const caller = await requireCaller();

  if (!caller.ok) {
    return caller.response;
  }

  try {
    const provisionAccount = new ProvisionStaffAccountUseCase(
      new EdgeFunctionStaffProvisioningService(),
    );
    const result = await provisionAccount.execute({
      callerToken: caller.accessToken,
      callerRole: caller.role,
      email: body.email,
      fullName: typeof body.full_name === "string" ? body.full_name : null,
      role,
      // Never stored or logged: it goes straight to the Edge Function, which needs it once.
      password: body.password,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const mapped = organizationErrorResponse(error, "Failed to create staff account");

    if (mapped) {
      return mapped;
    }

    return NextResponse.json(
      { error: "Unable to create the staff account." },
      { status: 500 },
    );
  }
}
