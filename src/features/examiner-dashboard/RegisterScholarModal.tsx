"use client";

import { useState } from "react";
import { X, UserPlus, RefreshCw, Dices } from "lucide-react";
import { createStudentAction, SerializedDepartment } from "@/app/admin/actions";

interface RegisterScholarModalProps {
  isOpen: boolean;
  departments: SerializedDepartment[];
  onClose: () => void;
  onCreated: () => void;
}

function getRandomPin(): string {
  if (typeof window !== "undefined" && window.crypto) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return (100000 + (array[0] % 900000)).toString();
  }
  return "998877";
}

export function RegisterScholarModal({
  isOpen,
  departments,
  onClose,
  onCreated,
}: RegisterScholarModalProps) {
  const [formData, setFormData] = useState({
    reg_number: "",
    full_name: "",
    email: "",
    department_id: "",
    phone: "",
    access_code: "998877",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const activeDepartmentId = formData.department_id || departments[0]?.id || "";

  const handleRegeneratePin = () => {
    setFormData((prev) => ({ ...prev, access_code: getRandomPin() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReg = formData.reg_number.trim().toUpperCase();
    const cleanName = formData.full_name.trim();
    const cleanEmail = formData.email.trim().toLowerCase();

    if (!cleanReg || !cleanName || !cleanEmail || !activeDepartmentId) {
      setErrorMsg("Registration number, full name, email, and department are required.");
      return;
    }

    if (!/^[A-Z0-9_-]{3,30}$/.test(cleanReg)) {
      setErrorMsg("Registration number must be 3-30 alphanumeric characters (e.g. PHD26-CSE-001).");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMsg("Please enter a valid university email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await createStudentAction({
        reg_number: cleanReg,
        full_name: cleanName,
        email: cleanEmail,
        department_id: activeDepartmentId,
        phone: formData.phone.trim(),
        access_code: formData.access_code.trim(),
      });

      if (res.success) {
        setFormData({
          reg_number: "",
          full_name: "",
          email: "",
          department_id: departments[0]?.id || "",
          phone: "",
          access_code: getRandomPin(),
        });
        onCreated();
        onClose();
      } else {
        setErrorMsg(res.error || "Failed to register scholar.");
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Register Research Scholar</h2>
              <p className="text-[11px] text-slate-500">Add candidate to institutional registry</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Registration / Roll Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={30}
              placeholder="e.g. PHD26-CSE-004"
              value={formData.reg_number}
              onChange={(e) => setFormData({ ...formData, reg_number: e.target.value.toUpperCase() })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 font-mono uppercase bg-slate-50/60 focus:bg-white transition-colors"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Official university enrollment identifier</span>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              maxLength={120}
              placeholder="e.g. Priya Sundaram"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 bg-slate-50/60 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              University Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              maxLength={150}
              placeholder="e.g. priya.s@research.univ.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 bg-slate-50/60 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Academic Department <span className="text-rose-500">*</span>
            </label>
            <select
              value={activeDepartmentId}
              onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 bg-slate-50/60 focus:bg-white font-semibold text-slate-800 transition-colors"
            >
              {departments.length === 0 ? (
                <option value="">No departments available — add a department first</option>
              ) : (
                departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} — {d.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Hall Access Code</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  maxLength={10}
                  value={formData.access_code}
                  onChange={(e) => setFormData({ ...formData, access_code: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 font-mono font-bold text-indigo-700 bg-slate-50/60 focus:bg-white transition-colors text-center tracking-wider"
                />
                <button
                  type="button"
                  onClick={handleRegeneratePin}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Generate new random 6-digit access code"
                >
                  <Dices className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Phone Number (Optional)</label>
              <input
                type="tel"
                maxLength={20}
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 bg-slate-50/60 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
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
              disabled={isSubmitting || departments.length === 0}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-2xs disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <span>Save Scholar</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
