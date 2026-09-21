"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  getAdminOverviewData, 
  getAttendanceOverviewAction, 
  updateCandidateAttendanceAction,
  bulkUpdateAttendanceAction,
  SerializedExam 
} from "@/app/admin/actions";
import { AttendanceStatus } from "@/types";
import { 
  UserCheck, 
  Search, 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  Layers, 
  AlertTriangle,
  UserX,
  CheckCircle2,
  Hourglass,
  Users,
  Check,
  X,
  ChevronDown,
  Eye,
  Play,
  Sparkles,
  Info
} from "lucide-react";

interface AttendanceCandidate {
  sessionId: string;
  studentId: string;
  regNumber: string;
  fullName: string;
  email: string;
  department: string;
  slotName: string;
  slotNumber: number;
  attendanceStatus: AttendanceStatus;
  loginAt: string | null;
  startedAt: string | null;
  violationCount: number;
}

type FilterStatus = "ALL" | AttendanceStatus;

export default function AttendanceMonitorPage() {
  const [exams, setExams] = useState<SerializedExam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [candidates, setCandidates] = useState<AttendanceCandidate[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("ALL");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<AttendanceCandidate | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState<"ADMIT_ALL" | "MARK_ABSENT" | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setActionMessage({ text, type });
    setTimeout(() => {
      setActionMessage(null);
    }, 4000);
  };

  const loadAttendance = useCallback(async (examId: string, slotId?: string, silent = false) => {
    if (!examId) {
      setCandidates([]);
      setCounts({});
      setIsLoading(false);
      return;
    }
    if (!silent) {
      setIsRefreshing(true);
    }
    try {
      const res = await getAttendanceOverviewAction(examId, slotId);
      if (res.success && res.counts) {
        setCounts(res.counts);
        setCandidates(res.candidates as AttendanceCandidate[]);
        setLastRefreshedAt(new Date());
      } else {
        setCandidates([]);
        setCounts({});
      }
    } catch (err) {
      console.error("Failed to load attendance:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load: Fetch overview data to populate exams
  useEffect(() => {
    let isMounted = true;
    async function init() {
      setIsLoading(true);
      try {
        const data = await getAdminOverviewData();
        if (!isMounted) return;
        setExams(data.exams);
        if (data.exams.length > 0) {
          const firstExam = data.exams[0];
          setSelectedExamId(firstExam.id);
          // Set to "" to show all slots consolidated by default
          setSelectedSlotId("");
          await loadAttendance(firstExam.id, undefined, true);
        } else {
          setSelectedExamId("");
          setSelectedSlotId("");
          setCandidates([]);
          setCounts({});
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to initialize attendance data:", err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [loadAttendance]);

  // Load attendance whenever exam or slot changes
  const handleExamChange = async (examId: string) => {
    setSelectedExamId(examId);
    setSelectedSlotId("");
    await loadAttendance(examId, undefined);
  };

  const handleSlotChange = async (slotId: string) => {
    setSelectedSlotId(slotId);
    await loadAttendance(selectedExamId, slotId || undefined);
  };

  // Auto-refresh interval (every 15s when enabled)
  useEffect(() => {
    if (!autoRefresh || !selectedExamId) return;
    const interval = setInterval(() => {
      loadAttendance(selectedExamId, selectedSlotId || undefined, true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedExamId, selectedSlotId, loadAttendance]);

  // Individual Candidate Status Update
  const handleStatusChange = async (sessionId: string, newStatus: AttendanceStatus) => {
    setIsActionLoading(true);
    try {
      const res = await updateCandidateAttendanceAction(sessionId, newStatus);
      if (res.success) {
        showToast(`Attendance updated to ${newStatus.replace("_", " ")}`);
        await loadAttendance(selectedExamId, selectedSlotId || undefined, true);
        if (selectedCandidate && selectedCandidate.sessionId === sessionId) {
          setSelectedCandidate((prev) => (prev ? { ...prev, attendanceStatus: newStatus } : null));
        }
      } else {
        showToast(res.error || "Failed to update attendance status.", "error");
      }
    } catch {
      showToast("Network error updating attendance status.", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Bulk Attendance Actions
  const handleBulkAdmitAll = async () => {
    if (!selectedExamId) return;
    setIsActionLoading(true);
    try {
      const res = await bulkUpdateAttendanceAction(
        selectedExamId,
        selectedSlotId || undefined,
        "LOGGED_IN",
        "IN_EXAM"
      );
      if (res.success) {
        showToast(`Successfully admitted ${res.count ?? 0} scholars into the active exam!`);
        setShowBulkConfirm(null);
        await loadAttendance(selectedExamId, selectedSlotId || undefined, true);
      } else {
        showToast(res.error || "Failed to bulk admit scholars.", "error");
      }
    } catch {
      showToast("Network error executing bulk admit.", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleBulkMarkAbsent = async () => {
    if (!selectedExamId) return;
    setIsActionLoading(true);
    try {
      const res = await bulkUpdateAttendanceAction(
        selectedExamId,
        selectedSlotId || undefined,
        "NOT_REPORTED",
        "ABSENT"
      );
      if (res.success) {
        showToast(`Marked ${res.count ?? 0} unreported scholars as Absent.`);
        setShowBulkConfirm(null);
        await loadAttendance(selectedExamId, selectedSlotId || undefined, true);
      } else {
        showToast(res.error || "Failed to mark scholars as absent.", "error");
      }
    } catch {
      showToast("Network error executing bulk mark absent.", "error");
    } finally {
      setIsActionLoading(false);
    }
  };

  const activeExam = exams.find((e) => e.id === selectedExamId);

  // Filter candidates based on status and search
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = 
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.regNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === "ALL") return true;
    if (activeFilter === "ABSENT") {
      return c.attendanceStatus === "ABSENT" || c.attendanceStatus === "NOT_REPORTED";
    }
    return c.attendanceStatus === activeFilter;
  });

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "SUBMITTED":
        return {
          label: "Submitted",
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          dot: "bg-emerald-500",
          icon: CheckCircle2,
        };
      case "IN_EXAM":
        return {
          label: "In Exam",
          badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
          dot: "bg-indigo-500 animate-pulse",
          icon: UserCheck,
        };
      case "LOGGED_IN":
        return {
          label: "Waiting Room",
          badge: "bg-sky-50 text-sky-700 border-sky-200",
          dot: "bg-sky-500",
          icon: Hourglass,
        };
      case "ABSENT":
        return {
          label: "Absent",
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          dot: "bg-rose-500",
          icon: UserX,
        };
      case "NOT_REPORTED":
        return {
          label: "Not Reported",
          badge: "bg-slate-100 text-slate-700 border-slate-200",
          dot: "bg-slate-400",
          icon: Clock,
        };
      case "TECHNICAL_FAILURE":
        return {
          label: "Tech Dropout",
          badge: "bg-amber-50 text-amber-800 border-amber-200",
          dot: "bg-amber-500 animate-ping",
          icon: AlertTriangle,
        };
      case "DISQUALIFIED":
        return {
          label: "Disqualified",
          badge: "bg-red-100 text-red-800 border-red-300",
          dot: "bg-red-600",
          icon: ShieldAlert,
        };
      default:
        return {
          label: status,
          badge: "bg-slate-50 text-slate-700 border-slate-200",
          dot: "bg-slate-400",
          icon: Clock,
        };
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {actionMessage && (
        <div 
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold transition-all duration-200 ${
            actionMessage.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-rose-50 text-rose-900 border-rose-200"
          }`}
        >
          {actionMessage.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
          <button 
            onClick={() => setActionMessage(null)} 
            className="ml-2 p-0.5 hover:bg-black/5 rounded text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Attendance & Live Hall Monitor</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Biometrics
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time biometric and session verification: monitor waiting room queues, verify active test-takers, and supervise hall attendance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
              autoRefresh 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
            title="Toggle live 15-second auto refresh"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            <span>Auto Sync (15s): {autoRefresh ? "ON" : "OFF"}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => loadAttendance(selectedExamId, selectedSlotId || undefined)}
            disabled={isRefreshing || !selectedExamId}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh Attendance Records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : "text-slate-600"}`} />
            <span>Refresh</span>
          </button>

          {/* Quick link to Exams */}
          <Link
            href="/admin/exams"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 font-semibold text-xs transition-colors"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Exams Manager</span>
          </Link>
        </div>
      </div>

      {/* When NO Exams Exist in Database */}
      {!isLoading && exams.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-2xs max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600">
            <Layers className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No Examinations Configured Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Before monitoring live hall check-ins and scholar biometric attendance, you must schedule at least one doctoral examination and configure slots.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/admin/exams"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create Examination First</span>
            </Link>
            <Link
              href="/admin/candidates"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Register Scholars</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Selectors Bar & Search */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Exam Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exam:</span>
                <div className="relative">
                  <select
                    value={selectedExamId}
                    onChange={(e) => handleExamChange(e.target.value)}
                    disabled={isLoading || exams.length === 0}
                    className="pl-3 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white appearance-none cursor-pointer transition-colors shadow-2xs"
                  >
                    {exams.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.course_code}: {e.title} ({e.is_published ? "Published" : "Draft"})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Slot Window Selector */}
              {activeExam && activeExam.slots && activeExam.slots.length > 0 && (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Slot:</span>
                  <div className="relative">
                    <select
                      value={selectedSlotId}
                      onChange={(e) => handleSlotChange(e.target.value)}
                      className="pl-3 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white appearance-none cursor-pointer transition-colors shadow-2xs"
                    >
                      <option value="">All Slots (Consolidated)</option>
                      {activeExam.slots.map((s) => (
                        <option key={s.id} value={s.id}>
                          Slot {s.slot_number}: {s.slot_name} {s.is_retest_slot ? "(Re-Exam Slot)" : "(Primary)"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {lastRefreshedAt && (
                <span className="text-[11px] text-slate-400 font-medium pl-1 hidden sm:inline-block">
                  Synced {lastRefreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              )}
            </div>

            {/* Scholar Search Input */}
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search scholar, reg #, or dept..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Real-Time 6-Card KPI Status Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Total Enrolled */}
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`p-4 rounded-2xl bg-white border text-left transition-all hover:shadow-sm ${
                activeFilter === "ALL"
                  ? "border-slate-800 ring-2 ring-slate-800/10 shadow-xs"
                  : "border-slate-200 shadow-2xs hover:border-slate-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Enrolled</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block tracking-tight">
                {counts.total ?? 0}
              </span>
              <span className="text-[11px] font-medium text-slate-500 mt-0.5 block">Configured scholars</span>
            </button>

            {/* Waiting Room */}
            <button
              onClick={() => setActiveFilter("LOGGED_IN")}
              className={`p-4 rounded-2xl bg-white border text-left transition-all hover:shadow-sm ${
                activeFilter === "LOGGED_IN"
                  ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/30 shadow-xs"
                  : "border-sky-200/90 shadow-2xs bg-sky-50/20 hover:border-sky-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 text-sky-600" /> Waiting Room
              </span>
              <span className="text-2xl font-black text-sky-700 mt-1 block tracking-tight">
                {counts.logged_in ?? 0}
              </span>
              <span className="text-[11px] font-medium text-sky-600 mt-0.5 block">Biometrics verified</span>
            </button>

            {/* In Exam */}
            <button
              onClick={() => setActiveFilter("IN_EXAM")}
              className={`p-4 rounded-2xl bg-white border text-left transition-all hover:shadow-sm ${
                activeFilter === "IN_EXAM"
                  ? "border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/30 shadow-xs"
                  : "border-indigo-200/90 shadow-2xs bg-indigo-50/20 hover:border-indigo-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> In Exam
              </span>
              <span className="text-2xl font-black text-indigo-700 mt-1 block tracking-tight">
                {counts.in_exam ?? 0}
              </span>
              <span className="text-[11px] font-medium text-indigo-600 mt-0.5 block">Actively writing</span>
            </button>

            {/* Submitted */}
            <button
              onClick={() => setActiveFilter("SUBMITTED")}
              className={`p-4 rounded-2xl bg-white border text-left transition-all hover:shadow-sm ${
                activeFilter === "SUBMITTED"
                  ? "border-emerald-600 ring-2 ring-emerald-600/20 bg-emerald-50/30 shadow-xs"
                  : "border-emerald-200/90 shadow-2xs bg-emerald-50/20 hover:border-emerald-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Submitted
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block tracking-tight">
                {counts.submitted ?? 0}
              </span>
              <span className="text-[11px] font-medium text-emerald-600 mt-0.5 block">Scripts sealed</span>
            </button>

            {/* Absent / Unattended */}
            <button
              onClick={() => setActiveFilter("ABSENT")}
              className={`p-4 rounded-2xl bg-white border text-left transition-all hover:shadow-sm ${
                activeFilter === "ABSENT"
                  ? "border-rose-600 ring-2 ring-rose-600/20 bg-rose-50/30 shadow-xs"
                  : "border-rose-200/90 shadow-2xs bg-rose-50/20 hover:border-rose-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-rose-600" /> Absent / No Show
              </span>
              <span className="text-2xl font-black text-rose-700 mt-1 block tracking-tight">
                {(counts.absent ?? 0) + (counts.not_reported ?? 0)}
              </span>
              <span className="text-[11px] font-medium text-rose-600 mt-0.5 block">
                {counts.absent ?? 0} absent &bull; {counts.not_reported ?? 0} pending
              </span>
            </button>

            {/* Tech Dropout / Failure */}
            <button
              onClick={() => setActiveFilter("TECHNICAL_FAILURE")}
              className={`p-4 rounded-2xl bg-white border text-left transition-all hover:shadow-sm ${
                activeFilter === "TECHNICAL_FAILURE"
                  ? "border-amber-600 ring-2 ring-amber-600/20 bg-amber-50/30 shadow-xs"
                  : "border-amber-200/90 shadow-2xs bg-amber-50/20 hover:border-amber-300"
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Tech Dropout
              </span>
              <span className="text-2xl font-black text-amber-700 mt-1 block tracking-tight">
                {counts.technical_failure ?? 0}
              </span>
              <span className="text-[11px] font-medium text-amber-600 mt-0.5 block">Eligible for Slot 2</span>
            </button>
          </div>

          {/* Status Filter Tabs & Bulk Actions Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                onClick={() => setActiveFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === "ALL"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                All ({candidates.length})
              </button>
              <button
                onClick={() => setActiveFilter("LOGGED_IN")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === "LOGGED_IN"
                    ? "bg-sky-600 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Waiting Room ({counts.logged_in ?? 0})
              </button>
              <button
                onClick={() => setActiveFilter("IN_EXAM")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === "IN_EXAM"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                In Exam ({counts.in_exam ?? 0})
              </button>
              <button
                onClick={() => setActiveFilter("SUBMITTED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === "SUBMITTED"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Submitted ({counts.submitted ?? 0})
              </button>
              <button
                onClick={() => setActiveFilter("ABSENT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === "ABSENT"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Absent / Pending ({(counts.absent ?? 0) + (counts.not_reported ?? 0)})
              </button>
              <button
                onClick={() => setActiveFilter("TECHNICAL_FAILURE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  activeFilter === "TECHNICAL_FAILURE"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Tech Dropout ({counts.technical_failure ?? 0})
              </button>
            </div>

            {/* Bulk Hall Actions */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              {/* Admit All Waiting Room Scholars */}
              <button
                onClick={() => setShowBulkConfirm("ADMIT_ALL")}
                disabled={isActionLoading || (counts.logged_in ?? 0) === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Move all Waiting Room scholars into In Exam status"
              >
                <Play className="w-3 h-3 text-sky-600" />
                <span>Admit All Waiting ({counts.logged_in ?? 0})</span>
              </button>

              {/* Mark All Unreported as Absent */}
              <button
                onClick={() => setShowBulkConfirm("MARK_ABSENT")}
                disabled={isActionLoading || (counts.not_reported ?? 0) === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title="Mark all unreported scholars as Absent"
              >
                <UserX className="w-3 h-3 text-rose-600" />
                <span>Mark No-Shows Absent ({counts.not_reported ?? 0})</span>
              </button>
            </div>
          </div>

          {/* Bulk Action Confirmation Modal */}
          {showBulkConfirm && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${showBulkConfirm === "ADMIT_ALL" ? "bg-sky-100 text-sky-700" : "bg-rose-100 text-rose-700"}`}>
                    {showBulkConfirm === "ADMIT_ALL" ? <Play className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {showBulkConfirm === "ADMIT_ALL" ? "Admit All Waiting Room Scholars?" : "Mark Unreported as Absent?"}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {showBulkConfirm === "ADMIT_ALL" 
                        ? `This will admit ${counts.logged_in ?? 0} scholars from the biometric waiting room directly into the active examination hall.`
                        : `This will mark ${counts.not_reported ?? 0} candidates who have not checked in as officially Absent.`}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>
                    {showBulkConfirm === "ADMIT_ALL" 
                      ? "Exam start timestamps will be initialized and the candidate viewports will transition to Question Palette immediately."
                      : "Unattended scholars will be recorded in official attendance sheets. You can still manually admit them later if needed."}
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowBulkConfirm(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={showBulkConfirm === "ADMIT_ALL" ? handleBulkAdmitAll : handleBulkMarkAbsent}
                    disabled={isActionLoading}
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors shadow-2xs ${
                      showBulkConfirm === "ADMIT_ALL"
                        ? "bg-sky-600 hover:bg-sky-700"
                        : "bg-rose-600 hover:bg-rose-700"
                    }`}
                  >
                    {isActionLoading ? "Executing..." : "Confirm & Apply"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Records Table */}
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-16 text-center space-y-3">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600">Loading live hall records from Supabase...</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="p-14 text-center space-y-3 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No Scholars Enrolled in this Examination</h4>
                <p className="text-xs text-slate-500">
                  There are no candidates assigned to this exam or slot window yet. Go to Candidate Registry or Examinations Manager to register scholars.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <Link
                    href="/admin/candidates"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-colors"
                  >
                    <Users className="w-3 h-3" />
                    <span>Manage Candidates</span>
                  </Link>
                </div>
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="text-xs font-bold text-slate-700">No scholars match your current filter or search query.</p>
                <p className="text-xs text-slate-400">Try clearing the search text or switching the status filter tab.</p>
                <button
                  onClick={() => {
                    setSearch("");
                    setActiveFilter("ALL");
                  }}
                  className="mt-2 text-xs font-semibold text-indigo-600 hover:underline inline-block"
                >
                  Clear Filters & Search
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Research Scholar</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Slot Window</th>
                      <th className="py-3.5 px-4">Attendance Status</th>
                      <th className="py-3.5 px-4">Login & Biometrics</th>
                      <th className="py-3.5 px-4">Violations</th>
                      <th className="py-3.5 px-4 text-right">Examiner Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredCandidates.map((c) => {
                      const statusInfo = getStatusBadge(c.attendanceStatus);
                      const StatusIcon = statusInfo.icon;
                      const initials = c.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <tr key={c.sessionId} className="hover:bg-slate-50/80 transition-colors">
                          {/* Scholar Info */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                                {initials}
                              </div>
                              <div>
                                <button
                                  onClick={() => setSelectedCandidate(c)}
                                  className="font-bold text-slate-900 hover:text-indigo-600 transition-colors block text-left"
                                >
                                  {c.fullName}
                                </button>
                                <span className="font-mono text-[11px] text-slate-400 block">{c.regNumber}</span>
                              </div>
                            </div>
                          </td>

                          {/* Department */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono font-bold text-slate-700 text-[11px]">
                              {c.department}
                            </span>
                          </td>

                          {/* Slot */}
                          <td className="py-3 px-4 font-medium text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-800">Slot {c.slotNumber}</span>
                              <span className="text-slate-400 text-[11px]">({c.slotName})</span>
                            </div>
                          </td>

                          {/* Status Badge */}
                          <td className="py-3 px-4">
                            <span
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1.5 ${statusInfo.badge}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                              <StatusIcon className="w-3 h-3" />
                              <span>{statusInfo.label}</span>
                            </span>
                          </td>

                          {/* Login / Biometric Window */}
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                            {c.loginAt ? (
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-700 block">
                                  {new Date(c.loginAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                </span>
                                {c.startedAt && (
                                  <span className="text-[10px] text-indigo-600 block">
                                    Started: {new Date(c.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Not connected</span>
                            )}
                          </td>

                          {/* Violations */}
                          <td className="py-3 px-4">
                            {c.violationCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold font-mono text-[11px]">
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                {c.violationCount} {c.violationCount === 1 ? "flag" : "flags"}
                              </span>
                            ) : (
                              <span className="font-mono text-slate-400 text-[11px]">0</span>
                            )}
                          </td>

                          {/* Examiner Quick Actions */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <select
                                value={c.attendanceStatus}
                                onChange={(e) => handleStatusChange(c.sessionId, e.target.value as AttendanceStatus)}
                                disabled={isActionLoading}
                                className="text-[11px] font-bold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-600 text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs"
                              >
                                <option value="NOT_REPORTED">Not Reported</option>
                                <option value="LOGGED_IN">Waiting Room</option>
                                <option value="IN_EXAM">In Exam</option>
                                <option value="SUBMITTED">Submitted</option>
                                <option value="ABSENT">Absent (No Show)</option>
                                <option value="TECHNICAL_FAILURE">Tech Dropout</option>
                                <option value="DISQUALIFIED">Disqualified</option>
                              </select>

                              <button
                                onClick={() => setSelectedCandidate(c)}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                                title="Inspect Scholar Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Scholar Detail & Live Intervention Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center">
                  {selectedCandidate.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedCandidate.fullName}</h3>
                  <p className="text-xs font-mono text-slate-500">{selectedCandidate.regNumber} &bull; {selectedCandidate.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Status Banner */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Status</span>
                  <div className="mt-1">
                    {(() => {
                      const badge = getStatusBadge(selectedCandidate.attendanceStatus);
                      const Icon = badge.icon;
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border font-bold text-[11px] ${badge.badge}`}>
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Department</span>
                  <span className="font-bold text-slate-800 text-xs mt-1 block">{selectedCandidate.department}</span>
                </div>
              </div>

              {/* Timing Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Check-In Time</span>
                  <span className="font-mono text-xs font-bold text-slate-800 mt-1 block">
                    {selectedCandidate.loginAt 
                      ? new Date(selectedCandidate.loginAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                      : "Not Checked In"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Exam Started</span>
                  <span className="font-mono text-xs font-bold text-slate-800 mt-1 block">
                    {selectedCandidate.startedAt 
                      ? new Date(selectedCandidate.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
                      : "Pending Start"}
                  </span>
                </div>
              </div>

              {/* Violations & Proctoring Flags */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Proctoring Flags</span>
                  {selectedCandidate.violationCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px] flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      {selectedCandidate.violationCount} Flags Recorded
                    </span>
                  ) : (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Clean Record
                    </span>
                  )}
                </div>
                {selectedCandidate.violationCount > 0 && (
                  <p className="text-[11px] text-rose-600 mt-2">
                    Multiple camera tab switches or biometric mismatch alerts have been flagged. Examiner review advised before certifying results.
                  </p>
                )}
              </div>

              {/* Quick Examiner Intervention Actions */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Live Intervention Actions</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleStatusChange(selectedCandidate.sessionId, "IN_EXAM")}
                    disabled={isActionLoading || selectedCandidate.attendanceStatus === "IN_EXAM"}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold hover:bg-indigo-100 transition-colors disabled:opacity-40"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Admit into Exam</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange(selectedCandidate.sessionId, "TECHNICAL_FAILURE")}
                    disabled={isActionLoading || selectedCandidate.attendanceStatus === "TECHNICAL_FAILURE"}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold hover:bg-amber-100 transition-colors disabled:opacity-40"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Mark Tech Dropout</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange(selectedCandidate.sessionId, "ABSENT")}
                    disabled={isActionLoading || selectedCandidate.attendanceStatus === "ABSENT"}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold hover:bg-rose-100 transition-colors disabled:opacity-40"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Mark as Absent</span>
                  </button>

                  <button
                    onClick={() => handleStatusChange(selectedCandidate.sessionId, "SUBMITTED")}
                    disabled={isActionLoading || selectedCandidate.attendanceStatus === "SUBMITTED"}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors disabled:opacity-40"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Force Submit Script</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
