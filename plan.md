# Ph.D Online Exam Platform — Master Engineering & Implementation Plan

## 1. Project Overview & Objectives

The **Ph.D Online Exam Platform** is a secure, cloud-native web application engineered to conduct high-stakes academic examinations (Ph.D coursework, entrance exams, and university evaluations). 

### Core Goals:
1. **Uncompromising Exam Integrity**: Continuous candidate identity verification, visual behavior monitoring (head pose, gaze, absence, multiple people), environment audio surveillance (human speech and ambient noise detection), and strict browser anti-cheat containment.
2. **Zero-Server-GPU & Ultra-Low Infrastructure Cost**: Eliminate multi-thousand dollar server streaming costs by executing all computer vision (MediaPipe) and voice activity detection (Silero VAD) directly inside the student's browser via WebAssembly/WebGPU.
3. **Bandwidth Optimization (< 5 MB per 2-hour exam)**: Replace continuous video streaming with an event-driven snapshot model. Compressed WebP snapshots and Opus audio snippets are uploaded only on anomaly triggers or periodic 60s heartbeats directly to **Cloudflare R2** with **$0 egress fees**.
4. **Data Isolation & Security**: Supabase PostgreSQL with strict Row Level Security (RLS). Question answer keys are never sent across the wire; timing and grading are strictly server-authoritative.

---

## 2. Technology Stack & Architectural Roles

| Component | Technology | Role & Justification |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 14/15 (App Router)** | React Server Components for fast initial loads, Client Components for canvas/WebRTC/audio processing, Server Actions / Route Handlers for secure API transactions. |
| **Styling & Design System** | **TailwindCSS + Custom Glassmorphism** | High-contrast, distraction-free examination UI, dark/light accessibility, responsive layout with exam question palette. |
| **Database & Auth** | **Supabase (PostgreSQL 15+)** | User authentication (role-based: Student, Examiner, Admin), Row Level Security (RLS) for data cloaking, PostgreSQL stored procedures, Realtime subscriptions for proctor dashboards. |
| **Evidence Storage** | **Cloudflare R2** | S3-compatible object storage for incident evidence (WebP snapshots, Opus audio clips). **$0 egress fees**, free tier of 10 GB storage and 10M read / 1M write operations. |
| **Security & Edge CDN** | **Cloudflare (DNS, WAF, Turnstile)** | Global edge caching, DDoS protection, bot prevention via Cloudflare Turnstile on login and exam start. |
| **Hosting & Compute** | **Vercel** | Edge deployment for Next.js app, zero server management, fast global edge routing. **Zero media streams routed through Vercel to preserve serverless bandwidth limits**. |
| **Visual Proctoring Engine**| **Google MediaPipe Tasks Vision** | Client-side Face Landmarker running via WebAssembly & WebGL. Tracks 478 3D landmarks for head pose (pitch/yaw/roll), gaze direction, face presence, and multiple people count. |
| **Audio Proctoring Engine** | **Silero VAD (`@ricky0123/vad-web`) + Web Audio API** | Client-side Voice Activity Detection in WebAssembly. Distinguishes human speech from keyboard typing/fans. RMS decibel analyzer for ambient volume monitoring. |

---

## 3. Proctoring Architecture & AI Algorithms

### 3.1 Visual Behavior Monitoring (Client-Side MediaPipe)
- **Model**: `@mediapipe/tasks-vision` (FaceLandmarker).
- **Execution Loop**: Offscreen `<video>` stream sampled every 150ms – 250ms via `requestAnimationFrame` loop.
- **Incident Classifications**:
  1. `FACE_ABSENT`: 0 face bounding boxes detected for > 3.0 consecutive seconds. (Severity: **HIGH**)
  2. `MULTIPLE_FACES`: > 1 face bounding box detected in frame. (Severity: **CRITICAL**)
  3. `HEAD_TURNED`: Calculated Pitch, Yaw, and Roll from facial mesh landmarks:
     - Yaw > ±28° (turning head left/right to look at notes or screen).
     - Pitch < -20° (looking down at mobile phone or lap).
     - Sustained duration > 2.5 seconds. (Severity: **MEDIUM**)
  4. `CAMERA_OCCLUDED`: Frame luminance variance < 5 (camera taped or pitch black). (Severity: **HIGH**)
- **Evidence Pipeline**:
  - Offscreen canvas captures 640x480 frame.
  - Converted to `image/webp` with 0.6 compression (~20 KB).
  - Uploaded directly to Cloudflare R2 via pre-signed URL with incident metadata payload.

### 3.2 Audio Environment Monitoring (Silero VAD + Web Audio API)
- **Ambient Noise**: `AudioContext` -> `BiquadFilterNode` (High-Pass 150 Hz) -> `AnalyserNode`. Calculates Root Mean Square (RMS) decibels every 100ms. If ambient noise exceeds baseline + 25 dB for > 4 seconds, triggers an environment alert.
- **Voice Activity Detection**: Silero VAD runs via ONNX Runtime WebAssembly in a Web Worker:
  - Detects vocal speech frequencies and speech probability.
  - Keeps a circular 5-second audio buffer in memory.
  - Upon speech trigger (`probability > 0.75`), flushes the 5s audio buffer to a WebM/Opus clip (~12 KB) and pushes incident `SPEECH_DETECTED` to R2.

---

## 4. Security, Anti-Cheating & Integrity Protocol

