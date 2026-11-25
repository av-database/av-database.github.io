"use client";

import { useEffect, useState } from "react";
import { getAllGenres, type Genre } from "../lib/supabase";

interface FilterToggleProps {
  includeGenreIds: number[];
  excludeGenreIds: number[];
  onToggleIncludeGenre?: (id: number) => void;
  onToggleExcludeGenre?: (id: number) => void;
  onApplyIncludeGenre?: (ids: number[]) => void;
  onApplyExcludeGenre?: (ids: number[]) => void;
}

const OFF_CLASS =
  "px-3 py-1.5 text-sm font-medium rounded-full border border-gray-300 bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40";
const ON_CLASS =
  "px-3 py-1.5 text-sm font-medium rounded-full border border-blue-600 bg-blue-600 text-white transition-colors shadow-sm hover:bg-blue-700 hover:border-blue-700 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40";

function GenreChip({ genre, active, onClick }: { genre: Genre; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`${active ? ON_CLASS : OFF_CLASS} shrink-0 whitespace-nowrap`}>
      {genre.name}
      {active && <span className="ml-1.5 text-xs font-bold leading-none">×</span>}
    </button>
  );
}

function CustomCheckbox({ checked, onClick = () => {} }: { checked: boolean; onClick?: () => void }) {
  return (
    <span
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " " ? onClick() : undefined)}
      className={`inline-flex shrink-0 cursor-pointer select-none items-center justify-center rounded border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 w-5 h-5 ${
        checked ? "bg-blue-600 border-blue-600" : "bg-white border-gray-300 hover:border-gray-400"
      }`}
    >
      {checked && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
    </span>
  );
}

function GenreModal({
  open,
  title,
  selectedIds,
  onSelect,
  onClose,
  onApply,
  genres,
  query,
  setQuery,
}: {
  open: boolean;
  title: string;
  selectedIds: Set<number>;
  onSelect: (id: number) => void;
  onClose: () => void;
  onApply: () => void;
  genres: Genre[];
  query: string;
  setQuery: (q: string) => void;
}) {
  if (!open) return null;
  const filtered = genres.filter((g) => g.name.includes(query));

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md max-h-[85vh] flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-bold text-lg">{title}</h3>
          </div>
          <div className="p-3">
            <input
              type="text"
              placeholder="ジャンルを検索"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none mb-2"
            />
            <div className="overflow-y-auto max-h-52 space-y-1.5 pb-2">
              {filtered.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">ジャンルが見つかりませんでした。</p>
              ) : (
                filtered.map((g) => (
                  <label
                    key={g.genreId}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelect(g.genreId);
                    }}
                    className="block cursor-pointer select-none"
                  >
                    <span className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50">
                      <CustomCheckbox checked={selectedIds.has(g.genreId)} />
                      <span className="text-sm text-gray-800">{g.name}</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
          <div className="p-3 border-t border-gray-100 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">
              キャンセル
            </button>
            <button type="button" onClick={onApply} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm">
              適用
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function FilterToggle({ includeGenreIds, excludeGenreIds, onToggleIncludeGenre, onToggleExcludeGenre, onApplyIncludeGenre, onApplyExcludeGenre }: FilterToggleProps) {
  const [genres, setGenres] = useState<Genre[]>([]);
  const [includeModal, setIncludeModal] = useState(false);
  const [excludeModal, setExcludeModal] = useState(false);
  const [includeSelection, setIncludeSelection] = useState<Set<number>>(new Set(includeGenreIds));
  const [excludeSelection, setExcludeSelection] = useState<Set<number>>(new Set(excludeGenreIds));
  const [includeQuery, setIncludeQuery] = useState("");
  const [excludeQuery, setExcludeQuery] = useState("");

  useEffect(() => {
    setIncludeSelection(new Set(includeGenreIds));
    setExcludeSelection(new Set(excludeGenreIds));
  }, [includeGenreIds, excludeGenreIds]);

  useEffect(() => {
    getAllGenres()
      .then(setGenres)
      .catch(() => setGenres([]));
  }, []);

  const includeChips = includeGenreIds.map((id) => {
    const g = genres.find((x) => x.genreId === id);
    if (!g) return null;
    return <GenreChip key={id} genre={g} active={includeGenreIds.includes(id)} onClick={() => onToggleIncludeGenre?.(id)} />;
  });

  const excludeChips = excludeGenreIds.map((id) => {
    const g = genres.find((x) => x.genreId === id);
    if (!g) return null;
    return <GenreChip key={id} genre={g} active={excludeGenreIds.includes(id)} onClick={() => onToggleExcludeGenre?.(id)} />;
  });

  const row = (label: string, chips: React.ReactNode, onAdd: () => void) => (
    <div className="flex items-center gap-2 min-w-0">
      <span className="shrink-0 text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      <div className="min-w-0 overflow-x-auto flex flex-nowrap gap-2 scrollbar-hide">{chips}</div>
      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-600 text-lg font-bold leading-none flex items-center justify-center hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
      >
        ＋
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {row("絞り込み", includeChips, () => setIncludeModal(true))}
      {row("除外", excludeChips, () => setExcludeModal(true))}

      <GenreModal
        open={includeModal}
        title="絞り込むジャンルを選択"
        selectedIds={includeSelection}
        onSelect={(id) => setIncludeSelection((prev) => (prev.has(id) ? new Set([...prev].filter((x) => x !== id)) : new Set([...prev, id])))}
        onClose={() => setIncludeModal(false)}
        onApply={() => {
          onApplyIncludeGenre?.(Array.from(includeSelection));
          setIncludeModal(false);
        }}
        genres={genres}
        query={includeQuery}
        setQuery={setIncludeQuery}
      />
      <GenreModal
        open={excludeModal}
        title="除外するジャンルを選択"
        selectedIds={excludeSelection}
        onSelect={(id) => setExcludeSelection((prev) => (prev.has(id) ? new Set([...prev].filter((x) => x !== id)) : new Set([...prev, id])))}
        onClose={() => setExcludeModal(false)}
        onApply={() => {
          onApplyExcludeGenre?.(Array.from(excludeSelection));
          setExcludeModal(false);
        }}
        genres={genres}
        query={excludeQuery}
        setQuery={setExcludeQuery}
      />
    </div>
  );
}
