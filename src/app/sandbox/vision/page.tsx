import Link from "next/link";

export default function VisionSandboxPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/sandbox" className="text-xs text-indigo-400 hover:underline">← Back to Sandboxes</Link>
          <span className="text-xs text-neutral-400 font-mono">Developer 1 Sandbox</span>
        </div>
        <h1 className="text-2xl font-bold">Visual AI Proctoring Sandbox</h1>
        <p className="text-sm text-neutral-400">
          Dedicated space for developing MediaPipe face tracking, head pose estimation (Yaw/Pitch), multiple faces, and canvas snapshotting.
        </p>
        <div className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 space-y-4">
          <h2 className="text-sm font-semibold text-neutral-300">Target Feature Module:</h2>
          <code className="text-xs text-indigo-300 font-mono block p-3 rounded bg-neutral-950 border border-neutral-800">
            src/features/proctor-vision/
          </code>
          <div className="text-xs text-neutral-400 space-y-1">
            <p>• Code your webcam hook and MediaPipe loader in <span className="text-neutral-200">src/features/proctor-vision/</span></p>
            <p>• Import it here to test without affecting the main exam UI!</p>
          </div>
        </div>
      </div>
    </div>
  );
}
