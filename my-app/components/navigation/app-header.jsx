"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Forside" },
  { href: "/find-similar", label: "Bilde-søk" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-[#f1efec]/88 backdrop-blur-md">
      <div className="container flex flex-wrap items-center justify-between gap-4 py-3">
        <Link href="/" className="group inline-flex items-center">
          <div>
            <p className="font-display text-2xl leading-none tracking-[0.06em] text-[#2a241f]">
              FITTED
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[#786d61]">
              Style Made Simple
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-0 overflow-hidden rounded-2xl border border-[#d4cfc8] bg-[#f7f5f2]">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "border-r border-[#d7d2cc] px-5 py-2.5 text-sm font-medium transition-colors last:border-r-0",
                    isActive
                      ? "bg-[#1f2f4f] text-white"
                      : "text-[#544b40] hover:bg-[#ece9e4]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 rounded-xl border border-[#d3cec8] bg-[#f7f5f2] px-3 py-2 text-xs uppercase tracking-[0.12em] text-[#6f6458] lg:inline-flex">
            <Sparkles className="h-3.5 w-3.5 text-[#9a8f80]" />
            Spring Drop 26
          </div>
        </div>
      </div>
    </header>
  );
}