export interface RevenueRecord {
  id: string;
  branch_id: string;
  open_amount: number;
  created_at: string;
  created_by: string;
  close_amount: number | null;
  close_note: string | null;
  close_image_url: string | null;
  closed_by: string | null;
  closed_at: string | null;
  audit_log: unknown[];
}

export interface CreateRevenueRecordInput {
  branchId: string;
  openAmount: number;
  createdBy: string;
}

export interface UpdateCloseRevenueInput {
  closeAmount: number;
  closeNote: string | null;
  closeImageUrl: string | null;
  closedBy: string;
}
