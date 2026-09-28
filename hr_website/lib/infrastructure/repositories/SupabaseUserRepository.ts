import type { User } from "@/lib/domain/entities/User";
import type { IUserRepository } from "@/lib/domain/repositories/IUserRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";

export class SupabaseUserRepository implements IUserRepository {
  async getById(id: string): Promise<User | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("users")
      .select("id, full_name, role")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to load user: ${error.message}`);
    }

    return data;
  }
}
