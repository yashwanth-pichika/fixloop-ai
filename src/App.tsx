import React, { useState, useEffect } from 'react';
import { 
  PhoneFrame 
} from './components/PhoneFrame.tsx';
import { 
  VoiceAssistant 
} from './components/VoiceAssistant.tsx';
import { 
  CameraScanner 
} from './components/CameraScanner.tsx';
import { 
  ExecutionConsole 
} from './components/ExecutionConsole.tsx';
import { 
  AiDiagnosisCard 
} from './components/AiDiagnosisCard.tsx';
import { 
  RetestComparison 
} from './components/RetestComparison.tsx';
import { 
  TestSuiteGenerator 
} from './components/TestSuiteGenerator.tsx';
import { 
  TestHistoryDashboard 
} from './components/TestHistoryDashboard.tsx';
import { 
  ArchitectureModal 
} from './components/ArchitectureModal.tsx';
import { 
  Terminal, 
  Layers, 
  BarChart3, 
  Camera, 
  Sparkles, 
  CheckCircle, 
  ArrowRight,
  Zap,
  Volume2,
  RefreshCw
} from 'lucide-react';
import type { 
  ApiTestRequest, 
  ApiExecutionResult, 
  DiagnosisResult, 
  RetestResult, 
  TestHistoryItem 
} from './types.ts';

