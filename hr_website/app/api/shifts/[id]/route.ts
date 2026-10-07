/**
 * @swagger
 * /api/shifts/{id}:
 *   patch:
 *     summary: Update a shift
 *     tags:
 *       - Shifts
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
 *             properties:
 *               employee_id:
 *                 type: string
 *               date:
 *                 type: string
 *               branch_id:
 *                 type: string
 *               shift_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: The updated shift.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MockShift'
 *       400:
 *         description: The JSON body is invalid.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: The shift was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: The update data is invalid or overlaps with an existing shift.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     summary: Delete a shift
 *     tags:
 *       - Shifts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The shift was deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - success
 *               properties:
 *                 success:
 *                   type: boolean
 *       404:
 *         description: The shift was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
import { NextResponse } from "next/server";
import { deleteMockShift, updateMockShift } from "@/lib/mock/adminStore";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  let body: { employee_id?: unknown; date?: unknown; branch_id?: unknown; shift_id?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  const input: { employeeId?: string; date?: string; branchId?: string; shiftId?: string } = {};
  if (typeof body.employee_id === "string") input.employeeId = body.employee_id;
  if (typeof body.date === "string") input.date = body.date;
  if (typeof body.branch_id === "string") input.branchId = body.branch_id;
  if (typeof body.shift_id === "string") input.shiftId = body.shift_id;
  const result = updateMockShift(id, input);
  if ("error" in result) return NextResponse.json(result, { status: result.error === "Không tìm thấy ca." ? 404 : 409 });
  return NextResponse.json(result.item);
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!deleteMockShift(id)) return NextResponse.json({ error: "Không tìm thấy ca." }, { status: 404 });
  return NextResponse.json({ success: true });
}
