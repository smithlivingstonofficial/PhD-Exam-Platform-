"use client";

import { useState } from "react";
import { MockCandidate } from "@/lib/mock-data";
import { 
  AlertTriangle, 
  Ban, 
  BellRing, 
  Camera 
} from "lucide-react";

interface LiveProctorMonitorProps {
  candidates: MockCandidate[];
  onIssueWarning?: (candidateId: string) => void;
  onDisqualify?: (candidateId: string) => void;
}

export function LiveProctorMonitor({ candidates, onIssueWarning, onDisqualify }: LiveProctorMonitorProps) {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const handleWarning = (cand: MockCandidate) => {
    setAlertMessage(`Dispatched official warning to candidate: ${cand.name}`);
    setTimeout(() => setAlertMessage(null), 4000);
    onIssueWarning?.(cand.id);
  };

  const handleDisqualify = (cand: MockCandidate) => {
    if (confirm(`Are you sure you want to terminate exam for ${cand.name}? This action is irreversible.`)) {
      setAlertMessage(`Terminated candidate session: ${cand.name}`);
      setTimeout(() => setAlertMessage(null), 4000);
      onDisqualify?.(cand.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {alertMessage && (
        <div className="p-3 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4" />
            <span>{alertMessage}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-xs hover:text-white">✕</button>
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
              className={`rounded-xl border p-4 flex flex-col justify-between transition-all bg-neutral-900/60 ${
                isHighRisk
                  ? "border-rose-500/40 bg-rose-950/10 shadow-lg shadow-rose-950/20"
                  : isMediumRisk
                  ? "border-amber-500/30 bg-amber-950/5"
                  : "border-neutral-800"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">{cand.name}</h3>
                  <span className="text-[11px] text-neutral-400 font-mono">{cand.email}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                      isHighRisk
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : isMediumRisk
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {cand.integrity_score}% Integrity
                  </span>
                  <span className="text-[10px] text-neutral-400 mt-0.5">
                    {cand.violation_count} Violations
                  </span>
                </div>
              </div>

              {/* Simulated Candidate Video Feed Thumbnail */}
              <div className="my-3 relative aspect-video rounded-lg bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
                <div className="text-center space-y-1">
                  <div className="w-8 h-8 mx-auto rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                    <Camera className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-neutral-400 block font-mono">Live Edge Stream</span>
                </div>

                {/* Status Overlays */}
                <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ONLINE</span>
                </div>

                {cand.violation_count > 0 && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/80 backdrop-blur-sm text-[10px] text-rose-300 border border-rose-500/40">
                    <AlertTriangle className="w-3 h-3" />
                    <span>FLAGGED</span>
                  </div>
                )}
              </div>

              {/* Recent Incident Telemetry */}
              <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-800 text-[11px] mb-3">
                <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Recent Telemetry</span>
                <span className="text-neutral-300 line-clamp-1 mt-0.5 font-mono">
                  {cand.recent_incident || "Normal candidate behavior detected"}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleWarning(cand)}
                  className="flex-1 py-1.5 px-2 rounded-md bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <BellRing className="w-3 h-3" />
                  <span>Warn</span>
                </button>
                <button
                  onClick={() => handleDisqualify(cand)}
                  className="flex-1 py-1.5 px-2 rounded-md bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  <Ban className="w-3 h-3" />
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
