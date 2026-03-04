/**
 * Dev server: serves dist/ as static files + /api/sample endpoint.
 * Run with:  npm run serve
 *            (or: npx tsx scripts/server.ts)
 * Then open: http://localhost:3001
 */
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(__dirname, '../dist');
const PORT = Number(process.env.PORT ?? 3001);

// ─── Sample trade data ────────────────────────────────────────────────────────

const SAMPLE_TRADES = [
  { date: '2024-01-05', ticker: 'AAPL', action: 'Add',  price: 185.50, quantity: 100, notional: 18550,    strategy: 'Growth', portfolio: 'Fund A' },
  { date: '2024-01-12', ticker: 'MSFT', action: 'Add',  price: 374.20, quantity:  50, notional: 18710,    strategy: 'Value',  portfolio: 'Fund A' },
  { date: '2024-01-18', ticker: 'AAPL', action: 'Trim', price: 191.30, quantity:  50, notional:  9565,    strategy: 'Growth', portfolio: 'Fund A' },
  { date: '2024-01-25', ticker: 'NVDA', action: 'Add',  price: 613.75, quantity:  80, notional: 49100,    strategy: 'Growth', portfolio: 'Fund B' },
  { date: '2024-02-02', ticker: 'GOOGL',action: 'Add',  price: 141.80, quantity: 120, notional: 17016,    strategy: 'Value',  portfolio: 'Fund A' },
  { date: '2024-02-09', ticker: 'MSFT', action: 'Trim', price: 407.10, quantity:  25, notional: 10177.5,  strategy: 'Value',  portfolio: 'Fund A' },
  { date: '2024-02-15', ticker: 'AAPL', action: 'Add',  price: 184.20, quantity: 150, notional: 27630,    strategy: 'Growth', portfolio: 'Fund A' },
  { date: '2024-02-22', ticker: 'NVDA', action: 'Add',  price: 788.17, quantity:  40, notional: 31526.8,  strategy: 'Growth', portfolio: 'Fund B' },
  { date: '2024-03-01', ticker: 'GOOGL',action: 'Trim', price: 153.90, quantity:  60, notional:  9234,    strategy: 'Value',  portfolio: 'Fund A' },
  { date: '2024-03-08', ticker: 'AAPL', action: 'Trim', price: 169.00, quantity: 100, notional: 16900,    strategy: 'Growth', portfolio: 'Fund A' },
  { date: '2024-03-15', ticker: 'MSFT', action: 'Add',  price: 415.50, quantity:  75, notional: 31162.5,  strategy: 'Value',  portfolio: 'Fund A' },
  { date: '2024-03-22', ticker: 'NVDA', action: 'Trim', price: 878.36, quantity:  30, notional: 26350.8,  strategy: 'Growth', portfolio: 'Fund B' },
  { date: '2024-04-01', ticker: 'META', action: 'Add',  price: 527.19, quantity:  35, notional: 18451.65, strategy: 'Growth', portfolio: 'Fund B' },
  { date: '2024-04-10', ticker: 'AAPL', action: 'Add',  price: 171.19, quantity: 200, notional: 34238,    strategy: 'Growth', portfolio: 'Fund A' },
  { date: '2024-04-18', ticker: 'GOOGL',action: 'Add',  price: 155.14, quantity:  90, notional: 13962.6,  strategy: 'Value',  portfolio: 'Fund A' },
  { date: '2024-04-25', ticker: 'META', action: 'Trim', price: 441.38, quantity:  20, notional:  8827.6,  strategy: 'Growth', portfolio: 'Fund B' },
  { date: '2024-05-03', ticker: 'NVDA', action: 'Add',  price: 762.00, quantity:  60, notional: 45720,    strategy: 'Growth', portfolio: 'Fund B' },
  { date: '2024-05-10', ticker: 'MSFT', action: 'Trim', price: 404.87, quantity:  50, notional: 20243.5,  strategy: 'Value',  portfolio: 'Fund A' },
  { date: '2024-05-17', ticker: 'AAPL', action: 'Add',  price: 189.87, quantity: 125, notional: 23733.75, strategy: 'Growth', portfolio: 'Fund A' },
  { date: '2024-05-24', ticker: 'META', action: 'Add',  price: 449.01, quantity:  45, notional: 20205.45, strategy: 'Growth', portfolio: 'Fund B' },
  { date: '2024-06-03', ticker: 'NVDA', action: 'Trim', price:1208.88, quantity:  25, notional: 30222,    strategy: 'Growth', portfolio: 'Fund B' },
  { date: '2024-06-12', ticker: 'AAPL', action: 'Add',  price: 207.15, quantity: 100, notional: 20715,    strategy: 'Growth', portfolio: 'Fund A' },
  { date: '2024-06-20', ticker: 'MSFT', action: 'Add',  price: 446.32, quantity:  60, notional: 26779.2,  strategy: 'Value',  portfolio: 'Fund A' },
  { date: '2024-07-01', ticker: 'META', action: 'Add',  price: 558.87, quantity:  30, notional: 16766.1,  strategy: 'Growth', portfolio: 'Fund B' },
  { date: '2024-07-10', ticker: 'AAPL', action: 'Trim', price: 232.98, quantity:  80, notional: 18638.4,  strategy: 'Growth', portfolio: 'Fund A' },
  { date: '2024-07-18', ticker: 'GOOGL',action: 'Add',  price: 181.44, quantity: 100, notional: 18144,    strategy: 'Value',  portfolio: 'Fund A' },
  { date: '2024-07-25', ticker: 'NVDA', action: 'Add',  price: 117.93, quantity: 200, notional: 23586,    strategy: 'Growth', portfolio: 'Fund B' },
  { date: '2024-08-05', ticker: 'AAPL', action: 'Add',  price: 209.82, quantity: 150, notional: 31473,    strategy: 'Growth', portfolio: 'Fund A' },
  { date: '2024-08-14', ticker: 'MSFT', action: 'Trim', price: 417.80, quantity:  40, notional: 16712,    strategy: 'Value',  portfolio: 'Fund A' },
  { date: '2024-08-22', ticker: 'META', action: 'Trim', price: 517.28, quantity:  25, notional: 12932,    strategy: 'Growth', portfolio: 'Fund B' },
];

// ─── MIME types ───────────────────────────────────────────────────────────────

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.csv':  'text/csv',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

// ─── Server ───────────────────────────────────────────────────────────────────

const server = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = req.url ?? '/';

  // API: sample trade data
  if (url === '/api/sample') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ trades: SAMPLE_TRADES }));
    return;
  }

  // Static file serving from dist/
  const raw = url.split('?')[0];
  const filePath = resolve(DIST, raw === '/' ? 'index.html' : raw.replace(/^\//, ''));

  // Prevent directory traversal
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const target = existsSync(filePath) ? filePath : resolve(DIST, 'index.html');
  const ext = extname(target);
  const mime = MIME[ext] ?? 'application/octet-stream';

  try {
    const data = readFileSync(target);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log(`\n  Trade Plotter server running\n`);
  console.log(`  Local:   ${url}`);
  console.log(`  API:     ${url}/api/sample\n`);

  // Try to auto-open the browser
  const open =
    process.platform === 'darwin' ? 'open' :
    process.platform === 'win32'  ? 'start' :
                                    'xdg-open';
  exec(`${open} ${url}`, () => {/* ignore errors */});
});
