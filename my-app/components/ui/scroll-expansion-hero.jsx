"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function ScrollExpansionHero({
  mediaType = "image",
  mediaSrc,
  posterSrc,
  bgImageSrc,
  heroOverlay,
  title = "",
  date,
  scrollToExpand = "Opening sequence",
  textBlend = false,
  autoPlay = true,
  autoPlayDuration = 1800,
  className,
  children,
}) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showContent, setShowContent] = useState(false);
  const [isMobileState, setIsMobileState] = useState(false);

  const titleParts = useMemo(() => {
    const [firstWord = "", ...rest] = title.split(" ");
    return { firstWord, restOfTitle: rest.join(" ") };
  }, [title]);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileState(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    setScrollProgress(0);
    setShowContent(false);
  }, [mediaType, mediaSrc]);

  useEffect(() => {
    const reset = () => {
      setScrollProgress(0);
      setShowContent(false);
    };

    window.addEventListener("resetSection", reset);
    return () => window.removeEventListener("resetSection", reset);
  }, []);

  useEffect(() => {
    if (!autoPlay) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setScrollProgress(1);
      setShowContent(true);
      return;
    }

    let frameId;
    const startedAt = performance.now();

    const tick = (now) => {
      const progress = clamp((now - startedAt) / autoPlayDuration, 0, 1);
      setScrollProgress(progress);
      if (progress >= 1) {
        setShowContent(true);
        return;
      }
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [autoPlay, autoPlayDuration, mediaType, mediaSrc]);

  const easedProgress = 1 - (1 - scrollProgress) ** 3;
  const heroMediaWidth = 100;
  const heroMediaHeight = isMobileState ? 66 : 74;
  const heroMediaTop = isMobileState ? 39 : 37;
  const heroMediaScale = 1.06 - easedProgress * 0.06;
  const heroMediaRadius = Math.round((isMobileState ? 26 : 34) - easedProgress * (isMobileState ? 14 : 22));
  const mediaInsetX = (isMobileState ? 10 : 22) * (1 - easedProgress);
  const mediaInsetY = (isMobileState ? 8 : 15) * (1 - easedProgress);
  const textTranslateX = (1 - easedProgress) * (isMobileState ? 8 : 12);
  const hasHeroCopy = Boolean(date || titleParts.firstWord || titleParts.restOfTitle || scrollToExpand);

  return (
    <div className={cn("overflow-x-hidden", className)}>
      <section className="relative min-h-[100dvh]">
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 - easedProgress }}
          transition={{ duration: 0.15 }}
        >
          {bgImageSrc ? (
            <>
              <Image
                src={bgImageSrc}
                alt="Hero background"
                fill
                priority
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/28" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,255,255,0.58),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(180,180,180,0.25),transparent_40%),linear-gradient(140deg,#d8d8d6_0%,#cfcfcd_52%,#d8d8d5_100%)]" />
          )}
        </motion.div>

        <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center">
          <div className="relative flex min-h-[100dvh] w-full items-center justify-center">
            <div
              className="absolute left-1/2 top-1/2 z-0 w-screen overflow-hidden"
              style={{
                width: `${heroMediaWidth}vw`,
                height: `${heroMediaHeight}vh`,
                top: `${heroMediaTop}%`,
                maxHeight: isMobileState ? "620px" : "780px",
                borderRadius: `${heroMediaRadius}px`,
                clipPath: `inset(${mediaInsetY}% ${mediaInsetX}% round ${heroMediaRadius}px)`,
                transform: `translate3d(-50%, -50%, 0) scale(${heroMediaScale})`,
                boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
                willChange: "transform, clip-path",
              }}
            >
              {mediaType === "video" ? (
                mediaSrc.includes("youtube.com") ? (
                  <div className="relative h-full w-full">
                    <iframe
                      width="100%"
                      height="100%"
                      src={
                        mediaSrc.includes("embed")
                          ? `${mediaSrc}${mediaSrc.includes("?") ? "&" : "?"}autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1`
                          : `${mediaSrc.replace("watch?v=", "embed/")}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&disablekb=1&modestbranding=1&playlist=${mediaSrc.split("v=")[1]}`
                      }
                      className="h-full w-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    <motion.div
                      className="absolute inset-0 bg-black/35"
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.48 - easedProgress * 0.2 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                ) : (
                  <div className="relative h-full w-full">
                    <video
                      src={mediaSrc}
                      poster={posterSrc}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      className="h-full w-full object-cover"
                      controls={false}
                    />
                    <motion.div
                      className="absolute inset-0 bg-black/35"
                      initial={{ opacity: 0.7 }}
                      animate={{ opacity: 0.48 - easedProgress * 0.2 }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                )
              ) : (
                <div className="relative h-full w-full">
                  <Image src={mediaSrc} alt={title || "Media content"} fill className="object-cover" />
                  <motion.div
                    className="absolute inset-0 bg-black/50"
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: 0.46 - easedProgress * 0.18 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              )}
            </div>

            {heroOverlay ? (
              <div className="relative z-10 mx-auto w-full max-w-[1300px] px-6 md:px-10">
                {heroOverlay}
              </div>
            ) : hasHeroCopy ? (
              <div
                className={cn(
                  "relative z-10 mx-auto flex w-full max-w-[1300px] flex-col items-start gap-2 px-6 text-left md:px-10",
                  textBlend ? "mix-blend-difference" : "mix-blend-normal"
                )}
              >
                {date && (
                  <p
                    className="text-sm uppercase tracking-[0.2em] text-white/80 md:text-base"
                    style={{ transform: `translateX(-${textTranslateX}vw)` }}
                  >
                    {date}
                  </p>
                )}
                {titleParts.firstWord ? (
                  <motion.h2
                    className="font-display text-5xl leading-[0.9] text-white sm:text-6xl md:text-7xl"
                    style={{ transform: `translateX(-${textTranslateX}vw)` }}
                  >
                    {titleParts.firstWord}
                  </motion.h2>
                ) : null}
                {titleParts.restOfTitle ? (
                  <motion.h2
                    className="font-display text-5xl leading-[0.9] text-white sm:text-6xl md:text-7xl"
                    style={{ transform: `translateX(${textTranslateX}vw)` }}
                  >
                    {titleParts.restOfTitle}
                  </motion.h2>
                ) : null}
                {scrollToExpand && (
                  <p
                    className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-white/84"
                    style={{ transform: `translateY(${(1 - scrollProgress) * 10}px)` }}
                  >
                    {scrollToExpand}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <motion.section
            className="w-full pb-12 md:pb-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: showContent ? 1 : 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="container">{children}</div>
          </motion.section>
        </div>
      </section>
    </div>
  );
}
