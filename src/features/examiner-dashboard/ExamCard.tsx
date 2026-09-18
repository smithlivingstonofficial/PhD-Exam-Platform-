import Link from "next/link";
import { SerializedExam } from "@/app/admin/actions";
import { 
  Clock, 
  Award, 
  Users, 
  Camera, 
  Mic, 
  ShieldAlert, 
  ArrowUpRight, 
  HelpCircle, 
  Layers, 
  Edit, 
  CalendarDays, 
  Trash2 
} from "lucide-react";

interface ExamCardProps {
  exam: SerializedExam;
  onTogglePublish?: (id: string, currentPublished: boolean) => void;
  onEdit?: (exam: SerializedExam) => void;
  onManageSlots?: (exam: SerializedExam) => void;
  onDelete?: (id: string, title: string) => void;
}

export function ExamCard({ 
  exam, 
  onTogglePublish, 
  onEdit, 
  onManageSlots, 
  onDelete 
}: ExamCardProps) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 flex flex-col justify-between hover:border-indigo-200 hover:shadow-xs transition-all shadow-2xs group">
      <div className="space-y-2.5">
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold border border-slate-200/80">
            {exam.course_code}
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
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
          <h2 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {exam.title}
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 leading-relaxed">
            {exam.description || "No specific instructions provided."}
          </p>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-slate-600">
          <div className="flex items-center gap-1 text-[11px]">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="font-medium">{exam.duration_minutes}m</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <Award className="w-3 h-3 text-slate-400" />
            <span className="font-medium">Pass {exam.passing_marks}/{exam.total_marks}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px]">
            <Users className="w-3 h-3 text-slate-400" />
            <span className="font-medium">{exam.total_candidates} scholars</span>
          </div>
        </div>

        {/* Exam Slots Active */}
        {exam.slots && exam.slots.length > 0 && (
          <div className="pt-1.5 border-t border-slate-100 flex flex-wrap items-center gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Layers className="w-2.5 h-2.5 text-indigo-600" /> Slots:
            </span>
            {exam.slots.map((s) => (
              <span
                key={s.id}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                  s.is_retest_slot
                    ? "bg-violet-50 text-violet-700 border-violet-200"
                    : "bg-slate-50 text-slate-700 border-slate-200"
                }`}
              >
                {s.slot_name}
              </span>
            ))}
          </div>
        )}

        {/* Anti-Cheat Policies Active */}
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[10px] text-slate-600">
          <span className="font-semibold text-slate-700">Proctoring:</span>
          <div className="flex items-center gap-2 font-medium">
            {exam.anti_cheat_config?.enable_face_tracking && (
              <span className="flex items-center gap-1 text-indigo-600" title="Automated Camera Monitoring Active">
                <Camera className="w-2.5 h-2.5" /> Camera
              </span>
            )}
            {exam.anti_cheat_config?.enable_audio_monitoring && (
              <span className="flex items-center gap-1 text-emerald-600" title="Automated Microphone Monitoring Active">
                <Mic className="w-2.5 h-2.5" /> Audio
              </span>
            )}
            <span className="flex items-center gap-1 text-amber-600" title="Maximum Allowed Window Switches">
              <ShieldAlert className="w-2.5 h-2.5" /> {exam.anti_cheat_config?.max_tab_switches ?? 3} Tabs
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Link
            href={`/admin/questions?examId=${exam.id}`}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors py-0.5"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Questions ({exam.total_questions})</span>
          </Link>

          {onManageSlots && (
            <button
              onClick={() => onManageSlots(exam)}
              className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
              title="Schedule Examination Slots"
            >
              <CalendarDays className="w-3 h-3 text-indigo-600" />
              <span>Slots ({exam.slots?.length || 0})</span>
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(exam)}
              className="p-1 rounded-md border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
              title="Edit Exam Settings"
            >
              <Edit className="w-3 h-3" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(exam.id, exam.title)}
              className="p-1 rounded-md border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Delete Exam"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {onTogglePublish && (
            <button
              onClick={() => onTogglePublish(exam.id, exam.is_published)}
              className="text-[11px] font-semibold px-2 py-1 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {exam.is_published ? "Unpublish" : "Publish"}
            </button>
          )}
          <Link
            href={`/admin/attendance`}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-2xs"
          >
            <span>Live Hall</span>
            <ArrowUpRight className="w-2.5 h-2.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
