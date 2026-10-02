/**
 * @swagger
 * /api/requests/{id}/review:
 *   patch:
 *     summary: Approve or reject a request as an owner
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
 *                 nullable: true
 *                 description: Required when status is REJECTED.
 *     responses:
 *       200:
 *         description: The reviewed request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RequestEntity'
 *       400:
 *         description: The ID or request body is invalid.
 *       401:
 *         description: Authentication is required.
 *       403:
 *         description: The authenticated account is not an owner.
 *       404:
 *         description: The request was not found.
 *       500:
 *         description: An unexpected server error occurred.
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

type ReviewRequestBody = {
  status?: unknown;
  reject_reason?: unknown;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json({ error: "id must be a UUID." }, { status: 400 });
  }

  let body: ReviewRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    (body.status !== "APPROVED" && body.status !== "REJECTED") ||
    (body.reject_reason !== undefined && typeof body.reject_reason !== "string") ||
    (body.status === "REJECTED" &&
      (typeof body.reject_reason !== "string" || !body.reject_reason.trim()))
  ) {
    return NextResponse.json(
      {
        error:
          "status must be APPROVED or REJECTED; reject_reason is required when rejecting.",
      },
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

    const approver = await new GetUserUseCase(
      new SupabaseUserRepository(),
    ).execute(user.id);

    const reviewRequest = new ReviewRequestUseCase(
      new SupabaseRequestRepository(),
    );
    const reviewedRequest = await reviewRequest.execute({
      requestId: id,
      status: body.status as ReviewStatus,
      rejectReason: body.reject_reason ?? null,
      approverId: user.id,
      approverRole: approver?.role ?? "",
    });

    return NextResponse.json(reviewedRequest);
  } catch (error) {
    if (error instanceof RequestReviewForbiddenError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    if (error instanceof RequestNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Failed to review request", error);
    return NextResponse.json(
      { error: "Unable to review request." },
      { status: 500 },
    );
  }
}
