"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  getAdminOverviewData, 
  createExamAction, 
  toggleExamPublishAction, 
  issueWarningAction, 
  terminateSessionAction,
  seedDemoDataAction,
  SerializedExam, 
  SerializedCandidate 
} from "@/app/admin/actions";
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
  ArrowRight,
  RefreshCw,
  Sparkles,
  Building2,
  UserCheck,
  Award
} from "lucide-react";

export default function AdminDashboardPage() {
  const [exams, setExams] = useState<SerializedExam[]>([]);
  const [candidates, setCandidates] = useState<SerializedCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function init() {
      const data = await getAdminOverviewData();
      if (!ignore) {
        setExams(data.exams);
        setCandidates(data.candidates);
        setIsLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const data = await getAdminOverviewData();
    setExams(data.exams);
    setCandidates(data.candidates);
    setIsLoading(false);
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    const res = await seedDemoDataAction();
    setIsSeeding(false);
    if (res.success) {
      alert("Sample Ph.D System loaded: Departments, Scholars, Exam Slots & Questions populated!");
      await loadData();
    } else {
      alert("Error seeding data: " + res.message);
    }
  };

  const handleCreateExam = async (newExamData: Parameters<typeof createExamAction>[0]) => {
    await createExamAction(newExamData);
    await loadData();
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    await toggleExamPublishAction(id, currentStatus);
    await loadData();
  };

  const handleIssueWarning = async (sessionId: string) => {
    await issueWarningAction(sessionId);
    await loadData();
  };

  const handleDisqualify = async (sessionId: string) => {
    await terminateSessionAction(sessionId);
    await loadData();
  };

  const totalExams = exams.length;
  const publishedExams = exams.filter((e) => e.is_published).length;
  const totalCandidates = candidates.length;
  const flaggedCandidates = candidates.filter((c) => c.integrity_score < 80).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-7 rounded-2xl bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 border border-indigo-100 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100/80 text-indigo-700 border border-indigo-200">
              Supabase PostgreSQL Live
            </span>
            <span className="text-xs text-slate-500 font-medium">Master Examination & Proctor Console</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Ph.D Examination Operations Center</h1>
          <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
            Manage academic departments, dual-tier questions (Part A Common + Part B Department), server timing windows, real-time attendance, and automated second-slot re-exam scheduling.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 font-bold text-xs hover:bg-violet-100 transition-colors shadow-2xs disabled:opacity-50"
            title="Populate test departments, scholars, and dual questions"
          >
            <Sparkles className={`w-4 h-4 ${isSeeding ? "animate-spin" : ""}`} />
            <span>{isSeeding ? "Seeding Dataset..." : "Seed Ph.D Demo Dataset"}</span>
          </button>
          <button
            onClick={loadData}
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
            <span>Create New Exam</span>
          </button>
        </div>
      </div>

      {/* Quick Navigation Hub */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/admin/departments"
          className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-indigo-600">Departments</span>
            <span className="text-[11px] text-slate-400">Curricula & quotas</span>
          </div>
        </Link>

        <Link
          href="/admin/attendance"
          className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-indigo-300 hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-emerald-600">Live Attendance</span>
            <span className="text-[11px] text-slate-400">Waiting room & hall</span>
          </div>
        </Link>

        <Link
          href="/admin/second-slot"
          className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-violet-300 hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-violet-600">Second Slot Hub</span>
            <span className="text-[11px] text-slate-400">Re-exam & makeup</span>
          </div>
        </Link>

        <Link
          href="/admin/results"
          className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-amber-300 hover:shadow-xs transition-all flex items-center gap-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block group-hover:text-amber-600">Evaluation Center</span>
            <span className="text-[11px] text-slate-400">Part A + B scores</span>
          </div>
        </Link>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Configured Exams</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpenCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalExams}</span>
            <span className="text-xs font-semibold text-emerald-600">({publishedExams} Published)</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Enrolled Scholars</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{totalCandidates}</span>
            <span className="text-xs font-medium text-slate-500">Across sessions</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Integrity Flags</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">{flaggedCandidates}</span>
            <span className="text-xs font-semibold text-amber-600">High-risk flagged</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Storage Egress</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600">$0.00</span>
            <span className="text-xs font-medium text-slate-500">Cloudflare R2 Direct</span>
          </div>
        </div>
      </div>

      {/* Active Exams Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Active Examination Catalog</h2>
            <p className="text-xs text-slate-500">Review syllabi, question counts, active slots, and proctoring parameters</p>
          </div>
          <Link
            href="/admin/exams"
            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-bold"
          >
            <span>View all exams</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-12 text-center border border-slate-200 rounded-2xl bg-white text-xs text-slate-400">
            Loading live exams from Supabase PostgreSQL...
          </div>
        ) : exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onTogglePublish={handleTogglePublish}
              />
            ))}
          </div>
        ) : (
          <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
            <p className="text-xs text-slate-500">No exams configured in the database yet.</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleSeed}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Seed demonstration exam & syllabus
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="text-xs text-slate-700 font-bold hover:underline"
              >
                Create new custom examination
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Proctoring Candidate Grid Preview */}
      <div className="space-y-4 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-lg font-bold text-slate-900">Live Proctor Telemetry Grid</h2>
            </div>
            <p className="text-xs text-slate-500">Real-time candidate camera feeds and integrity scores</p>
          </div>
          <Link
            href="/admin/proctor"
            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-bold"
          >
            <span>Full proctoring room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <LiveProctorMonitor
          candidates={candidates}
          onIssueWarning={handleIssueWarning}
          onDisqualify={handleDisqualify}
        />
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
