"use client";

import { useState } from "react";
import { X, Upload, CheckCircle2, AlertCircle, FileText, Sparkles } from "lucide-react";
import { bulkImportStudentsAction, SerializedDepartment } from "@/app/admin/actions";

interface BulkImportStudentsModalProps {
  isOpen: boolean;
  departments: SerializedDepartment[];
  onClose: () => void;
  onImportComplete: () => void;
}

export function BulkImportStudentsModal({
  isOpen,
  departments,
  onClose,
  onImportComplete,
}: BulkImportStudentsModalProps) {
  const [csvText, setCsvText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultSummary, setResultSummary] = useState<{
    inserted: number;
    duplicate: number;
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  const sampleTemplate = `PHD26-CSE-101,Aarav Sen,aarav.sen@univ.edu,CSE,9876543210
PHD26-MECH-102,Meera Krishnan,meera.k@univ.edu,MECH,9876543211
PHD26-ECE-103,Rohan Gupta,rohan.g@univ.edu,ECE,9876543212
PHD26-MATH-104,Nisha Roy,nisha.r@univ.edu,MATH,9876543213`;

  const handleLoadSample = () => {
    setCsvText(sampleTemplate);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setCsvText(text);
    };
    reader.readAsText(file);
  };

  const handleParseAndSubmit = async () => {
    if (!csvText.trim()) return;
    setIsSubmitting(true);
    setResultSummary(null);

    const lines = csvText.trim().split("\n");
    const parsedStudents: Array<{
      reg_number: string;
      full_name: string;
      email: string;
      department_code: string;
      phone?: string;
    }> = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // Skip header row if present
      if (i === 0 && (line.toLowerCase().includes("reg") || line.toLowerCase().includes("email"))) {
        continue;
      }

      // Comma or Tab delimiter
      const parts = line.includes("\t") ? line.split("\t") : line.split(",");
      if (parts.length >= 4) {
        parsedStudents.push({
          reg_number: parts[0]?.trim() || "",
          full_name: parts[1]?.trim() || "",
          email: parts[2]?.trim() || "",
          department_code: parts[3]?.trim() || "",
          phone: parts[4]?.trim() || "",
        });
      }
    }

    if (parsedStudents.length === 0) {
      alert("No valid scholar rows detected. Ensure columns: reg_number, full_name, email, department_code, phone");
      setIsSubmitting(false);
      return;
    }

    const res = await bulkImportStudentsAction(parsedStudents);
    setIsSubmitting(false);

    if (res.success) {
      setResultSummary({
        inserted: res.insertedCount,
        duplicate: res.duplicateCount,
        errors: res.errors,
      });
      onImportComplete();
    } else {
      alert("Import failed: " + (res.errors[0] || "Unknown error"));
    }
  };

  const deptCodes = departments.map((d) => d.code).join(", ");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-2xs">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Bulk Import Research Scholars</h2>
              <p className="text-xs text-slate-500">Paste CSV / TSV roster or upload spreadsheet file</p>
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
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Format Guide */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-600" /> Expected Column Order:
              </span>
              <button
                type="button"
                onClick={handleLoadSample}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline"
              >
                <Sparkles className="w-3 h-3" /> Load Sample Roster
              </button>
            </div>
            <code className="block font-mono text-[11px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200/80">
              reg_number, full_name, email, department_code, phone
            </code>
            <p className="text-[11px] text-slate-500">
              Available Department Codes: <span className="font-mono font-bold text-indigo-700">{deptCodes || "None configured"}</span>
            </p>
          </div>

          {/* File Upload Option */}
          <div className="flex items-center gap-3">
            <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-2">
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Choose .CSV file</span>
              <input type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} className="hidden" />
            </label>
            <span className="text-xs text-slate-400">or paste directly below</span>
          </div>

          {/* Textarea */}
          <div>
            <textarea
              rows={8}
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={`PHD26-CSE-101,Aarav Sen,aarav.sen@univ.edu,CSE,9876543210\nPHD26-MECH-102,Meera Krishnan,meera.k@univ.edu,MECH,9876543211`}
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
            />
          </div>

          {/* Result Summary */}
          {resultSummary && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Import Completed Successfully!</span>
              </div>
              <div className="flex items-center gap-4 text-emerald-800">
                <span>Inserted: <strong>{resultSummary.inserted}</strong> scholars</span>
                <span>Skipped (Duplicates): <strong>{resultSummary.duplicate}</strong></span>
              </div>
              {resultSummary.errors.length > 0 && (
                <div className="pt-2 border-t border-emerald-200/80 text-rose-700 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Row Warnings:
                  </span>
                  {resultSummary.errors.slice(0, 3).map((err, i) => (
                    <p key={i} className="text-[11px] font-mono">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            {resultSummary ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleParseAndSubmit}
            disabled={isSubmitting || !csvText.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{isSubmitting ? "Importing Roster..." : "Parse & Import Scholars"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
