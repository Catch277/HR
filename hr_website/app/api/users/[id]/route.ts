/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Change a staff member's role or employment state
 *     description: |
 *       SCRUM-24: gives an account a different role (`OWNER`, `CHU`, `EMPLOYEE`) or marks it as
 *       left/returned (`is_active`). Restricted to OWNER/CHU, only an OWNER may grant or revoke
 *       the OWNER role, and nobody may change their own role or deactivate themselves.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *               - is_active
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [OWNER, CHU, EMPLOYEE]
 *               is_active:
 *                 type: boolean
 *                 description: false means the account has left the company.
 *     responses:
 *       200:
 *         description: The updated staff member.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StaffMember'
 *       400:
 *         description: The id is not a UUID, the body is invalid, or the change would lock the caller out.
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
 *         description: The caller has no profile, is not a manager, or tried to touch the OWNER role.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: The account does not exist or is not updatable by the caller.
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

import { STAFF_ROLES, type StaffRole } from "@/lib/domain/entities/StaffMember";
import { StaffForbiddenError } from "@/lib/domain/errors/StaffForbiddenError";
import { StaffNotFoundError } from "@/lib/domain/errors/StaffNotFoundError";
import { SupabaseUserRepository } from "@/lib/infrastructure/repositories/SupabaseUserRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";
import { GetUserUseCase } from "@/lib/usecases/GetUserUseCase";
import { UpdateStaffUseCase } from "@/lib/usecases/UpdateStaffUseCase";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const ROLE_SET: ReadonlySet<string> = new Set(STAFF_ROLES);

type StaffRequestBody = {
  role?: unknown;
  is_active?: unknown;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: "The user id must be a UUID." },
      { status: 400 },
    );
  }

  let body: StaffRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (typeof body.role !== "string" || !ROLE_SET.has(body.role)) {
    return NextResponse.json(
      { error: `role must be one of ${STAFF_ROLES.join(", ")}.` },
      { status: 400 },
    );
  }

  if (typeof body.is_active !== "boolean") {
    return NextResponse.json(
      { error: "is_active must be a boolean." },
      { status: 400 },
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 },
      );
    }

    const getUser = new GetUserUseCase(new SupabaseUserRepository());
    const profile = await getUser.execute(user.id);

    if (!profile) {
      return NextResponse.json(
        { error: "The account has no user profile." },
        { status: 403 },
      );
    }

    const updateStaff = new UpdateStaffUseCase(new SupabaseUserRepository());
    const staff = await updateStaff.execute({
      staffId: id,
      role: body.role as StaffRole,
      isActive: body.is_active,
      callerId: user.id,
      callerRole: profile.role,
    });

    return NextResponse.json(staff);
  } catch (error) {
    if (error instanceof StaffNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof StaffForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (
      error instanceof Error &&
      (error.message.startsWith("role must") ||
        error.message.startsWith("You cannot change your own role"))
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to update staff member", error);
    return NextResponse.json(
      { error: "Unable to update the staff member." },
      { status: 500 },
    );
  }
}