/**
 * @swagger
 * /api/employee-status:
 *   get:
 *     summary: Get employee statuses with an optional branch filter
 *     tags:
 *       - Employees
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee statuses and the response generation timestamp.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - updated_at
 *                 - data
 *               properties:
 *                 updated_at:
 *                   type: string
 *                   format: date-time
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MockEmployeeStatus'
 */
import { NextRequest, NextResponse } from "next/server";
import { getMockEmployeeStatuses } from "@/lib/mock/adminStore";

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get("branch_id") ?? undefined;
  return NextResponse.json({ updated_at: new Date().toISOString(), data: getMockEmployeeStatuses(branchId) });
}
