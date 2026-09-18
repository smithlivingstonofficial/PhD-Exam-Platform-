"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CandidateLoginForm,
  WaitingRoomView,
  ExamViewport,
  ExamCompletedView,
  CandidateSessionPayload,
} from "@/features/exam-session";
import { ShieldCheck, GraduationCap, LayoutDashboard, Sparkles } from "lucide-react";

type Stage = "LOGIN" | "WAITING_ROOM" | "ACTIVE_EXAM" | "COMPLETED";

export default function Home() {
  const [stage, setStage] = useState<Stage>("LOGIN");
  const [payload, setPayload] = useState<CandidateSessionPayload | null>(null);
  const [submissionResult, setSubmissionResult] = useState<{
    score?: number;
    isPassed?: boolean;
  } | null>(null);

  const handleLoginSuccess = (data: CandidateSessionPayload) => {
    setPayload(data);
    if (data.stage === "ALREADY_SUBMITTED") {
      setStage("COMPLETED");
    } else if (data.stage === "ACTIVE_EXAM" && data.startedAt) {
      setStage("ACTIVE_EXAM");
    } else {
      setStage("WAITING_ROOM");
    }
  };

  const handleStartExam = () => {
    setStage("ACTIVE_EXAM");
  };

  const handleExamSubmitted = (score?: number, isPassed?: boolean) => {
    setSubmissionResult({ score, isPassed });
    setStage("COMPLETED");
  };

  const handleLogout = () => {
    setPayload(null);
    setSubmissionResult(null);
    setStage("LOGIN");
  };

  // When in Waiting Room or Active Exam, deliver dedicated 100vh workstation (no outer website header)
  if (stage === "WAITING_ROOM" && payload) {
    return (
      <WaitingRoomView
        payload={payload}
        onStartExam={handleStartExam}
        onLogout={handleLogout}
      />
    );
  }

  if (stage === "ACTIVE_EXAM" && payload) {
    return (
      <ExamViewport
        payload={payload}
        onExamSubmitted={handleExamSubmitted}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top University Portal Bar */}
      <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="font-black text-sm text-slate-900 tracking-tight block">
              Ph.D Examination Platform
            </span>
            <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
              Doctoral Entrance & Coursework Qualifying Assessment
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            AI Proctoring & Cloaked Paper Active
          </span>

          <Link
            href="/admin"
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Examiner Admin</span>
          </Link>
        </div>
      </header>

      {/* Main Candidate Stage Renderer */}
      <main className="flex-1 flex flex-col justify-center p-4 sm:p-6 md:p-8">
        {stage === "LOGIN" && (
          <div className="my-auto py-8">
            <CandidateLoginForm onLoginSuccess={handleLoginSuccess} />
          </div>
        )}

        {stage === "WAITING_ROOM" && payload && (
          <WaitingRoomView
            payload={payload}
            onStartExam={handleStartExam}
            onLogout={handleLogout}
          />
        )}

        {stage === "COMPLETED" && payload && (
          <ExamCompletedView
            payload={payload}
            score={submissionResult?.score}
            isPassed={submissionResult?.isPassed}
            onExit={handleLogout}
          />
        )}
      </main>

      {/* Footer */}
      {stage === "LOGIN" && (
        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200 bg-white">
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Secure Two-Part Examination Delivery • Automated AI Audio & Visual Proctoring • University Assessment Network</span>
          </div>
        </footer>
      )}
    </div>
  );
}
