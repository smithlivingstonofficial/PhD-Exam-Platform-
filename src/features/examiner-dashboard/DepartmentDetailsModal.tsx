"use client";

import { useState, useEffect } from "react";
import { X, Building2, Users, HelpCircle } from "lucide-react";
import { getDepartmentDetailsAction } from "@/app/admin/actions";

interface DepartmentDetailsModalProps {
  isOpen: boolean;
  departmentId: string | null;
  onClose: () => void;
}

export function DepartmentDetailsModal({ isOpen, departmentId, onClose }: DepartmentDetailsModalProps) {
  const [data, setData] = useState<Awaited<ReturnType<typeof getDepartmentDetailsAction>>["department"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<"SCHOLARS" | "QUESTIONS">("SCHOLARS");

  useEffect(() => {
    if (!isOpen || !departmentId) return;
    let isMounted = true;
    getDepartmentDetailsAction(departmentId).then((res) => {
      if (isMounted) {
        if (res.success && res.department) {
          setData(res.department);
        }
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [isOpen, departmentId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{data?.name || "Department Details"}</h2>
              <p className="text-xs text-slate-500 font-mono">Code: {data?.code}</p>
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
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">Loading department information...</div>
          ) : !data ? (
            <div className="py-12 text-center text-slate-400">Department record not found.</div>
          ) : (
            <>
              {/* Description */}
              {data.description && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 leading-relaxed">
                  {data.description}
                </div>
              )}

              {/* Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setTab("SCHOLARS")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    tab === "SCHOLARS"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Enrolled Scholars ({data.students.length})</span>
                </button>
                <button
                  onClick={() => setTab("QUESTIONS")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all ${
                    tab === "QUESTIONS"
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Specialization Questions ({data.questions.length})</span>
                </button>
              </div>

              {/* Scholar List */}
              {tab === "SCHOLARS" && (
                <div className="space-y-2">
                  {data.students.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400">
                      No scholars registered under this department yet.
                    </div>
                  ) : (
                    data.students.map((s) => (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{s.full_name}</span>
                          <span className="text-slate-500 font-mono text-[11px]">{s.reg_number} • {s.email}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-indigo-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            Code: {s.access_code}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Questions List */}
              {tab === "QUESTIONS" && (
                <div className="space-y-2">
                  {data.questions.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400">
                      No specialization questions configured for this department yet.
                    </div>
                  ) : (
                    data.questions.map((q) => (
                      <div
                        key={q.id}
                        className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-indigo-700 font-mono">{q.course_code}</span>
                          <span className="font-semibold text-slate-500">{q.marks} Marks</span>
                        </div>
                        <p className="font-medium text-slate-800 line-clamp-2">{q.question_text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
