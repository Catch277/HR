/**
 * @swagger
 * /api/revenue/open:
 *   post:
 *     summary: Declare opening revenue for a branch
 *     description: Creates one opening-revenue declaration per branch for the current business day (Asia/Bangkok).
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
 *               - open_amount
 *             properties:
 *               branch_id:
 *                 type: string
 *                 format: uuid
 *                 description: The branch UUID.
 *               open_amount:
 *                 type: number
 *                 minimum: 0
 *                 example: 1500000
 *     responses:
 *       201:
 *         description: Opening revenue was declared successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RevenueRecord'
 *       400:
 *         description: The request body is invalid.
 *       401:
 *         description: Authentication is required.
 *       409:
 *         description: Opening revenue was already declared for this branch today.
 *       500:
 *         description: An unexpected server error occurred.
 */
import { NextResponse } from "next/server";

import { RevenueAlreadyDeclaredError } from "@/lib/domain/errors/RevenueAlreadyDeclaredError";
import { SupabaseRevenueRepository } from "@/lib/infrastructure/repositories/SupabaseRevenueRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";
import { DeclareOpenRevenueUseCase } from "@/lib/usecases/DeclareOpenRevenueUseCase";

type OpenRevenueRequest = {
  branch_id?: unknown;
  open_amount?: unknown;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  let body: OpenRevenueRequest;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    typeof body.branch_id !== "string" ||
    !UUID_PATTERN.test(body.branch_id) ||
    typeof body.open_amount !== "number" ||
    !Number.isFinite(body.open_amount) ||
    body.open_amount < 0
  ) {
    return NextResponse.json(
      {
        error:
          "branch_id must be a UUID and open_amount must be a non-negative number.",
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

    const declareOpenRevenue = new DeclareOpenRevenueUseCase(
      new SupabaseRevenueRepository(),
    );
    const record = await declareOpenRevenue.execute({
      branchId: body.branch_id,
      openAmount: body.open_amount,
      createdBy: user.id,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    if (error instanceof RevenueAlreadyDeclaredError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error("Failed to declare opening revenue", error);
    return NextResponse.json(
      { error: "Unable to declare opening revenue." },
      { status: 500 },
    );
  }
}
