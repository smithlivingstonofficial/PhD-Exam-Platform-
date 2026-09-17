"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { 
  getAdminOverviewData, 
  getQuestionsForExamAction, 
  createQuestionAction, 
  deleteQuestionAction,
  getDepartmentsAction,
  SerializedExam,
  SerializedQuestion,
  SerializedDepartment
} from "@/app/admin/actions";
import { QuestionEditorModal } from "@/features/examiner-dashboard";
import { 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Trash2, 
  Layers, 
  RefreshCw, 
  Building2 
} from "lucide-react";

function QuestionsBankContent() {
  const searchParams = useSearchParams();
  const [exams, setExams] = useState<SerializedExam[]>([]);
  const [departments, setDepartments] = useState<SerializedDepartment[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [questions, setQuestions] = useState<SerializedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [scopeFilter, setScopeFilter] = useState<string>("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");

  // Load available exams and departments
  useEffect(() => {
    let ignore = false;
    async function init() {
      const [overviewData, deptsData] = await Promise.all([
        getAdminOverviewData(),
        getDepartmentsAction(),
      ]);
      if (ignore) return;
      setExams(overviewData.exams);
      setDepartments(deptsData);

      const urlExamId = searchParams.get("examId");
      if (urlExamId && overviewData.exams.some((e) => e.id === urlExamId)) {
        setSelectedExamId(urlExamId);
      } else if (overviewData.exams.length > 0) {
        setSelectedExamId(overviewData.exams[0].id);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [searchParams]);

  // Load questions for the selected exam
  const loadQuestions = useCallback(async (examId: string) => {
    if (!examId) return;
    setIsLoading(true);
    const result = await getQuestionsForExamAction(examId);
    setQuestions(result);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchQuestions() {
      if (!selectedExamId) return;
      setIsLoading(true);
      const result = await getQuestionsForExamAction(selectedExamId);
      if (isMounted) {
        setQuestions(result);
        setIsLoading(false);
      }
    }
    fetchQuestions();
    return () => {
      isMounted = false;
    };
  }, [selectedExamId]);

  const handleSaveQuestion = async (newQuestionData: Parameters<typeof createQuestionAction>[0]) => {
    await createQuestionAction(newQuestionData);
    if (selectedExamId) {
      await loadQuestions(selectedExamId);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm("Are you sure you want to delete this question?")) {
      await deleteQuestionAction(id);
      if (selectedExamId) {
        await loadQuestions(selectedExamId);
      }
    }
  };

  // Filter questions
  const filteredQuestions = questions.filter((q) => {
    if (scopeFilter === "COMMON" && q.scope !== "COMMON") return false;
    if (scopeFilter === "DEPT" && q.scope !== "DEPARTMENT_SPECIFIC") return false;
    if (deptFilter !== "ALL" && q.department_code !== deptFilter) return false;
    return true;
  });

  const commonCount = questions.filter((q) => q.scope === "COMMON").length;
  const deptCount = questions.filter((q) => q.scope === "DEPARTMENT_SPECIFIC").length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Question Bank & Dual-Paper Rubric</h1>
          <p className="text-xs text-slate-500">
            Author Part A (Common to all Departments) and Part B (Department Specific) questions with server-cloaked answer keys
          </p>
        </div>
        <button
          onClick={() => setIsEditorOpen(true)}
          disabled={!selectedExamId}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 shrink-0 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>Add Question</span>
        </button>
      </div>

      {/* Exam & Scope Selector Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Target Examination:</span>
              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="block font-bold text-xs bg-slate-50 text-indigo-700 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-600"
              >
                {exams.length === 0 ? (
                  <option value="">No exams found — create an exam first</option>
                ) : (
                  exams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.course_code}: {exam.title}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px]">
              <Layers className="w-3.5 h-3.5" />
              <span>{commonCount} Common</span>
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 font-bold text-[11px]">
              <Building2 className="w-3.5 h-3.5" />
              <span>{deptCount} Dept Specific</span>
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cloaked in Supabase</span>
            </span>
            <button
              onClick={() => selectedExamId && loadQuestions(selectedExamId)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
              title="Refresh questions"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => { setScopeFilter("ALL"); setDeptFilter("ALL"); }}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                scopeFilter === "ALL" && deptFilter === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => { setScopeFilter("COMMON"); setDeptFilter("ALL"); }}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                scopeFilter === "COMMON"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Part A: Common ({commonCount})
            </button>
            <button
              onClick={() => setScopeFilter("DEPT")}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                scopeFilter === "DEPT"
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Part B: Department Core ({deptCount})
            </button>
          </div>

          {scopeFilter === "DEPT" && (
            <div className="flex items-center gap-2 animate-in fade-in">
              <span className="text-[11px] font-semibold text-slate-500">Discipline:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-indigo-600"
              >
                <option value="ALL">All Disciplines</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    {d.code} - {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Question Items List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center border border-slate-200 rounded-2xl bg-white text-xs text-slate-400">
            Loading questions from Supabase PostgreSQL...
          </div>
        ) : filteredQuestions.length > 0 ? (
          filteredQuestions.map((q, idx) => (
            <div
              key={q.id}
              className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all"
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center border border-slate-200/80">
                    {idx + 1}
                  </span>

                  {/* Scope Badge */}
                  {q.scope === "COMMON" ? (
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Part A: Common (All Scholars)
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                      Part B: {q.department_code || "Dept"} Core
                    </span>
                  )}

                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {q.question_type}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-700 font-mono font-semibold flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-amber-500" />
                    +{q.marks} / -{q.negative_marks} marks
                  </span>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Section display */}
              <div className="text-[11px] text-slate-500 font-medium italic">
                {q.section_name}
              </div>

              {/* Question Prompt */}
              <p className="text-sm text-slate-900 font-semibold leading-relaxed">
                {q.question_text}
              </p>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {q.options.map((opt) => {
                  const isCorrect = q.correct_answers?.includes(opt.id);
                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                        isCorrect
                          ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-medium"
                          : "bg-slate-50 border-slate-200/90 text-slate-700"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 shadow-2xs ${
                          isCorrect
                            ? "bg-emerald-600 text-white"
                            : "bg-white text-slate-600 border border-slate-200"
                        }`}
                      >
                        {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : opt.id.toUpperCase()}
                      </span>
                      <span className="flex-1">{opt.text}</span>
                      {isCorrect && (
                        <span className="text-[10px] font-bold text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-100 uppercase">
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
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
            <p className="text-xs text-slate-500">No questions found matching your filter.</p>
            <button
              onClick={() => setIsEditorOpen(true)}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Add a new question to this examination
            </button>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        examId={selectedExamId}
        departments={departments.map((d) => ({ id: d.id, code: d.code, name: d.name }))}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveQuestion}
      />
    </div>
  );
}

export default function QuestionsBankPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Question Bank...</div>}>
      <QuestionsBankContent />
    </Suspense>
  );
}
