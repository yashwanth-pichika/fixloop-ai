import React, { useState } from 'react';
import { Sparkles, Play, Shield, AlertTriangle, CheckCircle, Sliders, ChevronRight } from 'lucide-react';
import type { GeneratedTestCase, ApiTestRequest } from '../types.ts';

interface TestSuiteGeneratorProps {
  currentEndpoint: string;
  currentMethod: string;
  currentBody?: string;
  onExecuteTestCase: (request: ApiTestRequest) => void;
}

export const TestSuiteGenerator: React.FC<TestSuiteGeneratorProps> = ({
  currentEndpoint,
  currentMethod,
  currentBody,
  onExecuteTestCase
}) => {
  const [cases, setCases] = useState<GeneratedTestCase[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const generateTestSuite = async () => {
    setIsGenerating(true);
    setIsOpen(true);
    try {
      const res = await fetch('/api/generate-test-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: currentEndpoint,
          method: currentMethod,
          sampleBody: currentBody
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getTypeBadge = (type: GeneratedTestCase['type']) => {
    switch (type) {
      case 'positive':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'missing_fields':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'auth':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'boundary':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 my-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-100">AI Test Suite Generator</h3>
            <p className="text-[11px] text-slate-400">
              Positive, negative, boundary, and auth matrices
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={generateTestSuite}
          disabled={isGenerating}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? (
            <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>{cases.length > 0 ? 'Regenerate Suite' : 'Generate Matrix'}</span>
        </button>
      </div>

      {/* Test Matrix List */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2">
          {cases.length === 0 && !isGenerating && (
            <div className="text-center py-4 text-xs text-slate-500">
              Click 'Generate Matrix' to construct automated boundary and security tests.
            </div>
          )}

          {cases.map((tc) => (
            <div
              key={tc.id}
              className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${getTypeBadge(tc.type)} uppercase`}>
                    {tc.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {tc.title}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {tc.description}
                </p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Expects: <span className="text-amber-400/80">{tc.expectedOutcome}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onExecuteTestCase(tc.request)}
                className="self-end sm:self-center px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all group shrink-0 active:scale-95"
              >
                <span>Run Test</span>
                <Play className="w-3 h-3 text-amber-400 group-hover:text-slate-950" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
