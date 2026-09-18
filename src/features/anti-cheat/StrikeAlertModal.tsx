"use client";

import { AlertOctagon, AlertTriangle, ShieldX, LogOut } from "lucide-react";

interface StrikeAlertModalProps {
  isOpen: boolean;
  strikeNumber: number;
  maxStrikes: number;
  reason: string;
  isDisqualified: boolean;
  onAcknowledge: () => void;
  onExit: () => void;
}

export function StrikeAlertModal({
  isOpen,
  strikeNumber,
  maxStrikes = 3,
  reason,
  isDisqualified,
  onAcknowledge,
  onExit,
}: StrikeAlertModalProps) {
  if (!isOpen) return null;

  const remaining = Math.max(0, maxStrikes - strikeNumber);

  return (
    <div className="fixed inset-0 z-[999999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 text-white animate-in fade-in duration-200 select-none">
      {isDisqualified ? (
        /* DISQUALIFIED HARD FREEZE CARD */
        <div className="max-w-lg w-full bg-slate-900 border-2 border-rose-600 rounded-3xl p-8 text-center space-y-6 shadow-2xl shadow-rose-950 animate-in zoom-in-95">
          <div className="w-20 h-20 rounded-3xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-500">
            <ShieldX className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-rose-600 text-white uppercase tracking-widest inline-block">
              Immediate Disqualification
            </span>
            <h2 className="text-2xl font-black tracking-tight text-white">
              Examination Terminated
            </h2>
            <p className="text-xs text-rose-300 leading-relaxed max-w-sm mx-auto">
              Your examination session has been terminated and locked due to exceeding the maximum allowed academic integrity violations ({maxStrikes}/{maxStrikes} strikes).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-left text-xs space-y-1.5">
            <div className="flex justify-between font-mono text-[11px] text-rose-300">
              <span>Final Infraction:</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
            <p className="font-semibold text-white">{reason}</p>
            <p className="text-[10px] text-rose-400 mt-2">
              All responses have been submitted to the doctoral disciplinary committee with evidence logs.
            </p>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all border border-slate-700 active:scale-98"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Examination Hall</span>
          </button>
        </div>
      ) : (
        /* STRIKE WARNING CARD (STRIKE 1 OR 2) */
        <div
          className={`max-w-md w-full bg-slate-900 rounded-3xl p-8 text-center space-y-6 shadow-2xl border-2 animate-in zoom-in-95 ${
            strikeNumber === 2
              ? "border-amber-500 shadow-amber-950/50"
              : "border-rose-500 shadow-rose-950/50"
          }`}
        >
          <div
            className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto ${
              strikeNumber === 2
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
            }`}
          >
            {strikeNumber === 2 ? (
              <AlertOctagon className="w-8 h-8" />
            ) : (
              <AlertTriangle className="w-8 h-8" />
            )}
          </div>

          <div className="space-y-1.5">
            <span
              className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider inline-block ${
                strikeNumber === 2
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
              }`}
            >
              Strike {strikeNumber} of {maxStrikes}
            </span>
            <h2 className="text-xl font-black text-white">
              {strikeNumber === 2 ? "Final Warning" : "Integrity Violation Detected"}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              {strikeNumber === 2
                ? "This is your LAST warning. One more integrity violation will permanently terminate and disqualify your exam."
                : "A prohibited browser or window event was detected. Continued infractions will result in immediate disqualification."}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-left text-xs">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Detected Infraction:
            </span>
            <span className="font-semibold text-rose-300 text-xs block mt-0.5">
              {reason}
            </span>
          </div>

          <button
            type="button"
            onClick={onAcknowledge}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 text-white transition-all shadow-lg active:scale-98 ${
              strikeNumber === 2
                ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/20"
                : "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-600/20"
            }`}
          >
            <span>
              I Acknowledge ({remaining} Strike{remaining === 1 ? "" : "s"} Remaining)
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
