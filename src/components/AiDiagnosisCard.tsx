import React from 'react';
import { Sparkles, ArrowRight, CheckCircle, AlertOctagon, RefreshCw, Lightbulb, ShieldAlert, Cpu } from 'lucide-react';
import type { DiagnosisResult, ApiTestRequest } from '../types.ts';

interface AiDiagnosisCardProps {
  diagnosis: DiagnosisResult;
  onApplyFixAndRetest: (suggestedRequest: ApiTestRequest) => void;
  isRetesting: boolean;
}

export const AiDiagnosisCard: React.FC<AiDiagnosisCardProps> = ({
  diagnosis,
  onApplyFixAndRetest,
  isRetesting
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'AUTHENTICATION':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'VALIDATION':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RESOURCE_NOT_FOUND':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'SERVER_CRASH':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="w-full bg-slate-900 border-2 border-amber-500/30 rounded-2xl p-4 my-2 shadow-xl shadow-amber-950/20 relative overflow-hidden">
      {/* Glow highlight */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <Sparkles className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100">AI Senior Developer Diagnosis</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border shrink-0 whitespace-nowrap ${getCategoryColor(diagnosis.likelyCategory)}`}>
                {diagnosis.likelyCategory}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Automated root-cause analysis via Spring Boot AI Orchestrator</p>
          </div>
        </div>
      </div>

      {/* Root Cause & Explanation */}
      <div className="mt-3 space-y-2">
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-amber-400/90 mb-1 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            Detected Root Cause:
          </div>
          <div className="text-xs font-semibold text-slate-200">
            {diagnosis.rootCause}
          </div>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            {diagnosis.explanation}
          </p>
        </div>

        {/* Suggested Fix Summary */}
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-emerald-400" />
            AI Proposed Solution:
          </div>
          <p className="text-xs text-slate-300 font-medium leading-relaxed">
            {diagnosis.suggestedFixSummary}
          </p>
        </div>

        {/* Visual Parameter Diff */}
        {diagnosis.diffSummary && diagnosis.diffSummary.length > 0 && (
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2 block">
              Parameter Correction Diff:
            </span>
            <div className="space-y-2 font-mono text-xs">
              {diagnosis.diffSummary.map((diff, idx) => (
                <div key={idx} className="bg-slate-900/90 p-2 rounded-lg border border-slate-800/80">
                  <div className="text-[10px] text-amber-400 font-semibold mb-1">
                    TARGET: {diff.field}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-1.5 rounded truncate">
                      <span className="text-[9px] text-rose-400 block font-sans">ORIGINAL:</span>
                      {diff.original}
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-1.5 rounded truncate">
                      <span className="text-[9px] text-emerald-400 block font-sans">AI FIX:</span>
                      {diff.suggested}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 font-sans">
                    &bull; {diff.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Recommended Tests */}
        {diagnosis.nextRecommendedTests && diagnosis.nextRecommendedTests.length > 0 && (
          <div className="px-1 py-1">
            <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
              AI Next Test Suggestions:
            </span>
            <div className="flex flex-wrap gap-1">
              {diagnosis.nextRecommendedTests.map((rec, i) => (
                <span key={i} className="text-[10px] bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/60">
                  &bull; {rec}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Button: Retest */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400 hidden sm:block">
          Execute fix automatically to complete closed-loop cycle
        </div>
        <button
          id="apply-fix-retest-btn"
          type="button"
          onClick={() => onApplyFixAndRetest(diagnosis.suggestedRequest)}
          disabled={isRetesting}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {isRetesting ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Executing Retest Engine...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
              <span>Apply Fix & Retest Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
