/**
 * Format a numeric balance for display.
 * Rules:
 * - < 1000: show as-is (e.g. 100 → "100")
 * - 1000..999999: show as X,YК (e.g. 1400 → "1,4К", 5000 → "5К")
 * - >= 1000000: show as XКК (e.g. 7000000 → "7КК", 1500000 → "1,5КК")
 */
export function formatBalance(amount: number): string {
  if (amount < 1000) {
    return String(amount);
  }

  if (amount < 1_000_000) {
    const thousands = amount / 1000;
    if (Number.isInteger(thousands)) {
      return `${thousands}К`;
    }
    // Show one decimal place
    const formatted = thousands.toFixed(1).replace('.', ',');
    // Remove trailing ,0
    if (formatted.endsWith(',0')) {
      return `${formatted.slice(0, -2)}К`;
    }
    return `${formatted}К`;
  }

  // Millions
  const millions = amount / 1_000_000;
  if (Number.isInteger(millions)) {
    return `${millions}КК`;
  }
  const formatted = millions.toFixed(1).replace('.', ',');
  if (formatted.endsWith(',0')) {
    return `${formatted.slice(0, -2)}КК`;
  }
  return `${formatted}КК`;
}
