import type {
  Branch,
  BranchDependents,
  CreateBranchInput,
  UpdateBranchInput,
} from "@/lib/domain/entities/Branch";
import { BranchManagerChangeForbiddenError } from "@/lib/domain/errors/BranchManagerChangeForbiddenError";
import { BranchNotEmptyError } from "@/lib/domain/errors/BranchNotEmptyError";
import { BranchNotFoundError } from "@/lib/domain/errors/BranchNotFoundError";
import type { IBranchRepository } from "@/lib/domain/repositories/IBranchRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";

const BRANCH_COLUMNS =
  "id, name, address, manager_id, latitude, longitude, attendance_radius, created_at, updated_at";

/**
 * Row shape as PostgREST returns it. Declared locally because the client has no generated
 * Database type; `numeric`/`double precision` columns can arrive as strings.
 */
type BranchRow = {
  id: string;
  name: string;
  address: string | null;
  manager_id: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  attendance_radius: number | string;
  created_at: string;
  updated_at: string;
};

function toBranch(row: BranchRow): Branch {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    manager_id: row.manager_id,
    latitude: row.latitude === null ? null : Number(row.latitude),
    longitude: row.longitude === null ? null : Number(row.longitude),
    attendance_radius: Number(row.attendance_radius),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class SupabaseBranchRepository implements IBranchRepository {
  async findAll(): Promise<Branch[]> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("branches")
      .select(BRANCH_COLUMNS)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Unable to load branches: ${error.message}`);
    }

    return ((data ?? []) as BranchRow[]).map(toBranch);
  }

  async findById(id: string): Promise<Branch | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("branches")
      .select(BRANCH_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load the branch: ${error.message}`);
    }

    // RLS scopes the read to the caller's organization, so "no row" also covers another tenant's id.
    return data ? toBranch(data as BranchRow) : null;
  }

  async create(input: CreateBranchInput): Promise<Branch> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("branches")
      .insert({
        name: input.name,
        address: input.address,
        manager_id: input.managerId,
        latitude: input.latitude,
        longitude: input.longitude,
        attendance_radius: input.attendanceRadius,
      })
      .select(BRANCH_COLUMNS)
      .single();

    if (error) {
      throw new Error(`Unable to create branch: ${error.message}`);
    }

    return toBranch(data as BranchRow);
  }

  async update(id: string, input: UpdateBranchInput): Promise<Branch> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("branches")
      .update({
        name: input.name,
        address: input.address,
        manager_id: input.managerId,
        latitude: input.latitude,
        longitude: input.longitude,
        attendance_radius: input.attendanceRadius,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(BRANCH_COLUMNS)
      .maybeSingle();

    if (error) {
      // `branches_guard_manager_change` (SCRUM-61) refuses a non-owner moving `manager_id` or
      // `organization_id`. The use case checks both first, so this is the backstop for a write that
      // bypasses it — and a typed error keeps that answer a 403 instead of a 500.
      if (error.code === "P0001") {
        throw new BranchManagerChangeForbiddenError();
      }

      throw new Error(`Unable to update branch: ${error.message}`);
    }

    // RLS hides rows the caller may not update, so "no row" covers both a wrong id and
    // a forbidden update — both surface as 404 to avoid leaking which ids exist.
    if (!data) {
      throw new BranchNotFoundError();
    }

    return toBranch(data as BranchRow);
  }

  async countDependents(id: string): Promise<BranchDependents> {
    const supabase = await createSupabaseServerClient();

    // Four exact counts rather than four fetches: the numbers end up in the 409 sentence and the
    // tables are the biggest ones in the schema. `head: true` asks PostgREST for the count only.
    const [attendance, assignments, facilities, revenue] = await Promise.all([
      supabase
        .from("attendance")
        .select("id", { count: "exact", head: true })
        .eq("branch_id", id),
      supabase
        .from("shift_assignments")
        .select("id", { count: "exact", head: true })
        .eq("branch_id", id),
      supabase
        .from("facilities")
        .select("id", { count: "exact", head: true })
        .eq("branch_id", id),
      supabase
        .from("daily_revenue")
        .select("id", { count: "exact", head: true })
        .eq("branch_id", id),
    ]);

    for (const response of [attendance, assignments, facilities, revenue]) {
      if (response.error) {
        throw new Error(
          `Unable to count the branch's data: ${response.error.message}`,
        );
      }
    }

    return {
      attendance: attendance.count ?? 0,
      assignments: assignments.count ?? 0,
      facilities: facilities.count ?? 0,
      revenue: revenue.count ?? 0,
    };
  }

  async delete(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("branches")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      // `branches_guard_delete` (SCRUM-61) repeats the emptiness rule for a write that bypasses the
      // use case. It carries the counts too, but parsing them out of a sentence would be brittle, so
      // the error travels without them and the message stays the generic half of the sentence.
      if (error.code === "P0001") {
        throw new BranchNotEmptyError();
      }

      throw new Error(`Unable to delete branch: ${error.message}`);
    }

    // RLS hides rows the caller may not delete, so "no row" covers both a wrong id and a forbidden
    // delete — both surface as 404 to avoid leaking which ids exist.
    if (!data) {
      throw new BranchNotFoundError();
    }
  }
}
