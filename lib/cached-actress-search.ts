import { unstable_cache } from "next/cache";
import { searchActressesAdvanced, resolveMergedActressesDisplay } from "./supabase";
import type { Actress } from "./supabase";
import { ACTRESS_PAGE_SIZE, EnrichedActress } from "./actress-search";

export const getCachedActressSearch = unstable_cache(
  async (params: Parameters<typeof searchActressesAdvanced>[0]): Promise<{ results: EnrichedActress[]; hasMore: boolean }> => {
    const { data } = await searchActressesAdvanced(params);

    const ids = data.map((a) => a.actressId);
    let actressMap = new Map<number, { actress: Actress; displayName: string; actressId: number }>();
    if (ids.length > 0) {
      actressMap = await resolveMergedActressesDisplay(ids);
    }

    const results = data.map((a) => {
      const r = actressMap.get(a.actressId);
      return {
        ...a,
        displayName: r ? r.displayName : a.name,
        actressId: r ? r.actressId : a.actressId,
      };
    });

    return { results, hasMore: data.length === ACTRESS_PAGE_SIZE };
  },
  ["actress-search"],
  { revalidate: 3600, tags: ["actress-search"] },
);
