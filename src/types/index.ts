// ==========================================
// SHARED DOMAIN TYPES & CONTRACTS
// All developers should import from this file
// Do not modify without team consensus
// ==========================================

export type ExamStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'SUBMITTED' | 'TERMINATED' | 'DISQUALIFIED';

export type QuestionType = 'MCQ' | 'MULTI_SELECT' | 'TEXT';

export type IncidentType =
  | 'FACE_ABSENT'
  | 'MULTIPLE_FACES'
  | 'HEAD_TURNED'
  | 'CAMERA_OCCLUDED'
  | 'SPEECH_DETECTED'
  | 'HIGH_NOISE'
  | 'TAB_SWITCH'
  | 'WINDOW_BLUR'
  | 'FULLSCREEN_EXIT'
  | 'DEVTOOLS_OPENED'
  | 'CLIPBOARD_PASTE'
  | 'HEARTBEAT_MISSED';

export type SeverityLevel = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AntiCheatConfig {
  enable_face_tracking: boolean;
  enable_audio_monitoring: boolean;
  max_tab_switches: number;
  max_fullscreen_exits: number;
  periodic_snapshot_interval_sec: number;
  allowed_yaw_angle_deg: number;
  allowed_pitch_angle_deg: number;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: QuestionType;
  options: QuestionOption[];
  marks: number;
  negative_marks: number;
  order_index: number;
  // NOTE: correct_answers is strictly excluded on client-side
}

export interface ExamSession {
  id: string;
  exam_id: string;
  student_id: string;
  status: ExamStatus;
  started_at: string | null;
  expires_at: string | null;
  submitted_at: string | null;
  final_score: number | null;
  violation_count: number;
  integrity_score: number; // 0 to 100
}

export interface SessionAnswer {
  session_id: string;
  question_id: string;
  selected_options: string[];
  text_response?: string;
  is_marked_for_review: boolean;
  updated_at: string;
}

export interface ExamIncident {
  id?: string;
  session_id: string;
  event_type: IncidentType;
  severity: SeverityLevel;
  timestamp: string;
  evidence_snapshot_url?: string;
  evidence_audio_url?: string;
  details?: Record<string, unknown>;
}

export interface ProctorStatus {
  cameraActive: boolean;
  micActive: boolean;
  faceDetected: boolean;
  multipleFaces: boolean;
  headPoseNormal: boolean;
  speechDetected: boolean;
  noiseLevelDb: number;
  fullscreenActive: boolean;
  tabActive: boolean;
}
