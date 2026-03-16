"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

const animations = {
  slide: {
    initial: { y: "100%", opacity: 0 },
    animate: { y: "0%", opacity: 1 },
    exit: { y: "-100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  blur: {
    initial: { opacity: 0, filter: "blur(12px)" },
    animate: { opacity: 1, filter: "blur(0px)" },
    exit: { opacity: 0, filter: "blur(12px)" },
  },
  flip: {
    initial: { rotateX: 90, opacity: 0 },
    animate: { rotateX: 0, opacity: 1 },
    exit: { rotateX: -90, opacity: 0 },
  },
  drop: {
    initial: { y: "-80%", opacity: 0, scale: 0.8 },
    animate: { y: "0%", opacity: 1, scale: 1 },
    exit: { y: "80%", opacity: 0, scale: 0.8 },
  },
};

export function RotatingText({ words, interval = 2500, mode = "slide", className }) {
  const safeWords = useMemo(() => (Array.isArray(words) && words.length > 0 ? words : [""]), [words]);
  const [index, setIndex] = useState(0);

  const next = useCallback(() => {
    setIndex((current) => (current + 1) % safeWords.length);
  }, [safeWords.length]);

  useEffect(() => {
    if (safeWords.length < 2) {
      return;
    }

    const timerId = window.setInterval(next, interval);
    return () => window.clearInterval(timerId);
  }, [next, interval, safeWords.length]);

  const longestWord = useMemo(
    () => safeWords.reduce((longest, current) => (longest.length > current.length ? longest : current), ""),
    [safeWords]
  );

  const animation = animations[mode] ?? animations.slide;

  return (
    <span
      className={cn("relative inline-flex overflow-hidden align-baseline", className)}
      style={{ perspective: mode === "flip" ? 600 : undefined }}
    >
      <span className="invisible">{longestWord}</span>

      <AnimatePresence mode="wait">
        <motion.span
          key={`${safeWords[index]}_${index}`}
          className="absolute inset-0 inline-flex items-center justify-start"
          initial={animation.initial}
          animate={animation.animate}
          exit={animation.exit}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        >
          {safeWords[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
