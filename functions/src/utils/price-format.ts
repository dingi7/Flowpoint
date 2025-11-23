/**
 * Format a price value in BGN and EUR format
 * @param price - The price value in BGN (Bulgarian Lev)
 * @returns Formatted price string as "50lv/€25.56"
 */
export function formatPrice(price: number): string {
  if (price === 0) {
    return "Free";
  }

  // BGN to EUR conversion rate (fixed rate: 1 BGN = 0.51129 EUR, or 1 EUR = 1.95583 BGN)
  // Using the official fixed rate: 1 EUR = 1.95583 BGN
  const EUR_TO_BGN_RATE = 1.95583;
  const eurPrice = price / EUR_TO_BGN_RATE;

  // Format BGN price (no decimals if whole number, otherwise 2 decimals)
  const bgnFormatted = price % 1 === 0 
    ? price.toString() 
    : price.toFixed(2);

  // Format EUR price (always 2 decimals)
  const eurFormatted = eurPrice.toFixed(2);

  return `${bgnFormatted}lv/€${eurFormatted}`;
}

