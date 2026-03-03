import { useRef, useState, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { downloadSampleTemplate } from '../utils/generateSampleData';

interface UploadCardProps {
  onFile: (file: File) => void;
  isLoading: boolean;
}

const ACCEPTED = '.xlsx,.xls,.csv';

export function UploadCard({ onFile, isLoading }: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file) return;
      onFile(file);
    },
    [onFile],
  );

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = '';
    },
    [handleFile],
  );

  return (
    <div className="max-w-2xl mx-auto mt-8 space-y-6">
      {/* Hero text */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-text-primary mb-2">Visualize your trades</h2>
        <p className="text-text-secondary text-sm max-w-md mx-auto">
          Upload an Excel (.xlsx) or CSV file containing trade data and instantly explore
          interactive charts — entirely in your browser.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`card p-10 flex flex-col items-center gap-4 cursor-pointer
          border-2 border-dashed transition-all duration-150
          ${isDragging
            ? 'border-accent bg-blue-50/60 shadow-card-hover'
            : 'border-border hover:border-accent/50 hover:shadow-card-hover'
          }
          ${isLoading ? 'pointer-events-none opacity-60' : ''}
        `}
        onClick={() => inputRef.current?.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        aria-label="Upload trade file"
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={onInputChange}
          aria-hidden="true"
        />

        {isLoading ? (
          <Spinner />
        ) : (
          <UploadIcon isDragging={isDragging} />
        )}

        <div className="text-center">
          {isLoading ? (
            <p className="text-sm text-text-secondary font-medium">Parsing file…</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-text-primary">
                {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
              </p>
              <p className="text-xs text-text-muted mt-1">
                or <span className="text-accent font-medium">browse to upload</span>
              </p>
              <p className="text-xs text-text-muted mt-2">Supports .xlsx, .xls, .csv — up to 50k rows</p>
            </>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <button
          className="btn-secondary text-xs"
          onClick={(e) => {
            e.stopPropagation();
            downloadSampleTemplate();
          }}
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          Download sample template
        </button>
      </div>

      {/* Schema info */}
      <div className="card p-5">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
          Expected column schema
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-light">
                <th className="pb-2 text-left text-text-muted font-medium w-1/4">Column</th>
                <th className="pb-2 text-left text-text-muted font-medium w-1/6">Required</th>
                <th className="pb-2 text-left text-text-muted font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {SCHEMA_ROWS.map(({ col, req, notes }) => (
                <tr key={col}>
                  <td className="py-1.5 font-mono text-text-primary font-medium">{col}</td>
                  <td className="py-1.5">
                    {req ? (
                      <span className="text-accent font-semibold">Required</span>
                    ) : (
                      <span className="text-text-muted">Optional</span>
                    )}
                  </td>
                  <td className="py-1.5 text-text-secondary">{notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Column names are case-insensitive and tolerant to minor variations (e.g. "Trade Date",
          "tradedate", "TRADE DATE" are all matched).
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function UploadIcon({ isDragging }: { isDragging: boolean }) {
  return (
    <div
      className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all
        ${isDragging ? 'bg-accent text-white scale-110' : 'bg-blue-50 text-accent'}`}
    >
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1" />
        <polyline points="16 12 12 8 8 12" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="8" x2="12" y2="21" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function Spinner() {
  return (
    <div className="w-16 h-16 flex items-center justify-center">
      <svg className="animate-spin w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
    </div>
  );
}

const SCHEMA_ROWS = [
  { col: 'Date', req: true, notes: 'Trade date — ISO, US, or Excel serial format' },
  { col: 'Ticker', req: false, notes: 'Security symbol (e.g. AAPL, MSFT)' },
  { col: 'Action', req: true, notes: '"Add" or "Buy" to buy; "Trim" or "Sell" to sell' },
  { col: 'Price', req: true, notes: 'Execution price (numeric)' },
  { col: 'Quantity', req: false, notes: 'Number of shares/units — scales marker size' },
  { col: 'Notional', req: false, notes: 'Trade value in dollars — scales marker size' },
  { col: 'Strategy', req: false, notes: 'Enables Strategy filter dropdown' },
  { col: 'Portfolio', req: false, notes: 'Enables Portfolio filter dropdown' },
];
