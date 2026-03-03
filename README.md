# Trade Plotter

A production-quality, **fully client-side** web app for visualizing trade activity from Excel files.
Upload an `.xlsx` or `.csv` file and instantly explore interactive scatter charts of Add/Trim trades — no server, no data leaves your browser.

![Trade Plotter preview](https://placehold.co/900x400/F6F7F9/2563EB?text=Trade+Plotter+—+Interactive+Trade+Visualization)

## Features

| Feature | Details |
|---|---|
| **Excel / CSV parsing** | SheetJS — handles `.xlsx`, `.xls`, `.csv` |
| **Smart column detection** | Case-insensitive, punctuation-tolerant header matching |
| **Interactive chart** | ECharts scatter — upward triangle (Add), downward triangle (Trim) |
| **Marker sizing** | Scales with Quantity or Notional if provided |
| **Connecting line** | Toggle "Trades only" vs "With price line" per ticker |
| **Filters** | Ticker, Action, Strategy, Portfolio dropdowns |
| **Summary panel** | Total/Add/Trim counts, date range, min/max price |
| **Data preview** | Sortable, paginated table of parsed rows |
| **CSV export** | Download filtered trades as CSV |
| **Error handling** | Clear messages for missing columns, bad dates/prices |
| **Performance** | Handles up to ~50k rows with ECharts canvas renderer |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Generate sample .xlsx template (requires xlsx package)
npm run generate-sample
```

Open http://localhost:5173/TradeCharter/ in your browser.

## Project Structure

```
TradeCharter/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions — build & deploy to Pages
├── public/
│   ├── favicon.svg
│   └── sample-trades.csv       # Sample CSV template
├── scripts/
│   └── generateSample.ts       # CLI script to generate sample .xlsx
├── src/
│   ├── components/
│   │   ├── DataPreview.tsx     # Sortable/paginated table + CSV export
│   │   ├── ErrorPanel.tsx      # Parse error / warning display
│   │   ├── Filters.tsx         # Ticker / Action / Strategy / Portfolio filters
│   │   ├── Summary.tsx         # Stats: count, date range, price range
│   │   ├── TradeChart.tsx      # ECharts scatter/line chart
│   │   └── UploadCard.tsx      # Drag & drop file upload + schema docs
│   ├── utils/
│   │   ├── formatters.ts       # Date, price, number formatters
│   │   ├── generateSampleData.ts  # In-browser CSV template download
│   │   ├── normalizeColumns.ts # Header normalization & action mapping
│   │   └── parseExcel.ts       # SheetJS parsing, validation, CSV export
│   ├── App.tsx                 # Root component & state management
│   ├── index.css               # Tailwind base + component classes
│   ├── main.tsx                # React entry point
│   └── types.ts                # TypeScript interfaces
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

## Expected Excel Schema

The app expects a sheet named **"Trades"** (or falls back to the first sheet). Column names are **case-insensitive** and **punctuation-tolerant** — `Trade Date`, `tradedate`, and `TRADE DATE` are all matched.

| Column | Required | Accepted aliases | Notes |
|---|---|---|---|
| **Date** | ✅ | `Trade Date`, `DateTime`, `Transaction Date` | ISO, US, or Excel serial format |
| **Ticker** | — | `Symbol`, `Stock`, `Instrument` | Defaults to "UNKNOWN" if missing |
| **Action** | ✅ | `Side`, `Buy/Sell`, `Direction` | `Add`/`Buy` → Add; `Trim`/`Sell` → Trim |
| **Price** | ✅ | `Trade Price`, `Fill Price`, `Avg Price` | Numeric (removes `$`, `,`) |
| **Quantity** | — | `Qty`, `Shares`, `Units`, `Volume` | Scales marker size |
| **Notional** | — | `Notional Value`, `Value`, `Amount` | Scales marker size (preferred over Qty) |
| **Strategy** | — | `Book`, `Desk` | Enables Strategy filter |
| **Portfolio** | — | `Fund`, `Account` | Enables Portfolio filter |

### Sample Data

Download a ready-to-use template from the app's landing page, or find the CSV version at:
- `public/sample-trades.csv` — 30 trades across AAPL, MSFT, NVDA, GOOGL, META
- Run `npm run generate-sample` to produce `public/sample-trades.xlsx`

## Deployment to GitHub Pages

### One-time setup

1. **Fork or clone** this repository to your GitHub account.
2. In repository **Settings → Pages**, set:
   - Source: **GitHub Actions**
3. Push to `main` — the workflow builds and deploys automatically.

The app is deployed to: `https://<your-username>.github.io/TradeCharter/`

### Vite base path

`vite.config.ts` sets `base: '/TradeCharter/'` which matches the GitHub Pages URL path.
If you rename the repository, update this value accordingly.

### Manual deployment

```bash
npm run build
# dist/ contains the static site — deploy to any static host
```

## Design System

| Token | Value | Usage |
|---|---|---|
| Background | `#F6F7F9` | Page background |
| Card | `#FFFFFF` | Cards, panels |
| Text primary | `#111827` | Headings, values |
| Text secondary | `#6B7280` | Labels, descriptions |
| Accent | `#2563EB` | Buttons, links, focus rings |
| Add color | `#10B981` | Buy/Add markers |
| Trim color | `#F97316` | Sell/Trim markers |
| Border | `#E5E7EB` | Card borders, dividers |

Font: **Inter** (Google Fonts) with system-ui fallback.

## Technical Notes

- **No server required** — all parsing happens in the browser via SheetJS (WASM-free JS)
- **Date handling** — supports Excel serial dates, ISO strings, `MM/DD/YYYY`, and `DD/MM/YYYY`
- **Large files** — ECharts canvas renderer with animation disabled for datasets > 5k rows
- **Type safety** — strict TypeScript throughout; `TradeRow`, `ParsedResult`, `ValidationError` types
- **Scroll/zoom** — built-in ECharts dataZoom slider and mouse-wheel zoom on the chart

## License

MIT
