/**
 * Format a price value with currency symbol
 * @param price - The price value (number)
 * @param currency - The currency code (e.g., "USD", "EUR", "GBP")
 * @returns Formatted price string with currency symbol
 */
export function formatPrice(price: number, currency: string = "EUR"): string {
  if (price === 0) {
    return "Free";
  }

  // Map common currency codes to their symbols
  const currencySymbols: Record<string, string> = {
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
    CNY: "¥",
    INR: "₹",
    AUD: "A$",
    CAD: "C$",
    CHF: "CHF",
    SEK: "kr",
    NOK: "kr",
    DKK: "kr",
    PLN: "zł",
    RUB: "₽",
    BRL: "R$",
    MXN: "$",
    ZAR: "R",
    TRY: "₺",
    BGN: "лв",
  };

  const symbol = currencySymbols[currency.toUpperCase()] || currency.toUpperCase();

  // Format the number with appropriate decimal places
  const formattedPrice = price.toFixed(2);

  // Return formatted string with currency symbol
  return `${symbol}${formattedPrice}`;
}

