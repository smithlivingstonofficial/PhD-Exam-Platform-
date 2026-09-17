"use client";

import { AlertTriangle, CheckCircle2, Flag, HelpCircle, Send } from "lucide-react";

interface SubmitConfirmationModalProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  markedForReviewCount: number;
  unansweredCount: number;
  partAStats: { total: number; answered: number };
  partBStats: { total: number; answered: number };
  isTimeExpired?: boolean;
  isSubmitting: boolean;
  onConfirmSubmit: () => void;
  onCancel: () => void;
}

export function SubmitConfirmationModal({
  isOpen,
  totalQuestions,
  answeredCount,
  markedForReviewCount,
  unansweredCount,
  partAStats,
  partBStats,
  isTimeExpired = false,
  isSubmitting,
  onConfirmSubmit,
  onCancel,
}: SubmitConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`p-6 text-white ${isTimeExpired ? "bg-rose-600" : "bg-slate-900"}`}>
          <div className="flex items-center gap-3">
            {isTimeExpired ? (
              <AlertTriangle className="w-6 h-6 text-rose-200" />
            ) : (
              <HelpCircle className="w-6 h-6 text-indigo-400" />
            )}
            <div>
              <h2 className="text-lg font-bold">
                {isTimeExpired ? "Examination Time Concluded" : "Confirm Final Submission"}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {isTimeExpired
                  ? "Your allocated duration has expired. Responses are being synchronized."
                  : "Please review your response summary before locking your answers."}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Unanswered warning banner */}
          {unansweredCount > 0 && !isTimeExpired && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                You still have <strong>{unansweredCount} unattempted question{unansweredCount > 1 ? "s" : ""}</strong>. Once submitted, you cannot re-enter or alter your choices.
              </span>
            </div>
          )}

          {/* Stats Badges */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-semibold text-[11px]">Answered</span>
              </div>
              <span className="text-xl font-black">{answeredCount}</span>
              <span className="text-[10px] text-emerald-600 block">/ {totalQuestions}</span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Flag className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-semibold text-[11px]">Marked</span>
              </div>
              <span className="text-xl font-black">{markedForReviewCount}</span>
              <span className="text-[10px] text-amber-600 block">for review</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700">
              <div className="flex items-center justify-center gap-1 mb-1">
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-[11px]">Unanswered</span>
              </div>
              <span className="text-xl font-black">{unansweredCount}</span>
              <span className="text-[10px] text-slate-500 block">questions</span>
            </div>
          </div>

          {/* Dual Tier Progress Bars */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                <span>Part A: Common Research & Methodology</span>
                <span className="font-mono">{partAStats.answered} / {partAStats.total}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{
                    width: `${partAStats.total > 0 ? (partAStats.answered / partAStats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                <span>Part B: Department Specialization</span>
                <span className="font-mono">{partBStats.answered} / {partBStats.total}</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-violet-600 rounded-full transition-all"
                  style={{
                    width: `${partBStats.total > 0 ? (partBStats.answered / partBStats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed text-center">
            By confirming submission, your responses will be locked, timestamped, and evaluated atomically.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
          {!isTimeExpired && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-100 transition-colors"
            >
              Return to Paper
            </button>
          )}

          <button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirmSubmit}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? "Submitting..." : "Yes, Submit Final Responses"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
