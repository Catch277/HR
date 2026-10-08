/**
 * @swagger
 * /api/attendance/{id}/verify:
 *   patch:
 *     summary: Verify an attendance record
 *     description: |
 *       Stamps `verified_by` and `verified_at` on one record: this is the web review action of
 *       SCRUM-22 (toạ độ + ảnh xác minh + trạng thái hợp lệ). Restricted to OWNER/CHU accounts,
 *       and the `attendance_update_managers` RLS policy repeats the check in the database.
 *     tags:
 *       - Attendance
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The verified attendance record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: The id is not a UUID.
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
 *         description: The caller has no user profile, or the role may not verify records.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: The record does not exist or is not verifiable by the caller.
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

import { AttendanceNotFoundError } from "@/lib/domain/errors/AttendanceNotFoundError";
import { AttendanceVerifyForbiddenError } from "@/lib/domain/errors/AttendanceVerifyForbiddenError";
import { SupabaseAttendanceRepository } from "@/lib/infrastructure/repositories/SupabaseAttendanceRepository";
import { SupabaseUserRepository } from "@/lib/infrastructure/repositories/SupabaseUserRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";
import { GetUserUseCase } from "@/lib/usecases/GetUserUseCase";
import { VerifyAttendanceUseCase } from "@/lib/usecases/VerifyAttendanceUseCase";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: "The attendance id must be a UUID." },
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

    // The role comes from `public.users`, never from the request body.
    const getUser = new GetUserUseCase(new SupabaseUserRepository());
    const profile = await getUser.execute(user.id);

    if (!profile) {
      return NextResponse.json(
        { error: "The account has no user profile." },
        { status: 403 },
      );
    }

    const verifyAttendance = new VerifyAttendanceUseCase(
      new SupabaseAttendanceRepository(),
    );
    const record = await verifyAttendance.execute({
      attendanceId: id,
      verifierId: user.id,
      verifierRole: profile.role,
    });

    return NextResponse.json(record);
  } catch (error) {
    if (error instanceof AttendanceNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof AttendanceVerifyForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    console.error("Failed to verify attendance", error);
    return NextResponse.json(
      { error: "Unable to verify the attendance record." },
      { status: 500 },
    );
  }
}