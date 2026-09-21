"use client";

import { useState, useCallback } from "react";
import { 
  X, 
  Layers, 
  Plus, 
  Clock, 
  Zap, 
  Sparkles, 
  Calendar, 
  Sun, 
  Sunrise, 
  RotateCcw, 
  UserCheck, 
  Check, 
  AlertCircle 
} from "lucide-react";
import { 
  updateExamSlotAction, 
  createExamSlotAction, 
  deleteExamSlotAction,
  SerializedExam
} from "@/app/admin/actions";
import { SlotStatus } from "@/types";

interface SlotManagerModalProps {
  isOpen: boolean;
  exam: SerializedExam | null;
  onClose: () => void;
  onUpdate: () => void;
}

type PresetType = "in_5m" | "in_15m" | "after_last" | "today_pm" | "tomorrow_am";

/** Format local date to datetime-local input string without timezone skew */
function formatForDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/** Format datetime to human friendly time */
function formatTime(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** Format datetime to short date */
function formatDate(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return "---";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

function getSuggestedSlotName(nextSlotNumber: number, isRetest: boolean): string {
  if (isRetest) {
    return `Slot ${nextSlotNumber} - Re-Exam / Makeup Slot`;
  }
  if (nextSlotNumber === 1) return `Slot 1 - Morning Session`;
  if (nextSlotNumber === 2) return `Slot 2 - Afternoon Session`;
  if (nextSlotNumber === 3) return `Slot 3 - Evening Session`;
  return `Slot ${nextSlotNumber} - Supplementary Session`;
}

export function SlotManagerModal({ isOpen, exam, onClose, onUpdate }: SlotManagerModalProps) {
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetType | null>(null);

  const slots = exam?.slots || [];

  // Plain derived state (zero hook overhead, 100% reactive)
  const nextSlotNumber = slots.length === 0 
    ? 1 
    : Math.max(...slots.map((s) => s.slot_number || 0)) + 1;

  const latestSlot = slots.length === 0 
    ? null 
    : [...slots].sort((a, b) => new Date(b.end_time).getTime() - new Date(a.end_time).getTime())[0];

  // Form State matching CreateExamModal pattern
  const [slotName, setSlotName] = useState("Slot 2 - Afternoon Session");
  const [isRetestSlot, setIsRetestSlot] = useState(false);
  const [startTime, setStartTime] = useState("");
  
  // Duration selector (defaults to exam duration)
  const [durationMinutes, setDurationMinutes] = useState(exam?.duration_minutes || 90);
  const [customDuration, setCustomDuration] = useState(false);

  // Late Entry Grace Window selector (defaults to 15 mins)
  const [joinWindowMinutes, setJoinWindowMinutes] = useState(15);
  const [customGrace, setCustomGrace] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  /** Initialize the slot creation form with intelligent defaults & presets */
  const initializeSlotForm = useCallback((isRetest = false, preset: PresetType = "after_last") => {
    setErrorMsg("");
    setActivePreset(preset);
    setIsRetestSlot(isRetest);
    setSlotName(getSuggestedSlotName(nextSlotNumber, isRetest));
    setDurationMinutes(exam?.duration_minutes || 90);
    setCustomDuration(false);
    setJoinWindowMinutes(15);
    setCustomGrace(false);

    const now = new Date();
    let startDate = new Date();

    if (preset === "in_5m") {
      startDate = new Date(now.getTime() + 5 * 60000);
    } else if (preset === "in_15m") {
      startDate = new Date(now.getTime() + 15 * 60000);
    } else if (preset === "today_pm") {
      startDate = new Date(now);
      startDate.setHours(14, 0, 0, 0); // 2:00 PM
      if (startDate.getTime() < now.getTime()) {
        startDate.setHours(16, 0, 0, 0);
        if (startDate.getTime() < now.getTime()) {
          startDate.setDate(startDate.getDate() + 1);
          startDate.setHours(14, 0, 0, 0);
        }
      }
    } else if (preset === "tomorrow_am") {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() + 1);
      startDate.setHours(10, 0, 0, 0); // 10:00 AM
    } else {
      // "after_last" default:
      if (latestSlot) {
        const lastEnd = new Date(latestSlot.end_time);
        if (!isNaN(lastEnd.getTime()) && lastEnd.getTime() > now.getTime() - 3600000) {
          startDate = new Date(lastEnd.getTime() + 30 * 60000);
        } else {
          startDate = new Date(now.getTime() + 15 * 60000);
          const rem = startDate.getMinutes() % 5;
          if (rem !== 0) startDate.setMinutes(startDate.getMinutes() + (5 - rem));
        }
      } else {
        startDate = new Date(now.getTime() + 15 * 60000);
        const rem = startDate.getMinutes() % 5;
        if (rem !== 0) startDate.setMinutes(startDate.getMinutes() + (5 - rem));
      }
    }

    startDate.setSeconds(0);
    startDate.setMilliseconds(0);

    setStartTime(formatForDateTimeLocal(startDate));
    setIsAddingSlot(true);
  }, [exam?.duration_minutes, latestSlot, nextSlotNumber]);

  const handleClose = () => {
    setIsAddingSlot(false);
    setErrorMsg("");
    onClose();
  };

  // Derive smart timings matching CreateExamModal logic
  const startDate = new Date(startTime);
  const isValidDate = !isNaN(startDate.getTime());

  // Check-in opens 15 mins before start time (or immediately if starting sooner)
  const checkInDate = isValidDate ? new Date(startDate.getTime() - 15 * 60000) : null;
  // Late entry cutoff after exam start
  const lateEntryCutoffDate = isValidDate ? new Date(startDate.getTime() + joinWindowMinutes * 60000) : null;
  // Hard end time: exam duration after start
  const endDate = isValidDate ? new Date(startDate.getTime() + durationMinutes * 60000) : null;

  if (!isOpen || !exam) return null;

  const handleStatusChange = async (slotId: string, newStatus: SlotStatus) => {
    setIsSubmitting(true);
    await updateExamSlotAction(slotId, { status: newStatus });
    setIsSubmitting(false);
    onUpdate();
  };

  const handleDeleteSlot = async (slotId: string, deletedSlotName: string) => {
    if (confirm(`Are you sure you want to delete ${deletedSlotName}?`)) {
      setIsSubmitting(true);
      const res = await deleteExamSlotAction(slotId);
      setIsSubmitting(false);
      if (!res.success) {
        setErrorMsg(res.error || "Failed to delete slot.");
      } else {
        onUpdate();
      }
    }
  };

  /** Toggle Retest Slot checkbox and dynamically suggest appropriate slot title */
  const handleRetestToggle = (checked: boolean) => {
    setIsRetestSlot(checked);
    const isDefaultName = 
      slotName.includes("Session") || 
      slotName.includes("Re-Exam") || 
      slotName.includes("Slot");

    if (isDefaultName) {
      setSlotName(getSuggestedSlotName(nextSlotNumber, checked));
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotName.trim()) {
      setErrorMsg("Please enter a Slot Name.");
      return;
    }
    if (!isValidDate) {
      setErrorMsg("Please select a valid Start Date & Time.");
      return;
    }
    if (durationMinutes < 15 || durationMinutes > 720) {
      setErrorMsg("Duration must be between 15 and 720 minutes.");
      return;
    }
    if (joinWindowMinutes < 1 || joinWindowMinutes > 120) {
      setErrorMsg("Grace period must be between 1 and 120 minutes.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const calculatedStart = startDate.toISOString();
    const calculatedEnd = (endDate || new Date(startDate.getTime() + durationMinutes * 60000)).toISOString();
    const calculatedLogin = (checkInDate || new Date(startDate.getTime() - 15 * 60000)).toISOString();
    const calculatedCutoff = (lateEntryCutoffDate || new Date(startDate.getTime() + joinWindowMinutes * 60000)).toISOString();

    const res = await createExamSlotAction({
      exam_id: exam.id,
      slot_name: slotName.trim(),
      login_opens_at: calculatedLogin,
      start_time: calculatedStart,
      join_window_closes_at: calculatedCutoff,
      end_time: calculatedEnd,
      is_retest_slot: isRetestSlot,
    });

    setIsSubmitting(false);
    if (res.success) {
      setIsAddingSlot(false);
      onUpdate();
    } else {
      setErrorMsg(res.error || "Failed to create examination slot.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Manage Examination Timing Slots
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                  {exam.duration_minutes || 90} min course
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                [{exam.course_code}] {exam.title}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="font-semibold">{errorMsg}</div>
            </div>
          )}

          {/* Configured Slots List Header & Actions */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px]">
                  Configured Slots ({slots.length})
                </span>
                <span className="text-[10px] text-slate-400">
                  Candidates take exams in designated slots
                </span>
              </div>

              {!isAddingSlot && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => initializeSlotForm(false, latestSlot ? "after_last" : "in_15m")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Slot</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => initializeSlotForm(true, latestSlot ? "after_last" : "in_15m")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 font-bold transition-all shadow-2xs cursor-pointer"
                    title="Pre-fills a dedicated Re-Exam / Makeup slot"
                  >
                    <Zap className="w-3.5 h-3.5 text-violet-600" />
                    <span>+ Quick Re-Exam Slot</span>
                  </button>
                </div>
              )}
            </div>

            {/* List of Existing Slots */}
            {slots.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50 space-y-2">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">No timing slots configured yet.</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Every examination requires at least one slot for candidate check-in and question unlocking.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => initializeSlotForm(false, "in_15m")}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Slot 1 Now</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {slots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`p-4 rounded-xl border transition-all ${
                      slot.is_retest_slot 
                        ? "bg-violet-50/30 border-violet-200 shadow-2xs" 
                        : "bg-white border-slate-200/90 shadow-2xs"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-slate-900 text-sm">
                          {slot.slot_name}
                        </span>
                        {slot.is_retest_slot ? (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200/80 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-violet-600" />
                            Re-Exam / Makeup Slot
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                            Slot #{slot.slot_number}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium text-[11px]">Status:</span>
                        <select
                          value={slot.status}
                          disabled={isSubmitting}
                          onChange={(e) => handleStatusChange(slot.id, e.target.value as SlotStatus)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-2xs focus:outline-hidden focus:border-indigo-600"
                        >
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="LOGIN_OPEN">Check-in Open</option>
                          <option value="IN_PROGRESS">Exam In Progress</option>
                          <option value="CONCLUDED">Concluded</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>

                        {slots.length > 1 && (
                          <button
                            onClick={() => handleDeleteSlot(slot.id, slot.slot_name)}
                            disabled={isSubmitting}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Slot"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Timings Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 mt-2 border-t border-slate-100 text-slate-600">
                      <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Check-in Opens</span>
                        <span className="font-mono text-slate-800 font-bold text-xs">
                          {formatTime(new Date(slot.login_opens_at))}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-medium">
                          {new Date(slot.login_opens_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>

                      <div className="bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/70">
                        <span className="text-[10px] uppercase font-bold text-indigo-500 block">Exam Starts</span>
                        <span className="font-mono text-indigo-700 font-bold text-xs">
                          {formatTime(new Date(slot.start_time))}
                        </span>
                        <span className="text-[9px] text-indigo-400 block font-medium">
                          {new Date(slot.start_time).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>

                      <div className="bg-amber-50/50 p-2 rounded-lg border border-amber-100/70">
                        <span className="text-[10px] uppercase font-bold text-amber-600 block">Late Join Cutoff</span>
                        <span className="font-mono text-amber-800 font-bold text-xs">
                          {formatTime(new Date(slot.join_window_closes_at))}
                        </span>
                        <span className="text-[9px] text-amber-500 block font-medium">
                          Strict lockout
                        </span>
                      </div>

                      <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Exam Ends</span>
                        <span className="font-mono text-slate-800 font-bold text-xs">
                          {formatTime(new Date(slot.end_time))}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-medium">
                          Session closes
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* IDENTICAL TO EXAM CREATION: SIMPLE, INTUITIVE & EFFORTLESS ADD SLOT FORM */}
          {/* ========================================================================= */}
          {isAddingSlot && (
            <form 
              onSubmit={handleCreateSlot} 
              className="p-5 rounded-2xl border-2 border-indigo-200 bg-white space-y-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200"
            >
              {/* Form Title & Quick Presets */}
              <div className="space-y-2 pb-2 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                      +
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Configure Slot #{nextSlotNumber}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Auto-Calculated
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Quick presets:</span>
                  </div>
                </div>

                {/* 1-Click Quick Presets Toolbar */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <button
                    type="button"
                    onClick={() => initializeSlotForm(isRetestSlot, "in_5m")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      activePreset === "in_5m"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Zap className="w-3 h-3 text-amber-500" />
                    <span>In 5 Mins (Instant Test)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => initializeSlotForm(isRetestSlot, "in_15m")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      activePreset === "in_15m"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>In 15 Mins</span>
                  </button>

                  {latestSlot && (
                    <button
                      type="button"
                      onClick={() => initializeSlotForm(isRetestSlot, "after_last")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        activePreset === "after_last"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                      title={`Starts 30 min after ${latestSlot.slot_name}`}
                    >
                      <RotateCcw className="w-3 h-3 text-violet-500" />
                      <span>+30m After Slot #{latestSlot.slot_number}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => initializeSlotForm(isRetestSlot, "today_pm")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      activePreset === "today_pm"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Sun className="w-3 h-3 text-amber-500" />
                    <span>Today 2:00 PM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => initializeSlotForm(isRetestSlot, "tomorrow_am")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      activePreset === "tomorrow_am"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Sunrise className="w-3 h-3 text-orange-500" />
                    <span>Tomorrow 10:00 AM</span>
                  </button>
                </div>
              </div>

              {/* 1. Slot Name & Start Date & Time (Exact layout as Exam Creation) */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-700 font-bold mb-1">
                      Slot Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Slot 2 - Afternoon Session"
                      value={slotName}
                      onChange={(e) => setSlotName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs font-semibold focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={isRetestSlot}
                        onChange={(e) => handleRetestToggle(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="leading-tight">
                        <span className="font-bold text-slate-800 text-[11px] block">
                          Mark as Re-Exam
                        </span>
                        <span className="text-[10px] text-slate-400">For makeup candidates</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => {
                      setActivePreset(null);
                      setStartTime(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs focus:outline-hidden focus:border-indigo-600 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* 2. Duration Selector (Exact Pill Buttons as Exam Creation) */}
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
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
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
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
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
                      className="w-32 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                    />
                    <span className="text-slate-500 text-xs font-medium">Minutes</span>
                  </div>
                )}
              </div>

              {/* 3. Late Entry Grace Period (Exact Pill Buttons as Exam Creation) */}
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
                      className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
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
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
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
                      className="w-32 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                    />
                    <span className="text-slate-500 text-xs font-medium">Minutes allowed after start</span>
                  </div>
                )}
              </div>

              {/* 4. Automated Schedule Summary Strip (Identical to Exam Creation) */}
              {isValidDate && (
                <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-indigo-950 space-y-1.5">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Automated Slot #{nextSlotNumber} Schedule Timeline</span>
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1">
                    <div className="bg-white/80 p-2 rounded-lg border border-indigo-100/60">
                      <span className="text-slate-400 block text-[10px]">Check-In Opens:</span>
                      <span className="font-bold text-slate-800 text-xs">{formatTime(checkInDate)}</span>
                      <span className="text-[9px] text-slate-400 block">Waiting room</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-indigo-100/60">
                      <span className="text-indigo-600 block text-[10px] font-semibold">Questions Unlock:</span>
                      <span className="font-bold text-indigo-700 text-xs">{formatTime(startDate)}</span>
                      <span className="text-[9px] text-indigo-500 block">{formatDate(startDate)}</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-indigo-100/60">
                      <span className="text-amber-700 block text-[10px] font-semibold">Late Entry Cutoff:</span>
                      <span className="font-bold text-amber-800 text-xs">{formatTime(lateEntryCutoffDate)}</span>
                      <span className="text-[9px] text-amber-600 block">+{joinWindowMinutes}m grace</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-lg border border-indigo-100/60">
                      <span className="text-slate-400 block text-[10px]">Hard End Time:</span>
                      <span className="font-bold text-slate-800 text-xs">{formatTime(endDate)}</span>
                      <span className="text-[9px] text-slate-400 block">Session closes</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingSlot(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-bold transition-colors shadow-2xs cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer text-xs"
                >
                  {isSubmitting ? (
                    <span>Saving Slot...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save New Slot</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>All slots automatically synchronized with Candidate Waiting Room & Database</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
}
