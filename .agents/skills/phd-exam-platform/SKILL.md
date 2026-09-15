---
name: phd-exam-platform
description: >-
  Use this skill whenever building, modifying, or maintaining the Ph.D Online Exam Platform.
  It provides architectural rules, client-side Edge-AI proctoring standards (MediaPipe and Silero VAD),
  anti-cheat lockdown guidelines, zero-egress Cloudflare R2 storage patterns, and Supabase RLS security conventions.
---

# Ph.D Online Exam Platform Development Skill

This skill contains the technical principles, architectural constraints, and implementation runbooks for developing the Ph.D Online Exam Platform using Next.js, Supabase, Cloudflare R2, and client-side Edge AI.

---

## 1. Golden Architectural Rules

1. **NEVER Route Video/Audio Streams Through Vercel or Serverless Functions**:
   - Vercel functions have strict memory, execution time, and bandwidth limits.
   - All AI inference for camera (face presence, head pose, multiple people) and mic (speech detection, ambient noise) MUST run **client-side directly in the student's browser** via WebAssembly & WebGPU.
   - All media evidence (WebP snapshots, Opus audio clips) MUST be uploaded **directly to Cloudflare R2** via pre-signed S3 URLs.

2. **Zero Egress Cost Architecture**:
   - Cloudflare R2 has $0 egress fees. Always store incident snapshots and audio recordings in R2 rather than Supabase Storage or AWS S3 to maintain ultra-low cost.
   - Use Next.js Server Actions / API Route `/api/storage/presigned-url` only to sign short-lived (5-minute) PUT URLs.

3. **Answer Cloaking & Server-Authoritative Integrity**:
   - **NEVER send `correct_answers` or grading rubrics to the client browser.**
   - Questions fetched by the student client must exclude answer keys.
   - Answer grading and score calculations happen strictly in Supabase PostgreSQL stored functions or secure Next.js Server Actions upon submission.
   - Exam timers must be server-authoritative (`started_at` + `duration_minutes` compared against `now()` in PostgreSQL).

---

## 2. Client-Side Edge AI Proctoring Standards

### Visual Proctoring (MediaPipe Tasks Vision)
- Package: `@mediapipe/tasks-vision`
- Run inference in a non-blocking `requestAnimationFrame` loop (sampling interval: 150ms – 250ms).
- **Incident Triggers & Thresholds**:
  - `FACE_ABSENT`: 0 faces detected for > 3.0 seconds continuous.
  - `MULTIPLE_FACES`: > 1 face detected in frame.
  - `HEAD_TURNED`:
    - Yaw angle $> |28^\circ|$ (looking left/right).
    - Pitch angle $< -20^\circ$ (looking down at lap or phone).
    - Sustained for $> 2.5$ seconds.
- **Snapshot Generator**:
  - Draw `<video>` frame into an offscreen `<canvas>` at 640x480 resolution.
  - Export using `canvas.toBlob(blob => ..., 'image/webp', 0.6)`.
  - Target file size: 15 KB – 35 KB per snapshot.

### Audio Proctoring (Silero VAD + Web Audio API)
- Package: `@ricky0123/vad-web` + native `AudioContext`
- **Ambient Noise**:
  - Use `AnalyserNode` with `fftSize: 512`.
  - High-pass filter at 150 Hz to remove low-frequency hums.
  - Compute RMS decibels. Alert if room noise exceeds ambient baseline by +25 dB for > 4s.
- **Voice Activity Detection**:
  - Silero VAD runs on WebAssembly in a Web Worker to identify human speech.
  - Maintain a circular 5-second audio buffer.
  - When speech probability $> 0.75$, extract the 5-second WebM/Opus clip and upload as evidence with incident tag `SPEECH_DETECTED`.

---

## 3. Anti-Cheating & Browser Lockdown Rules

1. **Fullscreen Enforcement**:
   - Call `document.documentElement.requestFullscreen()` on exam start.
   - Listen for `fullscreenchange`. If exited, increment violation counter, capture snapshot, and display an urgent warning modal. Auto-terminate if violations exceed 3.
2. **Page Visibility & Window Focus**:
   - Attach listeners to `document.addEventListener('visibilitychange', ...)` and `window.addEventListener('blur', ...)`.
   - Any tab switch or minimization flags `TAB_SWITCH` incident.
3. **Hardware / Virtual Device Filtering**:
   - Query `navigator.mediaDevices.enumerateDevices()`.
   - Inspect device labels for software cameras (OBS, ManyCam, Camo, v4l2loopback). Refuse start if a virtual camera is active.
4. **Input Interception**:
   - Prevent default behavior for `copy`, `cut`, `paste`, and `contextmenu`.
   - Intercept key combinations: `F12`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+U`, `Alt+Tab`.

---

## 4. Supabase Database & Security Conventions

1. **Row Level Security (RLS)**:
   - Enable RLS on ALL tables: `exams`, `questions`, `exam_sessions`, `session_answers`, `exam_audit_logs`.
   - Create separate views or specific column selects so students never receive `correct_answers`.
2. **Atomic Answer Syncing**:
   - Persist answers to `session_answers` with an `UPSERT` on `(session_id, question_id)`.
   - Maintain an offline draft in browser `IndexedDB` or `localStorage` to survive transient internet dropouts.
3. **Audit Trail**:
   - Log all telemetry events into `exam_audit_logs` with columns: `session_id`, `event_type`, `severity`, `timestamp`, `evidence_snapshot_url`, `evidence_audio_url`, `details`.

---

## 5. UI/UX Design System Guidelines

- **Typography**: Inter or Outfit via Google Fonts.
- **Theme**: Premium high-contrast dark and light themes (slate/zinc palette with emerald/violet accents).
- **Exam Layout**:
  - **Top Bar**: Exam Title, Live Server Countdown Timer, Network Connectivity Status, Proctor Health Pill.
  - **Main Content**: Split viewport with active question, math-friendly markdown rendering, and option selection cards.
  - **Question Navigation Grid**: 1 to N question pills showing status:
    - Green = Answered
    - Purple = Marked for Review
    - Amber = Answered & Marked for Review
    - Slate/Gray = Not Visited / Unanswered
  - **Floating Proctor PIP**: Draggable or corner-docked webcam preview with real-time AI status indicators (e.g. "Face Detected", "Mic Active").

---

## 6. Git Workflow, Branch Protection & Team Isolation Rules

1. **NEVER Commit to `main` Directly**:
   - The agent MUST check the current branch before committing (`git branch --show-current`).
   - If on `main`, immediately checkout a branch: `git checkout -b feat/<feature-name>`.
2. **Feature-Sliced Isolation**:
   - Work ONLY inside the developer's assigned feature directory (`src/features/<feature-name>/`) and test sandbox (`src/app/sandbox/<feature-name>/`).
   - Do NOT edit other developers' feature folders or shared root layouts (`app/page.tsx`, `layout.tsx`).
3. **Shared Contracts**:
   - All shared types are imported from `@/types` (`src/types/index.ts`). Do not modify existing contracts without team consensus.
4. **Pre-Push Validation**:
   - Always run `npm run lint` and `npm run build` to verify 0 errors before committing or opening a pull request.