```
+-------------------------------------------------------------------------+
|                         Browser Lockdown Layer                          |
|  - Fullscreen Lockout (Auto-terminate after 3 violations)               |
|  - Page Visibility API (Alt+Tab / App Switch Detection)                 |
|  - DevTools Invalidator (F12, Ctrl+Shift+I, window delta debugger)      |
|  - Clipboard Interceptor (Cut/Copy/Paste/ContextMenu blocked)           |
|  - Virtual Camera Filter (Rejects OBS / ManyCam virtual drivers)        |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                      Transport & Session Integrity                      |
|  - Ephemeral Session JWT (contains session_id, student_id, expires_at)  |
|  - Dynamic Question Order (Seeded PRNG shuffle per student)             |
|  - Correct Answer Key Cloaking (Answers never sent to client)           |
|  - Heartbeat Ping Nonce (Cryptographic sequence check every 15s)         |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                    Database & Verification Integrity                    |
|  - Supabase PostgreSQL Row Level Security (RLS)                         |
|  - Server-Authoritative Timer (PostgreSQL timestamp comparisons)        |
|  - Tamper-Evident Audit Trail (`exam_audit_logs` append-only table)     |
|  - Offline-Resilient Local State (Encrypted IndexedDB cache)            |
+-------------------------------------------------------------------------+
```

---

## 5. PostgreSQL Database Schema (Supabase)

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Exams Specification
CREATE TABLE exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    course_code VARCHAR(50),
    description TEXT,
    duration_minutes INT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    total_marks NUMERIC NOT NULL DEFAULT 100,
    passing_marks NUMERIC NOT NULL DEFAULT 40,
    anti_cheat_config JSONB DEFAULT '{
      "enable_face_tracking": true,
      "enable_audio_monitoring": true,
      "max_tab_switches": 3,
      "max_fullscreen_exits": 3,
      "periodic_snapshot_interval_sec": 60
    }'::jsonb,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Questions (Correct answers hidden from student queries)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) CHECK (question_type IN ('MCQ', 'MULTI_SELECT', 'TEXT')),
    options JSONB NOT NULL, -- Array of [{ "id": "a", "text": "Option A" }, ...]
    correct_answers JSONB NOT NULL, -- Hidden by RLS; used solely by server grading functions
    marks NUMERIC NOT NULL DEFAULT 1,
    negative_marks NUMERIC NOT NULL DEFAULT 0,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Exam Sessions
CREATE TABLE exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id),
    status VARCHAR(20) CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'TERMINATED', 'DISQUALIFIED')) DEFAULT 'SCHEDULED',
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    final_score NUMERIC,
    violation_count INT DEFAULT 0,
    integrity_score INT DEFAULT 100, -- Decrements upon high-severity infractions
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(exam_id, student_id)
);

-- 4. Session Answers
CREATE TABLE session_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_options JSONB, -- Array of selected option IDs
    text_response TEXT,
    is_marked_for_review BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(session_id, question_id)
);

-- 5. Exam Audit & Incident Telemetry
CREATE TABLE exam_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'FACE_ABSENT', 'MULTIPLE_FACES', 'HEAD_TURNED', 'SPEECH_DETECTED', 'TAB_SWITCH', 'FULLSCREEN_EXIT', 'HEARTBEAT'
    severity VARCHAR(20) CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    timestamp TIMESTAMPTZ DEFAULT now(),
    evidence_snapshot_url TEXT,
    evidence_audio_url TEXT,
    details JSONB
);

-- Indexes for performance
CREATE INDEX idx_sessions_student_exam ON exam_sessions(student_id, exam_id);
CREATE INDEX idx_answers_session ON session_answers(session_id);
CREATE INDEX idx_audit_session_timestamp ON exam_audit_logs(session_id, timestamp DESC);
```

---

## 6. Implementation Milestones

### Milestone 1: Foundation & Design System Setup
- Initialize Next.js project with TypeScript and TailwindCSS.
- Establish responsive, clean exam layout:
  - Header: Exam title, authoritative countdown timer, network indicator, proctor status badges.
  - Question Viewport: Clear typography, math notation support, option selection cards.
  - Question Navigation Palette: Grid of question pills (Answered: Green, Marked for Review: Purple, Unanswered: Gray).
  - Floating Proctor PIP (Picture-in-Picture) window showing candidate's webcam feed with AI status indicators.

### Milestone 2: Supabase Integration & RLS Engine
- Configure Supabase client and server-side utilities (`@supabase/ssr`).
- Seed sample Ph.D exam dataset with multiple choice and multi-select questions.
- Write Row Level Security (RLS) policies:
  - Students can read questions only while `exam_sessions.status == 'IN_PROGRESS'`.
  - `correct_answers` column is completely omitted from student select views.
  - Students can read and insert answers only for their active `session_id`.

### Milestone 3: Client-Side Edge AI Proctoring Module
- Create `CameraProctor` component integrating `@mediapipe/tasks-vision`.
- Implement real-time landmark calculation for head pose, yaw, pitch, and multi-face detection.
- Create `AudioProctor` component integrating Web Audio API + Silero VAD.
- Construct canvas snapshot serializer (`image/webp`) and 5s audio buffer recorder.

### Milestone 4: Direct-to-Storage Cloudflare R2 Uploads
- Create Next.js API route `/api/storage/presigned-url` to generate secure S3 PUT URLs for Cloudflare R2.
- Direct-upload flagged images and audio snippets from browser to R2 without routing media payloads through Vercel.

### Milestone 5: Anti-Cheat Containment & Security Traps
- Fullscreen lock with custom non-intrusive warning modal.
- Page Visibility and `blur` listeners with violation counters.
- DevTools shortcut interception and right-click/clipboard lockdown.
- Auto-submission mechanism when the server-authoritative timer expires or violation count exceeds threshold.

### Milestone 6: Real-Time Proctor / Examiner Dashboard
- Build Examiner / Invigilator dashboard:
  - Grid view of all active candidates.
  - Live integrity health score (100% down to 0%).
  - Real-time incident alert feed with one-click snapshot and audio preview.
  - One-click manual disqualification or warning dispatch.
