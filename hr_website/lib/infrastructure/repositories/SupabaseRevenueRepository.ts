import type {
  CreateRevenueRecordInput,
  RevenueRecord,
  UpdateCloseRevenueInput,
} from "@/lib/domain/entities/RevenueRecord";
import { RevenueAlreadyDeclaredError } from "@/lib/domain/errors/RevenueAlreadyDeclaredError";
import type { IRevenueRepository } from "@/lib/domain/repositories/IRevenueRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";

export class SupabaseRevenueRepository implements IRevenueRepository {
  async findByBranchInPeriod(
    branchId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<RevenueRecord | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("daily_revenue")
      .select(
        "id, branch_id, open_amount, created_at, created_by, close_amount, close_note, close_image_url, closed_by, closed_at, audit_log",
      )
      .eq("branch_id", branchId)
      .gte("created_at", periodStart.toISOString())
      .lt("created_at", periodEnd.toISOString())
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to check opening revenue: ${error.message}`);
    }

    return data;
  }

  async create(input: CreateRevenueRecordInput): Promise<RevenueRecord> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("daily_revenue")
      .insert({
        branch_id: input.branchId,
        open_amount: input.openAmount,
        created_by: input.createdBy,
      })
      .select(
        "id, branch_id, open_amount, created_at, created_by, close_amount, close_note, close_image_url, closed_by, closed_at, audit_log",
      )
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new RevenueAlreadyDeclaredError();
      }

      throw new Error(`Unable to declare opening revenue: ${error.message}`);
    }

    return data;
  }

  async updateCloseRevenue(
    id: string,
    input: UpdateCloseRevenueInput,
  ): Promise<RevenueRecord> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("daily_revenue")
      .update({
        close_amount: input.closeAmount,
        close_note: input.closeNote,
        close_image_url: input.closeImageUrl,
        closed_by: input.closedBy,
        closed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(
        "id, branch_id, open_amount, created_at, created_by, close_amount, close_note, close_image_url, closed_by, closed_at, audit_log",
      )
      .single();

    if (error) {
      throw new Error(`Unable to declare closing revenue: ${error.message}`);
    }

    return data;
  }
}
