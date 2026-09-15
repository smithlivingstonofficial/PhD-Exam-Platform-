"use client";

import { useState, useEffect } from "react";
import { 
  getAdminOverviewData, 
  createExamAction, 
  toggleExamPublishAction, 
  SerializedExam 
} from "@/app/admin/actions";
import { ExamCard, CreateExamModal } from "@/features/examiner-dashboard";
import { Plus, Search, RefreshCw } from "lucide-react";

export default function ExamsManagementPage() {
  const [exams, setExams] = useState<SerializedExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function init() {
      const data = await getAdminOverviewData();
      if (!ignore) {
        setExams(data.exams);
        setIsLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const loadExams = async () => {
    setIsLoading(true);
    const data = await getAdminOverviewData();
    setExams(data.exams);
    setIsLoading(false);
  };

  const handleCreateExam = async (newExamData: Parameters<typeof createExamAction>[0]) => {
    await createExamAction(newExamData);
    await loadExams();
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    await toggleExamPublishAction(id, currentStatus);
    await loadExams();
  };

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.course_code.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterTab === "PUBLISHED") return matchesSearch && exam.is_published;
    if (filterTab === "DRAFT") return matchesSearch && !exam.is_published;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Examinations Manager</h1>
          <p className="text-xs text-slate-500">Create, schedule, and configure anti-cheat policies for coursework assessments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadExams}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors shadow-2xs"
            title="Refresh database data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterTab === tab
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Grid of Exams */}
      {isLoading ? (
        <div className="p-12 text-center border border-slate-200 rounded-2xl bg-white text-xs text-slate-400">
          Loading examinations from Supabase PostgreSQL...
        </div>
      ) : filteredExams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onTogglePublish={handleTogglePublish}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
          <p className="text-xs text-slate-500">No examinations match the current filter.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs text-indigo-600 font-bold hover:underline"
          >
            Create an examination now
          </button>
        </div>
      )}

      {/* Modal */}
      <CreateExamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateExam}
      />
    </div>
  );
}
