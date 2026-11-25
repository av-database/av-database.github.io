"use client";

import { useEffect, useRef } from "react";
import { ACTRESS_PAGE_SIZE, EnrichedActress } from "../lib/actress-search";
import { searchActressesAdvanced } from "../lib/supabase";
import ActressResultsGrid from "./ActressResultsGrid";
import { useActressSearch } from "../hooks/useActressSearch";

interface ActressSearchClientProps {
  initialResults: EnrichedActress[];
  initialHasMore: boolean;
  initialPage: number;
  filters: Record<string, string | boolean>;
}

export default function ActressSearchClient({
  initialResults,
  initialHasMore,
  initialPage,
  filters,
}: ActressSearchClientProps) {
  const urlInitRef = useRef(false);

  const {
    results,
    hasMore,
    page,
    loading,
    loadingMore,
    loadMore,
    startInitialLoad,
  } = useActressSearch({
    buildParams: (f, targetPage) => {
      const params: Record<string, string | number | boolean> = {
        page: targetPage,
        limit: ACTRESS_PAGE_SIZE,
      };
      if (f.name) params.name = f.name as string;
      if (f.cup) params.cup = f.cup as string;
      if (f.prefecture) params.prefecture = f.prefecture as string;
      if (f.birthdayFrom) params.birthdayFrom = f.birthdayFrom as string;
      if (f.birthdayTo) params.birthdayTo = f.birthdayTo as string;
      if (f.bustFrom) params.bustFrom = Number(f.bustFrom);
      if (f.bustTo) params.bustTo = Number(f.bustTo);
      if (f.waistFrom) params.waistFrom = Number(f.waistFrom);
      if (f.waistTo) params.waistTo = Number(f.waistTo);
      if (f.hipFrom) params.hipFrom = Number(f.hipFrom);
      if (f.hipTo) params.hipTo = Number(f.hipTo);
      if (f.heightFrom) params.heightFrom = Number(f.heightFrom);
      if (f.heightTo) params.heightTo = Number(f.heightTo);
      return params as Parameters<typeof searchActressesAdvanced>[0];
    },
    getCacheKey: () => {
      const sp = new URLSearchParams();
      for (const [key, value] of Object.entries(filters)) {
        if (value === "" || value === false || value === undefined || value === null) continue;
        sp.set(key, String(value));
      }
      return `actress:${sp.toString()}`;
    },
    initialFilters: filters,
    hasAnyFilter: () =>
      Boolean(
        filters.name ||
          filters.cup ||
          filters.prefecture ||
          filters.birthdayFrom ||
          filters.birthdayTo ||
          filters.bustFrom ||
          filters.bustTo ||
          filters.waistFrom ||
          filters.waistTo ||
          filters.hipFrom ||
          filters.hipTo ||
          filters.heightFrom ||
          filters.heightTo,
      ),
    initialResults,
    initialHasMore,
    initialPage,
  });

  useEffect(() => {
    if (urlInitRef.current) return;
    urlInitRef.current = true;
    startInitialLoad();
  }, [startInitialLoad, urlInitRef]);

  const handleLoadMore = () => {
    void loadMore();
  };

  return (
    <>
      <ActressResultsGrid
        results={results}
        hasMore={hasMore}
        page={page}
        filters={filters}
        loading={loading}
        loadingMore={loadingMore}
        onLoadMore={handleLoadMore}
      />
    </>
  );
}
