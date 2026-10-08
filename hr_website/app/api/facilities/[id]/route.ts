/**
 * @swagger
 * /api/facilities/{id}:
 *   put:
 *     summary: Update a facility
 *     description: Replaces the editable fields of one facility. Restricted to OWNER/CHU accounts by RLS; a hidden or unknown id answers 404. SCRUM-45.
 *     tags:
 *       - Facilities
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
 *             $ref: '#/components/schemas/FacilityWriteRequest'
 *     responses:
 *       200:
 *         description: The updated facility.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Facility'
 *       400:
 *         description: The id is not a UUID, or the request body is invalid.
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
 *       404:
 *         description: The facility does not exist or is not updatable by the caller.
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
 *   delete:
 *     summary: Delete a facility
 *     description: Removes one facility from the registry. Restricted to OWNER/CHU accounts by RLS. SCRUM-45.
 *     tags:
 *       - Facilities
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The facility was deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: The id is not a UUID.
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
 *       404:
 *         description: The facility does not exist or is not deletable by the caller.
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

import { FacilityNotFoundError } from "@/lib/domain/errors/FacilityNotFoundError";
import { SupabaseFacilityRepository } from "@/lib/infrastructure/repositories/SupabaseFacilityRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";
import { DeleteFacilityUseCase } from "@/lib/usecases/DeleteFacilityUseCase";
import { UpdateFacilityUseCase } from "@/lib/usecases/UpdateFacilityUseCase";
import { UUID_PATTERN, parseFacilityRequest } from "@/app/api/facilities/_lib/facilityRequest";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: "The facility id must be a UUID." },
      { status: 400 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseFacilityRequest(body);

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

    const updateFacility = new UpdateFacilityUseCase(
      new SupabaseFacilityRepository(),
    );
    const facility = await updateFacility.execute(id, parsed.input);

    return NextResponse.json(facility);
  } catch (error) {
    if (error instanceof FacilityNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Failed to update facility", error);
    return NextResponse.json(
      { error: "Unable to update facility." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!UUID_PATTERN.test(id)) {
    return NextResponse.json(
      { error: "The facility id must be a UUID." },
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

    const deleteFacility = new DeleteFacilityUseCase(
      new SupabaseFacilityRepository(),
    );
    await deleteFacility.execute(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof FacilityNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error("Failed to delete facility", error);
    return NextResponse.json(
      { error: "Unable to delete facility." },
      { status: 500 },
    );
  }
}
