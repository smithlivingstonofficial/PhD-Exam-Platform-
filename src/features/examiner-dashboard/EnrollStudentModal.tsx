"use client";

import { useState } from "react";
import { X, BookPlus, Layers, Calendar, Clock, AlertCircle, Loader2 } from "lucide-react";
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
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !student) return null;

  // Derive valid exam and slot IDs directly during render without effect cascading
  const effectiveExamId = selectedExamId && exams.some((e) => e.id === selectedExamId)
    ? selectedExamId
    : exams[0]?.id || "";

  const currentExam = exams.find((e) => e.id === effectiveExamId) || exams[0];

  const effectiveSlotId = selectedSlotId && currentExam?.slots?.some((s) => s.id === selectedSlotId)
    ? selectedSlotId
    : currentExam?.slots?.[0]?.id || "";

  const currentSlot = currentExam?.slots?.find((s) => s.id === effectiveSlotId) || currentExam?.slots?.[0];

  const handleExamChange = (examId: string) => {
    setSelectedExamId(examId);
    setSelectedSlotId("");
    setErrorMsg("");
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();

    const targetExamId = effectiveExamId;
    if (!targetExamId) {
      setErrorMsg("No examination selected. Please create an examination first.");
      return;
    }

    const targetSlotId = effectiveSlotId || undefined;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await enrollStudentInExamAction(student.id, targetExamId, targetSlotId);
      setIsSubmitting(false);

      if (res.success) {
        onEnrollSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || "Failed to enroll scholar into examination.");
      }
    } catch (err) {
      console.error("Enrollment failed:", err);
      setIsSubmitting(false);
      setErrorMsg(err instanceof Error ? err.message : "A network error occurred while enrolling scholar.");
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
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Candidate Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Candidate</span>
            <span className="font-bold text-slate-900 text-sm block">{student.full_name}</span>
            <span className="text-slate-500 font-mono block">
              {student.reg_number} • {student.department_code || "GEN"}
            </span>
          </div>

          {/* Examination Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Select Examination</label>
            {exams.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                No active examinations available. Please create an examination first in the Exams tab.
              </div>
            ) : (
              <select
                value={effectiveExamId}
                onChange={(e) => handleExamChange(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white font-medium text-slate-800"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    [{ex.course_code}] {ex.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Timing Slot Selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" /> Timing Slot
            </label>
            <select
              value={effectiveSlotId}
              onChange={(e) => setSelectedSlotId(e.target.value)}
              disabled={!currentExam || !currentExam.slots || currentExam.slots.length === 0}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white font-medium text-slate-800 disabled:opacity-60"
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

          {/* Slot Schedule Details Preview */}
          {currentSlot && (
            <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-indigo-700">
                <Calendar className="w-3.5 h-3.5" />
                <span>Scheduled Window:</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  Starts: {new Date(currentSlot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span>
                  Ends: {new Date(currentSlot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )}

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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enrolling Scholar...</span>
                </>
              ) : (
                <span>Confirm Enrollment</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

