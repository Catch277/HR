/**
 * @swagger
 * /api/attendance/check-out:
 *   post:
 *     summary: Clock out of the shift the caller is in
 *     description: |
 *       Chấm công cuối ca (SCRUM-29). Completes the caller's own open record of today (a check-in with
 *       no check-out); with several open records the most recent check-in is closed. The time is the
 *       server clock. Leaving more than 5 minutes before the shift ends sets `EARLY_LEAVE`, unless
 *       the record is already `LATE`, which is kept. A note left at check-in is kept when none is sent.
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
 *     responses:
 *       200:
 *         description: The attendance record with the check-out stored.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attendance'
 *       400:
 *         description: The body is invalid.
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
 *       409:
 *         description: The caller has not clocked in yet, or has already clocked out.
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
import { CheckOutUseCase } from "@/lib/usecases/CheckOutUseCase";

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

    const checkOut = new CheckOutUseCase(new SupabaseAttendanceClockRepository());
    const record = await checkOut.execute({
      ...parsed.point,
      employeeId: caller.userId,
    });

    return NextResponse.json(record, { status: 200 });
  } catch (error) {
    const mapped = clockErrorResponse(error);

    if (mapped) {
      return mapped;
    }

    console.error("Failed to record the check-out", error);
    return NextResponse.json(
      { error: "Unable to record the check-out." },
      { status: 500 },
    );
  }
}
