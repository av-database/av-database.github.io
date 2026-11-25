"use client";

import { useEffect, useRef } from "react";
import { ACTRESS_PAGE_SIZE, actressCacheKey } from "../../../../lib/actress-search";
import ActressResultsGrid from "../../../../components/ActressResultsGrid";
import { useActressSearch } from "../../../../hooks/useActressSearch";

export default function CupActressListView({ cup }: { cup: string }) {
  const cacheKey = actressCacheKey({ cup });
  const urlInitRef = useRef(false);

  const {
    results,
    hasMore,
    page,
    startInitialLoad,
  } = useActressSearch({
    buildParams: (filters, targetPage) => ({
      cup: filters.cup as string,
      page: targetPage,
      limit: ACTRESS_PAGE_SIZE,
    }),
    getCacheKey: () => cacheKey,
    initialFilters: { cup },
    hasAnyFilter: () => true,
  });

  useEffect(() => {
    if (urlInitRef.current) return;
    urlInitRef.current = true;
    startInitialLoad();
  }, [startInitialLoad, urlInitRef]);

  return (
    <main className="max-w-5xl mx-auto w-full p-3">
      <h1 className="text-2xl font-bold border-b-2 pb-2 mb-6">{cup}カップの女優一覧</h1>
      <ActressResultsGrid
        results={results}
        hasMore={hasMore}
        page={page}
        filters={{ cup }}
        baseUrl={`/actress/cup/${cup}`}
      />
    </main>
  );
}
