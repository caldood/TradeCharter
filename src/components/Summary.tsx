import { useMemo } from 'react';
import type { TradeRow } from '../types';
import { formatDate, formatPrice, formatNumber, formatCompact } from '../utils/formatters';

interface SummaryProps {
  trades: TradeRow[];
}

export function Summary({ trades }: SummaryProps) {
  const stats = useMemo(() => {
    if (trades.length === 0) return null;

    const adds = trades.filter((t) => t.action === 'Add');
    const trims = trades.filter((t) => t.action === 'Trim');
    const prices = trades.map((t) => t.price);

    const sorted = [...trades].sort((a, b) => a.date.getTime() - b.date.getTime());
    const firstDate = sorted[0].date;
    const lastDate = sorted[sorted.length - 1].date;

    const totalQty = trades.reduce((s, t) => s + (t.quantity ?? 0), 0);
    const hasQty = trades.some((t) => t.quantity !== undefined);

    const totalNotional = trades.reduce((s, t) => s + (t.notional ?? 0), 0);
    const hasNotional = trades.some((t) => t.notional !== undefined);

    return {
      total: trades.length,
      adds: adds.length,
      trims: trims.length,
      firstDate,
      lastDate,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      totalQty,
      hasQty,
      totalNotional,
      hasNotional,
    };
  }, [trades]);

  if (!stats) {
    return (
      <div className="card px-5 py-4 text-sm text-text-muted text-center">
        No trades match the current filters.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <StatCard label="Total Trades" value={formatNumber(stats.total)} />
      <StatCard
        label="Adds"
        value={formatNumber(stats.adds)}
        accent="add"
        icon="▲"
        sub={pct(stats.adds, stats.total)}
      />
      <StatCard
        label="Trims"
        value={formatNumber(stats.trims)}
        accent="trim"
        icon="▼"
        sub={pct(stats.trims, stats.total)}
      />
      <StatCard
        label="Date Range"
        value={formatDate(stats.firstDate)}
        sub={`→ ${formatDate(stats.lastDate)}`}
        compact
      />
      <StatCard
        label="Price Range"
        value={formatPrice(stats.minPrice)}
        sub={`→ ${formatPrice(stats.maxPrice)}`}
        compact
      />
      {stats.hasNotional ? (
        <StatCard label="Total Notional" value={formatCompact(stats.totalNotional)} />
      ) : stats.hasQty ? (
        <StatCard label="Total Shares" value={formatNumber(stats.totalQty)} />
      ) : (
        <StatCard label="Avg Price" value={formatPrice(avgPrice(trades))} />
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'add' | 'trim';
  icon?: string;
  compact?: boolean;
}

function StatCard({ label, value, sub, accent, icon }: StatCardProps) {
  const accentColor =
    accent === 'add'
      ? 'text-add'
      : accent === 'trim'
      ? 'text-trim'
      : 'text-text-primary';

  return (
    <div className="card px-4 py-3.5">
      <p className="text-xs font-medium text-text-muted mb-1 uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold leading-tight ${accentColor}`}>
        {icon && <span className="mr-1 text-sm">{icon}</span>}
        {value}
      </p>
      {sub && <p className="text-xs text-text-muted mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, total: number): string {
  if (total === 0) return '';
  return `${Math.round((n / total) * 100)}% of total`;
}

function avgPrice(trades: TradeRow[]): number {
  if (trades.length === 0) return 0;
  return trades.reduce((s, t) => s + t.price, 0) / trades.length;
}
