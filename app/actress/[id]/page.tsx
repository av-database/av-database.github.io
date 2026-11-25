import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCachedActress, getCachedActressProducts } from "../../../lib/cached-actress";
import ActressPage from "./actress-view";

type Props = { params: Promise<{ id: string }> };

export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const { actress, displayName } = await getCachedActress(Number(id));
    if (!actress) return {};
    return { title: `${displayName}のAV一覧`, description: `${displayName}のAV出演作品一覧。プロフィール・カップ・スリーサイズ・誕生日などを掲載。` };
  } catch {
    return {};
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const actressId = Number(id);
  const { actress, displayName } = await getCachedActress(actressId);
  if (!actress) notFound();
  const { products, hasMore } = await getCachedActressProducts(actressId);
  return <ActressPage id={id} initialProducts={products} initialHasMore={hasMore} initialEntity={actress} initialDisplayName={displayName} />;
}
