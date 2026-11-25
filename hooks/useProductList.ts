"use client";

import { useState, useEffect, useCallback, Dispatch, SetStateAction, useRef } from "react";
import { Product, ProductWithActresses, enrichProducts } from "../lib/products";
import { searchProducts } from "../lib/supabase";

type ProductListFilters = {
  vrOnly?: boolean;
  soloOnly?: boolean;
  excludeBest?: boolean;
  keyword?: string;
  includeGenreIds?: number[];
  excludeGenreIds?: number[];
  offset?: number;
};

type FetchPageResult = {
  items: Product[];
  hasMore: boolean;
  entity?: unknown;
  displayName?: string;
};

type InitialData = {
  products: ProductWithActresses[];
  hasMore: boolean;
  entity: unknown;
  displayName: string;
};

interface UseProductListOptions {
  entityId: string;
  fetchPage: (filters?: ProductListFilters) => Promise<FetchPageResult>;
  pageSize?: number;
  matchProduct?: (p: Product) => boolean;
  initialData?: InitialData;
}

export function useProductList({ entityId, fetchPage, pageSize = 12, matchProduct, initialData }: UseProductListOptions) {
  const [products, setProducts] = useState<ProductWithActresses[]>([]);
  const [entity, setEntity] = useState<unknown>(null);
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [vrOnly, setVrOnly] = useState(false);
  const [soloOnly, setSoloOnly] = useState(false);
  const [excludeBest, setExcludeBest] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [includeGenreIds, setIncludeGenreIds] = useState<number[]>([]);
  const [excludeGenreIds, setExcludeGenreIds] = useState<number[]>([]);

  const appliedRef = useRef(false);
  const prevEntityIdRef = useRef(entityId);

  useEffect(() => {
    if (prevEntityIdRef.current !== entityId) {
      appliedRef.current = false;
      prevEntityIdRef.current = entityId;
    }
  }, [entityId]);

  const applyInitial = useCallback(
    (data: { products: ProductWithActresses[]; hasMore: boolean; entity: unknown; displayName: string }) => {
      setEntity(data.entity);
      setDisplayName(data.displayName);
      setProducts(data.products);
      setHasMore(data.hasMore);
      setOffset(pageSize);
      setLoading(false);
      setIsFiltering(false);
    },
    [pageSize],
  );

  const fetchInitial = useCallback(
    async (filters?: ProductListFilters) => {
      const result = await fetchPage(filters);
      const enriched = await enrichProducts(result.items);
      const seen = new Set<string>();
      const unique = enriched.filter((p) => (seen.has(p.contentId) ? false : (seen.add(p.contentId), true)));
      applyInitial({
        products: unique,
        hasMore: result.hasMore,
        entity: result.entity ?? null,
        displayName: result.displayName ?? "",
      });
    },
    [fetchPage, applyInitial],
  );

  useEffect(() => {
    if (initialData && !appliedRef.current) {
      applyInitial({
        products: initialData.products,
        hasMore: initialData.hasMore,
        entity: initialData.entity ?? null,
        displayName: initialData.displayName ?? "",
      });
      appliedRef.current = true;
      return;
    }
    if (!initialData && !appliedRef.current) {
      fetchInitial({ vrOnly, soloOnly, excludeBest, keyword, includeGenreIds, excludeGenreIds });
      appliedRef.current = true;
      return;
    }
    fetchInitial({ vrOnly, soloOnly, excludeBest, keyword, includeGenreIds, excludeGenreIds });
  }, [fetchInitial, applyInitial, initialData, entityId, vrOnly, soloOnly, excludeBest, keyword, includeGenreIds, excludeGenreIds]);

  const handleToggle = (setFn: Dispatch<SetStateAction<boolean>>) => {
    setIsFiltering(true);
    setFn((prev) => !prev);
  };

  const handleSearch = async () => {
    setIsFiltering(true);
    setLoading(true);
    try {
      const params: {
        keyword?: string;
        soloOnly?: boolean;
        excludeBest?: boolean;
        page: number;
        limit: number;
      } = { page: 1, limit: pageSize };
      const kw = keyword.trim();
      if (kw) params.keyword = kw;
      if (soloOnly) params.soloOnly = true;
      if (excludeBest) params.excludeBest = true;
      const { data } = await searchProducts(params);
      const matched = data.filter((p) => (matchProduct ? matchProduct(p) : true));
      const enriched = await enrichProducts(matched);
      const seen = new Set<string>();
      setProducts(enriched.filter((p) => (seen.has(p.contentId) ? false : (seen.add(p.contentId), true))));
      setHasMore(false);
      setOffset(0);
      setLoading(false);
      setIsFiltering(false);
    } catch {
      setProducts([]);
      setLoading(false);
      setIsFiltering(false);
    }
  };

  const handleReset = () => {
    setKeyword("");
    fetchInitial({ vrOnly, soloOnly, excludeBest, keyword: "", includeGenreIds: [], excludeGenreIds: [] });
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const more = await fetchPage({ vrOnly, soloOnly, excludeBest, keyword, includeGenreIds, excludeGenreIds, offset });
      const matched = more.items.filter((p) => (matchProduct ? matchProduct(p) : true));
      const enriched = await enrichProducts(matched);
      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.contentId));
        const newItems = enriched.filter((p) => !existingIds.has(p.contentId));
        return [...prev, ...newItems];
      });
      setOffset((prev) => prev + more.items.length);
      setHasMore(more.hasMore);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  return {
    products,
    entity,
    displayName,
    loading,
    isFiltering,
    loadingMore,
    hasMore,
    vrOnly,
    soloOnly,
    excludeBest,
    keyword,
    includeGenreIds,
    excludeGenreIds,
    setKeyword,
    setVrOnly,
    setSoloOnly,
    setExcludeBest,
    setIncludeGenreIds,
    setExcludeGenreIds,
    handleToggleVr: () => handleToggle(setVrOnly),
    handleToggleSolo: () => handleToggle(setSoloOnly),
    handleToggleExcludeBest: () => handleToggle(setExcludeBest),
    handleSearch,
    handleReset,
    loadMore,
  };
}
