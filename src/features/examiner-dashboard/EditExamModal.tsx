"use client";

import { useState, useEffect } from "react";
import { X, BookOpen, Shield, Clock, Award } from "lucide-react";
import { updateExamAction, SerializedExam } from "@/app/admin/actions";

interface EditExamModalProps {
  isOpen: boolean;
  exam: SerializedExam | null;
  onClose: () => void;
  onSave: () => void;
}

export function EditExamModal({ isOpen, exam, onClose, onSave }: EditExamModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    course_code: "",
    description: "",
    duration_minutes: 90,
    total_marks: 100,
    passing_marks: 50,
    enable_face_tracking: true,
    enable_audio_monitoring: true,
    max_tab_switches: 3,
    max_fullscreen_exits: 3,
    periodic_snapshot_interval_sec: 60,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!exam) return;
    const timer = setTimeout(() => {
      setFormData({
        title: exam.title,
        course_code: exam.course_code,
        description: exam.description || "",
        duration_minutes: exam.duration_minutes,
        total_marks: exam.total_marks,
        passing_marks: exam.passing_marks,
        enable_face_tracking: exam.anti_cheat_config?.enable_face_tracking ?? true,
        enable_audio_monitoring: exam.anti_cheat_config?.enable_audio_monitoring ?? true,
        max_tab_switches: exam.anti_cheat_config?.max_tab_switches ?? 3,
        max_fullscreen_exits: exam.anti_cheat_config?.max_fullscreen_exits ?? 3,
        periodic_snapshot_interval_sec: exam.anti_cheat_config?.periodic_snapshot_interval_sec ?? 60,
      });
      setErrorMsg("");
    }, 0);
    return () => clearTimeout(timer);
  }, [exam]);

  if (!isOpen || !exam) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.course_code) return;

    setIsSubmitting(true);
    setErrorMsg("");

    const res = await updateExamAction(exam.id, {
      title: formData.title,
      course_code: formData.course_code.toUpperCase().trim(),
      description: formData.description,
      duration_minutes: Number(formData.duration_minutes),
      total_marks: Number(formData.total_marks),
      passing_marks: Number(formData.passing_marks),
      anti_cheat_config: {
        enable_face_tracking: formData.enable_face_tracking,
        enable_audio_monitoring: formData.enable_audio_monitoring,
        max_tab_switches: Number(formData.max_tab_switches),
        max_fullscreen_exits: Number(formData.max_fullscreen_exits),
        periodic_snapshot_interval_sec: Number(formData.periodic_snapshot_interval_sec),
        allowed_yaw_angle_deg: 28,
        allowed_pitch_angle_deg: 20,
      },
    });

    setIsSubmitting(false);

    if (res.success) {
      onSave();
      onClose();
    } else {
      setErrorMsg(res.error || "Failed to update exam");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Edit Examination Details</h2>
              <p className="text-xs text-slate-500 font-mono">Course Code: {exam.course_code}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">Exam Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Course Code *</label>
              <input
                type="text"
                required
                value={formData.course_code}
                onChange={(e) => setFormData({ ...formData, course_code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 text-xs font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Exam Description & Instructions</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 text-xs"
            />
          </div>

          {/* Marks and Timing */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-600" /> Duration (Mins)
              </label>
              <input
                type="number"
                min={15}
                max={360}
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-indigo-600" /> Total Marks
              </label>
              <input
                type="number"
                min={10}
                value={formData.total_marks}
                onChange={(e) => setFormData({ ...formData, total_marks: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" /> Passing Marks
              </label>
              <input
                type="number"
                min={1}
                value={formData.passing_marks}
                onChange={(e) => setFormData({ ...formData, passing_marks: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono font-bold text-emerald-700"
              />
            </div>
          </div>

          {/* Security & Proctoring Settings */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" /> Security & Proctoring Controls
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_face_tracking}
                  onChange={(e) => setFormData({ ...formData, enable_face_tracking: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Camera Proctoring</span>
                  <span className="text-[11px] text-slate-500">Detect absence & head turns</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_audio_monitoring}
                  onChange={(e) => setFormData({ ...formData, enable_audio_monitoring: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Microphone Monitoring</span>
                  <span className="text-[11px] text-slate-500">Detect speech & room noise</span>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Max Tab Switches</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.max_tab_switches}
                  onChange={(e) => setFormData({ ...formData, max_tab_switches: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Max Fullscreen Exits</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.max_fullscreen_exits}
                  onChange={(e) => setFormData({ ...formData, max_fullscreen_exits: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Snapshot Interval (Sec)</label>
                <input
                  type="number"
                  min={15}
                  max={300}
                  value={formData.periodic_snapshot_interval_sec}
                  onChange={(e) => setFormData({ ...formData, periodic_snapshot_interval_sec: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Exam Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
