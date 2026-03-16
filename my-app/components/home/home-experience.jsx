"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera } from "lucide-react";
import { categoryCatalog } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { RevealImageList } from "@/components/ui/reveal-images";
import { RotatingText } from "@/components/ui/rotating-text";
import ScrollExpansionHero from "@/components/ui/scroll-expansion-hero";

const HERO_STATS = [
  { label: "BUTIKKER", value: "4+" },
  { label: "KATEGORIER", value: "9" },
  { label: "NYE PRODUKTER", value: "Daglig" },
];

export function HomeExperience() {
  const router = useRouter();
  const categoriesRef = useRef(null);
  const categoryRevealItems = useMemo(
    () =>
      categoryCatalog.map((category) => {
        return {
          slug: category.slug,
          name: category.name,
          tagline: category.tagline,
          images: [
            { src: category.image, alt: `${category.name} studio`, fit: "contain" },
            {
              src: `/images/category-set-v2/${category.slug}.jpg`,
              alt: `${category.name} editorial`,
              fit: "cover",
            },
          ],
        };
      }),
    []
  );

  return (
    <div className="space-y-10 pb-10 md:space-y-12">
      <ScrollExpansionHero
        mediaType="image"
        mediaSrc="/images/home-hero/Proff-hero-uten-tekst.png"
        heroOverlay={
          <div className="max-w-[18ch] md:ml-[18vw] md:max-w-[17ch] md:-translate-y-[10vh] lg:ml-[20vw] lg:-translate-y-[12vh] xl:ml-[22vw] xl:-translate-y-[13vh]">
            <p className="text-[0.68rem] md:ml-[0.5vw] uppercase tracking-[0.24em] text-white/78">Fitted</p>
            <h1 className="mt-3 font-display text-[2.6rem] leading-[0.9] text-white sm:text-[3.25rem] md:text-[4.15rem]">
              <span className="[text-shadow:0_8px_22px_rgba(0,0,0,0.34)]">Style made </span>
              <RotatingText
                words={["Simple", "Curated", "Calm", "Effortless"]}
                mode="fade"
                interval={2200}
                className="text-[#dcc3a5] [text-shadow:none]"
              />
            </h1>
          </div>
        }
        title=""
        date=""
        scrollToExpand=""
        autoPlayDuration={1250}
        className="relative left-1/2 w-screen -translate-x-1/2"
      >
        <section className="rounded-[2rem] border border-border/70 bg-[linear-gradient(90deg,#dddcd9_0%,#d5d4d2_45%,#ddd9d4_100%)] px-6 py-7 shadow-panel md:px-8 md:py-9 lg:px-10">
          <div className="grid gap-10 xl:grid-cols-[1.18fr_0.82fr] xl:gap-12">
            <article className="space-y-8">
              <div className="space-y-4">
                <p className="text-[0.67rem] font-medium uppercase tracking-[0.24em] text-[#7a6f63]">
                  Handle på tvers av butikker
                </p>
                <h1 className="max-w-[18ch] font-display text-[2.5rem] leading-[0.94] text-[#2a241f] sm:text-[3.2rem] lg:text-[4rem]">
                  Finn klær raskere med en roligere shoppingflyt
                </h1>
                <p className="max-w-[48ch] text-base leading-relaxed text-[#625b51] md:text-[1.1rem]">
                  Fitted samler produkter fra flere butikker, slik at du kan sammenligne i en moden
                  og ryddig opplevelse.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-5">
                <Button
                  size="lg"
                  className="h-12 rounded-2xl bg-[#273d6d] px-6 text-base hover:bg-[#223660]"
                  onClick={() => router.push("/find-similar")}
                >
                  Start bilde-søk
                  <Camera className="h-4 w-4" />
                </Button>

                <button
                  type="button"
                  onClick={() =>
                    categoriesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="inline-flex items-center gap-2 border-b border-[#8f806d] pb-1 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-[#6e6255] transition-colors hover:text-[#4e4338] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7a63]/35 focus-visible:ring-offset-2"
                >
                  Se kategorier
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <dl className="grid grid-cols-3 gap-6 border-t border-[#d6cdc1] pt-8">
                {HERO_STATS.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <dd className="font-display text-[2rem] leading-none text-[#342d24]">
                      {item.value}
                    </dd>
                    <dt className="text-xs tracking-[0.15em] text-[#72685c]">{item.label}</dt>
                  </div>
                ))}
              </dl>
            </article>

            <aside className="space-y-7 border-t border-[#d6cdc1] pt-8 xl:border-l xl:border-t-0 xl:pl-10 xl:pt-1">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.16em] text-[#7a6f62]">Butikknettverk</p>
                <h3 className="font-display text-[2.2rem] leading-[0.95] text-[#2a241f]">
                  Alt i en samlet visning
                </h3>
                <p className="text-sm leading-relaxed text-[#655f56]">
                  Sammenlign produkter på tvers av butikkene du allerede kjenner, uten å bytte
                  mellom faner.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1 border-b border-[#d6cdc1] pb-3">
                  <p className="text-[0.64rem] uppercase tracking-[0.2em] text-[#867967]">Butikker</p>
                  <p className="text-sm text-[#53483d]">Zara / H&M / Follestad / Weekday</p>
                </div>
                <div className="space-y-1 border-b border-[#d6cdc1] pb-3">
                  <p className="text-[0.64rem] uppercase tracking-[0.2em] text-[#867967]">
                    Bilde-søk
                  </p>
                  <p className="text-sm text-[#53483d]">Lignende produkter på sekunder.</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[0.64rem] uppercase tracking-[0.2em] text-[#867967]">
                    Oppdateringer
                  </p>
                  <p className="text-sm text-[#53483d]">Nye varer og priser hver dag.</p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      </ScrollExpansionHero>

      <section ref={categoriesRef} className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#7a6f63]">KATEGORIOVERSIKT</p>
            <h2 className="mt-2 font-display text-[3.1rem] leading-[0.9] text-[#2a241f] sm:text-[4.2rem]">
              Finn kategori raskt
            </h2>
          </div>
          <p className="rounded-full border border-[#d3cec8] bg-[#efeeeb] px-4 py-1.5 text-xs font-medium tracking-[0.12em] text-[#6a6156]">
            9 KATEGORIER
          </p>
        </div>
        <RevealImageList
          items={categoryRevealItems}
          onSelect={(item) => router.push(`/category/${encodeURIComponent(item.name)}`)}
        />
      </section>
    </div>
  );
}
