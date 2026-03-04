import { useState, useCallback, useMemo } from 'react';
import { UploadCard } from './components/UploadCard';
import { Filters } from './components/Filters';
import { Summary } from './components/Summary';
import { TradeChart } from './components/TradeChart';
import { DataPreview } from './components/DataPreview';
import { ErrorPanel } from './components/ErrorPanel';
import { parseExcel } from './utils/parseExcel';
import { loadSampleFromServer } from './utils/loadSample';
import type { ParsedResult, FilterState, ChartMode } from './types';

// ─── Logo / Header ────────────────────────────────────────────────────────────

function Header({ onReset }: { onReset?: () => void }) {
  return (
    <header className="bg-white border-b border-border/60 shadow-sm sticky top-0 z-40">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
        <button
          onClick={onReset}
          className="flex items-center gap-2.5 group focus:outline-none"
          aria-label="Trade Plotter home"
        >
          {/* Chart icon */}
          <svg
            className="w-6 h-6 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="text-base font-semibold text-text-primary group-hover:text-accent transition-colors">
            Trade Plotter
          </span>
        </button>

        <span className="text-xs text-text-muted hidden sm:block">
          Visualize Excel trade data in your browser — no upload required
        </span>
      </div>
    </header>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [chartMode, setChartMode] = useState<ChartMode>('scatter');

  const [filters, setFilters] = useState<FilterState>({
    ticker: 'All',
    action: 'All',
    strategy: 'All',
    portfolio: 'All',
  });

  const handleFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const parsed = await parseExcel(file);
      setResult(parsed);
      setFilters({ ticker: 'All', action: 'All', strategy: 'All', portfolio: 'All' });
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred while reading the file.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadSample = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const parsed = await loadSampleFromServer();
      setResult(parsed);
      setFilters({ ticker: 'All', action: 'All', strategy: 'All', portfolio: 'All' });
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Failed to load sample data from server.',
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setLoadError(null);
    setFilters({ ticker: 'All', action: 'All', strategy: 'All', portfolio: 'All' });
  }, []);

  const filteredTrades = useMemo(() => {
    if (!result) return [];
    return result.trades.filter((t) => {
      if (filters.ticker !== 'All' && t.ticker !== filters.ticker) return false;
      if (filters.action !== 'All' && t.action !== filters.action) return false;
      if (filters.strategy !== 'All' && t.strategy !== filters.strategy) return false;
      if (filters.portfolio !== 'All' && t.portfolio !== filters.portfolio) return false;
      return true;
    });
  }, [result, filters]);

  const showChart = result && result.trades.length > 0;

  return (
    <div className="min-h-screen bg-bg">
      <Header onReset={result ? handleReset : undefined} />

      <main className="max-w-screen-xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Load-time file error */}
        {loadError && (
          <div className="card p-4 border-l-4 border-red-400 bg-red-50">
            <p className="text-sm font-medium text-red-700">{loadError}</p>
          </div>
        )}

        {!result ? (
          /* ── Landing ── */
          <UploadCard onFile={handleFile} isLoading={isLoading} onLoadSample={handleLoadSample} />
        ) : (
          /* ── Dashboard ── */
          <div className="space-y-4">
            {/* Parse errors / warnings banner */}
            {(result.errors.length > 0 || result.warnings.length > 0) && (
              <ErrorPanel errors={result.errors} warnings={result.warnings} />
            )}

            {showChart ? (
              <>
                <Filters
                  result={result}
                  filters={filters}
                  onChange={setFilters}
                  onReset={handleReset}
                />
                <Summary trades={filteredTrades} />
                <TradeChart
                  trades={filteredTrades}
                  mode={chartMode}
                  onModeChange={setChartMode}
                  hasQuantity={result.hasQuantity}
                  hasNotional={result.hasNotional}
                />
                <DataPreview trades={filteredTrades} result={result} />
              </>
            ) : (
              /* All rows had errors */
              <div className="card p-10 text-center">
                <p className="text-text-secondary text-sm mb-3">
                  No valid trades could be parsed from this file.
                </p>
                <button className="btn-secondary" onClick={handleReset}>
                  Upload another file
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-12 mb-6 text-center text-xs text-text-muted">
        Trade Plotter &mdash; all data stays in your browser
      </footer>
    </div>
  );
}
