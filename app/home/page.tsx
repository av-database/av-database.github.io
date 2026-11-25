import type { Metadata } from "next";
import HomeClient from "../../components/HomeClient";
import { getProductsPage } from "../../lib/supabase";
import { enrichProducts } from "../../lib/products";
import { getCachedHomeProducts, getCachedHomeSearchProducts } from "../../lib/cached-home";
import type { SearchFilters } from "../../hooks/useSearchFilters";

const PAGE_SIZE = 12;

const DEFAULT_EXCLUDE_GENRE_IDS = [6003, 1014];

export const metadata: Metadata = {
  title: "AVDB｜AVデータベース - 作品一覧",
  description: "AV女優・作品を検索できるAVデータベース。作品一覧から気になる作品を探せます。",
  openGraph: {
    siteName: "AVDB",
    title: "AVDB｜AVデータベース - 作品一覧",
    description: "AV女優・作品を検索できるAVデータベース。作品一覧から気になる作品を探せます。",
    type: "website",
    url: "/home",
  },
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AVDB",
  url: "https://avdb.github.io/",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string; vrOnly?: string; soloOnly?: string; excludeBest?: string; includeGenreIds?: string; excludeGenreIds?: string; cursor?: string }>;
}) {
  const { keyword = "", vrOnly = "0", soloOnly = "0", excludeBest = "0", includeGenreIds = "", excludeGenreIds = "1014,6003", cursor } = await searchParams;
  const parseIds = (value: string): number[] =>
    value
      .split(",")
      .filter(Boolean)
      .map(Number)
      .filter((n) => Number.isFinite(n));
  const filters: SearchFilters = {
    keyword,
    vrOnly: vrOnly === "1",
    soloOnly: soloOnly === "1",
    excludeBest: excludeBest === "1",
    includeGenreIds: parseIds(includeGenreIds),
    excludeGenreIds: parseIds(excludeGenreIds),
  };

  let products: Awaited<ReturnType<typeof enrichProducts>> = [];
  let nextCursor: string | null = null;

  if (filters.keyword || filters.vrOnly || filters.soloOnly || filters.excludeBest || filters.includeGenreIds.length || filters.excludeGenreIds.length) {
    const result = await getCachedHomeSearchProducts(filters);
    products = result.products;
    nextCursor = result.nextCursor;
  } else if (!cursor) {
    const result = await getCachedHomeProducts();
    products = result.products;
    nextCursor = result.nextCursor;
  } else {
    const { data, nextCursor: cur } = await getProductsPage(PAGE_SIZE, cursor, DEFAULT_EXCLUDE_GENRE_IDS);
    products = await enrichProducts(data);
    nextCursor = cur;
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }} />
      <main className="max-w-5xl mx-auto w-full p-3">
        <div className="border-b-2 pb-2 mb-6">
          <h1 className="text-2xl font-bold">作品一覧</h1>
        </div>
        <HomeClient initialProducts={products} initialNextCursor={nextCursor} initialFilters={filters} />
      </main>
    </>
  );
}
