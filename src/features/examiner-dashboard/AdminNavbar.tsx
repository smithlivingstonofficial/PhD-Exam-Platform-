import { ShieldCheck } from "lucide-react";

interface AdminNavbarProps {
  title?: string;
  subtitle?: string;
}

export function AdminNavbar({ title = "Examiner Command Center", subtitle = "Manage exams, questions, and proctoring integrity" }: AdminNavbarProps) {
  return (
    <header className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h1 className="text-sm font-bold text-white tracking-tight">{title}</h1>
        <p className="text-[11px] text-neutral-400">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time System Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="font-mono text-[11px] font-medium">Edge AI & RLS Armed</span>
        </div>

        {/* Notifications & User Avatar */}
        <div className="flex items-center gap-3 border-l border-neutral-800 pl-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow">
            AD
          </div>
          <div className="hidden md:block">
            <span className="text-xs font-semibold text-neutral-200 block leading-tight">Exam Controller</span>
            <span className="text-[10px] text-neutral-400 block">Chief Evaluation Board</span>
          </div>
        </div>
      </div>
    </header>
  );
}
