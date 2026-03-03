import { useState } from 'react';
import type { ValidationError } from '../types';

interface ErrorPanelProps {
  errors: ValidationError[];
  warnings: string[];
}

export function ErrorPanel({ errors, warnings }: ErrorPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  const visibleErrors = expanded ? errors : errors.slice(0, 5);

  return (
    <div
      className={`card border-l-4 p-4 space-y-2
        ${hasErrors ? 'border-amber-400 bg-amber-50/60' : 'border-blue-300 bg-blue-50/60'}`}
    >
      {/* Warnings */}
      {hasWarnings && (
        <div className="flex items-start gap-2">
          <span className="text-amber-500 mt-0.5">⚠</span>
          <div className="text-sm text-amber-800 space-y-0.5">
            {warnings.map((w, i) => (
              <p key={i}>{w}</p>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {hasErrors && (
        <div>
          <p className="text-xs font-semibold text-amber-700 mb-1.5">
            Parse errors ({errors.length} row{errors.length !== 1 ? 's' : ''} skipped):
          </p>
          <ul className="space-y-0.5">
            {visibleErrors.map((e, i) => (
              <li key={i} className="text-xs text-amber-700">
                <span className="font-medium">Row {e.row}</span> [{e.field}]: {e.message}
              </li>
            ))}
          </ul>
          {errors.length > 5 && (
            <button
              className="text-xs text-amber-600 underline mt-1.5"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? 'Show less' : `Show ${errors.length - 5} more…`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
