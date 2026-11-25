import { unstable_cache } from "next/cache";
import { getProductsPage, searchProducts } from "./supabase";
import { enrichProducts } from "./products";
import type { ProductWithActresses } from "./products";
import type { SearchFilters } from "../hooks/useSearchFilters";

const PAGE_SIZE = 12;
const DEFAULT_EXCLUDE_GENRE_IDS = [6003, 1014];

export const getCachedHomeProducts = unstable_cache(
  async (): Promise<{ products: ProductWithActresses[]; nextCursor: string | null }> => {
    const { data, nextCursor } = await getProductsPage(PAGE_SIZE, undefined, DEFAULT_EXCLUDE_GENRE_IDS);
    const products = await enrichProducts(data);
    return { products, nextCursor };
  },
  ["home-products"],
  { revalidate: 3600 * 24, tags: ["home-products"] },
);

export const getCachedHomeSearchProducts = unstable_cache(
  async (filters: SearchFilters): Promise<{ products: ProductWithActresses[]; nextCursor: string | null }> => {
    const { data, nextCursor } = await searchProducts({
      keyword: filters.keyword || undefined,
      titleStartsWith: filters.vrOnly ? "【VR】" : undefined,
      soloOnly: filters.soloOnly,
      excludeBest: filters.excludeBest,
      includeGenreIds: filters.includeGenreIds.length ? filters.includeGenreIds : undefined,
      excludeGenreIds: filters.excludeGenreIds.length ? filters.excludeGenreIds : undefined,
      page: 1,
      limit: PAGE_SIZE,
    });
    const products = await enrichProducts(data);
    return { products, nextCursor };
  },
  ["home-search"],
  { revalidate: 3600, tags: ["home-search"] },
);
