"use client";

import Link from "next/link";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { getActressImageUrl } from "../lib/supabase";
import { EnrichedActress } from "../lib/actress-search";
import SkeletonGrid, { SkeletonItems } from "./SkeletonGrid";

const emptySubscribe = () => () => {};

function calcAge(birthday: string): number | null {
  const match = birthday.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = match[3] ? Number(match[3]) : 1;
  const today = new Date();
  let age = today.getFullYear() - year;
  const monthDiff = today.getMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < day)) age--;
  return age;
}

function formatBirthday(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}年${Number(month)}月${Number(day)}日`;
  }
  const ymMatch = value.match(/^(\d{4})-(\d{2})$/);
  if (ymMatch) {
    const [, year, month] = ymMatch;
    return `${year}年${Number(month)}月`;
  }
  return value;
}

function Age({ birthday }: { birthday: string }) {
  const age = useSyncExternalStore(emptySubscribe, () => calcAge(birthday), () => null);
  return age === null ? null : <>（{age}歳）</>;
}

type ActressGridFilters = {
  name?: string;
  cup?: string;
  prefecture?: string;
  birthdayFrom?: string;
  birthdayTo?: string;
  bustFrom?: string;
  bustTo?: string;
  waistFrom?: string;
  waistTo?: string;
  hipFrom?: string;
  hipTo?: string;
  heightFrom?: string;
  heightTo?: string;
  showAdvanced?: boolean;
  page?: string;
};

interface ActressResultsGridProps {
  results: EnrichedActress[];
  hasMore?: boolean;
  page: number;
  filters: ActressGridFilters;
  baseUrl?: string;
  emptyMessage?: string;
  loading?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

function buildUrl(baseUrl: string, filters: ActressGridFilters, page: number): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === "" || value === false || value === undefined || value === null) continue;
    sp.set(key, String(value));
  }
  sp.set("page", String(page));
  return `${baseUrl}?${sp.toString()}`;
}

export default function ActressResultsGrid({
  results,
  hasMore = false,
  page = 1,
  filters,
  baseUrl = "/actress/search",
  emptyMessage = "該当する女優は見つかりませんでした。",
  loading = false,
  loadingMore = false,
  onLoadMore,
}: ActressResultsGridProps) {
  if (loading && results.length === 0) {
    return <SkeletonGrid variant="actress" />;
  }

  if (results.length === 0) {
    return <p className="text-gray-500">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4 relative">
        {results.map((actress, index) => (
          <Link key={actress.actressId} href={`/actress/${actress.actressId}`} className="block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            {getActressImageUrl(actress.imageId) ? (
              <div className="relative w-full aspect-square bg-gray-100">
                <Image src={getActressImageUrl(actress.imageId)!} alt={actress.displayName} fill sizes="(max-width: 1023px) 33vw, 16vw" className="object-cover" priority={index === 0} loading={index < 6 ? "eager" : "lazy"} />
              </div>
            ) : (
              <div className="w-full aspect-square bg-gray-200 flex items-center justify-center text-gray-400 text-sm">画像なし</div>
            )}
            <div className="p-3">
              <h2 className="font-semibold text-sm">{actress.displayName}</h2>
              <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                {actress.cup && <p>カップ：{actress.cup}</p>}
                {actress.bust && (
                  <p>
                    B{actress.bust} W{actress.waist} H{actress.hip}
                  </p>
                )}
                {actress.birthday && (
                  <p>
                    誕生日：{formatBirthday(actress.birthday)}
                    <Age birthday={actress.birthday} />
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {loadingMore && <SkeletonItems variant="actress" count={12} />}

      {hasMore && !loadingMore && (
        <div className="flex justify-center mt-8">
          {onLoadMore ? (
            <button onClick={onLoadMore} className="px-6 py-3 border rounded-lg hover:bg-gray-50">
              もっと見る
            </button>
          ) : (
            <a href={buildUrl(baseUrl, filters, page + 1)} className="px-6 py-3 border rounded-lg hover:bg-gray-50">
              もっと見る
            </a>
          )}
        </div>
      )}
    </>
  );
}
