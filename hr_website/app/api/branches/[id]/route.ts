/**
 * @swagger
 * /api/branches/{id}:
 *   put:
 *     summary: Update a branch
 *     description: Replaces the editable fields of one branch (name, address, manager, GPS geofence). Restricted to OWNER/CHU accounts by RLS.
 *     tags:
 *       - Branches
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The branch UUID.
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
 *               address:
 *                 type: string
 *                 maxLength: 300
 *                 nullable: true
 *               manager_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 nullable: true
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 nullable: true
 *               attendance_radius:
 *                 type: integer
 *                 minimum: 10
 *                 maximum: 2000
 *                 description: Allowed check-in distance in metres. Keeps the current value when omitted.
 *     responses:
 *       200:
 *         description: The updated branch.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Branch'
 *       400:
 *         description: The route parameter or request body is invalid.
 *       401:
 *         description: Authentication is required.
 *       404:
 *         description: No branch exists with the supplied ID, or the caller may not update it.
 *       500:
 *         description: An unexpected server error occurred.
 */
import { NextResponse } from "next/server";

import { BranchNotFoundError } from "@/lib/domain/errors/BranchNotFoundError";
import { SupabaseBranchRepository } from "@/lib/infrastructure/repositories/SupabaseBranchRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";
import { UpdateBranchUseCase } from "@/lib/usecases/UpdateBranchUseCase";
import {
  UUID_PATTERN,
  parseBranchRequest,
} from "@/app/api/branches/_lib/branchRequest";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: "The branch id must be a UUID." },
      { status: 400 },
    );
  }

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

    const updateBranch = new UpdateBranchUseCase(new SupabaseBranchRepository());
    const branch = await updateBranch.execute(id, parsed.input);

    return NextResponse.json(branch);
  } catch (error) {
    if (error instanceof BranchNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Failed to update branch", error);
    return NextResponse.json(
      { error: "Unable to update branch." },
      { status: 500 },
    );
  }
}
