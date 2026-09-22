import React, { useState } from 'react';
import { Send, Clock, Layers, Code2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ApiTestRequest, ApiExecutionResult, HttpMethod } from '../types.ts';

interface ExecutionConsoleProps {
  request: ApiTestRequest;
  execution: ApiExecutionResult | null;
  isLoading: boolean;
  onExecute: (req: ApiTestRequest) => void;
  onRequestChange: (req: ApiTestRequest) => void;
}

export const ExecutionConsole: React.FC<ExecutionConsoleProps> = ({
  request,
  execution,
  isLoading,
  onExecute,
  onRequestChange
}) => {
  const [showHeaders, setShowHeaders] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'response' | 'body' | 'headers'>('response');

  const methodColors: Record<HttpMethod, string> = {
    GET: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    POST: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    PUT: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    DELETE: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    PATCH: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  };

  const getStatusBadge = (status: number) => {
    if (status >= 200 && status < 300) {
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
    if (status >= 400 && status < 500) {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    }
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900/60 p-3 sm:p-4 flex flex-col gap-3">
      {/* Request Target Bar */}
      <div className="flex flex-col gap-2.5 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between gap-2 min-w-0 text-xs text-slate-400">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5 min-w-0 flex-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
            <span className="truncate">{request.name || 'API Test Request'}</span>
          </div>
          {request.source && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/90 text-amber-300/90 border border-slate-700/80 capitalize font-mono shrink-0 whitespace-nowrap select-none leading-normal">
              Via {request.source.replace('_', ' ')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          {/* Method Selector */}
          <select
            value={request.method}
            onChange={(e) => onRequestChange({ ...request, method: e.target.value as HttpMethod })}
            className={`text-xs font-bold px-2.5 py-2 rounded-lg border focus:outline-none transition-colors cursor-pointer shrink-0 select-none ${
              methodColors[request.method]
            }`}
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>

          {/* URL Input */}
          <input
            type="text"
            value={request.url}
            onChange={(e) => onRequestChange({ ...request, url: e.target.value })}
            placeholder="Target API URL or /api/demo/..."
            className="min-w-0 flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
          />

          {/* Execute Button */}
          <button
            id="execute-api-btn"
            type="button"
            onClick={() => onExecute(request)}
            disabled={isLoading}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 shrink-0 whitespace-nowrap select-none"
          >
            {isLoading ? (
              <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Send className="w-3.5 h-3.5 text-slate-950" />
            )}
            <span>Execute</span>
          </button>
        </div>

        {/* Quick URL Endpoint presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none text-[10px]">
          <span className="text-slate-500 shrink-0 select-none font-medium">Demo Presets:</span>
          {[
            { name: 'Auth Login', url: '/api/demo/auth/login', method: 'POST' },
            { name: 'Payment Charge', url: '/api/demo/payments/charge', method: 'POST' },
            { name: 'User Directory', url: '/api/demo/users', method: 'GET' },
            { name: 'User 999 (404)', url: '/api/demo/users/999', method: 'GET' },
            { name: 'Server Crash (500)', url: '/api/demo/server-crash', method: 'POST' }
          ].map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onRequestChange({
                ...request,
                name: preset.name,
                url: preset.url,
                method: preset.method as HttpMethod
              })}
              className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 shrink-0 font-mono whitespace-nowrap transition-colors select-none"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs: Request Body / Headers / Response */}
      <div className="flex items-center gap-1 border-b border-slate-800 text-xs select-none">
        <button
          type="button"
          onClick={() => setActiveTab('response')}
          className={`px-3 py-1.5 border-b-2 font-medium transition-all whitespace-nowrap ${
            activeTab === 'response'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Response
          {execution && (
            <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded border font-mono whitespace-nowrap ${getStatusBadge(execution.status)}`}>
              {execution.status}
            </span>
          )}
        </button>

        {['POST', 'PUT', 'PATCH'].includes(request.method) && (
          <button
            type="button"
            onClick={() => setActiveTab('body')}
            className={`px-3 py-1.5 border-b-2 font-medium transition-all whitespace-nowrap ${
              activeTab === 'body'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Payload Body
            {request.body && <span className="ml-1 text-[10px] text-amber-400">&bull;</span>}
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('headers')}
          className={`px-3 py-1.5 border-b-2 font-medium transition-all whitespace-nowrap ${
            activeTab === 'headers'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Headers ({Object.keys(request.headers || {}).length})
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'response' && (
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col gap-2">
          {execution ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold font-mono border ${getStatusBadge(execution.status)}`}>
                    {execution.status} {execution.statusText}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {execution.responseTimeMs} ms
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(execution.rawBody)}
                  className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
                  title="Copy Response Body"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Formatted Code Block */}
              <pre className="text-[11px] font-mono text-slate-200 bg-slate-900/90 p-2.5 rounded-lg overflow-x-auto max-h-52 border border-slate-800/80 leading-relaxed scrollbar-thin">
                {typeof execution.body === 'object'
                  ? JSON.stringify(execution.body, null, 2)
                  : execution.rawBody}
              </pre>
            </>
          ) : (
            <div className="py-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <Code2 className="w-6 h-6 text-slate-600" />
              <span>No API execution recorded yet.</span>
              <span className="text-[10px] text-slate-600">Give a voice command or click "Execute" above.</span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'body' && (
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>JSON Request Body</span>
            <span className="text-[10px] text-slate-500">Editable parameters</span>
          </div>
          <textarea
            rows={5}
            value={request.body || ''}
            onChange={(e) => onRequestChange({ ...request, body: e.target.value })}
            placeholder='{\n  "key": "value"\n}'
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
          />
        </div>
      )}

      {activeTab === 'headers' && (
        <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>HTTP Request Headers</span>
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            {Object.entries(request.headers || {}).map(([key, val], idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                <span className="text-amber-400 shrink-0">{key}:</span>
                <span className="text-slate-300 truncate">{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
