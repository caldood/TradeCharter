import * as XLSX from 'xlsx';
import { normalizeHeaders, normalizeAction } from './normalizeColumns';
import type { TradeRow, ParsedResult, ValidationError } from '../types';

// ─── Date helpers ────────────────────────────────────────────────────────────

/**
 * Convert any cell value to a JS Date.
 * Handles:
 *   - JS Date objects (from cellDates:true)
 *   - Excel serial numbers (integer / float)
 *   - ISO / common string formats
 */
function parseCellDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    // Excel serial date: days since 1900-01-00 (with leap-year bug)
    try {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (!parsed) return null;
      return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H ?? 0, parsed.M ?? 0, parsed.S ?? 0);
    } catch {
      return null;
    }
  }

  if (typeof value === 'string') {
    const s = value.trim();
    if (!s) return null;

    // Try native Date constructor (handles ISO, "Jan 5 2024", etc.)
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;

    // Try DD/MM/YYYY or DD-MM-YYYY
    const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
      const [, d1, m1, y1] = dmyMatch;
      const candidate = new Date(Number(y1), Number(m1) - 1, Number(d1));
      if (!isNaN(candidate.getTime())) return candidate;
    }

    return null;
  }

  return null;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Number helper ───────────────────────────────────────────────────────────

function parseCellNumber(value: unknown): number | null {
  if (typeof value === 'number') return isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(/[,$\s]/g, ''));
    return isFinite(n) ? n : null;
  }
  return null;
}

function parseCellString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

// ─── Size scaler ─────────────────────────────────────────────────────────────

/** Map absolute qty/notional to a reasonable marker size [6, 32] */
export function calcMarkerSize(value: number | undefined, maxValue: number): number {
  if (!value || maxValue === 0) return 10;
  const ratio = Math.abs(value) / maxValue;
  return Math.round(6 + ratio * 26);
}

// ─── Main parse function ──────────────────────────────────────────────────────

