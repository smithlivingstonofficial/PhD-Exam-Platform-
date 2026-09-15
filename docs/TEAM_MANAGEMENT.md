# GitHub Team Collaboration & Development Workflow Guide

This document outlines the collaborative engineering standards, Git branching models, project tracking, and review workflows for developing the **Ph.D Online Exam Platform**.

---

## 1. Team Roles & Responsibilities

| Role | Primary Responsibilities | Key Directories / Files |
| :--- | :--- | :--- |
| **Lead / DevOps** | Architecture integrity, CI/CD pipelines, Vercel/Cloudflare configuration, branch protection | `.github/`, `next.config.ts`, `plan.md` |
| **Frontend Engineer** | Exam viewport, responsive question palette, candidate dashboard, exam timer, styling | `src/app/exam/`, `src/components/ui/`, `src/app/globals.css` |
| **AI / Edge-ML Engineer** | MediaPipe FaceLandmarker integration, Silero VAD audio worker, canvas snapshot compressor | `src/lib/proctor/`, `src/components/proctor/` |
| **Backend & Cloud Engineer**| Supabase schema, RLS policies, Cloudflare R2 presigned URLs, grading API | `src/lib/supabase/`, `src/app/api/` |

---

## 2. Git Branching Strategy

We follow the **GitHub Flow** with a protected `main` branch and feature branches:

```
[ main ] ─────── (Protected: Production-ready, auto-deploys to Vercel)
   │
   ├─► [ feat/mediapipe-face-tracking ] ──► (PR with CI Checks) ──► Merge to main
   ├─► [ feat/silero-vad-audio ] ────────► (PR with CI Checks) ──► Merge to main
   ├─► [ feat/fullscreen-lockdown ] ─────► (PR with CI Checks) ──► Merge to main
   └─► [ fix/timer-drift ] ──────────────► (PR with CI Checks) ──► Merge to main
```

### Branch Naming Conventions:
- Features: `feat/<short-description>` (e.g., `feat/audio-vad-detector`)
- Bug fixes: `fix/<short-description>` (e.g., `fix/fullscreen-exit-counter`)
- Performance: `perf/<short-description>` (e.g., `perf/canvas-webp-compression`)
- Documentation: `docs/<short-description>` (e.g., `docs/supabase-rls-setup`)

---

## 3. Commit Message Standards (Conventional Commits)

Format: `<type>(<scope>): <short description>`

Examples:
- `feat(proctor): integrate mediapipe face mesh for head pose yaw/pitch`
- `feat(security): add window blur and visibilitychange alt-tab detector`
- `fix(timer): prevent client clock manipulation with postgres timestamp check`
- `docs(readme): update project architecture and team setup instructions`

Allowed Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`.

---

## 4. GitHub Project Board (Kanban Sprints)

Set up a **GitHub Project (v2)** with columns:
1. 📋 **Product Backlog**: Raw user stories and future enhancements.
2. 🎯 **Sprint Backlog (Ready)**: Well-defined issues ready for development in the current sprint.
3. 🚧 **In Progress**: Actively being coded (max 2 active issues per developer).
4. 🔍 **In Code Review**: Pull Requests opened, awaiting peer review.
5. ✅ **Done**: Merged into `main` and verified on Vercel deployment.

---

## 5. Pull Request & Code Review Process

1. **Self-Check Before Opening PR**:
   - Run `npm run lint` locally — ensure 0 errors.
   - Run `npm run build` locally — ensure TypeScript compiles cleanly.
2. **Review Criteria**:
   - **Performance**: Is any heavy video/audio streaming routed through Next.js serverless functions? (Strict violation: all ML must be client-side).
   - **Security**: Are questions sent to the client stripped of `correct_answers`?
   - **Cost**: Are media uploads hitting Cloudflare R2 directly with pre-signed URLs?
3. **Approval Rule**: At least **1 peer review approval** is required before merging.
