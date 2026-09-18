"use client";

import { useState } from "react";
import { X, Eye, CheckCircle2 } from "lucide-react";
import { SerializedQuestion } from "@/app/admin/actions";

interface QuestionPreviewModalProps {
  isOpen: boolean;
  question: SerializedQuestion | null;
  onClose: () => void;
}

export function QuestionPreviewModal({ isOpen, question, onClose }: QuestionPreviewModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Student View Preview</h2>
              <p className="text-xs text-slate-500">{question.section_name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Question Viewport */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Metadata Bar */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 text-xs">
            <span className="font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
              {question.scope === "COMMON" ? "Part A: General Research" : `Part B: ${question.department_code || "Specialization"}`}
            </span>
            <div className="flex items-center gap-3 text-slate-500 font-semibold">
              <span>Marks: <strong className="text-slate-900">+{question.marks}</strong></span>
              <span>Negative: <strong className="text-rose-600">-{question.negative_marks}</strong></span>
            </div>
          </div>

          {/* Question Text */}
          <div className="text-sm font-semibold text-slate-900 leading-relaxed">
            {question.question_text}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {question.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const isCorrectKey = question.correct_answers.includes(opt.id);

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedOption(opt.id)}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs font-medium transition-all flex items-start gap-3 ${
                    showAnswer && isCorrectKey
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold ring-1 ring-emerald-300"
                      : isSelected
                      ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-semibold"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-lg uppercase flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      showAnswer && isCorrectKey
                        ? "bg-emerald-600 text-white"
                        : isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {opt.id}
                  </span>
                  <span className="flex-1 pt-0.5">{opt.text}</span>
                  {showAnswer && isCorrectKey && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                      Correct Key
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Answer Toggle */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAnswer(!showAnswer)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{showAnswer ? "Hide Correct Answer" : "Reveal Answer Key & Explanation"}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