export async function parseExcel(file: File): Promise<ParsedResult> {
  const arrayBuffer = await file.arrayBuffer();

  const wb = XLSX.read(arrayBuffer, {
    cellDates: true,
    cellNF: true,
    dense: false,
  });

  // Find the "Trades" sheet or fall back to first sheet
  const sheetName =
    wb.SheetNames.find((n) => n.trim().toLowerCase() === 'trades') ??
    wb.SheetNames[0];

  if (!sheetName) {
    return {
      trades: [],
      errors: [{ row: 0, field: 'file', message: 'The workbook contains no sheets.' }],
      warnings: [],
      skippedRows: 0,
      columnMapping: {},
      hasQuantity: false,
      hasNotional: false,
      hasStrategy: false,
      hasPortfolio: false,
    };
  }

  const ws = wb.Sheets[sheetName];
  // Convert to array of objects with header row
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
    raw: false,       // keep formatted strings for dates
    defval: null,
  });

  // Also read with raw:true for numeric date serials
  const rawRowsTyped: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
    raw: true,
    defval: null,
  });

  if (rawRows.length === 0) {
    return {
      trades: [],
      errors: [{ row: 0, field: 'file', message: `Sheet "${sheetName}" is empty.` }],
      warnings: [],
      skippedRows: 0,
      columnMapping: {},
      hasQuantity: false,
      hasNotional: false,
      hasStrategy: false,
      hasPortfolio: false,
    };
  }

  const headers = Object.keys(rawRows[0]);
  const colMap = normalizeHeaders(headers);

  // Validate required columns
  const missing: string[] = [];
  if (!colMap.date) missing.push('Date');
  if (!colMap.action) missing.push('Action');
  if (!colMap.price) missing.push('Price');

  if (missing.length > 0) {
    return {
      trades: [],
      errors: [
        {
          row: 0,
          field: 'columns',
          message: `Missing required column(s): ${missing.join(', ')}. ` +
            `Found columns: ${headers.join(', ')}.`,
        },
      ],
      warnings: [],
      skippedRows: rawRows.length,
      columnMapping: colMap,
      hasQuantity: false,
      hasNotional: false,
      hasStrategy: false,
      hasPortfolio: false,
    };
  }

  const trades: TradeRow[] = [];
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  let skipped = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowTyped = rawRowsTyped[i];
    const rowNum = i + 2; // +2 because row 1 = headers, 1-indexed

    // ── Date ─────────────────────────────────────────────────────────────────
    // Prefer the typed (raw) version for numeric serial detection
    const rawDate = rowTyped[colMap.date!] ?? row[colMap.date!];
    const date = parseCellDate(rawDate);
    if (!date) {
      errors.push({
        row: rowNum,
        field: 'date',
        message: `Unparsable date: "${rawDate}"`,
        value: rawDate,
      });
      skipped++;
      continue;
    }

    // ── Action ───────────────────────────────────────────────────────────────
    const rawAction = parseCellString(row[colMap.action!]);
    const action = normalizeAction(rawAction);
    if (!action) {
      errors.push({
        row: rowNum,
        field: 'action',
        message: `Unknown action: "${rawAction}". Expected Add/Buy or Trim/Sell.`,
        value: rawAction,
      });
      skipped++;
      continue;
    }

    // ── Price ────────────────────────────────────────────────────────────────
    const rawPrice = rowTyped[colMap.price!] ?? row[colMap.price!];
    const price = parseCellNumber(rawPrice);
    if (price === null) {
      errors.push({
        row: rowNum,
        field: 'price',
        message: `Unparsable price: "${rawPrice}"`,
        value: rawPrice,
      });
      skipped++;
      continue;
    }

    // ── Optional fields ──────────────────────────────────────────────────────
    const ticker = colMap.ticker
      ? parseCellString(row[colMap.ticker]) || 'UNKNOWN'
      : 'UNKNOWN';

    const quantity = colMap.quantity
      ? (parseCellNumber(rowTyped[colMap.quantity] ?? row[colMap.quantity]) ?? undefined)
      : undefined;

    const notional = colMap.notional
      ? (parseCellNumber(rowTyped[colMap.notional] ?? row[colMap.notional]) ?? undefined)
      : undefined;

    const strategy = colMap.strategy
      ? parseCellString(row[colMap.strategy]) || undefined
      : undefined;

    const portfolio = colMap.portfolio
      ? parseCellString(row[colMap.portfolio]) || undefined
      : undefined;

    trades.push({
      date,
      dateStr: toDateStr(date),
      ticker: ticker.toUpperCase(),
      action,
      price,
      quantity,
      notional,
      strategy,
      portfolio,
      rawRow: rowNum,
    });
  }

  // Surface a summary warning for skipped rows
  if (skipped > 0 && skipped < rawRows.length) {
    warnings.push(`${skipped} row(s) were skipped due to parse errors (see error list below).`);
  }

  // Sort by date ascending
  trades.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    trades,
    errors,
    warnings,
    skippedRows: skipped,
    columnMapping: colMap,
    hasQuantity: trades.some((t) => t.quantity !== undefined),
    hasNotional: trades.some((t) => t.notional !== undefined),
    hasStrategy: trades.some((t) => t.strategy !== undefined),
    hasPortfolio: trades.some((t) => t.portfolio !== undefined),
  };
}

// ─── CSV export ───────────────────────────────────────────────────────────────

export function exportToCsv(trades: TradeRow[], filename = 'trades-export.csv'): void {
  const headers = [
    'Date',
    'Ticker',
    'Action',
    'Price',
    'Quantity',
    'Notional',
    'Strategy',
    'Portfolio',
  ];

  const escapeCell = (v: string | number | undefined): string => {
    if (v === undefined || v === null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const rows = trades.map((t) =>
    [
      t.dateStr,
      t.ticker,
      t.action,
      t.price,
      t.quantity,
      t.notional,
      t.strategy,
      t.portfolio,
    ]
      .map(escapeCell)
      .join(','),
  );

  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
