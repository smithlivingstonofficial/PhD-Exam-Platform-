"use client";

import { useState, useEffect } from "react";
import { X, GraduationCap, Clock, Award, ShieldAlert } from "lucide-react";
import { getStudentProfileHistoryAction } from "@/app/admin/actions";

interface StudentProfileModalProps {
  isOpen: boolean;
  studentId: string | null;
  onClose: () => void;
}

export function StudentProfileModal({ isOpen, studentId, onClose }: StudentProfileModalProps) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getStudentProfileHistoryAction>>["student"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !studentId) return;
    let isMounted = true;
    getStudentProfileHistoryAction(studentId).then((res) => {
      if (isMounted) {
        if (res.success && res.student) {
          setData(res.student);
        }
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Research Scholar Academic Record</h2>
              <p className="text-xs text-slate-500">Curricular enrollment, examination sessions, and integrity audit trail</p>
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
        <div className="p-6 overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading scholar history...</div>
          ) : !data ? (
            <div className="py-12 text-center text-xs text-slate-400">Scholar record not found.</div>
          ) : (
            <>
              {/* Scholar Info Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Registration No</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{data.reg_number}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Full Name</span>
                  <span className="font-bold text-slate-900">{data.full_name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Department</span>
                  <span className="font-bold text-indigo-600">{data.department_code}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{data.department_name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Hall Access Code</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 inline-block mt-0.5">
                    {data.access_code}
                  </span>
                </div>
              </div>

              {/* Examination Sessions History */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Associated Examination Sessions ({data.sessions.length})
                  </h3>
                </div>

                {data.sessions.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl text-xs text-slate-400">
                    No active examination sessions found for this scholar.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.sessions.map((sess) => (
                      <div
                        key={sess.sessionId}
                        className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                                {sess.courseCode}
                              </span>
                              <span className="text-xs font-bold text-slate-900">{sess.examTitle}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-1 block">
                              {sess.slotName} • Attempt #{sess.attemptNumber}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                sess.attendanceStatus === "SUBMITTED"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : sess.attendanceStatus === "IN_EXAM"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : sess.attendanceStatus === "ABSENT"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-slate-50 text-slate-700 border-slate-200"
                              }`}
                            >
                              {sess.attendanceStatus}
                            </span>
                          </div>
                        </div>

                        {/* Metric Bar */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Score:{" "}
                              <strong className="text-slate-900">
                                {sess.finalScore !== null ? `${sess.finalScore} pts` : "Pending"}
                              </strong>
                              {sess.isPassed !== null && (
                                <span className={`ml-1.5 font-bold ${sess.isPassed ? "text-emerald-600" : "text-rose-600"}`}>
                                  ({sess.isPassed ? "Passed" : "Failed"})
                                </span>
                              )}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              Integrity:{" "}
                              <strong className={sess.integrityScore < 80 ? "text-amber-600" : "text-emerald-600"}>
                                {sess.integrityScore}%
                              </strong>
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate">
                              Login: {sess.loginAt ? new Date(sess.loginAt).toLocaleTimeString() : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
            Close Record
          </button>
        </div>
      </div>
    </div>
  );
}
