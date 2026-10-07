/**
 * @swagger
 * /api/attendance:
 *   get:
 *     summary: Get attendance records with optional filters
 *     tags:
 *       - Attendance
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance records matching the optional filters.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MockAttendance'
 */
import { NextRequest, NextResponse } from "next/server";
import { getMockAttendance } from "@/lib/mock/adminStore";

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get("branch_id") ?? undefined;
  const employeeId = request.nextUrl.searchParams.get("employee_id") ?? undefined;
  return NextResponse.json(getMockAttendance(branchId, employeeId));
}
