/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Get requests with optional filters
 *     tags:
 *       - Requests
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Exact request status to filter by; "all" disables this filter.
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Exact branch ID to filter by; "all" disables this filter.
 *     responses:
 *       200:
 *         description: Requests matching the optional filters.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MockRequest'
 */
import { NextRequest, NextResponse } from "next/server";
import { getMockRequests } from "@/lib/mock/adminStore";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const branchId = request.nextUrl.searchParams.get("branch_id") ?? undefined;
  return NextResponse.json(getMockRequests(status, branchId));
}
