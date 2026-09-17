"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  CandidateSessionPayload,
  CandidateQuestion,
  getCandidateQuestionPaperAction,
  saveCandidateAnswerAction,
  recordCandidateViolationAction,
  submitCandidateExamAction,
} from "./actions";
import { SubmitConfirmationModal } from "./SubmitConfirmationModal";
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Shield,
  ShieldAlert,
  Camera,
  Mic,
  RotateCcw,
  Send,
  CloudCheck,
  AlertTriangle,
  BookOpen,
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

  // Anti-cheat state
  const [violationsCount, setViolationsCount] = useState<number>(0);
  const [warningBanner, setWarningBanner] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Video feed for PIP proctoring
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --------------------------------------------------------------------------
  // 1. LOAD QUESTIONS & PREVIOUSLY SAVED ANSWERS
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

        // Populate existing saved answers
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
  // 2. SETUP WEBCAM PREVIEW FOR FLOATING PROCTOR PIP
  // --------------------------------------------------------------------------
  useEffect(() => {
    let active = true;

    async function initWebcam() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 320 }, height: { ideal: 240 } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.warn("Proctor PIP webcam access error:", err);
      }
    }

    initWebcam();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // --------------------------------------------------------------------------
  // 3. SERVER-SYNCHRONIZED COUNTDOWN TIMER
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
  // 4. ANTI-CHEAT LISTENERS (TAB SWITCH & FULLSCREEN LOCKDOWN)
  // --------------------------------------------------------------------------
  const logIncident = useCallback(
    async (eventType: string, details: Record<string, unknown>) => {
      setViolationsCount((c) => c + 1);
      await recordCandidateViolationAction({
        sessionId: payload.sessionId,
        eventType,
        severity: "HIGH",
        details,
      });
    },
    [payload.sessionId]
  );

  useEffect(() => {
    // Visibility / Tab-switch change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logIncident("TAB_SWITCH_DETECTED", { timestamp: new Date().toISOString() });
        setWarningBanner(
          "WARNING: Tab switch or backgrounding detected! Academic integrity infraction logged."
        );
      }
    };

    // Fullscreen change
    const handleFullscreenChange = () => {
      const inFull = Boolean(document.fullscreenElement);
      setIsFullscreen(inFull);
      if (!inFull) {
        logIncident("FULLSCREEN_EXIT_DETECTED", { timestamp: new Date().toISOString() });
        setWarningBanner(
          "WARNING: Fullscreen mode exited! Return to fullscreen immediately to avoid test invalidation."
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [logIncident]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        setWarningBanner(null);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn("Fullscreen toggle error:", err);
    }
  };

  // --------------------------------------------------------------------------
  // 5. AUTOSAVE ANSWER HELPER
  // --------------------------------------------------------------------------
  const persistAnswer = useCallback(
    async (questionId: string, currentAns: AnswerState) => {
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
    [payload.sessionId]
  );

  // --------------------------------------------------------------------------
  // 6. QUESTION FILTERING & SELECTION
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

  // Handle Option Click (MCQ or Multiple Selection)
  const handleOptionSelect = (optionId: string) => {
    if (!currentQuestion) return;

    let nextSelected: string[];
    if (currentQuestion.questionType === "MULTI_SELECT") {
      // Toggle in array
      if (currentAnswer.selectedOptions.includes(optionId)) {
        nextSelected = currentAnswer.selectedOptions.filter((id) => id !== optionId);
      } else {
        nextSelected = [...currentAnswer.selectedOptions, optionId];
      }
    } else {
      // Single Choice
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

  // Clear Response
  const handleClearResponse = () => {
    if (!currentQuestion) return;
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

  // Toggle Mark for Review
  const handleToggleReview = () => {
    if (!currentQuestion) return;
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

  // Navigation handlers
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
  // 7. STATS COMPUTATION FOR PALETTE & SUBMIT MODAL
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

  // --------------------------------------------------------------------------
  // 8. FINAL SUBMISSION
  // --------------------------------------------------------------------------
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const res = await submitCandidateExamAction(payload.sessionId);
    setIsSubmitting(false);
    setIsSubmitModalOpen(false);

    if (res.success) {
      onExamSubmitted(res.score, res.isPassed);
    } else {
      setWarningBanner(res.error || "Failed to submit examination. Retrying...");
    }
  };

  // Format countdown string
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-500">
          Decrypting and assembling question paper...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-8 max-w-lg mx-auto bg-white rounded-3xl border border-rose-200 shadow-xl text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Paper Access Error</h2>
        <p className="text-xs text-rose-700">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col min-h-screen bg-slate-100 text-slate-900 select-none">
      {/* 1. TOP SECURE NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm px-4 py-2.5 flex items-center justify-between gap-4 flex-wrap">
        {/* Left: Exam & Scholar Credentials */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm">
            PhD
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold text-slate-900 line-clamp-1">
                {payload.examTitle}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {payload.departmentCode}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Candidate: <strong className="text-slate-800">{payload.fullName}</strong> ({payload.regNumber})
            </p>
          </div>
        </div>

        {/* Center: Live Countdown Clock */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-bold text-sm shadow-inner transition-colors ${
              remainingSeconds < 300
                ? "bg-rose-50 border border-rose-200 text-rose-700 animate-pulse"
                : remainingSeconds < 900
                ? "bg-amber-50 border border-amber-200 text-amber-800"
                : "bg-slate-900 text-white"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
            <CloudCheck className={`w-4 h-4 ${isSyncing ? "text-amber-500 animate-spin" : "text-emerald-500"}`} />
            <span>{isSyncing ? "Saving..." : `Saved (${lastSyncTime})`}</span>
          </div>
        </div>

        {/* Right: Lockdown Controls & Submit Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-indigo-600" />}
          </button>

          <button
            type="button"
            onClick={() => setIsSubmitModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* 2. WARNING BANNER IF TAB SWITCHED OR FULLSCREEN EXITED */}
      {warningBanner && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs flex items-center justify-between font-semibold animate-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-200 shrink-0" />
            <span>{warningBanner}</span>
          </div>
          <button
            onClick={() => setWarningBanner(null)}
            className="text-[11px] underline text-rose-100 hover:text-white ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 3. DUAL-TIER SECTION TABS */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSectionFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeSectionFilter === "ALL"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Questions ({questions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionFilter("COMMON")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeSectionFilter === "COMMON"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Part A: Common Research Aptitude ({stats.partA.answered}/{stats.partA.total})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSectionFilter("DEPARTMENT")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeSectionFilter === "DEPARTMENT"
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Part B: {payload.departmentName} ({stats.partB.answered}/{stats.partB.total})</span>
          </button>
        </div>

        {/* Violations Counter */}
        {violationsCount > 0 && (
          <span className="text-[11px] font-mono font-bold px-2 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            {violationsCount} Incident{violationsCount > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* 4. MAIN VIEWPORT: QUESTION CANVAS (LEFT) & PALETTE + PIP (RIGHT) */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Columns: Active Question Canvas */}
        <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
          {currentQuestion ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6">
              {/* Question Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl text-xs font-black font-mono bg-slate-900 text-white">
                      Question {currentIndex + 1}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        currentQuestion.scope === "COMMON"
                          ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                          : "bg-violet-50 text-violet-700 border border-violet-200"
                      }`}
                    >
                      {currentQuestion.sectionName}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono font-bold">
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      +{currentQuestion.marks} Mark{currentQuestion.marks > 1 ? "s" : ""}
                    </span>
                    {currentQuestion.negativeMarks > 0 && (
                      <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        -{currentQuestion.negativeMarks} Neg
                      </span>
                    )}
                  </div>
                </div>

                {/* Question Statement */}
                <div className="text-sm md:text-base font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.questionText}
                </div>
              </div>

              {/* Options List */}
              <div className="space-y-3 pt-2">
                {currentQuestion.options.map((opt, optIdx) => {
                  const isSelected = currentAnswer.selectedOptions.includes(opt.id);
                  const letter = String.fromCharCode(65 + optIdx); // A, B, C, D

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleOptionSelect(opt.id)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all text-xs md:text-sm ${
                        isSelected
                          ? "bg-indigo-50/80 border-indigo-500 shadow-sm text-indigo-950 font-medium ring-1 ring-indigo-500/30"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800"
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="pt-0.5 leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Action Toolbar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleReview}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border ${
                      currentAnswer.isMarkedForReview
                        ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>{currentAnswer.isMarkedForReview ? "Marked for Review" : "Mark for Review"}</span>
                  </button>

                  {currentAnswer.selectedOptions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearResponse}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Choice</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentIndex === 0}
                    onClick={handlePrev}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold text-xs flex items-center gap-1 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <button
                    type="button"
                    disabled={currentIndex === questions.length - 1}
                    onClick={handleNext}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <span>Save & Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-slate-500 text-xs">
              No questions found for the selected section.
            </div>
          )}
        </div>

        {/* Right 1 Column: Floating Proctor PIP & Question Palette */}
        <div className="space-y-6">
          {/* Proctoring Picture-In-Picture Feed */}
          <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  AI Proctor Invigilation
                </span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            {/* Live Video Window */}
            <div className="relative aspect-video rounded-2xl bg-black overflow-hidden border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Camera className="w-2.5 h-2.5" /> MediaPipe Vision
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/70 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Mic className="w-2.5 h-2.5" /> Silero VAD
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-tight text-center">
              Edge-AI telemetry actively validates head pose, gaze vector, and audio levels client-side.
            </p>
          </div>

          {/* Question Palette Card */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Question Palette
              </h3>
              <span className="text-xs font-mono font-bold text-indigo-600">
                {stats.answered} / {stats.total} Answered
              </span>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-amber-500 text-white flex items-center justify-center text-[9px] font-bold">⚑</span>
                <span>Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-purple-600 text-white flex items-center justify-center text-[9px] font-bold">★</span>
                <span>Answered & Review</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-100 border border-slate-300 text-slate-500 flex items-center justify-center text-[9px] font-bold">•</span>
                <span>Unattempted</span>
              </div>
            </div>

            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto p-1">
              {filteredQuestions.map((q) => {
                const globalIdx = questions.findIndex((x) => x.id === q.id);
                const isCurrent = globalIdx === currentIndex;
                const ans = answers[q.id];
                const isAns = ans && ans.selectedOptions.length > 0;
                const isRev = ans && ans.isMarkedForReview;

                let colorClasses = "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200";
                if (isAns && isRev) {
                  colorClasses = "bg-purple-600 text-white border-purple-700 shadow-sm";
                } else if (isAns) {
                  colorClasses = "bg-emerald-600 text-white border-emerald-700 shadow-sm";
                } else if (isRev) {
                  colorClasses = "bg-amber-500 text-white border-amber-600 shadow-sm";
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(globalIdx)}
                    className={`h-9 rounded-xl border text-xs font-mono font-bold flex items-center justify-center transition-all ${colorClasses} ${
                      isCurrent ? "ring-2 ring-indigo-500 ring-offset-2 scale-105" : ""
                    }`}
                  >
                    {globalIdx + 1}
                  </button>
                );
              })}
            </div>

            {/* Quick Section Breakdown */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex justify-between">
                <span>Part A (Common):</span>
                <span className="font-mono font-bold text-slate-800">{stats.partA.answered} / {stats.partA.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Part B (Department):</span>
                <span className="font-mono font-bold text-slate-800">{stats.partB.answered} / {stats.partB.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SUBMIT CONFIRMATION MODAL */}
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
