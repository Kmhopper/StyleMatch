"use client";

import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

function RevealImageListItem({ item, onSelect }) {
  const container = "pointer-events-none absolute right-5 top-1/2 z-20 hidden h-24 w-20 -translate-y-1/2 md:block";
  const effect =
    "relative h-full w-full overflow-hidden rounded-xl border border-white/80 bg-[#f2f0ec] opacity-0 shadow-none transition-all duration-500 group-hover:opacity-100 group-hover:shadow-xl";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item)}
      className="group relative w-full overflow-visible border-b border-[#d7d2cb] py-5 text-left last:border-b-0"
    >
      <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#6c7484]">{item.tagline}</p>

      <div className="mt-2 flex items-end justify-between gap-3">
        <h3 className="font-display text-[2.25rem] leading-[0.9] text-[#20293a] transition-all duration-500 group-hover:opacity-40">
          {item.name}
        </h3>
        <span className="inline-flex items-center gap-1 text-sm text-[#4c5668] transition-colors group-hover:text-[#1f2738]">
          Åpne
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className={container}>
        <div className={effect}>
          <img
            alt={item.images[1].alt}
            src={item.images[1].src}
            className={cn(
              "h-full w-full",
              item.images[1].fit === "contain" ? "object-contain bg-[#e8e6e2] p-1.5" : "object-cover"
            )}
          />
        </div>
      </div>

      <div
        className={cn(
          container,
          "translate-x-0 -translate-y-1/2 rotate-0 transition-all delay-100 duration-500 group-hover:translate-x-8 group-hover:-translate-y-[38%] group-hover:rotate-12"
        )}
      >
        <div className={cn(effect, "duration-200")}>
          <img
            alt={item.images[0].alt}
            src={item.images[0].src}
            className={cn(
              "h-full w-full",
              item.images[0].fit === "contain" ? "object-contain bg-[#e8e6e2] p-1.5" : "object-cover"
            )}
          />
        </div>
      </div>
    </button>
  );
}

export function RevealImageList({ items, onSelect, className }) {
  return (
    <div
      className={cn(
        "rounded-[1.6rem] border border-white/70 bg-[#eceae7]/92 px-5 py-4 shadow-soft md:px-7 md:py-6",
        className
      )}
    >
      <div>
        {items.map((item) => (
          <RevealImageListItem key={item.slug} item={item} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
