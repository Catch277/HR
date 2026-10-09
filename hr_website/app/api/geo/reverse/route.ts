/**
 * @swagger
 * /api/geo/reverse:
 *   get:
 *     summary: Turn a coordinate into an address
 *     description: |
 *       Reverse geocoding for the branch form: the pin on the map becomes the "Địa chỉ" text, so the
 *       operator does not have to type it. Addresses come from Nominatim (OpenStreetMap) — the same
 *       project the branch map draws its tiles from — and need no API key. The coordinate must be
 *       inside Vietnamese territory, exactly the rule the geofence itself enforces. `address` is
 *       null when the provider knows no address for that point; `503` when it cannot be reached.
 *     tags:
 *       - Branches
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: 8.5436
 *           maximum: 23.3883
 *         description: "Vĩ độ của điểm cần tra cứu."
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           minimum: 102.0967
 *           maximum: 109.4944
 *         description: "Kinh độ của điểm cần tra cứu."
 *     responses:
 *       200:
 *         description: The address of the coordinate, or null when the provider has none.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReverseGeocodeResult'
 *       400:
 *         description: The coordinates are missing, not numbers, out of range, or outside Vietnam.
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
 *       503:
 *         description: The address lookup service is not available; type the address instead.
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
import { type NextRequest, NextResponse } from "next/server";

import { ReverseGeocodingUnavailableError } from "@/lib/domain/errors/ReverseGeocodingUnavailableError";
import { isInsideVietnam } from "@/lib/geo/vietnam";
import { NominatimReverseGeocodingService } from "@/lib/infrastructure/NominatimReverseGeocodingService";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";
import { ReverseGeocodeUseCase } from "@/lib/usecases/ReverseGeocodeUseCase";

export async function GET(request: NextRequest) {
  // The params are read as text first: `Number("")` is 0, so an absent coordinate would otherwise
  // look like a valid point at 0°/0°.
  const rawLatitude = request.nextUrl.searchParams.get("latitude");
  const rawLongitude = request.nextUrl.searchParams.get("longitude");

  if (
    rawLatitude === null ||
    rawLongitude === null ||
    rawLatitude.trim() === "" ||
    rawLongitude.trim() === ""
  ) {
    return NextResponse.json(
      { error: "latitude and longitude are required." },
      { status: 400 },
    );
  }

  const latitude = Number(rawLatitude);
  const longitude = Number(rawLongitude);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return NextResponse.json(
      {
        error:
          "latitude must be between -90 and 90 and longitude between -180 and 180.",
      },
      { status: 400 },
    );
  }

  // The lookup only exists to fill a branch address, and a branch has to sit in Vietnam — the same
  // rule the map picker, the branch parser and `branches_vietnam_bounds_check` apply, so a point in
  // the sea or in Laos never reaches the provider (and never becomes a free geocoding proxy).
  if (!isInsideVietnam(latitude, longitude)) {
    return NextResponse.json(
      {
        error:
          "Coordinates must be inside Vietnamese territory (mainland or an island with a branch).",
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

    const reverseGeocode = new ReverseGeocodeUseCase(
      new NominatimReverseGeocodingService(),
    );
    const address = await reverseGeocode.execute(latitude, longitude);

    return NextResponse.json({ address });
  } catch (error) {
    if (error instanceof ReverseGeocodingUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    console.error("Failed to look up the address", error);
    return NextResponse.json(
      { error: "Unable to look up the address." },
      { status: 500 },
    );
  }
}
