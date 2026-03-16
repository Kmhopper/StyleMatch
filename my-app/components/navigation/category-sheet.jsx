"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function CategorySheet({ categories, currentCategory }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const goToCategory = (category) => {
    router.push(`/category/${encodeURIComponent(category)}`);
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-11 gap-2 rounded-full border border-[#cdbfae] bg-[linear-gradient(165deg,#f8f4ee_0%,#f3ece2_100%)] px-4 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[#4f463b] shadow-[0_10px_22px_rgba(62,49,33,0.1)] hover:-translate-y-px hover:bg-[#f8f1e8]"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Kategorier
          <span className="rounded-full border border-[#d2c4b2] bg-white/90 px-2 py-0.5 text-[0.58rem] leading-none text-[#7a6e5f]">
            {categories.length}
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[340px] border-r border-[#d8cec1] bg-[linear-gradient(180deg,#f6f2ec_0%,#efe9e0_100%)] px-0"
      >
        <SheetHeader className="px-8 pt-8">
          <p className="text-[0.63rem] uppercase tracking-[0.26em] text-[#7d7264]">Kategorioversikt</p>
          <SheetTitle className="font-display text-4xl leading-none text-[#2a241f]">
            Kategorier
          </SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-2 px-6 pb-8">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => goToCategory(category)}
              className={cn(
                "group flex items-center justify-between rounded-[0.95rem] border px-4 py-3 text-left text-[0.96rem] tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7a63]/35 focus-visible:ring-offset-2",
                category === currentCategory
                  ? "border-[#6a5a48] bg-[linear-gradient(140deg,#645645_0%,#544636_100%)] text-[#f6f1e9] shadow-[0_14px_30px_rgba(56,44,30,0.28)]"
                  : "border-[#dbcfbf] bg-[linear-gradient(165deg,#faf7f3_0%,#f4eee5_100%)] text-[#5f5549] hover:-translate-y-px hover:border-[#bca98f] hover:text-[#3f362d]"
              )}
            >
              <span>{category}</span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5",
                  category === currentCategory ? "text-[#f6f1e9]/85" : "text-[#8a7d6d]"
                )}
              />
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
