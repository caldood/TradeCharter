export interface TradeRow {
  date: Date;
  dateStr: string;
  ticker: string;
  action: 'Add' | 'Trim';
  price: number;
  quantity?: number;
  notional?: number;
  strategy?: string;
  portfolio?: string;
  rawRow: number;
}

export interface ParsedResult {
  trades: TradeRow[];
  errors: ValidationError[];
  warnings: string[];
  skippedRows: number;
  columnMapping: Partial<Record<CanonicalColumn, string>>;
  hasQuantity: boolean;
  hasNotional: boolean;
  hasStrategy: boolean;
  hasPortfolio: boolean;
}

export type CanonicalColumn =
  | 'date'
  | 'ticker'
  | 'action'
  | 'price'
  | 'quantity'
  | 'notional'
  | 'strategy'
  | 'portfolio';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
  value?: unknown;
}

export interface FilterState {
  ticker: string;
  action: 'All' | 'Add' | 'Trim';
  strategy: string;
  portfolio: string;
}

export type ChartMode = 'scatter' | 'line';
