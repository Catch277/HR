import { NextResponse } from "next/server";

import type { User } from "@/lib/domain/entities/User";
import { MissingUserProfileError } from "@/lib/domain/errors/MissingUserProfileError";
import { SupabaseUserRepository } from "@/lib/infrastructure/repositories/SupabaseUserRepository";
import { createSupabaseServerClient } from "@/lib/infrastructure/supabaseClient";
import { GetUserUseCase } from "@/lib/usecases/GetUserUseCase";

/**
 * The session check every `/api/organizations/*` handler starts with. It lives in `_lib` because
 * the five handlers of this resource need exactly the same three answers — `401` without a session,
 * `403` without a profile row, and otherwise the caller's id plus role — and the AGENTS recipe asks
 * for one shared implementation instead of five copies (see `app/api/branches/_lib`).
 *
 * Note this is only the *authentication* half of the gate: whether the role may act is decided by
 * the use case and repeated by RLS/the RPC in the database.
 */
export type CallerContext =
  | { ok: true; userId: string; role: string; profile: User; accessToken: string }
  | { ok: false; response: NextResponse };

export async function requireCaller(): Promise<CallerContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 },
      ),
    };
  }

  const profile = await new GetUserUseCase(new SupabaseUserRepository()).execute(
    user.id,
  );

  if (!profile) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: new MissingUserProfileError().message },
        { status: 403 },
      ),
    };
  }

  // The raw access token is forwarded to the `staff-account` Edge Function (SCRUM-52), which
  // authorizes the *user* rather than this app — that is why no shared secret lives here.
  const { data: sessionData } = await supabase.auth.getSession();

  return {
    ok: true,
    userId: user.id,
    role: profile.role,
    profile,
    accessToken: sessionData.session?.access_token ?? "",
  };
}