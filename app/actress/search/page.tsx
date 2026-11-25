import { getCachedActressSearch } from "../../../lib/cached-actress-search";
import type { searchActressesAdvanced } from "../../../lib/supabase";
import { ACTRESS_PAGE_SIZE, EnrichedActress, actressCacheKey } from "../../../lib/actress-search";
import ActressSearchClient from "../../../components/ActressSearchClient";
import ActressSearchControls from "../../../components/ActressSearchControls";

export const instant = false;

const CUP_OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"];
const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

type ActressFilters = {
  name: string;
  cup: string;
  prefecture: string;
  birthdayFrom: string;
  birthdayTo: string;
  bustFrom: string;
  bustTo: string;
  waistFrom: string;
  waistTo: string;
  hipFrom: string;
  hipTo: string;
  heightFrom: string;
  heightTo: string;
  showAdvanced: boolean;
  page: string;
};

function readFiltersFromSearchParams(params: { [key: string]: string | string[] | undefined }): ActressFilters {
  const sp = Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])) as Record<string, string>;
  return {
    name: sp.name ?? "",
    cup: sp.cup ?? "",
    prefecture: sp.prefecture ?? "",
    birthdayFrom: sp.birthdayFrom ?? "",
    birthdayTo: sp.birthdayTo ?? "",
    bustFrom: sp.bustFrom ?? "",
    bustTo: sp.bustTo ?? "",
    waistFrom: sp.waistFrom ?? "",
    waistTo: sp.waistTo ?? "",
    hipFrom: sp.hipFrom ?? "",
    hipTo: sp.hipTo ?? "",
    heightFrom: sp.heightFrom ?? "",
    heightTo: sp.heightTo ?? "",
    showAdvanced: sp.showAdvanced === "1",
    page: sp.page ?? "1",
  };
}

