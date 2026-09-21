"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  CandidateSessionPayload,
  CandidateQuestion,
  getCandidateQuestionPaperAction,
  saveCandidateAnswerAction,
  submitCandidateExamAction,
  disqualifyCandidateAction,
} from "./actions";
import { SubmitConfirmationModal } from "./SubmitConfirmationModal";
import { useSecurityLockdown, FullscreenGuardModal, StrikeAlertModal } from "@/features/anti-cheat";
import { useWebcamProctor, ProctorPipFeed, useCandidateWebRTCStreamer } from "@/features/proctor-vision";
import { useAudioMonitor } from "@/features/proctor-audio";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  RotateCcw,
  Send,
  CloudCheck,
  AlertTriangle,
  BookOpen,
  GraduationCap,
} from "lucide-react";

interface ExamViewportProps {
  payload: CandidateSessionPayload;
  onExamSubmitted: (score?: number, isPassed?: boolean) => void;
}

interface AnswerState {
  selectedOptions: string[];
  textResponse: string;
  isMarkedForReview: boolean;
}

interface ActiveStrikeState {
  strikeNumber: number;
  reason: string;
  isDisqualified: boolean;
}

export function ExamViewport({
  payload,
  onExamSubmitted,
}: ExamViewportProps) {
  const [questions, setQuestions] = useState<CandidateQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [activeSectionFilter, setActiveSectionFilter] = useState<"ALL" | "COMMON" | "DEPARTMENT">("ALL");

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Synced");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Time tracking
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const end = new Date(payload.endTime).getTime();
    const now = Date.now();
    const diff = Math.floor((end - now) / 1000);
    const maxDurationSecs = payload.durationMinutes * 60;
    return Math.max(0, Math.min(diff > 0 ? diff : maxDurationSecs, maxDurationSecs));
  });

  // Modal and submission state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [isTimeExpired, setIsTimeExpired] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Strike modal state
  const [activeStrike, setActiveStrike] = useState<ActiveStrikeState | null>(null);
  const [isStrikeModalOpen, setIsStrikeModalOpen] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // 1. HARDENED EDGE-AI PROCTORING: WEBCAM & AUDIO
  // --------------------------------------------------------------------------
  const {
    videoRef,
    stream: webcamStream,
    isActive: isCameraActive,
    error: cameraError,
    isFacePresent,
    captureSnapshot,
  } = useWebcamProctor({
    enabled: true,
  });

  const { audioLevel, isMicActive, stream: micStream } = useAudioMonitor({
    enabled: true,
    threshold: 70,
  });

  // Zero-Egress On-Demand Live WebRTC Streamer (Admin Command Center Connect)
  const { isStreaming: isLiveProctored } = useCandidateWebRTCStreamer({
    sessionId: payload.sessionId,
    stream: webcamStream,
    audioStream: micStream,
    captureSnapshot,
    enabled: isCameraActive && !!webcamStream,
  });

  // --------------------------------------------------------------------------
  // 2. STRIKE & DISQUALIFICATION HANDLER
  // --------------------------------------------------------------------------
  const handleStrike = useCallback(
    async (strikeNumber: number, reason: string, isDisqualified: boolean) => {
      const snapshot = captureSnapshot();

      setActiveStrike({
        strikeNumber,
        reason,
        isDisqualified,
      });
      setIsStrikeModalOpen(true);

      if (isDisqualified) {
        await disqualifyCandidateAction({
          sessionId: payload.sessionId,
          reason: `Exceeded maximum violations limit (${strikeNumber} strikes): ${reason}`,
          evidenceSnapshotUrl: snapshot || undefined,
        });
      }
    },
    [captureSnapshot, payload.sessionId]
  );

  // --------------------------------------------------------------------------
  // 3. SECURITY LOCKDOWN HOOK
  // --------------------------------------------------------------------------
  const maxAllowedStrikes = payload.antiCheatConfig.max_tab_switches || 3;
  const isZeroStrikeTestMode = maxAllowedStrikes >= 900;
  const { isFullscreen, strikeCount, isDisqualified, requestFullscreen } = useSecurityLockdown({
    sessionId: payload.sessionId,
    maxStrikes: maxAllowedStrikes,
    enabled: !isLoading && questions.length > 0 && !isZeroStrikeTestMode,
    onStrike: handleStrike,
  });

  // --------------------------------------------------------------------------
  // 4. LOAD QUESTIONS & PREVIOUSLY SAVED ANSWERS
  // --------------------------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    async function loadPaper() {
      setIsLoading(true);
      setLoadError(null);

      const res = await getCandidateQuestionPaperAction(payload.sessionId);
      if (!isMounted) return;

      if (res.success && res.questions) {
        setQuestions(res.questions);

        const ansMap: Record<string, AnswerState> = {};
        for (const sa of res.savedAnswers) {
          ansMap[sa.questionId] = {
            selectedOptions: sa.selectedOptions,
            textResponse: sa.textResponse || "",
            isMarkedForReview: sa.isMarkedForReview,
          };
        }
        setAnswers(ansMap);
      } else {
        setLoadError(res.error || "Failed to load examination question paper.");
      }
      setIsLoading(false);
    }

    loadPaper();

    return () => {
      isMounted = false;
    };
  }, [payload.sessionId]);

  // --------------------------------------------------------------------------
  // 5. COUNTDOWN TIMER
  // --------------------------------------------------------------------------
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimeExpired(true);
          setIsSubmitModalOpen(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // --------------------------------------------------------------------------
  // 6. AUTOSAVE ANSWER HELPER
  // --------------------------------------------------------------------------
  const persistAnswer = useCallback(
    async (questionId: string, currentAns: AnswerState) => {
      if (isDisqualified) return;

      setIsSyncing(true);
      try {
        await saveCandidateAnswerAction({
          sessionId: payload.sessionId,
          questionId,
          selectedOptions: currentAns.selectedOptions,
          textResponse: currentAns.textResponse,
          isMarkedForReview: currentAns.isMarkedForReview,
        });
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      } catch (err) {
        console.error("Autosave error:", err);
      } finally {
        setIsSyncing(false);
      }
    },
    [isDisqualified, payload.sessionId]
  );

  // --------------------------------------------------------------------------
  // 7. QUESTION FILTERING & SELECTION
  // --------------------------------------------------------------------------
  const filteredQuestions = useMemo(() => {
    if (activeSectionFilter === "COMMON") {
      return questions.filter((q) => q.scope === "COMMON");
    }
    if (activeSectionFilter === "DEPARTMENT") {
      return questions.filter((q) => q.scope === "DEPARTMENT_SPECIFIC");
    }
    return questions;
  }, [questions, activeSectionFilter]);

  const currentQuestion: CandidateQuestion | undefined = questions[currentIndex];

  const currentAnswer: AnswerState = useMemo(() => {
    if (!currentQuestion) return { selectedOptions: [], textResponse: "", isMarkedForReview: false };
    return (
      answers[currentQuestion.id] || {
        selectedOptions: [],
        textResponse: "",
        isMarkedForReview: false,
      }
    );
  }, [answers, currentQuestion]);

  const handleOptionSelect = (optionId: string) => {
    if (!currentQuestion || isDisqualified) return;

    let nextSelected: string[];
    if (currentQuestion.questionType === "MULTI_SELECT") {
      if (currentAnswer.selectedOptions.includes(optionId)) {
        nextSelected = currentAnswer.selectedOptions.filter((id) => id !== optionId);
      } else {
        nextSelected = [...currentAnswer.selectedOptions, optionId];
      }
    } else {
      nextSelected = [optionId];
    }

    const updatedAns: AnswerState = {
      ...currentAnswer,
      selectedOptions: nextSelected,
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: updatedAns,
    }));

    persistAnswer(currentQuestion.id, updatedAns);
  };

  const handleClearResponse = () => {
    if (!currentQuestion || isDisqualified) return;
    const updatedAns: AnswerState = {
      ...currentAnswer,
      selectedOptions: [],
      textResponse: "",
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: updatedAns,
    }));

    persistAnswer(currentQuestion.id, updatedAns);
  };

  const handleToggleReview = () => {
    if (!currentQuestion || isDisqualified) return;
    const updatedAns: AnswerState = {
      ...currentAnswer,
      isMarkedForReview: !currentAnswer.isMarkedForReview,
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: updatedAns,
    }));

    persistAnswer(currentQuestion.id, updatedAns);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // --------------------------------------------------------------------------
  // 8. STATS COMPUTATION
  // --------------------------------------------------------------------------
  const stats = useMemo(() => {
    let answered = 0;
    let review = 0;
    let partATotal = 0;
    let partAAnswered = 0;
    let partBTotal = 0;
    let partBAnswered = 0;

    for (const q of questions) {
      const ans = answers[q.id];
      const isAns = ans && ans.selectedOptions.length > 0;
      if (isAns) answered++;
      if (ans && ans.isMarkedForReview) review++;

      if (q.scope === "COMMON") {
        partATotal++;
        if (isAns) partAAnswered++;
      } else {
        partBTotal++;
        if (isAns) partBAnswered++;
      }
    }

    return {
      total: questions.length,
      answered,
      review,
      unanswered: Math.max(0, questions.length - answered),
      partA: { total: partATotal, answered: partAAnswered },
      partB: { total: partBTotal, answered: partBAnswered },
    };
  }, [questions, answers]);

  const completionPercentage = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round((stats.answered / stats.total) * 100);
  }, [stats]);

  // --------------------------------------------------------------------------
  // 9. FINAL SUBMISSION
  // --------------------------------------------------------------------------
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const res = await submitCandidateExamAction(payload.sessionId);
    setIsSubmitting(false);
    setIsSubmitModalOpen(false);

    if (res.success) {
      onExamSubmitted(res.score, res.isPassed);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 text-slate-900 space-y-4 select-none">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-600">
          Decrypting cloaked question paper...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-100 p-4 select-none">
        <div className="p-6 max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-lg text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Paper Access Error</h2>
          <p className="text-xs text-rose-700">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 h-screen w-screen flex flex-col bg-slate-100/60 font-sans select-none overflow-hidden"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      {/* 1. COMPACT UNIFIED TOP APP BAR (60px) - PURE SAAS LIGHT */}
      <header className="h-15 bg-white text-slate-900 px-5 shrink-0 flex items-center justify-between gap-3 border-b border-slate-200/90 shadow-xs">
        {/* Left: Institution Crest, Exam Title & Scholar Profile */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold text-slate-900 tracking-tight truncate max-w-xs md:max-w-md">
                {payload.examTitle}
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                {payload.departmentCode}
              </span>
              {isZeroStrikeTestMode && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Zero-Strike Test Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
              {payload.fullName} • <span className="font-mono font-bold text-slate-700">{payload.regNumber}</span>
            </p>
          </div>
        </div>

        {/* Center: Authoritative Countdown Timer & Autosave Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-black text-sm border shadow-xs transition-colors ${
              remainingSeconds < 300
                ? "bg-rose-50 border-rose-300 text-rose-700 animate-pulse"
                : remainingSeconds < 900
                ? "bg-amber-50 border-amber-300 text-amber-800"
                : "bg-slate-100/90 border-slate-200 text-slate-900"
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <CloudCheck className={`w-4 h-4 ${isSyncing ? "text-amber-500 animate-spin" : "text-emerald-500"}`} />
            <span>{isSyncing ? "Syncing..." : lastSyncTime}</span>
          </div>
        </div>

        {/* Right: Security Fullscreen & Submit Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={requestFullscreen}
            title={isFullscreen ? "Fullscreen Enforced" : "Enter Fullscreen"}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-600" /> : <Maximize2 className="w-4 h-4 text-rose-600" />}
          </button>

          <button
            type="button"
            disabled={isDisqualified}
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-xs active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* 2. COMPACT DUAL-TIER SECTION SUB-BAR (44px) */}
      <div className="h-11 bg-white border-b border-slate-200/90 px-5 shrink-0 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <button
            type="button"
            onClick={() => setActiveSectionFilter("ALL")}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSectionFilter === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Questions ({questions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionFilter("COMMON")}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSectionFilter === "COMMON"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50/80 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Part A: Common Research ({stats.partA.answered}/{stats.partA.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionFilter("DEPARTMENT")}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSectionFilter === "DEPARTMENT"
                ? "bg-violet-600 text-white shadow-xs"
                : "bg-violet-50/80 text-violet-700 hover:bg-violet-100 border border-violet-200/80"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Part B: {payload.departmentName} ({stats.partB.answered}/{stats.partB.total})</span>
          </button>
        </div>

        {/* Progress Tracker Bar */}
        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-600">
          <span>{completionPercentage}% Answered</span>
          <div className="w-28 h-2.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSTATION: SPLIT 2-COLUMN VIEWPORT (Takes remaining 100vh) */}
      <div className={`flex-1 flex overflow-hidden select-none transition-all duration-300 ${!isFullscreen && !isLoading ? "blur-lg pointer-events-none filter" : ""}`}>
        {/* Left Column: Focused Question Canvas (72% width) */}
        <main className="flex-1 flex flex-col justify-between p-5 md:p-6 bg-white overflow-y-auto border-r border-slate-200/80">
          {currentQuestion ? (
            <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-between space-y-5">
              {/* Question Header */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3 py-1 rounded-lg text-xs font-mono font-black bg-slate-900 text-white">
                      Question {currentIndex + 1}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                        currentQuestion.scope === "COMMON"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-violet-50 text-violet-700 border border-violet-200"
                      }`}
                    >
                      {currentQuestion.sectionName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono font-bold">
                    <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                      +{currentQuestion.marks} Mark{currentQuestion.marks > 1 ? "s" : ""}
                    </span>
                    {currentQuestion.negativeMarks > 0 && (
                      <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                        -{currentQuestion.negativeMarks} Neg
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Statement (Larger, more comfortable font) */}
                <div className="text-base lg:text-lg font-semibold text-slate-900 leading-relaxed pt-1">
                  {currentQuestion.questionText}
                </div>
              </div>

              {/* Options List (Larger typography & clear touch targets) */}
              <div className="space-y-3 py-2">
                {currentQuestion.options.map((opt, optIdx) => {
                  const isSelected = currentAnswer.selectedOptions.includes(opt.id);
                  const letter = String.fromCharCode(65 + optIdx);

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isDisqualified}
                      onClick={() => handleOptionSelect(opt.id)}
                      className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3.5 transition-all text-sm lg:text-base cursor-pointer ${
                        isSelected
                          ? "bg-indigo-50/90 border-indigo-600 ring-1 ring-indigo-600/30 text-indigo-950 font-bold shadow-xs"
                          : "bg-slate-50/70 border-slate-200/90 hover:border-slate-300 hover:bg-white text-slate-800 font-medium"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-white text-slate-600 border border-slate-300"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="pt-0.5 leading-snug">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Fixed Bottom Action Toolbar */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={isDisqualified}
                    onClick={handleToggleReview}
                    className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition-colors border cursor-pointer ${
                      currentAnswer.isMarkedForReview
                        ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                        : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    <span>{currentAnswer.isMarkedForReview ? "Marked for Review" : "Mark for Review"}</span>
                  </button>

                  {currentAnswer.selectedOptions.length > 0 && (
                    <button
                      type="button"
                      disabled={isDisqualified}
                      onClick={handleClearResponse}
                      className="px-3 py-2 rounded-xl text-xs md:text-sm font-bold text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Response</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    disabled={currentIndex === 0 || isDisqualified}
                    onClick={handlePrev}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs md:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex === questions.length - 1 || isDisqualified}
                    onClick={handleNext}
                    className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold text-xs md:text-sm flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <span>Save & Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-sm font-medium">
              No questions found for the active section filter.
            </div>
          )}
        </main>

        {/* Right Column: Compact AI Proctor & Question Palette (28% width) */}
        <aside className="w-72 lg:w-80 bg-slate-50 flex flex-col justify-between p-4 overflow-y-auto space-y-4 border-l border-slate-200/90 shrink-0">
          {/* Live AI Proctor PIP Card */}
          <ProctorPipFeed
            videoRef={videoRef}
            isCameraActive={isCameraActive}
            cameraError={cameraError}
            isFacePresent={isFacePresent}
            audioLevel={audioLevel}
            isMicActive={isMicActive}
            strikeCount={strikeCount}
            maxStrikes={maxAllowedStrikes}
            isLiveProctored={isLiveProctored}
          />

          {/* Question Palette Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 space-y-3 shadow-xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Question Palette
                </h3>
                <span className="text-xs font-mono font-bold text-indigo-600">
                  {stats.answered} / {stats.total} Answered
                </span>
              </div>

              {/* Status Legend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pt-2 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-600 text-white flex items-center justify-center text-[8px] font-bold">✓</span>
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500 text-white flex items-center justify-center text-[8px] font-bold">⚑</span>
                  <span>Review</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-purple-600 text-white flex items-center justify-center text-[8px] font-bold">★</span>
                  <span>Answered & Review</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 text-slate-500 flex items-center justify-center text-[8px] font-bold">•</span>
                  <span>Unattempted</span>
                </div>
              </div>

              {/* Number Grid */}
              <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-1 mt-2.5">
                {filteredQuestions.map((q) => {
                  const globalIdx = questions.findIndex((x) => x.id === q.id);
                  const isCurrent = globalIdx === currentIndex;
                  const ans = answers[q.id];
                  const isAns = ans && ans.selectedOptions.length > 0;
                  const isRev = ans && ans.isMarkedForReview;

                  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
                  if (isAns && isRev) {
                    colorClasses = "bg-purple-600 text-white border-purple-700 shadow-xs";
                  } else if (isAns) {
                    colorClasses = "bg-emerald-600 text-white border-emerald-700 shadow-xs";
                  } else if (isRev) {
                    colorClasses = "bg-amber-500 text-white border-amber-600 shadow-xs";
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      disabled={isDisqualified}
                      onClick={() => setCurrentIndex(globalIdx)}
                      className={`h-8.5 rounded-lg border text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${colorClasses} ${
                        isCurrent ? "ring-2 ring-indigo-500 ring-offset-1 scale-105" : ""
                      }`}
                    >
                      {globalIdx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Summary Footnote */}
            <div className="pt-2.5 border-t border-slate-100 text-[11px] font-semibold text-slate-500 flex justify-between">
              <span>Part A: <strong className="text-slate-800">{stats.partA.answered}/{stats.partA.total}</strong></span>
              <span>Part B: <strong className="text-slate-800">{stats.partB.answered}/{stats.partB.total}</strong></span>
            </div>
          </div>
        </aside>
      </div>

      {/* 4. MANDATORY FULLSCREEN GUARD OVERLAY */}
      <FullscreenGuardModal
        isOpen={!isFullscreen && !isDisqualified && !isLoading && !isZeroStrikeTestMode}
        onEnterFullscreen={requestFullscreen}
      />

      {/* 5. STRIKE ALERT & DISQUALIFICATION MODAL */}
      <StrikeAlertModal
        isOpen={isStrikeModalOpen}
        strikeNumber={activeStrike?.strikeNumber || strikeCount}
        maxStrikes={maxAllowedStrikes}
        reason={activeStrike?.reason || "Academic integrity infraction detected"}
        isDisqualified={Boolean(activeStrike?.isDisqualified || isDisqualified)}
        onAcknowledge={() => setIsStrikeModalOpen(false)}
        onExit={() => onExamSubmitted(0, false)}
      />

      {/* 6. SUBMIT CONFIRMATION MODAL */}
      <SubmitConfirmationModal
        isOpen={isSubmitModalOpen}
        totalQuestions={stats.total}
        answeredCount={stats.answered}
        markedForReviewCount={stats.review}
        unansweredCount={stats.unanswered}
        partAStats={stats.partA}
        partBStats={stats.partB}
        isTimeExpired={isTimeExpired}
        isSubmitting={isSubmitting}
        onConfirmSubmit={handleFinalSubmit}
        onCancel={() => setIsSubmitModalOpen(false)}
      />
    </div>
  );
}
