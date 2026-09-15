"use client";

import { useState } from "react";
import { QuestionType } from "@/types";
import { X, Plus, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

interface QuestionEditorModalProps {
  isOpen: boolean;
  examId: string;
  onClose: () => void;
  onSave: (question: {
    exam_id: string;
    question_text: string;
    question_type: QuestionType;
    options: { id: string; text: string }[];
    correct_answers: string[];
    marks: number;
    negative_marks: number;
  }) => void;
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

    onSave({
      exam_id: examId,
      question_text: questionText,
      question_type: questionType,
      options: options.filter((opt) => opt.text.trim().length > 0),
      correct_answers: correctAnswers,
      marks: Number(marks),
      negative_marks: Number(negativeMarks),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div>
            <h2 className="text-base font-bold text-slate-900">Add Question to Exam</h2>
            <p className="text-xs text-slate-500">Configure question prompt, choice options, and correct grading answer</p>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Question Text */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Question Prompt *</label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Explain the difference between Type I and Type II errors in hypothesis testing..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
            />
          </div>

          {/* Question Type and Marks */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Question Type</label>
              <select
                value={questionType}
                onChange={(e) => setQuestionType(e.target.value as QuestionType)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white font-medium"
              >
                <option value="MCQ">Single Choice (MCQ)</option>
                <option value="MULTI_SELECT">Multiple Select</option>
                <option value="TEXT">Descriptive / Text</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Marks (+)</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={marks}
                onChange={(e) => setMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Negative Marks (-)</label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={negativeMarks}
                onChange={(e) => setNegativeMarks(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white font-medium"
              />
            </div>
          </div>

          {/* Options Builder */}
          {questionType !== "TEXT" && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-slate-700 font-semibold">Answer Choices & Correct Key *</label>
                <span className="text-[11px] text-slate-500">Click letter circle to mark correct answer</span>
              </div>

              <div className="space-y-2">
                {options.map((opt, idx) => {
                  const isCorrect = correctAnswers.includes(opt.id);
                  return (
                    <div key={opt.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCorrect(opt.id)}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 text-xs font-bold ${
                          isCorrect
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "border border-slate-300 text-slate-600 hover:border-slate-500 bg-slate-100"
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
                        className={`flex-1 px-3 py-2 rounded-lg border text-slate-900 focus:outline-none ${
                          isCorrect ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 bg-slate-50 focus:border-indigo-600 focus:bg-white"
                        }`}
                      />

                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(opt.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
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
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-bold mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add another option</span>
                </button>
              )}
            </div>
          )}

          {/* Security Alert Note */}
          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-2.5 text-indigo-950 text-xs">
            <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span>
              <strong>Server Answer Cloaking:</strong> The correct answers configured here are stored exclusively in Supabase PostgreSQL and are <strong>never sent across the network to student clients</strong>.
            </span>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              Save Question to Supabase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
