// ============================================================================
// WebRTC Direct P2P Streaming Contracts & Configuration
// Zero-Server-Egress Live Proctoring Architecture
// ============================================================================

export type WebRTCConnectionState =
  | "IDLE"
  | "CONNECTING"
  | "LIVE"
  | "FALLBACK"
  | "DISCONNECTED"
  | "FAILED";

export type SignalingEventType =
  | "REQUEST_STREAM"
  | "OFFER"
  | "ANSWER"
  | "ICE_CANDIDATE"
  | "STOP_STREAM"
  | "SNAPSHOT_FRAME";

export interface SignalingPayload {
  from: "admin" | "candidate";
  sdp?: string;
  type?: RTCSdpType;
  candidate?: RTCIceCandidateInit;
  frame?: string; // Base64 WebP snapshot for fallback
  timestamp?: number;
  adminId?: string;
}

export interface SignalingMessage {
  event: SignalingEventType;
  payload: SignalingPayload;
}

/**
 * Free Public STUN Servers (Google & Cloudflare)
 * $0 Cost NAT discovery and public IP reflection
 */
export const DEFAULT_RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ],
  iceCandidatePoolSize: 2,
};
