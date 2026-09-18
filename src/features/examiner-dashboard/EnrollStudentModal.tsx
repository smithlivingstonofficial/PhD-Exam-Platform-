"use client";

import { useState } from "react";
import { X, BookPlus, Layers } from "lucide-react";
import { enrollStudentInExamAction, SerializedExam, SerializedStudent } from "@/app/admin/actions";

interface EnrollStudentModalProps {
  isOpen: boolean;
  student: SerializedStudent | null;
  exams: SerializedExam[];
  onClose: () => void;
  onEnrollSuccess: () => void;
}

export function EnrollStudentModal({
  isOpen,
  student,
  exams,
  onClose,
  onEnrollSuccess,
}: EnrollStudentModalProps) {
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || "");
  const [selectedSlotId, setSelectedSlotId] = useState(exams[0]?.slots[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !student) return null;

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    const ex = exams.find((e) => e.id === examId);
    if (ex && ex.slots.length > 0) {
      setSelectedSlotId(ex.slots[0].id);
    } else {
      setSelectedSlotId("");
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId) return;

    setIsSubmitting(true);
    setErrorMsg("");

    const res = await enrollStudentInExamAction(student.id, selectedExamId, selectedSlotId || undefined);
    setIsSubmitting(false);

    if (res.success) {
      onEnrollSuccess();
      onClose();
    } else {
      setErrorMsg(res.error || "Failed to enroll scholar");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <BookPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Enroll Scholar into Exam</h2>
              <p className="text-xs text-slate-500">Allocate examination syllabus and timing slot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleEnroll} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Candidate</span>
            <span className="font-bold text-slate-900">{student.full_name}</span>
            <span className="text-slate-500 font-mono block">{student.reg_number} • {student.department_code}</span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Examination</label>
            <select
              value={selectedExamId}
              onChange={(e) => handleExamChange(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  [{ex.course_code}] {ex.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Timing Slot
            </label>
            <select
              value={selectedSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
            >
              {currentExam?.slots && currentExam.slots.length > 0 ? (
                currentExam.slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.slot_name} ({new Date(s.start_time).toLocaleDateString()} {new Date(s.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </option>
                ))
              ) : (
                <option value="">No slots configured (Primary Auto-assigned)</option>
              )}
            </select>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || exams.length === 0}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "Enrolling..." : "Confirm Enrollment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
