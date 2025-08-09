export function getDecimalPlaces(num: number) {
  const str = num.toString();
  if (str.indexOf(".") !== -1 && str.indexOf("e-") === -1) {
    return str.split(".")[1].length;
  } else if (str.indexOf("e-") !== -1) {
    // Handle scientific notation like 1e-8
    const parts = str.split("e-");
    return parseInt(parts[1]);
  }
  return 0;
}

export function calculatePriceAccurate(price: number, quantity: number) {
  const priceDecimals = getDecimalPlaces(price);
  const quantityDecimals = getDecimalPlaces(quantity);
  const maxDecimals = Math.max(priceDecimals, quantityDecimals);
  const scale = Math.pow(10, maxDecimals);
  const scaledPrice = Math.round(price * scale);
  const scaledQuantity = Math.round(quantity * scale);
  // Result will have double the decimal places, so divide by scale²
  return (scaledPrice * scaledQuantity) / (scale * scale);
}
