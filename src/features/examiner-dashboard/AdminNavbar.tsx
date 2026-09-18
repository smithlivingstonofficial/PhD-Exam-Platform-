"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  ShieldCheck, 
  Clock, 
  Bell, 
  ChevronRight, 
  Layers,
  Building2,
  Users,
  BookOpenCheck,
  HelpCircle,
  UserCheck,
  Award,
  RefreshCw,
  ShieldAlert,
  LayoutDashboard
} from "lucide-react";

interface AdminNavbarProps {
  title?: string;
}

export function AdminNavbar({ title }: AdminNavbarProps) {
  const pathname = usePathname();
  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getRouteMeta = (path: string) => {
    if (path === "/admin") return { name: "Dashboard Overview", icon: LayoutDashboard, category: "Overview" };
    if (path.startsWith("/admin/departments")) return { name: "Academic Departments", icon: Building2, category: "Academics" };
    if (path.startsWith("/admin/candidates")) return { name: "Candidate Registry", icon: Users, category: "Students" };
    if (path.startsWith("/admin/exams")) return { name: "Exams & Schedules", icon: BookOpenCheck, category: "Exams" };
    if (path.startsWith("/admin/questions")) return { name: "Question Bank", icon: HelpCircle, category: "Exams" };
    if (path.startsWith("/admin/attendance")) return { name: "Student Attendance", icon: UserCheck, category: "Exams" };
    if (path.startsWith("/admin/results")) return { name: "Results & Marks", icon: Award, category: "Evaluation" };
    if (path.startsWith("/admin/second-slot")) return { name: "Re-Exam / Second Slot", icon: RefreshCw, category: "Retests" };
    if (path.startsWith("/admin/proctor")) return { name: "Live Exam Monitoring", icon: ShieldAlert, category: "Monitoring" };
    return { name: "Exam Portal", icon: Layers, category: "Admin" };
  };

  const currentMeta = getRouteMeta(pathname);
  const PageIcon = currentMeta.icon;

  return (
    <header className="h-14 border-b border-slate-200/90 bg-white/90 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Left: Simple Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs">
        <Link href="/admin" className="text-slate-400 hover:text-indigo-600 font-medium transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <span className="text-slate-400 font-medium">{currentMeta.category}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
        <div className="flex items-center gap-1.5 font-bold text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/70 shadow-2xs">
          <PageIcon className="w-3.5 h-3.5 text-indigo-600" />
          <span>{title || currentMeta.name}</span>
        </div>
      </div>

      {/* Right: Authoritative Clock, Proctoring Status, and User */}
      <div className="flex items-center gap-2.5">
        {/* Live Clock */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/80 bg-slate-50/70 text-slate-700 shadow-2xs text-[11px]">
          <Clock className="w-3 h-3 text-indigo-600" />
          <span className="text-slate-400 font-medium">Time:</span>
          <span className="font-mono font-bold text-slate-800">
            {timeString || "Syncing..."}
          </span>
        </div>

        {/* Proctoring Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-200/80 bg-emerald-50/80 text-emerald-700 text-[11px] shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span className="font-semibold">Proctoring Active</span>
        </div>

        {/* Alerts Bell */}
        <Link
          href="/admin/proctor"
          title="Security Alerts"
          className="relative p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors border border-slate-200/60 bg-white shadow-2xs"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-rose-500 ring-2 ring-white"></span>
        </Link>

        {/* Examiner Profile */}
        <div className="flex items-center gap-2 pl-2.5 border-l border-slate-200">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white text-[10px] font-extrabold shadow-2xs">
            COE
          </div>
          <div className="hidden md:block">
            <span className="text-xs font-bold text-slate-900 block leading-tight">Exam Controller</span>
            <span className="text-[10px] text-slate-400 block font-medium leading-none">University Board</span>
          </div>
        </div>
      </div>
    </header>
  );
}
