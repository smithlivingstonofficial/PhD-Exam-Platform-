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
import { ShieldCheck, ArrowLeft, GraduationCap } from "lucide-react";

type Stage = "LOGIN" | "WAITING_ROOM" | "ACTIVE_EXAM" | "COMPLETED";

export default function ExamSandboxPage() {
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
      // Resume active exam immediately
      setStage("ACTIVE_EXAM");
    } else {
      // Waiting room (handles countdown or unlock)
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Sandbox Header Bar */}
      <nav className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Console</span>
          </Link>
          <span className="text-slate-300">|</span>
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            Candidate Portal Sandbox
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Answer-Cloaked Delivery Active
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
            Stage: {stage}
          </span>
        </div>
      </nav>

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

        {stage === "ACTIVE_EXAM" && payload && (
          <div className="-m-4 sm:-m-6 md:-m-8">
            <ExamViewport
              payload={payload}
              onExamSubmitted={handleExamSubmitted}
            />
          </div>
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
    </div>
  );
}
