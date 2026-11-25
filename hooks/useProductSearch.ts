"use client";

import { useState, useCallback, useRef } from "react";
import { getProductsPage, searchProducts } from "../lib/supabase";
import { enrichProducts, ProductWithActresses, ActressInfo } from "../lib/products";
import { cacheSet } from "../lib/search-cache";

const PAGE_SIZE = 12;

export type SearchFilters = {
  keyword: string;
  vrOnly: boolean;
  soloOnly: boolean;
  excludeBest: boolean;
  includeGenreIds: number[];
  excludeGenreIds: number[];
};

function homeCacheKey(f: SearchFilters): string {
  return `home:${f.keyword}|${f.vrOnly}|${f.soloOnly}|${f.excludeBest}|${f.includeGenreIds.join(",")}|${f.excludeGenreIds.join(",")}`;
}

type SearchQueryParams = {
  keyword?: string;
  titleStartsWith?: string;
  soloOnly?: boolean;
  excludeBest?: boolean;
  includeGenreIds?: number[];
  excludeGenreIds?: number[];
  page: number;
  limit: number;
  cursor?: string;
};

function buildSearchParams(f: SearchFilters, page: number, cursor?: string): SearchQueryParams {
  const params: SearchQueryParams = { page, limit: PAGE_SIZE, cursor };
  if (f.keyword) params.keyword = f.keyword;
  if (f.vrOnly) params.titleStartsWith = "【VR】";
  if (f.soloOnly) params.soloOnly = true;
  if (f.excludeBest) params.excludeBest = true;
  if (f.includeGenreIds?.length) params.includeGenreIds = f.includeGenreIds;
  if (f.excludeGenreIds?.length) params.excludeGenreIds = f.excludeGenreIds;
  return params;
}

interface UseProductSearchOptions {
  filters: SearchFilters;
  initialProducts?: ProductWithActresses[];
  initialNextCursor?: string | null;
}

export function useProductSearch({ filters, initialProducts, initialNextCursor }: UseProductSearchOptions) {
  const [products, setProducts] = useState<ProductWithActresses[]>(initialProducts ?? []);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor ?? null);
  const [loading, setLoading] = useState(!initialProducts);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMore, setHasMore] = useState(!!initialNextCursor);
  const [isFiltering, setIsFiltering] = useState(false);

  const searchSeqRef = useRef(0);
  const loadMoreSeqRef = useRef(0);

  const runSearch = useCallback(
    async (f: SearchFilters, page: number, mode: "replace" | "append", cursor?: string, onError?: () => void): Promise<void> => {
      const seq = mode === "replace" ? ++searchSeqRef.current : searchSeqRef.current;
      const isStale = () => seq !== searchSeqRef.current;

      try {
        if (mode === "replace") {
          setIsFiltering(true);

          const { data, nextCursor: nextCursorVal } = await searchProducts(buildSearchParams(f, page, cursor));
          if (isStale()) return;

          const existingById = new Map(products.map((p) => [p.contentId, p]));
          const merged = data.map((p) => existingById.get(p.contentId) ?? p);

          setProducts(merged);
          setNextCursor(nextCursorVal);
          setHasMore(data.length === PAGE_SIZE);
          setSearchPage(page);
          setLoading(false);
          setIsFiltering(false);

          try {
            const enriched = await enrichProducts(data);
            if (isStale()) return;
            const byId = new Map(enriched.map((p) => [p.contentId, p]));
            setProducts((prev) => prev.map((p) => byId.get(p.contentId) ?? p));
            cacheSet(homeCacheKey(f), {
              products: data.map((p) => byId.get(p.contentId) ?? p),
              nextCursor: nextCursorVal,
              searchPage: page,
              hasMore: data.length === PAGE_SIZE,
              isFiltering: true,
            });
          } catch {
            if (isStale()) return;
            setProducts((prev) => prev.map((p) => ({ ...p, actressInfos: p.actressInfos ?? [] })));
            cacheSet(homeCacheKey(f), {
              products: data.map((p) => ({ ...p, actressInfos: [] as ActressInfo[] })),
              nextCursor: nextCursorVal,
              searchPage: page,
              hasMore: data.length === PAGE_SIZE,
              isFiltering: true,
            });
          }
        } else {
          const { data, nextCursor: nextCursorVal } = await searchProducts(buildSearchParams(f, page, cursor));
          if (isStale()) return;

          setProducts((prev) => [...prev, ...data]);
          setNextCursor(nextCursorVal);
          setHasMore(data.length === PAGE_SIZE);
          setSearchPage(page);
          setLoading(false);
          setLoadingMore(false);

          try {
            const enriched = await enrichProducts(data);
            if (isStale()) return;
            const byId = new Map(enriched.map((p) => [p.contentId, p]));
            setProducts((prev) => prev.map((p) => byId.get(p.contentId) ?? p));
          } catch {
            if (isStale()) return;
            setProducts((prev) => prev.map((p) => ({ ...p, actressInfos: p.actressInfos ?? [] })));
          }
        }
      } catch {
        if (isStale()) return;
        if (mode === "replace") {
          setProducts([]);
          setHasMore(false);
          setNextCursor(null);
        }
        setLoading(false);
        if (mode === "append") setLoadingMore(false);
        onError?.();
      }
    },
    [products],
  );

  const fetchInitial = useCallback(async () => {
    const { data, nextCursor: cursor } = await getProductsPage(PAGE_SIZE, undefined, [1014, 6003], false);
    const enriched = await enrichProducts(data);
    const seen = new Set<string>();
    const unique = enriched.filter((p) => (seen.has(p.contentId) ? false : (seen.add(p.contentId), true)));
    setProducts(unique);
    setNextCursor(cursor);
    setLoading(false);
    setHasMore(!!cursor);
    cacheSet(homeCacheKey({ keyword: "", vrOnly: false, soloOnly: false, excludeBest: false, includeGenreIds: [], excludeGenreIds: [1014, 6003] }), {
      products: unique,
      nextCursor: cursor,
      searchPage: 1,
      hasMore: !!cursor,
      isFiltering: false,
    });
  }, []);

  const resetToDefault = useCallback(() => {
    searchSeqRef.current++;
    loadMoreSeqRef.current++;
    setIsFiltering(false);
    setHasMore(false);
    setSearchPage(1);
    setProducts([]);
    setNextCursor(null);
    setLoading(true);
    fetchInitial();
  }, [fetchInitial]);

  const loadMore = async () => {
    if (loadingMore) return;
    if (!hasMore && !nextCursor) return;
    const seq = ++loadMoreSeqRef.current;
    setLoadingMore(true);
    try {
      await runSearch(filters, searchPage + 1, "append", nextCursor ?? undefined);
    } finally {
      if (seq === loadMoreSeqRef.current) setLoadingMore(false);
    }
  };

  const canLoadMore = hasMore || !!nextCursor;

  return {
    products,
    loading,
    loadingMore,
    searchPage,
    hasMore,
    nextCursor,
    isFiltering,
    setIsFiltering,
    runSearch,
    fetchInitial,
    resetToDefault,
    loadMore,
    canLoadMore,
  };
}
