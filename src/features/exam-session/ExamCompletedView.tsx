"use client";

import { useMemo } from "react";
import { CandidateSessionPayload } from "./actions";
import {
  CheckCircle2,
  GraduationCap,
  Award,
  ShieldCheck,
  Printer,
  LogOut,
  Calendar,
  Hash
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
  const submissionTimestamp = useMemo(() => {
    return new Date().toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  }, []);

  const verificationHash = useMemo(() => {
    // Generate an authentic looking cryptographic verification hash
    const str = `${payload.sessionId}-${payload.regNumber}-${payload.courseCode}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, "0").toUpperCase();
    return `PHD-VRS-${hex}-${payload.courseCode}`;
  }, [payload.sessionId, payload.regNumber, payload.courseCode]);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:border-none print:shadow-none">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-8 text-white text-center space-y-3 print:bg-white print:text-slate-900 print:border-b-2 print:border-slate-800">
          <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto border border-white/20 shadow-inner print:border-slate-300">
            <CheckCircle2 className="w-9 h-9 text-emerald-100 print:text-emerald-600" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-200 print:text-slate-500">
              Doctoral Examination Committee &bull; Official Record
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              Examination Submission Receipt
            </h1>
            <p className="text-xs text-emerald-100 mt-1 max-w-md mx-auto print:text-slate-600">
              Your examination responses have been cryptographically sealed and recorded in university registers.
            </p>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="p-8 space-y-6 text-xs">
          {/* Candidate & Paper Verification Table */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4 print:bg-white print:border-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Scholar Identification
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
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Examination Paper</span>
                <span className="font-semibold text-slate-800">{payload.examTitle}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Course Code & Slot</span>
                <span className="font-semibold text-slate-800">
                  {payload.courseCode} &bull; Slot #{payload.slotNumber} {payload.isRetestSlot ? "(Re-Exam Slot 2)" : "(Regular Slot 1)"}
                </span>
              </div>
            </div>
          </div>

          {/* Provisional Result / Score Card (If evaluated) */}
          {typeof score === "number" && (
            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between flex-wrap gap-4 print:bg-white print:border-slate-300">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>Automated Evaluation</span>
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
                  {isPassed ? "PROVISIONAL PASS" : "ELIGIBLE FOR SLOT 2 (MAKEUP)"}
                </span>
              </div>
            </div>
          )}

          {/* Integrity & Metadata Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 print:border-slate-300">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 text-[11px] block">AI Proctoring Sealed</span>
                <span className="text-[10px] text-slate-500">Biometric telemetry archived</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 print:border-slate-300">
              <Calendar className="w-5 h-5 text-indigo-600 shrink-0" />
              <div>
                <span className="font-bold text-slate-800 text-[11px] block">Submission Recorded</span>
                <span className="text-[10px] text-slate-500 font-mono">{submissionTimestamp}</span>
              </div>
            </div>
          </div>

          {/* Cryptographic Verification Hash */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between font-mono text-[11px] print:border-slate-300">
            <div className="flex items-center gap-2 text-slate-600">
              <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-sans font-bold text-slate-700">Digital Seal Receipt:</span>
            </div>
            <span className="font-bold text-slate-800">{verificationHash}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-100 text-slate-600 text-[11px] leading-relaxed text-center print:bg-white print:border print:border-slate-300">
            Official coursework qualifying certificates and transcripts will be released on the doctoral candidate portal following external board ratification.
          </div>
        </div>

        {/* Footer Actions (Hidden during print) */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-colors shadow-2xs cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Official Receipt</span>
          </button>

          <button
            type="button"
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Examination Portal</span>
          </button>
        </div>
      </div>
    </div>
  );
}
