import { NextRequest, NextResponse } from "next/server";
import { createMockShift, getMockShifts } from "@/lib/mock/adminStore";

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get("branch_id") ?? undefined;
  const startDate = request.nextUrl.searchParams.get("start_date") ?? undefined;
  const endDate = request.nextUrl.searchParams.get("end_date") ?? undefined;
  return NextResponse.json(getMockShifts(branchId, startDate, endDate));
}

export async function POST(request: Request) {
  let body: { employee_id?: unknown; date?: unknown; branch_id?: unknown; shift_id?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }
  if (![body.employee_id, body.date, body.branch_id, body.shift_id].every((value) => typeof value === "string" && value.trim())) {
    return NextResponse.json({ error: "employee_id, date, branch_id và shift_id là bắt buộc." }, { status: 400 });
  }
  const result = createMockShift({ employeeId: body.employee_id as string, date: body.date as string, branchId: body.branch_id as string, shiftId: body.shift_id as string });
  if ("error" in result) return NextResponse.json(result, { status: 409 });
  return NextResponse.json(result.item, { status: 201 });
}
