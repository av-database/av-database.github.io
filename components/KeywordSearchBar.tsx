"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchSuggestions } from "../hooks/useSearchSuggestions";

interface KeywordSearchBarProps {
  keyword: string;
  placeholder?: string;
  isSearching?: boolean;
  onSearch?: (keyword: string) => void;
}

const DEFAULT_PLACEHOLDER = "スペース区切りでAND検索（品番・タイトル）／-で除外（例: a -b）";
const MAX_SUGGESTIONS = 5;

export default function KeywordSearchBar({ keyword, placeholder = DEFAULT_PLACEHOLDER, isSearching = false, onSearch }: KeywordSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(keyword);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { history, add, remove } = useSearchSuggestions();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(keyword);
  }, [keyword]);

  const filtered = history.filter((h) => h.includes(query)).slice(0, MAX_SUGGESTIONS);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = (e.currentTarget as HTMLFormElement).elements.namedItem("keyword") as HTMLInputElement;
    const value = input.value.trim();
    if (!value) return;
    setShowSuggestions(false);
    inputRef.current?.blur();
    add(value);
    if (onSearch) {
      onSearch(value);
    } else {
      router.push(`${pathname}?keyword=${encodeURIComponent(value)}`);
    }
  };

  const handleSelect = useCallback(
    (item: string) => {
      setQuery(item);
      setShowSuggestions(false);
      add(item);
      if (onSearch) {
        onSearch(item);
      } else {
        router.push(`${pathname}?keyword=${encodeURIComponent(item)}`);
      }
    },
    [add, onSearch, router, pathname]
  );

  const handleRemove = useCallback(
    (e: React.MouseEvent, item: string) => {
      e.stopPropagation();
      remove(item);
    },
    [remove]
  );

  return (
    <form onSubmit={handleSubmit} className="bg-gray-50 border rounded-lg p-4 mb-6">
      <div className="relative">
        <input
          ref={inputRef}
          name="keyword"
          type="text"
          autoComplete="off"
          placeholder={placeholder}
          value={query}
          className="border rounded px-3 py-2 text-sm w-full"
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(history.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        {showSuggestions && filtered.length > 0 && (
          <div className="absolute z-10 mt-1 w-full border border-gray-200 rounded-t-none rounded-b-lg bg-white shadow-lg max-h-60 overflow-y-auto">
            {filtered.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleSelect(item)}
                  className="flex-1 min-w-0 text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors"
                >
                  <span className="block truncate">{item}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, item)}
                  aria-label="削除"
                  className="px-2 py-2 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-3">
        <button type="submit" disabled={isSearching} className={`px-4 py-2 text-sm rounded transition-colors ${isSearching ? "bg-gray-400 text-gray-200 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
          {isSearching ? "検索中…" : "検索"}
        </button>
        <button type="button" onClick={() => router.push(pathname)} className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors">
          リセット
        </button>
      </div>
    </form>
  );
}
