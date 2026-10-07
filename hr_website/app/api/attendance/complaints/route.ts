/**
 * @swagger
 * /api/attendance/complaints:
 *   post:
 *     summary: Submit an attendance complaint
 *     tags:
 *       - Attendance
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - attendance_id
 *               - complaint
 *             properties:
 *               attendance_id:
 *                 type: string
 *               complaint:
 *                 type: string
 *     responses:
 *       201:
 *         description: The updated attendance record.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MockAttendance'
 *       400:
 *         description: The JSON body is invalid or required fields are missing.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: The attendance record was not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
import { NextResponse } from "next/server";
import { addMockComplaint } from "@/lib/mock/adminStore";

export async function POST(request: Request) {
  let body: { attendance_id?: unknown; complaint?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (typeof body.attendance_id !== "string" || typeof body.complaint !== "string" || !body.complaint.trim()) {
    return NextResponse.json({ error: "attendance_id and complaint are required." }, { status: 400 });
  }
  const result = addMockComplaint(body.attendance_id, body.complaint.trim());
  if (!result) return NextResponse.json({ error: "Attendance not found." }, { status: 404 });
  return NextResponse.json(result, { status: 201 });
}
