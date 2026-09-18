"use client";

import { useState } from "react";
import { X, Award, FileText } from "lucide-react";
import { overrideCandidateScoreAction } from "@/app/admin/actions";

interface ScoreOverrideModalProps {
  isOpen: boolean;
  sessionId: string | null;
  candidateName: string;
  currentScore: number | null;
  currentPassed: boolean | null;
  onClose: () => void;
  onOverrideSuccess: () => void;
}

export function ScoreOverrideModal({
  isOpen,
  sessionId,
  candidateName,
  currentScore,
  currentPassed,
  onClose,
  onOverrideSuccess,
}: ScoreOverrideModalProps) {
  const [newScore, setNewScore] = useState<number>(currentScore ?? 0);
  const [isPassed, setIsPassed] = useState<boolean>(currentPassed ?? false);
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !sessionId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const res = await overrideCandidateScoreAction(sessionId, newScore, isPassed, remark);
    setIsSubmitting(false);

    if (res.success) {
      onOverrideSuccess();
      onClose();
    } else {
      alert("Failed to update score: " + res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Review & Adjust Marks</h2>
              <p className="text-xs text-slate-500">Candidate: {candidateName}</p>
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
            <label className="font-bold text-slate-700 block mb-1">Adjusted Final Marks (Out of 100)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              required
              value={newScore}
              onChange={(e) => setNewScore(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 font-mono font-bold text-slate-900 text-sm"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1.5">Official Result Decision</label>
            <div className="grid grid-cols-2 gap-2.5">
              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${
                isPassed ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold" : "border-slate-200 text-slate-600"
              }`}>
                <input
                  type="radio"
                  name="passed"
                  checked={isPassed}
                  onChange={() => setIsPassed(true)}
                  className="w-4 h-4 text-emerald-600"
                />
                <span>Passed Examination</span>
              </label>

              <label className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer ${
                !isPassed ? "bg-rose-50 border-rose-300 text-rose-900 font-bold" : "border-slate-200 text-slate-600"
              }`}>
                <input
                  type="radio"
                  name="passed"
                  checked={!isPassed}
                  onChange={() => setIsPassed(false)}
                  className="w-4 h-4 text-rose-600"
                />
                <span>Did Not Pass</span>
              </label>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-indigo-600" /> Evaluation Committee Note / Reason
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Reviewed by university moderation board following re-evaluation of question 4..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 text-xs"
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
              disabled={isSubmitting || !remark.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Confirm & Save Decision"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
