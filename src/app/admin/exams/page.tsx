"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  getAdminOverviewData, 
  createExamAction, 
  toggleExamPublishAction, 
  deleteExamAction,
  SerializedExam 
} from "@/app/admin/actions";
import { 
  ExamCard, 
  CreateExamModal, 
  EditExamModal, 
  SlotManagerModal 
} from "@/features/examiner-dashboard";
import { 
  Plus, 
  Search, 
  RefreshCw, 
  BookOpen, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Calendar, 
  AlertCircle, 
  X,
  Loader2 
} from "lucide-react";

export default function ExamsManagementPage() {
  const [exams, setExams] = useState<SerializedExam[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterTab, setFilterTab] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingExam, setEditingExam] = useState<SerializedExam | null>(null);
  const [managingSlotsExam, setManagingSlotsExam] = useState<SerializedExam | null>(null);

  // Action states
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  // Initial load effect
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const data = await getAdminOverviewData();
        if (isMounted) {
          setExams(data.exams);
        }
      } catch (err) {
        console.error("Failed to load examinations:", err);
        if (isMounted) {
          setStatusMessage({ type: "error", text: "Failed to connect to Supabase database. Please try refreshing." });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Manual refresh
  const loadExams = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const data = await getAdminOverviewData();
      setExams(data.exams);
    } catch (err) {
      console.error("Failed to reload examinations:", err);
      setStatusMessage({ type: "error", text: "Database connection failed while refreshing." });
    } finally {
      setIsLoading(false);
    }
  };

  // Create exam handler
  const handleCreateExam = async (newExamData: Parameters<typeof createExamAction>[0]) => {
    try {
      const res = await createExamAction(newExamData);
      if (res.success) {
        setStatusMessage({ type: "success", text: `Examination "${newExamData.course_code}" created with Slot 1 successfully.` });
        await loadExams();
        return { success: true };
      } else {
        return { success: false, error: res.error || "Failed to create examination." };
      }
    } catch (err) {
      console.error("Error creating exam:", err);
      return { success: false, error: "Unexpected database error during creation." };
    }
  };

  // Publish toggle handler
  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    setIsActionLoading(true);
    try {
      const res = await toggleExamPublishAction(id, currentStatus);
      if (res.success) {
        setStatusMessage({
          type: "success",
          text: currentStatus 
            ? "Examination shifted to Draft mode." 
            : "Examination published live to scholar portal.",
        });
        await loadExams();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to update publish state." });
      }
    } catch (err) {
      console.error("Error toggling publish:", err);
      setStatusMessage({ type: "error", text: "Unexpected error updating publish state." });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete exam handler
  const handleDeleteExam = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the examination "${title}"? All associated slots and questions will be permanently deleted.`)) {
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await deleteExamAction(id);
      if (res.success) {
        setStatusMessage({ type: "success", text: `Examination "${title}" deleted successfully.` });
        await loadExams();
      } else {
        setStatusMessage({ type: "error", text: res.error || "Failed to delete examination." });
      }
    } catch (err) {
      console.error("Error deleting exam:", err);
      setStatusMessage({ type: "error", text: "Unexpected error during deletion." });
    } finally {
      setIsActionLoading(false);
    }
  };

  // Metrics
  const publishedCount = useMemo(() => exams.filter((e) => e.is_published).length, [exams]);
  const draftCount = useMemo(() => exams.filter((e) => !e.is_published).length, [exams]);
  const totalSlotsCount = useMemo(() => exams.reduce((acc, e) => acc + (e.slots?.length || 0), 0), [exams]);
  const aiProtectedCount = useMemo(
    () => exams.filter((e) => e.anti_cheat_config?.enable_face_tracking || e.anti_cheat_config?.enable_audio_monitoring).length,
    [exams]
  );

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        exam.title.toLowerCase().includes(q) ||
        exam.course_code.toLowerCase().includes(q) ||
        (exam.description && exam.description.toLowerCase().includes(q));

      if (filterTab === "PUBLISHED") return matchesSearch && exam.is_published;
      if (filterTab === "DRAFT") return matchesSearch && !exam.is_published;
      return matchesSearch;
    });
  }, [exams, searchQuery, filterTab]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Examinations Manager</h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
              Exam Schedules
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, schedule, and configure dual-paper coursework rubrics and Edge-AI proctoring guidelines
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadExams}
            disabled={isLoading || isActionLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh examination list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || isActionLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Examination</span>
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
        {/* Card 1: Total Examinations */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Examinations
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {exams.length}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {publishedCount} Published, {draftCount} Drafts
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Published & Active */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Published & Active
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {publishedCount}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Live on scholar portal
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total Timing Slots */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Active Slots
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalSlotsCount}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Primary & Make-up windows
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Edge-AI Anti-Cheat Lockdown */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Anti-Cheat Enforced
            </span>
            <div className="text-2xl font-black text-violet-700 mt-1">
              {aiProtectedCount} / {exams.length}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Vision & Audio VAD Active
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-xs">
        {/* Pure Light Theme Status Filter Tabs */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((tab) => {
            const count = tab === "ALL" ? exams.length : tab === "PUBLISHED" ? publishedCount : draftCount;
            const label = tab === "ALL" ? "All" : tab === "PUBLISHED" ? "Published" : "Draft";
            const isActive = filterTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilterTab(tab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Real-time Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code, title, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-colors"
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

      {/* Grid of Exams */}
      {isLoading ? (
        <div className="p-16 text-center border border-slate-200 rounded-2xl bg-white space-y-3 shadow-xs">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Connecting to Supabase PostgreSQL Examinations...</p>
        </div>
      ) : exams.length === 0 ? (
        /* Empty State: No Exams in Database */
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-2xs">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-base font-bold text-slate-900">No Examinations Scheduled</h3>
            <p className="text-xs text-slate-500">
              Get started by scheduling your first Ph.D entrance or qualifying examination with dual-paper rubrics, timing slots, and Edge-AI anti-cheat policies.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Examination</span>
          </button>
        </div>
      ) : filteredExams.length === 0 ? (
        /* Search / Filter yields 0 matches */
        <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3 shadow-xs">
          <Search className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs text-slate-600 font-medium">No examinations match your current filter or search criteria.</p>
          <button
            onClick={() => { setSearchQuery(""); setFilterTab("ALL"); }}
            className="text-xs font-bold text-indigo-600 hover:underline"
          >
            Clear filters and reset search
          </button>
        </div>
      ) : (
        /* Grid of Exam Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onTogglePublish={handleTogglePublish}
              onEdit={(e) => setEditingExam(e)}
              onManageSlots={(e) => setManagingSlotsExam(e)}
              onDelete={handleDeleteExam}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {/* 1. Create Exam Modal */}
      <CreateExamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateExam}
      />

      {/* 2. Edit Exam Modal */}
      <EditExamModal
        isOpen={Boolean(editingExam)}
        exam={editingExam}
        onClose={() => setEditingExam(null)}
        onSave={loadExams}
      />

      {/* 3. Slot Manager Modal */}
      <SlotManagerModal
        isOpen={Boolean(managingSlotsExam)}
        exam={managingSlotsExam}
        onClose={() => setManagingSlotsExam(null)}
        onUpdate={loadExams}
      />
    </div>
  );
}
