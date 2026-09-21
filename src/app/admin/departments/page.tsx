"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getDepartmentsAction, 
  deleteDepartmentAction, 
  SerializedDepartment 
} from "@/app/admin/actions";
import { 
  EditDepartmentModal, 
  DepartmentDetailsModal,
  CreateDepartmentModal 
} from "@/features/examiner-dashboard";
import { 
  Building2, 
  Plus, 
  Users, 
  HelpCircle, 
  Trash2, 
  RefreshCw, 
  GraduationCap, 
  Edit, 
  Eye,
  Search,
  AlertCircle
} from "lucide-react";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<SerializedDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<SerializedDepartment | null>(null);
  const [detailsDeptId, setDetailsDeptId] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorBanner("");
    try {
      const data = await getDepartmentsAction();
      setDepartments(data);
    } catch (err) {
      console.error("Failed to load departments:", err);
      setErrorBanner("Failed to retrieve academic departments. Please check database connectivity.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const data = await getDepartmentsAction();
        if (isMounted) {
          setDepartments(data);
        }
      } catch (err) {
        console.error("Failed to load departments:", err);
        if (isMounted) {
          setErrorBanner("Failed to retrieve academic departments.");
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

  const handleDelete = async (dept: SerializedDepartment) => {
    if (dept.scholar_count > 0) {
      alert(
        `Cannot delete ${dept.name} (${dept.code}): ${dept.scholar_count} scholar(s) are currently enrolled. Please reassign or delete scholars from this department first.`
      );
      return;
    }
    if (dept.question_count > 0) {
      alert(
        `Cannot delete ${dept.name} (${dept.code}): ${dept.question_count} specialization questions are currently mapped to this department.`
      );
      return;
    }
    if (
      confirm(
        `Are you sure you want to delete academic department "${dept.name} (${dept.code})"? This action cannot be undone.`
      )
    ) {
      const res = await deleteDepartmentAction(dept.id);
      if (res.success) {
        await loadData();
      } else {
        alert(res.error || "Failed to delete department.");
      }
    }
  };

  const filteredDepartments = departments.filter((dept) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      dept.name.toLowerCase().includes(q) ||
      dept.code.toLowerCase().includes(q) ||
      dept.description.toLowerCase().includes(q)
    );
  });

  const totalScholars = departments.reduce((acc, d) => acc + d.scholar_count, 0);
  const totalQuestions = departments.reduce((acc, d) => acc + d.question_count, 0);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Academic Departments</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Foundation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage university research disciplines, departmental syllabus mappings, and scholar quotas
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
            title="Refresh departments list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Department</span>
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

      {/* Overview Metric Cards - 100% Crisp Light Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Departments</span>
            <span className="text-xl font-black text-slate-900">{departments.length}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Total Scholars</span>
            <span className="text-xl font-black text-slate-900">{totalScholars}</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100 shadow-2xs">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Subject Questions</span>
            <span className="text-xl font-black text-slate-900">{totalQuestions}</span>
          </div>
        </div>
      </div>

      {/* Main Departments Section */}
      <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-2xs">
        {/* Table Toolbar */}
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Registered Academic Disciplines
            </h2>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
              {filteredDepartments.length}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search code or discipline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600/30 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* List Content */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-5 h-5 text-indigo-600 animate-spin mx-auto opacity-70" />
            <p>Loading academic departments...</p>
          </div>
        ) : departments.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">No academic departments registered yet.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Register university disciplines to organize research scholars, syllabus, and specialization questions.
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Department</span>
            </button>
          </div>
        ) : filteredDepartments.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 space-y-2">
            <p>No academic departments match &quot;{searchQuery}&quot;</p>
            <button
              onClick={() => setSearchQuery("")}
              className="text-indigo-600 font-bold hover:underline"
            >
              Clear Search Filter
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDepartments.map((dept) => (
              <div 
                key={dept.id} 
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-lg bg-indigo-50/80 text-indigo-700 font-mono font-bold flex items-center justify-center text-xs border border-indigo-200/70 shrink-0 shadow-2xs">
                    {dept.code}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-bold text-slate-900 truncate">{dept.name}</h3>
                      <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {dept.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {dept.description || "No research syllabus description provided."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-xs">
                  <div className="flex items-center gap-1 text-slate-600 font-medium text-[11px] bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                    <span><strong>{dept.scholar_count}</strong> Scholar{dept.scholar_count === 1 ? "" : "s"}</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-600 font-medium text-[11px] bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span><strong>{dept.question_count}</strong> Question{dept.question_count === 1 ? "" : "s"}</span>
                  </div>

                  <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                    <button
                      onClick={() => setDetailsDeptId(dept.id)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-2xs"
                      title="View Department Scholars & Specialization Questions"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEditingDept(dept)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-amber-600 hover:bg-slate-50 transition-colors shadow-2xs"
                      title="Edit Department Details"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(dept)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-2xs"
                      title="Delete Department"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Department Modal */}
      <CreateDepartmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={loadData}
      />

      {/* Edit Department Modal */}
      <EditDepartmentModal
        isOpen={!!editingDept}
        department={editingDept}
        onClose={() => setEditingDept(null)}
        onSave={loadData}
      />

      {/* Department Details Modal */}
      <DepartmentDetailsModal
        isOpen={!!detailsDeptId}
        departmentId={detailsDeptId}
        onClose={() => setDetailsDeptId(null)}
      />
    </div>
  );
}
