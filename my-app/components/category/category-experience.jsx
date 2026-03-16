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
    <div className="space-y-12 pb-8 md:space-y-14 md:pb-12">
      <section className="rounded-[2rem] border border-[#dacfc2] bg-[linear-gradient(165deg,rgba(251,248,243,0.96)_0%,rgba(244,238,230,0.94)_100%)] px-6 py-7 shadow-[0_26px_50px_rgba(56,44,30,0.12)] md:px-9 md:py-9">
        <div className="flex flex-wrap items-start justify-between gap-7">
          <div className="max-w-[46rem] space-y-3">
            <p className="text-[0.67rem] uppercase tracking-[0.26em] text-[#786d61]">Live katalog på tvers av butikker</p>
            <h1 className="font-display text-[3rem] leading-[0.88] text-[#2a241f] md:text-[4.2rem]">
              {categoryName}
            </h1>
            <p className="max-w-2xl text-[1.05rem] leading-relaxed text-[#655e54]">
              Velg butikker i filterlinjen over. Resultatene oppdateres automatisk med samme kategori og valgte butikker.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:flex-col sm:items-end">
            <CategorySheet categories={categories} currentCategory={categoryName} />
            <span className="inline-flex rounded-full bg-[#5a4a38] px-3.5 py-1.5 text-sm font-semibold text-[#f7f2ea] shadow-[0_10px_24px_rgba(56,44,30,0.28)]">
              {loading ? "Laster..." : `${products.length} produkter`}
            </span>
          </div>
        </div>

        <div className="mt-8 h-px w-full bg-[#ddd3c7]" />

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {activeStoreNames.length > 0 ? (
            activeStoreNames.map((storeName) => (
              <span
                key={storeName}
                className="rounded-full border border-[#cebfae] bg-[#f5eee4] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.13em] text-[#5f564b]"
              >
                {storeName}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-[#d4c7b7] bg-[#f4ece2] px-3 py-1.5 text-xs font-semibold text-[#675d52]">
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
        "rounded-[1.7rem] border px-8 py-16 text-center shadow-[0_18px_38px_rgba(56,44,30,0.1)] md:py-20",
        toneClass
      )}
    >
      <h2 className="font-display text-[3rem] leading-[0.92] text-[#2a241f] md:text-[3.7rem]">
        {title}
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-[1rem] text-[#655d52]">{text}</p>
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
