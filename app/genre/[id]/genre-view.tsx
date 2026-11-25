"use client";

import { usePathname } from "next/navigation";
import { useEffect, useCallback } from "react";
import { getGenreById, getProductsByGenreId } from "../../../lib/supabase";
import VideoGrid from "../../../components/VideoGrid";
import KeywordSearchBar from "../../../components/KeywordSearchBar";
import { SkeletonLine } from "../../../components/SkeletonGrid";
import { useEntityProductList } from "../../../hooks/useEntityProductList";
import { useSearchFilters } from "../../../hooks/useSearchFilters";

const PAGE_SIZE = 12;

export default function GenrePage({ id }: { id: string }) {
  const genreId = Number(id);
  const pathname = usePathname();

  const {
    products,
    entity: genre,
    loading,
    loadingMore,
    hasMore,
    vrOnly: listVrOnly,
    soloOnly: listSoloOnly,
    excludeBest: listExcludeBest,
    keyword: listKeyword,
    loadMore,
    setKeyword: setListKeyword,
    setVrOnly: setListVrOnly,
    setSoloOnly: setListSoloOnly,
    setExcludeBest: setListExcludeBest,
    setIncludeGenreIds: setListIncludeGenreIds,
    setExcludeGenreIds: setListExcludeGenreIds,
  } = useEntityProductList({
    id,
    entityId: genreId,
    fetchEntity: (gid) => getGenreById(gid).then((g) => ({ entity: g, displayName: g?.name ?? "" })),
    fetchProducts: (gid, offset, pageSize, filters) => getProductsByGenreId(gid, offset, pageSize, filters),
    matchProduct: (p) => Boolean(p.genreIds?.includes(genreId)),
    pageSize: PAGE_SIZE,
  });

  const {
    keyword: urlKeyword,
    setKeyword: setUrlKeyword,
    vrOnly: urlVrOnly,
    soloOnly: urlSoloOnly,
    excludeBest: urlExcludeBest,
    includeGenreIds: urlIncludeGenreIds,
    setIncludeGenreIds: setUrlIncludeGenreIds,
    excludeGenreIds: urlExcludeGenreIds,
    setExcludeGenreIds: setUrlExcludeGenreIds,
    pushFiltersToURL,
    startInitialLoad,
  } = useSearchFilters();

  useEffect(() => {
    setListKeyword(urlKeyword);
    setListVrOnly(urlVrOnly);
    setListSoloOnly(urlSoloOnly);
    setListExcludeBest(urlExcludeBest);
    setListIncludeGenreIds(urlIncludeGenreIds);
    setListExcludeGenreIds(urlExcludeGenreIds);
  }, [urlKeyword, urlVrOnly, urlSoloOnly, urlExcludeBest, urlIncludeGenreIds, urlExcludeGenreIds, setListKeyword, setListVrOnly, setListSoloOnly, setListExcludeBest, setListIncludeGenreIds, setListExcludeGenreIds]);

  useEffect(() => {
    pushFiltersToURL({ keyword: listKeyword, vrOnly: listVrOnly, soloOnly: listSoloOnly, excludeBest: listExcludeBest, includeGenreIds: [], excludeGenreIds: [] });
  }, [listKeyword, listVrOnly, listSoloOnly, listExcludeBest, pushFiltersToURL]);

  useEffect(() => {
    startInitialLoad();
  }, [pathname, startInitialLoad]);

  const handleSearch = useCallback((kw: string) => {
    setUrlKeyword(kw);
  }, [setUrlKeyword]);

  const handleToggleIncludeGenre = useCallback((id: number) => {
    setUrlIncludeGenreIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, [setUrlIncludeGenreIds]);

  const handleToggleExcludeGenre = useCallback((id: number) => {
    setUrlExcludeGenreIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, [setUrlExcludeGenreIds]);

  const handleApplyIncludeGenre = useCallback((ids: number[]) => {
    setUrlIncludeGenreIds(ids);
  }, [setUrlIncludeGenreIds]);

  const handleApplyExcludeGenre = useCallback((ids: number[]) => {
    setUrlExcludeGenreIds(ids);
  }, [setUrlExcludeGenreIds]);

  if (!genre && !loading) {
    return (
      <main className="max-w-5xl mx-auto w-full p-3">
        <p className="text-gray-500">ジャンルが見つかりませんでした。</p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto w-full p-3">
      <h1 className="text-2xl font-bold mb-6">{genre ? `${(genre as { name: string }).name}のAV一覧` : <SkeletonLine className="h-7 w-56 max-w-full" />}</h1>

      <KeywordSearchBar keyword={urlKeyword} onSearch={handleSearch} />

      <VideoGrid
        products={products}
        loading={loading}
        loadingMore={loadingMore}
        canLoadMore={hasMore}
        nextCursor={null}
        filters={{ keyword: urlKeyword, vrOnly: urlVrOnly, soloOnly: urlSoloOnly, excludeBest: urlExcludeBest, includeGenreIds: urlIncludeGenreIds, excludeGenreIds: urlExcludeGenreIds }}
        onToggleIncludeGenre={handleToggleIncludeGenre}
        onToggleExcludeGenre={handleToggleExcludeGenre}
        onApplyIncludeGenre={handleApplyIncludeGenre}
        onApplyExcludeGenre={handleApplyExcludeGenre}
        onLoadMore={loadMore}
      />
    </main>
  );
}
