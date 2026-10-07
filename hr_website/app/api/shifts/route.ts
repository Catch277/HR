/**
 * @swagger
 * /api/shifts:
 *   get:
 *     summary: Get shifts with optional filters
 *     tags:
 *       - Shifts
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *         description: Inclusive lower bound compared lexically with shift dates.
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *         description: Inclusive upper bound compared lexically with shift dates.
 *     responses:
 *       200:
 *         description: Shifts matching the optional filters.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MockShift'
 *   post:
 *     summary: Create a shift
 *     tags:
 *       - Shifts
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employee_id
 *               - date
 *               - branch_id
 *               - shift_id
 *             properties:
 *               employee_id:
 *                 type: string
 *               date:
 *                 type: string
 *               branch_id:
 *                 type: string
 *               shift_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: The created shift.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MockShift'
 *       400:
 *         description: The JSON body is invalid or required fields are missing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: The shift data is invalid or overlaps with an existing shift.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
import { NextRequest, NextResponse } from "next/server";
import { createMockShift, getMockShifts } from "@/lib/mock/adminStore";

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get("branch_id") ?? undefined;
  const startDate = request.nextUrl.searchParams.get("start_date") ?? undefined;
  const endDate = request.nextUrl.searchParams.get("end_date") ?? undefined;
  return NextResponse.json(getMockShifts(branchId, startDate, endDate));
}

export async function POST(request: Request) {
  let body: { employee_id?: unknown; date?: unknown; branch_id?: unknown; shift_id?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (![body.employee_id, body.date, body.branch_id, body.shift_id].every((value) => typeof value === "string" && value.trim())) {
    return NextResponse.json({ error: "employee_id, date, branch_id và shift_id là bắt buộc." }, { status: 400 });
  }
  const result = createMockShift({ employeeId: body.employee_id as string, date: body.date as string, branchId: body.branch_id as string, shiftId: body.shift_id as string });
  if ("error" in result) return NextResponse.json(result, { status: 409 });
  return NextResponse.json(result.item, { status: 201 });
}
