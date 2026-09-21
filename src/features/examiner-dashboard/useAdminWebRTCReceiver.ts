"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_RTC_CONFIG,
  SignalingPayload,
  WebRTCConnectionState,
} from "@/features/proctor-vision/webrtc/types";

export interface UseAdminWebRTCReceiverProps {
  sessionId: string | null;
  autoConnect?: boolean;
}

export function useAdminWebRTCReceiver({
  sessionId,
  autoConnect = false,
}: UseAdminWebRTCReceiverProps) {
  const [connectionState, setConnectionState] = useState<WebRTCConnectionState>("IDLE");
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [fallbackSnapshot, setFallbackSnapshot] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const iceCandidateBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const inboundStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --------------------------------------------------------------------------
  // Clean up WebRTC & Audio Context
  // --------------------------------------------------------------------------
  const cleanupConnection = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    if (videoElementRef.current) {
      videoElementRef.current.srcObject = null;
    }

    iceCandidateBufferRef.current = [];
    inboundStreamRef.current = null;
    setRemoteStream(null);
    setAudioLevel(0);
    setLatencyMs(null);
  }, []);

  // --------------------------------------------------------------------------
  // Disconnect & Notify Candidate
  // --------------------------------------------------------------------------
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: "broadcast",
        event: "STOP_STREAM",
        payload: {
          from: "admin",
          timestamp: Date.now(),
        },
      });
    }
    cleanupConnection();
    setConnectionState("IDLE");
  }, [cleanupConnection]);

  // --------------------------------------------------------------------------
  // Analyze Remote Audio Track for dB meter in Admin View
  // --------------------------------------------------------------------------
  const setupAudioAnalyzer = useCallback((stream: MediaStream) => {
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      // Ensure AudioContext is resumed in modern browsers
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkLevel = () => {
        if (!audioContextRef.current) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        animFrameRef.current = requestAnimationFrame(checkLevel);
      };

      animFrameRef.current = requestAnimationFrame(checkLevel);
    } catch (err) {
      console.warn("[WebRTC Admin] Audio analysis init failed:", err);
    }
  }, []);

  // --------------------------------------------------------------------------
  // Connect: Request P2P stream from candidate
  // --------------------------------------------------------------------------
  const connect = useCallback(async () => {
    if (!sessionId) {
      setErrorMessage("No candidate session identifier specified.");
      return;
    }

    try {
      cleanupConnection();
      setErrorMessage(null);
      setConnectionState("CONNECTING");

      const channel = channelRef.current;
      if (!channel) {
        console.warn("[WebRTC Admin] Channel not ready yet");
        return;
      }

      // Send REQUEST_STREAM to the candidate
      await channel.send({
        type: "broadcast",
        event: "REQUEST_STREAM",
        payload: {
          from: "admin",
          timestamp: Date.now(),
        },
      });

      // Handshake safety timeout
      timeoutRef.current = setTimeout(() => {
        if (connectionState === "CONNECTING") {
          console.warn("[WebRTC Admin] Stream request timed out waiting for candidate offer.");
        }
      }, 10000);
    } catch (err) {
      console.error("[WebRTC Admin] Failed to send stream request:", err);
      setErrorMessage("Failed to send stream request to candidate.");
      setConnectionState("FAILED");
    }
  }, [sessionId, cleanupConnection, connectionState]);

  // --------------------------------------------------------------------------
  // Toggle Audio Mute
  // --------------------------------------------------------------------------
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (videoElementRef.current) {
        videoElementRef.current.muted = next;
      }
      return next;
    });
  }, []);

  // --------------------------------------------------------------------------
  // Bind Video Ref
  // --------------------------------------------------------------------------
  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      videoElementRef.current = el;
      if (el && remoteStream) {
        el.srcObject = remoteStream;
        el.defaultMuted = true;
        el.muted = isMuted;
        el.play().catch(() => {});
      }
    },
    [remoteStream, isMuted]
  );

  // Keep video element synchronized when remoteStream or isMuted updates
  useEffect(() => {
    if (videoElementRef.current && remoteStream) {
      videoElementRef.current.srcObject = remoteStream;
      videoElementRef.current.defaultMuted = true;
      videoElementRef.current.muted = isMuted;
      videoElementRef.current.play().catch((err) => {
        console.warn("[WebRTC Admin] Video element auto-play catch:", err);
      });
    }
  }, [remoteStream, isMuted]);

  // --------------------------------------------------------------------------
  // Supabase Channel Management
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!sessionId) return;

    const supabase = createClient();
    const channelName = `proctor-stream:${sessionId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false, ack: false },
      },
    });

    channelRef.current = channel;

    // Listen for Candidate SDP Offer
    channel.on("broadcast", { event: "OFFER" }, async ({ payload }: { payload: SignalingPayload }) => {
      if (payload.from !== "candidate" || !payload.sdp) return;

      try {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (payload.timestamp) {
          const latency = Math.max(1, Date.now() - payload.timestamp);
          setLatencyMs(latency);
        }

        // 1. Initialize PeerConnection with Google & Cloudflare STUN
        const pc = new RTCPeerConnection(DEFAULT_RTC_CONFIG);
        pcRef.current = pc;
        inboundStreamRef.current = new MediaStream();

        // 2. Handle Incoming Remote Tracks
        pc.ontrack = (event) => {
          if (!inboundStreamRef.current) {
            inboundStreamRef.current = new MediaStream();
          }

          // Ensure track is tracked in our persistent inbound stream
          const currentTracks = inboundStreamRef.current.getTracks();
          if (!currentTracks.some((t) => t.id === event.track.id)) {
            inboundStreamRef.current.addTrack(event.track);
          }

          // Generate a fresh stream object instance so React triggers state re-renders
          const activeTracks = inboundStreamRef.current.getTracks();
          const freshStream = new MediaStream(activeTracks);

          setRemoteStream(freshStream);
          setConnectionState("LIVE");

          if (videoElementRef.current) {
            videoElementRef.current.srcObject = freshStream;
            videoElementRef.current.defaultMuted = true;
            videoElementRef.current.muted = isMuted;
            videoElementRef.current.play().catch((err) => {
              console.warn("[WebRTC Admin] Video play catch:", err);
            });
          }

          if (event.track.kind === "audio") {
            setupAudioAnalyzer(freshStream);
          }
        };

        // 3. Collect Local ICE Candidates & Send to Candidate
        pc.onicecandidate = (event) => {
          if (event.candidate && channelRef.current) {
            channelRef.current.send({
              type: "broadcast",
              event: "ICE_CANDIDATE",
              payload: {
                from: "admin",
                candidate: event.candidate.toJSON(),
                timestamp: Date.now(),
              },
            });
          }
        };

        // 4. ICE Connection State Monitoring
        pc.oniceconnectionstatechange = () => {
          const state = pc.iceConnectionState;
          if (state === "connected" || state === "completed") {
            setConnectionState("LIVE");
          } else if (state === "failed") {
            console.warn("[WebRTC Admin] P2P ICE failed. Awaiting fallback snapshots.");
            setConnectionState("FALLBACK");
          } else if (state === "disconnected") {
            setConnectionState("DISCONNECTED");
          }
        };

        // 5. Apply Remote Offer
        await pc.setRemoteDescription(
          new RTCSessionDescription({
            type: payload.type || "offer",
            sdp: payload.sdp,
          })
        );

        // 6. Flush queued candidate ICE
        while (iceCandidateBufferRef.current.length > 0) {
          const cand = iceCandidateBufferRef.current.shift();
          if (cand) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
        }

        // 7. Create SDP Answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // 8. Broadcast Answer back to Candidate
        await channel.send({
          type: "broadcast",
          event: "ANSWER",
          payload: {
            from: "admin",
            sdp: answer.sdp,
            type: answer.type,
            timestamp: Date.now(),
          },
        });
      } catch (err) {
        console.error("[WebRTC Admin] Error handling candidate offer:", err);
        setErrorMessage("Error completing WebRTC handshake with candidate.");
        setConnectionState("FAILED");
      }
    });

    // Listen for Candidate ICE Candidates
    channel.on("broadcast", { event: "ICE_CANDIDATE" }, async ({ payload }: { payload: SignalingPayload }) => {
      if (payload.from === "candidate" && payload.candidate) {
        try {
          if (pcRef.current && pcRef.current.remoteDescription) {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } else {
            iceCandidateBufferRef.current.push(payload.candidate);
          }
        } catch (err) {
          console.error("[WebRTC Admin] Error adding remote candidate:", err);
        }
      }
    });

    // Listen for Fallback Snapshots
    channel.on("broadcast", { event: "SNAPSHOT_FRAME" }, ({ payload }: { payload: SignalingPayload }) => {
      if (payload.from === "candidate" && payload.frame) {
        setFallbackSnapshot(payload.frame);
        setConnectionState("FALLBACK");
      }
    });

    // Listen for Stop Stream
    channel.on("broadcast", { event: "STOP_STREAM" }, () => {
      cleanupConnection();
      setConnectionState("DISCONNECTED");
    });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED" && autoConnect) {
        connect();
      }
    });

    return () => {
      cleanupConnection();
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [sessionId, autoConnect, isMuted, setupAudioAnalyzer, connect, cleanupConnection]);

  return {
    connectionState,
    remoteStream,
    fallbackSnapshot,
    isMuted,
    audioLevel,
    latencyMs,
    errorMessage,
    connect,
    disconnect,
    toggleMute,
    setVideoRef,
    isLive: connectionState === "LIVE",
    isFallback: connectionState === "FALLBACK",
  };
}
