import type {
  CreateFacilityInput,
  Facility,
  FacilityCategory,
  FacilityCondition,
  UpdateFacilityInput,
} from "@/lib/domain/entities/Facility";
import { FacilityNotFoundError } from "@/lib/domain/errors/FacilityNotFoundError";
import type { IFacilityRepository } from "@/lib/domain/repositories/IFacilityRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";

const FACILITY_COLUMNS =
  "id, branch_id, name, code, category, quantity, condition, last_checked_at, note, created_at, updated_at";

/**
 * Row shape as PostgREST returns it. Declared locally because the client has no generated
 * Database type; an integer column can still arrive as a string.
 */
type FacilityRow = {
  id: string;
  branch_id: string;
  name: string;
  code: string | null;
  category: string;
  quantity: number | string;
  condition: string;
  last_checked_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
};

function toFacility(row: FacilityRow): Facility {
  return {
    id: row.id,
    branch_id: row.branch_id,
    name: row.name,
    code: row.code,
    // The check constraints in SCRUM-45 keep these two inside the unions, so a cast is the
    // honest way to label a text column that the database already constrains.
    category: row.category as FacilityCategory,
    quantity: Number(row.quantity),
    condition: row.condition as FacilityCondition,
    last_checked_at: row.last_checked_at,
    note: row.note,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export class SupabaseFacilityRepository implements IFacilityRepository {
  async findAll(branchId?: string): Promise<Facility[]> {
    const supabase = await createSupabaseServerClient();
    let query = supabase
      .from("facilities")
      .select(FACILITY_COLUMNS)
      .order("name", { ascending: true });

    if (branchId) {
      query = query.eq("branch_id", branchId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Unable to load facilities: ${error.message}`);
    }

    return ((data ?? []) as FacilityRow[]).map(toFacility);
  }

  async findById(id: string): Promise<Facility | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("facilities")
      .select(FACILITY_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load the facility: ${error.message}`);
    }

    // RLS scopes the read (SCRUM-60: managers of the organization), so a hidden row is "no facility".
    return data ? toFacility(data as FacilityRow) : null;
  }

  async create(input: CreateFacilityInput): Promise<Facility> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("facilities")
      .insert({
        branch_id: input.branchId,
        name: input.name,
        code: input.code,
        category: input.category,
        quantity: input.quantity,
        condition: input.condition,
        last_checked_at: input.lastCheckedAt,
        note: input.note,
      })
      .select(FACILITY_COLUMNS)
      .single();

    if (error) {
      throw new Error(`Unable to create facility: ${error.message}`);
    }

    return toFacility(data as FacilityRow);
  }

  async update(id: string, input: UpdateFacilityInput): Promise<Facility> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("facilities")
      .update({
        branch_id: input.branchId,
        name: input.name,
        code: input.code,
        category: input.category,
        quantity: input.quantity,
        condition: input.condition,
        last_checked_at: input.lastCheckedAt,
        note: input.note,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(FACILITY_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to update facility: ${error.message}`);
    }

    // RLS hides rows the caller may not update, so "no row" covers both a wrong id and a
    // forbidden update — both surface as 404 to avoid leaking which ids exist.
    if (!data) {
      throw new FacilityNotFoundError();
    }

    return toFacility(data as FacilityRow);
  }

  async delete(id: string): Promise<void> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("facilities")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to delete facility: ${error.message}`);
    }

    if (!data) {
      throw new FacilityNotFoundError();
    }
  }
}
