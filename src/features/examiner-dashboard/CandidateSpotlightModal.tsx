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
    if (!videoEl) return;

    if (!streamContext) {
      internalReceiver.setVideoRef(videoEl);
    }

    if (!activeStream) return;

    try {
      if (videoEl.srcObject !== activeStream) {
        videoEl.srcObject = activeStream;
      }
      videoEl.defaultMuted = true;
      videoEl.muted = activeIsMuted;
      videoEl.playsInline = true;
      videoEl.play().catch((err) => {
        console.warn("[Spotlight Modal] Video auto-play interrupted:", err);
      });
    } catch (err) {
      console.warn("[Spotlight Modal] Error attaching stream to video:", err);
    }
  }, [activeStream, activeIsMuted, activeConnectionState, streamContext, internalReceiver]);

  if (!isOpen) return null;

  const isCritical = candidate.integrity_score < 75 || candidate.violation_count >= 3;
  const isWatchlist = !isCritical && (candidate.integrity_score < 90 || candidate.violation_count > 0);
  
  // Prioritize active live video track if available
  const hasLiveVideoTrack = Boolean(
    activeStream &&
    activeStream.getVideoTracks().some((t) => t.readyState === "live" && t.enabled)
  );
  const isLive = activeConnectionState === "LIVE" || hasLiveVideoTrack;
  const isConnecting = activeConnectionState === "CONNECTING";
  const isFallback = !isLive && (activeConnectionState === "FALLBACK" || Boolean(activeFallbackSnapshot));

  const handleClose = () => {
    // If we used an internal receiver, tear it down
    if (!streamContext) {
      handleDisconnect();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar - Clean SaaS Light */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">{candidate.name}</h2>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {candidate.department_code}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  • {candidate.reg_number}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {candidate.exam_title} — {candidate.slot_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Realtime Integrity Badge */}
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs ${
                isCritical
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : isWatchlist
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border-emerald-200"
              }`}
            >
              {isCritical ? <ShieldAlert className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{candidate.integrity_score}% Integrity</span>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: 16:9 Video Viewport & Telemetry Sidebar */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white">
          {/* Main Camera Viewport (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-200 overflow-hidden flex items-center justify-center shadow-lg group">
              {/* HUD Target Overlays */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-indigo-400 z-20 pointer-events-none" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-indigo-400 z-20 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-indigo-400 z-20 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-indigo-400 z-20 pointer-events-none" />

              {/* Video Stream Element (Always mounted for immediate fluid render) */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={activeIsMuted}
                className={`w-full h-full object-cover z-10 ${
                  isLive ? "opacity-100" : "opacity-0 pointer-events-none"
                }`}
              />

              {/* Fallback Snapshot View (Shown only if direct WebRTC is unavailable) */}
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
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-xs font-mono font-bold text-white shadow-sm">
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
                      ? "bg-black/75 border-white/10 text-slate-200 hover:text-white"
                      : "bg-emerald-600 border-emerald-400 text-white shadow-sm"
                  }`}
                >
                  {activeIsMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-white" />}
                  <span>{activeIsMuted ? "Unmute Audio" : "Room Audio Live"}</span>
                </button>
              </div>

              {/* Bottom Decibel Visualizer Bar */}
              <div className="absolute bottom-3 left-3 right-3 z-20 px-3.5 py-2 rounded-xl bg-black/75 backdrop-blur-md border border-white/10 flex items-center gap-3 text-white shadow-sm">
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
                <span className="text-[10px] font-mono text-slate-300 shrink-0">
                  {activeAudioLevel > 65 ? "LOUD NOISE" : "Quiet Baseline"}
                </span>
              </div>
            </div>

            {/* Architecture Invariants Banner - SaaS Light Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-center shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Media Path
                </span>
                <span className="text-xs font-mono font-bold text-indigo-700 mt-0.5 block">
                  Direct UDP (DTLS-SRTP)
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-center shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Server Egress Cost
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 mt-0.5 block">
                  $0.00 (Zero Server Load)
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-center shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Bandwidth Cap
                </span>
                <span className="text-xs font-mono font-bold text-amber-700 mt-0.5 block">
                  800 kbps (720p HD P2P)
                </span>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Candidate Telemetry & Interventions - SaaS Light */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Candidate Dossier
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">Student ID:</span>
                    <span className="text-slate-800 font-mono font-semibold text-[11px] truncate max-w-[170px]" title={candidate.student_id}>
                      {candidate.student_id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">Registration:</span>
                    <span className="text-slate-800 font-mono font-semibold">{candidate.reg_number}</span>
                  </div>
                  <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500">Department:</span>
                    <span className="text-indigo-700 font-bold">{candidate.department_name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Infraction Count:</span>
                    <span className={`font-bold ${candidate.violation_count > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                      {candidate.violation_count} recorded
                    </span>
                  </div>
                </div>
              </div>

              {/* Latest Incidents */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>Recent Event</span>
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                </h4>
                <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs shadow-2xs">
                  <p className="font-semibold text-slate-800">
                    {candidate.recent_incident || "Normal candidate conduct verified"}
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                    Telemetry synced via Supabase Realtime
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Invigilator Interventions */}
            <div className="space-y-2.5 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  onIssueWarning(candidate);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-98 cursor-pointer"
              >
                <BellRing className="w-4 h-4 text-slate-950" />
                <span>Issue Official Warning Alert</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onDisqualify(candidate);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs active:scale-98 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Disqualify Candidate Session</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
