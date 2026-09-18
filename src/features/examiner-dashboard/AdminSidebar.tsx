"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpenCheck, 
  HelpCircle, 
  ShieldAlert, 
  Users, 
  Building2, 
  UserCheck, 
  Award, 
  RefreshCw,
  ChevronRight
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant: "indigo" | "emerald" | "rose" | "violet";
    pulse?: boolean;
  };
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AdminSidebar() {
  const pathname = usePathname();

  const sections: NavSection[] = [
    {
      title: "Main Management",
      items: [
        { label: "Dashboard Overview", href: "/admin", icon: LayoutDashboard },
        { label: "Academic Departments", href: "/admin/departments", icon: Building2 },
        { label: "Candidate Registry", href: "/admin/candidates", icon: Users },
      ],
    },
    {
      title: "Exams & Evaluation",
      items: [
        { label: "Exams & Schedules", href: "/admin/exams", icon: BookOpenCheck },
        { 
          label: "Question Bank", 
          href: "/admin/questions", 
          icon: HelpCircle,
          badge: { text: "Questions", variant: "indigo" } 
        },
        { label: "Student Attendance", href: "/admin/attendance", icon: UserCheck },
        { label: "Results & Marks", href: "/admin/results", icon: Award },
      ],
    },
    {
      title: "Monitoring & Retests",
      items: [
        { 
          label: "Live Exam Monitoring", 
          href: "/admin/proctor", 
          icon: ShieldAlert,
          badge: { text: "LIVE", variant: "rose", pulse: true } 
        },
        { 
          label: "Re-Exam / Make-up Slot", 
          href: "/admin/second-slot", 
          icon: RefreshCw,
          badge: { text: "Slot 2", variant: "violet" } 
        },
      ],
    },
  ];

  const getBadgeClasses = (variant: string) => {
    switch (variant) {
      case "rose":
        return "bg-rose-50 text-rose-700 border-rose-200/80";
      case "emerald":
        return "bg-emerald-50 text-emerald-700 border-emerald-200/80";
      case "violet":
        return "bg-violet-50 text-violet-700 border-violet-200/80";
      case "indigo":
      default:
        return "bg-indigo-50 text-indigo-700 border-indigo-200/80";
    }
  };

  return (
    <aside className="w-[260px] border-r border-slate-200/90 bg-white/95 backdrop-blur-xl flex flex-col justify-between shrink-0 h-screen sticky top-0 shadow-2xs z-30 select-none">
      {/* Top Scrollable Section */}
      <div className="p-3.5 space-y-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        {/* Brand & University Header */}
        <div className="pb-2.5 border-b border-slate-100">
          <Link href="/admin" className="block group">
            <div className="px-2 py-1.5 rounded-xl bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40 border border-slate-200/80 shadow-2xs group-hover:border-indigo-300 group-hover:shadow-xs transition-all duration-200">
              <div className="flex items-center justify-center h-10 w-full overflow-hidden">
                <Image
                  src="/college-logo.png"
                  alt="Kalasalingam Academy of Research and Education"
                  width={220}
                  height={36}
                  priority
                  className="h-9 w-auto max-w-full object-contain filter drop-shadow-2xs group-hover:scale-101 transition-transform duration-200"
                />
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Categories */}
        <div className="space-y-3.5">
          {sections.map((section) => (
            <div key={section.title} className="space-y-0.5">
              <div className="px-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </span>
              </div>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                        isActive
                          ? "bg-indigo-50/90 text-indigo-700 border border-indigo-200/80 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                      }`}
                    >
                      {/* Active Indicator Pip */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-indigo-600" />
                      )}

                      <div className="flex items-center gap-2 min-w-0">
                        <Icon
                          className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                            isActive
                              ? "text-indigo-600"
                              : "text-slate-400 group-hover:text-slate-700"
                          }`}
                        />
                        <span className="truncate text-xs">{item.label}</span>
                      </div>

                      {/* Optional Badges */}
                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                        {item.badge && (
                          <span
                            className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border shadow-2xs ${getBadgeClasses(
                              item.badge.variant
                            )}`}
                          >
                            {item.badge.pulse && (
                              <span className="relative flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-600"></span>
                              </span>
                            )}
                            <span>{item.badge.text}</span>
                          </span>
                        )}
                        {!item.badge && isActive && (
                          <ChevronRight className="w-3 h-3 text-indigo-500 opacity-60" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom User & Status Strip */}
      <div className="p-3 border-t border-slate-200/80 bg-gradient-to-b from-white to-slate-50/80 space-y-2.5">
        {/* Simple Online Status */}
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200/70 text-emerald-800 text-[11px] font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">Platform Online</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Secure</span>
        </div>

        {/* User Account / Controller Strip */}
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-[10px] shadow-2xs">
            COE
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-800 block leading-tight truncate">Exam Controller</span>
            <span className="text-[10px] text-slate-400 block font-medium truncate">Office of the COE</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
