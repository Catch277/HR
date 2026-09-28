/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get a user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The user's UUID.
 *     responses:
 *       200:
 *         description: The requested user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: The id query parameter is missing.
 *       404:
 *         description: No user exists with the supplied ID.
 *       500:
 *         description: An unexpected server error occurred.
 */
import { type NextRequest, NextResponse } from "next/server";

import { SupabaseUserRepository } from "@/lib/infrastructure/repositories/SupabaseUserRepository";
import { GetUserUseCase } from "@/lib/usecases/GetUserUseCase";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "The id query parameter is required." },
      { status: 400 },
    );
  }

  try {
    const getUser = new GetUserUseCase(new SupabaseUserRepository());
    const user = await getUser.execute(id);

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Failed to get user", error);
    return NextResponse.json(
      { error: "Unable to retrieve user." },
      { status: 500 },
    );
  }
}
