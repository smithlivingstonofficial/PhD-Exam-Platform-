"use client";

import { useState } from "react";
import Link from "next/link";
import { INITIAL_MOCK_CANDIDATES, INITIAL_MOCK_EXAMS } from "@/lib/mock-data";
import { LiveProctorMonitor, ExamCard } from "@/features/examiner-dashboard";
import { ArrowLeft, ExternalLink, ShieldAlert, BookOpenCheck } from "lucide-react";

export default function DashboardSandboxPage() {
  const [candidates, setCandidates] = useState(INITIAL_MOCK_CANDIDATES);
  const exam = INITIAL_MOCK_EXAMS[0];

  const handleIssueWarning = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, violation_count: c.violation_count + 1, integrity_score: Math.max(0, c.integrity_score - 10) }
          : c
      )
    );
  };

  const handleDisqualify = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "DISQUALIFIED", integrity_score: 0 } : c))
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/sandbox"
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to All Sandboxes</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
              Developer 5 Sandbox
            </span>
            <Link
              href="/admin"
              className="flex items-center gap-1 text-xs px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
            >
              <span>Open Full Admin Portal</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Sandbox Header */}
        <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900/50 space-y-2">
          <h1 className="text-2xl font-bold text-white">Examiner & Proctor Dashboard Playground</h1>
          <p className="text-xs text-neutral-400 max-w-2xl">
            This is the isolated testing sandbox for <strong>Developer 5</strong>. Here you can test the live proctoring telemetry grid, warning triggers, disqualification actions, and exam configuration cards.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 text-[11px] font-mono text-indigo-300">
            <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
              Module: src/features/examiner-dashboard/
            </span>
            <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800">
              Database: Supabase Schema Ready
            </span>
          </div>
        </div>

        {/* Live Proctoring Monitor Component */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white">Live Candidate Integrity Monitor</h2>
            </div>
            <span className="text-xs text-neutral-400">Interactive live controls</span>
          </div>
          <LiveProctorMonitor
            candidates={candidates}
            onIssueWarning={handleIssueWarning}
            onDisqualify={handleDisqualify}
          />
        </div>

        {/* Sample Exam Card Component */}
        <div className="space-y-3 pt-6 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white">Sample Exam Card Component</h2>
          </div>
          <div className="max-w-md">
            <ExamCard exam={exam} />
          </div>
        </div>
      </div>
    </div>
  );
}
