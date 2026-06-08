export const PRODUCTION_ENTRY_CATEGORIES = [
  "A",
  "B",
  "C",
  "Regular Trim",
  "Stick Trim",
  "Smalls",
] as const;

export type ProductionEntryCategory = (typeof PRODUCTION_ENTRY_CATEGORIES)[number];

/** Draft payload for a production entry — ready for Supabase insert in the next phase. */
export interface ProductionEntryDraft {
  sessionId: string;
  employeeId: string;
  category: ProductionEntryCategory;
  weight: number;
  notes?: string;
}

export function parseDecimalWeight(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return parsed;
}

export function buildProductionEntryDraft(input: {
  sessionId: string;
  employeeId: string;
  category: string;
  weight: string;
  notes: string;
}): { draft: ProductionEntryDraft | null; error: string | null } {
  const category = input.category.trim() as ProductionEntryCategory;
  if (!PRODUCTION_ENTRY_CATEGORIES.includes(category as ProductionEntryCategory)) {
    return { draft: null, error: "Category is required." };
  }

  const weight = parseDecimalWeight(input.weight);
  if (weight === null) {
    return { draft: null, error: "Weight must be greater than 0." };
  }

  const notes = input.notes.trim();

  return {
    draft: {
      sessionId: input.sessionId,
      employeeId: input.employeeId,
      category,
      weight,
      ...(notes ? { notes } : {}),
    },
    error: null,
  };
}
