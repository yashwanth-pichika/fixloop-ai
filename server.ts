import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import type { 
  ApiTestRequest, 
  ApiExecutionResult, 
  DiagnosisResult, 
  RetestResult, 
  TestHistoryItem,
  GeneratedTestCase
} from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// In-memory state for Hackathon MVP
let testHistory: TestHistoryItem[] = [];

// Lazy Gemini Client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// ---------------------------------------------------------------------
// 1. CONTROLLED DEMO TARGET REST APIS (For Reliable Hackathon Showcase)
// ---------------------------------------------------------------------

// Auth Demo Endpoint
app.post('/api/demo/auth/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      error: 'Bad Request',
      code: 'MISSING_CREDENTIALS',
      message: 'Both "email" and "password" parameters are required.',
      expectedFormat: { email: 'string', password: 'string' }
    });
  }

  if (password === 'wrongpass' || password === 'invalid' || password === '123456') {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid password provided for user ' + email,
      attemptedEmail: email,
      timestamp: new Date().toISOString()
    });
  }

  // Valid credentials
  return res.status(200).json({
    success: true,
    token: 'jwt_mock_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.iqoo_developer_token',
    tokenType: 'Bearer',
    expiresInSec: 3600,
    user: {
      id: 'usr_8829',
      name: 'Alex Rivera',
      email: email,
      role: 'Staff Engineer'
    }
  });
});

// Payments Demo Endpoint
app.post('/api/demo/payments/charge', (req, res) => {
  const { amount, currency, paymentMethodId, customerId } = req.body || {};

  if (amount === undefined || amount === null) {
    return res.status(400).json({
      error: 'Validation Error',
      code: 'MISSING_AMOUNT',
      message: 'Parameter "amount" is mandatory.'
    });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(422).json({
      error: 'Unprocessable Entity',
      code: 'INVALID_AMOUNT',
      message: `Transaction amount must be strictly greater than 0. Received: ${amount}`,
      allowedMinimum: 0.01
    });
  }

  if (!currency || !['USD', 'EUR', 'INR', 'GBP'].includes(currency.toUpperCase())) {
    return res.status(400).json({
      error: 'Invalid Currency',
      code: 'UNSUPPORTED_CURRENCY',
      message: `Currency "${currency}" is invalid or unsupported. Allowed: USD, EUR, INR, GBP.`
    });
  }

  if (paymentMethodId === 'pm_declined' || paymentMethodId === 'expired_card') {
    return res.status(402).json({
      error: 'Payment Required',
      code: 'CARD_DECLINED',
      message: 'The card was declined by the issuing financial institution.',
      declineCode: 'generic_decline'
    });
  }

  return res.status(200).json({
    status: 'succeeded',
    transactionId: 'txn_' + Math.random().toString(36).substring(2, 11),
    amount: numAmount,
    currency: currency.toUpperCase(),
    captured: true,
    customerId: customerId || 'cust_demo_101',
    createdAt: new Date().toISOString()
  });
});

// User CRUD Demo Endpoints
app.get('/api/demo/users', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'MISSING_BEARER_TOKEN',
      message: 'Protected resource requires "Authorization: Bearer <token>" header.'
    });
  }

  return res.status(200).json({
    users: [
      { id: 1, name: 'Sarah Chen', email: 'sarah@iqoo.dev', role: 'DevOps Lead', active: true },
      { id: 2, name: 'Marcus Vance', email: 'marcus@iqoo.dev', role: 'Frontend Engineer', active: true },
      { id: 3, name: 'Elena Rostova', email: 'elena@iqoo.dev', role: 'Security Architect', active: false }
    ],
    totalCount: 3
  });
});

app.get('/api/demo/users/:id', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized',
      code: 'MISSING_BEARER_TOKEN',
      message: 'Protected resource requires "Authorization: Bearer <token>" header.'
    });
  }

  const { id } = req.params;
  if (id === '999' || id === '404') {
    return res.status(404).json({
      error: 'Not Found',
      code: 'USER_NOT_FOUND',
      message: `User with identifier #${id} was not found in the database.`,
      suggestedIds: [1, 2, 3]
    });
  }

  return res.status(200).json({
    id: Number(id) || id,
    name: 'Sarah Chen',
    email: 'sarah@iqoo.dev',
    role: 'DevOps Lead',
    registeredAt: '2024-01-15T09:30:00Z'
  });
});

