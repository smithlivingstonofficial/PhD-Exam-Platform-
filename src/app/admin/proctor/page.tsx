"use client";

import { useState, useEffect } from "react";
import { 
  getAdminOverviewData, 
  issueWarningAction, 
  terminateSessionAction, 
  SerializedCandidate 
} from "@/app/admin/actions";
import { LiveProctorMonitor } from "@/features/examiner-dashboard";
import { Filter, AlertTriangle, RefreshCw } from "lucide-react";

export default function LiveProctorPage() {
  const [candidates, setCandidates] = useState<SerializedCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterRisk, setFilterRisk] = useState<"ALL" | "FLAGGED" | "CLEAN">("ALL");

  useEffect(() => {
    let ignore = false;
    async function init() {
      const data = await getAdminOverviewData();
      if (!ignore) {
        setCandidates(data.candidates);
        setIsLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    const data = await getAdminOverviewData();
    setCandidates(data.candidates);
    setIsLoading(false);
  };

  const handleIssueWarning = async (sessionId: string) => {
    await issueWarningAction(sessionId);
    await handleRefresh();
  };

  const handleDisqualify = async (sessionId: string) => {
    await terminateSessionAction(sessionId);
    await handleRefresh();
  };

  const filteredCandidates = candidates.filter((c) => {
    if (filterRisk === "FLAGGED") return c.violation_count > 0 || c.integrity_score < 80;
    if (filterRisk === "CLEAN") return c.violation_count === 0 && c.integrity_score >= 80;
    return true;
  });

  const highRiskCount = candidates.filter((c) => c.integrity_score < 75).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Live Proctoring Command Center</h1>
          </div>
          <p className="text-xs text-slate-500">
            Monitor real-time candidate behavior, head pose telemetry, and audio environment violations from Supabase
          </p>
        </div>

        {/* Status Pill & Refresh */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors shadow-2xs"
            title="Refresh candidate sessions"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
          {highRiskCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold shadow-2xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{highRiskCount} Candidates Require Attention</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-600 font-medium">Filter by Risk:</span>
          {(["ALL", "FLAGGED", "CLEAN"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterRisk(tab)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                filterRisk === tab
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-mono font-medium">
          Showing {filteredCandidates.length} of {candidates.length} active scholars in Supabase
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="p-12 text-center border border-slate-200 rounded-2xl bg-white text-xs text-slate-400">
          Loading active candidate sessions from Supabase PostgreSQL...
        </div>
      ) : (
        <LiveProctorMonitor
          candidates={filteredCandidates}
          onIssueWarning={handleIssueWarning}
          onDisqualify={handleDisqualify}
        />
      )}
    </div>
  );
}
