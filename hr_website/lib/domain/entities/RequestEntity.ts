export interface RequestEntity {
  id: string;
  branch_id: string;
  request_type: string;
  status: string;
  reject_reason: string | null;
  approver_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestFilters {
  branchId?: string;
  requestType?: string;
  status?: string;
}

export type ReviewStatus = "APPROVED" | "REJECTED";

export interface ReviewRequestInput {
  status: ReviewStatus;
  rejectReason: string | null;
  approverId: string;
}
