import { Inter } from "next/font/google";
import { AdminSidebar, AdminNavbar } from "@/features/examiner-dashboard";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div 
      className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 flex antialiased`}
      style={{ 
        fontFamily: inter.style.fontFamily,
        fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"'
      }}
    >
      {/* Fixed Admin Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminNavbar />
        <main className="p-4 sm:p-5 lg:p-6 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

