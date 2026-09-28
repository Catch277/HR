/**
 * @swagger
 * /api/revenue/close:
 *   put:
 *     summary: Declare closing revenue for a branch
 *     description: Closes the current business day's opening-revenue record for a branch (Asia/Bangkok).
 *     tags:
 *       - Revenue
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch_id
 *               - close_amount
 *             properties:
 *               branch_id:
 *                 type: string
 *                 format: uuid
 *                 description: The branch UUID.
 *               close_amount:
 *                 type: number
 *                 minimum: 0
 *                 example: 2200000
 *               close_note:
 *                 type: string
 *                 nullable: true
 *                 example: Cash counted and reconciled at shift end.
 *               close_image_url:
 *                 type: string
 *                 format: uri
 *                 nullable: true
 *                 example: https://example.supabase.co/storage/v1/object/public/revenue/close.jpg
 *     responses:
 *       200:
 *         description: Closing revenue was declared successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - revenue
 *                 - revenue_difference
 *               properties:
 *                 revenue:
 *                   $ref: '#/components/schemas/RevenueRecord'
 *                 revenue_difference:
 *                   type: number
 *                   description: close_amount minus open_amount; UI can use this for warnings.
 *       400:
 *         description: The request body is invalid.
 *       401:
 *         description: Authentication is required.
 *       404:
 *         description: No opening-revenue declaration exists for this branch today.
 *       500:
 *         description: An unexpected server error occurred.
 */
import { NextResponse } from "next/server";

import { OpenRevenueNotFoundError } from "@/lib/domain/errors/OpenRevenueNotFoundError";
import { SupabaseRevenueRepository } from "@/lib/infrastructure/repositories/SupabaseRevenueRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";
import { DeclareCloseRevenueUseCase } from "@/lib/usecases/DeclareCloseRevenueUseCase";

type CloseRevenueRequest = {
  branch_id?: unknown;
  close_amount?: unknown;
  close_note?: unknown;
  close_image_url?: unknown;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PUT(request: Request) {
  let body: CloseRevenueRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    typeof body.branch_id !== "string" ||
    !UUID_PATTERN.test(body.branch_id) ||
    typeof body.close_amount !== "number" ||
    !Number.isFinite(body.close_amount) ||
    body.close_amount < 0 ||
    (body.close_note !== undefined && typeof body.close_note !== "string") ||
    (body.close_image_url !== undefined &&
      typeof body.close_image_url !== "string")
  ) {
    return NextResponse.json(
      {
        error:
          "branch_id must be a UUID, close_amount must be a non-negative number, and optional close_note/close_image_url must be strings.",
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

    const declareCloseRevenue = new DeclareCloseRevenueUseCase(
      new SupabaseRevenueRepository(),
    );
    const result = await declareCloseRevenue.execute({
      branchId: body.branch_id,
      closeAmount: body.close_amount,
      closeNote: body.close_note ?? null,
      closeImageUrl: body.close_image_url ?? null,
      closedBy: user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof OpenRevenueNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Failed to declare closing revenue", error);
    return NextResponse.json(
      { error: "Unable to declare closing revenue." },
      { status: 500 },
    );
  }
}
