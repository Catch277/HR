import type {
  Branch,
  CreateBranchInput,
  UpdateBranchInput,
} from "@/lib/domain/entities/Branch";
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
      throw new Error(`Unable to update branch: ${error.message}`);
    }

    // RLS hides rows the caller may not update, so "no row" covers both a wrong id and
    // a forbidden update — both surface as 404 to avoid leaking which ids exist.
    if (!data) {
      throw new BranchNotFoundError();
    }

    return toBranch(data as BranchRow);
  }
}
