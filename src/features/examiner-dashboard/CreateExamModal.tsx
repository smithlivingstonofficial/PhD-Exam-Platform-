"use client";

import { useState } from "react";
import { MockExam, DEFAULT_ANTI_CHEAT_CONFIG } from "@/lib/mock-data";
import { X, Sparkles, Shield, Camera, Mic } from "lucide-react";

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (exam: MockExam) => void;
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

    const newExam: MockExam = {
      id: `exam-${Date.now()}`,
      title: formData.title,
      course_code: formData.course_code.toUpperCase(),
      description: formData.description,
      duration_minutes: Number(formData.duration_minutes),
      start_time: new Date(formData.start_time).toISOString(),
      end_time: new Date(formData.end_time).toISOString(),
      total_marks: Number(formData.total_marks),
      passing_marks: Number(formData.passing_marks),
      is_published: false,
      total_candidates: 0,
      total_questions: 0,
      created_at: new Date().toISOString(),
      anti_cheat_config: {
        ...DEFAULT_ANTI_CHEAT_CONFIG,
        enable_face_tracking: formData.enable_face_tracking,
        enable_audio_monitoring: formData.enable_audio_monitoring,
        max_tab_switches: Number(formData.max_tab_switches),
        max_fullscreen_exits: Number(formData.max_fullscreen_exits),
        periodic_snapshot_interval_sec: Number(formData.periodic_snapshot_interval_sec),
      },
    };

    onCreate(newExam);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Create New Ph.D Examination</h2>
              <p className="text-xs text-neutral-400">Configure schedule, syllabus, and proctoring parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Basic Exam Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>1. Examination Essentials</span>
            </h3>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Examination Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ph.D Coursework: Computational Complexity & Graph Theory"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Course Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PHD-CS-902"
                  value={formData.course_code}
                  onChange={(e) => setFormData({ ...formData, course_code: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Duration (Minutes) *</label>
                <input
                  type="number"
                  required
                  min={15}
                  max={360}
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Total Marks</label>
                <input
                  type="number"
                  min={10}
                  value={formData.total_marks}
                  onChange={(e) => setFormData({ ...formData, total_marks: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Passing Marks</label>
                <input
                  type="number"
                  min={1}
                  value={formData.passing_marks}
                  onChange={(e) => setFormData({ ...formData, passing_marks: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">Scope & Instructions</label>
              <textarea
                rows={2}
                placeholder="Guidelines, reference materials allowed, or topic coverage..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Anti-Cheat Policies Configurator */}
          <div className="space-y-4 pt-4 border-t border-neutral-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>2. AI Proctoring & Anti-Cheat Protocols</span>
              </h3>
              <span className="text-[10px] text-neutral-400 font-mono">Edge-AI Enforced</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Face Tracking Toggle */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_face_tracking}
                  onChange={(e) => setFormData({ ...formData, enable_face_tracking: e.target.checked })}
                  className="mt-0.5 rounded border-neutral-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="flex items-center gap-1 text-white font-medium">
                    <Camera className="w-3.5 h-3.5 text-indigo-400" />
                    <span>MediaPipe Face AI</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Detect absence, multiple people, and head turning</p>
                </div>
              </label>

              {/* Audio VAD Toggle */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_audio_monitoring}
                  onChange={(e) => setFormData({ ...formData, enable_audio_monitoring: e.target.checked })}
                  className="mt-0.5 rounded border-neutral-700 text-indigo-600 focus:ring-0"
                />
                <div>
                  <div className="flex items-center gap-1 text-white font-medium">
                    <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Silero Audio VAD</span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Detect unauthorized speech and room noise</p>
                </div>
              </label>
            </div>

            {/* Threshold limits */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Max Tab Switches</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.max_tab_switches}
                  onChange={(e) => setFormData({ ...formData, max_tab_switches: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Max Fullscreen Exits</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={formData.max_fullscreen_exits}
                  onChange={(e) => setFormData({ ...formData, max_fullscreen_exits: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-neutral-300 font-medium mb-1">Snapshot Cadence (Sec)</label>
                <input
                  type="number"
                  min={15}
                  max={300}
                  value={formData.periodic_snapshot_interval_sec}
                  onChange={(e) => setFormData({ ...formData, periodic_snapshot_interval_sec: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-500/20"
            >
              Create Examination
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
