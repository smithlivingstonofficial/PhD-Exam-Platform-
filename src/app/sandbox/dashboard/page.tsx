"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAdminOverviewData, issueWarningAction, terminateSessionAction, SerializedCandidate, SerializedExam } from "@/app/admin/actions";
import { LiveProctorMonitor, ExamCard } from "@/features/examiner-dashboard";
import { ArrowLeft, ExternalLink, ShieldAlert, BookOpenCheck, RefreshCw } from "lucide-react";

export default function DashboardSandboxPage() {
  const [candidates, setCandidates] = useState<SerializedCandidate[]>([]);
  const [exams, setExams] = useState<SerializedExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    async function init() {
      const data = await getAdminOverviewData();
      if (!ignore) {
        setCandidates(data.candidates);
        setExams(data.exams);
        setIsLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    const data = await getAdminOverviewData();
    setCandidates(data.candidates);
    setExams(data.exams);
    setIsLoading(false);
  };

  const handleIssueWarning = async (id: string) => {
    await issueWarningAction(id);
    await handleRefresh();
  };

  const handleDisqualify = async (id: string) => {
    await terminateSessionAction(id);
    await handleRefresh();
  };

  const exam = exams[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8 antialiased">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/sandbox"
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Sandboxes</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold">
              Developer 5 Sandbox
            </span>
            <Link
              href="/admin"
              className="flex items-center gap-1 text-xs px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs"
            >
              <span>Open Full Admin Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Sandbox Header */}
        <div className="p-7 rounded-2xl border border-slate-200/90 bg-white space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Examiner & Proctor Dashboard Playground</h1>
            <button
              onClick={handleRefresh}
              className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              title="Refresh live data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>
          <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
            This is the isolated testing sandbox for <strong>Developer 5</strong>, now fully connected to <strong>Supabase PostgreSQL via Prisma</strong>. Test candidate warning triggers, disqualification actions, and exam configuration cards with live data.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono font-bold text-indigo-700">
            <span className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200">
              Module: src/features/examiner-dashboard/
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
              Database: Prisma & Supabase Live
            </span>
          </div>
        </div>

        {/* Live Proctoring Monitor Component */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">Live Candidate Integrity Monitor</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">Interactive live controls</span>
          </div>
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              Loading live candidate data from Supabase...
            </div>
          ) : (
            <LiveProctorMonitor
              candidates={candidates}
              onIssueWarning={handleIssueWarning}
              onDisqualify={handleDisqualify}
            />
          )}
        </div>

        {/* Sample Exam Card Component */}
        {exam && (
          <div className="space-y-3 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <BookOpenCheck className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Live Exam Card Component</h2>
            </div>
            <div className="max-w-md">
              <ExamCard exam={exam} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
