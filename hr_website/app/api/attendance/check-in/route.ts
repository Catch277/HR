/**
 * @swagger
 * /api/attendance/check-in:
 *   post:
 *     summary: Clock in to a shift the schedule assigned today
 *     description: |
 *       Chấm công đầu ca (SCRUM-22). The caller clocks in for **their own** shift of today: the branch
 *       and the shift come from their `SCHEDULED` assignment, never from the request, and a request
 *       with no such assignment is refused (`404`). The time is the server clock, not the device's.
 *       The status is `LATE` when the clock-in is more than 5 minutes after the shift starts,
 *       otherwise `ON_TIME`. The distance to the branch centre is computed by the database from the
 *       coordinates; whether it is inside the allowed radius is judged on the Bảng công screen.
 *
 *       With exactly one shift today `assignment_id` may be omitted; with several it is required.
 *       The photo is uploaded by the app beforehand — only its address is stored here.
 *     tags:
 *       - Attendance
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 example: 10.7769
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 example: 106.7009
 *               photo_url:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 2000
 *               note:
 *                 type: string
 *                 nullable: true
 *                 maxLength: 300
 *               assignment_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Which of today's shifts is starting. Required when there are several.
 *     responses:
 *       201:
 *         description: The attendance record that was created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: The body is invalid, or `assignment_id` is missing while there are several shifts today.
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
 *         description: The account has no profile, or its role may not use the timesheet.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: The caller has no scheduled shift to clock in for today.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: The caller already clocked in for this shift.
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

import {
  clockErrorResponse,
  parseClockBody,
  readClockBody,
} from "@/app/api/attendance/_lib/clock";
import { requireCapability } from "@/app/api/_lib/requireCaller";
import { SupabaseAttendanceClockRepository } from "@/lib/infrastructure/repositories/SupabaseAttendanceClockRepository";
import { SupabaseShiftAssignmentRepository } from "@/lib/infrastructure/repositories/SupabaseShiftAssignmentRepository";
import { CheckInUseCase } from "@/lib/usecases/CheckInUseCase";

export async function POST(request: Request) {
  const body = await readClockBody(request);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseClockBody(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.message }, { status: 400 });
  }

  try {
    const caller = await requireCapability("attendance:view");

    if (!caller.ok) {
      return caller.response;
    }

    const checkIn = new CheckInUseCase(
      new SupabaseAttendanceClockRepository(),
      new SupabaseShiftAssignmentRepository(),
    );
    const record = await checkIn.execute({
      ...parsed.point,
      assignmentId: parsed.assignmentId,
      employeeId: caller.userId,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    const mapped = clockErrorResponse(error);

    if (mapped) {
      return mapped;
    }

    console.error("Failed to record the check-in", error);
    return NextResponse.json(
      { error: "Unable to record the check-in." },
      { status: 500 },
    );
  }
}
