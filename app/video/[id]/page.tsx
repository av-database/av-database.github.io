import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductById, resolveMergedActressesDisplay } from "../../../lib/supabase-server";
import { contentIdToProductNumber } from "../../../lib/db-common";
import VideoPage from "./video-view";

type Props = { params: Promise<{ id: string }> };

export const instant = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const product = await getProductById(id);
    if (!product) return {};
    const actressMap = await resolveMergedActressesDisplay(product.actressIds || []);
    const actressNames = (product.actressIds || []).map((aid) => actressMap.get(aid)?.displayName).filter(Boolean);
    const actressPart = actressNames.length > 0 ? "出演：" + actressNames.join("・") + " " : "";
    const description = actressPart ? `${actressPart} ${product.title}` : product.title;
    const productNumber = contentIdToProductNumber(product.contentId);
    const titlePrefix = productNumber ? `【${productNumber}】` : "";
    return {
      title: `${titlePrefix}${product.title}`,
      description: description,
    };
  } catch {
    return {};
  }
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  return <VideoPage contentId={id} />;
}
