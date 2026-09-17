"use client";

import { useState, useEffect, useRef } from "react";
import {
  CandidateSessionPayload,
  startExamSessionAction,
} from "./actions";
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
  Sparkles,
  BookOpen,
  Calendar,
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

  // Keep a local 1-second clock
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

  // Format remaining countdown
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
      setCameraError(
        "Camera access denied or unavailable. Please grant webcam permissions in your browser."
      );
      setCameraActive(false);
    }
  };

  const handleEnterHall = async () => {
    if (!undertakingAgreed) {
      setErrorMsg("Please accept the academic integrity honor code declaration before entering.");
      return;
    }

    setIsStarting(true);
    setErrorMsg(null);

    // Stop waiting room preview before entering exam
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    // Call start session action
    const res = await startExamSessionAction(payload.sessionId);
    setIsStarting(false);

    if (res.success) {
      onStartExam();
    } else {
      setErrorMsg(res.error || "Unable to start exam session. Please check with the invigilator.");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 p-4 md:p-6 animate-in fade-in duration-300">
      {/* Top Banner with Scholar & University info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-800 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {payload.fullName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {payload.regNumber}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {payload.departmentCode}
              </span>
              {payload.isRetestSlot ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Slot 2 (Makeup / Retest)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Slot 1 (Regular)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Department of {payload.departmentName} • {payload.email}
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="self-start md:self-center px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>

      {/* Main Grid: Exam Overview & Countdown vs Hardware Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Exam Details & Timing Window */}
        <div className="lg:col-span-2 space-y-6">
          {/* Exam Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Coursework / Entrance Paper
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
                {payload.examTitle}
              </h2>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Course Code: {payload.courseCode}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Duration</span>
                <span className="text-sm font-bold text-slate-900">{payload.durationMinutes} Minutes</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Maximum Marks</span>
                <span className="text-sm font-bold text-slate-900">{payload.totalMarks} pts</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Passing Cutoff</span>
                <span className="text-sm font-bold text-slate-900">{payload.passingMarks} pts</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Question Structure</span>
                <span className="text-sm font-bold text-indigo-700">Part A + Part B</span>
              </div>
            </div>

            {/* Dual Section Explanation */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Dual-Tier Paper Architecture</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 text-[11px]">
                <li>
                  <strong className="text-slate-800">Part A (Common):</strong> Research Methodology, Ethics, Quantitative Reasoning (Universal to all departments).
                </li>
                <li>
                  <strong className="text-slate-800">Part B (Specialization):</strong> Tailored specifically to your field ({payload.departmentName}).
                </li>
              </ul>
            </div>
          </div>

          {/* Countdown & Timing Status Card */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-lg space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Server Window & Timing Synchronization
                </span>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                Live: {now.toLocaleTimeString()}
              </span>
            </div>

            {isBeforeStart && (
              <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-slate-400">Questions Unlock In</span>
                  <span className="text-2xl font-black font-mono tracking-widest text-emerald-400 animate-pulse">
                    {getCountdownString()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  The official examination slot opens at{" "}
                  <strong className="text-slate-200">{startTime.toLocaleTimeString()}</strong>. Please complete the system readiness checks on the right while waiting.
                </p>

                {/* Dev Override Helper */}
                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Demo Testing Mode:</span>
                  <button
                    type="button"
                    onClick={() => setForceUnlockForDemo(!forceUnlockForDemo)}
                    className="text-[11px] px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
                  >
                    Force Unlock Start Now
                  </button>
                </div>
              </div>
            )}

            {isWithinJoinWindow && (
              <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Examination Hall is Now Open</span>
                </div>
                <p className="text-xs text-emerald-200 leading-relaxed">
                  The questions are ready. You are within the authorized join grace period (closes at{" "}
                  <strong className="text-white">{joinClosesAt.toLocaleTimeString()}</strong>).
                </p>
              </div>
            )}

            {isLateJoinLocked && (
              <div className="p-5 rounded-2xl bg-rose-950/60 border border-rose-500/40 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Late Join Window Elapsed</span>
                </div>
                <p className="text-xs text-rose-200 leading-relaxed">
                  The entry window for Slot #{payload.slotNumber} closed at{" "}
                  {joinClosesAt.toLocaleTimeString()}. You have been marked absent for this slot. Please check with your supervisor or administrator for enrollment in <strong>Slot 2 (Re-Examination)</strong>.
                </p>
              </div>
            )}

            {/* Timing Schedule Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Login Opens: {new Date(payload.loginOpensAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Start: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400" />
                <span>Cutoff: {joinClosesAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Readiness Checklist & Enter Button */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                System Readiness Checklist
              </h3>
            </div>

            {/* Camera Video Test */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-slate-500" />
                  Webcam Feed
                </span>
                {cameraActive ? (
                  <span className="text-emerald-600 text-[11px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Ready
                  </span>
                ) : (
                  <span className="text-slate-400 text-[11px]">Unverified</span>
                )}
              </div>

              <div className="relative aspect-video rounded-2xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                />
                {!cameraActive && (
                  <div className="text-center p-3">
                    <Camera className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
                    <button
                      type="button"
                      onClick={startCameraCheck}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-colors shadow-sm"
                    >
                      Test Camera Feed
                    </button>
                  </div>
                )}
              </div>
              {cameraError && (
                <p className="text-[10px] text-rose-600 leading-tight">
                  {cameraError}
                </p>
              )}
            </div>

            {/* Checklist items */}
            <div className="space-y-2.5 pt-2 text-xs">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Mic className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block text-[11px]">
                    Microphone & Audio Activity
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Background voice tracking enabled (Silero VAD edge model)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <Maximize2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 block text-[11px]">
                    Fullscreen Lockout Enforced
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Tab switches & window minimizations are audited
                  </span>
                </div>
              </div>
            </div>

            {/* Academic Integrity Undertaking */}
            <div className="pt-3 border-t border-slate-100">
              <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={undertakingAgreed}
                  onChange={(e) => setUndertakingAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span className="leading-snug">
                  I solemnly certify that I will take this examination with academic honesty, under continuous AI invigilation, without external aids or unauthorized personnel.
                </span>
              </label>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Enter Hall Action */}
            <button
              type="button"
              disabled={isBeforeStart || isLateJoinLocked || !undertakingAgreed || isStarting}
              onClick={handleEnterHall}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
                isBeforeStart || isLateJoinLocked || !undertakingAgreed || isStarting
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/20 active:scale-[0.98]"
              }`}
            >
              {isStarting ? (
                <span>Unlocking Question Paper...</span>
              ) : isLateJoinLocked ? (
                <span>Entry Window Closed</span>
              ) : isBeforeStart ? (
                <span>Waiting for Official Start Time</span>
              ) : (
                <>
                  <span>Enter Examination Hall</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
