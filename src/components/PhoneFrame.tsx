import React from 'react';
import { Wifi, BatteryMedium, Signal, Smartphone, Monitor, Sparkles } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
  isPhoneMode: boolean;
  onToggleMode: () => void;
  onOpenArchitecture: () => void;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  isPhoneMode,
  onToggleMode,
  onOpenArchitecture
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start py-4 px-2 sm:px-6 relative overflow-x-hidden selection:bg-amber-500/20 selection:text-slate-100">
      {/* Top Banner & Control Bar */}
      <header className="w-full max-w-6xl mb-4 flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 select-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-tight">FixLoop AI</h1>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                iQOO × Spring Boot MVP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Natural Language &bull; Voice &bull; Camera OCR &bull; Auto Fix & Retest
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="view-arch-btn"
            onClick={onOpenArchitecture}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="View Hackathon Architecture & Pitch"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            System Architecture
          </button>

          <button
            id="toggle-view-mode-btn"
            onClick={onToggleMode}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all active:scale-95"
          >
            {isPhoneMode ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span>Workbench View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span>iQOO Phone View</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      {isPhoneMode ? (
        <div className="relative my-2 transition-all duration-300">
          {/* Phone Outer Shell */}
          <div className="w-[395px] h-[820px] bg-slate-900 rounded-[48px] p-3 shadow-2xl shadow-amber-950/20 border-4 border-slate-700/80 relative flex flex-col ring-1 ring-slate-600/30">
            {/* Phone Buttons Simulation */}
            <div className="absolute -left-[7px] top-28 w-[3px] h-10 bg-slate-600 rounded-l-sm"></div>
            <div className="absolute -left-[7px] top-42 w-[3px] h-10 bg-slate-600 rounded-l-sm"></div>
            <div className="absolute -right-[7px] top-32 w-[3px] h-14 bg-amber-500 rounded-r-sm"></div>

            {/* Screen Inner Frame */}
            <div className="w-full h-full bg-slate-950 rounded-[40px] overflow-hidden flex flex-col relative border border-slate-800">
              {/* Phone Status Bar */}
              <div className="w-full h-8 px-6 pt-1 flex items-center justify-between text-[11px] font-medium text-slate-400 select-none z-20 bg-slate-950/90">
                <span>{currentTime}</span>

                {/* Camera punch-hole */}
                <div className="w-4 h-4 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-950 ring-1 ring-slate-800"></div>
                </div>

                <div className="flex items-center gap-1.5 text-slate-400">
                  <Signal className="w-3 h-3" />
                  <span className="text-[9px] font-bold text-amber-400">5G</span>
                  <Wifi className="w-3 h-3" />
                  <BatteryMedium className="w-3.5 h-3.5 text-slate-300" />
                </div>
              </div>

              {/* Scrollable Screen Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col scrollbar-thin scrollbar-thumb-slate-800">
                {children}
              </div>

              {/* Android Home Indicator Pill */}
              <div className="w-full h-4 flex items-center justify-center bg-slate-950 py-1">
                <div className="w-32 h-1 bg-slate-600/60 rounded-full"></div>
              </div>
            </div>
          </div>
          <div className="text-center mt-2">
            <span className="text-[11px] text-slate-500 font-mono tracking-wider">iQOO Flagship Device &bull; Android 15 &bull; Monster Mode</span>
          </div>
        </div>
      ) : (
        /* Full-Width Desktop / Workbench View */
        <div className="w-full max-w-6xl bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[750px]">
          {children}
        </div>
      )}
    </div>
  );
};
