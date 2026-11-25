"use client";

import { useCallback } from "react";
import { Product, ProductWithActresses } from "../lib/supabase";
import { useProductList } from "./useProductList";

type EntityResult = { entity: unknown; displayName: string } | null;

type EntityFetchOptions = {
  vrOnly?: boolean;
  soloOnly?: boolean;
  excludeBest?: boolean;
  keyword?: string;
  includeGenreIds?: number[];
  excludeGenreIds?: number[];
};

type EntityProductListOptions = {
  id: string;
  entityId: number;
  fetchEntity: (id: number) => Promise<EntityResult>;
  fetchProducts: (id: number, offset: number, pageSize: number, filters?: EntityFetchOptions) => Promise<Product[]>;
  matchProduct: (p: Product, entityId: number) => boolean;
  pageSize?: number;
  initialProducts?: ProductWithActresses[];
  initialHasMore?: boolean;
  initialEntity?: unknown;
  initialDisplayName?: string;
};

export function useEntityProductList({ id, entityId, fetchEntity, fetchProducts, matchProduct, pageSize = 12, initialProducts, initialHasMore, initialEntity, initialDisplayName }: EntityProductListOptions) {
  const fetchPage = useCallback(
    async (filters?: { vrOnly?: boolean; soloOnly?: boolean; excludeBest?: boolean; keyword?: string; includeGenreIds?: number[]; excludeGenreIds?: number[]; offset?: number }) => {
      const [entityResult, productsData] = await Promise.all([
        fetchEntity(entityId),
        fetchProducts(entityId, filters?.offset ?? 0, pageSize, {
          vrOnly: filters?.vrOnly,
          soloOnly: filters?.soloOnly,
          excludeBest: filters?.excludeBest,
          keyword: filters?.keyword,
          includeGenreIds: filters?.includeGenreIds,
          excludeGenreIds: filters?.excludeGenreIds,
        }),
      ]);
      return {
        items: productsData,
        hasMore: productsData.length >= pageSize,
        entity: entityResult?.entity ?? null,
        displayName: entityResult?.displayName ?? "",
      };
    },
    [entityId, fetchEntity, fetchProducts, pageSize],
  );

  const initialData = initialProducts !== undefined
    ? {
        products: initialProducts,
        hasMore: initialHasMore ?? false,
        entity: initialEntity ?? null,
        displayName: initialDisplayName ?? "",
      }
    : undefined;

  return useProductList({
    entityId: id,
    fetchPage,
    pageSize,
    matchProduct: (p) => matchProduct(p, entityId),
    initialData,
  });
}
