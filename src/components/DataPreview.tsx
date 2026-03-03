import { useState } from 'react';
import type { TradeRow, ParsedResult } from '../types';
import { formatPrice, formatNumber, formatCompact } from '../utils/formatters';
import { exportToCsv } from '../utils/parseExcel';

interface DataPreviewProps {
  trades: TradeRow[];
  result: ParsedResult;
}

const PAGE_SIZE = 20;

export function DataPreview({ trades, result }: DataPreviewProps) {
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<keyof TradeRow>('date');
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...trades].sort((a, b) => {
    const av = a[sortField];
    const bv = b[sortField];
    let cmp = 0;
    if (av instanceof Date && bv instanceof Date) cmp = av.getTime() - bv.getTime();
    else if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
    else cmp = String(av ?? '').localeCompare(String(bv ?? ''));
    return sortAsc ? cmp : -cmp;
  });

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (field: keyof TradeRow) => {
    if (sortField === field) setSortAsc((v) => !v);
    else { setSortField(field); setSortAsc(true); }
    setPage(0);
  };

  const columns = buildColumns(result);

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Data Preview</h3>
          <p className="text-xs text-text-muted mt-0.5">
            {trades.length.toLocaleString()} rows matched — showing {PAGE_SIZE} at a time
          </p>
        </div>
        <button
          className="btn-secondary text-xs"
          onClick={() => exportToCsv(trades)}
          disabled={trades.length === 0}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Table */}
      {trades.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-text-muted">
          No trades match the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50/80 border-b border-border-light">
              <tr>
                {columns.map((col) => (
                  <Th key={col.field} col={col} sortField={sortField} sortAsc={sortAsc} onSort={handleSort} />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {pageRows.map((t) => (
                <tr key={`${t.rawRow}-${t.ticker}-${t.date.getTime()}`} className="hover:bg-gray-50/60">
                  {columns.map((col) => (
                    <td key={col.field} className="px-4 py-2.5 whitespace-nowrap">
                      {col.render(t)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border-light bg-gray-50/50">
          <span className="text-xs text-text-muted">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <PaginationBtn
              label="‹ Prev"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
            />
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = paginationPage(i, page, totalPages);
              return (
                <PaginationBtn
                  key={i}
                  label={p === null ? '…' : String(p + 1)}
                  active={p === page}
                  disabled={p === null}
                  onClick={() => p !== null && setPage(p)}
                />
              );
            })}
            <PaginationBtn
              label="Next ›"
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Column definitions ───────────────────────────────────────────────────────

interface ColDef {
  field: keyof TradeRow;
  label: string;
  render: (t: TradeRow) => React.ReactNode;
  align?: 'left' | 'right';
}

function buildColumns(result: ParsedResult): ColDef[] {
  const cols: ColDef[] = [
    {
      field: 'date',
      label: 'Date',
      render: (t) => <span className="text-text-secondary">{t.dateStr}</span>,
    },
    {
      field: 'ticker',
      label: 'Ticker',
      render: (t) => <span className="font-mono font-semibold text-text-primary">{t.ticker}</span>,
    },
    {
      field: 'action',
      label: 'Action',
      render: (t) =>
        t.action === 'Add' ? (
          <span className="badge-add">▲ Add</span>
        ) : (
          <span className="badge-trim">▼ Trim</span>
        ),
    },
    {
      field: 'price',
      label: 'Price',
      align: 'right',
      render: (t) => <span className="font-mono text-text-primary">{formatPrice(t.price)}</span>,
    },
  ];

  if (result.hasQuantity) {
    cols.push({
      field: 'quantity',
      label: 'Quantity',
      align: 'right',
      render: (t) =>
        t.quantity !== undefined ? (
          <span className="font-mono text-text-secondary">{formatNumber(t.quantity)}</span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    });
  }

  if (result.hasNotional) {
    cols.push({
      field: 'notional',
      label: 'Notional',
      align: 'right',
      render: (t) =>
        t.notional !== undefined ? (
          <span className="font-mono text-text-secondary">{formatCompact(t.notional)}</span>
        ) : (
          <span className="text-text-muted">—</span>
        ),
    });
  }

  if (result.hasStrategy) {
    cols.push({
      field: 'strategy',
      label: 'Strategy',
      render: (t) => <span className="text-text-secondary">{t.strategy ?? '—'}</span>,
    });
  }

  if (result.hasPortfolio) {
    cols.push({
      field: 'portfolio',
      label: 'Portfolio',
      render: (t) => <span className="text-text-secondary">{t.portfolio ?? '—'}</span>,
    });
  }

  return cols;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Th({
  col,
  sortField,
  sortAsc,
  onSort,
}: {
  col: ColDef;
  sortField: keyof TradeRow;
  sortAsc: boolean;
  onSort: (f: keyof TradeRow) => void;
}) {
  const active = sortField === col.field;
  return (
    <th
      className={`px-4 py-2.5 text-left font-medium text-text-muted whitespace-nowrap cursor-pointer
        select-none hover:text-text-primary transition-colors
        ${col.align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() => onSort(col.field)}
    >
      <span className="inline-flex items-center gap-1">
        {col.label}
        <span className="text-[10px]">
          {active ? (sortAsc ? '↑' : '↓') : <span className="text-border">↕</span>}
        </span>
      </span>
    </th>
  );
}

function PaginationBtn({
  label,
  disabled,
  active,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`px-2 py-1 rounded text-xs font-medium transition-colors min-w-[28px]
        ${active
          ? 'bg-accent text-white'
          : disabled
          ? 'text-text-muted cursor-not-allowed'
          : 'text-text-secondary hover:bg-gray-100'
        }`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

/** Compute which page number to show for position i in a 7-slot paginator */
function paginationPage(i: number, current: number, total: number): number | null {
  if (total <= 7) return i < total ? i : null;

  const pages: (number | null)[] = [0];
  if (current > 2) pages.push(null); // ellipsis

  for (let p = Math.max(1, current - 1); p <= Math.min(total - 2, current + 1); p++) {
    pages.push(p);
  }

  if (current < total - 3) pages.push(null); // ellipsis
  pages.push(total - 1);

  // Pad to 7 slots
  while (pages.length < 7) pages.push(null);

  return i < pages.length ? pages[i] : null;
}
