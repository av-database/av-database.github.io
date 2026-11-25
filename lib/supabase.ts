import { createClient } from "@supabase/supabase-js";
import {
  type ProductRow,
  type GenreRow,
  type SeriesRow,
  type MakerRow,
  type ActressRow,
  type Product,
  type Genre,
  type Series,
  type Maker,
  type Actress,
  type ItemInfo,
  PRODUCT_LIST_COLUMNS,
  ACTRESS_SEARCH_COLUMNS,
  BEST_GENRE_IDS,
  applyExcludeBest,
  splitSearchTerms,
  toProduct,
  toGenre,
  toSeries,
  toMaker,
  toActress,
} from "./db-common";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type { Product, Actress, Genre, Series, Maker, ItemInfo };
export type { ActressInfo, ProductWithActresses } from "./products";
export { enrichProducts } from "./products";
export { getProductImageUrl, getActressImageUrl, getAffiliateUrl, getSampleImageUrl, getSampleImageUrls, contentIdToProductNumber, splitSearchTerms } from "./db-common";
export type { ProductSearchParams, ActressSearchParams } from "./db-common";
import type { ProductSearchParams, ActressSearchParams } from "./db-common";

export async function getActressIdsForProduct(actressId: number): Promise<number[]> {
  return [actressId];
}

export async function resolveMergedActressDisplay(actressId: number): Promise<{ actress: Actress | null; displayName: string }> {
  const actress = await getActressById(actressId);
  if (!actress) return { actress: null, displayName: "" };
  return { actress, displayName: actress.name };
}

export async function resolveMergedActressesDisplay(actressIds: number[]): Promise<Map<number, { actress: Actress; displayName: string; actressId: number }>> {
  if (!actressIds || actressIds.length === 0) return new Map();

  const actresses = await getActressesByIds(actressIds);
  const result = new Map<number, { actress: Actress; displayName: string; actressId: number }>();
  for (const a of actresses) {
    result.set(a.actressId, { actress: a, displayName: a.name, actressId: a.actressId });
  }
  return result;
}

export async function getGenresByIds(ids: number[]): Promise<Genre[]> {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase.from("genre").select("*").in("genre_id", ids);
  if (error) throw error;
  return ((data as GenreRow[]) || []).map(toGenre);
}

export async function getSeriesById(seriesId: number): Promise<Series | null> {
  const { data, error } = await supabase.from("series").select("*").eq("series_id", seriesId).maybeSingle();
  if (error) return null;
  return data ? toSeries(data as SeriesRow) : null;
}

export async function getMakerById(makerId: number): Promise<Maker | null> {
  const { data, error } = await supabase.from("maker").select("*").eq("maker_id", makerId).maybeSingle();
  if (error) return null;
  return data ? toMaker(data as MakerRow) : null;
}

export async function getActressesByIds(ids: number[]): Promise<Actress[]> {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase.from("actress").select("actress_id,name,image_id,cup,bust,waist,hip,height,birthday,prefecture").in("actress_id", ids);
  if (error) throw error;
  return ((data as ActressRow[]) || []).map(toActress);
}

export async function getProducts(page: number = 1, limit: number = 20): Promise<{ data: Product[] }> {
  const offset = (page - 1) * limit;
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("product")
    .select(PRODUCT_LIST_COLUMNS)
    .lte("date", today)
    .order("date", { ascending: false })
    .order("floor", { ascending: true })
    .order("content_id", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data: ((data as ProductRow[]) || []).map(toProduct) };
}

