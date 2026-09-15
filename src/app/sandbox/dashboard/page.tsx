import Link from "next/link";

export default function DashboardSandboxPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/sandbox" className="text-xs text-indigo-400 hover:underline">← Back to Sandboxes</Link>
          <span className="text-xs text-neutral-400 font-mono">Developer 5 Sandbox</span>
        </div>
        <h1 className="text-2xl font-bold">Examiner / Proctor Dashboard Sandbox</h1>
        <p className="text-sm text-neutral-400">
          Dedicated space for developing the live candidate surveillance grid, integrity risk score telemetry, and evidence preview drawers.
        </p>
        <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-300">Target Feature Module:</h2>
          <code className="text-xs text-amber-300 font-mono block p-3 rounded bg-neutral-950 border border-neutral-800">
            src/features/examiner-dashboard/
          </code>
        </div>
      </div>
    </div>
  );
}
