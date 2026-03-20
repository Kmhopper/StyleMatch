"use client";

import { Check, RotateCcw } from "lucide-react";
import { STORE_OPTIONS } from "@/lib/constants";
import { useStoreFilters } from "@/lib/store-filter-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STORE_META = {
  hm_products: { code: "HM", subtitle: "High-street essentials", accent: "text-[#726455]" },
  weekday_products: { code: "WD", subtitle: "Nordic casual", accent: "text-[#7a6c5d]" },
  zara_products: { code: "ZR", subtitle: "Contemporary edits", accent: "text-[#6f6152]" },
  follestad_products: { code: "FL", subtitle: "Premium menswear", accent: "text-[#756858]" },
};

export function StoreFilterBar() {
  const { selectedStores, toggleStore, clearStores } = useStoreFilters();
  const selectedCount = selectedStores.length;

  return (
    <section className="border-b border-[#d8cec2]/90 bg-[linear-gradient(172deg,rgba(248,245,240,0.94)_0%,rgba(242,236,229,0.9)_57%,rgba(236,230,222,0.92)_100%)] backdrop-blur-sm">
      <div className="container py-7 md:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-[0.68rem] uppercase tracking-[0.27em] text-[#766a5e]">Butikkfilter</p>
            <h2 className="font-display text-[2.35rem] leading-[0.9] text-[#2a241f] md:text-[2.7rem]">
              Velg butikker
            </h2>
            <p className="text-sm text-[#675f55]">Aktiver en eller flere butikker for å hente produkter i valgt kategori.</p>
          </div>

          <div className="flex items-center gap-2.5 pb-1">
            <Badge
              variant={selectedCount > 0 ? "default" : "secondary"}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-semibold uppercase tracking-[0.08em]",
                selectedCount > 0
                  ? "bg-[#5a4a38] text-[#f7f2ea] shadow-[0_12px_26px_rgba(56,44,30,0.26)]"
                  : "border-[#d1c4b6] bg-[#f3ece3] text-[#525d6d]"
              )}
            >
              {selectedCount} valgt
            </Badge>
            <button
              type="button"
              onClick={clearStores}
              disabled={selectedCount === 0}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] transition-all duration-200",
                selectedCount > 0
                  ? "border-[#bfad95] bg-[#f6efe6] text-[#5f5549] hover:-translate-y-px hover:border-[#a38b70] hover:text-[#3f362d] hover:shadow-[0_10px_20px_rgba(52,41,28,0.14)]"
                  : "cursor-not-allowed border-[#ddd3c7] bg-[#f7f2eb]/70 text-[#9198a4]"
              )}
            >
              <RotateCcw className="h-3 w-3" />
              Nullstill
            </button>
          </div>
        </div>

        <div className="mt-6 h-px w-full bg-[#d9cfc3]" />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {STORE_OPTIONS.map((store) => {
            const checked = selectedStores.includes(store.id);
            const meta = STORE_META[store.id];

            return (
              <button
                key={store.id}
                type="button"
                onClick={() => toggleStore(store.id, !checked)}
                aria-pressed={checked}
                className={cn(
                  "group relative flex w-full items-center justify-between overflow-hidden rounded-[1.25rem] border px-4 py-3.5 text-left transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7a63]/40 focus-visible:ring-offset-2",
                  checked
                    ? "border-[#6a5a48]/80 bg-[linear-gradient(130deg,#645544_0%,#584a39_56%,#4b3f31_100%)] text-[#f7f2ea] shadow-[0_18px_35px_rgba(56,44,30,0.34)]"
                    : "border-[#d4c8ba] bg-[linear-gradient(160deg,rgba(253,250,245,0.96)_0%,rgba(247,241,233,0.94)_100%)] text-[#3a3026] hover:-translate-y-0.5 hover:border-[#b7a388] hover:shadow-[0_14px_30px_rgba(45,36,26,0.14)]"
                )}
              >
                <div>
                  <p
                    className={cn(
                      "text-[0.65rem] uppercase tracking-[0.22em]",
                      checked ? "text-white/70" : cn("text-[#757e8f]", meta?.accent)
                    )}
                  >
                    {meta?.code ?? "ST"}
                  </p>
                  <p className="mt-1 text-[1.72rem] font-display leading-none">{store.label}</p>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      checked ? "text-white/75" : "text-[#5f697a]"
                    )}
                  >
                    {meta?.subtitle ?? "Store catalog"}
                  </p>
                </div>

                <span
                  className={cn(
                    "grid h-5 w-5 place-items-center rounded-full border transition-all duration-300",
                    checked
                      ? "border-white/70 bg-white/15 text-white"
                      : "border-[#948570] bg-white/75 text-[#847460] group-hover:border-[#786651] group-hover:text-[#5f4d37]"
                  )}
                >
                  {checked ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current/85" />
                  )}
                </span>

                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute inset-0 rounded-[1.2rem] transition-opacity duration-300",
                    checked
                      ? "opacity-100 bg-[radial-gradient(circle_at_16%_16%,rgba(255,255,255,0.22),transparent_38%)]"
                      : "opacity-0 group-hover:opacity-100 bg-[radial-gradient(circle_at_12%_12%,rgba(255,255,255,0.58),transparent_34%)]"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
