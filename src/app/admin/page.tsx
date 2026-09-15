"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  INITIAL_MOCK_EXAMS, 
  INITIAL_MOCK_CANDIDATES, 
  MockExam 
} from "@/lib/mock-data";
import { 
  ExamCard, 
  CreateExamModal, 
  LiveProctorMonitor 
} from "@/features/examiner-dashboard";
import { 
  Plus, 
  BookOpenCheck, 
  Users, 
  ShieldAlert, 
  CheckCircle, 
  ArrowRight 
} from "lucide-react";

export default function AdminDashboardPage() {
  const [exams, setExams] = useState<MockExam[]>(INITIAL_MOCK_EXAMS);
  const [candidates] = useState(INITIAL_MOCK_CANDIDATES);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateExam = (newExam: MockExam) => {
    setExams([newExam, ...exams]);
  };

  const handleTogglePublish = (id: string) => {
    setExams(
      exams.map((ex) => (ex.id === id ? { ...ex, is_published: !ex.is_published } : ex))
    );
  };

  // Metrics computation
  const totalExams = exams.length;
  const publishedExams = exams.filter((e) => e.is_published).length;
  const totalCandidates = candidates.length;
  const flaggedCandidates = candidates.filter((c) => c.integrity_score < 80).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-neutral-900 to-purple-950/30 border border-indigo-500/20">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Supabase Edge Orchestration
            </span>
            <span className="text-xs text-neutral-400">Master Evaluation Console</span>
          </div>
          <h2 className="text-xl font-bold text-white">Ph.D Examination Control Board</h2>
          <p className="text-xs text-neutral-400 max-w-xl">
            Configure secure exam schedules, curate question banks with server answer cloaking, and inspect real-time Edge-AI proctoring alerts.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/25 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Exam</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Configured Exams</span>
            <BookOpenCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalExams}</span>
            <span className="text-[11px] text-emerald-400">({publishedExams} Published)</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Registered Scholars</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{totalCandidates}</span>
            <span className="text-[11px] text-neutral-400">Across active sessions</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Integrity Alerts</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{flaggedCandidates}</span>
            <span className="text-[11px] text-amber-400">High-risk flagged</span>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-2">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-xs font-medium">Storage Egress Cost</span>
            <CheckCircle className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">$0.00</span>
            <span className="text-[11px] text-neutral-400">Cloudflare R2 Direct</span>
          </div>
        </div>
      </div>

      {/* Active Exams Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Active Examination Catalog</h3>
            <p className="text-xs text-neutral-400">Review syllabi, question counts, and proctoring parameters</p>
          </div>
          <Link
            href="/admin/exams"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            <span>View all exams</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onTogglePublish={handleTogglePublish}
            />
          ))}
        </div>
      </div>

      {/* Live Proctoring Candidate Grid Preview */}
      <div className="space-y-4 pt-4 border-t border-neutral-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-base font-bold text-white">Live Proctor Telemetry Grid</h3>
            </div>
            <p className="text-xs text-neutral-400">Real-time candidate camera feeds and integrity scores</p>
          </div>
          <Link
            href="/admin/proctor"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
          >
            <span>Full proctoring room</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <LiveProctorMonitor candidates={candidates} />
      </div>

      {/* Create Exam Modal */}
      <CreateExamModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateExam}
      />
    </div>
  );
}
