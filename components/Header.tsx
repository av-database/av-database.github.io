"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { requestNavReset } from "../lib/nav-reset";

const NAV_ITEMS = [
  { href: "/home", label: "作品一覧" },
  { href: "/genre/search", label: "ジャンル一覧" },
  { href: "/actress/search", label: "女優検索" },
];

// 修飾キー付きクリック（新しいタブなど）は通常の遷移ではないためリセット対象外にする。
function isPlainLeftClick(e: React.MouseEvent): boolean {
  return !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (navRef.current?.parentElement?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const barClass = "absolute left-0 h-0.5 w-full bg-gray-700 transition-all duration-200";

  return (
    <header className="sticky top-0 z-50 border-b-2 border-gray-200 bg-white">
      <div className="relative mx-auto flex w-full max-w-5xl items-center gap-3 px-3 py-2">
        <button
          type="button"
          aria-label={open ? "メニューを閉じる" : "メニューを開く"}
          aria-expanded={open}
          aria-controls="global-nav"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded border border-gray-300 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/40"
        >
          <span className="relative block h-4 w-5" aria-hidden="true">
            <span className={`${barClass} ${open ? "top-[7px] rotate-45" : "top-0"}`} />
            <span className={`${barClass} ${open ? "top-[7px] opacity-0" : "top-[7px]"}`} />
            <span className={`${barClass} ${open ? "top-[7px] -rotate-45" : "top-[14px]"}`} />
          </span>
        </button>

        <Link
          href="/home"
          onClick={(e) => {
            if (isPlainLeftClick(e)) requestNavReset("/home");
            setOpen(false);
          }}
          className="text-xl font-bold tracking-wide text-gray-900 hover:text-blue-600"
        >
          AVDB
        </Link>
      </div>

      <nav id="global-nav" ref={navRef} hidden={!open} className="absolute left-0 top-full w-full border-b border-gray-200 bg-white shadow-lg">
        <ul className="mx-auto w-full max-w-5xl px-3 py-2">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={(e) => {
                  if (isPlainLeftClick(e)) requestNavReset(item.href);
                  setOpen(false);
                }}
                className={`block rounded px-3 py-2 text-sm transition-colors hover:bg-blue-50 ${pathname === item.href ? "font-medium text-blue-600" : "text-gray-700"}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
