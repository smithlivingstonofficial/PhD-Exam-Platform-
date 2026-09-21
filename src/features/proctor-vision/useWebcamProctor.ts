"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseWebcamProctorProps {
  enabled?: boolean;
  onAbsenceDetected?: (durationSecs: number) => void;
  onMultipleFacesDetected?: () => void;
}

export function useWebcamProctor({
  enabled = true,
  onAbsenceDetected,
}: UseWebcamProctorProps) {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isFacePresent, setIsFacePresent] = useState<boolean>(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const absenceTimerRef = useRef<number>(0);

  // Initialize camera stream
  useEffect(() => {
    if (!enabled) return;
    let mounted = true;

    async function startCamera() {
      try {
        setError(null);
        // Stop any previous tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 24, max: 30 },
            facingMode: "user",
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          await videoRef.current.play().catch((err) => {
            console.warn("Video play interrupted:", err);
          });
        }

        setIsActive(true);
      } catch (err) {
        console.error("Camera acquisition error:", err);
        if (mounted) {
          setError("Webcam permissions not granted. Camera is required for AI invigilation.");
          setIsActive(false);
          setStream(null);
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setStream(null);
    };
  }, [enabled]);

  // Reactive video attachment effect: handles cases where videoRef mounts after camera starts
  useEffect(() => {
    const video = videoRef.current;
    if (video && stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.muted = true;
      video.play().catch((err) => {
        console.warn("[Webcam Proctor] Reactive play catch:", err);
      });
    }
  }, [stream, isActive]);

  // Client-side Face / Presence Check Loop
  useEffect(() => {
    if (!enabled || !isActive) return;

    // Create offscreen canvas for lightweight frame analysis
    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
      canvasRef.current.width = 160;
      canvasRef.current.height = 120;
    }

    const interval = setInterval(() => {
      const video = videoRef.current;
      const currentStream = streamRef.current;

      // Self-healing video binding: if video was mounted after loading state resolved
      if (video && currentStream && video.srcObject !== currentStream) {
        video.srcObject = currentStream;
        video.muted = true;
        video.play().catch(() => {});
      }

      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = frame.data;

      // Sample central pixel brightness to detect total darkness/blocking
      let totalLuma = 0;
      const step = 4 * 8; // sample every 8th pixel
      let samples = 0;
      for (let i = 0; i < data.length; i += step) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        totalLuma += 0.299 * r + 0.587 * g + 0.114 * b;
        samples++;
      }

      const avgLuma = totalLuma / samples;
      // If camera blocked/black (< 10) or blank white (> 245), face absent
      const detected = avgLuma > 12 && avgLuma < 245;
      setIsFacePresent(detected);

      if (!detected) {
        absenceTimerRef.current += 1;
        if (absenceTimerRef.current >= 5 && onAbsenceDetected) {
          onAbsenceDetected(absenceTimerRef.current);
        }
      } else {
        absenceTimerRef.current = 0;
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled, isActive, onAbsenceDetected]);

  // Capture Base64 Snapshot
  const captureSnapshot = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2) return null;

    try {
      const offscreen = document.createElement("canvas");
      offscreen.width = 320;
      offscreen.height = 240;
      const ctx = offscreen.getContext("2d");
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, offscreen.width, offscreen.height);
      return offscreen.toDataURL("image/webp", 0.6);
    } catch (e) {
      console.warn("Snapshot capture error:", e);
      return null;
    }
  }, []);

  return {
    videoRef,
    stream,
    isActive,
    error,
    isFacePresent,
    captureSnapshot,
  };
}
