"use client";

import { CandidateSessionPayload } from "./actions";
import {
  CheckCircle2,
  GraduationCap,
  Award,
  ShieldCheck,
  Printer,
  LogOut,
  Calendar,
} from "lucide-react";

interface ExamCompletedViewProps {
  payload: CandidateSessionPayload;
  score?: number;
  isPassed?: boolean;
  onExit: () => void;
}

export function ExamCompletedView({
  payload,
  score,
  isPassed,
  onExit,
}: ExamCompletedViewProps) {
  const submissionTimestamp = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "medium",
  });

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-8 text-white text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto border border-white/20 shadow-inner">
            <CheckCircle2 className="w-9 h-9 text-emerald-100" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-200">
              Examination Session Successfully Sealed
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              Submission Receipt
            </h1>
            <p className="text-xs text-emerald-100 mt-1 max-w-md mx-auto">
              Your responses have been recorded, cryptographically sealed, and submitted to the doctoral examination committee.
            </p>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-8 space-y-6 text-xs">
          {/* Candidate & Paper Verification Table */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Scholar Credentials
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-md font-mono text-[11px] font-bold bg-white border border-slate-200 text-slate-700">
                {payload.regNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Candidate Name</span>
                <span className="font-bold text-slate-900 text-sm">{payload.fullName}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Academic Department</span>
                <span className="font-semibold text-slate-800">{payload.departmentName} ({payload.departmentCode})</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Coursework Paper</span>
                <span className="font-semibold text-slate-800">{payload.examTitle}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Course Code & Slot</span>
                <span className="font-semibold text-slate-800">
                  {payload.courseCode} • Slot #{payload.slotNumber} {payload.isRetestSlot ? "(Re-Exam)" : "(Regular)"}
                </span>
              </div>
            </div>
          </div>

          {/* Provisional Result / Score Card (If evaluated) */}
          {typeof score === "number" && (
            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Provisional Automated Score</span>
                </div>
                <p className="text-[11px] text-indigo-700">
                  Passing benchmark: {payload.passingMarks} / {payload.totalMarks} marks
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">{score}</span>
                  <span className="text-xs text-slate-500"> / {payload.totalMarks}</span>
                </div>
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    isPassed
                      ? "bg-emerald-600 text-white"
                      : "bg-rose-600 text-white"
                  }`}
                >
                  {isPassed ? "PROVISIONAL PASS" : "NEEDS RETEST (SLOT 2)"}
                </span>
              </div>
            </div>
          )}

          {/* Integrity & Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 text-[11px] block">AI Integrity Sealed</span>
                <span className="text-[10px] text-slate-500">Proctor telemetry & audit logs archived</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 text-[11px] block">Recorded Timestamp</span>
                <span className="text-[10px] text-slate-500 font-mono">{submissionTimestamp}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 text-slate-600 text-[11px] leading-relaxed text-center">
            Official grades and certificates will be published on the university portal following external review board moderation.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-[0.98]"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Examination Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
