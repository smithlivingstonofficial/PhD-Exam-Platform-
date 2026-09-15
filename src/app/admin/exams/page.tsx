"use client";

import { useState } from "react";
import { INITIAL_MOCK_EXAMS, MockExam } from "@/lib/mock-data";
import { ExamCard, CreateExamModal } from "@/features/examiner-dashboard";
import { Plus, Search } from "lucide-react";

export default function ExamsManagementPage() {
  const [exams, setExams] = useState<MockExam[]>(INITIAL_MOCK_EXAMS);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState<"ALL" | "PUBLISHED" | "DRAFT">("ALL");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateExam = (newExam: MockExam) => {
    setExams([newExam, ...exams]);
  };

  const handleTogglePublish = (id: string) => {
    setExams(
      exams.map((ex) => (ex.id === id ? { ...ex, is_published: !ex.is_published } : ex))
    );
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
          <h1 className="text-xl font-bold text-white">Examinations Manager</h1>
          <p className="text-xs text-neutral-400">Create, schedule, and configure anti-cheat policies for coursework assessments</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Examination</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-neutral-900/60 border border-neutral-800">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(["ALL", "PUBLISHED", "DRAFT"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterTab === tab
                  ? "bg-neutral-800 text-white border border-neutral-700"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by code or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid of Exams */}
      {filteredExams.length > 0 ? (
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
        <div className="p-12 text-center border border-dashed border-neutral-800 rounded-2xl space-y-3">
          <p className="text-sm text-neutral-400">No examinations match the current filter.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs text-indigo-400 hover:underline"
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
