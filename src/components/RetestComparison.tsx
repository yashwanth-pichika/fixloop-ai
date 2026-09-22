import React from 'react';
import { CheckCircle2, XCircle, ArrowRight, Zap, Clock, ShieldCheck } from 'lucide-react';
import type { RetestResult } from '../types.ts';

interface RetestComparisonProps {
  retest: RetestResult;
  onDismiss: () => void;
}

export const RetestComparison: React.FC<RetestComparisonProps> = ({ retest, onDismiss }) => {
  const { originalExecution, retestExecution, isResolved, resolutionSummary, latencyDiffMs } = retest;

  return (
    <div className={`w-full rounded-2xl p-4 my-2 border-2 transition-all shadow-2xl relative overflow-hidden ${
      isResolved
        ? 'bg-slate-900 border-emerald-500/50 shadow-emerald-950/30'
        : 'bg-slate-900 border-amber-500/50 shadow-amber-950/30'
    }`}>
      {/* Background radial glow */}
      <div className={`absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl pointer-events-none ${
        isResolved ? 'bg-emerald-500/15' : 'bg-amber-500/15'
      }`} />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-xl text-slate-950 font-bold ${
            isResolved ? 'bg-emerald-400' : 'bg-amber-400'
          }`}>
            {isResolved ? (
              <ShieldCheck className="w-4 h-4 text-slate-950" />
            ) : (
              <Zap className="w-4 h-4 text-slate-950" />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">
                Closed-Loop Verification Result
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0 whitespace-nowrap ${
                isResolved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {isResolved ? 'Issue Resolved' : 'Retest Completed'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Side-by-side comparison of original failure vs corrected retest
            </p>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors"
        >
          Dismiss
        </button>
      </div>

      {/* Resolution Summary Banner */}
      <div className={`mt-3 p-3 rounded-xl border flex items-start gap-2.5 ${
        isResolved
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
          : 'bg-slate-950 border-slate-800 text-slate-300'
      }`}>
        <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${isResolved ? 'text-emerald-400' : 'text-slate-400'}`} />
        <div className="text-xs leading-relaxed font-medium">
          {resolutionSummary}
        </div>
      </div>

      {/* Comparison Grid */}
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Previous Failure Box */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-rose-500/20 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              1. Original Failure
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {originalExecution.responseTimeMs} ms
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-rose-400">
              {originalExecution.status}
            </span>
            <span className="text-xs text-slate-400 truncate">
              {originalExecution.statusText}
            </span>
          </div>

          <div className="text-[11px] font-mono text-rose-300/80 bg-rose-950/20 p-2 rounded border border-rose-900/30 max-h-24 overflow-y-auto scrollbar-none">
            {typeof originalExecution.body === 'object'
              ? JSON.stringify(originalExecution.body, null, 2)
              : originalExecution.rawBody}
          </div>
        </div>

        {/* Retest Success Box */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-500/30 flex flex-col gap-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              2. Corrected Retest
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {retestExecution.responseTimeMs} ms
              {latencyDiffMs !== 0 && (
                <span className="text-[9px] text-slate-400">
                  ({latencyDiffMs > 0 ? `+${latencyDiffMs}` : latencyDiffMs}ms)
                </span>
              )}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-emerald-400">
              {retestExecution.status}
            </span>
            <span className="text-xs text-slate-300 truncate">
              {retestExecution.statusText}
            </span>
          </div>

          <div className="text-[11px] font-mono text-emerald-300/90 bg-emerald-950/20 p-2 rounded border border-emerald-900/30 max-h-24 overflow-y-auto scrollbar-none">
            {typeof retestExecution.body === 'object'
              ? JSON.stringify(retestExecution.body, null, 2)
              : retestExecution.rawBody}
          </div>
        </div>
      </div>
    </div>
  );
};
