import Link from "next/link";
import { searchGenres, getAllGenres, Genre } from "../../../lib/supabase";

export const instant = false;

const PAGE_SIZE = 48;

function readFiltersFromSearchParams(searchParams: { [key: string]: string | string[] | undefined }): { name: string; page: string } {
  const sp = Object.fromEntries(Object.entries(searchParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])) as Record<string, string>;
  return { name: sp.name ?? "", page: sp.page ?? "1" };
}

function buildUrl(name: string, page: number): string {
  const sp = new URLSearchParams();
  if (name) sp.set("name", name);
  sp.set("page", String(page));
  return `/genre/search?${sp.toString()}`;
}

export default async function GenreSearchPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const params = await searchParams;
  const { name, page } = readFiltersFromSearchParams(params);
  const targetPage = Number(page) || 1;

  let results: Genre[] = [];
  let hasMore = false;
  let isSearched = false;

  if (name.trim()) {
    const all = await searchGenres(name);
    const sliced = all.slice(0, targetPage * PAGE_SIZE);
    results = sliced;
    hasMore = sliced.length < all.length;
    isSearched = true;
  } else {
    const all = await getAllGenres();
    const sliced = all.slice(0, targetPage * PAGE_SIZE);
    results = sliced;
    hasMore = sliced.length < all.length;
  }

  return (
    <main className="max-w-5xl mx-auto w-full p-3">
      <h1 className="text-2xl font-bold border-b-2 pb-2 mb-6">ジャンル一覧</h1>

      <form method="get" className="mb-8">
        <div className="flex gap-2">
          <label htmlFor="genre-search-name" className="sr-only">ジャンル名</label>
          <input id="genre-search-name" name="name" type="text" defaultValue={name} placeholder="ジャンル名で検索..." className="flex-1 border rounded-lg px-3 py-2 text-sm" />
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            検索
          </button>
          <Link href="/genre/search">
            <button type="button" className="px-6 py-2 border rounded-lg hover:bg-gray-50 text-sm">
              リセット
            </button>
          </Link>
        </div>
      </form>

      {results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {results.map((genre) => (
              <Link key={genre.genreId} href={`/genre/${genre.genreId}`} className="block border rounded-lg p-4 text-center hover:shadow-lg hover:bg-blue-50 transition-all text-sm font-medium">
                {genre.name}
              </Link>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-8">
              <a href={buildUrl(name, targetPage + 1)} className="px-6 py-3 border rounded-lg hover:bg-gray-50">
                もっと見る
              </a>
            </div>
          )}
        </>
      ) : isSearched ? (
        <p className="text-gray-500">該当するジャンルは見つかりませんでした。</p>
      ) : null}
    </main>
  );
}
