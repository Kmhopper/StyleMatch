"use client";

import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/navigation/app-header";
import { StoreFilterBar } from "@/components/navigation/store-filter-bar";

export function AppShell({ children }) {
  const pathname = usePathname();
  const isCategoryPage = pathname.startsWith("/category/");

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(145,145,145,0.24),transparent_68%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-52 top-16 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_70%_20%,rgba(180,175,168,0.24),transparent_66%)]"
      />

      <AppHeader />
      {isCategoryPage && <StoreFilterBar />}

      <main className="container relative z-10 pb-20 pt-8 md:pt-10">{children}</main>
    </div>
  );
}
