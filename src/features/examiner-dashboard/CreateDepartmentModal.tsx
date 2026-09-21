"use client";

import { useState } from "react";
import { X, Building2 } from "lucide-react";
import { createDepartmentAction } from "@/app/admin/actions";

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateDepartmentModal({
  isOpen,
  onClose,
  onCreated,
}: CreateDepartmentModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formData.code.trim().toUpperCase();
    const cleanName = formData.name.trim();

    if (!cleanCode || !cleanName) {
      setErrorMsg("Department code and name are required.");
      return;
    }

    if (!/^[A-Z0-9_-]{2,15}$/.test(cleanCode)) {
      setErrorMsg("Department code must be 2 to 15 alphanumeric characters (e.g. CSE, MECH, ECE).");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createDepartmentAction({
        code: cleanCode,
        name: cleanName,
        description: formData.description.trim(),
      });

      if (res.success) {
        setFormData({ code: "", name: "", description: "" });
        onCreated();
        onClose();
      } else {
        setErrorMsg(res.error || "Failed to create department. Please try again.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Add Academic Department</h2>
              <p className="text-[11px] text-slate-500">Register a new research discipline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Department Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={15}
              placeholder="e.g. CSE, MECH, ECE, MATH"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 font-mono uppercase bg-slate-50/60 focus:bg-white transition-colors"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Short unique code for exam routing</span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Department Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Computer Science & Engineering"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 bg-slate-50/60 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Research Focus & Specialization Scope
            </label>
            <textarea
              rows={3}
              maxLength={500}
              placeholder="e.g. Research in Artificial Intelligence, Cloud Computing, and Embedded Systems..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 bg-slate-50/60 focus:bg-white resize-none transition-colors"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-2xs disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Save Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
