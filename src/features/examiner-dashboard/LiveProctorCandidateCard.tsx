"use client";

import { useEffect, useRef } from "react";
import { SerializedCandidate } from "@/app/admin/actions";
import { useAdminWebRTCReceiver } from "./useAdminWebRTCReceiver";
import { ActiveStreamContext } from "./CandidateSpotlightModal";
import {
  Camera,
  Maximize2,
  Mic,
  MicOff,
  RefreshCw,
  Square,
  ShieldCheck,
  ShieldAlert,
  BellRing,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface LiveProctorCandidateCardProps {
  candidate: SerializedCandidate;
  onIssueWarning: (candidate: SerializedCandidate) => void;
  onDisqualify: (candidate: SerializedCandidate) => void;
  onOpenAuditLogs: (candidate: SerializedCandidate) => void;
  onSpotlight: (candidate: SerializedCandidate, streamContext?: ActiveStreamContext) => void;
  isSpotlighted?: boolean;
}

export function LiveProctorCandidateCard({
  candidate,
  onIssueWarning,
  onDisqualify,
  onOpenAuditLogs,
  onSpotlight,
}: LiveProctorCandidateCardProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const {
    connectionState,
    remoteStream,
    fallbackSnapshot,
    isMuted,
    audioLevel,
    latencyMs,
    connect,
    disconnect,
    toggleMute,
  } = useAdminWebRTCReceiver({
    sessionId: candidate.id,
    autoConnect: false,
  });

  // Attach video element whenever stream arrives or mute state changes
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !remoteStream) return;

    try {
      if (videoEl.srcObject !== remoteStream) {
        videoEl.srcObject = remoteStream;
      }
      videoEl.defaultMuted = true;
      videoEl.muted = isMuted;
      videoEl.play().catch((err) => {
        console.warn("[Card] Video play catch:", err);
      });
    } catch (err) {
      console.warn("[Card] Video attach error:", err);
    }
  }, [remoteStream, isMuted, connectionState]);

  const isCritical = candidate.integrity_score < 75 || candidate.violation_count >= 3;
  const isWatchlist = !isCritical && (candidate.integrity_score < 90 || candidate.violation_count > 0);
  const isOnline = candidate.status === "IN_PROGRESS";

  const isLive = connectionState === "LIVE";
  const isConnecting = connectionState === "CONNECTING";
  const isFallback = connectionState === "FALLBACK";

  const handleSpotlight = () => {
    onSpotlight(candidate, {
      stream: remoteStream,
      connectionState,
      fallbackSnapshot,
      isMuted,
      audioLevel,
      latencyMs,
      connect,
      disconnect,
      toggleMute,
    });
  };

  return (
    <div
      className={`rounded-2xl border bg-white p-4 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-md ${
        isCritical
          ? "border-rose-300 ring-2 ring-rose-200 bg-rose-50/10"
          : isWatchlist
          ? "border-amber-300 ring-1 ring-amber-200 bg-amber-50/10"
          : isLive
          ? "border-indigo-300 ring-2 ring-indigo-200"
          : "border-slate-200/90"
      }`}
    >
      {/* Card Header: Candidate Info & Risk Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-xs font-bold text-slate-900 truncate" title={candidate.name}>
              {candidate.name}
            </h3>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {candidate.department_code}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono block truncate" title={candidate.reg_number}>
            {candidate.reg_number} • {candidate.slot_name}
          </span>
        </div>

        <div className="text-right shrink-0">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${
              isCritical
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : isWatchlist
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}
          >
            {isCritical ? (
              <ShieldAlert className="w-2.5 h-2.5" />
            ) : (
              <ShieldCheck className="w-2.5 h-2.5" />
            )}
            <span>{candidate.integrity_score}%</span>
          </span>
          <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
            {candidate.violation_count} Violation{candidate.violation_count === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Video Viewport Box */}
      <div className="relative aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner group">
        {/* HUD Viewfinder Corners */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2 border-indigo-400/80 z-20 pointer-events-none" />
        <div className="absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2 border-indigo-400/80 z-20 pointer-events-none" />
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2 border-indigo-400/80 z-20 pointer-events-none" />
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2 border-indigo-400/80 z-20 pointer-events-none" />

        {/* 1. Live WebRTC Video Element (Mounted continuously) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          className={`w-full h-full object-cover z-10 transition-opacity duration-300 ${
            isLive ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        />

        {/* 2. Fallback Snapshot Viewport */}
        {isFallback && fallbackSnapshot && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fallbackSnapshot}
            alt="Candidate Snapshot Fallback"
            className="absolute inset-0 w-full h-full object-cover z-10 animate-fade-in"
          />
        )}

        {/* 3. Idle / Standby State with Connect Overlay */}
        {!isLive && !isFallback && (
          <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center text-center space-y-2 select-none px-4">
            <div className="w-11 h-11 mx-auto rounded-full bg-slate-900 border border-slate-700/90 flex items-center justify-center text-slate-400 shadow-md relative">
              {isConnecting ? (
                <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              )}
            </div>

            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-slate-300 font-semibold tracking-wider block">
                {isConnecting ? "ESTABLISHING P2P..." : "DIRECT P2P STREAM"}
              </span>
              <span className="text-[9px] text-slate-400 block">
                {isConnecting ? "STUN Discovery Handshake" : "0 Server Egress • Zero Cost"}
              </span>
            </div>

            {isOnline && !isConnecting && (
              <button
                type="button"
                onClick={connect}
                className="mt-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold inline-flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <Zap className="w-3 h-3 text-amber-300" />
                <span>Connect Live Feed</span>
              </button>
            )}
          </div>
        )}

        {/* Top-Left: Connection Status Pill */}
        <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900/85 backdrop-blur-md text-[9px] font-mono font-bold border border-slate-700 shadow-xs">
          {isLive ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400">LIVE P2P</span>
              {latencyMs && (
                <span className="text-slate-400 ml-1">({latencyMs}ms)</span>
              )}
            </>
          ) : isFallback ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300">SNAPSHOT FALLBACK</span>
            </>
          ) : isConnecting ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              <span className="text-indigo-300">CONNECTING...</span>
            </>
          ) : (
            <>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-slate-500"}`} />
              <span className="text-slate-300">{isOnline ? "STANDBY" : "OFFLINE"}</span>
            </>
          )}
        </div>

        {/* Top-Right: Spotlight & Audio Controls */}
        <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
          {isLive && (
            <>
              <button
                type="button"
                onClick={toggleMute}
                className={`p-1.5 rounded-md backdrop-blur-md border text-xs cursor-pointer transition-colors shadow-xs ${
                  isMuted
                    ? "bg-slate-900/80 border-slate-700 text-slate-400 hover:text-white"
                    : "bg-emerald-950/90 border-emerald-500/50 text-emerald-300"
                }`}
                title={isMuted ? "Unmute room audio" : "Mute room audio"}
              >
                {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={disconnect}
                className="p-1.5 rounded-md bg-rose-950/80 border border-rose-500/50 text-rose-300 hover:bg-rose-900/90 text-xs cursor-pointer transition-colors shadow-xs"
                title="Disconnect live stream"
              >
                <Square className="w-3 h-3" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleSpotlight}
            className="p-1.5 rounded-md bg-slate-900/85 hover:bg-indigo-600 border border-slate-700 text-slate-300 hover:text-white text-xs cursor-pointer transition-colors shadow-xs"
            title="Expand into Spotlight Fullscreen Modal"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>

        {/* Bottom Audio Decibel Meter Bar */}
        <div className="absolute bottom-2 left-2 right-2 z-20 px-2 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 flex items-center gap-2">
          <Mic className={`w-3 h-3 shrink-0 ${audioLevel > 50 ? "text-rose-400 animate-pulse" : "text-emerald-400"}`} />
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                audioLevel > 65
                  ? "bg-rose-500"
                  : audioLevel > 35
                  ? "bg-amber-400"
                  : "bg-emerald-400"
              }`}
              style={{ width: `${Math.max(10, Math.min(100, isLive ? audioLevel : 15))}%` }}
            />
          </div>
          <span className="text-[8px] font-mono text-slate-400 shrink-0">
            {isLive ? `${audioLevel} dB` : "Norm"}
          </span>
        </div>
      </div>

      {/* Incident Snippet & Audit Log Link */}
      <div className="my-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-0.5">
        <div className="flex items-center justify-between text-[10px]">
          <span className="font-bold uppercase tracking-wider text-slate-500">Latest Event</span>
          <button
            type="button"
            onClick={() => onOpenAuditLogs(candidate)}
            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
          >
            Audit Log &gt;
          </button>
        </div>
        <p className="text-[11px] font-semibold text-slate-800 truncate" title={candidate.recent_incident}>
          {candidate.recent_incident || "Normal candidate conduct verified"}
        </p>
      </div>

      {/* Card Footer Quick Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
        <button
          type="button"
          onClick={() => onIssueWarning(candidate)}
          className="flex-1 py-1.5 px-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-98"
          title="Send immediate warning toast to candidate workstation"
        >
          <BellRing className="w-3.5 h-3.5 text-amber-600" />
          <span>Warning</span>
        </button>

        <button
          type="button"
          onClick={() => onDisqualify(candidate)}
          className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-98"
          title="Disqualify scholar from examination"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
          <span>Disqualify</span>
        </button>
      </div>
    </div>
  );
}
