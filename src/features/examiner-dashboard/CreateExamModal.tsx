"use client";

import { useState } from "react";
import { 
  X, 
  Sparkles, 
  Shield, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Sliders, 
  UserCheck 
} from "lucide-react";

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (examData: {
    title: string;
    course_code: string;
    description: string;
    duration_minutes: number;
    total_marks: number;
    passing_marks: number;
    start_time: string;
    end_time: string;
    login_opens_at?: string;
    join_window_minutes?: number;
    anti_cheat_config: {
      enable_face_tracking: boolean;
      enable_audio_monitoring: boolean;
      max_tab_switches: number;
      max_fullscreen_exits: number;
      periodic_snapshot_interval_sec: number;
      allowed_yaw_angle_deg: number;
      allowed_pitch_angle_deg: number;
    };
  }) => Promise<{ success?: boolean; error?: string } | void> | void;
}

type SecurityPreset = "STRICT" | "STANDARD" | "RELAXED";

function getInitialStartTime(): string {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function CreateExamModal({ isOpen, onClose, onCreate }: CreateExamModalProps) {
  // Core Essentials
  const [title, setTitle] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [startTime, setStartTime] = useState(getInitialStartTime);
  
  // Duration
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [customDuration, setCustomDuration] = useState(false);

  // Late Entry Grace Window (After Exam Starts)
  const [joinWindowMinutes, setJoinWindowMinutes] = useState(15);
  const [customGrace, setCustomGrace] = useState(false);

  // Security Preset
  const [securityPreset, setSecurityPreset] = useState<SecurityPreset>("STRICT");

  // Advanced Options (Progressive Disclosure)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(50);
  const [description, setDescription] = useState("");
  const [maxTabSwitches, setMaxTabSwitches] = useState(3);
  const [maxFullscreenExits, setMaxFullscreenExits] = useState(3);
  const [snapshotIntervalSec, setSnapshotIntervalSec] = useState(60);
  const [enableFaceTracking, setEnableFaceTracking] = useState(true);
  const [enableAudioMonitoring, setEnableAudioMonitoring] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!isOpen) return null;

  const applySecurityPreset = (preset: SecurityPreset) => {
    setSecurityPreset(preset);
    if (preset === "STRICT") {
      setEnableFaceTracking(true);
      setEnableAudioMonitoring(true);
      setMaxTabSwitches(3);
      setMaxFullscreenExits(3);
      setSnapshotIntervalSec(60);
    } else if (preset === "STANDARD") {
      setEnableFaceTracking(true);
      setEnableAudioMonitoring(true);
      setMaxTabSwitches(5);
      setMaxFullscreenExits(5);
      setSnapshotIntervalSec(90);
    } else {
      setEnableFaceTracking(true);
      setEnableAudioMonitoring(false);
      setMaxTabSwitches(10);
      setMaxFullscreenExits(10);
      setSnapshotIntervalSec(180);
    }
  };

  // Derive smart timings
  const startDate = new Date(startTime);
  const isValidDate = !isNaN(startDate.getTime());

  // Check-in opens 15 mins before start time
  const checkInDate = isValidDate ? new Date(startDate.getTime() - 15 * 60000) : null;
  // Late entry cutoff after exam start
  const lateEntryCutoffDate = isValidDate ? new Date(startDate.getTime() + joinWindowMinutes * 60000) : null;
  // Hard end time: exam duration + grace window buffer
  const endDate = isValidDate ? new Date(startDate.getTime() + (durationMinutes + joinWindowMinutes) * 60000) : null;

  const formatTime = (d: Date | null) => {
    if (!d || isNaN(d.getTime())) return "--:--";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (d: Date | null) => {
    if (!d || isNaN(d.getTime())) return "---";
    return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  };

  // Auto-generate course code helper
  const handleAutoGenerateCourseCode = () => {
    if (!title.trim()) return;
    const words = title
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    const acronym = words.slice(0, 3).map((w) => w[0].toUpperCase()).join("");
    const year = new Date().getFullYear();
    setCourseCode(`PHD-${acronym || "EXAM"}-${year}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("Please enter an Examination Title.");
      return;
    }
    if (!courseCode.trim()) {
      setErrorMessage("Please enter or generate a Course Code.");
      return;
    }
    if (!isValidDate) {
      setErrorMessage("Please select a valid start date and time.");
      return;
    }
    if (durationMinutes < 15 || durationMinutes > 720) {
      setErrorMessage("Duration must be between 15 and 720 minutes.");
      return;
    }
    if (joinWindowMinutes < 1 || joinWindowMinutes > 120) {
      setErrorMessage("Grace period must be between 1 and 120 minutes.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const calculatedStart = new Date(startTime).toISOString();
      const calculatedEnd = (endDate || new Date(startDate.getTime() + (durationMinutes + joinWindowMinutes) * 60000)).toISOString();
      const calculatedLogin = (checkInDate || new Date(startDate.getTime() - 15 * 60000)).toISOString();

      const res = await onCreate({
        title: title.trim(),
        course_code: courseCode.trim().toUpperCase(),
        description: description.trim(),
        duration_minutes: Number(durationMinutes),
        start_time: calculatedStart,
        end_time: calculatedEnd,
        login_opens_at: calculatedLogin,
        join_window_minutes: Number(joinWindowMinutes),
        total_marks: Number(totalMarks) || 100,
        passing_marks: Number(passingMarks) || 50,
        anti_cheat_config: {
          enable_face_tracking: enableFaceTracking,
          enable_audio_monitoring: enableAudioMonitoring,
          max_tab_switches: Number(maxTabSwitches),
          max_fullscreen_exits: Number(maxFullscreenExits),
          periodic_snapshot_interval_sec: Number(snapshotIntervalSec),
          allowed_yaw_angle_deg: 28,
          allowed_pitch_angle_deg: 20,
        },
      });

      if (res && res.error) {
        setErrorMessage(res.error);
        setIsSubmitting(false);
        return;
      }

      onClose();
    } catch {
      setErrorMessage("An unexpected error occurred while saving examination.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Create Ph.D Examination</h2>
              <p className="text-[11px] text-slate-500">Configure schedule, duration, late entry window, and proctoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          {/* 1. Examination Title & Course Code */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Examination Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ph.D Qualifying Examination: Research Methodology & Core Disciplines"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold">Course Code *</label>
                  {title.trim() && (
                    <button
                      type="button"
                      onClick={handleAutoGenerateCourseCode}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold"
                    >
                      Auto-generate
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. PHD-QUAL-2026"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold text-xs uppercase focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                />
              </div>
            </div>
          </div>

          {/* 2. Duration Selector */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-slate-700 font-bold">
              Candidate Exam Duration
            </label>
            <div className="flex items-center gap-2">
              {[60, 90, 120, 180].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setDurationMinutes(d);
                    setCustomDuration(false);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                    !customDuration && durationMinutes === d
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {d} Mins
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomDuration(true)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  customDuration
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Custom
              </button>
            </div>
            {customDuration && (
              <div className="pt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={15}
                  max={720}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  placeholder="Enter minutes..."
                  className="w-32 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
                <span className="text-slate-500 text-xs font-medium">Minutes</span>
              </div>
            )}
          </div>

          {/* 3. Late Entry Grace Period (Once Exam Starts) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Late Entry Grace Period (After Exam Starts)</span>
              </label>
              <span className="text-[10px] text-slate-400">Allowed join window</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Students can enter and start the exam until this grace time. Latecomers after this cutoff will be locked out.
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              {[10, 15, 20, 30].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setJoinWindowMinutes(m);
                    setCustomGrace(false);
                  }}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border ${
                    !customGrace && joinWindowMinutes === m
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {m} Mins {m === 15 ? "(Standard)" : ""}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCustomGrace(true)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                  customGrace
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                Custom
              </button>
            </div>
            {customGrace && (
              <div className="pt-1 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={joinWindowMinutes}
                  onChange={(e) => setJoinWindowMinutes(Number(e.target.value))}
                  placeholder="Minutes..."
                  className="w-32 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
                <span className="text-slate-500 text-xs font-medium">Minutes allowed after start</span>
              </div>
            )}
          </div>

          {/* 4. Automated Schedule Summary Strip (Calculated Automatically) */}
          {isValidDate && (
            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-indigo-950 space-y-1">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3 h-3 text-indigo-600" />
                <span>Automated Slot 1 Schedule Timeline</span>
              </span>
              <div className="grid grid-cols-4 gap-2 text-[11px] pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">Check-In Opens:</span>
                  <span className="font-bold text-slate-800">{formatTime(checkInDate)}</span>
                  <span className="text-[9px] text-slate-400 block">Waiting room</span>
                </div>
                <div>
                  <span className="text-indigo-600 block text-[10px] font-semibold">Questions Unlock:</span>
                  <span className="font-bold text-indigo-700">{formatTime(startDate)}</span>
                  <span className="text-[9px] text-indigo-500 block">{formatDate(startDate)}</span>
                </div>
                <div>
                  <span className="text-amber-700 block text-[10px] font-semibold">Late Entry Cutoff:</span>
                  <span className="font-bold text-amber-800">{formatTime(lateEntryCutoffDate)}</span>
                  <span className="text-[9px] text-amber-600 block">+{joinWindowMinutes}m grace</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Hard End Time:</span>
                  <span className="font-bold text-slate-800">{formatTime(endDate)}</span>
                  <span className="text-[9px] text-slate-400 block">Session closes</span>
                </div>
              </div>
            </div>
          )}

          {/* 5. Security & Proctoring Level Preset */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>AI Proctoring Level</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Client-Side Edge AI
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applySecurityPreset("STRICT")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  securityPreset === "STRICT"
                    ? "border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/20"
                    : "border-slate-200 bg-slate-50/50 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-xs">Strict</span>
                  {securityPreset === "STRICT" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Face + Audio VAD, 3 tab switch lockout (Recommended)
                </p>
              </button>

              <button
                type="button"
                onClick={() => applySecurityPreset("STANDARD")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  securityPreset === "STANDARD"
                    ? "border-indigo-500 bg-indigo-50/50 ring-1 ring-indigo-500/20"
                    : "border-slate-200 bg-slate-50/50 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-xs">Standard</span>
                  {securityPreset === "STANDARD" && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Face AI active, 5 tab switch warning threshold
                </p>
              </button>

              <button
                type="button"
                onClick={() => applySecurityPreset("RELAXED")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  securityPreset === "RELAXED"
                    ? "border-slate-500 bg-slate-100 ring-1 ring-slate-400"
                    : "border-slate-200 bg-slate-50/50 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 text-xs">Practice</span>
                  {securityPreset === "RELAXED" && <Check className="w-3.5 h-3.5 text-slate-600" />}
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Low restriction, warnings only (Mock trials)
                </p>
              </button>
            </div>
          </div>

          {/* 6. Progressive Disclosure: Advanced Settings Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full py-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <span className="flex items-center gap-1.5 font-bold text-xs">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Advanced Options (Marks, Instructions & Threshold Overrides)</span>
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
                {/* Marks Configuration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Total Marks</label>
                    <input
                      type="number"
                      min={10}
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Passing Threshold</label>
                    <input
                      type="number"
                      min={1}
                      max={totalMarks}
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Scope & Instructions */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Instructions / Scope Note</label>
                  <textarea
                    rows={2}
                    placeholder="Candidate guidelines or departmental coverage notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs resize-none"
                  />
                </div>

                {/* Micro Proctoring Overrides */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                  <div>
                    <label className="block text-slate-600 font-medium text-[10px] mb-0.5">Max Tab Switches</label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={maxTabSwitches}
                      onChange={(e) => setMaxTabSwitches(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium text-[10px] mb-0.5">Max Fullscreen Exits</label>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={maxFullscreenExits}
                      onChange={(e) => setMaxFullscreenExits(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium text-[10px] mb-0.5">Snapshot Cadence (s)</label>
                    <input
                      type="number"
                      min={15}
                      max={300}
                      value={snapshotIntervalSec}
                      onChange={(e) => setSnapshotIntervalSec(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-xs text-slate-900"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSubmitting ? "Creating Examination..." : "Create Examination & Slot 1"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
