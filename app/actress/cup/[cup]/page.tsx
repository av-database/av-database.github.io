import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CupActressListView from "./cup-view";

type Props = { params: Promise<{ cup: string }> };

export const instant = false;

const CUP_PATTERN = /^(?:AA|[A-M])\+{0,2}$/;

function normalizeCup(raw: string): string | null {
  const cup = raw.toUpperCase();
  return CUP_PATTERN.test(cup) ? cup : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cup } = await params;
  const normalized = normalizeCup(cup);
  if (!normalized) return {};
  return { title: `${normalized}カップの女優一覧` };
}

export default async function Page({ params }: Props) {
  const { cup } = await params;
  const normalized = normalizeCup(cup);
  if (!normalized) notFound();
  return <CupActressListView cup={normalized} />;
}
