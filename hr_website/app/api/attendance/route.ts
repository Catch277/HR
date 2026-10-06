import { NextRequest, NextResponse } from "next/server";
import { getMockAttendance } from "@/lib/mock/adminStore";

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get("branch_id") ?? undefined;
  const employeeId = request.nextUrl.searchParams.get("employee_id") ?? undefined;
  return NextResponse.json(getMockAttendance(branchId, employeeId));
}
