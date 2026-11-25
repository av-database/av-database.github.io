import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getGenreById } from "../../../lib/supabase-server";
import GenrePage from "./genre-view";

type Props = { params: Promise<{ id: string }> };

export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id: genreId } = await params;
  const id = Number(genreId);
  if (!Number.isFinite(id)) return {};
  try {
    const genre = await getGenreById(id);
    if (!genre?.name) return {};
    return { title: `「${genre.name}」の動画一覧`, description: `「${genre.name}」ジャンルのAV作品一覧。このジャンルの作品を探せます。` };
  } catch {
    return {};
  }
}

export default async function Page({ params }: Props) {
  const { id: genreId } = await params;
  const id = Number(genreId);
  if (!Number.isFinite(id)) notFound();
  const genre = await getGenreById(id);
  if (!genre) notFound();
  return <GenrePage id={genreId} />;
}
