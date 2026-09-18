"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, Maximize2, AlertTriangle } from "lucide-react";

interface FullscreenGuardModalProps {
  isOpen: boolean;
  onEnterFullscreen: () => void;
  onTimeoutViolation?: () => void;
}

export function FullscreenGuardModal({
  isOpen,
  onEnterFullscreen,
  onTimeoutViolation,
}: FullscreenGuardModalProps) {
  const [countdown, setCountdown] = useState<number>(15);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onTimeoutViolation) onTimeoutViolation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onTimeoutViolation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center text-white animate-in fade-in duration-200 select-none">
      <div className="max-w-md w-full bg-slate-900/90 border border-rose-500/40 rounded-3xl p-8 shadow-2xl shadow-rose-950/50 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Flashing Alert Icon */}
        <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500 animate-pulse">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-rose-400 block mb-1">
            Security Lockdown Enforced
          </span>
          <h2 className="text-xl font-black tracking-tight text-white">
            Fullscreen Mode Required
          </h2>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Per university doctoral examination regulations, all assessments must be taken in dedicated fullscreen mode. Any attempt to window, minimize, or split-screen is audited as an integrity violation.
          </p>
        </div>

        {/* Countdown warning box */}
        <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-800/60 flex items-center justify-center gap-3 text-xs text-rose-200">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            Return to fullscreen within:{" "}
            <strong className="font-mono text-base text-white">{countdown}s</strong>
          </span>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onEnterFullscreen}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 active:scale-98 transition-all cursor-pointer"
        >
          <Maximize2 className="w-5 h-5" />
          <span>Enter Fullscreen & Resume</span>
        </button>

        <p className="text-[10px] text-slate-400">
          Infractions are timestamped and reviewed by the examination board.
        </p>
      </div>
    </div>
  );
}
