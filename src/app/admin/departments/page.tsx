"use client";

import { useState, useEffect } from "react";
import { 
  getDepartmentsAction, 
  createDepartmentAction, 
  deleteDepartmentAction,
  seedDemoDataAction,
  SerializedDepartment 
} from "@/app/admin/actions";
import { 
  Building2, 
  Plus, 
  Users, 
  HelpCircle, 
  Trash2, 
  RefreshCw, 
  Sparkles, 
  X,
  GraduationCap
} from "lucide-react";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<SerializedDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [formData, setFormData] = useState({ code: "", name: "", description: "" });
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    const data = await getDepartmentsAction();
    setDepartments(data);
    setIsLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    async function init() {
      const data = await getDepartmentsAction();
      if (isMounted) {
        setDepartments(data);
        setIsLoading(false);
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) return;

    setErrorMsg("");
    const res = await createDepartmentAction(formData);
    if (res.success) {
      setFormData({ code: "", name: "", description: "" });
      setIsModalOpen(false);
      await loadData();
    } else {
      setErrorMsg(res.error || "Failed to create department");
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (confirm(`Are you sure you want to delete department ${code}?`)) {
      const res = await deleteDepartmentAction(id);
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || "Failed to delete department. Ensure no scholars or questions are linked.");
      }
    }
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    const res = await seedDemoDataAction();
    setIsSeeding(false);
    if (res.success) {
      alert("Sample Ph.D System loaded: Departments, Scholars, Exam Slots & Questions populated!");
      await loadData();
    } else {
      alert("Error seeding data: " + res.message);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Academic Departments</h1>
          <p className="text-xs text-slate-500">
            Manage university research disciplines, departmental syllabus mappings, and faculty scholar quotas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={isSeeding}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 font-bold text-xs hover:bg-violet-100 transition-colors shadow-2xs disabled:opacity-50"
            title="Populate standard academic departments, demo scholars, and dual questions"
          >
            <Sparkles className={`w-4 h-4 ${isSeeding ? "animate-spin" : ""}`} />
            <span>{isSeeding ? "Seeding System..." : "Seed Ph.D Demo Dataset"}</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Departments</span>
            <span className="text-2xl font-black text-slate-900">{departments.length}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Total Scholars</span>
            <span className="text-2xl font-black text-slate-900">
              {departments.reduce((acc, d) => acc + d.scholar_count, 0)}
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Dept Specific Questions</span>
            <span className="text-2xl font-black text-slate-900">
              {departments.reduce((acc, d) => acc + d.question_count, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Enrolled Academic Divisions</h2>
          <button onClick={loadData} className="p-1 rounded text-slate-400 hover:text-slate-700">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading department registry from Supabase...</div>
        ) : departments.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs text-slate-500">No departments added yet.</p>
            <button
              onClick={handleSeed}
              className="text-xs text-indigo-600 font-bold hover:underline"
            >
              Click here to seed default departments (CSE, MECH, ECE, MATH)
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {departments.map((dept) => (
              <div key={dept.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start gap-3.5">
                  <span className="w-10 h-10 rounded-xl bg-slate-100 text-indigo-700 font-mono font-bold flex items-center justify-center text-xs border border-slate-200 shrink-0">
                    {dept.code}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{dept.description || "No departmental syllabus description provided."}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <GraduationCap className="w-4 h-4 text-emerald-600" />
                    <span><strong>{dept.scholar_count}</strong> Scholars</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <HelpCircle className="w-4 h-4 text-indigo-600" />
                    <span><strong>{dept.question_count}</strong> Questions</span>
                  </div>

                  <button
                    onClick={() => handleDelete(dept.id, dept.code)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete Department"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Add Academic Department</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDept} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE, MECH, ECE"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 uppercase font-mono focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science & Engineering"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Syllabus Scope</label>
                <textarea
                  rows={3}
                  placeholder="Description of discipline, research focus, or qualifying criteria..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
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
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/20"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
