"use client";

import { useEffect, useRef, useState } from "react";

interface UseAudioMonitorProps {
  enabled?: boolean;
  threshold?: number; // 0 to 100
  onLoudAudioDetected?: (level: number) => void;
}

export function useAudioMonitor({
  enabled = true,
  threshold = 65,
  onLoudAudioDetected,
}: UseAudioMonitorProps) {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let isMounted = true;

    async function initAudio() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        setStream(stream);
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        if (audioCtx.state === "suspended") {
          audioCtx.resume().catch(() => {});
        }

        const handleResume = () => {
          if (audioContextRef.current && audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume().catch(() => {});
          }
        };
        window.addEventListener("click", handleResume, { once: true });
        window.addEventListener("keydown", handleResume, { once: true });

        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        setIsMicActive(true);

        const checkAudio = () => {
          if (!isMounted || !audioContextRef.current) return;

          if (audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume().catch(() => {});
          }

          analyser.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          // Normalize to 0 - 100
          const level = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(level);

          if (level > threshold && onLoudAudioDetected) {
            onLoudAudioDetected(level);
          }

          requestAnimationFrame(checkAudio);
        };

        requestAnimationFrame(checkAudio);
      } catch (err) {
        console.warn("Audio monitor init error:", err);
        if (isMounted) setIsMicActive(false);
      }
    }

    initAudio();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setStream(null);
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [enabled, onLoudAudioDetected, threshold]);

  return {
    audioLevel,
    isMicActive,
    stream,
  };
}
