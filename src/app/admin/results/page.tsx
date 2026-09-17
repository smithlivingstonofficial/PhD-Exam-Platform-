"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getAdminOverviewData, 
  getExamResultsAction, 
  SerializedExam 
} from "@/app/admin/actions";
import { 
  Award, 
  Search, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldAlert, 
  Download, 
  RefreshCw,
  TrendingUp,
  Percent
} from "lucide-react";

interface ExamResult {
  sessionId: string;
  regNumber: string;
  fullName: string;
  email: string;
  departmentCode: string;
  slotName: string;
  attemptNumber: number;
  status: string;
  attendanceStatus: string;
  finalScore: number | null;
  commonScore: number | null;
  departmentScore: number | null;
  isPassed: boolean | null;
  integrityScore: number;
  violationCount: number;
  submittedAt: string | null;
}

export default function ResultsEvaluationPage() {
  const [exams, setExams] = useState<SerializedExam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [results, setResults] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("ALL");
  const [passFilter, setPassFilter] = useState<string>("ALL");

  const loadResults = useCallback(async (examId: string, slotId?: string) => {
    if (!examId) return;
    setIsLoading(true);
    const res = await getExamResultsAction(examId, slotId);
    if (res.success && res.results) {
      setResults(res.results as ExamResult[]);
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
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load results whenever selectedExamId or selectedSlotId changes
  useEffect(() => {
    let isMounted = true;
    async function fetchResults() {
      if (!selectedExamId) return;
      setIsLoading(true);
      const res = await getExamResultsAction(selectedExamId, selectedSlotId);
      if (isMounted && res.success && res.results) {
        setResults(res.results as ExamResult[]);
        setIsLoading(false);
      }
    }
    fetchResults();
    return () => {
      isMounted = false;
    };
  }, [selectedExamId, selectedSlotId]);

  const activeExam = exams.find((e) => e.id === selectedExamId);

  // Statistics
  const evaluated = results.filter((r) => r.finalScore !== null);
  const passedCount = evaluated.filter((r) => r.isPassed === true).length;
  const avgScore = evaluated.length > 0
    ? Math.round(evaluated.reduce((acc, r) => acc + (r.finalScore || 0), 0) / evaluated.length)
    : 0;
  const highestScore = evaluated.length > 0
    ? Math.max(...evaluated.map((r) => r.finalScore || 0))
    : 0;
  const passRate = evaluated.length > 0
    ? Math.round((passedCount / evaluated.length) * 100)
    : 0;

  // Filters
  const filtered = results.filter((r) => {
    const matchesSearch =
      r.fullName.toLowerCase().includes(search.toLowerCase()) ||
      r.regNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase());

    const matchesDept = deptFilter === "ALL" || r.departmentCode === deptFilter;

    const matchesPass =
      passFilter === "ALL"
        ? true
        : passFilter === "PASSED"
        ? r.isPassed === true
        : passFilter === "FAILED"
        ? r.isPassed === false
        : r.finalScore === null;

    return matchesSearch && matchesDept && matchesPass;
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ["Reg Number", "Scholar Name", "Email", "Department", "Slot", "Attempt", "Part A Score", "Part B Score", "Final Score", "Result", "Integrity Rating", "Violations"];
    const rows = filtered.map((r) => [
      r.regNumber,
      `"${r.fullName}"`,
      r.email,
      r.departmentCode,
      `"${r.slotName}"`,
      r.attemptNumber,
      r.commonScore ?? "N/A",
      r.departmentScore ?? "N/A",
      r.finalScore ?? "In Progress",
      r.isPassed ? "PASSED" : r.isPassed === false ? "FAILED" : "PENDING",
      `${r.integrityScore}%`,
      r.violationCount,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `exam_results_${selectedExamId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const departmentsList = Array.from(new Set(results.map((r) => r.departmentCode)));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Results & Evaluation Center</h1>
          <p className="text-xs text-slate-500">
            Server-evaluated qualifying scores: Part A (Common Aptitude) + Part B (Departmental Core) with proctor integrity correlation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadResults(selectedExamId, selectedSlotId)}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors shadow-2xs"
            title="Refresh results"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-md shadow-slate-900/10 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Selector Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-600">Exam:</span>
            <select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setSelectedSlotId("");
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
              <span className="text-xs font-bold text-slate-600">Slot:</span>
              <select
                value={selectedSlotId}
                onChange={(e) => setSelectedSlotId(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-indigo-600"
              >
                <option value="">All Slots</option>
                {activeExam.slots.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.slot_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Departments</option>
            {departmentsList.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={passFilter}
            onChange={(e) => setPassFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Outcomes</option>
            <option value="PASSED">Passed Only</option>
            <option value="FAILED">Failed Only</option>
            <option value="PENDING">Pending / In Progress</option>
          </select>

          <div className="relative w-48">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Performance KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Evaluated</span>
            <span className="text-xl font-black text-slate-900">{evaluated.length} / {results.length}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Pass Rate</span>
            <span className="text-xl font-black text-emerald-700">{passRate}%</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Average Score</span>
            <span className="text-xl font-black text-slate-900">{avgScore} / 100</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Highest Mark</span>
            <span className="text-xl font-black text-amber-700">{highestScore} / 100</span>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Computing candidate scores from Supabase...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No evaluated candidate results matching your filter criteria.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Research Scholar</th>
                <th className="py-3 px-4">Dept</th>
                <th className="py-3 px-4">Slot & Attempt</th>
                <th className="py-3 px-4 text-center">Part A (Common)</th>
                <th className="py-3 px-4 text-center">Part B (Dept)</th>
                <th className="py-3 px-4 text-center">Final Score</th>
                <th className="py-3 px-4">Result Status</th>
                <th className="py-3 px-4 text-right">Integrity Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((r) => (
                <tr key={r.sessionId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 block">{r.fullName}</span>
                    <span className="font-mono text-[11px] text-slate-400">{r.regNumber}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800 text-[11px]">
                      {r.departmentCode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-700">{r.slotName}</span>
                      {r.attemptNumber > 1 && (
                        <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 font-bold text-[9px] uppercase font-mono">
                          Slot 2 Attempt
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">
                    {r.commonScore !== null ? `${r.commonScore}` : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">
                    {r.departmentScore !== null ? `${r.departmentScore}` : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono font-black text-sm text-slate-900">
                    {r.finalScore !== null ? `${r.finalScore} / 100` : <span className="text-xs text-slate-400 font-normal">Pending</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    {r.isPassed === true ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Passed
                      </span>
                    ) : r.isPassed === false ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                        <XCircle className="w-3 h-3" /> Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        In Progress
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          r.integrityScore >= 90
                            ? "text-emerald-700 bg-emerald-50"
                            : r.integrityScore >= 75
                            ? "text-amber-700 bg-amber-50"
                            : "text-rose-700 bg-rose-50"
                        }`}
                      >
                        {r.integrityScore}%
                      </span>
                      {r.violationCount > 0 && (
                        <span className="text-rose-600 font-mono text-[11px] font-bold flex items-center gap-0.5" title="Violations detected">
                          <ShieldAlert className="w-3 h-3" /> {r.violationCount}
                        </span>
                      )}
                    </div>
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
