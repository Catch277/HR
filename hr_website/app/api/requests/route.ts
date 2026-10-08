/**
 * @swagger
 * /api/requests:
 *   get:
 *     summary: List staff requests
 *     description: |
 *       The approval queue of SCRUM-41: leave, shift-swap and adjustment requests with the
 *       requester name embedded from `requests.user_id`. The value `all` disables a filter, which
 *       is what the dashboard pills send.
 *     tags:
 *       - Requests
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED, all]
 *         description: Exact status to filter by; "all" disables this filter.
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *         description: Branch UUID to filter by; "all" disables this filter.
 *     responses:
 *       200:
 *         description: Requests matching the optional filters, most recently updated first.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RequestEntity'
 *       400:
 *         description: branch_id is neither a UUID nor "all".
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
 *       500:
 *         description: An unexpected server error occurred.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
import { NextResponse, type NextRequest } from "next/server";

import { SupabaseRequestRepository } from "@/lib/infrastructure/repositories/SupabaseRequestRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";
import { GetFilteredRequestsUseCase } from "@/lib/usecases/GetFilteredRequestsUseCase";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** The pills send `all` to mean "no filter on this dimension". */
function activeFilter(value: string | null): string | undefined {
  return value && value !== "all" ? value : undefined;
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const status = activeFilter(params.get("status"));
  const branchId = activeFilter(params.get("branch_id"));

  if (branchId && !UUID_PATTERN.test(branchId)) {
    return NextResponse.json(
      { error: "branch_id must be a UUID or all." },
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

    const getRequests = new GetFilteredRequestsUseCase(
      new SupabaseRequestRepository(),
    );
    const requests = await getRequests.execute({ status, branchId });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to list requests", error);
    return NextResponse.json(
      { error: "Unable to retrieve requests." },
      { status: 500 },
    );
  }
}
