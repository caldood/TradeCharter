/** Format a Date to "Jan 5, 2024" */
export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Short date for axis labels: "Jan '24" */
export function formatAxisDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/** Format a price with $ and 2 decimal places */
export function formatPrice(p: number): string {
  return p.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

/** Format a large number with commas */
export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

/** Format a dollar amount abbreviating thousands/millions */
export function formatCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return formatPrice(n);
}

/** Percentage with 1 decimal */
export function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}
