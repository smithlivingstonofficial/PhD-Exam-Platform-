"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getAdminOverviewData, 
  getAttendanceOverviewAction, 
  updateCandidateAttendanceAction,
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
  Hourglass
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

export default function AttendanceMonitorPage() {
  const [exams, setExams] = useState<SerializedExam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [candidates, setCandidates] = useState<AttendanceCandidate[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadAttendance = useCallback(async (examId: string, slotId?: string) => {
    if (!examId) return;
    setIsLoading(true);
    const res = await getAttendanceOverviewAction(examId, slotId);
    if (res.success && res.counts) {
      setCounts(res.counts);
      setCandidates(res.candidates as AttendanceCandidate[]);
    }
    setIsLoading(false);
  }, []);

  // Load initial exams
  useEffect(() => {
    let isMounted = true;
    async function init() {
      const data = await getAdminOverviewData();
      if (!isMounted) return;
      setExams(data.exams);
      if (data.exams.length > 0) {
        setSelectedExamId(data.exams[0].id);
        if (data.exams[0].slots.length > 0) {
          setSelectedSlotId(data.exams[0].slots[0].id);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load attendance whenever selectedExamId or selectedSlotId changes
  useEffect(() => {
    let isMounted = true;
    async function fetchAttendance() {
      if (!selectedExamId) return;
      setIsLoading(true);
      const res = await getAttendanceOverviewAction(selectedExamId, selectedSlotId);
      if (isMounted && res.success && res.counts) {
        setCounts(res.counts);
        setCandidates(res.candidates as AttendanceCandidate[]);
        setIsLoading(false);
      }
    }
    fetchAttendance();
    return () => {
      isMounted = false;
    };
  }, [selectedExamId, selectedSlotId]);

  const handleStatusChange = async (sessionId: string, newStatus: AttendanceStatus) => {
    await updateCandidateAttendanceAction(sessionId, newStatus);
    await loadAttendance(selectedExamId, selectedSlotId);
  };

  const activeExam = exams.find((e) => e.id === selectedExamId);

  const filtered = candidates.filter((c) =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.regNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Attendance & Live Hall Monitor</h1>
          <p className="text-xs text-slate-500">
            Real-time biometric & session verification: monitor waiting room check-ins, active exam takers, and identify unattended scholars
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadAttendance(selectedExamId, selectedSlotId)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors shadow-2xs"
            title="Refresh Attendance"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-600">Exam:</span>
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                const ex = exams.find((x) => x.id === e.target.value);
                if (ex && ex.slots.length > 0) {
                  setSelectedSlotId(ex.slots[0].id);
                } else {
                  setSelectedSlotId("");
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
            >
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.course_code}: {e.title}
                </option>
              ))}
            </select>
          </div>

          {activeExam && activeExam.slots.length > 0 && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <Clock className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold text-slate-600">Slot Window:</span>
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
              >
                <option value="">All Slots (Consolidated)</option>
                {activeExam.slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.slot_name} ({s.is_retest_slot ? "Re-Exam Slot" : "Primary"})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search scholar or reg #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Real-Time KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Enrolled</span>
          <span className="text-xl font-black text-slate-900 mt-1 block">{counts.total || 0}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-sky-200/90 shadow-xs bg-sky-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1">
            <Hourglass className="w-3 h-3" /> Waiting Room
          </span>
          <span className="text-xl font-black text-sky-700 mt-1 block">{counts.logged_in || 0}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-indigo-200/90 shadow-xs bg-indigo-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1">
            <UserCheck className="w-3 h-3" /> In Exam
          </span>
          <span className="text-xl font-black text-indigo-700 mt-1 block">{counts.in_exam || 0}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-emerald-200/90 shadow-xs bg-emerald-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Submitted
          </span>
          <span className="text-xl font-black text-emerald-700 mt-1 block">{counts.submitted || 0}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-rose-200/90 shadow-xs bg-rose-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
            <UserX className="w-3 h-3" /> Unattended / Absent
          </span>
          <span className="text-xl font-black text-rose-700 mt-1 block">{counts.absent || 0}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-amber-200/90 shadow-xs bg-amber-50/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Dropout / Tech Fail
          </span>
          <span className="text-xl font-black text-amber-700 mt-1 block">{counts.technical_failure || 0}</span>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading live attendance records from Supabase...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No scholars enrolled for this exam slot yet. Go to Exam Management or seed sample data.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Research Scholar</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Attendance Status</th>
                <th className="py-3 px-4">Login Window Time</th>
                <th className="py-3 px-4">Violations</th>
                <th className="py-3 px-4 text-right">Examiner Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((c) => (
                <tr key={c.sessionId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{c.fullName}</span>
                    <span className="font-mono text-[11px] text-slate-400">{c.regNumber}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 font-mono font-bold text-slate-700 text-[11px]">
                      {c.department}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-600">
                    {c.slotName}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                        c.attendanceStatus === "SUBMITTED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : c.attendanceStatus === "IN_EXAM"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : c.attendanceStatus === "LOGGED_IN"
                          ? "bg-sky-50 text-sky-700 border-sky-200"
                          : c.attendanceStatus === "ABSENT"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : c.attendanceStatus === "TECHNICAL_FAILURE"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {c.attendanceStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {c.loginAt ? new Date(c.loginAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td className="py-3 px-4">
                    {c.violationCount > 0 ? (
                      <span className="flex items-center gap-1 text-rose-600 font-bold font-mono">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {c.violationCount}
                      </span>
                    ) : (
                      <span className="font-mono text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <select
                      value={c.attendanceStatus}
                      onChange={(e) => handleStatusChange(c.sessionId, e.target.value as AttendanceStatus)}
                      className="text-[11px] font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-600 text-slate-700"
                    >
                      <option value="NOT_REPORTED">Not Reported</option>
                      <option value="LOGGED_IN">Waiting Room</option>
                      <option value="IN_EXAM">In Exam</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="ABSENT">Absent (Unattended)</option>
                      <option value="TECHNICAL_FAILURE">Technical Dropout</option>
                      <option value="DISQUALIFIED">Disqualified</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
