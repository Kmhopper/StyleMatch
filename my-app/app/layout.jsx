import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { StoreFilterProvider } from "@/lib/store-filter-context";
import { AppShell } from "@/components/navigation/app-shell";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata = {
  title: "Fitted - Style Made Simple",
  description: "Sammenlign klær på tvers av butikker og finn lignende produkter med bilde-søk.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="no">
      <body className={`${bodyFont.variable} ${displayFont.variable}`}>
        <StoreFilterProvider>
          <AppShell>{children}</AppShell>
        </StoreFilterProvider>
      </body>
    </html>
  );
}

