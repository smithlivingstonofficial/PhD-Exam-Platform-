"use client";

import { useEffect } from "react";
import { Maximize2, ShieldCheck, Lock } from "lucide-react";

interface FullscreenGuardModalProps {
  isOpen: boolean;
  onEnterFullscreen: () => void;
}

export function FullscreenGuardModal({
  isOpen,
  onEnterFullscreen,
}: FullscreenGuardModalProps) {
  // Allow Enter or Space key to quickly re-enter fullscreen
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onEnterFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onEnterFullscreen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-2xl flex flex-col items-center justify-center p-4 sm:p-6 text-center text-white animate-in fade-in duration-200 select-none">
      <div className="max-w-md w-full bg-slate-900/95 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/60 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Shield & Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-800/60 inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Exam Security Active
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Fullscreen Mode Required
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
            To prevent accidental window exits and protect examination fairness, question details are temporarily hidden while outside fullscreen. Your exam progress and answers are 100% saved.
          </p>
        </div>

        {/* Reassuring notice box */}
        <div className="p-3 rounded-xl bg-slate-800/70 border border-slate-700/80 text-left text-xs space-y-1 text-slate-300">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Answers and remaining time are safe</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            Click the button below to resume your examination. No strike or penalty is given for returning.
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onEnterFullscreen}
          className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-98 transition-all cursor-pointer"
        >
          <Maximize2 className="w-4 h-4" />
          <span>Return to Fullscreen & Resume</span>
        </button>

        <p className="text-[10px] text-slate-400 font-medium">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[9px] text-slate-300">Enter</kbd> or click the button above to continue
        </p>
      </div>
    </div>
  );
}
