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
