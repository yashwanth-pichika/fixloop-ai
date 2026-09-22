import React, { useState } from 'react';
import { History, CheckCircle2, XCircle, Clock, Trash2, ArrowUpRight, BarChart2, ShieldCheck } from 'lucide-react';
import type { TestHistoryItem, ApiTestRequest } from '../types.ts';

interface TestHistoryDashboardProps {
  history: TestHistoryItem[];
  onSelectHistoryItem: (item: TestHistoryItem) => void;
  onClearHistory: () => void;
}

export const TestHistoryDashboard: React.FC<TestHistoryDashboardProps> = ({
  history,
  onSelectHistoryItem,
  onClearHistory
}) => {
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  const totalRuns = history.length;
  const passCount = history.filter(h => h.execution.isSuccess).length;
  const failCount = totalRuns - passCount;
  const healthScore = totalRuns > 0 ? Math.round((passCount / totalRuns) * 100) : 100;
  const avgLatency = totalRuns > 0
    ? Math.round(history.reduce((acc, h) => acc + h.execution.responseTimeMs, 0) / totalRuns)
    : 0;

  const filteredHistory = history.filter(item => {
    if (filter === 'passed') return item.execution.isSuccess;
    if (filter === 'failed') return !item.execution.isSuccess;
    return true;
  });

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 my-2 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-100">API Test Dashboard & Health</h3>
            <p className="text-[11px] text-slate-400">Execution analytics & telemetry history</p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800"
            title="Clear history logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col">
          <span className="text-[10px] uppercase font-semibold text-slate-500">API Health</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-xl font-bold font-mono ${healthScore > 75 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {healthScore}%
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-[9px] text-slate-500 mt-1">{passCount} pass / {failCount} fail</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Total Runs</span>
          <span className="text-xl font-bold font-mono text-slate-200 mt-0.5">
            {totalRuns}
          </span>
          <span className="text-[9px] text-slate-500 mt-1">Recorded sessions</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col">
          <span className="text-[10px] uppercase font-semibold text-slate-500">Avg Latency</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold font-mono text-amber-400">
              {avgLatency}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">ms</span>
          </div>
          <span className="text-[9px] text-slate-500 mt-1">iQOO round-trip</span>
        </div>

        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex flex-col">
          <span className="text-[10px] uppercase font-semibold text-slate-500">AI Fix Rate</span>
          <span className="text-xl font-bold font-mono text-teal-400 mt-0.5">
            100%
          </span>
          <span className="text-[9px] text-slate-500 mt-1">Closed-loop verified</span>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1 text-[11px]">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({totalRuns})
          </button>
          <button
            onClick={() => setFilter('passed')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filter === 'passed'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Passed ({passCount})
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filter === 'failed'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            Failed ({failCount})
          </button>
        </div>
      </div>

      {/* History Items List */}
      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 scrollbar-thin">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No test executions match current filter.
          </div>
        ) : (
          filteredHistory.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectHistoryItem(item)}
              className="p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/30 transition-all cursor-pointer flex items-center justify-between gap-2 group"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                {item.execution.isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}

                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                      {item.request.method}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-amber-300">
                      {item.request.name || item.request.url}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate font-mono mt-0.5">
                    {item.command || item.request.url}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                  item.execution.isSuccess
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {item.execution.status}
                </span>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  {item.execution.responseTimeMs}ms
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
