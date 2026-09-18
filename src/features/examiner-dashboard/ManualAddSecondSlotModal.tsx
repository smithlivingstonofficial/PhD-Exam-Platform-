"use client";

import { useState } from "react";
import { X, RefreshCw, UserPlus } from "lucide-react";
import { manualAddCandidateToSecondSlotAction, SerializedStudent } from "@/app/admin/actions";

interface ManualAddSecondSlotModalProps {
  isOpen: boolean;
  examId: string;
  students: SerializedStudent[];
  onClose: () => void;
  onSuccess: () => void;
}

export function ManualAddSecondSlotModal({
  isOpen,
  examId,
  students,
  onClose,
  onSuccess,
}: ManualAddSecondSlotModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.id || "");
  const [reason, setReason] = useState("Dean Approved / Medical Exception");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !examId) return;

    setIsSubmitting(true);
    const res = await manualAddCandidateToSecondSlotAction(examId, selectedStudentId, reason);
    setIsSubmitting(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      alert("Failed to grant re-exam eligibility: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-700 flex items-center justify-center border border-violet-100 shadow-2xs">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add Scholar to Re-Exam</h2>
              <p className="text-xs text-slate-500">Grant Slot 2 Re-Test Eligibility</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Select Research Scholar</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
            >
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.reg_number} - {s.department_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Administrative Justification / Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 mb-2"
            >
              <option value="Dean Approved / Medical Exception">Dean Approved / Medical Exception</option>
              <option value="Severe Network Disconnection / Hardware Failure">Severe Network Disconnection / Hardware Failure</option>
              <option value="Power Outage during Slot 1">Power Outage during Slot 1</option>
              <option value="Approved University Representation Duty">Approved University Representation Duty</option>
              <option value="Special Review Board Permission">Special Review Board Permission</option>
            </select>

            <textarea
              rows={2}
              placeholder="Additional notes or reference number..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || students.length === 0}
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-md shadow-violet-600/20 disabled:opacity-50 flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? "Approving..." : "Grant Re-Exam Eligibility"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
