"use client";

import { useState } from "react";
import { X, Sparkles, Shield, Camera, Mic } from "lucide-react";

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (examData: {
    title: string;
    course_code: string;
    description: string;
    duration_minutes: number;
    total_marks: number;
    passing_marks: number;
    start_time: string;
    end_time: string;
    anti_cheat_config: {
      enable_face_tracking: boolean;
      enable_audio_monitoring: boolean;
      max_tab_switches: number;
      max_fullscreen_exits: number;
      periodic_snapshot_interval_sec: number;
      allowed_yaw_angle_deg: number;
      allowed_pitch_angle_deg: number;
    };
  }) => void;
}

export function CreateExamModal({ isOpen, onClose, onCreate }: CreateExamModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    course_code: "",
    description: "",
    duration_minutes: 90,
    total_marks: 100,
    passing_marks: 50,
    start_time: "2026-09-20T10:00",
    end_time: "2026-09-20T12:00",
    enable_face_tracking: true,
    enable_audio_monitoring: true,
    max_tab_switches: 3,
    max_fullscreen_exits: 3,
    periodic_snapshot_interval_sec: 60,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.course_code) return;

    onCreate({
      title: formData.title,
      course_code: formData.course_code.toUpperCase(),
      description: formData.description,
      duration_minutes: Number(formData.duration_minutes),
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
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

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create New Examination</h2>
              <p className="text-xs text-slate-500">Configure schedule, syllabus, and proctoring parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Basic Exam Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>1. Examination Essentials</span>
            </h3>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Examination Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ph.D Coursework: Computational Complexity & Graph Theory"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Course Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PHD-CS-902"
                  value={formData.course_code}
                  onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Duration (Minutes) *</label>
                <input
                  type="number"
                  required
                  min={15}
                  max={360}
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Total Marks</label>
                <input
                  type="number"
                  min={10}
                  value={formData.total_marks}
                  onChange={(e) => setFormData({ ...formData, total_marks: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Passing Marks</label>
                <input
                  type="number"
                  min={1}
                  value={formData.passing_marks}
                  onChange={(e) => setFormData({ ...formData, passing_marks: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Scope & Instructions</label>
              <textarea
                rows={2}
                placeholder="Guidelines, reference materials allowed, or topic coverage..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white resize-none"
              />
            </div>
          </div>

          {/* Anti-Cheat Policies Configurator */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>2. AI Proctoring & Anti-Cheat Protocols</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">Edge-AI Enforced</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Face Tracking Toggle */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-200 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.enable_face_tracking}
                  onChange={(e) => setFormData({ ...formData, enable_face_tracking: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="flex items-center gap-1 text-slate-900 font-semibold">
                    <Camera className="w-3.5 h-3.5 text-indigo-600" />
                    <span>MediaPipe Face AI</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Detect absence, multiple people, and head turning</p>
                </div>
              </label>

              {/* Audio VAD Toggle */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-indigo-200 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={formData.enable_audio_monitoring}
                  onChange={(e) => setFormData({ ...formData, enable_audio_monitoring: e.target.checked })}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <div className="flex items-center gap-1 text-slate-900 font-semibold">
                    <Mic className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Silero Audio VAD</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Detect unauthorized speech and room noise</p>
                </div>
              </label>
            </div>

            {/* Threshold limits */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">Max Tab Switches</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.max_tab_switches}
                  onChange={(e) => setFormData({ ...formData, max_tab_switches: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Max Fullscreen Exits</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.max_fullscreen_exits}
                  onChange={(e) => setFormData({ ...formData, max_fullscreen_exits: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-medium mb-1">Snapshot Cadence (s)</label>
                <input
                  type="number"
                  min={15}
                  max={300}
                  value={formData.periodic_snapshot_interval_sec}
                  onChange={(e) => setFormData({ ...formData, periodic_snapshot_interval_sec: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              Save to Supabase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
