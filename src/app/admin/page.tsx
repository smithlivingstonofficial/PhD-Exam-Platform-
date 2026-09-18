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
  Sparkles
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
      alert("Sample Ph.D System loaded: Academic Departments, Registered Scholars, Examination Slots & Questions populated successfully!");
      await loadData();
    } else {
      alert("Unable to load sample data: " + res.message);
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
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Sleek Compact Header Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
            K
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">University Examination Management</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                Office of the COE
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supervise academic departments, examination slots, live attendance, and candidate conduct in real time
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-700 font-bold text-xs transition-colors shadow-2xs disabled:opacity-50"
            title="Populate test departments, scholars, and question bank"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
            <span>{isSeeding ? "Loading..." : "Load Sample Data"}</span>
          </button>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
            title="Refresh examination records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Exam</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid - Compact High Density */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Configured Exams</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpenCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalExams}</span>
            <span className="text-[11px] font-semibold text-emerald-600">({publishedExams} Published)</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Enrolled Scholars</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalCandidates}</span>
            <span className="text-[11px] font-medium text-slate-500">Active enrollments</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Integrity Alerts</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{flaggedCandidates}</span>
            <span className="text-[11px] font-semibold text-amber-600">Candidates flagged</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/90 bg-white shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">System Status</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">Active</span>
            <span className="text-[11px] font-medium text-slate-500">All services ready</span>
          </div>
        </div>
      </div>

      {/* Active Exams Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Active Examination Catalog</h2>
            <p className="text-[11px] text-slate-500">Review syllabus, question counts, scheduled slots, and proctoring guidelines</p>
          </div>
          <Link
            href="/admin/exams"
            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-bold"
          >
            <span>View all exams ({totalExams})</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center border border-slate-200 rounded-xl bg-white text-xs text-slate-400">
            Loading examinations...
          </div>
        ) : exams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onTogglePublish={handleTogglePublish}
              />
            ))}
          </div>
        ) : (
          <div className="py-6 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-white space-y-2">
            <p className="text-xs text-slate-500">No exams scheduled yet.</p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleSeed}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                Load demonstration exams & syllabus
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
      <div className="space-y-3 pt-3 border-t border-slate-200/80">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-sm font-bold text-slate-900">Live Exam Room Monitoring</h2>
            </div>
            <p className="text-[11px] text-slate-500">Real-time candidate camera check and exam integrity status</p>
          </div>
          <Link
            href="/admin/proctor"
            className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-bold"
          >
            <span>Open Full Monitoring Screen</span>
            <ArrowRight className="w-3 h-3" />
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
