"use client";

import { useState, useEffect, useRef } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { CandidateSessionPayload, startExamSessionAction } from "./actions";

const headingFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});
import {
  GraduationCap,
  Clock,
  Camera,
  Mic,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  LogOut,
  Award,
  Check,
  RefreshCw,
  UserCheck,
  Layers,
  Radio,
  CloudCheck,
  ShieldAlert,
  LayoutGrid,
  Wifi,
  HelpCircle,
  ShieldCheck
} from "lucide-react";

interface WaitingRoomViewProps {
  payload: CandidateSessionPayload;
  onStartExam: () => void;
  onLogout: () => void;
  isSandbox?: boolean;
}

export function WaitingRoomView({
  payload,
  onStartExam,
  onLogout,
  isSandbox = false,
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

  // 1-second clock ticker
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

  const graceMinutes = Math.max(1, Math.round((joinClosesAt.getTime() - startTime.getTime()) / 60000));

  const getCountdownString = () => {
    const diffMs = startTime.getTime() - now.getTime();
    if (diffMs <= 0) return "00:00:00";
    const totalSecs = Math.floor(diffMs / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getGraceCountdownString = () => {
    const diffMs = joinClosesAt.getTime() - now.getTime();
    if (diffMs <= 0) return "00:00";
    const totalSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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
      console.error("Camera error:", err);
      setCameraError("Camera permission denied. Please click 'Allow' in your browser to turn on your camera.");
      setCameraActive(false);
    }
  };

  const handleEnterHall = async () => {
    if (!undertakingAgreed) {
      setErrorMsg("Please tick the promise checkbox before entering the exam hall.");
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
      setErrorMsg(res.error || "Unable to start the exam. Please try again or contact the invigilator.");
    }
  };

  const candidateInitials = payload.fullName
    ? payload.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "ST";

  return (
    <div className={`h-screen w-screen flex flex-col bg-slate-100/80 text-slate-900 ${headingFont.className} select-none overflow-hidden relative`}>
      {/* Subtle Atmospheric Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP HEADER (Prestigious, Polished, Clean) */}
      <header className="h-13 bg-white/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between border-b border-slate-200/90 shadow-2xs shrink-0 z-20">
        {/* Left: Institution Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-700 text-white flex items-center justify-center shadow-xs shrink-0 ring-1 ring-indigo-500/20">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-900 tracking-tight">
              Ph.D Exam Portal
            </span>
            <span className="text-slate-300 hidden sm:inline">•</span>
            <span className="text-[11px] font-bold text-indigo-700 hidden sm:inline uppercase tracking-wider bg-indigo-50/90 px-2 py-0.5 rounded-md border border-indigo-100">
              Exam Waiting Hall
            </span>
          </div>
        </div>

        {/* Center: Live Clock Pill */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono font-medium text-slate-600 bg-slate-100/90 px-3.5 py-1 rounded-full border border-slate-200/80 shadow-2xs">
          <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
          <span>Current Time: {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          <span className="text-slate-300">•</span>
          <span>Exam Starts: <strong className="text-slate-900 font-bold">{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
        </div>

        {/* Right: Scholar Card & Sign Out */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-bold text-[11px] flex items-center justify-center shadow-xs shrink-0">
              {candidateInitials}
            </div>
            <div className="text-right leading-tight">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-xs font-bold text-slate-900 tracking-tight">{payload.fullName}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {payload.regNumber}
                </span>
              </div>
              <div className="flex items-center gap-1 justify-end text-[10px] text-slate-500 mt-0.5">
                <span>Dept: {payload.departmentCode}</span>
                <span>•</span>
                <span className={`font-bold ${payload.isRetestSlot ? "text-amber-600" : "text-emerald-700"}`}>
                  {payload.isRetestSlot ? "Slot 2 (Retest)" : "Slot 1"}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="h-8 px-2.5 rounded-lg text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ml-1"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* 2. ZERO-OVERFLOW WORKSTATION (Fits 100% inside screen, perfectly balanced) */}
      <main className="flex-1 h-[calc(100vh-3.25rem)] overflow-hidden max-w-7xl w-full mx-auto p-3 sm:p-4 lg:p-4.5 flex flex-col justify-between gap-3 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch flex-1 overflow-hidden">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: Exam Details, Structure, & How This Exam Works (7 Cols)      */}
          {/* ========================================================================= */}
          <section className="lg:col-span-7 p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm relative overflow-hidden flex flex-col justify-between gap-2.5">
            {/* Top decorative accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600" />

            {/* Top Exam Header & Summary Group (Cohesive Spacing, No Wasted Space) */}
            <div className="space-y-2 shrink-0">
              {/* Header: Exam Title & Subject (Compact, Clean, Unified) */}
              <div className="flex items-start justify-between gap-3 pb-1 border-b border-slate-100">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {payload.courseCode}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      Ph.D Degree Assessment
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                    {payload.examTitle}
                  </h1>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-emerald-700 font-bold inline-flex items-center gap-1 text-[11px] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 mb-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Student Verified
                  </span>
                  <p className="text-[11px] font-medium text-slate-600">
                    Subject: <strong className="text-indigo-950 font-bold">{payload.departmentName}</strong>
                  </p>
                </div>
              </div>

              {/* Sleek 3-Metric Ribbon (Optimized Space, Zero Redundancy) */}
              <div className="grid grid-cols-3 rounded-xl bg-slate-50/90 border border-slate-200/90 divide-x divide-slate-200/80 py-1.5 px-2 text-center shadow-2xs">
                {/* Duration */}
                <div className="px-2">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                    <Clock className="w-3 h-3 text-indigo-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Time Allowed</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-slate-900 block tracking-tight">
                    {payload.durationMinutes} Minutes
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium block">Non-Stop Countdown</span>
                </div>

                {/* Total Marks */}
                <div className="px-2">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                    <Award className="w-3 h-3 text-violet-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Marks</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-slate-900 block tracking-tight">
                    {payload.totalMarks} Marks
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium block">100 Questions • 1 Mark Each</span>
                </div>

                {/* Marking Scheme */}
                <div className="px-2">
                  <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Scoring Rule</span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-emerald-700 block tracking-tight">
                    No Negative
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium block">Wrong Answers: 0 Marks</span>
                </div>
              </div>

              {/* Exam Sections & Weightage (Easy to Read in a Glance) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs px-0.5">
                  <span className="font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 text-[11px]">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    Question Paper Sections
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">Part A (40%) + Part B (60%)</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Section A Card */}
                  <div className="p-2 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-2.5 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold text-xs flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span>40</span>
                      <span className="text-[7px] uppercase tracking-wider font-semibold -mt-0.5">Marks</span>
                    </div>
                    <div className="min-w-0 leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 tracking-tight truncate">Section A • General Research</span>
                        <span className="text-[9px] font-bold text-indigo-700 bg-white px-1.5 py-0.2 rounded border border-indigo-200 shrink-0">40 Qs</span>
                      </div>
                      <p className="text-[10px] text-slate-600 font-medium truncate mt-0.5">
                        Research methods, logical reasoning & ethics
                      </p>
                    </div>
                  </div>

                  {/* Section B Card */}
                  <div className="p-2 rounded-xl bg-violet-50/70 border border-violet-100 flex items-center gap-2.5 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 text-white font-bold text-xs flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span>60</span>
                      <span className="text-[7px] uppercase tracking-wider font-semibold -mt-0.5">Marks</span>
                    </div>
                    <div className="min-w-0 leading-tight">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 tracking-tight truncate">Section B • Subject Knowledge</span>
                        <span className="text-[9px] font-bold text-violet-700 bg-white px-1.5 py-0.2 rounded border border-violet-200 shrink-0">60 Qs</span>
                      </div>
                      <p className="text-[10px] text-slate-600 font-medium truncate mt-0.5">
                        Core specialization: {payload.departmentName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Candidate Rules & Instructions (4 Spacious, Balanced Cards - No Crowding) */}
            <div className="flex-1 flex flex-col justify-between gap-1.5 min-h-0">
              <div className="flex items-center justify-between shrink-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Exam Rules & Guidelines
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Important Instructions</span>
              </div>

              <div className="grid grid-cols-2 gap-2 flex-1">
                {/* Rule 1: Navigation & Review */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/90 hover:bg-slate-100/70 border border-slate-200/80 flex items-start gap-2.5 transition-colors shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </div>
                  <div className="leading-snug min-w-0">
                    <span className="text-xs font-bold text-slate-900 block tracking-tight">
                      1. Navigation & Review
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium leading-relaxed">
                      Jump to any question from the palette, switch between Section A and Section B at any time, and flag questions to review before submitting.
                    </p>
                  </div>
                </div>

                {/* Rule 2: Autosave */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/90 hover:bg-slate-100/70 border border-slate-200/80 flex items-start gap-2.5 transition-colors shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CloudCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="leading-snug min-w-0">
                    <span className="text-xs font-bold text-slate-900 block tracking-tight">
                      2. Cloud Autosave Active
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium leading-relaxed">
                      Every choice you click is saved immediately to our server. If your internet disconnects for a moment, all your answers stay 100% safe.
                    </p>
                  </div>
                </div>

                {/* Rule 3: Full Screen Guard & Camera */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/90 hover:bg-slate-100/70 border border-slate-200/80 flex items-start gap-2.5 transition-colors shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                  </div>
                  <div className="leading-snug min-w-0">
                    <span className="text-xs font-bold text-slate-900 block tracking-tight">
                      3. Full Screen Guard Active
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium leading-relaxed">
                      Exam must stay in full screen. If you exit full screen accidentally, questions blur until you return. No strikes are deducted for returning.
                    </p>
                  </div>
                </div>

                {/* Rule 4: Submission & Receipt */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-50/90 hover:bg-slate-100/70 border border-slate-200/80 flex items-start gap-2.5 transition-colors shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="leading-snug min-w-0">
                    <span className="text-xs font-bold text-slate-900 block tracking-tight">
                      4. Automatic Submit on Timer
                    </span>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium leading-relaxed">
                      When the 90-minute countdown reaches 00:00, your exam submits automatically. You can also submit when done and get an official receipt.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invigilator Support Bar (Comfortable, Completely Visible, High-Contrast) */}
            <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center gap-2 text-indigo-950 shrink-0">
              <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-xs leading-tight font-medium text-slate-700">
                <strong className="text-indigo-900 font-bold">Need help during the test?</strong> If you face any camera, keyboard, or computer issues, raise your hand to alert the exam supervisor immediately.
              </span>
            </div>
          </section>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: Camera Check, Timings & Enter Exam Button (5 Cols)           */}
          {/* ========================================================================= */}
          <section className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between gap-2.5 overflow-hidden">
            {/* Header: Camera Check */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600" />
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Camera & System Check
                </h2>
              </div>
              {cameraActive ? (
                <span className="text-[11px] font-mono font-bold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  <Check className="w-3 h-3 text-emerald-600" /> Camera Ready
                </span>
              ) : (
                <span className="text-[11px] text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Camera Check Needed
                </span>
              )}
            </div>

            {/* Webcam Frame */}
            <div className="relative h-28 sm:h-30 rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner shrink-0 group">
              <video
                ref={videoRef}
                muted
                playsInline
                className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
              />

              {!cameraActive ? (
                <div className="text-center p-2.5 space-y-1">
                  <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-400 shadow-md">
                    <Camera className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-300 font-bold">Please Turn On Your Camera</p>
                    <p className="text-[10px] text-slate-500">Your camera must stay on so we can see you taking the exam</p>
                  </div>
                  <button
                    type="button"
                    onClick={startCameraCheck}
                    className="px-3.5 py-1 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/25 cursor-pointer active:scale-98 inline-flex items-center gap-1.5"
                  >
                    <Camera className="w-3 h-3" />
                    <span>Turn On Camera</span>
                  </button>
                </div>
              ) : (
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>Camera Live & Working</span>
                  </span>
                  <button
                    type="button"
                    onClick={startCameraCheck}
                    title="Test camera again"
                    className="p-1 rounded bg-slate-900/80 text-white/80 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-1.5 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* Exam Timings (Plain English) */}
            <div className="p-2 rounded-xl bg-slate-50/90 border border-slate-200/90 space-y-1 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1 text-[10px]">
                  <Clock className="w-3 h-3 text-indigo-600" /> Exam Schedule
                </span>
                <span className="text-[10px] text-slate-500">{graceMinutes} mins allowed for late entry</span>
              </div>

              <div className="grid grid-cols-3 gap-1.5 font-mono text-center text-xs">
                <div className="p-1 rounded-lg bg-white border border-slate-200/80">
                  <span className="text-[9px] text-slate-400 uppercase block font-sans font-bold">Entry Opens</span>
                  <span className="font-extrabold text-slate-800 text-[11px] block">
                    {new Date(payload.loginOpensAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="p-1 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <span className="text-[9px] text-emerald-700 uppercase block font-sans font-bold">Start Time</span>
                  <span className="font-extrabold text-emerald-900 text-[11px] block">
                    {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="p-1 rounded-lg bg-amber-50/70 border border-amber-200">
                  <span className="text-[9px] text-amber-700 uppercase block font-sans font-bold">Late Cutoff</span>
                  <span className="font-extrabold text-amber-900 text-[11px] block">
                    {joinClosesAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* System Status (Simple English) */}
            <div className="space-y-1 text-xs shrink-0">
              {/* 1. Microphone */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/80 border border-slate-200/90">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shrink-0">
                    <Mic className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-xs block leading-tight">Microphone Check</span>
                    <span className="text-[10px] text-slate-400 block">Listens for room noise and voices</span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Active
                </span>
              </div>

              {/* 2. Full Screen Mode */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/80 border border-slate-200/90">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shrink-0">
                    <Maximize2 className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-xs block leading-tight">Full Screen Guard</span>
                    <span className="text-[10px] text-slate-400 block">Questions blur if full screen is lost</span>
                  </div>
                </div>
                <span className="text-[10px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Enforced
                </span>
              </div>

              {/* 3. Internet Connection */}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/80 border border-slate-200/90">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 shrink-0">
                    <Wifi className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 text-xs block leading-tight">Internet Connection</span>
                    <span className="text-[10px] text-slate-400 block">Connected to university exam server</span>
                  </div>
                </div>
                <span className="text-[10px] text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                  Good
                </span>
              </div>
            </div>

            {/* Student Promise Checkbox (Natural, Everyday English) */}
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/90 shrink-0">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={undertakingAgreed}
                  onChange={(e) => setUndertakingAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer shrink-0"
                />
                <span className="leading-tight text-[11px] text-slate-700 font-medium">
                  I promise that I will take this exam honestly by myself, without opening other websites, using books or notes, or getting help from anyone.
                </span>
              </label>
            </div>

            {/* Unified Timing Banner (The ONLY countdown on the screen) */}
            <div className="shrink-0">
              {isWithinJoinWindow ? (
                <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-50 via-emerald-50/80 to-teal-50 border border-emerald-200 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 text-emerald-950 text-xs font-bold truncate">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                    </span>
                    <span className="truncate">
                      Exam is Live • Entry closes at {joinClosesAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-black text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200/90 shadow-2xs shrink-0">
                    {getGraceCountdownString()} left
                  </span>
                </div>
              ) : isBeforeStart ? (
                <div className="p-2 rounded-xl bg-amber-50/90 border border-amber-200 flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs text-amber-900 font-bold">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Exam starts in:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black font-mono text-emerald-700 bg-white px-2 py-0.5 rounded border border-amber-200">
                      {getCountdownString()}
                    </span>
                    {isSandbox && (
                      <button
                        type="button"
                        onClick={() => setForceUnlockForDemo(!forceUnlockForDemo)}
                        className="text-[10px] px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        Demo Unlock
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold space-y-0.5">
                  <div className="flex items-center gap-1.5 font-bold text-rose-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Late Entry Time Closed ({joinClosesAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                  </div>
                  <p className="text-[10px] text-rose-700 leading-tight">
                    The entry time has passed. Please contact the exam office for <strong>Slot 2 (Retest)</strong>.
                  </p>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-1.5 animate-in fade-in shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Pinned Primary Button (Always visible on screen without scroll) */}
            <button
              type="button"
              disabled={isBeforeStart || isLateJoinLocked || !undertakingAgreed || isStarting}
              onClick={handleEnterHall}
              className={`w-full py-2.5 sm:py-2.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer shrink-0 ${
                isBeforeStart || isLateJoinLocked || !undertakingAgreed || isStarting
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-500 hover:to-violet-600 text-white shadow-lg shadow-indigo-600/25 active:scale-[0.99] group"
              }`}
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading your questions...</span>
                </>
              ) : isLateJoinLocked ? (
                <span>Entry Time Closed (Next Slot Available)</span>
              ) : isBeforeStart ? (
                <span>Waiting for Exam to Start ({getCountdownString()})</span>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Enter Exam Hall ({getGraceCountdownString()} Left)</span>
                  <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </section>
        </div>
      </main>
    </div>
  );
}