export async function getProductsPage(limit: number = 20, cursor?: string, excludeGenreIds: number[] = [], excludeBest: boolean = false): Promise<{ data: Product[]; nextCursor: string | null }> {
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("product")
    .select(PRODUCT_LIST_COLUMNS)
    .lte("date", today)
    .order("date", { ascending: false })
    .order("floor", { ascending: true })
    .order("content_id", { ascending: false })
    .limit(limit);

  if (excludeBest) {
    query = applyExcludeBest(query);
  }
  if (excludeGenreIds?.length) {
    query = query.not("genre_ids", "ov", `{${excludeGenreIds.join(",")}}`);
  }

  if (cursor) {
    let cursorDate: string;
    let cursorFloor: string;
    let cursorContentId: string;
    try {
      [cursorDate, cursorFloor, cursorContentId] = JSON.parse(cursor);
    } catch {
      throw new Error("無効なカーソルです。");
    }
    query = query.or(`date.lt.${cursorDate},` + `and(date.eq.${cursorDate},floor.gt.${cursorFloor}),` + `and(date.eq.${cursorDate},floor.eq.${cursorFloor},content_id.lt.${cursorContentId})`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = (data as ProductRow[]) || [];
  const items = rows.map(toProduct);
  const hasMore = items.length === limit;
  const sliced = items;
  const last = sliced[sliced.length - 1];
  const nextCursor = hasMore && last ? JSON.stringify([last.date, last.floor, last.contentId]) : null;

  return { data: sliced, nextCursor };
}

export async function getProductById(contentId: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("product")
    .select("content_id,title,volume,date,iteminfo,actress_ids,genre_ids,maker_id,series_id,sample_count,floor")
    .eq("content_id", contentId)
    .single();

  if (error) return null;
  return data ? toProduct(data as ProductRow) : null;
}

export async function getProductsByActressId(
  actressId: number,
  from: number = 0,
  to: number = 30,
  filters?: { vrOnly?: boolean; soloOnly?: boolean; excludeBest?: boolean; keyword?: string; includeGenreIds?: number[]; excludeGenreIds?: number[] },
): Promise<Product[]> {
  const today = new Date().toISOString().slice(0, 10);
  const searchIds = await getActressIdsForProduct(actressId);

  let query = supabase.from("product").select(PRODUCT_LIST_COLUMNS).overlaps("actress_ids", searchIds).lte("date", today);

  if (filters?.keyword) {
    query = query.ilike("title", `%${filters.keyword}%`);
  }
  if (filters?.vrOnly) {
    query = query.ilike("title", "【VR】%");
  }
  if (filters?.soloOnly) {
    query = query.contains("genre_ids", [4025]);
  }
  if (filters?.includeGenreIds?.length) {
    query = query.or(`genre_ids.ov.{${filters.includeGenreIds.join(",")}}`);
  }
  if (filters?.excludeGenreIds?.length) {
    query = query.or(`genre_ids.not.ov.{${filters.excludeGenreIds.join(",")}}`);
  }
  if (filters?.excludeBest) {
    query = applyExcludeBest(query);
  }

  const { data, error } = await query
    .order("date", { ascending: false })
    .order("floor", { ascending: true })
    .range(from, from + to - 1);

  if (error) throw error;
  return ((data as ProductRow[]) || []).map(toProduct);
}

export async function getAllActresses(): Promise<Actress[]> {
  const PAGE_SIZE = 1000;
  let from = 0;
  const all: Actress[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("actress")
      .select("*")
      .order("name")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...(data as ActressRow[]).map(toActress));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

export async function getActressById(actressId: number): Promise<Actress | null> {
  const { data, error } = await supabase.from("actress").select("*").eq("actress_id", actressId).single();

  if (error) return null;
  return data ? toActress(data as ActressRow) : null;
}

export async function searchActresses(keyword: string): Promise<Actress[]> {
  const { data, error } = await supabase.from("actress").select("*").or(`name.ilike.%${keyword}%,ruby.ilike.%${keyword}%`).order("name").limit(50);

  if (error) throw error;
  return ((data as ActressRow[]) || []).map(toActress);
}

async function resolveActressIds(terms: string[]): Promise<number[][]> {
  return Promise.all(
    terms.map(async (term) => {
      const { data: matchedActresses } = await supabase.from("actress").select("actress_id").or(`name.ilike.%${term}%,ruby.ilike.%${term}%`);
      return (matchedActresses ?? []).map((a: { actress_id: number }) => a.actress_id);
    }),
  );
}

export async function searchProducts(params: ProductSearchParams): Promise<{ data: Product[]; nextCursor: string | null }> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;
  const today = new Date().toISOString().slice(0, 10);

  const { include: terms, exclude: excludedTerms } = params.keyword ? splitSearchTerms(params.keyword) : { include: [], exclude: [] };

  const EMPTY_ACTRESS_IDS: number[][] = [];
  const [termActressIds, excludedActressIds] = await Promise.all([
    terms.length > 0 ? resolveActressIds(terms) : Promise.resolve(EMPTY_ACTRESS_IDS),
    excludedTerms.length > 0 ? resolveActressIds(excludedTerms) : Promise.resolve(EMPTY_ACTRESS_IDS),
  ]);

  let query = supabase.from("product").select(PRODUCT_LIST_COLUMNS).lte("date", today);

  if (terms.length > 0) {
    const andParts = terms.map((term, i) => {
      const ids = termActressIds[i];
      const conditions = [`title.ilike.%${term}%`, `content_id.ilike.%${term}%`];
      if (ids.length > 0) {
        conditions.push(`actress_ids.cs.{${ids.join(",")}}`);
      }
      return `or(${conditions.join(",")})`;
    });

    query = query.or(`and(${andParts.join(",")})`);
  }

  if (excludedTerms.length > 0) {
    excludedTerms.forEach((term, i) => {
      query = query.not("title", "ilike", `%${term}%`).not("content_id", "ilike", `%${term}%`);
      const ids = excludedActressIds[i];
      if (ids.length > 0) {
        query = query.not("actress_ids", "cs", `{${ids.join(",")}}`);
      }
    });
  }

  if (params.title) {
    query = query.ilike("title", `%${params.title}%`);
  }

  if (params.titleStartsWith) {
    query = query.ilike("title", `${params.titleStartsWith}%`);
  }

  if (params.soloOnly) {
    query = query.contains("genre_ids", [4025]);
  }

  if (params.dateFrom) {
    query = query.gte("date", params.dateFrom);
  }

  if (params.dateTo) {
    query = query.lte("date", params.dateTo);
  }

  if (params.excludeBest) {
    query = applyExcludeBest(query);
  }

  if (params.includeGenreIds?.length) {
    query = query.overlaps("genre_ids", params.includeGenreIds);
  }

  if (params.excludeGenreIds?.length) {
    query = query.not("genre_ids", "ov", `{${params.excludeGenreIds.join(",")}}`);
  }

  query = query.order("date", { ascending: false }).order("floor", { ascending: true }).order("content_id", { ascending: false });

  if (params.cursor) {
    let cursorDate: string;
    let cursorFloor: string;
    let cursorContentId: string;
    try {
      [cursorDate, cursorFloor, cursorContentId] = JSON.parse(params.cursor);
    } catch {
      throw new Error("無効なカーソルです。");
    }
    query = query.or(`date.lt.${cursorDate},` + `and(date.eq.${cursorDate},floor.gt.${cursorFloor}),` + `and(date.eq.${cursorDate},floor.eq.${cursorFloor},content_id.lt.${cursorContentId})`);
    query = query.limit(limit);
  } else {
    query = query.range(offset, offset + limit - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  const items = ((data as ProductRow[]) || []).map(toProduct);
  const hasMore = items.length === limit;
  const last = items[items.length - 1];
  const nextCursor = hasMore && last ? JSON.stringify([last.date, last.floor, last.contentId]) : null;
  return { data: items, nextCursor };
}

export async function getAllGenres(): Promise<Genre[]> {
  const PAGE_SIZE = 1000;
  let from = 0;
  const all: Genre[] = [];

  while (true) {
    const { data, error } = await supabase
      .from("genre")
      .select("*")
      .order("name")
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    all.push(...(data as GenreRow[]).map(toGenre));
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

export async function searchGenres(keyword: string): Promise<Genre[]> {
  const { data, error } = await supabase.from("genre").select("*").ilike("name", `%${keyword}%`).order("name").limit(100);

  if (error) throw error;
  return ((data as GenreRow[]) || []).map(toGenre);
}

export async function getGenreById(genreId: number): Promise<Genre | null> {
  const { data, error } = await supabase.from("genre").select("*").eq("genre_id", genreId).maybeSingle();
  if (error) return null;
  return data ? toGenre(data as GenreRow) : null;
}

export async function getProductsByGenreId(
  genreId: number,
  from: number = 0,
  to: number = 30,
  filters?: { vrOnly?: boolean; soloOnly?: boolean; excludeBest?: boolean; keyword?: string; includeGenreIds?: number[]; excludeGenreIds?: number[] },
): Promise<Product[]> {
  const today = new Date().toISOString().slice(0, 10);
  if (filters?.excludeBest && BEST_GENRE_IDS.includes(genreId)) return [];

  let query = supabase.from("product").select(PRODUCT_LIST_COLUMNS).contains("genre_ids", [genreId]).lte("date", today);

  if (filters?.keyword) {
    query = query.ilike("title", `%${filters.keyword}%`);
  }
  if (filters?.vrOnly) {
    query = query.ilike("title", "【VR】%");
  }
  if (filters?.soloOnly) {
    query = query.contains("genre_ids", [4025]);
  }
  if (filters?.includeGenreIds?.length) {
    query = query.or(`genre_ids.ov.{${filters.includeGenreIds.join(",")}}`);
  }
  if (filters?.excludeGenreIds?.length) {
    query = query.or(`genre_ids.not.ov.{${filters.excludeGenreIds.join(",")}}`);
  }
  if (filters?.excludeBest) {
    query = applyExcludeBest(query);
  }

  const { data, error } = await query
    .order("date", { ascending: false })
    .order("floor", { ascending: true })
    .range(from, from + to - 1);

  if (error) throw error;
  return ((data as ProductRow[]) || []).map(toProduct);
}

export async function searchActressesAdvanced(params: ActressSearchParams): Promise<{ data: Actress[] }> {
  const page = params.page || 1;
  const limit = params.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase.from("actress").select(ACTRESS_SEARCH_COLUMNS);

  if (params.name) {
    query = query.or(`name.ilike.%${params.name}%,ruby.ilike.%${params.name}%`);
  }

  if (params.cup) {
    query = query.eq("cup", params.cup);
  }

  if (params.birthdayFrom) {
    query = query.gte("birthday", params.birthdayFrom);
  }

  if (params.birthdayTo) {
    query = query.lte("birthday", params.birthdayTo);
  }

  if (params.bustFrom) {
    query = query.gte("bust", params.bustFrom);
  }

  if (params.bustTo) {
    query = query.lte("bust", params.bustTo);
  }

  if (params.waistFrom) {
    query = query.gte("waist", params.waistFrom);
  }

  if (params.waistTo) {
    query = query.lte("waist", params.waistTo);
  }

  if (params.hipFrom) {
    query = query.gte("hip", params.hipFrom);
  }

  if (params.hipTo) {
    query = query.lte("hip", params.hipTo);
  }

  if (params.heightFrom) {
    query = query.gte("height", params.heightFrom);
  }

  if (params.heightTo) {
    query = query.lte("height", params.heightTo);
  }

  if (params.prefecture) {
    query = query.eq("prefecture", params.prefecture);
  }

  query = query.order("count", { ascending: false, nullsFirst: false }).range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) throw error;
  return { data: ((data as ActressRow[]) || []).map(toActress) };
}
