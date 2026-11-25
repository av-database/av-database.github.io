import Link from "next/link";
import Image from "next/image";
import { getProductImageUrl, Product } from "../lib/supabase";
import FilterToggle from "./FilterToggle";
import SkeletonGrid, { SkeletonItems } from "./SkeletonGrid";
import type { SearchFilters } from "../hooks/useSearchFilters";

type ActressInfo = { displayName: string; actressId: number };
type ProductWithActresses = Product & { actressInfos?: ActressInfo[] };

interface VideoGridProps {
  products: ProductWithActresses[];
  loading: boolean;
  loadingMore: boolean;
  canLoadMore: boolean;
  filters: SearchFilters;
  nextCursor?: string | null;
  filtering?: boolean;
  emptyMessage?: string;
  onToggleIncludeGenre?: (id: number) => void;
  onToggleExcludeGenre?: (id: number) => void;
  onApplyIncludeGenre?: (ids: number[]) => void;
  onApplyExcludeGenre?: (ids: number[]) => void;
  onLoadMore?: () => void;
}

const BADGE_CLASS = "text-white text-[10px] font-bold px-1.5 py-1 rounded leading-none";

const hasGenre = (id: number) => (p: ProductWithActresses) => p.genreIds?.includes(id) ?? false;

type Badge = { label: string; color: string; match: (p: ProductWithActresses) => boolean };

const today = new Date().toISOString().slice(0, 10);

const BADGES: Badge[] = [
  { label: "本日発売", color: "bg-red-600", match: (p) => !!p.date && p.date.slice(0, 10) === today },
  { label: "ベスト", color: "bg-yellow-500", match: hasGenre(6003) },
  { label: "素人", color: "bg-black", match: (p) => p.floor === "c" },
  { label: "VR", color: "bg-purple-600", match: hasGenre(6793) },
  { label: "デビュー作", color: "bg-green-600", match: hasGenre(6006) },
  { label: "熟女", color: "bg-[#73380e]", match: hasGenre(1014) },
  { label: "女教師", color: "bg-pink-400", match: hasGenre(1016) },
  { label: "女子校生", color: "bg-pink-400", match: hasGenre(1018) },
  { label: "ナース", color: "bg-pink-400", match: hasGenre(1013) },
  { label: "ハーレム", color: "bg-pink-400", match: hasGenre(5071) },
  { label: "童貞", color: "bg-blue-400", match: hasGenre(4014) },
];

export default function VideoGrid({
  products,
  loading,
  loadingMore,
  canLoadMore,
  filters,

  filtering = false,
  emptyMessage = "検索条件に一致する作品は見つかりませんでした。",
  onToggleIncludeGenre,
  onToggleExcludeGenre,
  onApplyIncludeGenre,
  onApplyExcludeGenre,
  onLoadMore,
}: VideoGridProps) {
  const { includeGenreIds = [], excludeGenreIds = [] } = filters;
  const hasFilter = includeGenreIds.length > 0 || excludeGenreIds.length > 0;

  return (
    <>
      <div className="mb-4">
        <FilterToggle
          includeGenreIds={includeGenreIds}
          excludeGenreIds={excludeGenreIds}
          onToggleIncludeGenre={onToggleIncludeGenre}
          onToggleExcludeGenre={onToggleExcludeGenre}
          onApplyIncludeGenre={onApplyIncludeGenre}
          onApplyExcludeGenre={onApplyExcludeGenre}
        />
      </div>

      {loading && products.length === 0 ? (
        <SkeletonGrid variant="video" />
      ) : products.length === 0 ? (
        <p className="text-gray-500">{hasFilter ? "検索条件に一致する作品は見つかりませんでした。" : emptyMessage}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 relative">
            {filtering && (
              <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center rounded-lg">
                <p className="text-sm text-gray-500">読み込み中…</p>
              </div>
            )}
            {products.map((product, index) => (
              <div key={product.contentId} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/video/${product.contentId}`} className="block">
                  <div className="relative w-full aspect-[16/10] bg-gray-100">
                    <Image
                      src={getProductImageUrl(product.contentId, product.floor)}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-contain"
                      loading={index === 0 ? "eager" : "lazy"}
                      priority={index === 0}
                    />
                  </div>
                </Link>
                <div className="px-3 pt-3 pb-3">
                  <Link href={`/video/${product.contentId}`} className="block">
                    <div className="flex gap-1 mb-1 min-h-[20px] overflow-x-auto whitespace-nowrap scrollbar-hide items-center">
                      {BADGES.filter((b) => b.match(product)).map((b) => (
                        <span key={b.label} className={`${b.color} ${BADGE_CLASS}`}>
                          {b.label}
                        </span>
                      ))}
                    </div>
                    <h2 className="font-semibold text-sm line-clamp-2">{product.title}</h2>
                  </Link>
                  {product.actressInfos === undefined ? (
                    <p className="text-xs mt-[4px] overflow-x-auto whitespace-nowrap scrollbar-hide" aria-hidden="true">
                      <span className="inline-block h-3 w-24 rounded bg-gray-200 animate-pulse" />
                    </p>
                  ) : (
                    product.actressInfos.length > 0 && (
                      <p className="text-xs mt-[4px] overflow-x-auto whitespace-nowrap scrollbar-hide">
                        {product.actressInfos.map((a, i) => (
                          <span key={a.actressId}>
                            {i > 0 && <span className="text-gray-500">・</span>}
                            <Link href={`/actress/${a.actressId}`} className="font-bold text-pink-500 hover:text-pink-700 hover:underline">
                              {a.displayName}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )
                  )}
                </div>
              </div>
            ))}
            {loadingMore && <SkeletonItems variant="video" count={12} />}
          </div>

          {!loadingMore && canLoadMore && (
            <div className="flex justify-center mt-8">
              <button type="button" onClick={onLoadMore} className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                もっと見る
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