app.post('/api/demo/users', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing Authorization header'
    });
  }

  const { name, email } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({
      error: 'Bad Request',
      code: 'MISSING_FIELDS',
      message: 'Both "name" and "email" are mandatory when creating a user.'
    });
  }

  return res.status(201).json({
    id: Math.floor(Math.random() * 900) + 100,
    name,
    email,
    created: true,
    timestamp: new Date().toISOString()
  });
});

// Server Crash Simulation Demo
app.all('/api/demo/server-crash', (req, res) => {
  return res.status(500).json({
    error: 'Internal Server Error',
    code: 'NULL_POINTER_EXCEPTION',
    message: 'Unhandled Exception: java.lang.NullPointerException at com.iqoo.debugger.service.PaymentDispatcher.process(PaymentDispatcher.java:84)',
    serverVersion: 'Spring-Boot 3.2.1',
    traceId: 'trace_' + Math.random().toString(36).substring(2, 9)
  });
});

// ---------------------------------------------------------------------
// 2. ORCHESTRATION & AI SERVICES (Spring Boot + AI Orchestrator)
// ---------------------------------------------------------------------

// Convert Natural Language / Voice into structured ApiTestRequest
app.post('/api/test-command', async (req, res) => {
  try {
    const { command, source = 'natural_language' } = req.body;
    if (!command || typeof command !== 'string') {
      return res.status(400).json({ error: 'Command string is required.' });
    }

    const lower = command.toLowerCase();
    const ai = getGeminiClient();

    // Default heuristic parsing for speed & reliable offline fallback
    let fallbackRequest: ApiTestRequest = {
      id: 'req_' + Date.now(),
      name: 'API Test: ' + command.slice(0, 35),
      method: 'GET',
      url: '/api/demo/users',
      headers: {
        'Content-Type': 'application/json'
      },
      source: source as any,
      scenarioPrompt: command,
      timestamp: Date.now()
    };

    if (lower.includes('login') || lower.includes('auth') || lower.includes('password')) {
      fallbackRequest.method = 'POST';
      fallbackRequest.url = '/api/demo/auth/login';
      fallbackRequest.name = 'Auth Login Test';
      const isInvalid = lower.includes('invalid') || lower.includes('wrong') || lower.includes('bad') || lower.includes('fail');
      fallbackRequest.body = JSON.stringify({
        email: 'developer@iqoo.dev',
        password: isInvalid ? 'wrongpass' : 'validPassword!99'
      }, null, 2);
    } else if (lower.includes('payment') || lower.includes('pay') || lower.includes('charge') || lower.includes('amount')) {
      fallbackRequest.method = 'POST';
      fallbackRequest.url = '/api/demo/payments/charge';
      fallbackRequest.name = 'Payment Gateway Test';
      const isZero = lower.includes('zero') || lower.includes('0') || lower.includes('negative') || lower.includes('empty');
      fallbackRequest.body = JSON.stringify({
        amount: isZero ? 0 : 49.99,
        currency: 'USD',
        customerId: 'cust_iqoo_dev',
        paymentMethodId: lower.includes('declined') ? 'pm_declined' : 'pm_card_visa_ok'
      }, null, 2);
    } else if (lower.includes('user') || lower.includes('profile')) {
      if (lower.includes('missing auth') || lower.includes('no token') || lower.includes('unauthorized')) {
        fallbackRequest.method = 'GET';
        fallbackRequest.url = '/api/demo/users';
        fallbackRequest.headers = { 'Content-Type': 'application/json' };
      } else if (lower.includes('404') || lower.includes('not found') || lower.includes('invalid id')) {
        fallbackRequest.method = 'GET';
        fallbackRequest.url = '/api/demo/users/999';
        fallbackRequest.headers = {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt_mock_valid_token_iqoo'
        };
      } else {
        fallbackRequest.method = 'GET';
        fallbackRequest.url = '/api/demo/users';
        fallbackRequest.headers = {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer jwt_mock_valid_token_iqoo'
        };
      }
    } else if (lower.includes('crash') || lower.includes('500') || lower.includes('exception')) {
      fallbackRequest.method = 'POST';
      fallbackRequest.url = '/api/demo/server-crash';
      fallbackRequest.name = 'Simulate 500 Server Crash';
      fallbackRequest.body = JSON.stringify({ trigger: 'test_null_pointer' }, null, 2);
    }

    if (ai) {
      try {
        const prompt = `You are the Intent & Command Service for "AI Mobile API Debugger".
The developer spoke or entered this natural language instruction: "${command}".
Convert this instruction into a structured REST API test specification against our target APIs.

Available Demo Endpoints:
1. POST /api/demo/auth/login with body { "email": string, "password": string } (password 'wrongpass' gives 401, 'validPassword!99' gives 200).
2. POST /api/demo/payments/charge with body { "amount": number, "currency": "USD"|"EUR"|"INR", "paymentMethodId": string } (amount 0 gives 422, amount > 0 gives 200).
3. GET /api/demo/users (requires header "Authorization: Bearer <token>", without it returns 401).
4. GET /api/demo/users/:id (id 999 returns 404, id 1 returns 200, requires Authorization).
5. POST /api/demo/server-crash (returns 500 error).

Return ONLY valid JSON matching this schema:
{
  "name": string,
  "method": "GET" | "POST" | "PUT" | "DELETE",
  "url": string,
  "headers": { [key: string]: string },
  "body": string | null
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          return res.json({
            id: 'req_' + Date.now(),
            name: parsed.name || fallbackRequest.name,
            method: parsed.method || fallbackRequest.method,
            url: parsed.url || fallbackRequest.url,
            headers: parsed.headers || fallbackRequest.headers,
            body: typeof parsed.body === 'string' ? parsed.body : (parsed.body ? JSON.stringify(parsed.body, null, 2) : fallbackRequest.body),
            scenarioPrompt: command,
            source,
            timestamp: Date.now()
          });
        }
      } catch (err) {
        console.warn('Gemini intent parsing fallback used:', err);
      }
    }

    return res.json(fallbackRequest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Execute an API Test Request
app.post('/api/execute-test', async (req, res) => {
  const startTime = Date.now();
  const request: ApiTestRequest = req.body;

  if (!request || !request.url || !request.method) {
    return res.status(400).json({ error: 'Valid request with method and url is required.' });
  }

  try {
    let fullUrl = request.url;
    // If it's a relative path to our demo target or local server
    if (fullUrl.startsWith('/')) {
      fullUrl = `http://127.0.0.1:${PORT}${request.url}`;
    }

    const headers: Record<string, string> = {
      'User-Agent': 'iQOO-AI-Mobile-Debugger/1.0',
      ...(request.headers || {})
    };

    const fetchOptions: RequestInit = {
      method: request.method,
      headers
    };

    if (['POST', 'PUT', 'PATCH'].includes(request.method.toUpperCase()) && request.body) {
      fetchOptions.body = typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    }

    const fetchResponse = await fetch(fullUrl, fetchOptions);
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    const responseHeaders: Record<string, string> = {};
    fetchResponse.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    const rawText = await fetchResponse.text();
    let parsedBody: any = null;
    try {
      parsedBody = JSON.parse(rawText);
    } catch {
      parsedBody = rawText;
    }

    const executionResult: ApiExecutionResult = {
      id: 'exec_' + Date.now(),
      requestId: request.id,
      status: fetchResponse.status,
      statusText: fetchResponse.statusText || (fetchResponse.status === 200 ? 'OK' : 'Error'),
      headers: responseHeaders,
      body: parsedBody,
      rawBody: rawText,
      responseTimeMs,
      isSuccess: fetchResponse.status >= 200 && fetchResponse.status < 300,
      timestamp: Date.now()
    };

    return res.json(executionResult);
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const executionResult: ApiExecutionResult = {
      id: 'exec_' + Date.now(),
      requestId: request.id,
      status: 0,
      statusText: 'Network / Connection Error',
      headers: {},
      body: { error: err.message },
      rawBody: err.message,
      responseTimeMs,
      isSuccess: false,
      timestamp: Date.now(),
      error: err.message
    };
    return res.json(executionResult);
  }
});

// AI Analysis & Diagnosis Service
app.post('/api/diagnose', async (req, res) => {
  try {
    const { request, execution }: { request: ApiTestRequest; execution: ApiExecutionResult } = req.body;
    if (!request || !execution) {
      return res.status(400).json({ error: 'Both request and execution are required for diagnosis.' });
    }

    const ai = getGeminiClient();
    const status = execution.status;

    // Rule-based heuristic diagnosis fallback
    let fallbackDiagnosis: DiagnosisResult = {
      id: 'diag_' + Date.now(),
      executionId: execution.id,
      isError: !execution.isSuccess,
      rootCause: 'General HTTP Status ' + status,
      explanation: execution.isSuccess 
        ? 'The API executed successfully and returned a valid 2xx response payload.' 
        : `The server responded with HTTP status ${status}: ${execution.statusText}.`,
      likelyCategory: execution.isSuccess ? 'SUCCESS' : (status === 401 || status === 403 ? 'AUTHENTICATION' : status === 404 ? 'RESOURCE_NOT_FOUND' : status === 422 || status === 400 ? 'VALIDATION' : 'SERVER_CRASH'),
      suggestedFixSummary: execution.isSuccess ? 'No fix required' : 'Correct parameters or supply missing authentication header',
      suggestedRequest: JSON.parse(JSON.stringify(request)),
      diffSummary: [],
      nextRecommendedTests: [
        'Test with valid token and boundary limits',
        'Verify JSON schema response validation'
      ]
    };

    if (status === 401) {
      fallbackDiagnosis.rootCause = 'Authentication Failed / Missing or Invalid Credentials';
      if (request.url.includes('login')) {
        fallbackDiagnosis.explanation = 'The login credentials failed validation because the supplied password ("wrongpass" or invalid) does not match system records.';
        fallbackDiagnosis.suggestedFixSummary = 'Replace invalid password with authorized developer credentials ("validPassword!99").';
        const correctedBody = JSON.parse(request.body || '{}');
        correctedBody.password = 'validPassword!99';
        fallbackDiagnosis.suggestedRequest.body = JSON.stringify(correctedBody, null, 2);
        fallbackDiagnosis.diffSummary = [{
          field: 'body.password',
          original: '"wrongpass"',
          suggested: '"validPassword!99"',
          reason: 'Correct credentials to authenticate session successfully'
        }];
      } else {
        fallbackDiagnosis.explanation = 'Protected resource requires standard HTTP Authorization header with a Bearer token.';
        fallbackDiagnosis.suggestedFixSummary = 'Inject "Authorization: Bearer <valid_jwt_token>" header into the request.';
        fallbackDiagnosis.suggestedRequest.headers = {
          ...request.headers,
          'Authorization': 'Bearer jwt_mock_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
        };
        fallbackDiagnosis.diffSummary = [{
          field: 'headers.Authorization',
          original: 'undefined',
          suggested: 'Bearer jwt_mock_eyJhbGci...',
          reason: 'Fulfill Bearer authentication contract'
        }];
      }
    } else if (status === 422 || status === 400) {
      fallbackDiagnosis.rootCause = 'Validation Failure / Unprocessable Entity';
      if (request.url.includes('payments')) {
        fallbackDiagnosis.explanation = 'Payment gateway rejected charge because amount was zero or negative, violating transaction constraints (amount > 0).';
        fallbackDiagnosis.suggestedFixSummary = 'Update amount to a valid positive value (e.g., 49.99 USD).';
        const correctedBody = JSON.parse(request.body || '{}');
        correctedBody.amount = 49.99;
        fallbackDiagnosis.suggestedRequest.body = JSON.stringify(correctedBody, null, 2);
        fallbackDiagnosis.diffSummary = [{
          field: 'body.amount',
          original: '0',
          suggested: '49.99',
          reason: 'Transaction requires amount strictly greater than zero'
        }];
      } else {
        fallbackDiagnosis.explanation = 'The request payload failed server-side input schema validation.';
        fallbackDiagnosis.suggestedFixSummary = 'Ensure all required fields are populated in request body.';
      }
    } else if (status === 404) {
      fallbackDiagnosis.rootCause = 'Resource Not Found (404)';
      fallbackDiagnosis.explanation = `The requested target path or ID does not exist in the service directory (${request.url}).`;
      fallbackDiagnosis.suggestedFixSummary = 'Point to an active resource ID (e.g. ID #1 instead of #999).';
      if (request.url.includes('/999')) {
        fallbackDiagnosis.suggestedRequest.url = request.url.replace('/999', '/1');
        fallbackDiagnosis.diffSummary = [{
          field: 'url',
          original: request.url,
          suggested: request.url.replace('/999', '/1'),
          reason: 'Target verified existing record ID 1'
        }];
      }
    } else if (status === 500) {
      fallbackDiagnosis.rootCause = 'Internal Server Error / Unhandled NullPointerException';
      fallbackDiagnosis.explanation = 'The target API threw an uncaught exception on the server during request execution.';
      fallbackDiagnosis.suggestedFixSummary = 'Handle null pointers gracefully on backend and sanitize client inputs.';
    }

    if (ai) {
      try {
        const prompt = `You are the AI Analysis Service in the "AI Mobile API Debugger" system.
Analyze this API execution result:

REQUEST:
Method: ${request.method}
URL: ${request.url}
Headers: ${JSON.stringify(request.headers)}
Body: ${request.body || '(none)'}

RESPONSE:
Status: ${execution.status} ${execution.statusText}
Response Headers: ${JSON.stringify(execution.headers)}
Response Body: ${execution.rawBody}
Response Time: ${execution.responseTimeMs}ms

TASK:
1. Identify the exact root cause of the error or status.
2. Explain clearly in 2 concise sentences what went wrong and why.
3. Categorize: "AUTHENTICATION" | "VALIDATION" | "RESOURCE_NOT_FOUND" | "SERVER_CRASH" | "RATE_LIMIT" | "SCHEMA_MISMATCH" | "SUCCESS".
4. Generate the EXACT corrected request that will succeed and resolve this issue.
5. Provide a diff summary listing what field changed, original value, suggested value, and reason.
6. Suggest 2-3 next logical tests to perform.

Respond ONLY with valid JSON in this schema:
{
  "rootCause": string,
  "explanation": string,
  "likelyCategory": string,
  "suggestedFixSummary": string,
  "suggestedRequest": {
    "name": string,
    "method": "GET" | "POST" | "PUT" | "DELETE",
    "url": string,
    "headers": { [key: string]: string },
    "body": string | null
  },
  "diffSummary": [
    {
      "field": string,
      "original": string,
      "suggested": string,
      "reason": string
    }
  ],
  "nextRecommendedTests": string[]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          const diagnosis: DiagnosisResult = {
            id: 'diag_' + Date.now(),
            executionId: execution.id,
            isError: !execution.isSuccess,
            rootCause: parsed.rootCause || fallbackDiagnosis.rootCause,
            explanation: parsed.explanation || fallbackDiagnosis.explanation,
            likelyCategory: parsed.likelyCategory || fallbackDiagnosis.likelyCategory,
            suggestedFixSummary: parsed.suggestedFixSummary || fallbackDiagnosis.suggestedFixSummary,
            suggestedRequest: {
              ...request,
              name: parsed.suggestedRequest?.name || `Fixed: ${request.name}`,
              method: parsed.suggestedRequest?.method || request.method,
              url: parsed.suggestedRequest?.url || request.url,
              headers: parsed.suggestedRequest?.headers || request.headers,
              body: typeof parsed.suggestedRequest?.body === 'string' 
                ? parsed.suggestedRequest.body 
                : (parsed.suggestedRequest?.body ? JSON.stringify(parsed.suggestedRequest.body, null, 2) : request.body)
            },
            diffSummary: parsed.diffSummary || fallbackDiagnosis.diffSummary,
            nextRecommendedTests: parsed.nextRecommendedTests || fallbackDiagnosis.nextRecommendedTests
          };
          return res.json(diagnosis);
        }
      } catch (err) {
        console.warn('Gemini diagnosis fallback used:', err);
      }
    }

    return res.json(fallbackDiagnosis);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Retest Service: Executes corrected request and compares with original failure
app.post('/api/retest', async (req, res) => {
  try {
    const { originalExecution, suggestedRequest }: { originalExecution: ApiExecutionResult; suggestedRequest: ApiTestRequest } = req.body;

    if (!originalExecution || !suggestedRequest) {
      return res.status(400).json({ error: 'originalExecution and suggestedRequest are required.' });
    }

    // Execute the suggested request
    let fullUrl = suggestedRequest.url;
    if (fullUrl.startsWith('/')) {
      fullUrl = `http://127.0.0.1:${PORT}${suggestedRequest.url}`;
    }

    const startTime = Date.now();
    const fetchOptions: RequestInit = {
      method: suggestedRequest.method,
      headers: {
        'User-Agent': 'iQOO-AI-Mobile-Debugger/1.0',
        ...(suggestedRequest.headers || {})
      }
    };

    if (['POST', 'PUT', 'PATCH'].includes(suggestedRequest.method.toUpperCase()) && suggestedRequest.body) {
      fetchOptions.body = typeof suggestedRequest.body === 'string' ? suggestedRequest.body : JSON.stringify(suggestedRequest.body);
    }

    const fetchResponse = await fetch(fullUrl, fetchOptions);
    const endTime = Date.now();
    const responseTimeMs = endTime - startTime;

    const responseHeaders: Record<string, string> = {};
    fetchResponse.headers.forEach((val, key) => {
      responseHeaders[key] = val;
    });

    const rawText = await fetchResponse.text();
    let parsedBody: any = null;
    try {
      parsedBody = JSON.parse(rawText);
    } catch {
      parsedBody = rawText;
    }

    const retestExecution: ApiExecutionResult = {
      id: 'exec_retest_' + Date.now(),
      requestId: suggestedRequest.id,
      status: fetchResponse.status,
      statusText: fetchResponse.statusText || (fetchResponse.status === 200 ? 'OK' : 'Error'),
      headers: responseHeaders,
      body: parsedBody,
      rawBody: rawText,
      responseTimeMs,
      isSuccess: fetchResponse.status >= 200 && fetchResponse.status < 300,
      timestamp: Date.now()
    };

    const isResolved = !originalExecution.isSuccess && retestExecution.isSuccess;
    const latencyDiff = retestExecution.responseTimeMs - originalExecution.responseTimeMs;

    let resolutionSummary = isResolved
      ? `Issue successfully resolved! Status shifted from ${originalExecution.status} (${originalExecution.statusText}) to ${retestExecution.status} (${retestExecution.statusText}).`
      : retestExecution.isSuccess
      ? `API responded with successful status ${retestExecution.status}.`
      : `Retest completed with status ${retestExecution.status}. Further fixes may be required.`;

    const result: RetestResult = {
      id: 'retest_' + Date.now(),
      originalExecution,
      retestExecution,
      isResolved,
      resolutionSummary,
      latencyDiffMs: latencyDiff,
      timestamp: Date.now()
    };

    return res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Camera / Screenshot OCR Scanner Endpoint
app.post('/api/ocr-scan', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required.' });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const ai = getGeminiClient();

    if (!ai) {
      // Return realistic mock API extraction if no Gemini key
      return res.json({
        endpoint: '/api/demo/payments/charge',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk_live_demo_iqoo'
        },
        body: JSON.stringify({
          amount: 25.00,
          currency: 'USD',
          customerId: 'cust_ocr_scanned'
        }, null, 2),
        extractedTitle: 'Scanned Payment API Endpoint',
        confidence: 0.95
      });
    }

    const prompt = `You are the Camera OCR Engine in the "AI Mobile API Debugger" running on an iQOO smartphone.
Examine this image of an API specification, documentation snippet, Postman screenshot, or cURL command.
Extract the REST API details:
1. Endpoint URL or path (e.g., /api/demo/auth/login or /api/demo/payments/charge or /api/demo/users)
2. HTTP Method (GET, POST, PUT, DELETE, etc.)
3. HTTP Headers (like Authorization, Content-Type, Accept)
4. Request Body JSON or parameters (if applicable)
5. A brief title describing what API this is.

Return ONLY valid JSON matching this schema:
{
  "endpoint": string,
  "method": "GET" | "POST" | "PUT" | "DELETE",
  "headers": { [key: string]: string },
  "body": string | null,
  "extractedTitle": string,
  "confidence": number
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64
          }
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: 'application/json'
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      return res.json(parsed);
    }

    res.status(500).json({ error: 'Failed to extract API details from image.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// AI Test Generation: Generates positive & negative test matrices
app.post('/api/generate-test-matrix', async (req, res) => {
  try {
    const { endpoint = '/api/demo/auth/login', method = 'POST', sampleBody } = req.body;
    const ai = getGeminiClient();

    // Fallback predefined rich test matrix
    const fallbackCases: GeneratedTestCase[] = [
      {
        id: 'tc_pos_1',
        title: 'Positive: Valid payload submission',
        type: 'positive',
        description: 'Sends legitimate parameters to verify happy path returns 200/201.',
        request: {
          id: 'req_tc_1',
          name: 'Happy Path Test',
          method: method as any,
          url: endpoint,
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer jwt_mock_valid_token_iqoo' },
          body: sampleBody || JSON.stringify({ email: 'developer@iqoo.dev', password: 'validPassword!99' }, null, 2),
          source: 'test_generator',
          timestamp: Date.now()
        },
        expectedOutcome: 'HTTP 200 OK with valid schema'
      },
      {
        id: 'tc_neg_missing',
        title: 'Negative: Missing required fields',
        type: 'missing_fields',
        description: 'Omits primary parameters to ensure server returns 400 Bad Request with field validation details.',
        request: {
          id: 'req_tc_2',
          name: 'Missing Required Fields Test',
          method: method as any,
          url: endpoint,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}, null, 2),
          source: 'test_generator',
          timestamp: Date.now()
        },
        expectedOutcome: 'HTTP 400 Bad Request'
      },
      {
        id: 'tc_neg_auth',
        title: 'Security: Missing / Invalid Authorization',
        type: 'auth',
        description: 'Tests endpoint without Bearer token or with forged credentials.',
        request: {
          id: 'req_tc_3',
          name: 'Missing Auth Token Test',
          method: method as any,
          url: endpoint,
          headers: { 'Content-Type': 'application/json' },
          body: sampleBody,
          source: 'test_generator',
          timestamp: Date.now()
        },
        expectedOutcome: 'HTTP 401 Unauthorized'
      },
      {
        id: 'tc_boundary',
        title: 'Boundary: Zero / Extreme boundary limits',
        type: 'boundary',
        description: 'Tests numeric zero, oversized strings, and negative values to prevent edge-case crashes.',
        request: {
          id: 'req_tc_4',
          name: 'Boundary Value Test',
          method: method as any,
          url: endpoint.includes('payments') ? endpoint : '/api/demo/payments/charge',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 0, currency: 'USD' }, null, 2),
          source: 'test_generator',
          timestamp: Date.now()
        },
        expectedOutcome: 'HTTP 422 Unprocessable Entity or 400 Bad Request'
      }
    ];

    if (ai) {
      try {
        const prompt = `You are the AI Test Generation Engine in the "AI Mobile API Debugger".
Generate 4 comprehensive automated test cases for this REST endpoint:
Endpoint: ${endpoint}
Method: ${method}
Sample Body: ${sampleBody || '{}'}

Categories required:
1. Positive Happy Path (valid input, expected 200/201)
2. Negative Missing Fields (missing required keys, expected 400)
3. Security / Auth Failure (missing or expired token, expected 401/403)
4. Boundary / Edge Case (zero, negative, or format mutation, expected 422 or 400)

Return ONLY valid JSON matching this schema:
[
  {
    "id": string,
    "title": string,
    "type": "positive" | "negative" | "boundary" | "auth" | "missing_fields",
    "description": string,
    "request": {
      "name": string,
      "method": "GET" | "POST" | "PUT" | "DELETE",
      "url": string,
      "headers": { [key: string]: string },
      "body": string | null
    },
    "expectedOutcome": string
  }
]`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        if (response.text) {
          const parsed = JSON.parse(response.text);
          const cases = parsed.map((item: any, i: number) => ({
            id: 'tc_' + (i + 1) + '_' + Date.now(),
            title: item.title,
            type: item.type,
            description: item.description,
            expectedOutcome: item.expectedOutcome,
            request: {
              id: 'req_gen_' + (i + 1) + '_' + Date.now(),
              name: item.request.name || item.title,
              method: item.request.method || method,
              url: item.request.url || endpoint,
              headers: item.request.headers || { 'Content-Type': 'application/json' },
              body: typeof item.request.body === 'string' ? item.request.body : (item.request.body ? JSON.stringify(item.request.body, null, 2) : null),
              source: 'test_generator',
              timestamp: Date.now()
            }
          }));
          return res.json(cases);
        }
      } catch (err) {
        console.warn('Gemini test matrix fallback used:', err);
      }
    }

    return res.json(fallbackCases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// History & Dashboard Stats
app.get('/api/history', (req, res) => {
  res.json(testHistory);
});

app.post('/api/history', (req, res) => {
  const item: TestHistoryItem = req.body;
  if (item && item.id) {
    testHistory.unshift(item);
    if (testHistory.length > 50) {
      testHistory = testHistory.slice(0, 50);
    }
  }
  res.json({ success: true, count: testHistory.length });
});

app.delete('/api/history', (req, res) => {
  testHistory = [];
  res.json({ success: true });
});

// ---------------------------------------------------------------------
// 3. VITE MIDDLEWARE & STATIC ASSET HANDLER
// ---------------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Mobile API Debugger] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
