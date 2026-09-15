"use client";

import { useState } from "react";
import { INITIAL_MOCK_CANDIDATES } from "@/lib/mock-data";
import { Search, Mail } from "lucide-react";

export default function CandidatesRegistryPage() {
  const [search, setSearch] = useState("");
  const candidates = INITIAL_MOCK_CANDIDATES;

  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Candidate & Scholar Registry</h1>
          <p className="text-xs text-neutral-400">View enrolled research candidates, exam sessions, and cumulative integrity records</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search scholars..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-950/80 border-b border-neutral-800 text-neutral-400 font-medium">
            <tr>
              <th className="py-3 px-4">Scholar Name</th>
              <th className="py-3 px-4">Exam Session</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Violations</th>
              <th className="py-3 px-4">Integrity Rating</th>
              <th className="py-3 px-4 text-right">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-neutral-900/60 transition-colors">
                <td className="py-3.5 px-4">
                  <span className="font-semibold text-white block">{c.name}</span>
                  <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-neutral-500" /> {c.email}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-400">{c.exam_id}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                      c.status === "SUBMITTED"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : c.status === "DISQUALIFIED"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-mono">{c.violation_count}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`text-xs font-bold ${
                      c.integrity_score >= 90
                        ? "text-emerald-400"
                        : c.integrity_score >= 75
                        ? "text-amber-400"
                        : "text-rose-400"
                    }`}
                  >
                    {c.integrity_score}%
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-neutral-100">
                  {c.final_score !== null ? `${c.final_score} / 100` : "In Progress"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
