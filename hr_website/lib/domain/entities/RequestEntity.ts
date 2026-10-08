export interface RequestEntity {
  id: string;
  branch_id: string;
  /** The employee who filed the request (`public.users.id`); hydrated into `requester`. */
  user_id: string;
  request_type: string;
  title: string | null;
  content: string | null;
  status: string;
  reject_reason: string | null;
  approver_id: string | null;
  created_at: string;
  updated_at: string;
  /**
   * Hydrated from the `user_id` foreign key by the repository. Null when RLS hides the
   * profile, so the screens must not assume a name is present.
   */
  requester: { id: string; full_name: string } | null;
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

