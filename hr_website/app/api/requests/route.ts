import { NextRequest, NextResponse } from "next/server";
import { getMockRequests } from "@/lib/mock/adminStore";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") ?? undefined;
  const branchId = request.nextUrl.searchParams.get("branch_id") ?? undefined;
  return NextResponse.json(getMockRequests(status, branchId));
}
