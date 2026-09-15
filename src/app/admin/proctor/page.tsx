"use client";

import { useState } from "react";
import { INITIAL_MOCK_CANDIDATES } from "@/lib/mock-data";
import { LiveProctorMonitor } from "@/features/examiner-dashboard";
import { Filter, AlertTriangle } from "lucide-react";

export default function LiveProctorPage() {
  const [candidates, setCandidates] = useState(INITIAL_MOCK_CANDIDATES);
  const [filterRisk, setFilterRisk] = useState<"ALL" | "FLAGGED" | "CLEAN">("ALL");

  const handleIssueWarning = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, violation_count: c.violation_count + 1, integrity_score: Math.max(0, c.integrity_score - 10) } : c))
    );
  };

  const handleDisqualify = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: "DISQUALIFIED", integrity_score: 0 } : c))
    );
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
            <h1 className="text-xl font-bold text-white">Live Proctoring Command Center</h1>
          </div>
          <p className="text-xs text-neutral-400">
            Monitor real-time candidate behavior, head pose telemetry, and audio environment violations
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-3">
          {highRiskCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{highRiskCount} Candidates Require Attention</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-xs text-neutral-400 font-medium">Filter by Risk:</span>
          {(["ALL", "FLAGGED", "CLEAN"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterRisk(tab)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterRisk === tab
                  ? "bg-neutral-800 text-white border border-neutral-700"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="text-xs text-neutral-400 font-mono">
          Showing {filteredCandidates.length} of {candidates.length} active scholars
        </div>
      </div>

      {/* Grid */}
      <LiveProctorMonitor
        candidates={filteredCandidates}
        onIssueWarning={handleIssueWarning}
        onDisqualify={handleDisqualify}
      />
    </div>
  );
}