export default function App() {
  const [isPhoneMode, setIsPhoneMode] = useState(true);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState<'console' | 'suite' | 'history'>('console');

  // Initial Demo Scenario: Invalid Password on Auth Endpoint
  const [request, setRequest] = useState<ApiTestRequest>({
    id: 'req_initial',
    name: 'Auth Login: Invalid Password Scenario',
    method: 'POST',
    url: '/api/demo/auth/login',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'developer@iqoo.dev',
      password: 'wrongpass'
    }, null, 2),
    source: 'voice',
    scenarioPrompt: 'Test login with an invalid password',
    timestamp: Date.now()
  });

  const [execution, setExecution] = useState<ApiExecutionResult | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [retest, setRetest] = useState<RetestResult | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isRetesting, setIsRetesting] = useState(false);

  const [history, setHistory] = useState<TestHistoryItem[]>([]);

  // Load history on mount
  useEffect(() => {
    fetch('/api/history')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setHistory(data);
        }
      })
      .catch(err => console.warn('Could not load history:', err));
  }, []);

  // Vocalize assistant feedback if speech synthesis is supported
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    }
  };

  // Step 1 & 2: Process Voice / NLP Command -> Convert to Request -> Execute -> Diagnose
  const handleSendCommand = async (command: string, source: 'voice' | 'natural_language') => {
    setIsLoading(true);
    setRetest(null);
    setDiagnosis(null);

    try {
      // 1. Intent / Command Service
      const resIntent = await fetch('/api/test-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, source })
      });
      const generatedReq: ApiTestRequest = await resIntent.json();
      setRequest(generatedReq);
      setActiveNavTab('console');

      // 2. Execute Request immediately (Closed-loop Step 4 & 5)
      await executeApiRequest(generatedReq, command);
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
    }
  };

  // Step 4 & 5: Execute API Request & Diagnose if error
  const executeApiRequest = async (reqToRun: ApiTestRequest, commandPrompt?: string) => {
    setIsLoading(true);
    setRetest(null);
    setDiagnosis(null);

    try {
      const res = await fetch('/api/execute-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqToRun)
      });
      const execResult: ApiExecutionResult = await res.json();
      setExecution(execResult);
      setIsLoading(false);

      // If failed response (status >= 400 or network error), auto-diagnose!
      if (!execResult.isSuccess) {
        setIsDiagnosing(true);
        const diagRes = await fetch('/api/diagnose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ request: reqToRun, execution: execResult })
        });
        const diagResult: DiagnosisResult = await diagRes.json();
        setDiagnosis(diagResult);
        setIsDiagnosing(false);

        speakText(`Issue detected: HTTP ${execResult.status}. ${diagResult.suggestedFixSummary}`);

        // Save history item
        saveHistoryItem({
          id: 'hist_' + Date.now(),
          timestamp: Date.now(),
          command: commandPrompt || reqToRun.scenarioPrompt || reqToRun.name,
          request: reqToRun,
          execution: execResult,
          diagnosis: diagResult
        });
      } else {
        speakText(`API executed successfully with status 200 OK.`);
        // Save success history item
        saveHistoryItem({
          id: 'hist_' + Date.now(),
          timestamp: Date.now(),
          command: commandPrompt || reqToRun.scenarioPrompt || reqToRun.name,
          request: reqToRun,
          execution: execResult
        });
      }
    } catch (err: any) {
      console.error(err);
      setIsLoading(false);
      setIsDiagnosing(false);
    }
  };

  // Step 6 & 7: Retest Engine - Executes the corrected request and compares with previous failure
  const handleApplyFixAndRetest = async (suggestedRequest: ApiTestRequest) => {
    if (!execution) return;
    setIsRetesting(true);

    try {
      const res = await fetch('/api/retest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalExecution: execution,
          suggestedRequest
        })
      });

      const retestResult: RetestResult = await res.json();
      setRetest(retestResult);
      setRequest(suggestedRequest);
      setExecution(retestResult.retestExecution);

      if (retestResult.isResolved) {
        speakText(`Issue verified and resolved. Status shifted to ${retestResult.retestExecution.status} OK.`);
      }

      // Update in history
      saveHistoryItem({
        id: 'hist_' + Date.now(),
        timestamp: Date.now(),
        command: `[Auto-Fix] ${suggestedRequest.name}`,
        request: suggestedRequest,
        execution: retestResult.retestExecution,
        diagnosis: diagnosis || undefined,
        retest: retestResult
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsRetesting(false);
    }
  };

  const saveHistoryItem = async (item: TestHistoryItem) => {
    setHistory(prev => [item, ...prev].slice(0, 50));
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (err) {
      console.warn('History save warning:', err);
    }
  };

  const handleClearHistory = async () => {
    setHistory([]);
    try {
      await fetch('/api/history', { method: 'DELETE' });
    } catch (err) {
      console.warn('History clear error:', err);
    }
  };

  const handleSelectHistoryItem = (item: TestHistoryItem) => {
    setRequest(item.request);
    setExecution(item.execution);
    setDiagnosis(item.diagnosis || null);
    setRetest(item.retest || null);
    setActiveNavTab('console');
  };

  const handleScanComplete = (scannedReq: ApiTestRequest) => {
    setRequest(scannedReq);
    setIsCameraOpen(false);
    setActiveNavTab('console');
    executeApiRequest(scannedReq, scannedReq.scenarioPrompt);
  };

  // Determine current step in Closed-Loop Core Flow
  const getCurrentLoopStep = () => {
    if (retest) return 5; // Verified
    if (diagnosis) return 4; // Fix Proposed
    if (isDiagnosing) return 3; // Diagnosing
    if (execution) return 2; // Executed
    if (isLoading) return 1; // Sending request
    return 0; // Ready for intent
  };

  const loopStep = getCurrentLoopStep();

  return (
    <PhoneFrame
      isPhoneMode={isPhoneMode}
      onToggleMode={() => setIsPhoneMode(!isPhoneMode)}
      onOpenArchitecture={() => setIsArchitectureOpen(true)}
    >
      {/* Closed-Loop Core Flow Visual Pipeline */}
      <div className="bg-slate-950 border-b border-slate-800 px-3 py-2 flex items-center justify-between text-[11px] overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-amber-400 font-bold uppercase text-[9px] tracking-wider">
            Closed-Loop:
          </span>
          {[
            { label: 'Voice/Intent', active: loopStep >= 0 },
            { label: 'Execute', active: loopStep >= 2 },
            { label: 'Diagnose', active: loopStep >= 3 },
            { label: 'Fix & Retest', active: loopStep >= 4 },
            { label: 'Verified', active: loopStep >= 5 }
          ].map((step, idx) => (
            <React.Fragment key={idx}>
              <span
                className={`px-1.5 py-0.5 rounded font-mono text-[9px] transition-colors ${
                  step.active
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'bg-slate-900 text-slate-500 border border-slate-800'
                }`}
              >
                {step.label}
              </span>
              {idx < 4 && <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        <button
          onClick={() => setIsCameraOpen(!isCameraOpen)}
          className="ml-2 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 flex items-center gap-1 shrink-0 transition-colors"
          title="Open Camera / Document OCR"
        >
          <Camera className="w-3 h-3 text-amber-400" />
          <span className="text-[10px]">Camera OCR</span>
        </button>
      </div>

      {/* Voice Assistant Header Component */}
      <VoiceAssistant
        onSendCommand={handleSendCommand}
        isLoading={isLoading || isDiagnosing || isRetesting}
      />

      {/* Camera OCR Scanner Dropdown */}
      {isCameraOpen && (
        <div className="p-3 bg-slate-950/95 border-b border-slate-800">
          <CameraScanner
            onScanComplete={handleScanComplete}
            onClose={() => setIsCameraOpen(false)}
          />
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="bg-slate-950/95 border-b border-slate-800 p-1.5 select-none">
        <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80">
          <button
            id="tab-live-console"
            onClick={() => setActiveNavTab('console')}
            className={`py-2 px-1.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeNavTab === 'console'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Console</span>
          </button>

          <button
            id="tab-test-matrix"
            onClick={() => setActiveNavTab('suite')}
            className={`py-2 px-1.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeNavTab === 'suite'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Test Matrix</span>
          </button>

          <button
            id="tab-dashboard"
            onClick={() => setActiveNavTab('history')}
            className={`py-2 px-1.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeNavTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">Dashboard</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold leading-none ${
                activeNavTab === 'history' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {history.length}
            </span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-2 sm:p-3 overflow-y-auto">
        {activeNavTab === 'console' && (
          <div className="space-y-3">
            {/* Retest Comparison Result (Appears at top when completed) */}
            {retest && (
              <RetestComparison
                retest={retest}
                onDismiss={() => setRetest(null)}
              />
            )}

            {/* AI Diagnosis Card (Displays automatically on error) */}
            {isDiagnosing && (
              <div className="w-full bg-slate-900 border border-amber-500/30 rounded-2xl p-4 my-2 flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-amber-400 font-mono animate-pulse">
                  AI Senior Developer Diagnosing HTTP {execution?.status} Root Cause...
                </span>
              </div>
            )}

            {diagnosis && !retest && (
              <AiDiagnosisCard
                diagnosis={diagnosis}
                onApplyFixAndRetest={handleApplyFixAndRetest}
                isRetesting={isRetesting}
              />
            )}

            {/* Execution Console & Request Inspector */}
            <ExecutionConsole
              request={request}
              execution={execution}
              isLoading={isLoading}
              onExecute={(req) => executeApiRequest(req)}
              onRequestChange={(updated) => setRequest(updated)}
            />
          </div>
        )}

        {activeNavTab === 'suite' && (
          <TestSuiteGenerator
            currentEndpoint={request.url}
            currentMethod={request.method}
            currentBody={request.body}
            onExecuteTestCase={(tcReq) => {
              setRequest(tcReq);
              setActiveNavTab('console');
              executeApiRequest(tcReq, tcReq.name);
            }}
          />
        )}

        {activeNavTab === 'history' && (
          <TestHistoryDashboard
            history={history}
            onSelectHistoryItem={handleSelectHistoryItem}
            onClearHistory={handleClearHistory}
          />
        )}
      </div>

      {/* Architecture & Pitch Modal */}
      {isArchitectureOpen && (
        <ArchitectureModal onClose={() => setIsArchitectureOpen(false)} />
      )}
    </PhoneFrame>
  );
}
