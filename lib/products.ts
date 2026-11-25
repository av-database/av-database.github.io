import { resolveMergedActressesDisplay, Product } from "./supabase";

export type { Product };
export type ActressInfo = { displayName: string; actressId: number };
export type ProductWithActresses = Product & { actressInfos?: ActressInfo[] };

export async function enrichProducts(items: Product[]): Promise<ProductWithActresses[]> {
  const allIds = [...new Set(items.flatMap((p) => p.actressIds || []))];
  const resolved = allIds.length > 0 ? await resolveMergedActressesDisplay(allIds) : new Map();

  return items.map((p) => ({
    ...p,
    actressInfos: (p.actressIds || [])
      .map((id) => {
        const r = resolved.get(id);
        return r ? { displayName: r.displayName, actressId: r.actressId } : null;
      })
      .filter(Boolean) as ActressInfo[],
  }));
}
