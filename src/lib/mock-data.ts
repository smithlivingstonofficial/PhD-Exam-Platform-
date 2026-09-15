import { AntiCheatConfig, Question, ExamStatus } from "@/types";

export interface MockExam {
  id: string;
  title: string;
  course_code: string;
  description: string;
  duration_minutes: number;
  start_time: string;
  end_time: string;
  total_marks: number;
  passing_marks: number;
  is_published: boolean;
  anti_cheat_config: AntiCheatConfig;
  created_at: string;
  total_candidates: number;
  total_questions: number;
}

export interface MockCandidate {
  id: string;
  name: string;
  email: string;
  exam_id: string;
  status: ExamStatus;
  started_at: string | null;
  submitted_at: string | null;
  final_score: number | null;
  violation_count: number;
  integrity_score: number; // 0-100
  recent_incident?: string;
}

export const DEFAULT_ANTI_CHEAT_CONFIG: AntiCheatConfig = {
  enable_face_tracking: true,
  enable_audio_monitoring: true,
  max_tab_switches: 3,
  max_fullscreen_exits: 3,
  periodic_snapshot_interval_sec: 60,
  allowed_yaw_angle_deg: 28,
  allowed_pitch_angle_deg: 20,
};

export const INITIAL_MOCK_EXAMS: MockExam[] = [
  {
    id: "exam-phd-rm-101",
    title: "Ph.D Entrance & Coursework: Research Methodology & Statistical Modeling",
    course_code: "PHD-RM-901",
    description: "Evaluates empirical research design, hypothesis formulation, ANOVA/MANOVA modeling, and ethical compliance.",
    duration_minutes: 90,
    start_time: "2026-09-18T10:00:00Z",
    end_time: "2026-09-18T12:00:00Z",
    total_marks: 100,
    passing_marks: 55,
    is_published: true,
    anti_cheat_config: DEFAULT_ANTI_CHEAT_CONFIG,
    created_at: "2026-09-10T09:30:00Z",
    total_candidates: 42,
    total_questions: 10,
  },
  {
    id: "exam-phd-ai-202",
    title: "Ph.D Advanced Computer Science: Edge AI & Distributed Systems",
    course_code: "PHD-CS-904",
    description: "Assessment on WebAssembly inference optimization, consensus mechanisms, and edge-cloud federated architectures.",
    duration_minutes: 120,
    start_time: "2026-09-22T14:00:00Z",
    end_time: "2026-09-22T17:00:00Z",
    total_marks: 100,
    passing_marks: 60,
    is_published: false,
    anti_cheat_config: {
      ...DEFAULT_ANTI_CHEAT_CONFIG,
      max_tab_switches: 2,
      periodic_snapshot_interval_sec: 45,
    },
    created_at: "2026-09-12T11:15:00Z",
    total_candidates: 28,
    total_questions: 8,
  },
];

export const INITIAL_MOCK_QUESTIONS: Record<string, Question[]> = {
  "exam-phd-rm-101": [
    {
      id: "q-1",
      exam_id: "exam-phd-rm-101",
      question_text: "In quantitative research design, which statistical test is most appropriate when comparing the means of three or more independent groups with normally distributed data?",
      question_type: "MCQ",
      options: [
        { id: "a", text: "Student's Independent Samples t-test" },
        { id: "b", text: "One-Way Analysis of Variance (ANOVA)" },
        { id: "c", text: "Mann-Whitney U Test" },
        { id: "d", text: "Pearson Chi-Square Test of Independence" },
      ],
      marks: 2,
      negative_marks: 0.5,
      order_index: 1,
    },
    {
      id: "q-2",
      exam_id: "exam-phd-rm-101",
      question_text: "Which of the following threats to internal validity occurs when participants score differently simply because of repeated exposure to the measurement instrument?",
      question_type: "MCQ",
      options: [
        { id: "a", text: "History effect" },
        { id: "b", text: "Testing effect" },
        { id: "c", text: "Statistical regression toward the mean" },
        { id: "d", text: "Attrition/Mortality bias" },
      ],
      marks: 2,
      negative_marks: 0.5,
      order_index: 2,
    },
    {
      id: "q-3",
      exam_id: "exam-phd-rm-101",
      question_text: "Select all prerequisites necessary for establishing causal inference in empirical research:",
      question_type: "MULTI_SELECT",
      options: [
        { id: "a", text: "Temporal precedence (Cause precedes Effect in time)" },
        { id: "b", text: "Empirical covariance between variables" },
        { id: "c", text: "Non-spuriousness (Plausible confounding explanations ruled out)" },
        { id: "d", text: "Qualitative narrative endorsement by domain experts" },
      ],
      marks: 4,
      negative_marks: 1.0,
      order_index: 3,
    },
  ],
};

export const INITIAL_MOCK_CANDIDATES: MockCandidate[] = [
  {
    id: "cand-01",
    name: "Dr. Candidate Alex Morgan",
    email: "alex.morgan@univ.edu",
    exam_id: "exam-phd-rm-101",
    status: "IN_PROGRESS",
    started_at: "2026-09-18T10:05:00Z",
    submitted_at: null,
    final_score: null,
    violation_count: 0,
    integrity_score: 98,
    recent_incident: "Normal behavior (Face & Audio clean)",
  },
  {
    id: "cand-02",
    name: "Kavitha Ramanathan",
    email: "kavitha.r@univ.edu",
    exam_id: "exam-phd-rm-101",
    status: "IN_PROGRESS",
    started_at: "2026-09-18T10:02:00Z",
    submitted_at: null,
    final_score: null,
    violation_count: 2,
    integrity_score: 82,
    recent_incident: "HEAD_TURNED (Yaw +31° for 3.2s)",
  },
  {
    id: "cand-03",
    name: "Rohan V. Deshmukh",
    email: "rohan.deshmukh@univ.edu",
    exam_id: "exam-phd-rm-101",
    status: "IN_PROGRESS",
    started_at: "2026-09-18T10:01:00Z",
    submitted_at: null,
    final_score: null,
    violation_count: 4,
    integrity_score: 64,
    recent_incident: "TAB_SWITCH (Switched to external window for 6s)",
  },
  {
    id: "cand-04",
    name: "Sarah Chen",
    email: "sarah.chen@univ.edu",
    exam_id: "exam-phd-rm-101",
    status: "SUBMITTED",
    started_at: "2026-09-18T10:00:00Z",
    submitted_at: "2026-09-18T11:24:00Z",
    final_score: 88,
    violation_count: 0,
    integrity_score: 100,
    recent_incident: "Submitted successfully with pristine integrity",
  },
];
