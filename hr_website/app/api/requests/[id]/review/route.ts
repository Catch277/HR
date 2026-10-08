/**
 * @swagger
 * /api/requests/{id}/review:
 *   patch:
 *     summary: Approve or reject a request
 *     description: |
 *       Sets `requests.status` together with `reject_reason` and `approver_id`. Restricted to
 *       OWNER/CHU accounts: the use case checks the caller's role and the
 *       `requests_update_managers` RLS policy (SCRUM-41) repeats the check in the database.
 *     tags:
 *       - Requests
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               reject_reason:
 *                 type: string
 *                 maxLength: 500
 *                 nullable: true
 *                 description: Required and non-empty when status is REJECTED.
 *     responses:
 *       200:
 *         description: The updated request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RequestEntity'
 *       400:
 *         description: The id is not a UUID, the body is invalid, or a rejection has no reason.
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
 *         description: The caller has no user profile, or the role may not review requests.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: The request does not exist or is not reviewable by the caller.
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

import type { ReviewStatus } from "@/lib/domain/entities/RequestEntity";
import { RequestNotFoundError } from "@/lib/domain/errors/RequestNotFoundError";
import { RequestReviewForbiddenError } from "@/lib/domain/errors/RequestReviewForbiddenError";
import { SupabaseRequestRepository } from "@/lib/infrastructure/repositories/SupabaseRequestRepository";
import { SupabaseUserRepository } from "@/lib/infrastructure/repositories/SupabaseUserRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";
import { GetUserUseCase } from "@/lib/usecases/GetUserUseCase";
import { ReviewRequestUseCase } from "@/lib/usecases/ReviewRequestUseCase";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ReviewRequestBody = {
  status?: unknown;
  reject_reason?: unknown;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: "The request id must be a UUID." },
      { status: 400 },
    );
  }

  let body: ReviewRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.status !== "APPROVED" && body.status !== "REJECTED") {
    return NextResponse.json(
      { error: "status must be APPROVED or REJECTED." },
      { status: 400 },
    );
  }

  if (
    body.reject_reason !== undefined &&
    body.reject_reason !== null &&
    (typeof body.reject_reason !== "string" || body.reject_reason.length > 500)
  ) {
    return NextResponse.json(
      { error: "reject_reason must be a string of at most 500 characters." },
      { status: 400 },
    );
  }

  const status: ReviewStatus = body.status;
  const rejectReason =
    typeof body.reject_reason === "string" ? body.reject_reason : null;

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

    // The role comes from `public.users`, never from the request body. A signed-in account with
    // no profile row cannot be placed in a role, so it is a 403 rather than a 401 (see /api/search).
    const getUser = new GetUserUseCase(new SupabaseUserRepository());
    const profile = await getUser.execute(user.id);

    if (!profile) {
      return NextResponse.json(
        { error: "The account has no user profile." },
        { status: 403 },
      );
    }

    const reviewRequest = new ReviewRequestUseCase(
      new SupabaseRequestRepository(),
    );
    const reviewed = await reviewRequest.execute({
      requestId: id,
      status,
      rejectReason,
      // Ownership always comes from the session.
      approverId: user.id,
      approverRole: profile.role,
    });

    return NextResponse.json(reviewed);
  } catch (error) {
    if (error instanceof RequestNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof RequestReviewForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (
      error instanceof Error &&
      error.message.startsWith("reject_reason is required")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Failed to review request", error);
    return NextResponse.json(
      { error: "Unable to review the request." },
      { status: 500 },
    );
  }
}
