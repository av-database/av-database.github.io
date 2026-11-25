import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
  toProduct,
  toGenre,
  toSeries,
  toMaker,
  toActress,
} from "./db-common";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {},
    },
  });
}

export type { Product, Genre, Series, Maker, Actress, ItemInfo };

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
  const supabase = await createClient();
  const { data, error } = await supabase.from("genre").select("genre_id,name").in("genre_id", ids);
  if (error) {
    console.error("getGenresByIds error:", error);
    throw error;
  }
  return ((data as GenreRow[]) || []).map(toGenre);
}

export async function getSeriesById(seriesId: number): Promise<Series | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("series").select("series_id,name").eq("series_id", seriesId).maybeSingle();
  if (error) {
    console.error("getSeriesById error:", error);
    return null;
  }
  return data ? toSeries(data as SeriesRow) : null;
}

export async function getMakerById(makerId: number): Promise<Maker | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("maker").select("maker_id,name").eq("maker_id", makerId).maybeSingle();
  if (error) {
    console.error("getMakerById error:", error);
    return null;
  }
  return data ? toMaker(data as MakerRow) : null;
}

export async function getActressesByIds(ids: number[]): Promise<Actress[]> {
  if (!ids || ids.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("actress")
    .select("actress_id,name,image_id,cup,bust,waist,hip,height,birthday,prefecture")
    .in("actress_id", ids);
  if (error) {
    console.error("getActressesByIds error:", error);
    throw error;
  }
  return ((data as ActressRow[]) || []).map(toActress);
}

export async function getActressById(actressId: number): Promise<Actress | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("actress")
    .select("actress_id,name,image_id,cup,bust,waist,hip,height,birthday,prefecture")
    .eq("actress_id", actressId)
    .single();
  if (error) {
    console.error("getActressById error:", error);
    return null;
  }
  return data ? toActress(data as ActressRow) : null;
}

export async function getGenreById(genreId: number): Promise<Genre | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("genre").select("genre_id,name").eq("genre_id", genreId).maybeSingle();
  if (error) {
    console.error("getGenreById error:", error);
    return null;
  }
  return data ? toGenre(data as GenreRow) : null;
}

export async function getProductById(contentId: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product")
    .select("content_id,title,volume,date,iteminfo,actress_ids,genre_ids,maker_id,series_id,sample_count,floor")
    .eq("content_id", contentId)
    .single();
  if (error) {
    console.error("getProductById error:", error);
    return null;
  }
  return data ? toProduct(data as ProductRow) : null;
}

export async function resolveMergedActressDisplay(actressId: number): Promise<{ actress: Actress | null; displayName: string }> {
  const actress = await getActressById(actressId);
  if (!actress) return { actress: null, displayName: "" };
  return { actress, displayName: actress.name };
}
