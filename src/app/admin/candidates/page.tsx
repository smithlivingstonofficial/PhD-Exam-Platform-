"use client";

import { useState, useEffect } from "react";
import { 
  getAdminOverviewData, 
  getDepartmentsAction,
  getStudentsAction,
  createStudentAction,
  deleteStudentAction,
  seedDemoDataAction,
  SerializedCandidate,
  SerializedDepartment,
  SerializedStudent,
  SerializedExam
} from "@/app/admin/actions";
import { 
  BulkImportStudentsModal,
  EditStudentModal,
  StudentProfileModal,
  EnrollStudentModal
} from "@/features/examiner-dashboard";
import { 
  Search, 
  Mail, 
  RefreshCw, 
  Plus, 
  Sparkles, 
  X, 
  Upload, 
  Edit, 
  Trash2, 
  BookPlus, 
  Eye
} from "lucide-react";

export default function CandidatesRegistryPage() {
  const [candidates, setCandidates] = useState<SerializedCandidate[]>([]);
  const [students, setStudents] = useState<SerializedStudent[]>([]);
  const [departments, setDepartments] = useState<SerializedDepartment[]>([]);
  const [exams, setExams] = useState<SerializedExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<SerializedStudent | null>(null);
  const [profileStudentId, setProfileStudentId] = useState<string | null>(null);
  const [enrollingStudent, setEnrollingStudent] = useState<SerializedStudent | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState<"ALL_SCHOLARS" | "EXAM_SESSIONS">("ALL_SCHOLARS");

  const [formData, setFormData] = useState({
    reg_number: "",
    full_name: "",
    email: "",
    department_id: "",
    phone: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    const [overview, depts, studentList] = await Promise.all([
      getAdminOverviewData(),
      getDepartmentsAction(),
      getStudentsAction(),
    ]);
    setCandidates(overview.candidates);
    setExams(overview.exams);
    setDepartments(depts);
    setStudents(studentList);
    if (depts.length > 0 && !formData.department_id) {
      setFormData((prev) => ({ ...prev, department_id: depts[0].id }));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
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
        if (depts.length > 0) {
          setFormData((prev) => ({ ...prev, department_id: depts[0].id }));
        }
        setIsLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reg_number || !formData.full_name || !formData.email || !formData.department_id) return;

    const res = await createStudentAction(formData);
    if (res.success) {
      setFormData({
        reg_number: "",
        full_name: "",
        email: "",
        department_id: departments[0]?.id || "",
        phone: "",
      });
      setIsModalOpen(false);
      await loadData();
    } else {
      alert(res.error || "Failed to add scholar");
    }
  };

  const handleDeleteStudent = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete scholar ${name}? All associated sessions and logs will be removed.`)) {
      const res = await deleteStudentAction(id);
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || "Failed to delete scholar");
      }
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    const res = await seedDemoDataAction();
    setIsSeeding(false);
    if (res.success) {
      await loadData();
    } else {
      alert("Error: " + res.message);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.full_name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.reg_number.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "ALL" || s.department_code === deptFilter;
    return matchesSearch && matchesDept;
  });

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.reg_number.toLowerCase().includes(search.toLowerCase()) ||
      c.exam_id.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === "ALL" || c.department_code === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departmentCodes = departments.map((d) => d.code);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Candidate & Scholar Registry</h1>
          <p className="text-xs text-slate-500">
            Manage university research scholars, access codes, departmental assignments, and exam slot enrollments
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 font-bold text-xs hover:bg-violet-100 transition-colors shadow-2xs disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
            <span>Load Sample Scholars</span>
          </button>
          <button
            onClick={() => setIsBulkImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bulk Upload</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Register Scholar</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors shadow-2xs"
            title="Refresh scholar records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/70 text-xs">
            <button
              onClick={() => setActiveTab("ALL_SCHOLARS")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === "ALL_SCHOLARS"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Registered Scholars ({students.length})
            </button>
            <button
              onClick={() => setActiveTab("EXAM_SESSIONS")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === "EXAM_SESSIONS"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active Exam Sessions ({candidates.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-xs font-bold text-slate-500">Dept:</span>
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
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search scholar or reg #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-indigo-600 shadow-2xs"
          />
        </div>
      </div>

      {/* Table Section */}
      {activeTab === "ALL_SCHOLARS" ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading scholar records...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Scholar Details</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Hall Access Code</th>
                  <th className="py-3.5 px-4">Enrolled Sessions</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                      No scholars found. Click &quot;Register Scholar&quot; or &quot;Bulk Upload&quot; to add scholars.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {s.full_name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{s.full_name}</span>
                            <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              {s.reg_number}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800 text-[11px]">
                          {s.department_code || "GEN"}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[120px]">
                          {s.department_name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-indigo-700 text-[11px] border border-slate-200">
                          {s.access_code}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">
                          {s.active_sessions_count || 0} exams
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-slate-600 block">{s.email}</span>
                        <span className="text-[10px] text-slate-400 block">{s.phone || "No phone"}</span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setProfileStudentId(s.id)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition-colors shadow-2xs"
                            title="View Scholar Profile & History"
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
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-amber-600 transition-colors shadow-2xs"
                            title="Edit Scholar"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id, s.full_name)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors shadow-2xs"
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
          )}
        </div>
      ) : (
        /* Exam Sessions View */
        <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading candidate sessions...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Scholar Name</th>
                  <th className="py-3.5 px-4">Dept</th>
                  <th className="py-3.5 px-4">Exam & Slot</th>
                  <th className="py-3.5 px-4">Attendance State</th>
                  <th className="py-3.5 px-4">Violations</th>
                  <th className="py-3.5 px-4">Integrity</th>
                  <th className="py-3.5 px-4 text-right">Score</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                      No active sessions found for this filter.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{c.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono font-bold text-slate-800 text-[11px]">
                          {c.department_code || "GEN"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-indigo-700 font-mono text-[11px] block">{c.exam_id}</span>
                        <span className="text-[10px] text-slate-400">
                          {c.slot_name} {c.attempt_number > 1 && "(Slot 2)"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
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
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{c.violation_count}</td>
                      <td className="py-3.5 px-4">
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
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {c.final_score !== null ? `${c.final_score} pts` : "In Progress"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
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
          )}
        </div>
      )}

      {/* Modals */}
      {/* 1. Single Register Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Register Research Scholar</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Registration / Roll Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PHD26-CSE-004"
                  value={formData.reg_number}
                  onChange={(e) => setFormData({ ...formData, reg_number: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono uppercase focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Priya Sundaram"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">University Email *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya.s@research.univ.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Academic Department *</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                >
                  {departments.length === 0 ? (
                    <option value="">No departments found — add one first</option>
                  ) : (
                    departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} - {d.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone Number (Optional)</label>
                <input
                  type="tel"
                  placeholder="+91 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-hidden focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={departments.length === 0}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  Save Scholar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
