import type { MetadataRoute } from "next";
import { getAllActresses, getAllGenres, getProducts, type Product } from "@/lib/supabase";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/home`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/actress/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/genre/search`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  let actressRoutes: MetadataRoute.Sitemap = [];
  try {
    const actresses = await getAllActresses();
    actressRoutes = actresses.map((a) => ({
      url: `${siteUrl}/actress/${a.actressId}`,
      lastModified: new Date(a.createdAt || Date.now()),
      changeFrequency: "weekly",
      priority: 0.5,
    }));
  } catch {
    // サイトマップ生成失敗時は静的ルートのみ返す
  }

  let videoRoutes: MetadataRoute.Sitemap = [];
  try {
    const PAGE_SIZE = 100;
    let page = 1;
    let hasMore = true;
    const products: Product[] = [];

    while (hasMore) {
      const { data } = await getProducts(page, PAGE_SIZE);
      if (!data || data.length === 0) break;
      products.push(...data);
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        page++;
      }
    }

    videoRoutes = products.map((p) => ({
      url: `${siteUrl}/video/${p.contentId}`,
      lastModified: new Date(p.date),
      changeFrequency: "monthly",
      priority: 0.6,
    }));
  } catch {
    // ignore
  }

  let genreRoutes: MetadataRoute.Sitemap = [];
  try {
    const genres = await getAllGenres();
    genreRoutes = genres.map((g) => ({
      url: `${siteUrl}/genre/${g.genreId}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    }));
  } catch {
    // ignore
  }

  return [...staticRoutes, ...actressRoutes, ...videoRoutes, ...genreRoutes];
}
