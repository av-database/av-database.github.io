import type { Actress } from "./supabase";

export const ACTRESS_PAGE_SIZE = 18;

export type EnrichedActress = Actress & { displayName: string; actressId: number };

export type ActressCacheEntry = {
  results: EnrichedActress[];
  hasMore: boolean;
  page: number;
  isSearched: boolean;
};

export function actressCacheKey(filters: {
  name?: string;
  cup?: string;
  prefecture?: string;
  birthdayFrom?: string;
  birthdayTo?: string;
  bustFrom?: string;
  bustTo?: string;
  waistFrom?: string;
  waistTo?: string;
  hipFrom?: string;
  hipTo?: string;
  heightFrom?: string;
  heightTo?: string;
}): string {
  return [
    "actress",
    filters.name?.trim() ?? "",
    filters.cup ?? "",
    filters.prefecture ?? "",
    filters.birthdayFrom ?? "",
    filters.birthdayTo ?? "",
    filters.bustFrom ?? "",
    filters.bustTo ?? "",
    filters.waistFrom ?? "",
    filters.waistTo ?? "",
    filters.hipFrom ?? "",
    filters.hipTo ?? "",
    filters.heightFrom ?? "",
    filters.heightTo ?? "",
  ].join("|");
}
