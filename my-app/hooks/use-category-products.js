"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";

const INITIAL_VISIBLE_PRODUCTS = 24;
const LOAD_MORE_STEP = 24;

function shuffleProducts(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function useCategoryProducts(categoryName, selectedStores) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PRODUCTS);
  const queryCacheRef = useRef(new Map());

  const visibleProducts = useMemo(
    () => products.slice(0, visibleCount),
    [products, visibleCount]
  );

  useEffect(() => {
    let cancelled = false;
    const storesSnapshot = [...selectedStores];
    const cacheKey = `${categoryName}::${[...storesSnapshot].sort().join(",")}`;

    const fetchProducts = async () => {
      if (storesSnapshot.length === 0) {
        setProducts([]);
        setFetchError("");
        setLoading(false);
        return;
      }

      const cachedProducts = queryCacheRef.current.get(cacheKey);
      if (cachedProducts) {
        const preparedProducts =
          storesSnapshot.length > 1 ? shuffleProducts(cachedProducts) : cachedProducts;
        setProducts(preparedProducts);
        setFetchError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setFetchError("");

      try {
        const responses = await Promise.all(
          storesSnapshot.map((store) =>
            axios.get(`${API_BASE_URL}/products`, {
              params: { tables: store, category: categoryName },
            })
          )
        );

        const merged = responses.flatMap((response, index) => {
          const source = storesSnapshot[index];
          return response.data
            .filter((item) => item.image_url && item.name && item.price && item.image_url.trim() !== "")
            .map((item) => ({
              ...item,
              __source: source,
              __key: `${source}_${item.id ?? item.product_link ?? item.image_url}`,
            }));
        });

        if (!cancelled) {
          queryCacheRef.current.set(cacheKey, merged);

          if (queryCacheRef.current.size > 40) {
            const oldestKey = queryCacheRef.current.keys().next().value;
            queryCacheRef.current.delete(oldestKey);
          }

          const preparedProducts = storesSnapshot.length > 1 ? shuffleProducts(merged) : merged;
          setProducts(preparedProducts);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Feil ved henting av produkter:", error);
          setProducts([]);
          setFetchError("Vi fikk ikke hentet produkter akkurat nå. Prøv igjen.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [categoryName, selectedStores]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_PRODUCTS);
  }, [categoryName, selectedStores, products.length]);

  const loadMore = () => {
    setVisibleCount((current) => Math.min(current + LOAD_MORE_STEP, products.length));
  };

  return {
    products,
    visibleProducts,
    loading,
    fetchError,
    visibleCount,
    loadMore,
    hasMore: products.length > visibleCount,
  };
}
