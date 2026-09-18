"use client";

import { useState, useEffect, useRef } from "react";
import { CandidateSessionPayload, startExamSessionAction } from "./actions";
import {
  GraduationCap,
  Clock,
  Camera,
  Mic,
  Maximize2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LogOut,
  BookOpen,
  Award,
  Sparkles,
  Check,
  RefreshCw,
  Server,
  Lock,
} from "lucide-react";

interface WaitingRoomViewProps {
  payload: CandidateSessionPayload;
  onStartExam: () => void;
  onLogout: () => void;
}

export function WaitingRoomView({
  payload,
  onStartExam,
  onLogout,
}: WaitingRoomViewProps) {
  const [now, setNow] = useState<Date>(() => new Date());
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [undertakingAgreed, setUndertakingAgreed] = useState<boolean>(false);
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forceUnlockForDemo, setForceUnlockForDemo] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 1-second interval clock
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startTime = new Date(payload.startTime);
  const joinClosesAt = new Date(payload.joinWindowClosesAt);

  const isBeforeStart = now < startTime && !forceUnlockForDemo;
  const isWithinJoinWindow =
    (now >= startTime || forceUnlockForDemo) && now <= joinClosesAt;
  const isLateJoinLocked = now > joinClosesAt && !forceUnlockForDemo;

  const getCountdownString = () => {
    const diffMs = startTime.getTime() - now.getTime();
    if (diffMs <= 0) return "00:00:00";
    const totalSecs = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const startCameraCheck = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Camera access denied. Please allow webcam permissions in your browser.");
      setCameraActive(false);
    }
  };

  const handleEnterHall = async () => {
    if (!undertakingAgreed) {
      setErrorMsg("Please accept the academic integrity declaration before entering the examination hall.");
      return;
    }

    setIsStarting(true);
    setErrorMsg(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    const res = await startExamSessionAction(payload.sessionId);
    setIsStarting(false);

    if (res.success) {
      onStartExam();
    } else {
      setErrorMsg(res.error || "Unable to start exam session.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 h-screen w-screen flex flex-col bg-slate-50 text-slate-900 font-sans select-none overflow-hidden">
      {/* 1. TOP HEADER (64px) - HIGH-VISIBILITY SAAS BAR */}
      <header className="h-16 bg-white px-6 shrink-0 flex items-center justify-between border-b border-slate-200 shadow-xs z-10">
        {/* Left: Platform Logo & Subtitle */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900 tracking-tight">
                Ph.D Examination Platform
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">•</span>
              <span className="text-xs font-bold text-indigo-700 hidden sm:inline uppercase tracking-wide">
                Waiting Hall & Readiness Check
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Course Code: <strong className="text-slate-800 font-mono font-bold">{payload.courseCode}</strong>
              <span className="hidden md:inline"> — {payload.examTitle}</span>
            </p>
          </div>
        </div>

        {/* Center: Live Hall Status */}
        <div className="hidden lg:flex items-center gap-2">
          {isWithinJoinWindow ? (
            <div className="px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/90 flex items-center gap-2.5 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Examination Hall is Open (Join Cutoff: {joinClosesAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
            </div>
          ) : isBeforeStart ? (
            <div className="px-4 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/90 flex items-center gap-2.5 shadow-xs">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Question Paper Unlocks In: {getCountdownString()}</span>
            </div>
          ) : (
            <div className="px-4 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-800 border border-rose-200/90 flex items-center gap-2.5 shadow-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Late Join Window Elapsed</span>
            </div>
          )}
        </div>

        {/* Right: Candidate Identity Card & Sign Out */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm font-extrabold text-slate-900">{payload.fullName}</span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200">
                {payload.regNumber}
              </span>
            </div>
            <div className="flex items-center gap-1.5 justify-end text-xs text-slate-500 mt-0.5">
              <span>Department of {payload.departmentCode}</span>
              <span>•</span>
              <span className={`font-bold ${payload.isRetestSlot ? "text-amber-600" : "text-emerald-700"}`}>
                {payload.isRetestSlot ? "Slot 2 (Makeup)" : "Slot 1 (Regular)"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSTATION: REDESIGNED BALANCED 2-COLUMN LAYOUT (ZERO OVERFLOW SCROLL) */}
      <main className="flex-1 flex overflow-hidden p-4 lg:p-6 gap-6 max-w-7xl w-full mx-auto">
        {/* Left Column: Exam Dossier & Live Synchronization (57% width) */}
        <section className="w-full md:w-[57%] flex flex-col justify-between gap-4 overflow-hidden">
          {/* Card 1: Exam Structure & Syllabus Overview */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex-1 flex flex-col justify-between overflow-hidden">
            {/* Header with Badges & Title */}
            <div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  Coursework Qualifying Assessment
                </span>
                <span className="text-xs font-mono px-3 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200">
                  Code: {payload.courseCode}
                </span>
              </div>

              <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight mt-3 leading-snug">
                {payload.examTitle}
              </h1>
              <p className="text-xs lg:text-sm text-slate-500 font-medium mt-1">
                Candidate Specialization: <strong className="text-slate-800">{payload.departmentName}</strong>
              </p>
            </div>

            {/* 4 Large, High-Legibility Stat Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Duration</span>
                </div>
                <span className="text-lg lg:text-xl font-black text-slate-900 block">{payload.durationMinutes} Mins</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-1">
                  <Award className="w-4 h-4 text-slate-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Max Marks</span>
                </div>
                <span className="text-lg lg:text-xl font-black text-slate-900 block">{payload.totalMarks} pts</span>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/90 text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-700 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Pass Cutoff</span>
                </div>
                <span className="text-lg lg:text-xl font-black text-emerald-700 block">{payload.passingMarks} pts</span>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200/90 text-center">
                <div className="flex items-center justify-center gap-1.5 text-indigo-700 mb-1">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Structure</span>
                </div>
                <span className="text-lg lg:text-xl font-black text-indigo-700 block">Part A + B</span>
              </div>
            </div>

            {/* Dual-Tier Paper Architecture Box */}
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100/90 space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-indigo-950 text-sm">
                <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Dual-Tier Paper Architecture</span>
              </div>
              <ul className="text-slate-700 text-xs lg:text-sm leading-relaxed space-y-1.5 pl-5 list-disc">
                <li>
                  <strong className="text-slate-900">Part A (Common Aptitude • 40 Marks):</strong> Research Methodology, Scientific Logic & Publication Ethics (Universal to all disciplines).
                </li>
                <li>
                  <strong className="text-slate-900">Part B (Discipline Specialization • 60 Marks):</strong> Tailored specifically to your field: <strong>{payload.departmentName}</strong>.
                </li>
              </ul>
            </div>
          </div>

          {/* Card 2: Server Synchronization & Live Schedule */}
          <div className="p-5 lg:p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Server Window Synchronization
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                Live Server Time: {now.toLocaleTimeString()}
              </span>
            </div>

            {/* Schedule Row with Prominent Typography */}
            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90">
                <span className="text-xs text-slate-500 uppercase block font-sans font-bold mb-0.5">Login Opens</span>
                <span className="font-extrabold text-slate-900 text-sm md:text-base">
                  {new Date(payload.loginOpensAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                <span className="text-xs text-emerald-800 uppercase block font-sans font-bold mb-0.5">Start Time</span>
                <span className="font-extrabold text-emerald-900 text-sm md:text-base">
                  {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
                <span className="text-xs text-rose-700 uppercase block font-sans font-bold mb-0.5">Join Cutoff</span>
                <span className="font-extrabold text-rose-900 text-sm md:text-base">
                  {joinClosesAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Live Status Banner */}
            {isWithinJoinWindow && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-emerald-900 text-xs lg:text-sm font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  <span>Entry Window Active — Late join cutoff closes at {joinClosesAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <span className="text-xs font-extrabold text-emerald-700 bg-white px-3 py-1 rounded-md border border-emerald-200 shrink-0">
                  Paper Ready
                </span>
              </div>
            )}

            {isBeforeStart && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
                <span className="text-xs lg:text-sm text-amber-900 font-bold">Official paper unlocks in:</span>
                <span className="text-lg font-black font-mono text-emerald-700 animate-pulse">
                  {getCountdownString()}
                </span>
                <button
                  type="button"
                  onClick={() => setForceUnlockForDemo(!forceUnlockForDemo)}
                  className="text-xs px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Force Unlock (Demo)
                </button>
              </div>
            )}

            {isLateJoinLocked && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs lg:text-sm text-rose-800 font-semibold">
                The late-join window has elapsed. You are eligible for <strong>Slot 2 (Makeup Re-Exam)</strong>.
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Hardware & Security Verification Console (43% width) */}
        <section className="w-full md:w-[43%] p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between gap-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                Hardware & Security Verification
              </h2>
            </div>
            {cameraActive ? (
              <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" /> Webcam Verified
              </span>
            ) : (
              <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                Check Required
              </span>
            )}
          </div>

          {/* Webcam Preview Frame (Balanced height ~180px with clean monitor styling) */}
          <div className="relative aspect-video max-h-46 rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner shrink-0 group">
            <video
              ref={videoRef}
              muted
              playsInline
              className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
            />
            {!cameraActive ? (
              <div className="text-center p-4">
                <Camera className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium mb-3">
                  Camera feed required for continuous AI facial invigilation
                </p>
                <button
                  type="button"
                  onClick={startCameraCheck}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-all shadow-md shadow-indigo-600/25 cursor-pointer active:scale-98 flex items-center gap-2 mx-auto"
                >
                  <Camera className="w-4 h-4" />
                  <span>Test Camera Feed</span>
                </button>
              </div>
            ) : (
              <div className="absolute top-2.5 left-2.5 flex items-center justify-between w-[calc(100%-20px)]">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Live Stream Active</span>
                </span>
                <button
                  type="button"
                  onClick={startCameraCheck}
                  title="Refresh Camera"
                  className="p-1 rounded-md bg-slate-900/80 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
          {cameraError && (
            <p className="text-xs text-rose-600 font-semibold leading-tight shrink-0">
              {cameraError}
            </p>
          )}

          {/* Security Checklist Rows (Increased text size & clarity) */}
          <div className="space-y-2.5 text-xs lg:text-sm shrink-0">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/90">
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold text-slate-800">Microphone & Audio Monitoring</span>
              </div>
              <span className="text-xs font-mono text-emerald-700 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                Silero VAD
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/90">
              <div className="flex items-center gap-2.5">
                <Maximize2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-bold text-slate-800">Fullscreen & Lockdown Mode</span>
              </div>
              <span className="text-xs font-mono text-indigo-700 font-extrabold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                Enforced (3 Strikes)
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200/90">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-violet-600 shrink-0" />
                <span className="font-bold text-slate-800">Question Paper Cloaking</span>
              </div>
              <span className="text-xs font-mono text-violet-700 font-extrabold bg-violet-50 px-2.5 py-1 rounded-md border border-violet-200">
                Encrypted & Cloaked
              </span>
            </div>
          </div>

          {/* Academic Integrity Declaration (Comfortable, legible text) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 shrink-0">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={undertakingAgreed}
                onChange={(e) => setUndertakingAgreed(e.target.checked)}
                className="mt-0.5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 cursor-pointer shrink-0"
              />
              <span className="leading-snug text-xs lg:text-sm text-slate-700 font-semibold">
                I solemnly declare that I will take this examination with complete academic integrity under continuous AI invigilation without external aids or unauthorized resources.
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2 animate-in fade-in shrink-0">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Prominent Action Button: Enter Examination Hall */}
          <button
            type="button"
            disabled={isBeforeStart || isLateJoinLocked || !undertakingAgreed || isStarting}
            onClick={handleEnterHall}
            className={`w-full py-4 px-6 rounded-xl font-extrabold text-sm lg:text-base flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer shrink-0 ${
              isBeforeStart || isLateJoinLocked || !undertakingAgreed || isStarting
                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25 active:scale-[0.99]"
            }`}
          >
            {isStarting ? (
              <span>Unlocking Question Paper...</span>
            ) : isLateJoinLocked ? (
              <span>Entry Window Elapsed</span>
            ) : isBeforeStart ? (
              <span>Waiting for Official Start Time</span>
            ) : (
              <>
                <span>Enter Examination Hall</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </section>
      </main>
    </div>
  );
}
