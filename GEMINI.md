# Team Git Workflow & Code Quality Guardrails (Agent Memory)

This file serves as the persistent memory and operational rulebook for any AI Agent working within this repository. Whenever any team member pulls and works on this codebase, you (the agent) MUST strictly adhere to and enforce the following protocols:

---

## 🛑 1. Git Branch Protection: NEVER Commit Directly to `main`

- **Branch Check**: Before running `git commit`, ALWAYS inspect the active branch (`git branch --show-current`).
- **Forbidden Action**: NEVER commit or push code directly to the `main` branch.
- **Enforcement Procedure**:
  1. If currently on `main`, immediately check out a dedicated feature branch before making or committing changes:
     ```bash
     git checkout -b feat/<assigned-feature>
     ```
  2. Follow the standard naming convention:
     - Features: `feat/<feature-name>` (e.g., `feat/mediapipe-vision`, `feat/silero-audio-vad`, `feat/anti-cheat-lock`, `feat/exam-palette`)
     - Bugfixes: `fix/<bug-name>`
     - Documentation: `docs/<topic>`

---

## 📦 2. Feature-Sliced Isolation (Zero Merge Conflict Rule)

Every developer is assigned a specific feature domain. When assisting a developer, restrict file edits to their designated feature folder and sandbox:

| Assigned Feature | Allowed Feature Folder | Allowed Test Sandbox |
| :--- | :--- | :--- |
| **Visual AI Proctoring** | `src/features/proctor-vision/` | `src/app/sandbox/vision/` |
| **Audio AI Proctoring** | `src/features/proctor-audio/` | `src/app/sandbox/audio/` |
| **Anti-Cheat Lockdown** | `src/features/anti-cheat/` | `src/app/sandbox/security/` |
| **Exam Viewport & UI** | `src/features/exam-session/` | `src/app/sandbox/exam/` |
| **Examiner Dashboard** | `src/features/examiner-dashboard/` | `src/app/sandbox/dashboard/` |
| **Cloudflare R2 & Storage** | `src/features/storage-r2/` | `src/app/api/storage/` |

- **Strict Warning**: Do NOT edit another developer's feature directory.
- **Shared Layouts**: Do NOT modify `src/app/page.tsx`, `src/app/layout.tsx`, or `src/app/globals.css` during feature development. All feature testing MUST occur in the respective `/sandbox/<feature>` page.

---

## 📜 3. Shared Domain Contracts

- All shared interfaces and types reside centrally in `src/types/index.ts`.
- Always import types via alias: `import { ExamIncident, Question, ExamSession } from "@/types";`.
- Do NOT alter existing field signatures in `src/types/index.ts` without explicit team approval, as this could break other developers' builds.

---

## ⚡ 4. Architectural & Performance Invariants

- **Client-Side Edge AI**: All computer vision (MediaPipe) and voice activity detection (Silero VAD) MUST execute client-side in the browser via WebAssembly / WebGPU.
- **No Video Streaming through Serverless**: NEVER route continuous WebRTC, HLS, or audio streams through Vercel or Next.js route handlers.
- **Zero-Egress Direct Uploads**: Event snapshots (WebP) and audio clips (Opus) must upload directly to Cloudflare R2 using pre-signed S3 URLs.
- **Answer Cloaking**: Never expose `correct_answers` in question payloads sent to candidate clients.

---

## ✅ 5. Pre-Commit Pre-Flight Verification

Before concluding a task or pushing a commit:
1. Run `npm run lint` — ensure 0 lint errors.
2. Run `npm run build` — ensure TypeScript and Next.js compile cleanly with 0 type errors.
3. Use Conventional Commits format:
   - `feat(scope): short description`
   - `fix(scope): short description`
   - `docs(scope): short description`
