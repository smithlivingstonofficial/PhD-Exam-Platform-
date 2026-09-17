// ==========================================
// SHARED DOMAIN TYPES & CONTRACTS
// All developers should import from this file
// Do not modify existing fields without team consensus
// ==========================================

export type ExamStatus =
  | 'SCHEDULED'
  | 'WAITING_ROOM'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'TERMINATED'
  | 'DISQUALIFIED'
  | 'ABSENT'
  | 'TECHNICAL_FAILURE';

export type AttendanceStatus =
  | 'NOT_REPORTED'
  | 'LOGGED_IN'
  | 'IN_EXAM'
  | 'SUBMITTED'
  | 'ABSENT'
  | 'DISQUALIFIED'
  | 'TECHNICAL_FAILURE';

export type SlotStatus =
  | 'SCHEDULED'
  | 'LOGIN_OPEN'
  | 'IN_PROGRESS'
  | 'CONCLUDED'
  | 'CANCELLED';

export type QuestionScope = 'COMMON' | 'DEPARTMENT_SPECIFIC';

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
  // Enhanced fields
  scope?: QuestionScope;
  department_id?: string | null;
  section_name?: string | null;
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
  // Enhanced fields
  slot_id?: string | null;
  attendance_status?: AttendanceStatus;
  login_at?: string | null;
  common_score?: number | null;
  department_score?: number | null;
  is_passed?: boolean | null;
  attempt_number?: number;
  is_eligible_for_retest?: boolean;
  retest_slot_id?: string | null;
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

// ----------------------------------------------------------------------------
// ACADEMIC DEPARTMENT & SCHOLAR ENTITIES
// ----------------------------------------------------------------------------

export interface Department {
  id: string;
  code: string; // e.g. "CSE", "MECH"
  name: string;
  description?: string | null;
  created_at: string;
  scholar_count?: number;
  question_count?: number;
}

export interface Student {
  id: string;
  reg_number: string;
  full_name: string;
  email: string;
  phone?: string | null;
  department_id: string;
  department_code?: string;
  department_name?: string;
  access_code: string;
  created_at: string;
}

export interface ExamSlot {
  id: string;
  exam_id: string;
  slot_number: number;
  slot_name: string;
  login_opens_at: string;
  start_time: string;
  join_window_closes_at: string;
  end_time: string;
  status: SlotStatus;
  is_retest_slot: boolean;
  created_at: string;
  enrolled_count?: number;
  attended_count?: number;
}
