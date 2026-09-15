"use client";

import { useState } from "react";
import { Question, QuestionType } from "@/types";
import { X, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface QuestionEditorModalProps {
  isOpen: boolean;
  examId: string;
  onClose: () => void;
  onSave: (question: Question & { correctAnswers: string[] }) => void;
}

export function QuestionEditorModal({ isOpen, examId, onClose, onSave }: QuestionEditorModalProps) {
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState<QuestionType>("MCQ");
  const [options, setOptions] = useState([
    { id: "a", text: "" },
    { id: "b", text: "" },
    { id: "c", text: "" },
    { id: "d", text: "" },
  ]);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>(["a"]);
  const [marks, setMarks] = useState(2);
  const [negativeMarks, setNegativeMarks] = useState(0.5);

  if (!isOpen) return null;

  const handleToggleCorrect = (optionId: string) => {
    if (questionType === "MCQ") {
      setCorrectAnswers([optionId]);
    } else if (questionType === "MULTI_SELECT") {
      if (correctAnswers.includes(optionId)) {
        if (correctAnswers.length > 1) {
          setCorrectAnswers(correctAnswers.filter((id) => id !== optionId));
        }
      } else {
        setCorrectAnswers([...correctAnswers, optionId]);
      }
    }
  };

  const handleAddOption = () => {
    const nextChar = String.fromCharCode(97 + options.length);
    setOptions([...options, { id: nextChar, text: "" }]);
  };

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((opt) => opt.id !== id));
    setCorrectAnswers(correctAnswers.filter((ans) => ans !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    const newQuestion: Question & { correctAnswers: string[] } = {
      id: `q-${Date.now()}`,
      exam_id: examId,
      question_text: questionText,
      question_type: questionType,
      options: options.filter((opt) => opt.text.trim().length > 0),
      marks: Number(marks),
      negative_marks: Number(negativeMarks),
      order_index: Date.now(),
      correctAnswers,
    };

    onSave(newQuestion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div>
            <h2 className="text-base font-bold text-white">Add Question to Exam</h2>
            <p className="text-xs text-neutral-400">Configure question prompt, choice options, and correct grading answer</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Question Text */}
          <div>
            <label className="block text-neutral-300 font-medium mb-1">Question Prompt *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Explain the difference between Type I and Type II errors in hypothesis testing..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          {/* Question Type and Marks */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Question Type</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="MCQ">Single Choice (MCQ)</option>
                <option value="MULTI_SELECT">Multiple Select</option>
                <option value="TEXT">Descriptive / Text</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Marks (+)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-neutral-300 font-medium mb-1">Negative Marks (-)</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Options Builder (for MCQ and MULTI_SELECT) */}
          {questionType !== "TEXT" && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-neutral-300 font-medium">Answer Choices & Correct Key *</label>
                <span className="text-[10px] text-neutral-400">Click circle to mark correct answer</span>
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => {
                  const isCorrect = correctAnswers.includes(opt.id);
                  return (
                    <div key={opt.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCorrect(opt.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
                          isCorrect
                            ? "bg-emerald-500 text-neutral-950 font-bold"
                            : "border border-neutral-700 text-neutral-400 hover:border-neutral-500"
                        }`}
                        title="Toggle correct answer"
                      >
                        {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : opt.id.toUpperCase()}
                      </button>

                      <input
                        type="text"
                        required
                        placeholder={`Option ${idx + 1}`}
                        value={opt.text}
                        onChange={(e) => {
                          const updated = [...options];
                          updated[idx].text = e.target.value;
                          setOptions(updated);
                        }}
                        className={`flex-1 px-3 py-2 rounded-lg bg-neutral-950 border text-white focus:outline-none ${
                          isCorrect ? "border-emerald-500/50 bg-emerald-950/10" : "border-neutral-800 focus:border-indigo-500"
                        }`}
                      />

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(opt.id)}
                          className="p-2 text-neutral-500 hover:text-rose-400"
                          title="Remove option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another option</span>
                </button>
              )}
            </div>
          )}

          {/* Security Alert Note */}
          <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-2 text-neutral-300 text-[11px]">
            <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>Server Answer Cloaking:</strong> The correct answers configured here are stored exclusively in Supabase PostgreSQL and are <strong>never sent to student browsers</strong>.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-500/20"
            >
              Save Question
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
