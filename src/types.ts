export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiTestRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: string;
  queryParams?: Record<string, string>;
  scenarioPrompt?: string;
  source: 'voice' | 'camera' | 'natural_language' | 'manual' | 'test_generator';
  timestamp: number;
}

export interface ApiExecutionResult {
  id: string;
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any;
  rawBody: string;
  responseTimeMs: number;
  isSuccess: boolean;
  timestamp: number;
  error?: string;
}

export interface DiagnosisResult {
  id: string;
  executionId: string;
  isError: boolean;
  rootCause: string;
  explanation: string;
  likelyCategory: 'AUTHENTICATION' | 'VALIDATION' | 'RESOURCE_NOT_FOUND' | 'SERVER_CRASH' | 'RATE_LIMIT' | 'SCHEMA_MISMATCH' | 'SUCCESS';
  suggestedFixSummary: string;
  suggestedRequest: ApiTestRequest;
  diffSummary: {
    field: string;
    original: string;
    suggested: string;
    reason: string;
  }[];
  nextRecommendedTests: string[];
}

export interface RetestResult {
  id: string;
  originalExecution: ApiExecutionResult;
  retestExecution: ApiExecutionResult;
  isResolved: boolean;
  resolutionSummary: string;
  latencyDiffMs: number;
  timestamp: number;
}

export interface TestHistoryItem {
  id: string;
  timestamp: number;
  command: string;
  request: ApiTestRequest;
  execution: ApiExecutionResult;
  diagnosis?: DiagnosisResult;
  retest?: RetestResult;
}

export interface GeneratedTestCase {
  id: string;
  title: string;
  type: 'positive' | 'negative' | 'boundary' | 'auth' | 'missing_fields';
  description: string;
  request: ApiTestRequest;
  expectedOutcome: string;
}

export interface DashboardMetrics {
  totalRuns: number;
  passCount: number;
  failCount: number;
  avgResponseTimeMs: number;
  statusDistribution: Record<string, number>;
  healthScore: number;
}
