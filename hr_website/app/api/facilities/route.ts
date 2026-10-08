/**
 * @swagger
 * /api/facilities:
 *   get:
 *     summary: List facilities
 *     description: Returns the per-branch facilities visible to the authenticated caller under the active RLS policy, sorted by name. SCRUM-45.
 *     tags:
 *       - Facilities
 *     parameters:
 *       - in: query
 *         name: branch_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Restrict the list to one branch.
 *     responses:
 *       200:
 *         description: The facility list.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Facility'
 *       400:
 *         description: branch_id is not a UUID.
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
 *   post:
 *     summary: Create a facility
 *     description: Registers one facility of a branch. Restricted to OWNER/CHU accounts by RLS.
 *     tags:
 *       - Facilities
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FacilityWriteRequest'
 *     responses:
 *       201:
 *         description: The facility was created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Facility'
 *       400:
 *         description: The request body is invalid.
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

import { SupabaseFacilityRepository } from "@/lib/infrastructure/repositories/SupabaseFacilityRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";
import { CreateFacilityUseCase } from "@/lib/usecases/CreateFacilityUseCase";
import { ListFacilitiesUseCase } from "@/lib/usecases/ListFacilitiesUseCase";
import { UUID_PATTERN, parseFacilityRequest } from "@/app/api/facilities/_lib/facilityRequest";

async function requireUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return error || !user ? null : user.id;
}

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get("branch_id") ?? undefined;

  if (branchId && !UUID_PATTERN.test(branchId)) {
    return NextResponse.json(
      { error: "branch_id must be a UUID." },
      { status: 400 },
    );
  }

  try {
    if (!(await requireUserId())) {
      return NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 },
      );
    }

    const listFacilities = new ListFacilitiesUseCase(
      new SupabaseFacilityRepository(),
    );
    const facilities = await listFacilities.execute({ branchId });

    return NextResponse.json(facilities);
  } catch (error) {
    console.error("Failed to list facilities", error);
    return NextResponse.json(
      { error: "Unable to retrieve facilities." },
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

  const parsed = parseFacilityRequest(body);

  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  try {
    if (!(await requireUserId())) {
      return NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 },
      );
    }

    const createFacility = new CreateFacilityUseCase(
      new SupabaseFacilityRepository(),
    );
    const facility = await createFacility.execute(parsed.input);

    return NextResponse.json(facility, { status: 201 });
  } catch (error) {
    console.error("Failed to create facility", error);
    return NextResponse.json(
      { error: "Unable to create facility." },
      { status: 500 },
    );
  }
}
