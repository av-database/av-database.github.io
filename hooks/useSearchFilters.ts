"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export type SearchFilters = {
  keyword: string;
  vrOnly: boolean;
  soloOnly: boolean;
  excludeBest: boolean;
  includeGenreIds: number[];
  excludeGenreIds: number[];
};

function parseCsvIds(value: string | null): number[] {
  if (!value) return [];
  return value
    .split(",")
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

function readFiltersFromURL(): SearchFilters {
  if (typeof window === "undefined") {
    return { keyword: "", vrOnly: false, soloOnly: false, excludeBest: false, includeGenreIds: [], excludeGenreIds: [] };
  }
  const sp = new URLSearchParams(window.location.search);
  return {
    keyword: sp.get("keyword") ?? "",
    vrOnly: sp.get("vrOnly") === "1",
    soloOnly: sp.get("soloOnly") === "1",
    excludeBest: sp.get("excludeBest") === "1",
    includeGenreIds: parseCsvIds(sp.get("includeGenreIds")),
    excludeGenreIds: (() => {
      const v = sp.get("excludeGenreIds");
      return v === null ? [1014, 6003] : parseCsvIds(v);
    })(),
  };
}

function pushFiltersToURL(f: SearchFilters) {
  const sp = new URLSearchParams();
  const kw = f.keyword.trim();
  if (kw) sp.set("keyword", kw);
  if (f.vrOnly) sp.set("vrOnly", "1");
  if (f.soloOnly) sp.set("soloOnly", "1");
  if (f.excludeBest) sp.set("excludeBest", "1");
  if (f.includeGenreIds.length) sp.set("includeGenreIds", f.includeGenreIds.join(","));
  if (f.excludeGenreIds.length) sp.set("excludeGenreIds", f.excludeGenreIds.join(","));
  const qs = sp.toString();
  const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  window.history.pushState(null, "", url);
}

export function useSearchFilters({ initialFilters }: { initialFilters?: SearchFilters } = {}) {
  const [keyword, setKeyword] = useState(initialFilters?.keyword ?? "");
  const [vrOnly, setVrOnly] = useState(initialFilters?.vrOnly ?? false);
  const [soloOnly, setSoloOnly] = useState(initialFilters?.soloOnly ?? false);
  const [excludeBest, setExcludeBest] = useState(initialFilters?.excludeBest ?? false);
  const [includeGenreIds, setIncludeGenreIds] = useState(initialFilters?.includeGenreIds ?? []);
  const [excludeGenreIds, setExcludeGenreIds] = useState(initialFilters?.excludeGenreIds ?? []);
  const initialLoadRef = useRef(false);

  const filters: SearchFilters = { keyword, vrOnly, soloOnly, excludeBest, includeGenreIds, excludeGenreIds };
  const activeKeyword = keyword.trim();
  const hasActiveFilter = activeKeyword || vrOnly || soloOnly || excludeBest || includeGenreIds.length > 0 || excludeGenreIds.length > 0;

  const startInitialLoad = useCallback(() => {
    const f = readFiltersFromURL();
    setKeyword(f.keyword);
    setVrOnly(f.vrOnly);
    setSoloOnly(f.soloOnly);
    setExcludeBest(f.excludeBest);
    setIncludeGenreIds(f.includeGenreIds);
    setExcludeGenreIds(f.excludeGenreIds);
  }, []);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    startInitialLoad();
  }, [startInitialLoad]);

  useEffect(() => {
    const onPopState = () => {
      const f = readFiltersFromURL();
      setKeyword(f.keyword);
      setVrOnly(f.vrOnly);
      setSoloOnly(f.soloOnly);
      setExcludeBest(f.excludeBest);
      setIncludeGenreIds(f.includeGenreIds);
      setExcludeGenreIds(f.excludeGenreIds);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return {
    keyword,
    setKeyword,
    vrOnly,
    setVrOnly,
    soloOnly,
    setSoloOnly,
    excludeBest,
    setExcludeBest,
    includeGenreIds,
    setIncludeGenreIds,
    excludeGenreIds,
    setExcludeGenreIds,
    filters,
    activeKeyword,
    hasActiveFilter,
    pushFiltersToURL,
    startInitialLoad,
  };
}
