import { ShieldCheck } from "lucide-react";

interface AdminNavbarProps {
  title?: string;
  subtitle?: string;
}

export function AdminNavbar({ 
  title = "Examiner Command Center", 
  subtitle = "Manage live exams, question rubrics, and proctoring integrity" 
}: AdminNavbarProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/90 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div>
        <h1 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h1>
        <p className="text-[11px] text-slate-500">{subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Real-time System Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-mono text-[11px] font-semibold">Edge AI & RLS Armed</span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
            AD
          </div>
          <div className="hidden md:block">
            <span className="text-xs font-bold text-slate-800 block leading-tight">Exam Controller</span>
            <span className="text-[10px] text-slate-500 block font-medium">Chief Evaluation Board</span>
          </div>
        </div>
      </div>
    </header>
  );
}
