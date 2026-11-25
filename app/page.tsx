"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const AGE_COOKIE = "avdb_age_verified";

export default function AgeGatePage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    const verified = document.cookie
      .split(";")
      .some((c) => c.trim().startsWith(`${AGE_COOKIE}=`));
    if (verified) {
      void router.replace("/home");
    }
  }, [router]);

  const handleEnter = () => {
    try {
      document.cookie = `${AGE_COOKIE}=1; path=/; max-age=31536000; SameSite=Lax`;
      setError(false);
      void router.push("/home");
    } catch {
      setError(true);
    }
  };

  const handleLeave = () => {
    setError(false);
  };

  return (
    <main className="flex min-h-[calc(100vh-54px)] items-center justify-center bg-gray-100 px-4">
      <div className="max-w-xs w-full text-center">
        <h1 className="text-2xl font-bold mb-4">年齢確認</h1>
        <p className="text-gray-600 mb-6">
          このサイトはアダルトコンテンツを含みます。<br />
          18歳以上ですか？
        </p>
        {error && (
          <p className="text-red-600 text-sm mb-4">
            入場処理に失敗しました。もう一度お試しください。
          </p>
        )}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleEnter}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            はい、18歳以上です
          </button>
          <button
            type="button"
            onClick={handleLeave}
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            いいえ、18歳未満です
          </button>
        </div>

        <div className="mt-6 text-center">
          <a href="https://affiliate.dmm.com/api/" target="_blank" rel="noopener noreferrer" className="inline-block">
            <img src="https://p.dmm.co.jp/p/affiliate/web_service/r18_135_17.gif" width="135" height="17" alt="WEB SERVICE BY FANZA" />
          </a>
        </div>
      </div>
    </main>
  );
}
