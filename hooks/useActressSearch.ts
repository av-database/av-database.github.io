"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { searchActressesAdvanced, resolveMergedActressesDisplay } from "../lib/supabase";
import { cacheGet, cacheSet } from "../lib/search-cache";
import {
  ACTRESS_PAGE_SIZE,
  EnrichedActress,
  ActressCacheEntry,
} from "../lib/actress-search";

type ActressFilters = Record<string, string | boolean>;

interface UseActressSearchOptions {
  buildParams: (filters: ActressFilters, page: number) => Parameters<typeof searchActressesAdvanced>[0];
  getCacheKey: (filters: ActressFilters) => string;
  initialFilters: ActressFilters;
  hasAnyFilter: (filters: ActressFilters) => boolean;
  initialResults?: EnrichedActress[];
  initialHasMore?: boolean;
  initialPage?: number;
}

export function useActressSearch({
  buildParams,
  getCacheKey,
  initialFilters,
  hasAnyFilter,
  initialResults,
  initialHasMore,
  initialPage = 1,
}: UseActressSearchOptions) {
  const [filters, setFilters] = useState<ActressFilters>(initialFilters);
  const [results, setResults] = useState<EnrichedActress[]>(initialResults ?? []);
  const [hasMore, setHasMore] = useState(initialHasMore ?? false);
  const [page, setPage] = useState(initialPage);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading] = useState(!initialResults);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSearched, setIsSearched] = useState(Boolean(initialResults));
  const urlInitRef = useRef(false);
  const filtersKey = getCacheKey(initialFilters);
  const prevFiltersKeyRef = useRef(filtersKey);

  const doSearch = useCallback(
    async (targetPage: number = 1, filtersOverride?: ActressFilters) => {
      const isLoadMore = targetPage > 1;
      const appliedFilters = filtersOverride ?? filters;
      const params = buildParams(appliedFilters, targetPage);
      setLoading(true);
      setIsInitializing(false);
      if (isLoadMore) setLoadingMore(true);
      setPage(targetPage);
      try {
        const { data } = await searchActressesAdvanced(params);

        const immediate: EnrichedActress[] = data.map((a) => ({
          ...a,
          displayName: a.name,
          actressId: a.actressId,
        }));
        const pageHasMore = data.length === ACTRESS_PAGE_SIZE;
        if (targetPage === 1) {
          setResults(immediate);
        } else {
          setResults((prev) => {
            const existingIds = new Set(prev.map((a) => a.actressId));
            const newItems = immediate.filter((a) => !existingIds.has(a.actressId));
            return [...prev, ...newItems];
          });
        }
        setHasMore(pageHasMore);
        setIsSearched(true);
        setLoading(false);
        if (isLoadMore) setLoadingMore(false);

        let finalResults = immediate;
        const ids = data.map((a) => a.actressId);
        if (ids.length > 0) {
          try {
            const resolved = await resolveMergedActressesDisplay(ids);
            finalResults = immediate.map((a) => {
              const r = resolved.get(a.actressId);
              return r ? { ...a, displayName: r.displayName, actressId: r.actressId } : a;
            });
            setResults((prev) =>
              prev.map((a) => {
                const r = resolved.get(a.actressId);
                return r ? { ...a, displayName: r.displayName, actressId: r.actressId } : a;
              }),
            );
          } catch {
            // 統合情報が取得できなくても検索結果の表示は維持する
          }
        }

        if (targetPage === 1) {
          cacheSet(getCacheKey(appliedFilters), {
            results: finalResults,
            hasMore: pageHasMore,
            page: 1,
            searched: true,
          });
        }
      } catch {
        setResults([]);
        setHasMore(false);
        setLoading(false);
        if (isLoadMore) setLoadingMore(false);
      }
    },
    [buildParams, filters, getCacheKey],
  );

  const loadMore = useCallback(() => {
    void doSearch(page + 1);
  }, [doSearch, page]);

  const startInitialLoad = useCallback(() => {
    if (initialResults) {
      setResults(initialResults);
      setHasMore(initialHasMore ?? false);
      setPage(initialPage);
      setIsInitializing(false);
      setLoading(false);
      setLoadingMore(false);
      setIsSearched(true);
      return;
    }
    if (hasAnyFilter(filters)) {
      const cached = cacheGet<ActressCacheEntry>(getCacheKey(filters));
      if (cached) {
        setResults(cached.results);
        setHasMore(cached.hasMore);
        setPage(cached.page);
        setIsSearched(cached.isSearched);
        setIsInitializing(false);
        setLoading(false);
        setLoadingMore(false);
        return;
      }
      doSearch(1, filters);
    } else {
      setIsInitializing(false);
    }
  }, [filters, hasAnyFilter, doSearch, getCacheKey, initialResults, initialHasMore, initialPage]);

  useEffect(() => {
    if (urlInitRef.current) return;
    urlInitRef.current = true;
    startInitialLoad();
  }, [startInitialLoad, urlInitRef]);

  useEffect(() => {
    if (prevFiltersKeyRef.current === filtersKey) return;
    prevFiltersKeyRef.current = filtersKey;
    startInitialLoad();
  }, [filtersKey, startInitialLoad]);

  return {
    filters,
    setFilters,
    results,
    hasMore,
    page,
    isInitializing,
    loading,
    loadingMore,
    isSearched,
    doSearch,
    loadMore,
    startInitialLoad,
  };
}
