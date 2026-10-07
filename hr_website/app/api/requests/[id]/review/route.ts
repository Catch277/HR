/**
 * @swagger
 * /api/requests/{id}/review:
 *   patch:
 *     summary: Approve or reject a request
 *     tags:
 *       - Requests
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *                 enum:
 *                   - APPROVED
 *                   - REJECTED
 *               reject_reason:
 *                 type: string
 *                 description: Required and non-empty when status is REJECTED.
 *     responses:
 *       200:
 *         description: The updated request.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MockRequest'
 *       400:
 *         description: The JSON body or review data is invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: The request was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
import { NextResponse } from "next/server";
import { reviewMockRequest } from "@/lib/mock/adminStore";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let body: { status?: unknown; reject_reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (body.status !== "APPROVED" && body.status !== "REJECTED") {
    return NextResponse.json({ error: "status must be APPROVED or REJECTED." }, { status: 400 });
  }
  if (body.status === "REJECTED" && (typeof body.reject_reason !== "string" || !body.reject_reason.trim())) {
    return NextResponse.json({ error: "reject_reason is required when rejecting." }, { status: 400 });
  }

  const result = reviewMockRequest(id, body.status, typeof body.reject_reason === "string" ? body.reject_reason.trim() : null);
  if (!result) return NextResponse.json({ error: "Request not found." }, { status: 404 });
  return NextResponse.json(result);
}
