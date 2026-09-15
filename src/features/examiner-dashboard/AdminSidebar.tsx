import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpenCheck, 
  HelpCircle, 
  ShieldAlert, 
  Users, 
  Settings,
  GraduationCap
} from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Exam Management", href: "/admin/exams", icon: BookOpenCheck },
    { label: "Question Bank", href: "/admin/questions", icon: HelpCircle },
    { label: "Live Proctor Monitor", href: "/admin/proctor", icon: ShieldAlert },
    { label: "Candidate Registry", href: "/admin/candidates", icon: Users },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-xs z-20">
      <div className="p-5 space-y-6">
        {/* Portal Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-slate-900 block">Ph.D Exam System</span>
            <span className="text-[11px] text-slate-500 font-medium block">Examiner Command Console</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 block mb-2">
            Exam Administration
          </span>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200/80 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] text-slate-700 font-semibold">Supabase PostgreSQL Live</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Prisma Connected</span>
          <Link href="/sandbox" className="hover:text-indigo-600 font-medium flex items-center gap-1">
            <Settings className="w-3 h-3" /> Sandboxes
          </Link>
        </div>
      </div>
    </aside>
  );
}
