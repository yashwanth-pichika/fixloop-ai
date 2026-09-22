import React from 'react';
import { X, Smartphone, Server, BrainCircuit, ArrowRight, Zap, RefreshCw, Database, Terminal, Shield, CheckCircle } from 'lucide-react';

interface ArchitectureModalProps {
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl p-5 sm:p-6 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto scrollbar-thin">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Hackathon MVP Architecture
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 mt-1">
              FixLoop AI — System Architecture
            </h2>
            <p className="text-xs text-slate-400">
              iQOO Smartphone + Android &bull; Spring Boot Backend &bull; Hosted / Local AI Orchestrator
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hackathon Pitch Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/30">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
            Official Hackathon Pitch:
          </span>
          <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
            "FixLoop AI transforms an iQOO smartphone into an intelligent API debugging companion. Developers can describe API tests naturally using voice, scan API documentation with the camera, execute requests, receive AI-powered failure analysis, generate fixes, and automatically retest — turning API debugging from a manual process into an intelligent, conversational workflow."
          </p>
        </div>

        {/* Interactive Architecture Flow Diagram */}
        <div className="mt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
            1. High-Level Pipeline
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-1.5 shadow-sm">
              <Smartphone className="w-6 h-6 text-amber-400" />
              <span className="font-bold text-slate-200">iQOO Device</span>
              <span className="text-[10px] text-slate-500">Android App / Mic / Cam</span>
            </div>

            <div className="hidden sm:flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-1.5 shadow-sm">
              <Server className="w-6 h-6 text-cyan-400" />
              <span className="font-bold text-slate-200">Spring Boot API</span>
              <span className="text-[10px] text-slate-500">Orchestrator & Controllers</span>
            </div>

            <div className="hidden sm:flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-slate-600" />
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center gap-1.5 shadow-sm">
              <BrainCircuit className="w-6 h-6 text-purple-400" />
              <span className="font-bold text-slate-200">AI Engine</span>
              <span className="text-[10px] text-slate-500">Diagnosis, Fix & Retest</span>
            </div>
          </div>
        </div>

        {/* Core Loop Step-by-Step */}
        <div className="mt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
            2. Core Innovation: Closed-Loop API Debugging
          </span>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-amber-400/90 overflow-x-auto whitespace-nowrap mb-3">
            Natural Language → Intent → Request → Execute → Analyze → Diagnose → Fix → Retest → Verify
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-amber-400 font-mono">1</span>
                Voice / Natural Language
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Developer speaks e.g., "Test login with an invalid password". Web Speech & Command Service converts to structured JSON test request.
              </p>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-cyan-400 font-mono">2</span>
                Execution Engine
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Executes request against Target REST API (or Controlled Demo APIs) capturing status, headers, response body, and millisecond latency.
              </p>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-purple-400 font-mono">3</span>
                AI Analysis & Diagnosis
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Explains error reasons (400, 401, 403, 404, 422, 500) and produces exact parameter diffs and corrected request payload.
              </p>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-emerald-400 font-mono">4</span>
                Retest & Verification
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Retest Engine runs corrected request, contrasts results with original failure, and proves whether the issue is resolved.
              </p>
            </div>
          </div>
        </div>

        {/* Priority Matrix Table */}
        <div className="mt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
            3. Implementation Priority Status
          </span>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="p-2.5">Priority</th>
                  <th className="p-2.5">Feature Specification</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="p-2.5 font-bold text-amber-400 font-mono">P0 (Must Work)</td>
                  <td className="p-2.5">API Execution &rarr; AI Diagnosis &rarr; Generated Fix &rarr; Automatic Retest &rarr; Result</td>
                  <td className="p-2.5 text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Fully Operational
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-cyan-400 font-mono">P1</td>
                  <td className="p-2.5">Voice commands via iQOO mic & simple test history with health metrics</td>
                  <td className="p-2.5 text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Fully Operational
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold text-purple-400 font-mono">P2</td>
                  <td className="p-2.5">Camera / Document OCR, AI Test matrix generation, and controlled sandbox APIs</td>
                  <td className="p-2.5 text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Fully Operational
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs active:scale-95 transition-all shadow-md shadow-amber-500/20"
          >
            Close & Start Testing
          </button>
        </div>
      </div>
    </div>
  );
};
