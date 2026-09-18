"use client";

import { useState, useEffect } from "react";
import { X, ShieldAlert, Clock, Camera } from "lucide-react";
import { getCandidateAuditLogsAction, SerializedAuditLog } from "@/app/admin/actions";

interface CandidateIncidentModalProps {
  isOpen: boolean;
  sessionId: string | null;
  candidateName: string;
  onClose: () => void;
}

export function CandidateIncidentModal({
  isOpen,
  sessionId,
  candidateName,
  onClose,
}: CandidateIncidentModalProps) {
  const [logs, setLogs] = useState<SerializedAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    let isMounted = true;
    getCandidateAuditLogsAction(sessionId).then((result) => {
      if (isMounted) {
        setLogs(result);
        setIsLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  const getFriendlyEventName = (eventType: string) => {
    switch (eventType) {
      case "TAB_SWITCH":
        return "Browser Tab Switched / Window Minimized";
      case "FULLSCREEN_EXIT":
        return "Exited Fullscreen Exam Window";
      case "FACE_ABSENT":
        return "No Face Detected on Camera";
      case "MULTIPLE_FACES":
        return "Multiple People Detected in Frame";
      case "HEAD_TURNED":
        return "Looking Away from Screen";
      case "SPEECH_DETECTED":
        return "Human Voice / Conversation Detected";
      case "PROCTOR_WARNING_DISPATCHED":
        return "Examiner Issued Direct Warning";
      case "SESSION_TERMINATED_BY_EXAMINER":
        return "Exam Disqualified by Invigilator";
      case "SCORE_OVERRIDDEN_BY_COMMITTEE":
        return "Marks Adjusted by Committee";
      default:
        return eventType.replace(/_/g, " ");
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "HIGH":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "MEDIUM":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-2xs">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Security & Proctoring Incidents</h2>
              <p className="text-xs text-slate-500">Candidate: {candidateName}</p>
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
        <div className="p-6 overflow-y-auto space-y-3 text-xs">
          {isLoading ? (
            <div className="py-12 text-center text-slate-400">Loading incident records...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                ✓
              </div>
              <p className="font-bold text-slate-800">Clean Proctoring Record</p>
              <p className="text-slate-500 text-[11px]">No infractions or security flags recorded for this candidate.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(
                          log.severity
                        )}`}
                      >
                        {log.severity}
                      </span>
                      <span className="font-bold text-slate-900">
                        {getFriendlyEventName(log.event_type)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* Details note */}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-[11px] text-slate-600 pl-2 border-l-2 border-slate-200">
                      {(log.details as { reason?: string })?.reason || JSON.stringify(log.details)}
                    </p>
                  )}

                  {/* Evidence Snapshot thumbnail if present */}
                  {log.evidence_snapshot_url && (
                    <div className="pt-2 flex items-center gap-2">
                      <div className="w-16 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                        <img
                          src={log.evidence_snapshot_url}
                          alt="Webcam snapshot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <a
                        href={log.evidence_snapshot_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>View Snapshot Photo</span>
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
