"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getAdminOverviewData, 
  getDepartmentsAction,
  getStudentsAction,
  deleteStudentAction,
  SerializedCandidate,
  SerializedDepartment,
  SerializedStudent,
  SerializedExam
} from "@/app/admin/actions";
import { 
  BulkImportStudentsModal,
  EditStudentModal,
  StudentProfileModal,
  EnrollStudentModal,
  RegisterScholarModal
} from "@/features/examiner-dashboard";
import { 
  Search, 
  Mail, 
  RefreshCw, 
  Plus, 
  Upload, 
  Edit, 
  Trash2, 
  BookPlus, 
  Eye,
  Users,
  Building2,
  BookOpenCheck,
  KeyRound,
  AlertCircle,
  Copy,
  Check
} from "lucide-react";

export default function CandidatesRegistryPage() {
  const [candidates, setCandidates] = useState<SerializedCandidate[]>([]);
  const [students, setStudents] = useState<SerializedStudent[]>([]);
  const [departments, setDepartments] = useState<SerializedDepartment[]>([]);
  const [exams, setExams] = useState<SerializedExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<SerializedStudent | null>(null);
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);
  const [enrollingStudent, setEnrollingStudent] = useState<SerializedStudent | null>(null);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"ALL_SCHOLARS" | "EXAM_SESSIONS">("ALL_SCHOLARS");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorBanner("");
    try {
      const [overview, depts, studentList] = await Promise.all([
        getAdminOverviewData(),
        getDepartmentsAction(),
        getStudentsAction(),
      ]);
      setCandidates(overview.candidates);
      setExams(overview.exams);
      setDepartments(depts);
      setStudents(studentList);
    } catch (err) {
      console.error("Failed to load candidates data:", err);
      setErrorBanner("Failed to retrieve scholar records from database. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [overview, depts, studentList] = await Promise.all([
          getAdminOverviewData(),
          getDepartmentsAction(),
          getStudentsAction(),
        ]);
        if (isMounted) {
          setCandidates(overview.candidates);
          setExams(overview.exams);
          setDepartments(depts);
          setStudents(studentList);
        }
      } catch (err) {
        console.error("Failed to load candidates:", err);
        if (isMounted) {
          setErrorBanner("Failed to retrieve candidate records from Supabase.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyAccessCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteStudent = async (student: SerializedStudent) => {
    const hasSessions = (student.active_sessions_count || 0) > 0;
    const confirmMessage = hasSessions
      ? `Scholar ${student.full_name} (${student.reg_number}) has ${student.active_sessions_count} active or completed exam session(s). Deleting will remove their test attempts and proctoring audit logs.\n\nAre you sure you wish to proceed?`
      : `Are you sure you want to delete scholar "${student.full_name} (${student.reg_number})"? This action cannot be undone.`;

    if (confirm(confirmMessage)) {
      const res = await deleteStudentAction(student.id);
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || "Failed to delete scholar.");
      }
    }
  };

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.full_name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.reg_number.toLowerCase().includes(q) ||
      (s.department_code && s.department_code.toLowerCase().includes(q));
    const matchesDept = deptFilter === "ALL" || s.department_code === deptFilter;
    return matchesSearch && matchesDept;
  });

  const filteredCandidates = candidates.filter((c) => {
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.reg_number.toLowerCase().includes(q) ||
      c.exam_title.toLowerCase().includes(q) ||
      c.department_code.toLowerCase().includes(q);
    const matchesDept = deptFilter === "ALL" || c.department_code === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departmentCodes = departments.map((d) => d.code);
  const totalActiveSessions = students.reduce((acc, s) => acc + (s.active_sessions_count || 0), 0);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Candidate & Scholar Registry</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Scholars
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage university research scholars, access codes, departmental assignments, and exam slot enrollments
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bulk Upload CSV</span>
          </button>
          <button
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Scholar</span>
          </button>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh scholar records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={loadData}
            className="px-2.5 py-1 rounded-md bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-[11px] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 4 Overview Metric Cards - 100% Crisp Light Theme */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Registered Scholars</span>
            <span className="text-lg font-black text-slate-900">{students.length}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Departments</span>
            <span className="text-lg font-black text-slate-900">{departments.length}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 shadow-2xs">
            <BookOpenCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Enrollments</span>
            <span className="text-lg font-black text-slate-900">{totalActiveSessions}</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-2xs">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Hall Access Codes</span>
            <span className="text-lg font-black text-slate-900">{students.length} Active</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/70 text-xs">
            <button
              onClick={() => setActiveTab("ALL_SCHOLARS")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                activeTab === "ALL_SCHOLARS"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Registered Scholars ({students.length})
            </button>
            <button
              onClick={() => setActiveTab("EXAM_SESSIONS")}
              className={`px-3 py-1.5 rounded-md font-bold transition-all ${
                activeTab === "EXAM_SESSIONS"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active Exam Sessions ({candidates.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-[11px] font-bold text-slate-500">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-indigo-600"
            >
              <option value="ALL">All Departments</option>
              {departmentCodes.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search scholar or reg #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 shadow-2xs"
          />
        </div>
      </div>

      {/* Main Table Content */}
      {activeTab === "ALL_SCHOLARS" ? (
        <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin mx-auto opacity-70" />
              <p>Loading scholar records from database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Scholar Details</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Hall Access Code</th>
                    <th className="py-3 px-4">Enrolled Sessions</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <div className="max-w-sm mx-auto space-y-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
                            <Users className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">No research scholars registered yet.</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Register candidates individually or upload a CSV spreadsheet to begin examination scheduling.
                            </p>
                          </div>
                          <div className="flex items-center justify-center gap-2 pt-1">
                            <button
                              onClick={() => setIsRegisterModalOpen(true)}
                              className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs inline-flex items-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Register Scholar</span>
                            </button>
                            <button
                              onClick={() => setIsBulkImportOpen(true)}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
                            >
                              Bulk Upload
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs text-slate-500 space-y-2">
                        <p>No scholars match &quot;{search}&quot;</p>
                        <button
                          onClick={() => setSearch("")}
                          className="text-indigo-600 font-bold hover:underline"
                        >
                          Clear Search Filter
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50/80 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-100 shadow-2xs">
                              {s.full_name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{s.full_name}</span>
                              <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                {s.reg_number}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200/70 font-mono font-bold text-indigo-700 text-[10px]">
                            {s.department_code || "GEN"}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[130px]">
                            {s.department_name}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                            <span className="font-mono font-bold text-indigo-700 text-[11px] tracking-wider">
                              {s.access_code}
                            </span>
                            <button
                              onClick={() => handleCopyAccessCode(s.id, s.access_code)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors"
                              title="Copy access code to clipboard"
                            >
                              {copiedId === s.id ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-slate-700 font-semibold text-[11px]">
                            <BookOpenCheck className="w-3 h-3 text-slate-400" />
                            <span>{s.active_sessions_count || 0} exam{s.active_sessions_count === 1 ? "" : "s"}</span>
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <span className="text-[11px] text-slate-700 block truncate max-w-[180px]">{s.email}</span>
                          <span className="text-[10px] text-slate-400 block">{s.phone || "No phone listed"}</span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setProfileStudentId(s.id)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-2xs"
                              title="View Scholar Profile & Audit History"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEnrollingStudent(s)}
                              className="p-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
                              title="Enroll in Examination Slot"
                            >
                              <BookPlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingStudent(s)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-600 hover:bg-slate-50 transition-colors shadow-2xs"
                              title="Edit Scholar Information"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStudent(s)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-2xs"
                              title="Delete Scholar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Exam Sessions View */
        <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin mx-auto opacity-70" />
              <p>Loading candidate session records...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Scholar Name</th>
                    <th className="py-3 px-4">Dept</th>
                    <th className="py-3 px-4">Exam & Slot</th>
                    <th className="py-3 px-4">Attendance State</th>
                    <th className="py-3 px-4">Violations</th>
                    <th className="py-3 px-4">Integrity</th>
                    <th className="py-3 px-4 text-right">Score</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                        No active exam sessions found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{c.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800 text-[10px]">
                            {c.department_code || "GEN"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-indigo-700 text-[11px] block">{c.exam_title || c.exam_id}</span>
                          <span className="text-[10px] text-slate-400">
                            {c.slot_name} {c.attempt_number > 1 && "(Slot 2)"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              c.attendance_status === "SUBMITTED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : c.attendance_status === "IN_EXAM"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : c.attendance_status === "ABSENT"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : c.attendance_status === "TECHNICAL_FAILURE"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {c.attendance_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{c.violation_count}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                              c.integrity_score >= 90
                                ? "text-emerald-700 bg-emerald-50"
                                : c.integrity_score >= 75
                                ? "text-amber-700 bg-amber-50"
                                : "text-rose-700 bg-rose-50"
                            }`}
                          >
                            {c.integrity_score}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {c.final_score !== null ? `${c.final_score} pts` : "In Progress"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setProfileStudentId(c.student_id)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors shadow-2xs"
                            title="View Full Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {/* 1. Register Scholar Modal (Dedicated Component) */}
      <RegisterScholarModal
        isOpen={isRegisterModalOpen}
        departments={departments}
        onClose={() => setIsRegisterModalOpen(false)}
        onCreated={loadData}
      />

      {/* 2. Bulk CSV Import Modal */}
      <BulkImportStudentsModal
        isOpen={isBulkImportOpen}
        departments={departments}
        onClose={() => setIsBulkImportOpen(false)}
        onImportComplete={loadData}
      />

      {/* 3. Edit Student Modal */}
      <EditStudentModal
        isOpen={!!editingStudent}
        student={editingStudent}
        departments={departments}
        onClose={() => setEditingStudent(null)}
        onSave={loadData}
      />

      {/* 4. Student Profile History Modal */}
      <StudentProfileModal
        isOpen={!!profileStudentId}
        studentId={profileStudentId}
        onClose={() => setProfileStudentId(null)}
      />

      {/* 5. Enroll Student in Exam Modal */}
      <EnrollStudentModal
        isOpen={!!enrollingStudent}
        student={enrollingStudent}
        exams={exams}
        onClose={() => setEnrollingStudent(null)}
        onEnrollSuccess={loadData}
      />
    </div>
  );
}
