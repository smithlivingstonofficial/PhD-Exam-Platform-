"use client";

import { useState, useEffect } from "react";
import { 
  getAdminOverviewData, 
  getDepartmentsAction,
  createStudentAction,
  seedDemoDataAction,
  SerializedCandidate,
  SerializedDepartment 
} from "@/app/admin/actions";
import { Search, Mail, RefreshCw, Plus, Sparkles, X } from "lucide-react";

export default function CandidatesRegistryPage() {
  const [candidates, setCandidates] = useState<SerializedCandidate[]>([]);
  const [departments, setDepartments] = useState<SerializedDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");

  const [formData, setFormData] = useState({
    reg_number: "",
    full_name: "",
    email: "",
    department_id: "",
    phone: "",
  });

  const loadData = async () => {
    setIsLoading(true);
    const [overview, depts] = await Promise.all([
      getAdminOverviewData(),
      getDepartmentsAction(),
    ]);
    setCandidates(overview.candidates);
    setDepartments(depts);
    if (depts.length > 0 && !formData.department_id) {
      setFormData((prev) => ({ ...prev, department_id: depts[0].id }));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      const [overview, depts] = await Promise.all([
        getAdminOverviewData(),
        getDepartmentsAction(),
      ]);
      if (isMounted) {
        setCandidates(overview.candidates);
        setDepartments(depts);
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

  const filtered = candidates.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.reg_number.toLowerCase().includes(search.toLowerCase()) ||
      c.exam_id.toLowerCase().includes(search.toLowerCase());

    const matchesDept = deptFilter === "ALL" || c.department_code === deptFilter;
    return matchesSearch && matchesDept;
  });

  const departmentCodes = Array.from(new Set(candidates.map((c) => c.department_code).filter(Boolean)));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Candidate & Scholar Registry</h1>
          <p className="text-xs text-slate-500">
            View enrolled research scholars, department disciplines, exam slot allocations, and attendance states
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 font-bold text-xs hover:bg-violet-100 transition-colors shadow-2xs disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? "animate-spin" : ""}`} />
            <span>Seed Sample Dataset</span>
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
            title="Refresh candidates"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600">Filter Department:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">All Departments</option>
            {departmentCodes.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search scholars or reg #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs"
          />
        </div>
      </div>

      {/* Candidate Table */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading candidate records from Supabase...</div>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No candidate sessions found. Click &quot;Seed Sample Dataset&quot; to populate realistic research scholars.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
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
                      {c.final_score !== null ? `${c.final_score} / 100` : "In Progress"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Register Scholar Modal */}
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
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-mono uppercase focus:outline-none focus:border-indigo-600 focus:bg-white"
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
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
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
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Academic Department *</label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:border-indigo-600 focus:bg-white"
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
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
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
    </div>
  );
}
