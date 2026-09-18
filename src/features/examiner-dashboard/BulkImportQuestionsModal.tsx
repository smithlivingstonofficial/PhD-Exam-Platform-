"use client";

import { useState } from "react";
import { X, Upload, Sparkles, FileText } from "lucide-react";
import { bulkImportQuestionsAction, SerializedDepartment } from "@/app/admin/actions";
import { QuestionScope } from "@/types";

interface BulkImportQuestionsModalProps {
  isOpen: boolean;
  examId: string;
  departments: SerializedDepartment[];
  onClose: () => void;
  onImportComplete: () => void;
}

export function BulkImportQuestionsModal({
  isOpen,
  examId,
  departments,
  onClose,
  onImportComplete,
}: BulkImportQuestionsModalProps) {
  const [jsonText, setJsonText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  if (!isOpen) return null;

  const sampleQuestions = [
    {
      scope: "COMMON",
      section_name: "Part A: Research Aptitude",
      question_text: "What is the primary objective of exploratory scientific research?",
      options: [
        { id: "a", text: "To gain familiarity with a phenomenon or formulate a hypothesis" },
        { id: "b", text: "To definitively test causal relationships without prior observation" },
        { id: "c", text: "To verify demographic census data at scale" },
        { id: "d", text: "To eliminate all experimental error through random assignment" }
      ],
      correct_answers: ["a"],
      marks: 4,
      negative_marks: 1
    },
    {
      scope: "DEPARTMENT_SPECIFIC",
      department_code: departments[0]?.code || "CSE",
      section_name: "Part B: Core Subject",
      question_text: "Which data structure provides constant amortized time O(1) for insert and lookup operations?",
      options: [
        { id: "a", text: "Hash Table" },
        { id: "b", text: "Red-Black Tree" },
        { id: "c", text: "Binary Search Tree" },
        { id: "d", text: "Min Heap" }
      ],
      correct_answers: ["a"],
      marks: 4,
      negative_marks: 1
    }
  ];

  const handleLoadSample = () => {
    setJsonText(JSON.stringify(sampleQuestions, null, 2));
  };

  const handleImport = async () => {
    if (!jsonText.trim()) return;
    setIsSubmitting(true);
    setSuccessCount(null);

    try {
      const parsed = JSON.parse(jsonText);
      if (!Array.isArray(parsed)) {
        alert("The input must be a valid list of question items.");
        setIsSubmitting(false);
        return;
      }

      const formatted = parsed.map((q) => ({
        scope: (q.scope === "COMMON" ? "COMMON" : "DEPARTMENT_SPECIFIC") as QuestionScope,
        department_code: q.department_code,
        section_name: q.section_name,
        question_text: q.question_text || "",
        options: q.options || [],
        correct_answers: q.correct_answers || ["a"],
        marks: Number(q.marks) || 4,
        negative_marks: Number(q.negative_marks) || 0,
        explanation: q.explanation || "",
      }));

      const res = await bulkImportQuestionsAction(examId, formatted);
      setIsSubmitting(false);

      if (res.success) {
        setSuccessCount(res.count);
        onImportComplete();
      } else {
        alert("Unable to save questions: " + res.error);
      }
    } catch {
      alert("Format error. Please verify the question list structure or click 'Load Example Questions'.");
      setIsSubmitting(false);
    }
  };

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
              <h2 className="text-base font-bold text-slate-900">Bulk Add Questions</h2>
              <p className="text-xs text-slate-500">Paste questions for Part A and Part B using the standard template</p>
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
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" /> Standard Question Template
            </span>
            <button
              type="button"
              onClick={handleLoadSample}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline"
            >
              <Sparkles className="w-3 h-3" /> Load Example Questions
            </button>
          </div>

          <div>
            <textarea
              rows={10}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste questions here in the template format..."
              className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 bg-slate-50/50"
            />
          </div>

          {successCount !== null && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <span>Successfully added {successCount} questions to the exam bank!</span>
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
            {successCount !== null ? "Done" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isSubmitting || !jsonText.trim()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>{isSubmitting ? "Saving..." : "Save Questions to Bank"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
