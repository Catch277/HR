/**
 * @swagger
 * /api/branches:
 *   get:
 *     summary: List branches
 *     description: Returns every branch visible to the authenticated caller under the active RLS policy, sorted by name.
 *     tags:
 *       - Branches
 *     responses:
 *       200:
 *         description: The branch list.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Branch'
 *       401:
 *         description: Authentication is required.
 *       500:
 *         description: An unexpected server error occurred.
 *   post:
 *     summary: Create a branch
 *     description: Creates a branch together with its GPS geofence. Restricted to OWNER/CHU accounts by RLS.
 *     tags:
 *       - Branches
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 120
 *                 example: Chi nhánh Quận 1 - Flagship Bến Thành
 *               address:
 *                 type: string
 *                 maxLength: 300
 *                 nullable: true
 *                 example: 128 Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh
 *               manager_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 nullable: true
 *                 example: 10.7725
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 nullable: true
 *                 example: 106.698
 *               attendance_radius:
 *                 type: integer
 *                 minimum: 10
 *                 maximum: 2000
 *                 default: 50
 *                 description: Allowed check-in distance in metres (defaults to 50).
 *     responses:
 *       201:
 *         description: The branch was created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Branch'
 *       400:
 *         description: The request body is invalid.
 *       401:
 *         description: Authentication is required.
 *       500:
 *         description: An unexpected server error occurred.
 */
import { NextResponse } from "next/server";

import { SupabaseBranchRepository } from "@/lib/infrastructure/repositories/SupabaseBranchRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";
import { CreateBranchUseCase } from "@/lib/usecases/CreateBranchUseCase";
import { ListBranchesUseCase } from "@/lib/usecases/ListBranchesUseCase";
import { parseBranchRequest } from "@/app/api/branches/_lib/branchRequest";

export async function GET() {
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

    const listBranches = new ListBranchesUseCase(new SupabaseBranchRepository());
    const branches = await listBranches.execute();

    return NextResponse.json(branches);
  } catch (error) {
    console.error("Failed to list branches", error);
    return NextResponse.json(
      { error: "Unable to retrieve branches." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseBranchRequest(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
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

    const createBranch = new CreateBranchUseCase(new SupabaseBranchRepository());
    const branch = await createBranch.execute(parsed.input);

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error("Failed to create branch", error);
    return NextResponse.json(
      { error: "Unable to create branch." },
      { status: 500 },
    );
  }
}
