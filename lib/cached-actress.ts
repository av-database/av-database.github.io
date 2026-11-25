import { unstable_cache } from "next/cache";
import { resolveMergedActressDisplay } from "./supabase";
import { getProductsByActressId } from "./supabase";
import { enrichProducts } from "./products";
import type { ProductWithActresses } from "./products";

const PAGE_SIZE = 12;

export const getCachedActress = unstable_cache(
  async (id: number) => resolveMergedActressDisplay(id),
  ["actress"],
  { revalidate: 3600 * 24, tags: ["actress"] },
);

export const getCachedActressProducts = unstable_cache(
  async (
    actressId: number,
    filters?: { vrOnly?: boolean; soloOnly?: boolean; excludeBest?: boolean; keyword?: string },
  ): Promise<{ products: ProductWithActresses[]; hasMore: boolean }> => {
    const data = await getProductsByActressId(actressId, 0, PAGE_SIZE, filters);
    const products = await enrichProducts(data);
    return { products, hasMore: data.length === PAGE_SIZE };
  },
  ["actress-products"],
  { revalidate: 3600, tags: ["actress-products"] },
);
