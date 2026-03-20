"use client";

import { useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { useStoreFilters } from "@/lib/store-filter-context";
import { STORE_LABELS } from "@/lib/constants";
import { formatPrice } from "@/lib/format";
import { useCategoryProducts } from "@/hooks/use-category-products";
import { CategorySheet } from "@/components/navigation/category-sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function openProduct(product) {
  if (!product.product_link) {
    return;
  }
  window.open(product.product_link, "_blank", "noopener,noreferrer");
}

function handleProductKeyDown(event, product) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openProduct(product);
  }
}

export function CategoryExperience({ categoryName, categories }) {
  const { selectedStores } = useStoreFilters();
  const { products, visibleProducts, loading, fetchError, visibleCount, loadMore, hasMore } =
    useCategoryProducts(categoryName, selectedStores);

  const activeStoreNames = useMemo(
    () => selectedStores.map((store) => STORE_LABELS[store] ?? store),
    [selectedStores]
  );

  const activeStoresLabel = useMemo(() => {
    if (selectedStores.length === 0) {
      return "Ingen butikker valgt";
    }
    return activeStoreNames.join(" / ");
  }, [activeStoreNames, selectedStores.length]);

  return (
    <div className="space-y-8 pb-8 md:space-y-10 md:pb-12">
      <section className="rounded-[1.15rem] border border-[#d9cec1] bg-[linear-gradient(160deg,#faf7f2_0%,#f3ede4_100%)] px-4 py-4 shadow-[0_10px_24px_rgba(56,44,30,0.08)] md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[0.62rem] uppercase tracking-[0.22em] text-[#7b6f62]">Resultater</p>
            <h1 className="font-display text-[1.7rem] leading-[0.95] text-[#2a241f] md:text-[2rem]">
              {categoryName}
            </h1>
            <p className="max-w-xl text-sm text-[#655e54]">
              Velg butikker i filterlinjen over. Resultatene oppdateres automatisk med samme kategori og valgte butikker.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CategorySheet categories={categories} currentCategory={categoryName} />
            <span className="inline-flex rounded-full border border-[#ccbca8] bg-[#f5ede2] px-3 py-1.5 text-[0.72rem] font-semibold text-[#584c3f]">
              {loading ? "Laster..." : `${products.length} produkter`}
            </span>
          </div>
        </div>

        <div className="mt-3 h-px w-full bg-[#e0d7cb]" />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {activeStoreNames.length > 0 ? (
            activeStoreNames.map((storeName) => (
              <span
                key={storeName}
                className="rounded-md border border-[#d2c4b3] bg-[#f6f0e7] px-2.5 py-1 text-[0.68rem] font-medium text-[#5d5347]"
              >
                {storeName}
              </span>
            ))
          ) : (
            <span className="rounded-md border border-[#d2c4b3] bg-[#f6f0e7] px-2.5 py-1 text-[0.68rem] font-medium text-[#5d5347]">
              {activeStoresLabel}
            </span>
          )}
        </div>
      </section>

      {selectedStores.length === 0 && (
        <StatePanel
          title="Velg minst en butikk"
          text="Aktiver butikkene i filterlinjen for å hente produkter i denne kategorien."
        />
      )}

      {selectedStores.length > 0 && loading && <ProductSkeletonGrid />}

      {selectedStores.length > 0 && !loading && fetchError && (
        <StatePanel title="Feil ved lasting" text={fetchError} tone="error" />
      )}

      {selectedStores.length > 0 && !loading && !fetchError && products.length === 0 && (
        <StatePanel title="Ingen treff" text="Bytt butikk eller kategori." tone="muted" />
      )}

      {selectedStores.length > 0 && !loading && products.length > 0 && (
        <>
          <section className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product, index) => {
              const isLead = index === 0;
              return (
                <article
                  key={product.__key}
                  className={cn(
                    "group cursor-default",
                    isLead && "xl:col-span-2 xl:grid xl:grid-cols-[1.35fr_1fr] xl:items-end xl:gap-8"
                  )}
                  onClick={product.product_link ? () => openProduct(product) : undefined}
                  onKeyDown={product.product_link ? (event) => handleProductKeyDown(event, product) : undefined}
                  role={product.product_link ? "button" : undefined}
                  tabIndex={product.product_link ? 0 : undefined}
                >
                  <div
                    className={cn(
                      "relative overflow-hidden rounded-[1.3rem] border border-[#d9cebf] bg-[#e8e1d6] shadow-[0_18px_36px_rgba(42,31,19,0.12)]",
                      isLead ? "aspect-[16/10]" : "aspect-[4/5]"
                    )}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className={cn(
                          "h-full w-full object-cover transition-transform duration-500",
                          product.product_link ? "group-hover:scale-[1.02]" : ""
                        )}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[#6f655a]">
                        Bilde mangler
                      </div>
                    )}
                  </div>

                  <div
                    className={cn(
                      "mt-4 space-y-3",
                      isLead ? "xl:mt-0 xl:max-w-[32rem]" : ""
                    )}
                  >
                    <p className="text-[0.64rem] uppercase tracking-[0.23em] text-[#857868]">
                      {STORE_LABELS[product.__source] ?? product.__source}
                    </p>

                    <h3
                      className={cn(
                        "line-clamp-2 text-[#2f2923]",
                        isLead
                          ? "text-[1.25rem] leading-[1.15] md:text-[1.45rem]"
                          : "text-[0.98rem] leading-[1.35]"
                      )}
                    >
                      {product.name}
                    </h3>

                    <div className="flex items-center justify-between border-t border-[#dfd5c9] pt-3">
                      <p className="text-[0.98rem] font-semibold text-[#3d342a]">
                        {formatPrice(product.price)}
                      </p>

                      {product.product_link ? (
                        <span className="inline-flex items-center gap-1 text-[0.64rem] uppercase tracking-[0.2em] text-[#756b5f]">
                          Vis
                          <ExternalLink className="h-3.5 w-3.5" />
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          {hasMore && (
            <section className="pt-2">
              <Button
                onClick={loadMore}
                variant="ghost"
                size="lg"
                className="h-auto rounded-full border border-[#bca992] bg-[#f8f2e8] px-5 py-2.5 text-[0.67rem] uppercase tracking-[0.24em] text-[#4c4032] shadow-[0_10px_20px_rgba(62,48,31,0.11)] hover:-translate-y-px hover:bg-[#f6eee2] hover:text-[#3e3428]"
              >
                Vis flere
              </Button>
              <p className="mt-3 text-[0.64rem] uppercase tracking-[0.2em] text-[#7b7063]">
                {visibleCount} / {products.length}
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function StatePanel({ title, text, tone = "default" }) {
  const toneClass =
    tone === "error"
      ? "border-[#d7b4ae] bg-[linear-gradient(160deg,#fff4f1_0%,#fbe9e4_100%)]"
      : "border-[#dacfc2] bg-[linear-gradient(165deg,#faf7f2_0%,#f2ece3_100%)]";

  return (
    <section
      className={cn(
        "rounded-[1.1rem] border px-6 py-10 text-center shadow-[0_12px_26px_rgba(56,44,30,0.08)] md:py-12",
        toneClass
      )}
    >
      <h2 className="font-display text-[2rem] leading-[0.95] text-[#2a241f] md:text-[2.3rem]">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-[#655d52]">{text}</p>
    </section>
  );
}

function ProductSkeletonGrid() {
  return (
    <section className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => {
        const isLead = index === 0;
        return (
          <article
            key={index}
            className={cn(
              isLead && "xl:col-span-2 xl:grid xl:grid-cols-[1.35fr_1fr] xl:items-end xl:gap-8"
            )}
          >
            <Skeleton
              className={cn(
                "w-full rounded-[1.25rem] bg-[#e6ded1]",
                isLead ? "aspect-[16/10]" : "aspect-[4/5]"
              )}
            />
            <div className={cn("mt-4 space-y-3", isLead ? "xl:mt-0" : "")}>
              <Skeleton className="h-3 w-20 rounded-none bg-[#ded4c7]" />
              <Skeleton className="h-4 w-full rounded-none bg-[#ded4c7]" />
              <Skeleton className="h-4 w-2/3 rounded-none bg-[#ded4c7]" />
            </div>
          </article>
        );
      })}
    </section>
  );
}

