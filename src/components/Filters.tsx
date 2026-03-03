import { useMemo } from 'react';
import type { ParsedResult, FilterState } from '../types';

interface FiltersProps {
  result: ParsedResult;
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onReset: () => void;
}

export function Filters({ result, filters, onChange, onReset }: FiltersProps) {
  const tickers = useMemo(
    () => ['All', ...sorted(unique(result.trades.map((t) => t.ticker)))],
    [result.trades],
  );

  const strategies = useMemo(
    () =>
      result.hasStrategy
        ? ['All', ...sorted(unique(result.trades.map((t) => t.strategy ?? '').filter(Boolean)))]
        : [],
    [result],
  );

  const portfolios = useMemo(
    () =>
      result.hasPortfolio
        ? ['All', ...sorted(unique(result.trades.map((t) => t.portfolio ?? '').filter(Boolean)))]
        : [],
    [result],
  );

  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...filters, [key]: value });

  return (
    <div className="card px-5 py-3.5 flex flex-wrap items-center gap-3">
      {/* Ticker */}
      <FilterSelect
        label="Ticker"
        value={filters.ticker}
        options={tickers}
        onChange={(v) => set('ticker', v)}
      />

      {/* Action */}
      <FilterSelect
        label="Action"
        value={filters.action}
        options={['All', 'Add', 'Trim']}
        onChange={(v) => set('action', v as FilterState['action'])}
        renderOption={(v) =>
          v === 'All' ? (
            <span>All</span>
          ) : v === 'Add' ? (
            <span className="text-add font-semibold">▲ Add</span>
          ) : (
            <span className="text-trim font-semibold">▼ Trim</span>
          )
        }
      />

      {/* Strategy */}
      {strategies.length > 1 && (
        <FilterSelect
          label="Strategy"
          value={filters.strategy}
          options={strategies}
          onChange={(v) => set('strategy', v)}
        />
      )}

      {/* Portfolio */}
      {portfolios.length > 1 && (
        <FilterSelect
          label="Portfolio"
          value={filters.portfolio}
          options={portfolios}
          onChange={(v) => set('portfolio', v)}
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Upload new */}
      <button className="btn-ghost text-xs" onClick={onReset}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
            clipRule="evenodd"
          />
        </svg>
        New file
      </button>
    </div>
  );
}

// ─── FilterSelect ─────────────────────────────────────────────────────────────

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  renderOption?: (v: string) => React.ReactNode;
}

function FilterSelect({ label, value, options, onChange }: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-text-muted whitespace-nowrap">{label}</label>
      <div className="relative">
        <select
          className="select-field pr-7 text-xs min-w-[100px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        {/* Chevron */}
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
          <svg className="w-3.5 h-3.5 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

function sorted(arr: string[]): string[] {
  return [...arr].sort((a, b) => a.localeCompare(b));
}
