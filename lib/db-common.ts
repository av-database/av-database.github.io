export interface ItemInfoEntry {
  id?: number;
  name: string;
}

export interface ItemInfo {
  actress?: ItemInfoEntry[];
  genre?: ItemInfoEntry[];
  series?: ItemInfoEntry[];
  maker?: ItemInfoEntry[];
  director?: ItemInfoEntry[];
  label?: ItemInfoEntry[];
}

export interface ProductRow {
  content_id: string;
  title: string;
  volume?: string;
  date: string;
  iteminfo?: ItemInfo | string;
  actress_ids: number[] | null;
  genre_ids: number[] | null;
  maker_id?: number | null;
  series_id?: number | null;
  sample_count?: number;
  floor: string;
}

export interface GenreRow {
  genre_id: number;
  name: string;
}

export interface SeriesRow {
  series_id: number;
  name: string;
}

export interface MakerRow {
  maker_id: number;
  name: string;
}

export interface ActressRow {
  actress_id: number;
  name: string;
  ruby?: string | null;
  birthday?: string | null;
  cup?: string | null;
  bust?: number | null;
  waist?: number | null;
  hip?: number | null;
  height?: number | null;
  blood_type?: string | null;
  prefecture?: string | null;
  image_id?: string | null;
  created_at?: string;
  count?: number | null;
}

export interface Product {
  contentId: string;
  title: string;
  volume?: string;
  date: string;
  itemInfo?: ItemInfo | string;
  actressIds: number[] | null;
  genreIds: number[] | null;
  makerId: number | null;
  seriesId: number | null;
  sampleCount?: number;
  floor: string;
}

export interface Genre {
  genreId: number;
  name: string;
}

export interface Series {
  seriesId: number;
  name: string;
}

export interface Maker {
  makerId: number;
  name: string;
}

export interface Actress {
  actressId: number;
  name: string;
  ruby?: string | null;
  birthday?: string | null;
  cup?: string | null;
  bust?: number | null;
  waist?: number | null;
  hip?: number | null;
  height?: number | null;
  bloodType?: string | null;
  prefecture?: string | null;
  imageId?: string | null;
  createdAt?: string;
}

function toProduct(row: ProductRow): Product {
  return {
    contentId: row.content_id,
    title: row.title,
    volume: row.volume,
    date: row.date,
    itemInfo: row.iteminfo,
    actressIds: row.actress_ids,
    genreIds: row.genre_ids,
    makerId: row.maker_id ?? null,
    seriesId: row.series_id ?? null,
    sampleCount: row.sample_count,
    floor: row.floor,
  };
}

function toGenre(row: GenreRow): Genre {
  return { genreId: row.genre_id, name: row.name };
}

function toSeries(row: SeriesRow): Series {
  return { seriesId: row.series_id, name: row.name };
}

function toMaker(row: MakerRow): Maker {
  return { makerId: row.maker_id, name: row.name };
}

function toActress(row: ActressRow): Actress {
  return {
    actressId: row.actress_id,
    name: row.name,
    ruby: row.ruby,
    birthday: row.birthday,
    cup: row.cup,
    bust: row.bust,
    waist: row.waist,
    hip: row.hip,
    height: row.height,
    bloodType: row.blood_type,
    prefecture: row.prefecture,
    imageId: row.image_id,
    createdAt: row.created_at,
  };
}

export const PRODUCT_LIST_COLUMNS = "content_id,title,date,floor,genre_ids,actress_ids";

export const ACTRESS_SEARCH_COLUMNS = "actress_id,name,image_id,cup,bust,waist,hip,height,birthday,prefecture,count";

export const BEST_GENRE_IDS = [6003, 6608];
export const BEST_TITLE_PATTERNS = ["best", "ベスト", "総集編", "枚組", "福袋"];

type ExcludeBestBuilder = {
  or: (filters: string) => unknown;
  not: (column: string, operator: string, value: unknown) => unknown;
};

export function applyExcludeBest<T extends ExcludeBestBuilder>(query: T): T {
  query.or(`genre_ids.is.null,genre_ids.not.ov.{${BEST_GENRE_IDS.join(",")}}`);
  for (const pattern of BEST_TITLE_PATTERNS) {
    query.not("title", "ilike", `%${pattern}%`);
  }
  return query;
}

