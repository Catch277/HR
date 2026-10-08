import type {
  CreateFacilityInput,
  UpdateFacilityInput,
} from "@/lib/domain/entities/Facility";

/**
 * Trims free text and collapses "blank string" into `null`, so the database never stores `""`
 * for an absent code, note or check date. The route handler has already validated the payload;
 * this only normalises what is persisted.
 */
export function normalizeFacilityWriteInput<
  T extends CreateFacilityInput | UpdateFacilityInput,
>(input: T): T {
  const code = input.code?.trim();
  const note = input.note?.trim().replace(/\s+/g, " ");

  return {
    ...input,
    name: input.name.trim(),
    code: code ? code : null,
    note: note ? note : null,
  };
}
