export const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") {
    return "Pris mangler";
  }

  const rawPrice = String(price).trim();
  if (/nok|kr/i.test(rawPrice)) {
    return rawPrice;
  }

  const normalized = rawPrice.replace(",", ".");
  const asNumber = Number.parseFloat(normalized);

  if (Number.isFinite(asNumber)) {
    return `${Math.round(asNumber)} NOK`;
  }

  return rawPrice;
};
