"use client";

import { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { 
  QuestionEditorModal, 
  BulkImportQuestionsModal, 
  QuestionPreviewModal 
} from "@/features/examiner-dashboard";
import { 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Trash2, 
  Layers, 
  RefreshCw, 
  Building2,
  Search,
  X,
  Upload,
  Eye,
  BookOpen,
  Calendar,
  AlertCircle,
  HelpCircle,
  Loader2
} from "lucide-react";

function QuestionsBankContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Data states
  const [exams, setExams] = useState<SerializedExam[]>([]);
  const [departments, setDepartments] = useState<SerializedDepartment[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [questions, setQuestions] = useState<SerializedQuestion[]>([]);

  // Loading & Feedback states
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [scopeFilter, setScopeFilter] = useState<"ALL" | "COMMON" | "DEPT">("ALL");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState<boolean>(false);
  const [previewQuestion, setPreviewQuestion] = useState<SerializedQuestion | null>(null);

  // Fetch questions for a specific exam
  const loadQuestions = useCallback(async (examId: string) => {
    if (!examId) {
      setQuestions([]);
      setIsLoadingQuestions(false);
      return;
    }
    setIsLoadingQuestions(true);
    try {
      const result = await getQuestionsForExamAction(examId);
      setQuestions(result);
    } catch (err) {
      console.error("Error loading questions for exam:", err);
      setStatusMessage({ type: "error", text: "Failed to load questions from database." });
    } finally {
      setIsLoadingQuestions(false);
    }
  }, []);

  // Initial load via effect
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [overviewData, deptsData] = await Promise.all([
          getAdminOverviewData(),
          getDepartmentsAction(),
        ]);
        if (!isMounted) return;

        setExams(overviewData.exams);
        setDepartments(deptsData);

        const urlExamId = searchParams.get("examId");
        let activeExamId = "";

        if (urlExamId && overviewData.exams.some((e) => e.id === urlExamId)) {
          activeExamId = urlExamId;
        } else if (overviewData.exams.length > 0) {
          activeExamId = overviewData.exams[0].id;
        }

        setSelectedExamId(activeExamId);

        if (activeExamId) {
          const qList = await getQuestionsForExamAction(activeExamId);
          if (isMounted) {
            setQuestions(qList);
          }
        } else {
          setQuestions([]);
        }
      } catch (err) {
        console.error("Failed to initialize question bank:", err);
        if (isMounted) {
          setStatusMessage({ type: "error", text: "Database connection failed. Please try refreshing." });
        }
      } finally {
        if (isMounted) {
          setIsInitializing(false);
          setIsLoadingQuestions(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  // Manual refresh callback
  const refreshData = async (targetExamId?: string) => {
    setIsInitializing(true);
    setStatusMessage(null);
    try {
      const [overviewData, deptsData] = await Promise.all([
        getAdminOverviewData(),
        getDepartmentsAction(),
      ]);

      setExams(overviewData.exams);
      setDepartments(deptsData);

      const examToLoad = targetExamId || selectedExamId || (overviewData.exams[0]?.id ?? "");
      setSelectedExamId(examToLoad);

      if (examToLoad) {
        setIsLoadingQuestions(true);
        const qList = await getQuestionsForExamAction(examToLoad);
        setQuestions(qList);
      } else {
        setQuestions([]);
      }
    } catch (err) {
      console.error("Failed to refresh question bank:", err);
      setStatusMessage({ type: "error", text: "Failed to refresh question bank." });
    } finally {
      setIsInitializing(false);
      setIsLoadingQuestions(false);
    }
  };

  // Handle changing target exam
  const handleExamChange = (newExamId: string) => {
    setSelectedExamId(newExamId);
    if (newExamId) {
      loadQuestions(newExamId);
      router.replace(`/admin/questions?examId=${newExamId}`, { scroll: false });
    } else {
      setQuestions([]);
    }
  };

  // Create question handler
  const handleSaveQuestion = async (newQuestionData: Parameters<typeof createQuestionAction>[0]) => {
    try {
      const res = await createQuestionAction(newQuestionData);
      if (res.success) {
        setStatusMessage({ type: "success", text: "Question authored and saved to bank successfully." });
        if (selectedExamId) {
          await loadQuestions(selectedExamId);
        }
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to author question." });
      }
    } catch (err) {
      console.error("Error creating question:", err);
      setStatusMessage({ type: "error", text: "Unexpected error while saving question." });
    }
  };

  // Delete question handler
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this question item?")) {
      return;
    }
    setIsDeletingId(id);
    try {
      const res = await deleteQuestionAction(id);
      if (res.success) {
        setStatusMessage({ type: "success", text: "Question item deleted successfully." });
        if (selectedExamId) {
          await loadQuestions(selectedExamId);
        }
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to delete question." });
      }
    } catch (err) {
      console.error("Error deleting question:", err);
      setStatusMessage({ type: "error", text: "Unexpected error during deletion." });
    } finally {
      setIsDeletingId(null);
    }
  };

  // Filter questions dynamically
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // Scope filter
      if (scopeFilter === "COMMON" && q.scope !== "COMMON") return false;
      if (scopeFilter === "DEPT" && q.scope !== "DEPARTMENT_SPECIFIC") return false;

      // Department filter for Part B
      if (scopeFilter === "DEPT" && deptFilter !== "ALL" && q.department_code !== deptFilter) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesPrompt = q.question_text.toLowerCase().includes(query);
        const matchesSection = (q.section_name || "").toLowerCase().includes(query);
        const matchesOptions = q.options.some((opt) => opt.text.toLowerCase().includes(query));
        const matchesDept = (q.department_code || "").toLowerCase().includes(query);
        if (!matchesPrompt && !matchesSection && !matchesOptions && !matchesDept) {
          return false;
        }
      }

      return true;
    });
  }, [questions, scopeFilter, deptFilter, searchQuery]);

  // Metric counts
  const commonCount = useMemo(() => questions.filter((q) => q.scope === "COMMON").length, [questions]);
  const deptCount = useMemo(() => questions.filter((q) => q.scope === "DEPARTMENT_SPECIFIC").length, [questions]);
  const uniqueDeptCodes = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => {
      if (q.scope === "DEPARTMENT_SPECIFIC" && q.department_code) {
        set.add(q.department_code);
      }
    });
    return set.size;
  }, [questions]);

  const currentExam = useMemo(() => exams.find((e) => e.id === selectedExamId), [exams, selectedExamId]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Question Bank & Dual-Paper Rubric</h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              Dual Rubric
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Author Part A (Common Research Aptitude) and Part B (Department-Specific) items with server-cloaked answer keys
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => refreshData(selectedExamId)}
            disabled={isInitializing || isLoadingQuestions}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh Question Bank"
          >
            <RefreshCw className={`w-4 h-4 ${isInitializing || isLoadingQuestions ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          <button
            onClick={() => setIsBulkImportOpen(true)}
            disabled={!selectedExamId || exams.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all shadow-2xs disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Import</span>
          </button>

          <button
            onClick={() => setIsEditorOpen(true)}
            disabled={!selectedExamId || exams.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 shrink-0 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="p-1 hover:bg-slate-200/40 rounded text-slate-500"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4-Card Metric Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Question Pool */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Exam Questions
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {questions.length}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {currentExam ? `${currentExam.course_code} syllabus` : "No exam selected"}
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Part A (Common to All) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Part A: Common
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {commonCount}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Research & Aptitude
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Part B (Department Specific) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Part B: Dept Core
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {deptCount}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {uniqueDeptCodes} Department specialization(s)
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Answer Cloaking Protection */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Answer Cloaking
            </span>
            <div className="text-lg font-black text-emerald-700 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>100% Protected</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Zero client answer leakage
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Container */}
      {isInitializing ? (
        <div className="p-16 text-center border border-slate-200 rounded-2xl bg-white space-y-3 shadow-xs">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Connecting to Supabase PostgreSQL Question Bank...</p>
        </div>
      ) : exams.length === 0 ? (
        /* Empty State: No Exams in Database */
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Examinations Found</h3>
            <p className="text-xs text-slate-500">
              Questions must be mapped to an active examination. Please create an examination schedule first in Exams & Schedules before authoring questions.
            </p>
          </div>
          <Link
            href="/admin/exams"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Examination First</span>
          </Link>
        </div>
      ) : (
        /* Examination & Question Management Interface */
        <div className="space-y-4">
          {/* Target Exam Selector & Status Bar */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0 shadow-2xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Target Examination:
                    </span>
                    {currentExam && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                        {currentExam.duration_minutes} Mins | {currentExam.total_marks} Marks
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedExamId}
                    onChange={(e) => handleExamChange(e.target.value)}
                    className="block font-bold text-xs bg-slate-50 text-indigo-900 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-indigo-600 w-full sm:w-auto"
                  >
                    {exams.map((exam) => (
                      <option key={exam.id} value={exam.id}>
                        {exam.course_code}: {exam.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-[11px]">
                  <Layers className="w-3.5 h-3.5" />
                  <span>{commonCount} Common</span>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 text-violet-700 border border-violet-200 font-bold text-[11px]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{deptCount} Dept Specific</span>
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Cloaked in Supabase</span>
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Pure Light Theme Scope Filter Tabs */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => { setScopeFilter("ALL"); setDeptFilter("ALL"); }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    scopeFilter === "ALL" && deptFilter === "ALL"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Questions ({questions.length})
                </button>
                <button
                  type="button"
                  onClick={() => { setScopeFilter("COMMON"); setDeptFilter("ALL"); }}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    scopeFilter === "COMMON"
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Part A: Common ({commonCount})
                </button>
                <button
                  type="button"
                  onClick={() => setScopeFilter("DEPT")}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    scopeFilter === "DEPT"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Part B: Department Core ({deptCount})
                </button>

                {scopeFilter === "DEPT" && (
                  <div className="flex items-center gap-1.5 ml-1 animate-in fade-in">
                    <span className="text-[11px] font-semibold text-slate-500">Discipline:</span>
                    <select
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-600"
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

              {/* Real-time Search Input */}
              <div className="relative w-full md:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions or topics..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question Items List */}
          <div className="space-y-4">
            {isLoadingQuestions ? (
              <div className="p-16 text-center border border-slate-200 rounded-2xl bg-white space-y-3 shadow-xs">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  Loading dual-rubric questions for {currentExam?.course_code || "selected exam"}...
                </p>
              </div>
            ) : questions.length === 0 ? (
              /* Selected Exam has 0 questions */
              <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1">
                  <h3 className="text-sm font-bold text-slate-900">Question Bank is Empty for this Examination</h3>
                  <p className="text-xs text-slate-500">
                    No questions have been configured yet for &quot;{currentExam?.title}&quot;. You can author questions individually or bulk import using our standard JSON template.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setIsEditorOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Question</span>
                  </button>
                  <button
                    onClick={() => setIsBulkImportOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Bulk Import JSON</span>
                  </button>
                </div>
              </div>
            ) : filteredQuestions.length === 0 ? (
              /* Search / Filter yielded no results */
              <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3 shadow-xs">
                <Search className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 font-medium">No questions matched your search query or filters.</p>
                <button
                  onClick={() => { setSearchQuery(""); setScopeFilter("ALL"); setDeptFilter("ALL"); }}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  Clear filters and reset search
                </button>
              </div>
            ) : (
              /* Render Question Cards */
              filteredQuestions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-6 rounded-2xl border border-slate-200/90 bg-white space-y-4 shadow-xs hover:border-indigo-200 hover:shadow-md transition-all"
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 text-xs font-mono font-bold flex items-center justify-center border border-slate-200">
                        {idx + 1}
                      </span>

                      {/* Scope Badge */}
                      {q.scope === "COMMON" ? (
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          <span>Part A: Common (All Scholars)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>Part B: {q.department_code || "Dept"} Core</span>
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

                      {/* Preview Button */}
                      <button
                        onClick={() => setPreviewQuestion(q)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
                        title="Student View Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        disabled={isDeletingId === q.id}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50 transition-colors disabled:opacity-50"
                        title="Delete Question"
                      >
                        {isDeletingId === q.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Section Label */}
                  <div className="text-[11px] text-slate-500 font-medium">
                    Section: <span className="font-semibold text-slate-700">{q.section_name}</span>
                  </div>

                  {/* Question Prompt */}
                  <p className="text-sm text-slate-900 font-semibold leading-relaxed">
                    {q.question_text}
                  </p>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {q.options.map((opt) => {
                      const isCorrect = q.correct_answers?.includes(opt.id);
                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
                            isCorrect
                              ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium shadow-2xs"
                              : "bg-slate-50 border-slate-200/90 text-slate-700"
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-lg text-[10px] font-bold flex items-center justify-center shrink-0 ${
                              isCorrect
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-slate-600 border border-slate-200"
                            }`}
                          >
                            {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : opt.id.toUpperCase()}
                          </span>
                          <span className="flex-1 leading-snug">{opt.text}</span>
                          {isCorrect && (
                            <span className="text-[10px] font-bold text-emerald-700 px-2 py-0.5 rounded-md bg-emerald-100 uppercase shrink-0">
                              Correct Key
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {/* 1. Add Question Modal */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        examId={selectedExamId}
        departments={departments.map((d) => ({ id: d.id, code: d.code, name: d.name }))}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveQuestion}
      />

      {/* 2. Bulk Import Modal */}
      <BulkImportQuestionsModal
        isOpen={isBulkImportOpen}
        examId={selectedExamId}
        departments={departments}
        onClose={() => setIsBulkImportOpen(false)}
        onImportComplete={async () => {
          setIsBulkImportOpen(false);
          setStatusMessage({ type: "success", text: "Batch questions imported into examination bank successfully." });
          if (selectedExamId) {
            await loadQuestions(selectedExamId);
          }
        }}
      />

      {/* 3. Student View Preview Modal */}
      <QuestionPreviewModal
        isOpen={Boolean(previewQuestion)}
        question={previewQuestion}
        onClose={() => setPreviewQuestion(null)}
      />
    </div>
  );
}

export default function QuestionsBankPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center border border-slate-200 rounded-2xl bg-white space-y-3 max-w-6xl mx-auto">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading Question Bank & Dual-Paper Rubric...</p>
        </div>
      }
    >
      <QuestionsBankContent />
    </Suspense>
  );
}
