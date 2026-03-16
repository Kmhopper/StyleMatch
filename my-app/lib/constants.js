export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const STORE_OPTIONS = [
  { id: "hm_products", label: "H&M" },
  { id: "weekday_products", label: "Weekday" },
  { id: "zara_products", label: "Zara" },
  { id: "follestad_products", label: "Follestad" },
];

export const STORE_LABELS = {
  hm_products: "H&M",
  weekday_products: "Weekday",
  zara_products: "Zara",
  follestad_products: "Follestad",
};
