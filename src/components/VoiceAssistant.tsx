import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Sparkles, CornerDownLeft, PlayCircle } from 'lucide-react';

interface VoiceAssistantProps {
  onSendCommand: (command: string, source: 'voice' | 'natural_language') => void;
  isLoading: boolean;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onSendCommand, isLoading }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // Suggested Voice Prompts matching the Hackathon PDF specifications
  const suggestedPrompts = [
    { text: 'Test login with an invalid password', tag: 'Auth 401' },
    { text: 'Test payment API with amount zero', tag: 'Payment 422' },
    { text: 'Fetch users with missing auth token', tag: 'Security 401' },
    { text: 'Get user profile with ID 999', tag: 'CRUD 404' },
    { text: 'Simulate server crash with null pointer', tag: 'System 500' }
  ];

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let current = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setTranscript(current);
          setManualInput(current);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn('SpeechRecognition initialization error', err);
        setSpeechSupported(false);
      }
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!speechSupported) {
      // Simulate quick voice trigger if browser speech API is unavailable or restricted
      const randomPrompt = suggestedPrompts[Math.floor(Math.random() * suggestedPrompts.length)].text;
      setManualInput(randomPrompt);
      onSendCommand(randomPrompt, 'voice');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      if (manualInput.trim()) {
        onSendCommand(manualInput.trim(), 'voice');
      }
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim() && !isLoading) {
      onSendCommand(manualInput.trim(), 'natural_language');
    }
  };

  const handleChipClick = (promptText: string) => {
    setManualInput(promptText);
    onSendCommand(promptText, 'voice');
  };

  return (
    <div className="w-full bg-slate-900/90 border-b border-slate-800 p-3 sm:p-4 flex flex-col gap-3">
      {/* Voice Status & Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {isListening ? 'Listening via iQOO Mic...' : 'Voice & Natural Language Engine'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Closed-Loop AI</span>
        </div>
      </div>

      {/* Voice Input Interaction Center */}
      <div className="flex items-center gap-2">
        <button
          id="voice-mic-trigger-btn"
          type="button"
          onClick={toggleListening}
          disabled={isLoading}
          aria-label={isListening ? 'Stop listening' : 'Start voice command'}
          className={`relative p-3.5 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center shrink-0 ${
            isListening
              ? 'bg-rose-600 text-white shadow-rose-600/40 ring-4 ring-rose-500/20 animate-pulse'
              : 'bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold shadow-amber-500/20'
          }`}
        >
          {isListening ? (
            <MicOff className="w-5 h-5 text-white" />
          ) : (
            <Mic className="w-5 h-5 text-slate-950" />
          )}

          {isListening && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          )}
        </button>

        {/* Input Text box */}
        <form onSubmit={handleManualSubmit} className="flex-1 relative flex items-center">
          <input
            id="natural-language-input"
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={isListening ? 'Speak now: "Test login with invalid password"...' : 'Describe test or tap mic: "Test payment with amount 0"...'}
            disabled={isLoading}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all pr-9"
          />
          <button
            type="submit"
            disabled={!manualInput.trim() || isLoading}
            className="absolute right-1.5 p-1.5 rounded-lg text-slate-400 hover:text-amber-400 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            title="Execute Command"
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Real-time Voice Audio Visualizer Bars if Listening */}
      {isListening && (
        <div className="flex items-center justify-center gap-1 py-1.5 bg-slate-950/60 rounded-lg border border-rose-500/20">
          <span className="text-[10px] text-rose-400 font-mono mr-2 animate-pulse">Capturing voice...</span>
          <div className="w-1 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1 h-5 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-2 bg-rose-500 rounded-full animate-bounce"></div>
          <div className="w-1 h-6 bg-rose-400 rounded-full animate-bounce [animation-delay:-0.25s]"></div>
          <div className="w-1 h-3 bg-rose-500 rounded-full animate-bounce"></div>
        </div>
      )}

      {/* Quick Voice / NLP Command Chips */}
      <div>
        <div className="flex items-center justify-between mb-1.5 select-none">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            MVP Voice Scenarios
          </span>
          <span className="text-[10px] text-slate-500">Tap to test</span>
        </div>
        <div className="flex overflow-x-auto gap-1.5 pb-1 scrollbar-none select-none">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(prompt.text)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-amber-500/40 text-slate-300 hover:text-amber-300 flex items-center gap-1.5 transition-all text-left group active:scale-95 disabled:opacity-40 shrink-0 whitespace-nowrap"
            >
              <PlayCircle className="w-3 h-3 text-slate-500 group-hover:text-amber-400 shrink-0" />
              <span>{prompt.text}</span>
              <span className="text-[9px] px-1 rounded bg-slate-900 text-amber-400/80 font-mono shrink-0">
                {prompt.tag}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
