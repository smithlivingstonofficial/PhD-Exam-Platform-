"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
  INITIAL_MOCK_EXAMS, 
  INITIAL_MOCK_QUESTIONS 
} from "@/lib/mock-data";
import { Question } from "@/types";
import { QuestionEditorModal } from "@/features/examiner-dashboard";
import { 
  Plus, 
  HelpCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Trash2, 
  Layers 
} from "lucide-react";

function QuestionsBankContent() {
  const searchParams = useSearchParams();
  const initialExamId = searchParams.get("examId") || INITIAL_MOCK_EXAMS[0].id;

  const [selectedExamId, setSelectedExamId] = useState(initialExamId);
  const [questionsMap, setQuestionsMap] = useState<Record<string, (Question & { correctAnswers?: string[] })[]>>({
    ...INITIAL_MOCK_QUESTIONS,
    "exam-phd-rm-101": [
      {
        ...INITIAL_MOCK_QUESTIONS["exam-phd-rm-101"][0],
        correctAnswers: ["b"],
      },
      {
        ...INITIAL_MOCK_QUESTIONS["exam-phd-rm-101"][1],
        correctAnswers: ["b"],
      },
      {
        ...INITIAL_MOCK_QUESTIONS["exam-phd-rm-101"][2],
        correctAnswers: ["a", "b", "c"],
      },
    ],
  });

  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const currentQuestions = questionsMap[selectedExamId] || [];

  const handleSaveQuestion = (newQuestion: Question & { correctAnswers: string[] }) => {
    setQuestionsMap({
      ...questionsMap,
      [selectedExamId]: [...(questionsMap[selectedExamId] || []), newQuestion],
    });
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestionsMap({
      ...questionsMap,
      [selectedExamId]: (questionsMap[selectedExamId] || []).filter((q) => q.id !== id),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Question Bank & Rubric Editor</h1>
          <p className="text-xs text-neutral-400">
            Author questions with marking rubrics and server-side protected answer keys
          </p>
        </div>
        <button
          onClick={() => setIsEditorOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Exam Selector Bar */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Layers className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-neutral-200">Active Examination:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="block font-bold text-xs bg-neutral-950 text-indigo-300 border border-neutral-800 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              {INITIAL_MOCK_EXAMS.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.course_code}: {exam.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-neutral-400">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-950 border border-neutral-800">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentQuestions.length} Questions</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Answers Cloaked via RLS</span>
          </span>
        </div>
      </div>

      {/* Question Items List */}
      <div className="space-y-4">
        {currentQuestions.length > 0 ? (
          currentQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/40 space-y-4 hover:border-neutral-700 transition-colors"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-neutral-800 text-neutral-300 text-xs font-mono font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-800/80 text-indigo-400 border border-neutral-700">
                    {q.question_type}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-300 font-mono flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-neutral-400" />
                    +{q.marks} / -{q.negative_marks} marks
                  </span>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="text-neutral-500 hover:text-rose-400 p-1"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Prompt */}
              <p className="text-sm text-neutral-100 font-medium leading-relaxed">
                {q.question_text}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                {q.options.map((opt) => {
                  const isCorrect = q.correctAnswers?.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center gap-2.5 ${
                        isCorrect
                          ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                          : "bg-neutral-950/60 border-neutral-800/80 text-neutral-300"
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                          isCorrect
                            ? "bg-emerald-500 text-neutral-950"
                            : "bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : opt.id.toUpperCase()}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {isCorrect && (
                        <span className="text-[10px] font-semibold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/80 uppercase">
                          Correct
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl space-y-3">
            <p className="text-sm text-neutral-400">No questions added to this examination yet.</p>
            <button
              onClick={() => setIsEditorOpen(true)}
              className="text-xs text-indigo-400 hover:underline"
            >
              Add the first question now
            </button>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        examId={selectedExamId}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveQuestion}
      />
    </div>
  );
}

export default function QuestionsBankPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-400 text-xs">Loading Question Bank...</div>}>
      <QuestionsBankContent />
    </Suspense>
  );
}
