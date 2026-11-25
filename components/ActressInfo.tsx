"use client";

import React from "react";
import Image from "next/image";
import { getActressImageUrl } from "../lib/db-common";
import type { Actress } from "../lib/supabase";

interface ActressInfoProps {
  actress: Actress | null;
  displayName: string;
  loading?: boolean;
}

export default function ActressInfo({ actress, displayName, loading = false }: ActressInfoProps) {
  if (!actress) {
    if (!loading) return null;

    return (
      <section className="mb-6 min-h-[190px]">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-40 h-40 bg-gray-200 rounded-lg animate-pulse" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-1/3 bg-gray-200 rounded animate-pulse" />
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <React.Fragment key={i}>
                  <dt className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                  <dd className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </React.Fragment>
              ))}
            </dl>
          </div>
        </div>
      </section>
    );
  }

  const imageUrl = getActressImageUrl(actress.imageId);
  const name = displayName || actress.name;

  return (
    <section className="mb-6 min-h-[190px]">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {imageUrl && (
          <div className="w-40 h-40 relative rounded-lg overflow-hidden bg-gray-100">
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(max-width: 768px) 40vw, 10rem"
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold mb-1">{name}</h2>
          {actress.ruby && (
            <p className="text-sm text-gray-500 mb-4">{actress.ruby}</p>
          )}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-sm">
            {actress.birthday && (
              <>
                <dt className="text-gray-500">誕生日</dt>
                <dd className="font-medium">{actress.birthday}</dd>
              </>
            )}
            {actress.cup && (
              <>
                <dt className="text-gray-500">カップ</dt>
                <dd className="font-medium">{actress.cup}</dd>
              </>
            )}
            {(actress.bust || actress.waist || actress.hip) && (
              <>
                <dt className="text-gray-500">サイズ</dt>
                <dd className="font-medium">
                  {actress.bust}/{actress.waist}/{actress.hip}
                </dd>
              </>
            )}
            {actress.height && (
              <>
                <dt className="text-gray-500">身長</dt>
                <dd className="font-medium">{actress.height}cm</dd>
              </>
            )}
            {actress.bloodType && (
              <>
                <dt className="text-gray-500">血液型</dt>
                <dd className="font-medium">{actress.bloodType}</dd>
              </>
            )}
            {actress.prefecture && (
              <>
                <dt className="text-gray-500">出身地</dt>
                <dd className="font-medium">{actress.prefecture}</dd>
              </>
            )}
          </dl>
        </div>
      </div>
    </section>
  );
}
