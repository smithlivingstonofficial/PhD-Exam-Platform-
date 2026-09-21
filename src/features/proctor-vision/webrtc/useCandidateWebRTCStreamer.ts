"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_RTC_CONFIG,
  SignalingPayload,
  WebRTCConnectionState,
} from "./types";

export interface UseCandidateWebRTCStreamerProps {
  sessionId: string;
  stream: MediaStream | null;
  audioStream?: MediaStream | null;
  captureSnapshot?: () => string | null;
  enabled?: boolean;
}

export function useCandidateWebRTCStreamer({
  sessionId,
  stream,
  audioStream,
  captureSnapshot,
  enabled = true,
}: UseCandidateWebRTCStreamerProps) {
  const [connectionState, setConnectionState] = useState<WebRTCConnectionState>("IDLE");
  const [activeViewers, setActiveViewers] = useState<number>(0);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const iceCandidateBufferRef = useRef<RTCIceCandidateInit[]>([]);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Latest props stored in refs for stable listeners
  const streamRef = useRef<MediaStream | null>(stream);
  const audioStreamRef = useRef<MediaStream | null>(audioStream || null);
  const captureSnapshotRef = useRef(captureSnapshot);

  useEffect(() => {
    streamRef.current = stream;
    audioStreamRef.current = audioStream || null;
    captureSnapshotRef.current = captureSnapshot;
  }, [stream, audioStream, captureSnapshot]);

  // --------------------------------------------------------------------------
  // Fallback Snapshot Loop (Activated if UDP P2P is blocked by network NAT)
  // --------------------------------------------------------------------------
  const stopFallbackSnapshots = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, []);

  const startFallbackSnapshots = useCallback(() => {
    stopFallbackSnapshots();
    setConnectionState("FALLBACK");

    fallbackIntervalRef.current = setInterval(() => {
      const channel = channelRef.current;
      const snapshot = captureSnapshotRef.current ? captureSnapshotRef.current() : null;
      if (channel && snapshot) {
        channel.send({
          type: "broadcast",
          event: "SNAPSHOT_FRAME",
          payload: {
            from: "candidate",
            frame: snapshot,
            timestamp: Date.now(),
          },
        });
      }
    }, 2500);
  }, [stopFallbackSnapshots]);

  // --------------------------------------------------------------------------
  // Teardown Current PeerConnection
  // --------------------------------------------------------------------------
  const cleanupPeerConnection = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
    stopFallbackSnapshots();

    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    iceCandidateBufferRef.current = [];
    setConnectionState("IDLE");
  }, [stopFallbackSnapshots]);

  // --------------------------------------------------------------------------
  // Handle Incoming Request to Stream from Invigilator
  // --------------------------------------------------------------------------
  const handleRequestStream = useCallback(async () => {
    const channel = channelRef.current;
    const currentMediaStream = streamRef.current;
    if (!channel || !currentMediaStream) {
      console.warn("[WebRTC Candidate] Request received but media stream or channel is not available", {
        hasChannel: !!channel,
        hasStream: !!currentMediaStream,
      });
      return;
    }

    try {
      cleanupPeerConnection();
      setConnectionState("CONNECTING");

      // 1. Initialize PeerConnection with Google & Cloudflare STUN
      const pc = new RTCPeerConnection(DEFAULT_RTC_CONFIG);
      pcRef.current = pc;

      // 2. Combine video and audio into a unified MediaStream for clean receiver consumption
      const outboundStream = new MediaStream();
      currentMediaStream.getVideoTracks().forEach((track) => {
        track.enabled = true;
        outboundStream.addTrack(track);
      });

      if (audioStreamRef.current) {
        audioStreamRef.current.getAudioTracks().forEach((track) => {
          track.enabled = true;
          outboundStream.addTrack(track);
        });
      }

      // Add all tracks to PeerConnection
      outboundStream.getTracks().forEach((track) => {
        pc.addTrack(track, outboundStream);
      });

      // 3. Handle Local ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && channelRef.current) {
          channelRef.current.send({
            type: "broadcast",
            event: "ICE_CANDIDATE",
            payload: {
              from: "candidate",
              candidate: event.candidate.toJSON(),
              timestamp: Date.now(),
            },
          });
        }
      };

      // 4. Monitor ICE State & Failover
      pc.oniceconnectionstatechange = () => {
        const state = pc.iceConnectionState;
        if (state === "connected" || state === "completed") {
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
            connectionTimeoutRef.current = null;
          }
          stopFallbackSnapshots();
          setConnectionState("LIVE");
        } else if (state === "failed") {
          console.warn("[WebRTC Candidate] Direct P2P ICE failed. Initiating zero-cost WebP snapshot fallback.");
          startFallbackSnapshots();
        } else if (state === "disconnected") {
          setConnectionState("DISCONNECTED");
        }
      };

      // 5. Safety timeout: if not connected within 10 seconds, activate fallback
      connectionTimeoutRef.current = setTimeout(() => {
        if (pc.iceConnectionState !== "connected" && pc.iceConnectionState !== "completed") {
          console.warn("[WebRTC Candidate] Handshake timeout. Activating snapshot fallback.");
          startFallbackSnapshots();
        }
      }, 10000);

      // 6. Create SDP Offer
      const offer = await pc.createOffer({
        offerToReceiveVideo: false,
        offerToReceiveAudio: false,
      });

      await pc.setLocalDescription(offer);

      // 7. Configure maxBitrate on video sender via standard WebRTC API without mangling SDP
      try {
        pc.getSenders().forEach((sender) => {
          if (sender.track?.kind === "video") {
            const params = sender.getParameters();
            if (!params.encodings || params.encodings.length === 0) {
              params.encodings = [{}];
            }
            params.encodings[0].maxBitrate = 800000; // 800 kbps for crisp 720p HD live video
            sender.setParameters(params).catch(() => {});
          }
        });
      } catch {
        // Non-blocking if browser does not support setParameters on initial offer
      }

      // 8. Broadcast Offer to Invigilator
      await channel.send({
        type: "broadcast",
        event: "OFFER",
        payload: {
          from: "candidate",
          sdp: pc.localDescription?.sdp,
          type: pc.localDescription?.type,
          timestamp: Date.now(),
        },
      });

      setActiveViewers((prev) => Math.max(1, prev + 1));
    } catch (err) {
      console.error("[WebRTC Candidate] Error establishing peer connection:", err);
      startFallbackSnapshots();
    }
  }, [cleanupPeerConnection, startFallbackSnapshots, stopFallbackSnapshots]);

  // --------------------------------------------------------------------------
  // Supabase Realtime Signaling Listener
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!enabled || !sessionId) return;

    const supabase = createClient();
    const channelName = `proctor-stream:${sessionId}`;
    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false, ack: false },
      },
    });

    channelRef.current = channel;

    channel
      .on("broadcast", { event: "REQUEST_STREAM" }, () => {
        handleRequestStream();
      })
      .on("broadcast", { event: "ANSWER" }, async ({ payload }: { payload: SignalingPayload }) => {
        if (payload.from === "admin" && payload.sdp && pcRef.current) {
          try {
            if (pcRef.current.signalingState === "have-local-offer") {
              await pcRef.current.setRemoteDescription(
                new RTCSessionDescription({
                  type: payload.type || "answer",
                  sdp: payload.sdp,
                })
              );

              // Flush buffered candidates
              while (iceCandidateBufferRef.current.length > 0) {
                const cand = iceCandidateBufferRef.current.shift();
                if (cand) {
                  await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
                }
              }
            }
          } catch (err) {
            console.error("[WebRTC Candidate] Error applying answer:", err);
          }
        }
      })
      .on("broadcast", { event: "ICE_CANDIDATE" }, async ({ payload }: { payload: SignalingPayload }) => {
        if (payload.from === "admin" && payload.candidate) {
          try {
            if (pcRef.current && pcRef.current.remoteDescription) {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } else {
              iceCandidateBufferRef.current.push(payload.candidate);
            }
          } catch (err) {
            console.error("[WebRTC Candidate] Error adding remote ICE candidate:", err);
          }
        }
      })
      .on("broadcast", { event: "STOP_STREAM" }, () => {
        cleanupPeerConnection();
        setActiveViewers(0);
      });

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        // Channel ready for signaling
      }
    });

    return () => {
      cleanupPeerConnection();
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [enabled, sessionId, handleRequestStream, cleanupPeerConnection]);

  return {
    connectionState,
    activeViewers,
    isStreaming: connectionState === "LIVE" || connectionState === "FALLBACK",
  };
}
