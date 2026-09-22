import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Scan, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';
import type { ApiTestRequest } from '../types.ts';

interface CameraScannerProps {
  onScanComplete: (request: ApiTestRequest) => void;
  onClose: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onScanComplete, onClose }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sample API Doc / Code snippets for instant 1-click testing in hackathon demos
  const sampleDocs = [
    {
      title: 'Stripe API Payment Charge Spec',
      description: 'POST /api/demo/payments/charge with currency and amount',
      sampleType: 'payment',
      preview: 'POST /v1/charges\nHeaders: Authorization: Bearer sk_test_...\nBody: {"amount": 0, "currency": "usd"}'
    },
    {
      title: 'OAuth Auth Login Spec',
      description: 'POST /api/demo/auth/login with password validation',
      sampleType: 'auth',
      preview: 'POST /api/v1/auth/login\nContent-Type: application/json\nBody: {"email": "dev@iqoo.dev", "password": "wrongpass"}'
    },
    {
      title: 'Users Profile Endpoint cURL',
      description: 'GET /api/demo/users with Bearer authorization check',
      sampleType: 'users',
      preview: 'curl -X GET https://api.service.com/users/999 \\\n -H "Authorization: Bearer mock_token"'
    }
  ];

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setErrorMsg('Camera access is unavailable or denied. You can upload an image or select a sample API spec below.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setPreviewImage(dataUrl);
      stopCamera();
      processImage(dataUrl);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPreviewImage(dataUrl);
      processImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64Data: string) => {
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/ocr-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/jpeg'
        })
      });

      if (!res.ok) {
        throw new Error('OCR scan failed with status ' + res.status);
      }

      const data = await res.json();
      const generatedRequest: ApiTestRequest = {
        id: 'req_ocr_' + Date.now(),
        name: data.extractedTitle || 'Scanned API Test',
        method: data.method || 'POST',
        url: data.endpoint || '/api/demo/payments/charge',
        headers: data.headers || { 'Content-Type': 'application/json' },
        body: typeof data.body === 'string' ? data.body : (data.body ? JSON.stringify(data.body, null, 2) : ''),
        source: 'camera',
        scenarioPrompt: `OCR Scan: ${data.extractedTitle || 'API Endpoint'}`,
        timestamp: Date.now()
      };

      onScanComplete(generatedRequest);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to extract API details. Using demo fallback parameters.');
      // Fallback
      onScanComplete({
        id: 'req_ocr_' + Date.now(),
        name: 'Scanned Payment API Spec',
        method: 'POST',
        url: '/api/demo/payments/charge',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 0, currency: 'USD' }, null, 2),
        source: 'camera',
        scenarioPrompt: 'Camera OCR Scan',
        timestamp: Date.now()
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectSample = (sample: typeof sampleDocs[0]) => {
    setIsProcessing(true);
    setTimeout(() => {
      let req: ApiTestRequest;
      if (sample.sampleType === 'payment') {
        req = {
          id: 'req_ocr_' + Date.now(),
          name: 'Scanned Stripe Payment Spec',
          method: 'POST',
          url: '/api/demo/payments/charge',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 0, currency: 'USD', customerId: 'cust_demo_scan' }, null, 2),
          source: 'camera',
          scenarioPrompt: 'OCR Scan: Payment API with amount 0',
          timestamp: Date.now()
        };
      } else if (sample.sampleType === 'auth') {
        req = {
          id: 'req_ocr_' + Date.now(),
          name: 'Scanned Auth Login Spec',
          method: 'POST',
          url: '/api/demo/auth/login',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'developer@iqoo.dev', password: 'wrongpass' }, null, 2),
          source: 'camera',
          scenarioPrompt: 'OCR Scan: Auth login documentation',
          timestamp: Date.now()
        };
      } else {
        req = {
          id: 'req_ocr_' + Date.now(),
          name: 'Scanned User Directory cURL',
          method: 'GET',
          url: '/api/demo/users/999',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer jwt_mock_token' },
          source: 'camera',
          scenarioPrompt: 'OCR Scan: User endpoint 999',
          timestamp: Date.now()
        };
      }
      setIsProcessing(false);
      onScanComplete(req);
    }, 600);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl p-4 my-2 shadow-2xl relative">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Camera + OCR API Scanner</h2>
            <p className="text-[11px] text-slate-400">Scan API docs, Swagger sheets, or code from screen</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {errorMsg && (
        <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Camera Live Feed or Preview */}
      <div className="mt-3">
        {isCameraActive ? (
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video border border-slate-800 flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
            
            {/* Viewfinder Target Reticle */}
            <div className="absolute inset-8 border-2 border-dashed border-amber-400/70 rounded-xl pointer-events-none flex flex-col justify-between p-2">
              <span className="text-[10px] bg-slate-950/80 text-amber-400 px-2 py-0.5 rounded font-mono self-start">
                ALIGN API DOCS HERE
              </span>
              <div className="w-full h-0.5 bg-amber-400/60 shadow-[0_0_8px_#f59e0b] animate-pulse"></div>
            </div>

            <div className="absolute bottom-3 flex items-center gap-3">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-2 text-xs active:scale-95 transition-all"
              >
                <Scan className="w-4 h-4" />
                Capture & OCR
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : previewImage ? (
          <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-video border border-slate-800 flex flex-col items-center justify-center">
            <img src={previewImage} alt="Captured" className="w-full h-full object-contain" />
            {isProcessing && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs font-semibold text-amber-400 font-mono animate-pulse">
                  Extracting REST Endpoints & Schemas via Gemini OCR...
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={startCamera}
              className="p-4 rounded-xl border border-slate-700 bg-slate-950/60 hover:bg-slate-800/80 flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-amber-400 transition-all group"
            >
              <Camera className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Open iQOO Camera</span>
              <span className="text-[10px] text-slate-500">Scan physical documentation or screen</span>
            </button>

            <label className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 hover:bg-slate-800/80 flex flex-col items-center justify-center gap-2 text-slate-300 hover:text-amber-400 transition-all cursor-pointer group">
              <Upload className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Upload API Screenshot</span>
              <span className="text-[10px] text-slate-500">PNG, JPG, or cURL screenshot</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        )}
      </div>

      {/* Preset API documentation samples for instant hackathon demonstration */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          Or Select Hackathon Demo API Document:
        </span>
        <div className="space-y-1.5">
          {sampleDocs.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(sample)}
              disabled={isProcessing}
              className="w-full text-left p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all flex items-center justify-between group active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileCode className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-200 group-hover:text-amber-300">
                    {sample.title}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate font-mono">
                    {sample.description}
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 group-hover:bg-amber-500/20 text-slate-400 group-hover:text-amber-300 shrink-0 transition-colors">
                Extract Spec
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
