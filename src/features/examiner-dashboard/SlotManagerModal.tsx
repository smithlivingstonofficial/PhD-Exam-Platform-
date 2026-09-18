"use client";

import { useState } from "react";
import { X, Layers, Plus } from "lucide-react";
import { 
  updateExamSlotAction, 
  createExamSlotAction, 
  deleteExamSlotAction,
  SerializedExam
} from "@/app/admin/actions";
import { SlotStatus } from "@/types";

interface SlotManagerModalProps {
  isOpen: boolean;
  exam: SerializedExam | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function SlotManagerModal({ isOpen, exam, onClose, onUpdate }: SlotManagerModalProps) {
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlotData, setNewSlotData] = useState({
    slot_name: "Slot 2 - Afternoon Session",
    login_opens_at: "2026-09-20T13:45",
    start_time: "2026-09-20T14:00",
    join_window_closes_at: "2026-09-20T14:15",
    end_time: "2026-09-20T16:00",
    is_retest_slot: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !exam) return null;

  const handleStatusChange = async (slotId: string, newStatus: SlotStatus) => {
    setIsSubmitting(true);
    await updateExamSlotAction(slotId, { status: newStatus });
    setIsSubmitting(false);
    onUpdate();
  };

  const handleDeleteSlot = async (slotId: string, slotName: string) => {
    if (confirm(`Are you sure you want to delete ${slotName}?`)) {
      setIsSubmitting(true);
      await deleteExamSlotAction(slotId);
      setIsSubmitting(false);
      onUpdate();
    }
  };

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    const res = await createExamSlotAction({
      exam_id: exam.id,
      slot_name: newSlotData.slot_name,
      login_opens_at: new Date(newSlotData.login_opens_at).toISOString(),
      start_time: new Date(newSlotData.start_time).toISOString(),
      join_window_closes_at: new Date(newSlotData.join_window_closes_at).toISOString(),
      end_time: new Date(newSlotData.end_time).toISOString(),
      is_retest_slot: newSlotData.is_retest_slot,
    });

    setIsSubmitting(false);
    if (res.success) {
      setIsAddingSlot(false);
      onUpdate();
    } else {
      setErrorMsg(res.error || "Failed to add slot");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Manage Examination Timing Slots</h2>
              <p className="text-xs text-slate-500 font-mono">[{exam.course_code}] {exam.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Slots List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Configured Slots ({exam.slots?.length || 0})
              </span>
              {!isAddingSlot && (
                <button
                  onClick={() => setIsAddingSlot(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-colors shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Slot</span>
                </button>
              )}
            </div>

            {(!exam.slots || exam.slots.length === 0) ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl text-slate-400">
                No slots configured for this exam yet.
              </div>
            ) : (
              <div className="space-y-3">
                {exam.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{slot.slot_name}</span>
                        {slot.is_retest_slot && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                            Re-Exam Slot
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Status:</span>
                        <select
                          value={slot.status}
                          disabled={isSubmitting}
                          onChange={(e) => handleStatusChange(slot.id, e.target.value as SlotStatus)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
                        >
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="LOGIN_OPEN">Check-in Open</option>
                          <option value="IN_PROGRESS">Exam In Progress</option>
                          <option value="CONCLUDED">Concluded</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>

                        {exam.slots.length > 1 && (
                          <button
                            onClick={() => handleDeleteSlot(slot.id, slot.slot_name)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 ml-1"
                            title="Delete Slot"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Timings Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-slate-600">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Check-in Opens</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {new Date(slot.login_opens_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Exam Starts</span>
                        <span className="font-mono text-indigo-700 font-bold">
                          {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Late Join Cutoff</span>
                        <span className="font-mono text-amber-700 font-bold">
                          {new Date(slot.join_window_closes_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Exam Ends</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {new Date(slot.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Slot Form */}
          {isAddingSlot && (
            <form onSubmit={handleCreateSlot} className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3 animate-in fade-in">
              <h3 className="font-bold text-indigo-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" /> Configure Additional Slot
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Slot Name</label>
                  <input
                    type="text"
                    required
                    value={newSlotData.slot_name}
                    onChange={(e) => setNewSlotData({ ...newSlotData, slot_name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <label className="flex items-center gap-2 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSlotData.is_retest_slot}
                      onChange={(e) => setNewSlotData({ ...newSlotData, is_retest_slot: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span>Mark as Re-Exam / Makeup Slot</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Check-in Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newSlotData.login_opens_at}
                    onChange={(e) => setNewSlotData({ ...newSlotData, login_opens_at: e.target.value })}
                    className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newSlotData.start_time}
                    onChange={(e) => setNewSlotData({ ...newSlotData, start_time: e.target.value })}
                    className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Join Cutoff</label>
                  <input
                    type="datetime-local"
                    required
                    value={newSlotData.join_window_closes_at}
                    onChange={(e) => setNewSlotData({ ...newSlotData, join_window_closes_at: e.target.value })}
                    className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={newSlotData.end_time}
                    onChange={(e) => setNewSlotData({ ...newSlotData, end_time: e.target.value })}
                    className="w-full p-1.5 rounded-lg border border-slate-200 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSlot(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save New Slot"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            Close Manager
          </button>
        </div>
      </div>
    </div>
  );
}
