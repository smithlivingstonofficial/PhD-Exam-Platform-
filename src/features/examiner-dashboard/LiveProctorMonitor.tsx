"use client";

import { useState } from "react";
import { SerializedCandidate } from "@/app/admin/actions";
import { 
  AlertTriangle, 
  Ban, 
  BellRing, 
  Camera 
} from "lucide-react";

interface LiveProctorMonitorProps {
  candidates: SerializedCandidate[];
  onIssueWarning?: (candidateId: string) => void;
  onDisqualify?: (candidateId: string) => void;
}

export function LiveProctorMonitor({ candidates, onIssueWarning, onDisqualify }: LiveProctorMonitorProps) {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const handleWarning = (cand: SerializedCandidate) => {
    setAlertMessage(`Dispatched official warning to scholar: ${cand.name}`);
    setTimeout(() => setAlertMessage(null), 4000);
    onIssueWarning?.(cand.id);
  };

  const handleDisqualify = (cand: SerializedCandidate) => {
    if (confirm(`Are you sure you want to terminate exam for ${cand.name}? This action will immediately disqualify the candidate.`)) {
      setAlertMessage(`Terminated candidate session: ${cand.name}`);
      setTimeout(() => setAlertMessage(null), 4000);
      onDisqualify?.(cand.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {alertMessage && (
        <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <BellRing className="w-4 h-4 text-indigo-600" />
            <span>{alertMessage}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-xs text-slate-500 hover:text-slate-800 font-bold">✕</button>
        </div>
      )}

      {/* Candidate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((cand) => {
          const isHighRisk = cand.integrity_score < 75;
          const isMediumRisk = cand.integrity_score >= 75 && cand.integrity_score < 90;

          return (
            <div
              key={cand.id}
              className={`rounded-2xl border p-5 flex flex-col justify-between transition-all bg-white shadow-xs hover:shadow-md ${
                isHighRisk
                  ? "border-rose-300 bg-rose-50/20 ring-1 ring-rose-300"
                  : isMediumRisk
                  ? "border-amber-300 bg-amber-50/20"
                  : "border-slate-200/90"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{cand.name}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">{cand.email}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      isHighRisk
                        ? "bg-rose-50 text-rose-700 border-rose-200"
                        : isMediumRisk
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {cand.integrity_score}% Integrity
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5 font-medium">
                    {cand.violation_count} Infractions
                  </span>
                </div>
              </div>

              {/* Video Feed Thumbnail */}
              <div className="my-3.5 relative aspect-video rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                <div className="text-center space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-full bg-white shadow-xs flex items-center justify-center text-slate-500">
                    <Camera className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-[10px] text-slate-500 block font-mono font-medium">Live Edge Feed</span>
                </div>

                {/* Status Overlays */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-[10px] font-bold text-emerald-700 border border-emerald-200 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ONLINE</span>
                </div>

                {cand.violation_count > 0 && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-[10px] font-bold text-rose-700 border border-rose-200 shadow-xs">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    <span>FLAGGED</span>
                  </div>
                )}
              </div>

              {/* Recent Incident Telemetry */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-3.5">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Live AI Telemetry</span>
                <span className="text-slate-800 line-clamp-1 mt-0.5 font-mono text-[11px]">
                  {cand.recent_incident || "Pristine behavior detected"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleWarning(cand)}
                  className="flex-1 py-2 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Issue Warning</span>
                </button>
                <button
                  onClick={() => handleDisqualify(cand)}
                  className="flex-1 py-2 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Terminate</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
