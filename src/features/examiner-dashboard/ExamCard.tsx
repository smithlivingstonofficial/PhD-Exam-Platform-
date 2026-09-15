import Link from "next/link";
import { SerializedExam } from "@/app/admin/actions";
import { Clock, Award, Users, Camera, Mic, ShieldAlert, ArrowUpRight, HelpCircle } from "lucide-react";

interface ExamCardProps {
  exam: SerializedExam;
  onTogglePublish?: (id: string, currentPublished: boolean) => void;
}

export function ExamCard({ exam, onTogglePublish }: ExamCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 flex flex-col justify-between hover:border-indigo-200 hover:shadow-md transition-all shadow-xs group">
      <div className="space-y-4">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200/80">
            {exam.course_code}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                exam.is_published
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {exam.is_published ? "Published" : "Draft"}
            </span>
          </div>
        </div>

        {/* Title and Description */}
        <div>
          <h2 className="text-base font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
            {exam.title}
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
            {exam.description || "No specific instructions provided."}
          </p>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-slate-600">
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{exam.duration_minutes} mins</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Award className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">Pass: {exam.passing_marks}/{exam.total_marks}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium">{exam.total_candidates} scholars</span>
          </div>
        </div>

        {/* Anti-Cheat Policies Active */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
          <span className="font-semibold text-slate-700">Security Protocols:</span>
          <div className="flex items-center gap-2 font-medium">
            {exam.anti_cheat_config?.enable_face_tracking && (
              <span className="flex items-center gap-1 text-indigo-600" title="Visual AI Active">
                <Camera className="w-3 h-3" /> Face
              </span>
            )}
            {exam.anti_cheat_config?.enable_audio_monitoring && (
              <span className="flex items-center gap-1 text-emerald-600" title="Audio VAD Active">
                <Mic className="w-3 h-3" /> Audio
              </span>
            )}
            <span className="flex items-center gap-1 text-amber-600" title="Max Tab Switches">
              <ShieldAlert className="w-3 h-3" /> {exam.anti_cheat_config?.max_tab_switches ?? 3} Tabs
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <Link
          href={`/admin/questions?examId=${exam.id}`}
          className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Questions ({exam.total_questions})</span>
        </Link>

        <div className="flex items-center gap-2">
          {onTogglePublish && (
            <button
              onClick={() => onTogglePublish(exam.id, exam.is_published)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
            >
              {exam.is_published ? "Unpublish" : "Publish"}
            </button>
          )}
          <Link
            href={`/admin/proctor?examId=${exam.id}`}
            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs"
          >
            <span>Live Monitor</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
