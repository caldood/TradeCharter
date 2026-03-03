import type { CanonicalColumn } from '../types';

/** Strip, lowercase, remove all non-alphanumeric chars */
export function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Map of normalized key → canonical column name */
const COLUMN_ALIASES: Record<string, CanonicalColumn> = {
  // date
  date: 'date',
  tradedate: 'date',
  tradedatetime: 'date',
  datetime: 'date',
  transactiondate: 'date',
  settlementdate: 'date',
  executiondate: 'date',
  filldate: 'date',

  // ticker
  ticker: 'ticker',
  symbol: 'ticker',
  stock: 'ticker',
  instrument: 'ticker',
  security: 'ticker',
  isin: 'ticker',
  cusip: 'ticker',
  name: 'ticker',

  // action
  action: 'action',
  side: 'action',
  buysell: 'action',
  direction: 'action',
  type: 'action',
  tradetype: 'action',
  transactiontype: 'action',
  ordtype: 'action',

  // price
  price: 'price',
  tradeprice: 'price',
  executionprice: 'price',
  fillprice: 'price',
  avgprice: 'price',
  averageprice: 'price',
  unitprice: 'price',

  // quantity
  quantity: 'quantity',
  qty: 'quantity',
  shares: 'quantity',
  units: 'quantity',
  volume: 'quantity',
  size: 'quantity',
  fillqty: 'quantity',

  // notional
  notional: 'notional',
  notionalvalue: 'notional',
  value: 'notional',
  tradevalue: 'notional',
  principal: 'notional',
  grossvalue: 'notional',
  amount: 'notional',

  // strategy
  strategy: 'strategy',
  strategyname: 'strategy',
  book: 'strategy',
  desk: 'strategy',

  // portfolio
  portfolio: 'portfolio',
  fund: 'portfolio',
  account: 'portfolio',
  accountname: 'portfolio',
  fundname: 'portfolio',
};

/**
 * Given a list of raw header strings, return a mapping from canonical name → original header.
 * First match wins (leftmost column wins for duplicates).
 */
export function normalizeHeaders(
  headers: string[],
): Partial<Record<CanonicalColumn, string>> {
  const result: Partial<Record<CanonicalColumn, string>> = {};
  for (const header of headers) {
    const key = normalizeKey(header);
    const canonical = COLUMN_ALIASES[key];
    if (canonical && !(canonical in result)) {
      result[canonical] = header;
    }
  }
  return result;
}

/** Normalize action strings → 'Add' | 'Trim' */
const ACTION_MAP: Record<string, 'Add' | 'Trim'> = {
  add: 'Add',
  buy: 'Add',
  bought: 'Add',
  long: 'Add',
  purchase: 'Add',
  increase: 'Add',

  trim: 'Trim',
  sell: 'Trim',
  sold: 'Trim',
  short: 'Trim',
  reduce: 'Trim',
  decrease: 'Trim',
  close: 'Trim',
};

export function normalizeAction(raw: string): 'Add' | 'Trim' | null {
  const key = raw.trim().toLowerCase().replace(/[^a-z]/g, '');
  return ACTION_MAP[key] ?? null;
}
