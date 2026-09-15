"use client";

import { useState, useEffect } from "react";
import { getAdminOverviewData, SerializedCandidate } from "@/app/admin/actions";
import { Search, Mail, RefreshCw } from "lucide-react";

export default function CandidatesRegistryPage() {
  const [candidates, setCandidates] = useState<SerializedCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.exam_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Candidate & Scholar Registry</h1>
          <p className="text-xs text-slate-500">View enrolled research scholars, exam sessions, and cumulative integrity records from Supabase</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs transition-colors shadow-2xs"
            title="Refresh candidates"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-600" : ""}`} />
          </button>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search scholars..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 shadow-2xs"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading candidate records from Supabase...</div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Scholar Name</th>
                <th className="py-3.5 px-4">Exam Session</th>
                <th className="py-3.5 px-4">Session Status</th>
                <th className="py-3.5 px-4">Violations</th>
                <th className="py-3.5 px-4">Integrity Rating</th>
                <th className="py-3.5 px-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    No candidate sessions recorded in the database yet.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">{c.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-indigo-700 font-bold">{c.exam_id}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          c.status === "SUBMITTED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : c.status === "DISQUALIFIED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">{c.violation_count}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          c.integrity_score >= 90
                            ? "text-emerald-700 bg-emerald-50"
                            : c.integrity_score >= 75
                            ? "text-amber-700 bg-amber-50"
                            : "text-rose-700 bg-rose-50"
                        }`}
                      >
                        {c.integrity_score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {c.final_score !== null ? `${c.final_score} / 100` : "In Progress"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
