import type {
  RequestEntity,
  RequestFilters,
  ReviewRequestInput,
} from "@/lib/domain/entities/RequestEntity";
import { RequestNotFoundError } from "@/lib/domain/errors/RequestNotFoundError";
import type { IRequestRepository } from "@/lib/domain/repositories/IRequestRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";

const REQUEST_COLUMNS =
  "id, branch_id, request_type, status, reject_reason, approver_id, created_at, updated_at";

export class SupabaseRequestRepository implements IRequestRepository {
  async findFiltered(filters: RequestFilters): Promise<RequestEntity[]> {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("requests")
      .select(REQUEST_COLUMNS)
      .order("updated_at", { ascending: false });

    if (filters.branchId) {
      query = query.eq("branch_id", filters.branchId);
    }

    if (filters.requestType) {
      query = query.eq("request_type", filters.requestType);
    }

    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Unable to load requests: ${error.message}`);
    }

    return data;
  }

  async review(id: string, input: ReviewRequestInput): Promise<RequestEntity> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("requests")
      .update({
        status: input.status,
        reject_reason: input.status === "REJECTED" ? input.rejectReason : null,
        approver_id: input.approverId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(REQUEST_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to review request: ${error.message}`);
    }

    if (!data) {
      throw new RequestNotFoundError();
    }

    return data;
  }
}
