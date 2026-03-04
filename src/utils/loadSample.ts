import type { ParsedResult, TradeRow } from '../types';

interface SampleTrade {
  date: string;
  ticker: string;
  action: string;
  price: number;
  quantity: number;
  notional: number;
  strategy: string;
  portfolio: string;
}

export async function loadSampleFromServer(): Promise<ParsedResult> {
  const resp = await fetch('/api/sample');
  if (!resp.ok) throw new Error('Could not reach server. Run: npm run serve');

  const { trades: raw } = (await resp.json()) as { trades: SampleTrade[] };

  const trades: TradeRow[] = raw.map((r, i) => ({
    date: new Date(r.date),
    dateStr: r.date,
    ticker: r.ticker.toUpperCase(),
    action: r.action === 'Add' ? 'Add' : 'Trim',
    price: r.price,
    quantity: r.quantity,
    notional: r.notional,
    strategy: r.strategy,
    portfolio: r.portfolio,
    rawRow: i + 2,
  }));

  trades.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    trades,
    errors: [],
    warnings: [],
    skippedRows: 0,
    columnMapping: {
      date: 'Date', ticker: 'Ticker', action: 'Action', price: 'Price',
      quantity: 'Quantity', notional: 'Notional', strategy: 'Strategy', portfolio: 'Portfolio',
    },
    hasQuantity: true,
    hasNotional: true,
    hasStrategy: true,
    hasPortfolio: true,
  };
}
