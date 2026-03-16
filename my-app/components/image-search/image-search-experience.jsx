"use client";

import { useRef } from "react";
import { ImageUp, RefreshCcw, Search } from "lucide-react";
import { useImageSearch } from "@/hooks/use-image-search";
import { AnimatedLoadingSkeleton } from "@/components/ui/animated-loading-skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ImageSearchExperience() {
  const fileInputRef = useRef(null);
  const {
    selectedFile,
    previewUrl,
    results,
    loading,
    error,
    isDragging,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleSubmit,
    reset,
  } = useImageSearch();

  const resetAll = () => {
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-12 pb-8 md:space-y-14 md:pb-10">
      <section className="space-y-4 pt-2 md:pt-4">
        <p className="text-[0.67rem] uppercase tracking-[0.24em] text-[#7a6f63]">Bilde-søk</p>
        <h1 className="max-w-[16ch] font-display text-5xl leading-[0.9] text-[#2a241f] md:text-6xl">
          Finn lignende produkter med ett bilde
        </h1>
        <p className="max-w-2xl text-sm text-[#625b51] md:text-base">
          Last opp et bilde av plagget du liker. Vi matcher mot produkter på tvers av butikker.
        </p>
      </section>

      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[1.7rem] border border-[#d8cec2] bg-[linear-gradient(165deg,rgba(251,248,243,0.95)_0%,rgba(244,238,230,0.93)_100%)] p-6 shadow-[0_20px_40px_rgba(56,44,30,0.1)] md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              ref={fileInputRef}
              id="image-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
            />

            <label
              htmlFor="image-upload"
              className={cn(
                "flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-[1.2rem] border border-dashed border-[#d5cabd] bg-[#f6f2eb] px-6 py-8 text-center transition-colors",
                isDragging && "border-[#bda98e] bg-[#f1e8dc]"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Valgt plagg"
                  className="max-h-[390px] w-full rounded-[1rem] object-contain"
                  decoding="async"
                />
              ) : (
                <>
                  <ImageUp className="h-10 w-10 text-[#8b7d6d]" />
                  <span className="mt-4 text-[1.05rem] font-medium text-[#3a3128]">Dra bildet hit</span>
                  <span className="mt-1 text-sm text-[#716658]">eller klikk for å velge fil</span>
                </>
              )}
            </label>

            <div className="flex flex-wrap items-center gap-5">
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="h-11 rounded-full bg-[#273d6d] px-6 hover:bg-[#223660]"
              >
                {loading ? "Analyserer..." : "Start søk"}
                <Search className="h-4 w-4" />
              </Button>

              {selectedFile ? (
                <button
                  type="button"
                  onClick={resetAll}
                  disabled={loading}
                  className="inline-flex items-center gap-2 border-b border-[#907f69] pb-1 text-[0.67rem] font-medium uppercase tracking-[0.2em] text-[#6f6355] transition-colors hover:text-[#4d4338] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Nullstill
                  <RefreshCcw className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            {selectedFile ? (
              <p className="text-sm text-[#6d6458]">
                Valgt fil: <strong>{selectedFile.name}</strong>
              </p>
            ) : null}

            {error ? <p className="text-sm font-medium text-[#a14f43]">{error}</p> : null}
          </form>
        </section>

        <aside className="space-y-4 border-t border-[#d8cec2] pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-2">
          <p className="text-[0.67rem] uppercase tracking-[0.24em] text-[#7a6f63]">Retningslinjer</p>
          <h2 className="font-display text-[2.25rem] leading-[0.92] text-[#2a241f]">Bedre treff</h2>

          <ul className="space-y-3 text-sm text-[#625b51]">
            <li className="border-b border-[#d8cec2] pb-3">Bruk et klart bilde med ett hovedplagg.</li>
            <li className="border-b border-[#d8cec2] pb-3">Unngå tung bakgrunn og flere personer i samme bilde.</li>
            <li>Resultatene blir best når plagget fyller store deler av bildet.</li>
          </ul>
        </aside>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[#d8cec2] pt-6">
          <h2 className="font-display text-[2.4rem] leading-none text-[#2a241f]">Treff</h2>
          <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#7a6f63]">
            {loading ? "Søker..." : `${results.length} produkter`}
          </p>
        </div>

        {loading ? <AnimatedLoadingSkeleton /> : null}

        {!loading && results.length === 0 && !error ? (
          <p className="text-sm text-[#625b51]">Ingen treff ennå. Last opp et bilde for å starte.</p>
        ) : null}

        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((result, index) => {
              const similarity = Number.parseFloat(result.similarity);
              const similarityLabel = Number.isFinite(similarity)
                ? `${Math.round(similarity * 100)}% match`
                : "Likhet ukjent";
              const isClickable = Boolean(result.product_link);

              return (
                <article
                  key={`${result.product_link ?? result.image_url}_${index}`}
                  className={cn("group", isClickable ? "cursor-pointer" : "cursor-default")}
                  onClick={() =>
                    isClickable && window.open(result.product_link, "_blank", "noopener,noreferrer")
                  }
                  role={isClickable ? "link" : undefined}
                  tabIndex={isClickable ? 0 : -1}
                  onKeyDown={(event) => {
                    if (!isClickable) {
                      return;
                    }
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      window.open(result.product_link, "_blank", "noopener,noreferrer");
                    }
                  }}
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-[1.15rem] bg-[#e5ddd0]">
                    <img
                      src={result.image_url}
                      alt={result.name}
                      loading="lazy"
                      decoding="async"
                      className={cn(
                        "h-full w-full object-cover",
                        isClickable ? "transition-transform duration-500 group-hover:scale-[1.02]" : ""
                      )}
                    />
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <p className="text-[0.62rem] uppercase tracking-[0.2em] text-[#887b6a]">
                      {similarityLabel}
                    </p>
                    <h3 className="line-clamp-2 min-h-[2.8rem] text-sm font-semibold leading-snug text-[#2f2923]">
                      {result.name}
                    </h3>
                    <div className="flex items-center justify-between border-t border-[#ddd2c5] pt-2">
                      <p className="text-base font-semibold text-[#3d352b]">{result.price} NOK</p>
                      {isClickable ? (
                        <span className="text-[0.62rem] uppercase tracking-[0.18em] text-[#73675a]">
                          Åpne
                        </span>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}
