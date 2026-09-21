"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { 
  getAdminOverviewData, 
  issueWarningAction, 
  terminateSessionAction, 
  broadcastProctorAnnouncementAction,
  SerializedCandidate, 
  SerializedExam 
} from "@/app/admin/actions";
import { 
  CandidateIncidentModal,
  LiveProctorCandidateCard,
  CandidateSpotlightModal,
  ActiveStreamContext,
} from "@/features/examiner-dashboard";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Camera, 
  RefreshCw, 
  Search, 
  AlertTriangle, 
  Radio, 
  Users, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  LayoutGrid, 
  List, 
  ChevronDown, 
  X, 
  Eye, 
  Ban, 
  BellRing, 
  Activity, 
  Send 
} from "lucide-react";

type RiskFilter = "ALL" | "CRITICAL" | "WATCHLIST" | "CLEAN";
type ViewMode = "GRID" | "TABLE";

export default function LiveProctorPage() {
  const [candidates, setCandidates] = useState<SerializedCandidate[]>([]);
  const [exams, setExams] = useState<SerializedExam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("ALL");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("ALL");
  const [filterRisk, setFilterRisk] = useState<RiskFilter>("ALL");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("GRID");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modals & Action States
  const [spotlightCandidate, setSpotlightCandidate] = useState<SerializedCandidate | null>(null);
  const [spotlightStreamContext, setSpotlightStreamContext] = useState<ActiveStreamContext | null>(null);
  const [activeIncidentCandidate, setActiveIncidentCandidate] = useState<{ sessionId: string; candidateName: string } | null>(null);
  const [disqualifyCandidate, setDisqualifyCandidate] = useState<SerializedCandidate | null>(null);
  const [isDisqualifying, setIsDisqualifying] = useState(false);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [actionToast, setActionToast] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setActionToast({ text, type });
    setTimeout(() => {
      setActionToast(null);
    }, 4000);
  };

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const data = await getAdminOverviewData();
      setCandidates(data.candidates);
      setExams(data.exams);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error("Failed to load proctoring data:", err);
      if (!silent) showToast("Failed to sync live proctoring data from server.", "error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const data = await getAdminOverviewData();
        if (isMounted) {
          setCandidates(data.candidates);
          setExams(data.exams);
          setLastRefreshedAt(new Date());
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load initial proctoring data:", err);
        if (isMounted) setIsLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // 15-second Auto-refresh polling loop
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  // Handle Manual Warning
  const handleIssueWarning = async (cand: SerializedCandidate) => {
    try {
      const res = await issueWarningAction(cand.id);
      if (res.success) {
        showToast(`Official warning dispatched to scholar: ${cand.name}`);
        await loadData(true);
      } else {
        showToast("Failed to dispatch warning.", "error");
      }
    } catch {
      showToast("Network error while issuing warning.", "error");
    }
  };

  // Handle Disqualification
  const handleConfirmDisqualify = async () => {
    if (!disqualifyCandidate) return;
    setIsDisqualifying(true);
    try {
      const res = await terminateSessionAction(disqualifyCandidate.id);
      if (res.success) {
        showToast(`Terminated and locked exam session for ${disqualifyCandidate.name}`, "error");
        setDisqualifyCandidate(null);
        await loadData(true);
      } else {
        showToast("Failed to disqualify candidate.", "error");
      }
    } catch {
      showToast("Network error while executing disqualification.", "error");
    } finally {
      setIsDisqualifying(false);
    }
  };

  // Handle Broadcast Announcement
  const handleBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    setIsBroadcasting(true);
    try {
      // If a specific exam is selected, broadcast to that exam; otherwise broadcast to the first active exam or all
      const targetExamId = selectedExamId !== "ALL" ? selectedExamId : exams[0]?.id;
      if (!targetExamId) {
        showToast("No active examination found to broadcast announcement.", "error");
        return;
      }
      const res = await broadcastProctorAnnouncementAction(targetExamId, broadcastMessage.trim());
      if (res.success) {
        showToast(`Official notice broadcast to ${res.count} active scholars in exam hall!`);
        setBroadcastMessage("");
        setBroadcastModalOpen(false);
      } else {
        showToast("Failed to broadcast message.", "error");
      }
    } catch {
      showToast("Network error while broadcasting announcement.", "error");
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Available Slots for the selected exam
  const activeExam = useMemo(() => {
    return exams.find((e) => e.id === selectedExamId);
  }, [exams, selectedExamId]);

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Exam Filter
      if (selectedExamId !== "ALL" && c.exam_id !== selectedExamId) {
        return false;
      }

      // Slot Filter
      if (selectedSlotId !== "ALL" && c.slot_id !== selectedSlotId) {
        return false;
      }

      // Risk Filter
      if (filterRisk === "CRITICAL" && !(c.integrity_score < 75 || c.violation_count >= 2)) {
        return false;
      }
      if (filterRisk === "WATCHLIST" && !(c.integrity_score >= 75 && c.integrity_score < 90)) {
        return false;
      }
      if (filterRisk === "CLEAN" && !(c.integrity_score >= 90 && c.violation_count === 0)) {
        return false;
      }

      // Search Filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches = 
          c.name.toLowerCase().includes(q) ||
          c.reg_number.toLowerCase().includes(q) ||
          c.department_name.toLowerCase().includes(q) ||
          c.department_code.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [candidates, selectedExamId, selectedSlotId, filterRisk, search]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = candidates.length;
    const critical = candidates.filter((c) => c.integrity_score < 75 || c.violation_count >= 2).length;
    const watchlist = candidates.filter((c) => c.integrity_score >= 75 && c.integrity_score < 90).length;
    const clean = candidates.filter((c) => c.integrity_score >= 90 && c.violation_count === 0).length;
    const inExam = candidates.filter((c) => c.status === "IN_PROGRESS" || c.attendance_status === "IN_EXAM").length;

    return { total, critical, watchlist, clean, inExam };
  }, [candidates]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {actionToast && (
        <div 
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200 border ${
            actionToast.type === "error"
              ? "bg-rose-900 text-white border-rose-700 shadow-rose-950/40"
              : actionToast.type === "info"
              ? "bg-slate-900 text-white border-slate-700 shadow-slate-950/40"
              : "bg-emerald-900 text-white border-emerald-700 shadow-emerald-950/40"
          }`}
        >
          {actionToast.type === "error" ? (
            <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
          ) : actionToast.type === "info" ? (
            <MessageSquare className="w-4 h-4 text-indigo-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
          )}
          <span>{actionToast.text}</span>
          <button 
            onClick={() => setActionToast(null)} 
            className="ml-2 p-1 rounded hover:bg-white/20 text-white/70 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER BAR (Pure SaaS Academic Aesthetic) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Live AI Proctoring Command Center</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Edge-AI Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-candidate invigilation: monitor MediaPipe gaze, acoustic VAD events, fullscreen integrity, and live biometric feeds.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Auto-Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              autoRefresh 
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-2xs" 
                : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
            title="Toggle live 15-second auto refresh"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
            <span>Auto Sync (15s): {autoRefresh ? "ON" : "OFF"}</span>
          </button>

          {/* Last Refreshed Time */}
          {lastRefreshedAt && (
            <span className="text-[10px] text-slate-400 font-mono hidden xl:inline">
              Updated: {lastRefreshedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => loadData(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
            title="Refresh live data now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-indigo-600" : "text-slate-600"}`} />
            <span>Refresh</span>
          </button>

          {/* Broadcast Announcement */}
          <button
            onClick={() => setBroadcastModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-700 font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
            title="Broadcast notice to all candidates in the exam hall"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Broadcast Notice</span>
          </button>

          {/* Link to Attendance Monitor */}
          <Link
            href="/admin/attendance"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Attendance Hall</span>
          </Link>
        </div>
      </div>

      {/* 2. STAT SUMMARY KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Monitored */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Active Monitored
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900">{stats.total}</span>
              <span className="text-xs text-indigo-600 font-bold">Scholars</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">In Supabase registry</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Clean High Integrity */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Clean Conduct
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-700">{stats.clean}</span>
              <span className="text-xs text-emerald-600 font-bold">≥90% Score</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">0 Recorded Infractions</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Watchlist / Flagged */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Watchlist / Review
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-700">{stats.watchlist}</span>
              <span className="text-xs text-amber-600 font-bold">75-89%</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Minor warnings / Head turns</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Critical Attention */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Critical Attention
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-rose-700">{stats.critical}</span>
              <span className="text-xs text-rose-600 font-bold">&lt;75% Risk</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Multiple warnings detected</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. SELECTOR, SEARCH & FILTER TOOLBAR */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Exam Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Exam:</span>
            <div className="relative">
              <select
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  setSelectedSlotId("ALL");
                }}
                className="pl-3 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white appearance-none cursor-pointer transition-colors shadow-2xs"
              >
                <option value="ALL">All Examinations ({exams.length})</option>
                {exams.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.course_code}: {e.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Slot Selector */}
          {activeExam && activeExam.slots && activeExam.slots.length > 0 && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Slot:</span>
              <div className="relative">
                <select
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  className="pl-3 pr-8 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600 focus:bg-white appearance-none cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="ALL">All Slots ({activeExam.slots.length})</option>
                  {activeExam.slots.map((s) => (
                    <option key={s.id} value={s.id}>
                      Slot {s.slot_number}: {s.slot_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-3 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search scholar, reg no, dept..."
              className="w-full pl-8 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Risk Filter Pills & View Mode */}
        <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
          {/* Risk Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            {(
              [
                { id: "ALL", label: "All" },
                { id: "CRITICAL", label: "Critical" },
                { id: "WATCHLIST", label: "Watchlist" },
                { id: "CLEAN", label: "Clean" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterRisk(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterRisk === tab.id
                    ? "bg-white text-indigo-700 shadow-2xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "GRID"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Camera Feed Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "TABLE"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Detailed Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. MAIN CONTENT AREA */}
      {isLoading ? (
        <div className="p-16 text-center border border-dashed border-slate-200 rounded-3xl bg-white space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-indigo-600 animate-spin" />
          <p className="text-xs font-bold text-slate-800">Synchronizing Live Telemetry</p>
          <p className="text-[11px] text-slate-400">Loading candidate proctoring data and audit events from Supabase...</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-slate-200 rounded-3xl bg-white space-y-3 max-w-xl mx-auto">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Camera className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">No Candidate Feeds Match Filters</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {search || filterRisk !== "ALL" || selectedExamId !== "ALL"
                ? "Try adjusting your search query, exam selector, or risk level filters to locate candidate sessions."
                : "Live camera feeds and AI telemetry will automatically populate here once candidates commence their examination."}
            </p>
          </div>
          {(search || filterRisk !== "ALL" || selectedExamId !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setFilterRisk("ALL");
                setSelectedExamId("ALL");
                setSelectedSlotId("ALL");
              }}
              className="mt-2 px-3.5 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition-colors cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      ) : viewMode === "GRID" ? (
        /* ========================================================================= */
        /* GRID VIEW: High-Tech Biometric Live Feeds                                 */
        /* ========================================================================= */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((cand) => (
            <LiveProctorCandidateCard
              key={cand.id}
              candidate={cand}
              onIssueWarning={handleIssueWarning}
              onDisqualify={(candidate) => setDisqualifyCandidate(candidate)}
              onOpenAuditLogs={(candidate) =>
                setActiveIncidentCandidate({ sessionId: candidate.id, candidateName: candidate.name })
              }
              onSpotlight={(candidate, streamCtx) => {
                setSpotlightCandidate(candidate);
                setSpotlightStreamContext(streamCtx || null);
              }}
            />
          ))}
        </div>
      ) : (
        /* ========================================================================= */
        /* TABLE VIEW: High-Density Telemetry Matrix                                 */
        /* ========================================================================= */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Scholar Details</th>
                  <th className="py-3 px-4">Department & Exam</th>
                  <th className="py-3 px-4">Exam Status</th>
                  <th className="py-3 px-4">Integrity Score</th>
                  <th className="py-3 px-4">Infractions</th>
                  <th className="py-3 px-4">Latest Incident</th>
                  <th className="py-3 px-4 text-right">Invigilator Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCandidates.map((cand) => {
                  const isCritical = cand.integrity_score < 75 || cand.violation_count >= 2;
                  const isWatchlist = cand.integrity_score >= 75 && cand.integrity_score < 90;

                  return (
                    <tr key={cand.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Scholar Details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{cand.name}</div>
                        <div className="font-mono text-[10px] text-slate-500">{cand.reg_number}</div>
                        <div className="text-[10px] text-slate-400">{cand.email}</div>
                      </td>

                      {/* Department & Exam */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{cand.department_name}</div>
                        <div className="text-[10px] text-slate-500">{cand.exam_title}</div>
                        <span className="text-[9px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 inline-block mt-0.5">
                          {cand.slot_name}
                        </span>
                      </td>

                      {/* Exam Status */}
                      <td className="py-3 px-4">
                        <span 
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            cand.status === "IN_PROGRESS" || cand.attendance_status === "IN_EXAM"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : cand.status === "DISQUALIFIED"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {cand.status === "IN_PROGRESS" ? "IN EXAM" : cand.status}
                        </span>
                      </td>

                      {/* Integrity Score */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-bold text-xs ${
                              isCritical ? "text-rose-700" : isWatchlist ? "text-amber-700" : "text-emerald-700"
                            }`}
                          >
                            {cand.integrity_score}%
                          </span>
                          <div className="w-16 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                isCritical ? "bg-rose-500" : isWatchlist ? "bg-amber-400" : "bg-emerald-500"
                              }`}
                              style={{ width: `${cand.integrity_score}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Infractions */}
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] border ${
                            cand.violation_count > 0
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-slate-50 text-slate-600 border-slate-200"
                          }`}
                        >
                          {cand.violation_count} Alert{cand.violation_count === 1 ? "" : "s"}
                        </span>
                      </td>

                      {/* Latest Incident */}
                      <td className="py-3 px-4 max-w-xs">
                        <span className="text-[11px] text-slate-700 line-clamp-1" title={cand.recent_incident}>
                          {cand.recent_incident || "Normal conduct"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSpotlightCandidate(cand)}
                            className="p-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors cursor-pointer"
                            title="Spotlight Live Video Feed"
                          >
                            <Camera className="w-3.5 h-3.5 text-indigo-600" />
                          </button>
                          <button
                            onClick={() => setActiveIncidentCandidate({ sessionId: cand.id, candidateName: cand.name })}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
                            title="View Incident Audit Trail"
                          >
                            <Eye className="w-3.5 h-3.5 text-indigo-600" />
                          </button>
                          <button
                            onClick={() => handleIssueWarning(cand)}
                            className="p-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 transition-colors cursor-pointer"
                            title="Issue Official Warning"
                          >
                            <BellRing className="w-3.5 h-3.5 text-amber-600" />
                          </button>
                          <button
                            onClick={() => setDisqualifyCandidate(cand)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition-colors cursor-pointer"
                            title="Disqualify Candidate"
                          >
                            <Ban className="w-3.5 h-3.5 text-rose-600" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CANDIDATE SPOTLIGHT LIVE WEBRTC MODAL */}
      {spotlightCandidate && (
        <CandidateSpotlightModal
          candidate={spotlightCandidate}
          streamContext={spotlightStreamContext}
          isOpen={!!spotlightCandidate}
          onClose={() => {
            setSpotlightCandidate(null);
            setSpotlightStreamContext(null);
          }}
          onIssueWarning={handleIssueWarning}
          onDisqualify={(cand) => {
            setSpotlightCandidate(null);
            setSpotlightStreamContext(null);
            setDisqualifyCandidate(cand);
          }}
        />
      )}

      {/* 5. CANDIDATE INCIDENT LOG MODAL */}
      {activeIncidentCandidate && (
        <CandidateIncidentModal
          isOpen={Boolean(activeIncidentCandidate)}
          sessionId={activeIncidentCandidate.sessionId}
          candidateName={activeIncidentCandidate.candidateName}
          onClose={() => setActiveIncidentCandidate(null)}
        />
      )}

      {/* 6. BROADCAST NOTICE MODAL */}
      {broadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Broadcast Hall Announcement</h3>
                  <p className="text-xs text-slate-500">Send an instant invigilator banner to candidate screens</p>
                </div>
              </div>
              <button
                onClick={() => setBroadcastModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Announcement Message</label>
              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="e.g. Please ensure your webcams remain centered. 30 minutes remaining in examination session."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all"
              />
              <p className="text-[10px] text-slate-400">
                This notice will display prominently across active exam taker viewports in real-time.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBroadcastModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBroadcast}
                disabled={isBroadcasting || !broadcastMessage.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isBroadcasting ? "Broadcasting..." : "Send Announcement"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. DISQUALIFY CONFIRMATION MODAL */}
      {disqualifyCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-rose-200 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Disqualify Examination Session?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to terminate the examination session for:
              </p>
              <p className="text-sm font-bold text-rose-700 pt-1">
                {disqualifyCandidate.name} ({disqualifyCandidate.reg_number})
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-800 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                Immediate Disciplinary Action
              </p>
              <p className="leading-relaxed">
                The scholar&apos;s active screen will lock immediately. Their current answers will be submitted for committee evaluation and marked as disqualified.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDisqualifyCandidate(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDisqualify}
                disabled={isDisqualifying}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>{isDisqualifying ? "Disqualifying..." : "Confirm Disqualification"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
