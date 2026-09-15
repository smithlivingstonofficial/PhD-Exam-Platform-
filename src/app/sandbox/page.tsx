import Link from "next/link";

export default function SandboxIndexPage() {
  const sandboxes = [
    {
      title: "Visual AI Proctoring (MediaPipe)",
      path: "/sandbox/vision",
      dev: "Developer 1",
      description: "Face mesh, head pose (yaw/pitch), absence detection, multiple face counter, and snapshot generator.",
      color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    },
    {
      title: "Audio Environment & VAD",
      path: "/sandbox/audio",
      dev: "Developer 2",
      description: "Voice Activity Detection (Silero VAD), ambient decibel RMS meter, and 5-second audio evidence recorder.",
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
    },
    {
      title: "Anti-Cheat & Security Lockdown",
      path: "/sandbox/security",
      dev: "Developer 3",
      description: "Fullscreen locker, Alt+Tab / Page Visibility traps, DevTools inhibitors, and clipboard blockers.",
      color: "from-rose-500/20 to-red-500/20 border-rose-500/30",
    },
    {
      title: "Exam Experience & Question Palette",
      path: "/sandbox/exam",
      dev: "Developer 4",
      description: "Question card, options selector, question grid navigation, review markers, and local answer cache.",
      color: "from-violet-500/20 to-purple-500/20 border-violet-500/30",
    },
    {
      title: "Examiner / Proctor Dashboard",
      path: "/sandbox/dashboard",
      dev: "Developer 5",
      description: "Real-time candidate monitoring grid, live risk scores, incident feed, and snapshot evidence viewer.",
      color: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              Developer Sandboxes
            </span>
            <span className="text-xs text-neutral-400">Parallel Feature Development</span>
          </div>
          <h1 className="text-3xl font-bold mt-2">Team Feature Playgrounds</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Every developer works in their dedicated sandbox and feature folder. Test your feature independently without merge conflicts!
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sandboxes.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`p-5 rounded-xl border bg-gradient-to-br ${item.color} hover:scale-[1.01] transition-transform flex flex-col justify-between`}
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-900/60 text-neutral-300">
                    {item.dev}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">{item.title}</h2>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">{item.description}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-neutral-800/40 flex items-center justify-between text-xs text-neutral-400 font-medium">
                <span>Open Playground →</span>
                <span className="font-mono">{item.path}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
