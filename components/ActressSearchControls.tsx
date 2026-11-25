"use client";

import { useRouter } from "next/navigation";

interface ActressFilters {
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
}

interface ActressSearchControlsProps {
  filters: ActressFilters;
}

export default function ActressSearchControls({ filters }: ActressSearchControlsProps) {
  const router = useRouter();
  const { showAdvanced } = filters;

  const handleToggle = () => {
    const next = !showAdvanced;
    const sp = new URLSearchParams();
    if (filters.name) sp.set("name", filters.name);
    if (filters.cup) sp.set("cup", filters.cup);
    if (filters.prefecture) sp.set("prefecture", filters.prefecture);
    if (filters.birthdayFrom) sp.set("birthdayFrom", filters.birthdayFrom);
    if (filters.birthdayTo) sp.set("birthdayTo", filters.birthdayTo);
    if (filters.bustFrom) sp.set("bustFrom", filters.bustFrom);
    if (filters.bustTo) sp.set("bustTo", filters.bustTo);
    if (filters.waistFrom) sp.set("waistFrom", filters.waistFrom);
    if (filters.waistTo) sp.set("waistTo", filters.waistTo);
    if (filters.hipFrom) sp.set("hipFrom", filters.hipFrom);
    if (filters.hipTo) sp.set("hipTo", filters.hipTo);
    if (filters.heightFrom) sp.set("heightFrom", filters.heightFrom);
    if (filters.heightTo) sp.set("heightTo", filters.heightTo);
    sp.set("showAdvanced", String(next));
    sp.set("page", "1");
    router.push(`/actress/search?${sp.toString()}`);
  };

  const handleReset = () => {
    router.push("/actress/search");
  };

  return (
    <>
      <div>
        <button
          type="button"
          onClick={handleToggle}
          className="text-sm text-blue-600 hover:underline"
        >
          {showAdvanced ? "▼ 高級フィルタを閉じる" : "▶ 高級フィルタを開く"}
        </button>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={handleReset} className="px-6 py-2 border rounded-lg hover:bg-gray-50 text-sm">
          リセット
        </button>
      </div>
    </>
  );
}
