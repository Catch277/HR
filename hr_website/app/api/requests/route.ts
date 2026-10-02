/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: Get requests with optional filters
 *     tags:
 *       - Requests
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: request_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The filtered requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RequestEntity'
 *       400:
 *         description: A filter is invalid.
 *       500:
 *         description: An unexpected server error occurred.
 */
import { type NextRequest, NextResponse } from "next/server";

import { SupabaseRequestRepository } from "@/lib/infrastructure/repositories/SupabaseRequestRepository";
import { GetFilteredRequestsUseCase } from "@/lib/usecases/GetFilteredRequestsUseCase";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get("branch_id") ?? undefined;
  const requestType =
    request.nextUrl.searchParams.get("request_type") ?? undefined;
  const status = request.nextUrl.searchParams.get("status") ?? undefined;

  if (
    (branchId && !UUID_PATTERN.test(branchId)) ||
    (requestType !== undefined && !requestType.trim()) ||
    (status !== undefined && !status.trim())
  ) {
    return NextResponse.json(
      { error: "branch_id must be a UUID and string filters cannot be empty." },
      { status: 400 },
    );
  }

  try {
    const getFilteredRequests = new GetFilteredRequestsUseCase(
      new SupabaseRequestRepository(),
    );
    const requests = await getFilteredRequests.execute({
      branchId,
      requestType,
      status,
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to get filtered requests", error);
    return NextResponse.json(
      { error: "Unable to retrieve requests." },
      { status: 500 },
    );
  }
}
