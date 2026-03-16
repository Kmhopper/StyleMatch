"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function AnimatedLoadingSkeleton({ cards = 6, className }) {
  const safeCards = Number.isFinite(cards) && cards > 0 ? cards : 6;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("space-y-4", className)}
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-[0.67rem] uppercase tracking-[0.2em] text-[#7a6f63]">Søker i katalogen</p>
        <div className="inline-flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-[#877867]">
          <span>Analyserer</span>
          <motion.span
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
            className="inline-block h-1.5 w-1.5 rounded-full bg-[#9a876f]"
          />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[1.2rem] border border-[#d9cec1] bg-[#f7f2ea] p-4 sm:p-6">
        <motion.div
          className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-[#ffffffad] to-transparent"
          animate={{ x: ["0%", "340%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
          className="absolute left-4 top-4 rounded-full border border-[#d5c9ba] bg-[#f3ebde]/90 p-2 text-[#6f6252]"
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Search className="h-4 w-4" />
        </motion.div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: safeCards }).map((_, index) => (
            <motion.div
              key={`loading-card-${index}`}
              className="rounded-[1rem] border border-[#dfd4c7] bg-[#fbf8f2] p-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
            >
              <motion.div
                className="aspect-[4/5] rounded-[0.8rem] bg-[#e4dccc]"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.08 }}
              />
              <motion.div
                className="mt-3 h-2.5 w-3/4 rounded-full bg-[#ddd2c4]"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.11 }}
              />
              <motion.div
                className="mt-2 h-2.5 w-1/2 rounded-full bg-[#ddd2c4]"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.14 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
