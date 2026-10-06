import { NextRequest, NextResponse } from "next/server";
import { getMockEmployeeStatuses } from "@/lib/mock/adminStore";

export async function GET(request: NextRequest) {
  const branchId = request.nextUrl.searchParams.get("branch_id") ?? undefined;
  return NextResponse.json({ updated_at: new Date().toISOString(), data: getMockEmployeeStatuses(branchId) });
}
