"use client";

import { useEffect, useRef } from "react";
import { SerializedCandidate } from "@/app/admin/actions";
import { useAdminWebRTCReceiver } from "./useAdminWebRTCReceiver";
import { WebRTCConnectionState } from "@/features/proctor-vision/webrtc/types";
import {
  X,
  Camera,
  Mic,
  MicOff,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  BellRing,
  RefreshCw,
  Activity,
  Zap,
} from "lucide-react";

export interface ActiveStreamContext {
  stream: MediaStream | null;
  connectionState: WebRTCConnectionState;
  fallbackSnapshot: string | null;
  isMuted: boolean;
  audioLevel: number;
  latencyMs: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
}

interface CandidateSpotlightModalProps {
  candidate: SerializedCandidate;
  isOpen: boolean;
  onClose: () => void;
  onIssueWarning: (candidate: SerializedCandidate) => void;
  onDisqualify: (candidate: SerializedCandidate) => void;
  streamContext?: ActiveStreamContext | null;
}

export function CandidateSpotlightModal({
  candidate,
  isOpen,
  onClose,
  onIssueWarning,
  onDisqualify,
  streamContext,
}: CandidateSpotlightModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Fallback receiver if no streamContext was passed from candidate card
  const internalReceiver = useAdminWebRTCReceiver({
    sessionId: isOpen && !streamContext ? candidate.id : null,
    autoConnect: true,
  });

  // Pick active context
  const activeStream = streamContext ? streamContext.stream : internalReceiver.remoteStream;
  const activeConnectionState = streamContext
    ? streamContext.connectionState
    : internalReceiver.connectionState;
  const activeFallbackSnapshot = streamContext
    ? streamContext.fallbackSnapshot
    : internalReceiver.fallbackSnapshot;
  const activeIsMuted = streamContext ? streamContext.isMuted : internalReceiver.isMuted;
  const activeAudioLevel = streamContext ? streamContext.audioLevel : internalReceiver.audioLevel;
  const activeLatencyMs = streamContext ? streamContext.latencyMs : internalReceiver.latencyMs;

  const handleConnect = streamContext ? streamContext.connect : internalReceiver.connect;
  const handleToggleMute = streamContext ? streamContext.toggleMute : internalReceiver.toggleMute;
  const handleDisconnect = streamContext ? streamContext.disconnect : internalReceiver.disconnect;

  // Seamlessly bind and play active media stream on the video element
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !activeStream) return;

    try {
      if (videoEl.srcObject !== activeStream) {
        videoEl.srcObject = activeStream;
      }
      videoEl.defaultMuted = true;
      videoEl.muted = activeIsMuted;
      videoEl.play().catch((err) => {
        console.warn("[Spotlight Modal] Video auto-play interrupted:", err);
      });
    } catch (err) {
      console.warn("[Spotlight Modal] Error attaching stream to video:", err);
    }
  }, [activeStream, activeIsMuted, activeConnectionState]);

  if (!isOpen) return null;

  const isCritical = candidate.integrity_score < 75 || candidate.violation_count >= 3;
  const isWatchlist = !isCritical && (candidate.integrity_score < 90 || candidate.violation_count > 0);
  const isLive = activeConnectionState === "LIVE";
  const isConnecting = activeConnectionState === "CONNECTING";
  const isFallback = activeConnectionState === "FALLBACK";

  const handleClose = () => {
    // If we used an internal receiver, tear it down
    if (!streamContext) {
      handleDisconnect();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">{candidate.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                  {candidate.department_code}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  • {candidate.reg_number}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {candidate.exam_title} — {candidate.slot_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime Integrity Badge */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                isCritical
                  ? "bg-rose-950/80 text-rose-300 border-rose-500/40"
                  : isWatchlist
                  ? "bg-amber-950/80 text-amber-300 border-amber-500/40"
                  : "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
              }`}
            >
              {isCritical ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{candidate.integrity_score}% Integrity</span>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: 16:9 Video Viewport & Telemetry Sidebar */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Camera Viewport (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center shadow-2xl group">
              {/* HUD Target Overlays */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-indigo-400 z-20 pointer-events-none" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-indigo-400 z-20 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-indigo-400 z-20 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-indigo-400 z-20 pointer-events-none" />

              {/* Video Stream Element (Always mounted for immediate render without repaint glitches) */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={activeIsMuted}
                className={`w-full h-full object-cover z-10 ${
                  isLive ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              />

              {/* Fallback Snapshot View */}
              {isFallback && activeFallbackSnapshot && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeFallbackSnapshot}
                  alt="Candidate Snapshot"
                  className="absolute inset-0 w-full h-full object-cover z-10"
                />
              )}

              {/* Connecting / Standby State Overlay */}
              {!isLive && !isFallback && (
                <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center text-center space-y-3 px-6 select-none">
                  <div className="w-16 h-16 rounded-full bg-slate-900 border border-indigo-500/40 flex items-center justify-center mx-auto text-indigo-400">
                    {isConnecting ? (
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white font-mono">
                      {isConnecting ? "ESTABLISHING ENCRYPTED P2P TUNNEL..." : "STANDBY FEED"}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {isConnecting
                        ? "Exchanging SDP offer/answer over Supabase broadcast with Google STUN discovery"
                        : "Candidate workstation is ready. Click below to reconnect direct video stream."}
                    </p>
                  </div>
                  {!isConnecting && (
                    <button
                      type="button"
                      onClick={handleConnect}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                    >
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Connect Live Feed</span>
                    </button>
                  )}
                </div>
              )}

              {/* Top Status Pill */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs font-mono font-bold">
                {isLive ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-400">LIVE P2P</span>
                    {activeLatencyMs && (
                      <span className="text-slate-400">({activeLatencyMs}ms)</span>
                    )}
                  </>
                ) : isFallback ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-amber-300">SNAPSHOT FALLBACK</span>
                  </>
                ) : isConnecting ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    <span className="text-indigo-300">CONNECTING...</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span className="text-slate-400">OFFLINE</span>
                  </>
                )}
              </div>

              {/* Top Right Controls: Audio Toggle */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className={`px-3 py-1.5 rounded-lg backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all shadow-md ${
                    activeIsMuted
                      ? "bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white"
                      : "bg-emerald-900/90 border-emerald-500 text-emerald-200"
                  }`}
                >
                  {activeIsMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{activeIsMuted ? "Unmute Audio" : "Room Audio Live"}</span>
                </button>
              </div>

              {/* Bottom Decibel Visualizer Bar */}
              <div className="absolute bottom-3 left-3 right-3 z-20 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300 shrink-0">
                  <Mic className={`w-3.5 h-3.5 ${activeAudioLevel > 50 ? "text-rose-400" : "text-emerald-400"}`} />
                  <span>Mic: {activeAudioLevel} dB</span>
                </div>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-150 ${
                      activeAudioLevel > 65
                        ? "bg-rose-500"
                        : activeAudioLevel > 35
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                    style={{ width: `${Math.max(8, Math.min(100, isLive ? activeAudioLevel : 12))}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {activeAudioLevel > 65 ? "LOUD NOISE" : "Quiet Baseline"}
                </span>
              </div>
            </div>

            {/* Architecture Invariants Banner */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Media Path
                </span>
                <span className="text-xs font-mono font-bold text-indigo-400 mt-0.5 block">
                  Direct UDP (DTLS-SRTP)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Server Egress Cost
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400 mt-0.5 block">
                  $0.00 (Zero Server Load)
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Bandwidth Cap
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 mt-0.5 block">
                  250 kbps (Native WebRTC)
                </span>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Candidate Telemetry & Interventions */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Candidate Dossier
                </h4>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student ID:</span>
                    <span className="text-slate-300 font-mono font-semibold">{candidate.student_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registration:</span>
                    <span className="text-slate-300 font-mono font-semibold">{candidate.reg_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Department:</span>
                    <span className="text-indigo-400 font-semibold">{candidate.department_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Infraction Count:</span>
                    <span className={`font-bold ${candidate.violation_count > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      {candidate.violation_count} recorded
                    </span>
                  </div>
                </div>
              </div>

              {/* Latest Incidents */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Recent Event</span>
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                </h4>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                  <p className="font-semibold text-slate-200">
                    {candidate.recent_incident || "Normal candidate conduct verified"}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                    Telemetry synced via Supabase Realtime
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Invigilator Interventions */}
            <div className="space-y-2.5 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  onIssueWarning(candidate);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
              >
                <BellRing className="w-4 h-4 text-slate-950" />
                <span>Issue Official Warning Alert</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onDisqualify(candidate);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/50 text-rose-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Disqualify Candidate Session</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
