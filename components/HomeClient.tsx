"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import KeywordSearchBar from "./KeywordSearchBar";
import VideoGrid from "./VideoGrid";
import { useSearchFilters } from "../hooks/useSearchFilters";
import { useProductSearch } from "../hooks/useProductSearch";
import { subscribeNavReset } from "../lib/nav-reset";
import { Product } from "../lib/supabase";
import type { SearchFilters } from "../hooks/useSearchFilters";

type ActressInfo = { displayName: string; actressId: number };
type ProductWithActresses = Product & { actressInfos?: ActressInfo[] };

interface HomeClientProps {
  initialProducts: ProductWithActresses[];
  initialNextCursor: string | null;
  initialFilters: SearchFilters;
}

export default function HomeClient({ initialProducts, initialNextCursor, initialFilters }: HomeClientProps) {
  const { keyword, setKeyword, vrOnly, soloOnly, excludeBest, includeGenreIds, setIncludeGenreIds, excludeGenreIds, setExcludeGenreIds, filters, pushFiltersToURL } = useSearchFilters({
    initialFilters,
  });

  const { products, loading, loadingMore, runSearch, loadMore, canLoadMore, nextCursor, setIsFiltering, isFiltering, resetToDefault } = useProductSearch({
    filters,
    initialProducts,
    initialNextCursor,
  });

  const [isSearching, setIsSearching] = useState(false);
  const isInitialMountRef = useRef(true);
  const isResettingRef = useRef(false);
  const prevFiltersRef = useRef<SearchFilters | null>(null);

  const handleSearch = useCallback(
    async (newKeyword: string) => {
      setIsSearching(true);
      setKeyword(newKeyword);
      const next: SearchFilters = {
        keyword: newKeyword,
        vrOnly,
        soloOnly,
        excludeBest,
        includeGenreIds,
        excludeGenreIds,
      };
      try {
        pushFiltersToURL(next);
        await runSearch(next, 1, "replace");
      } finally {
        setIsSearching(false);
      }
    },
    [vrOnly, soloOnly, excludeBest, includeGenreIds, excludeGenreIds, runSearch, pushFiltersToURL, setKeyword],
  );

  const handleToggleIncludeGenre = useCallback(
    (id: number) => {
      setIncludeGenreIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    },
    [setIncludeGenreIds],
  );

  const handleToggleExcludeGenre = useCallback(
    (id: number) => {
      setExcludeGenreIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    },
    [setExcludeGenreIds],
  );

  const handleApplyIncludeGenre = useCallback(
    (ids: number[]) => {
      setIncludeGenreIds(ids);
    },
    [setIncludeGenreIds],
  );

  const handleApplyExcludeGenre = useCallback(
    (ids: number[]) => {
      setExcludeGenreIds(ids);
    },
    [setExcludeGenreIds],
  );

  const handleLoadMore = useCallback(() => {
    void loadMore();
  }, [loadMore]);

  useEffect(() => {
    const unsubscribe = subscribeNavReset("/home", () => {
      isResettingRef.current = true;
      setKeyword("");
      setIncludeGenreIds([]);
      setExcludeGenreIds([1014, 6003]);
      resetToDefault();
    });
    return unsubscribe;
  }, [setKeyword, setIncludeGenreIds, setExcludeGenreIds, resetToDefault]);

  useEffect(() => {
    if (isResettingRef.current) {
      isResettingRef.current = false;
      prevFiltersRef.current = filters;
      return;
    }
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      prevFiltersRef.current = filters;
      return;
    }
    const prev = prevFiltersRef.current;
    if (
      prev &&
      prev.keyword === filters.keyword &&
      prev.vrOnly === filters.vrOnly &&
      prev.soloOnly === filters.soloOnly &&
      prev.excludeBest === filters.excludeBest &&
      JSON.stringify(prev.includeGenreIds) === JSON.stringify(filters.includeGenreIds) &&
      JSON.stringify(prev.excludeGenreIds) === JSON.stringify(filters.excludeGenreIds)
    ) {
      return;
    }
    prevFiltersRef.current = filters;
    setIsFiltering(true);
    void runSearch(filters, 1, "replace").finally(() => setIsFiltering(false));
  }, [filters, runSearch, setIsFiltering]);

  return (
    <>
      <KeywordSearchBar keyword={keyword} isSearching={isSearching} onSearch={handleSearch} />
      <VideoGrid
        products={products}
        loading={loading}
        loadingMore={loadingMore}
        canLoadMore={canLoadMore}
        filters={filters}
        nextCursor={nextCursor}
        filtering={isFiltering}
        onToggleIncludeGenre={handleToggleIncludeGenre}
        onToggleExcludeGenre={handleToggleExcludeGenre}
        onApplyIncludeGenre={handleApplyIncludeGenre}
        onApplyExcludeGenre={handleApplyExcludeGenre}
        onLoadMore={handleLoadMore}
      />
    </>
  );
}
