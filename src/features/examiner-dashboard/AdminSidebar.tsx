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
    <aside className="w-64 border-r border-neutral-800 bg-neutral-950 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div className="p-5 space-y-6">
        {/* Portal Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">Ph.D Exam System</span>
            <span className="text-[11px] text-neutral-400 font-mono block">Examiner Portal</span>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 px-3 block mb-2">
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
                    ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-neutral-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-5 border-t border-neutral-800/80 bg-neutral-950/40">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-[11px] text-neutral-300 font-medium">Supabase Engine Active</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span>Version 1.0 (MCA-III)</span>
          <Link href="/sandbox" className="hover:text-neutral-300 flex items-center gap-1">
            <Settings className="w-3 h-3" /> Sandboxes
          </Link>
        </div>
      </div>
    </aside>
  );
}
