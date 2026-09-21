"use client";

import { RefObject, useEffect } from "react";
import { Shield, Camera, Mic, AlertTriangle, UserCheck, UserX } from "lucide-react";

interface ProctorPipFeedProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  stream?: MediaStream | null;
  isCameraActive: boolean;
  cameraError: string | null;
  isFacePresent: boolean;
  audioLevel: number;
  isMicActive: boolean;
  strikeCount: number;
  maxStrikes: number;
  isLiveProctored?: boolean;
}

export function ProctorPipFeed({
  videoRef,
  stream,
  isCameraActive,
  cameraError,
  isFacePresent,
  audioLevel,
  isMicActive,
  strikeCount,
  maxStrikes,
  isLiveProctored,
}: ProctorPipFeedProps) {
  // Ensure the live media stream is immediately bound to the video element when mounted
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream && video.srcObject !== stream) {
      video.srcObject = stream;
    }
    video.muted = true;
    video.playsInline = true;
    if (isCameraActive && stream) {
      video.play().catch((err) => {
        console.warn("[Proctor PIP] Video auto-play interrupted:", err);
      });
    }
  }, [videoRef, stream, isCameraActive]);
  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-3 space-y-2.5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-indigo-600" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
            AI Invigilator
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isLiveProctored && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
              LIVE PROCTOR
            </span>
          )}
          <span
            className={`w-2 h-2 rounded-full ${
              isCameraActive ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
            }`}
          />
          <span className="text-[10px] font-mono font-semibold text-slate-500">
            {isCameraActive ? "Active" : "Offline"}
          </span>
        </div>
      </div>

      {/* Video Preview Box */}
      <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className={`w-full h-full object-cover ${isCameraActive ? "block" : "hidden"}`}
        />

        {!isCameraActive && (
          <div className="p-2 text-center space-y-1">
            <Camera className="w-5 h-5 text-slate-600 mx-auto" />
            <span className="text-[10px] text-slate-400 block leading-tight">
              {cameraError || "Initializing camera..."}
            </span>
          </div>
        )}

        {/* Real-time Status Pills on Video */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
          {/* Face Status */}
          {isFacePresent ? (
            <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-black/75 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <UserCheck className="w-2.5 h-2.5 text-emerald-400" />
              Face Centered
            </span>
          ) : (
            <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-500/60 flex items-center gap-1 animate-pulse">
              <UserX className="w-2.5 h-2.5 text-rose-400" />
              Face Missing!
            </span>
          )}

          {/* Strikes Badge */}
          <span
            className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${
              strikeCount > 0
                ? "bg-rose-950/90 text-rose-300 border-rose-500/50 animate-pulse"
                : "bg-black/60 text-slate-300 border-slate-700"
            }`}
          >
            {strikeCount}/{maxStrikes} Strikes
          </span>
        </div>

        {/* Audio Decibel Level Bar */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/75 backdrop-blur-sm px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5 pointer-events-none">
          <Mic className={`w-2.5 h-2.5 ${isMicActive ? "text-emerald-400" : "text-slate-500"}`} />
          <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                audioLevel > 60
                  ? "bg-rose-500"
                  : audioLevel > 30
                  ? "bg-amber-400"
                  : "bg-emerald-400"
              }`}
              style={{ width: `${Math.min(100, audioLevel)}%` }}
            />
          </div>
          <span className="text-[8px] font-mono text-slate-400">
            {audioLevel}%
          </span>
        </div>
      </div>

      {/* Warning Notice if Absence */}
      {!isFacePresent && isCameraActive && (
        <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-[10px] text-rose-700 flex items-center gap-1.5 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
          <span className="font-medium">Maintain eye contact with the screen.</span>
        </div>
      )}
    </div>
  );
}
