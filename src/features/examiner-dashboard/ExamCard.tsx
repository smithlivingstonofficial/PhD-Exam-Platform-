import Link from "next/link";
import { MockExam } from "@/lib/mock-data";
import { Clock, Award, Users, Camera, Mic, ShieldAlert, ArrowUpRight, HelpCircle } from "lucide-react";

interface ExamCardProps {
  exam: MockExam;
  onTogglePublish?: (id: string) => void;
}

export function ExamCard({ exam, onTogglePublish }: ExamCardProps) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-6 flex flex-col justify-between hover:border-neutral-700 transition-all shadow-sm">
      <div className="space-y-4">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs px-2.5 py-1 rounded bg-neutral-800 text-indigo-400 font-semibold border border-neutral-700">
            {exam.course_code}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                exam.is_published
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}
            >
              {exam.is_published ? "Published" : "Draft"}
            </span>
          </div>
        </div>

        {/* Title and Description */}
        <div>
          <h2 className="text-base font-bold text-white leading-snug line-clamp-2">{exam.title}</h2>
          <p className="text-xs text-neutral-400 mt-1.5 line-clamp-2 leading-relaxed">{exam.description}</p>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-800/80 text-neutral-300">
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>{exam.duration_minutes} mins</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Award className="w-3.5 h-3.5 text-neutral-400" />
            <span>Pass: {exam.passing_marks}/{exam.total_marks}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5 text-neutral-400" />
            <span>{exam.total_candidates} candidates</span>
          </div>
        </div>

        {/* Anti-Cheat Policies Active */}
        <div className="p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-800/60 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="font-medium">Active Security:</span>
          <div className="flex items-center gap-2">
            {exam.anti_cheat_config.enable_face_tracking && (
              <span className="flex items-center gap-1 text-blue-400" title="Visual AI Active">
                <Camera className="w-3 h-3" /> Face
              </span>
            )}
            {exam.anti_cheat_config.enable_audio_monitoring && (
              <span className="flex items-center gap-1 text-emerald-400" title="Audio VAD Active">
                <Mic className="w-3 h-3" /> Audio
              </span>
            )}
            <span className="flex items-center gap-1 text-amber-400" title="Max Tab Switches Allowed">
              <ShieldAlert className="w-3 h-3" /> {exam.anti_cheat_config.max_tab_switches} Tabs
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
        <Link
          href={`/admin/questions?examId=${exam.id}`}
          className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Questions ({exam.total_questions})</span>
        </Link>

        <div className="flex items-center gap-2">
          {onTogglePublish && (
            <button
              onClick={() => onTogglePublish(exam.id)}
              className="text-xs px-2.5 py-1.5 rounded-md border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              {exam.is_published ? "Unpublish" : "Publish"}
            </button>
          )}
          <Link
            href={`/admin/proctor?examId=${exam.id}`}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm"
          >
            <span>Live Monitor</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
