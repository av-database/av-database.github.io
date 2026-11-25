"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { supabase, getProductImageUrl, getAffiliateUrl, getSampleImageUrls, contentIdToProductNumber } from "../../../lib/supabase";
import { type Product, type Genre, type Series, type Maker, type Actress, type ItemInfo, type ProductRow, type GenreRow, type SeriesRow, type MakerRow, type ActressRow, toProduct, toGenre, toSeries, toMaker, toActress } from "../../../lib/db-common";

const joinNames = (list?: { name: string }[]): string => list?.map((entry) => entry.name).join(", ") ?? "";

type VideoPageData = {
  product: Product;
  genres: Genre[];
  series: Series | null;
  maker: Maker | null;
  actresses: (Actress & { displayName: string; actressId: number })[];
  releaseDate: string;
  sampleImages: string[];
};

export default function VideoPage({ contentId }: { contentId: string }) {
  const [data, setData] = useState<VideoPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const { data: productData, error: productError } = await supabase
          .from("product")
          .select("content_id,title,volume,date,iteminfo,actress_ids,genre_ids,maker_id,series_id,sample_count,floor")
          .eq("content_id", contentId)
          .single();

        if (productError) throw productError;
        if (!productData) throw new Error("商品が見つかりませんでした。");

        const product = toProduct(productData as ProductRow);

        const [genresRes, seriesRes, makerRes, actressesRes] = await Promise.all([
          product.genreIds?.length ? supabase.from("genre").select("genre_id,name").in("genre_id", product.genreIds) : Promise.resolve({ data: [], error: null }),
          product.floor !== "c" && product.seriesId ? supabase.from("series").select("series_id,name").eq("series_id", product.seriesId).maybeSingle() : Promise.resolve({ data: null, error: null }),
          product.makerId ? supabase.from("maker").select("maker_id,name").eq("maker_id", product.makerId).maybeSingle() : Promise.resolve({ data: null, error: null }),
          product.actressIds?.length ? supabase.from("actress").select("actress_id,name,image_id").in("actress_id", product.actressIds) : Promise.resolve({ data: [], error: null }),
        ]);

        if (genresRes.error) throw genresRes.error;
        if (seriesRes.error) throw seriesRes.error;
        if (makerRes.error) throw makerRes.error;
        if (actressesRes.error) throw actressesRes.error;

        const genres = ((genresRes.data as GenreRow[]) || []).map(toGenre);
        const series = seriesRes.data ? toSeries(seriesRes.data as SeriesRow) : null;
        const maker = makerRes.data ? toMaker(makerRes.data as MakerRow) : null;
        const actresses = ((actressesRes.data as ActressRow[]) || []).map((a: ActressRow) => ({
          ...toActress(a),
          displayName: a.name,
          actressId: a.actress_id,
        }));

        const rawDate = product.date?.split(/[T ]/)[0] || "";
        const releaseDate = (() => {
          if (!rawDate) return "";
          const [y, m, d] = rawDate.split("-").map(Number);
          const date = new Date(y, m - 1, d);
          const days = ["日", "月", "火", "水", "木", "金", "土"];
          return `${y}年${m}月${d}日(${days[date.getDay()]})`;
        })();

        const sampleImages = getSampleImageUrls(product.contentId, product.sampleCount || 0, product.floor);

        if (!cancelled) {
          setData({ product, genres, series, maker, actresses, releaseDate, sampleImages });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [contentId]);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto w-full p-3">
        <p className="text-gray-500">読み込み中…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-4xl mx-auto w-full p-3">
        <p className="text-red-500">商品の読み込みに失敗しました。</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="max-w-4xl mx-auto w-full p-3">
        <p className="text-gray-500">商品が見つかりませんでした。</p>
      </main>
    );
  }

  const { product, genres, series, maker, actresses, releaseDate, sampleImages } = data;
  const iteminfo: ItemInfo = typeof product.itemInfo === "string" ? (JSON.parse(product.itemInfo) as ItemInfo) : (product.itemInfo ?? {});

  return (
    <main className="max-w-4xl mx-auto w-full p-3">
      <h1 className="text-xl font-bold leading-tight mb-6">{product.title}</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/2">
          <a href={getAffiliateUrl(product.contentId, product.floor)} target="_blank" rel="noopener noreferrer" className="block relative w-full bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={getProductImageUrl(product.contentId, product.floor)}
              alt={product.title}
              width={800}
              height={0}
              sizes="(max-width: 768px) 100vw, 50vw"
              className="h-auto w-full object-cover"
              priority
            />
          </a>
        </div>

        <div className="md:w-1/2 space-y-4">
          <div className="border rounded-lg p-4 space-y-2 text-sm">
            <h2 className="font-semibold text-sm text-gray-500">動画の詳細</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              <dt className="text-gray-500">発売日</dt>
              <dd>{releaseDate}</dd>
              <dt className="text-gray-500">収録時間</dt>
              <dd>{product.volume}分</dd>
              <dt className="text-gray-500">メーカー品番</dt>
              <dd>{contentIdToProductNumber(product.contentId) ?? product.contentId}</dd>
              <dt className="text-gray-500">配信品番</dt>
              <dd>{product.contentId}</dd>
              {maker ? (
                <>
                  <dt className="text-gray-500">メーカー</dt>
                  <dd>{maker.name}</dd>
                </>
              ) : null}
              {iteminfo.label?.length ? (
                <>
                  <dt className="text-gray-500">レーベル</dt>
                  <dd>{joinNames(iteminfo.label)}</dd>
                </>
              ) : null}
              {series ? (
                <>
                  <dt className="text-gray-500">シリーズ</dt>
                  <dd>{series.name}</dd>
                </>
              ) : null}
              {iteminfo.director?.length ? (
                <>
                  <dt className="text-gray-500">監督</dt>
                  <dd>{joinNames(iteminfo.director)}</dd>
                </>
              ) : null}
            </dl>
          </div>

          {actresses.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-gray-500 mb-2">女優</h2>
              <div className="flex flex-wrap gap-2">
                {actresses.map((a, i) => (
                  <Link key={`actress-${a.actressId}-${i}`} href={`/actress/${a.actressId}`} className="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full hover:bg-gray-200 transition-colors">
                    {a.displayName}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {genres.length > 0 && (
            <div>
              <h2 className="font-semibold text-sm text-gray-500 mb-2">ジャンル</h2>
              <div className="flex flex-wrap gap-2">
                {genres.map((g, i) => (
                  <Link key={`genre-${g.genreId}-${i}`} href={`/genre/${g.genreId}`} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                    {g.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <a
        href={getAffiliateUrl(product.contentId, product.floor)}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition-colors mt-6"
      >
        FANZAで見る
      </a>

      {sampleImages.length > 0 && (
        <>
          <div className="mt-6">
            <h2 className="font-semibold text-sm text-gray-500 mb-2">サンプル画像 ({sampleImages.length}枚)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleImages.map((url, i) => (
                <a key={`sample-${i}`} href={url} target="_blank" rel="noopener noreferrer" className="block bg-gray-100 rounded overflow-hidden hover:opacity-80 transition-opacity">
                  <Image src={url} alt={`Sample ${i + 1}`} width={800} height={0} sizes="(max-width: 640px) 100vw, 50vw" quality={100} className="w-full h-auto object-cover" />
                </a>
              ))}
            </div>
            <a
              href={getAffiliateUrl(product.contentId, product.floor)}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition-colors mt-6"
            >
              FANZAで見る
            </a>
          </div>
        </>
      )}
    </main>
  );
}