export default async function ActressSearchPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const rawParams = await searchParams;
  const f = readFiltersFromSearchParams(rawParams);
  const page = Number(f.page) || 1;
  const limit = ACTRESS_PAGE_SIZE;

  const searchParamsObj: Parameters<typeof searchActressesAdvanced>[0] = { page, limit };
  if (f.name.trim()) searchParamsObj.name = f.name.trim();
  if (f.cup) searchParamsObj.cup = f.cup;
  if (f.birthdayFrom) searchParamsObj.birthdayFrom = f.birthdayFrom;
  if (f.birthdayTo) searchParamsObj.birthdayTo = f.birthdayTo;
  if (f.bustFrom) searchParamsObj.bustFrom = Number(f.bustFrom);
  if (f.bustTo) searchParamsObj.bustTo = Number(f.bustTo);
  if (f.waistFrom) searchParamsObj.waistFrom = Number(f.waistFrom);
  if (f.waistTo) searchParamsObj.waistTo = Number(f.waistTo);
  if (f.hipFrom) searchParamsObj.hipFrom = Number(f.hipFrom);
  if (f.hipTo) searchParamsObj.hipTo = Number(f.hipTo);
  if (f.heightFrom) searchParamsObj.heightFrom = Number(f.heightFrom);
  if (f.heightTo) searchParamsObj.heightTo = Number(f.heightTo);
  if (f.prefecture) searchParamsObj.prefecture = f.prefecture;

  const hasAnyFilter = Boolean(f.name || f.cup || f.prefecture || f.birthdayFrom || f.birthdayTo || f.bustFrom || f.bustTo || f.waistFrom || f.waistTo || f.hipFrom || f.hipTo || f.heightFrom || f.heightTo);

  let results: EnrichedActress[] = [];
  let hasMore = false;

  if (hasAnyFilter) {
    const cached = await getCachedActressSearch(searchParamsObj);
    results = cached.results;
    hasMore = cached.hasMore;
  }

  return (
    <main className="max-w-5xl mx-auto w-full p-3">
      <h1 className="text-2xl font-bold border-b-2 pb-2 mb-6">女優検索</h1>

      <form method="get" className="space-y-4 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="actress-name" className="block text-sm font-medium text-gray-700 mb-1">名前</label>
            <input id="actress-name" name="name" type="text" defaultValue={f.name} placeholder="名前で検索..." className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor="actress-cup" className="block text-sm font-medium text-gray-700 mb-1">カップ</label>
          <select id="actress-cup" name="cup" defaultValue={f.cup} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">指定なし</option>
            {CUP_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          </div>
          <div>
            <label htmlFor="actress-prefecture" className="block text-sm font-medium text-gray-700 mb-1">出身地</label>
          <select id="actress-prefecture" name="prefecture" defaultValue={f.prefecture} className="w-full border rounded-lg px-3 py-2 text-sm">
            <option value="">指定なし</option>
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          </div>
        </div>

        <ActressSearchControls filters={f} />

        {f.showAdvanced && (
          <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">誕生日</label>
              <div className="flex items-center gap-2">
                <label htmlFor="actress-birthday-from" className="sr-only">誕生日 開始</label>
                <input id="actress-birthday-from" name="birthdayFrom" type="date" defaultValue={f.birthdayFrom} className="border rounded-lg px-3 py-2 text-sm" />
                <span className="text-gray-500">〜</span>
                <label htmlFor="actress-birthday-to" className="sr-only">誕生日 終了</label>
                <input id="actress-birthday-to" name="birthdayTo" type="date" defaultValue={f.birthdayTo} className="border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="actress-bust-from" className="block text-sm font-medium text-gray-700 mb-1">バスト (cm)</label>
                <div className="flex items-center gap-2">
                  <label htmlFor="actress-bust-from-input" className="sr-only">バスト 開始</label>
                  <input id="actress-bust-from-input" name="bustFrom" type="number" defaultValue={f.bustFrom} placeholder="〜" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  <span className="text-gray-500">〜</span>
                  <label htmlFor="actress-bust-to-input" className="sr-only">バスト 終了</label>
                  <input id="actress-bust-to-input" name="bustTo" type="number" defaultValue={f.bustTo} placeholder="〜" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="actress-waist-from" className="block text-sm font-medium text-gray-700 mb-1">ウエスト (cm)</label>
                <div className="flex items-center gap-2">
                  <label htmlFor="actress-waist-from-input" className="sr-only">ウエスト 開始</label>
                  <input id="actress-waist-from-input" name="waistFrom" type="number" defaultValue={f.waistFrom} placeholder="〜" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  <span className="text-gray-500">〜</span>
                  <label htmlFor="actress-waist-to-input" className="sr-only">ウエスト 終了</label>
                  <input id="actress-waist-to-input" name="waistTo" type="number" defaultValue={f.waistTo} placeholder="〜" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="actress-hip-from" className="block text-sm font-medium text-gray-700 mb-1">ヒップ (cm)</label>
                <div className="flex items-center gap-2">
                  <label htmlFor="actress-hip-from-input" className="sr-only">ヒップ 開始</label>
                  <input id="actress-hip-from-input" name="hipFrom" type="number" defaultValue={f.hipFrom} placeholder="〜" className="w-full border rounded-lg px-3 py-2 text-sm" />
                  <span className="text-gray-500">〜</span>
                  <label htmlFor="actress-hip-to-input" className="sr-only">ヒップ 終了</label>
                  <input id="actress-hip-to-input" name="hipTo" type="number" defaultValue={f.hipTo} placeholder="〜" className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="actress-height-from" className="block text-sm font-medium text-gray-700 mb-1">身長 (cm)</label>
              <div className="flex items-center gap-2 max-w-xs">
                <label htmlFor="actress-height-from-input" className="sr-only">身長 開始</label>
                <input id="actress-height-from-input" name="heightFrom" type="number" defaultValue={f.heightFrom} placeholder="〜" className="w-full border rounded-lg px-3 py-2 text-sm" />
                <span className="text-gray-500">〜</span>
                <label htmlFor="actress-height-to-input" className="sr-only">身長 終了</label>
                <input id="actress-height-to-input" name="heightTo" type="number" defaultValue={f.heightTo} placeholder="〜" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            検索
          </button>
        </div>
      </form>

      <ActressSearchClient
        key={actressCacheKey(f)}
        initialResults={results}
        initialHasMore={hasMore}
        initialPage={page}
        filters={f}
      />
    </main>
  );
}
