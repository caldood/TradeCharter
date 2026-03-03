import { useEffect, useRef, useMemo } from 'react';

// ECharts tree-shaking imports
import { init, use, type EChartsType } from 'echarts/core';
import { ScatterChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// EChartsOption from the core package
import type { EChartsOption } from 'echarts';
import type { TradeRow, ChartMode } from '../types';
import { formatDate, formatPrice, formatNumber, formatCompact } from '../utils/formatters';

// Register only what we use
use([
  ScatterChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

interface TradeChartProps {
  trades: TradeRow[];
  mode: ChartMode;
  onModeChange: (m: ChartMode) => void;
  hasQuantity: boolean;
  hasNotional: boolean;
}

// ─── Sizing ────────────────────────────────────────────────────────────────────

function calcSize(qty: number | undefined, notional: number | undefined, maxSizeVal: number): number {
  const v = notional ?? qty;
  if (!v || maxSizeVal === 0) return 10;
  const ratio = Math.abs(v) / maxSizeVal;
  return Math.round(7 + Math.log1p(ratio * 10) * 5);
}

function getMaxSizeVal(trades: TradeRow[]): number {
  return Math.max(
    ...trades.map((t) => Math.abs(t.notional ?? t.quantity ?? 0)),
    1,
  );
}

// ─── Tooltip formatter ────────────────────────────────────────────────────────

function buildTooltip(trade: TradeRow): string {
  const color = trade.action === 'Add' ? '#10B981' : '#F97316';
  const arrow = trade.action === 'Add' ? '▲' : '▼';

  const rows: [string, string][] = [
    ['Date', formatDate(trade.date)],
    ['Ticker', trade.ticker],
    ['Action', `<span style="color:${color};font-weight:700">${arrow} ${trade.action}</span>`],
    ['Price', formatPrice(trade.price)],
  ];
  if (trade.quantity !== undefined) rows.push(['Quantity', formatNumber(trade.quantity)]);
  if (trade.notional !== undefined) rows.push(['Notional', formatCompact(trade.notional)]);
  if (trade.strategy) rows.push(['Strategy', trade.strategy]);
  if (trade.portfolio) rows.push(['Portfolio', trade.portfolio]);

  const inner = rows
    .map(
      ([k, v]) =>
        `<div style="display:flex;justify-content:space-between;gap:16px;margin:2px 0">
          <span style="color:#6B7280;font-size:11px">${k}</span>
          <span style="color:#111827;font-size:11px;font-weight:500">${v}</span>
        </div>`,
    )
    .join('');

  return `<div style="font-family:Inter,system-ui,sans-serif;padding:2px 0;min-width:180px">${inner}</div>`;
}

// ─── ECharts option builder ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySeriesOption = Record<string, any>;

function buildOption(trades: TradeRow[], mode: ChartMode): EChartsOption {
  if (trades.length === 0) return {};

  const maxSizeVal = getMaxSizeVal(trades);

  const addTrades = trades.filter((t) => t.action === 'Add');
  const trimTrades = trades.filter((t) => t.action === 'Trim');

  const toScatterPoint = (t: TradeRow) => ({
    value: [t.date.getTime(), t.price, t.quantity, t.notional],
    symbolSize: calcSize(t.quantity, t.notional, maxSizeVal),
    trade: t,
  });

  const tickers = [...new Set(trades.map((t) => t.ticker))];

  const lineSeries: AnySeriesOption[] =
    mode === 'line'
      ? tickers.map((ticker) => ({
          name: `${ticker}__line`,
          type: 'line',
          smooth: false,
          showSymbol: false,
          silent: true,
          lineStyle: { color: '#CBD5E1', width: 1.5, type: 'dashed' },
          data: trades
            .filter((t) => t.ticker === ticker)
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .map((t) => [t.date.getTime(), t.price]),
          z: 0,
        }))
      : [];

  return {
    animation: trades.length < 5000,
    backgroundColor: '#FFFFFF',
    grid: { left: 72, right: 24, top: 48, bottom: 64, containLabel: false },
    legend: {
      show: true,
      data: [
        { name: 'Add', icon: 'path://M0,-8 L7,4 L-7,4 Z' },
        { name: 'Trim', icon: 'path://M0,8 L7,-4 L-7,-4 Z' },
      ],
      top: 10,
      right: 16,
      textStyle: { color: '#374151', fontSize: 12, fontFamily: 'Inter, system-ui, sans-serif' },
      itemGap: 16,
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.97)',
      borderColor: '#E5E7EB',
      borderWidth: 1,
      padding: [10, 14],
      extraCssText: 'box-shadow: 0 4px 6px -1px rgba(0,0,0,.07); border-radius: 8px;',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
        const data = params?.data as { trade?: TradeRow } | undefined;
        if (!data?.trade) return '';
        return buildTooltip(data.trade);
      },
    },
    xAxis: {
      type: 'time',
      boundaryGap: ['5%', '5%'],
      axisLine: { lineStyle: { color: '#D1D5DB' } },
      axisTick: { lineStyle: { color: '#D1D5DB' } },
      splitLine: { show: true, lineStyle: { color: '#F3F4F6', type: 'solid' } },
      axisLabel: {
        color: '#6B7280',
        fontSize: 11,
        fontFamily: 'Inter, system-ui, sans-serif',
        hideOverlap: true,
      },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#F3F4F6' } },
      axisLabel: {
        color: '#6B7280',
        fontSize: 11,
        fontFamily: 'Inter, system-ui, sans-serif',
        formatter: (v: number) => {
          if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
          return `$${v.toFixed(v < 10 ? 2 : 0)}`;
        },
      },
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'empty',
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        height: 24,
        bottom: 8,
        borderColor: '#E5E7EB',
        fillerColor: 'rgba(37,99,235,0.08)',
        handleStyle: { color: '#2563EB', borderColor: '#2563EB' },
        moveHandleStyle: { color: '#2563EB' },
        selectedDataBackground: {
          lineStyle: { color: '#2563EB' },
          areaStyle: { color: '#2563EB' },
        },
        textStyle: { color: '#9CA3AF', fontSize: 10 },
        showDetail: false,
        filterMode: 'empty',
      },
    ],
    series: [
      ...lineSeries,
      {
        name: 'Add',
        type: 'scatter',
        symbol: 'triangle',
        symbolRotate: 0,
        data: addTrades.map(toScatterPoint),
        itemStyle: { color: '#10B981', borderColor: '#047857', borderWidth: 1, opacity: 0.88 },
        emphasis: {
          itemStyle: { opacity: 1, borderWidth: 2, shadowBlur: 6, shadowColor: 'rgba(16,185,129,0.4)' },
          scale: 1.3,
        },
        z: 10,
      },
      {
        name: 'Trim',
        type: 'scatter',
        symbol: 'triangle',
        symbolRotate: 180,
        data: trimTrades.map(toScatterPoint),
        itemStyle: { color: '#F97316', borderColor: '#C2410C', borderWidth: 1, opacity: 0.88 },
        emphasis: {
          itemStyle: { opacity: 1, borderWidth: 2, shadowBlur: 6, shadowColor: 'rgba(249,115,22,0.4)' },
          scale: 1.3,
        },
        z: 10,
      },
    ],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TradeChart({ trades, mode, onModeChange, hasQuantity, hasNotional }: TradeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<EChartsType | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const instance = init(containerRef.current, undefined, { renderer: 'canvas' });
    chartRef.current = instance;

    const onResize = () => instance.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      instance.dispose();
      chartRef.current = null;
    };
  }, []);

  const option = useMemo(() => buildOption(trades, mode), [trades, mode]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.setOption(option, { notMerge: true });
  }, [option]);

  const hasSizeInfo = hasQuantity || hasNotional;
  const sizeLabel = hasNotional ? 'notional' : 'quantity';
  const isEmpty = trades.length === 0;

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border-light">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-text-primary">Trade Chart</h3>
          {hasSizeInfo && (
            <span className="text-xs text-text-muted">Marker size scales with {sizeLabel}</span>
          )}
        </div>
        <ModeToggle mode={mode} onChange={onModeChange} />
      </div>

      <div className="flex items-center gap-4 px-5 pt-3 pb-1">
        <LegendBadge color="#10B981" icon="▲" label="Add" />
        <LegendBadge color="#F97316" icon="▼" label="Trim" />
        <span className="text-xs text-text-muted ml-auto">Scroll to zoom · drag to pan</span>
      </div>

      <div className="relative" style={{ height: 420 }}>
        <div ref={containerRef} className="absolute inset-0" role="img" aria-label="Trade scatter chart" />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center text-text-muted text-sm">
            No trades match the current filters
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ModeToggle({ mode, onChange }: { mode: ChartMode; onChange: (m: ChartMode) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border overflow-hidden text-xs font-medium">
      <ToggleBtn active={mode === 'scatter'} onClick={() => onChange('scatter')}>
        Trades only
      </ToggleBtn>
      <ToggleBtn active={mode === 'line'} onClick={() => onChange('line')}>
        With price line
      </ToggleBtn>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`px-3 py-1.5 transition-colors ${
        active ? 'bg-accent text-white' : 'bg-white text-text-secondary hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function LegendBadge({ color, icon, label }: { color: string; icon: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span style={{ color }} className="text-sm font-bold leading-none">
        {icon}
      </span>
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}
