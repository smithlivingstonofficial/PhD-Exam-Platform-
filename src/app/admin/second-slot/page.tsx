"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getAdminOverviewData, 
  getSecondSlotEligibleCandidatesAction, 
  createSecondSlotAndEnrollAction,
  SerializedExam 
} from "@/app/admin/actions";
import { 
  RefreshCw, 
  Layers, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles
} from "lucide-react";

interface EligibleCandidate {
  sessionId: string;
  studentId: string;
  regNumber: string;
  fullName: string;
  email: string;
  department: string;
  departmentName: string;
  previousSlotName: string;
  reason: string;
  attendanceStatus: string;
}

export default function SecondSlotManagementPage() {
  const [exams, setExams] = useState<SerializedExam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [eligibleCandidates, setEligibleCandidates] = useState<EligibleCandidate[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Timing form for Slot 2 with lazy initializer
  const [slotFormData, setSlotFormData] = useState(() => {
    const now = new Date();
    const start = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const loginOpen = new Date(start.getTime() - 15 * 60 * 1000);
    const joinCutoff = new Date(start.getTime() + 15 * 60 * 1000);
    const end = new Date(start.getTime() + 120 * 60 * 1000);

    const toLocalISO = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    return {
      slot_name: "Slot 2 - Makeup Re-Exam Session",
      login_opens_at: toLocalISO(loginOpen),
      start_time: toLocalISO(start),
      join_window_closes_at: toLocalISO(joinCutoff),
      end_time: toLocalISO(end),
    };
  });

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

  const loadEligibleCandidates = useCallback(async (examId: string, slotId?: string) => {
    if (!examId) return;
    setIsLoading(true);
    const list = await getSecondSlotEligibleCandidatesAction(examId, slotId);
    setEligibleCandidates(list);
    setSelectedStudentIds(list.map((c) => c.studentId));
    setIsLoading(false);
  }, []);

  // Fetch eligible candidates whenever exam or slot changes
  useEffect(() => {
    let isMounted = true;
    async function fetchCandidates() {
      if (!selectedExamId) return;
      setIsLoading(true);
      const list = await getSecondSlotEligibleCandidatesAction(selectedExamId, selectedSlotId);
      if (isMounted) {
        setEligibleCandidates(list);
        setSelectedStudentIds(list.map((c) => c.studentId));
        setIsLoading(false);
      }
    }
    fetchCandidates();
    return () => {
      isMounted = false;
    };
  }, [selectedExamId, selectedSlotId]);

  const handleToggleSelect = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter((id) => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === eligibleCandidates.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(eligibleCandidates.map((c) => c.studentId));
    }
  };

  const handleCreateSecondSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExamId || selectedStudentIds.length === 0) {
      alert("Please select at least one candidate for the second slot.");
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg("");

    const res = await createSecondSlotAndEnrollAction({
      exam_id: selectedExamId,
      slot_name: slotFormData.slot_name,
      login_opens_at: new Date(slotFormData.login_opens_at).toISOString(),
      start_time: new Date(slotFormData.start_time).toISOString(),
      join_window_closes_at: new Date(slotFormData.join_window_closes_at).toISOString(),
      end_time: new Date(slotFormData.end_time).toISOString(),
      candidate_student_ids: selectedStudentIds,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`Second Slot (${slotFormData.slot_name}) successfully initialized in Supabase! Enrolled ${selectedStudentIds.length} scholars for re-examination.`);
      const overview = await getAdminOverviewData();
      setExams(overview.exams);
      await loadEligibleCandidates(selectedExamId, selectedSlotId);
    } else {
      alert("Failed to create second slot: " + res.error);
    }
  };

  const activeExam = exams.find((e) => e.id === selectedExamId);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Second Slot (Re-Exam) Hub</h1>
          <p className="text-xs text-slate-500">
            Automatically detect scholars who missed the exam (unattended) or suffered technical interruptions, and allocate them into a dedicated second slot
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Target Exam Filter Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-600">Active Examination:</span>
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

        {activeExam && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold">Existing Slots:</span>
            {activeExam.slots.map((s) => (
              <span 
                key={s.id} 
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                  s.is_retest_slot ? "bg-violet-50 text-violet-700 border-violet-200" : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {s.slot_name} ({s.enrolled_count} Enrolled)
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Unattended & Unsuccessful Candidates List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Unattended & Unsuccessful Scholars
                </h2>
                <p className="text-[11px] text-slate-500">
                  Scholars marked Absent, Technical Failure, or Incomplete in Slot 1
                </p>
              </div>

              {eligibleCandidates.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-xs text-indigo-600 font-bold hover:underline"
                >
                  {selectedStudentIds.length === eligibleCandidates.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs text-slate-400">Scanning Slot 1 records in Supabase...</div>
            ) : eligibleCandidates.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No Unattended or Failed Scholars Found</p>
                <p className="text-[11px] text-slate-500">
                  All enrolled scholars either submitted successfully or have already been assigned to a makeup slot.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {eligibleCandidates.map((c) => {
                  const isChecked = selectedStudentIds.includes(c.studentId);
                  return (
                    <div
                      key={c.sessionId}
                      onClick={() => handleToggleSelect(c.studentId)}
                      className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                        isChecked ? "bg-indigo-50/50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent onClick
                          className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{c.fullName}</span>
                            <span className="font-mono text-[11px] text-slate-400 font-semibold">{c.regNumber}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold font-mono text-[10px]">
                              {c.department}
                            </span>
                            <span>{c.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                            c.attendanceStatus === "ABSENT"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {c.reason}
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                          Origin: {c.previousSlotName}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Second Slot Scheduler Form */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>2. Schedule Second Slot Window</span>
            </h2>
            <p className="text-[11px] text-slate-500 mb-4">
              Configure server-authoritative timings for the makeup session
            </p>

            <form onSubmit={handleCreateSecondSlot} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Slot Name *</label>
                <input
                  type="text"
                  required
                  value={slotFormData.slot_name}
                  onChange={(e) => setSlotFormData({ ...slotFormData, slot_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-medium focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Login & Device Verification Opens *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={slotFormData.login_opens_at}
                  onChange={(e) => setSlotFormData({ ...slotFormData, login_opens_at: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono text-[11px] focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Pre-exam waiting room & camera check</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Exam Start Time (Questions Unlock) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={slotFormData.start_time}
                  onChange={(e) => setSlotFormData({ ...slotFormData, start_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono text-[11px] focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Join Window Cutoff (Grace Period) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={slotFormData.join_window_closes_at}
                  onChange={(e) => setSlotFormData({ ...slotFormData, join_window_closes_at: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono text-[11px] focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">No candidate can join past this timestamp</span>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Exam Hard Cutoff (End Time) *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={slotFormData.end_time}
                  onChange={(e) => setSlotFormData({ ...slotFormData, end_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono text-[11px] focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-[11px] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Selected Scholars:</strong> {selectedStudentIds.length} candidate(s) will be granted enrollment into Slot 2.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || selectedStudentIds.length === 0}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSubmitting ? "animate-spin" : ""}`} />
                <span>{isSubmitting ? "Creating Slot 2..." : `Enroll ${selectedStudentIds.length} in Slot 2`}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
