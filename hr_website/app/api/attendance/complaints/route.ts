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
