import type {
  RequestEntity,
  RequestFilters,
  ReviewRequestInput,
} from "@/lib/domain/entities/RequestEntity";
import { RequestNotFoundError } from "@/lib/domain/errors/RequestNotFoundError";
import type { IRequestRepository } from "@/lib/domain/repositories/IRequestRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";

/**
 * `requester` is an embedded resource resolved from the `user_id` foreign key
 * (`requests_user_id_fkey`, ensured by SCRUM-41), so the approval queue shows names without a
 * staff-list endpoint.
 */
const REQUEST_COLUMNS = [
  "id",
  "branch_id",
  "user_id",
  "request_type",
  "title",
  "content",
  "status",
  "reject_reason",
  "approver_id",
  "created_at",
  "updated_at",
  "requester:users (id, full_name)",
].join(", ");

/**
 * Row shape as PostgREST returns it. Declared locally because the client has no generated
 * Database type, and a to-one embedding normally arrives as an object but falls back to an
 * array when PostgREST cannot prove the cardinality.
 */
type EmbeddedRow<T> = T | T[] | null;

type RequestRow = {
  id: string;
  branch_id: string;
  user_id: string;
  request_type: string;
  title: string | null;
  content: string | null;
  status: string;
  reject_reason: string | null;
  approver_id: string | null;
  created_at: string;
  updated_at: string;
  requester: EmbeddedRow<{ id: string; full_name: string }>;
};

function firstOf<T>(value: EmbeddedRow<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function toRequestEntity(row: RequestRow): RequestEntity {
  const requester = firstOf(row.requester);

  return {
    id: row.id,
    branch_id: row.branch_id,
    user_id: row.user_id,
    request_type: row.request_type,
    title: row.title,
    content: row.content,
    status: row.status,
    reject_reason: row.reject_reason,
    approver_id: row.approver_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    requester: requester
      ? { id: requester.id, full_name: requester.full_name }
      : null,
  };
}

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

    // The embedded resource makes PostgREST's inferred row type unusable, so the cast goes
    // through `unknown` and is normalised by `toRequestEntity` instead.
    return ((data ?? []) as unknown as RequestRow[]).map(toRequestEntity);
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

    // RLS hides rows the caller may not review, so "no row" covers both a wrong id and a
    // forbidden update — both surface as 404 to avoid leaking which ids exist.
    if (!data) {
      throw new RequestNotFoundError();
    }

    return toRequestEntity(data as unknown as RequestRow);
  }
}

