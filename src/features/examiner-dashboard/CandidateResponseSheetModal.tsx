"use client";

import { useState, useEffect } from "react";
import { X, Award, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { getCandidateSessionResponsesAction, CandidateResponseDetail } from "@/app/admin/actions";

interface CandidateResponseSheetModalProps {
  isOpen: boolean;
  sessionId: string | null;
  onClose: () => void;
}

export function CandidateResponseSheetModal({
  isOpen,
  sessionId,
  onClose,
}: CandidateResponseSheetModalProps) {
  const [data, setData] = useState<{
    candidate: {
      fullName: string;
      regNumber: string;
      departmentCode: string;
      examTitle: string;
      finalScore: number | null;
      isPassed: boolean | null;
      integrityScore: number;
      violationCount: number;
    };
    responses: CandidateResponseDetail[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    let isMounted = true;
    getCandidateSessionResponsesAction(sessionId).then((res) => {
      if (isMounted) {
        if (res.success && res.candidate) {
          setData({ candidate: res.candidate, responses: res.responses });
        }
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Candidate Response Sheet</h2>
              <p className="text-xs text-slate-500">Official Question-by-Question Evaluation Breakdown</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">Loading student responses...</div>
          ) : !data ? (
            <div className="py-12 text-center text-slate-400">No responses recorded for this session.</div>
          ) : (
            <>
              {/* Candidate Banner */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidate</span>
                  <span className="font-bold text-slate-900 block">{data.candidate.fullName}</span>
                  <span className="text-slate-500 font-mono text-[11px]">{data.candidate.regNumber}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                  <span className="font-bold text-indigo-700">{data.candidate.departmentCode}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Marks</span>
                  <span className="font-bold text-slate-900 text-sm">{data.candidate.finalScore ?? 0} pts</span>
                  <span className={`text-[10px] font-bold block ${data.candidate.isPassed ? "text-emerald-600" : "text-rose-600"}`}>
                    {data.candidate.isPassed ? "Result: Passed" : "Result: Did Not Pass"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Proctor Integrity</span>
                  <span className="font-bold text-slate-900">{data.candidate.integrityScore}%</span>
                  <span className="text-[10px] text-slate-500 block">{data.candidate.violationCount} notices</span>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Evaluated Questions ({data.responses.length})
                </h3>

                {data.responses.map((q, idx) => {
                  const isAttempted = q.selectedOptions.length > 0 || !!q.textResponse;

                  return (
                    <div
                      key={q.questionId}
                      className={`p-4 rounded-xl border transition-all ${
                        q.isCorrect
                          ? "bg-emerald-50/20 border-emerald-200"
                          : isAttempted
                          ? "bg-rose-50/20 border-rose-200"
                          : "bg-slate-50/40 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-500">Q{idx + 1}.</span>
                          <span className="font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                            {q.sectionName}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {q.isCorrect ? (
                            <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> Correct (+{q.marks})
                            </span>
                          ) : isAttempted ? (
                            <span className="flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 text-[10px]">
                              <XCircle className="w-3 h-3" /> Incorrect (-{q.negativeMarks})
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 text-[10px]">
                              <MinusCircle className="w-3 h-3" /> Unanswered (0)
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="font-semibold text-slate-900 mb-3 text-xs leading-relaxed">
                        {q.questionText}
                      </p>

                      {/* Options breakdown */}
                      <div className="space-y-1.5 pl-2 border-l-2 border-slate-200">
                        {q.options.map((opt) => {
                          const isStudentPick = q.selectedOptions.includes(opt.id);
                          const isOfficialKey = q.correctAnswers.includes(opt.id);

                          return (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-lg text-[11px] flex items-center justify-between ${
                                isOfficialKey
                                  ? "bg-emerald-50 text-emerald-900 font-bold border border-emerald-200"
                                  : isStudentPick
                                  ? "bg-rose-50 text-rose-900 font-semibold border border-rose-200"
                                  : "text-slate-600"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className="uppercase font-mono font-bold">[{opt.id}]</span>
                                <span>{opt.text}</span>
                              </span>

                              <div className="flex items-center gap-2">
                                {isStudentPick && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 font-bold">
                                    Student Choice
                                  </span>
                                )}
                                {isOfficialKey && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-bold">
                                    Official Key
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
}