const DMM_AFFILIATE_ID = process.env.NEXT_PUBLIC_DMM_AFFILIATE_ID!;

function getFloorPath(floor: string): string {
  return floor === "c" ? "amateur" : "video";
}

export function getProductImageUrl(contentId: string, floor: string = "a"): string {
  const suffix = floor === "c" ? "jp" : "pl";
  return `https://pics.dmm.co.jp/digital/${getFloorPath(floor)}/${contentId}/${contentId}${suffix}.jpg`;
}

export function getActressImageUrl(imageId: string | null | undefined): string | null {
  if (!imageId) return null;
  if (imageId.startsWith("http")) return imageId;
  return `https://pics.dmm.co.jp/mono/actjpgs/${imageId}.jpg`;
}

export function getAffiliateUrl(contentId: string, floor: string = "a"): string {
  const path = floor === "c" ? "amateur" : "av";
  return `https://al.fanza.co.jp/?lurl=https%3A%2F%2Fvideo.dmm.co.jp%2F${path}%2Fcontent%2F%3Fid%3D${contentId}&af_id=${DMM_AFFILIATE_ID}&ch=api`;
}

export function getSampleImageUrl(contentId: string, index: number, floor: string = "a"): string {
  const padded = floor === "c" ? String(index).padStart(3, "0") : String(index);
  return `https://pics.dmm.co.jp/digital/${getFloorPath(floor)}/${contentId}/${contentId}jp-${padded}.jpg`;
}

export function getSampleImageUrls(contentId: string, count: number, floor: string = "a"): string[] {
  return Array.from({ length: count }, (_, i) => getSampleImageUrl(contentId, i + 1, floor));
}

function formatProductNumber(letters: string, digits: string, suffix: string = ""): string {
  const num = digits.replace(/^0+/, "") || "0";
  const padded = num.length <= 3 ? num.padStart(3, "0") : num;
  const sfx = suffix ? suffix.toUpperCase() : "";
  return `${letters}-${padded}${sfx}`;
}

export function contentIdToProductNumber(contentId: string): string | null {
  const special = contentId.match(/^13dsvr(\d+?)(?:re\d+)?([a-z])?$/i);
  if (special) {
    return formatProductNumber("3DSVR", special[1], special[2]);
  }
  let m = contentId.match(/^(\d+?)([a-z]+)(\d+?)(?:re\d+)?([a-z])?$/i);
  if (m) {
    return formatProductNumber(m[2].toUpperCase(), m[3], m[4]);
  }
  m = contentId.match(/^([a-z]+)(\d+?)(?:re\d+)?([a-z])?$/i);
  if (m) {
    return formatProductNumber(m[1].toUpperCase(), m[2], m[3]);
  }
  return null;
}

export interface ParsedSearchTerms {
  include: string[];
  exclude: string[];
}

const EXCLUDE_PREFIX = /^-(.+)$/;

export function splitSearchTerms(keyword: string): ParsedSearchTerms {
  const include: string[] = [];
  const exclude: string[] = [];

  for (const raw of keyword.replace(/[\s　]+/g, " ").split(" ")) {
    const term = raw.trim();
    if (!term) continue;
    const m = term.match(EXCLUDE_PREFIX);
    if (m) {
      exclude.push(m[1]);
    } else {
      include.push(term);
    }
  }

  return { include, exclude };
}

export interface ProductSearchParams {
  keyword?: string;
  title?: string;
  titleStartsWith?: string;
  dateFrom?: string;
  dateTo?: string;
  soloOnly?: boolean;
  excludeBest?: boolean;
  includeGenreIds?: number[];
  excludeGenreIds?: number[];
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface ActressSearchParams {
  name?: string;
  cup?: string;
  birthdayFrom?: string;
  birthdayTo?: string;
  bustFrom?: number;
  bustTo?: number;
  waistFrom?: number;
  waistTo?: number;
  hipFrom?: number;
  hipTo?: number;
  heightFrom?: number;
  heightTo?: number;
  prefecture?: string;
  page?: number;
  limit?: number;
}

export { toProduct, toGenre, toSeries, toMaker, toActress };
