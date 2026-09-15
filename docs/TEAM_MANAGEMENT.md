# Multi-Developer Collaboration Playbook: Zero Merge Conflicts

When **every team member is a developer building a different feature**, the #1 danger is stepping on each other's toes, breaking shared files like `app/page.tsx` or `layout.tsx`, and dealing with painful Git merge conflicts.

This playbook establishes a **Modular Feature-Sliced Architecture** where every developer can build, test, and commit their feature with complete autonomy.

---

## 1. Feature Ownership Matrix

Each developer owns one isolated feature module in `src/features/` and one test sandbox in `src/app/sandbox/`:

| Developer | Assigned Feature | Feature Code Directory | Isolated Sandbox Route | Key Deliverable |
| :--- | :--- | :--- | :--- | :--- |
| **Developer 1** | **Visual AI Proctoring** | `src/features/proctor-vision/` | `/sandbox/vision` | MediaPipe FaceLandmarker, head pose (Yaw/Pitch), absence detector, canvas WebP snapshot generator. |
| **Developer 2** | **Audio AI Proctoring** | `src/features/proctor-audio/` | `/sandbox/audio` | Silero VAD (human speech detector in WebAssembly), Web Audio RMS decibel meter, 5s Opus clip recorder. |
| **Developer 3** | **Anti-Cheat Security** | `src/features/anti-cheat/` | `/sandbox/security` | Fullscreen locking, Page Visibility / Alt-Tab traps, DevTools inhibitors, clipboard & right-click blockers. |
| **Developer 4** | **Exam Experience & UI** | `src/features/exam-session/` | `/sandbox/exam` | Question card, option selector, question grid navigation palette, review flags, local offline answer cache. |
| **Developer 5** | **Examiner Dashboard** | `src/features/examiner-dashboard/`| `/sandbox/dashboard` | Live candidate monitoring grid, integrity health score (100% to 0%), real-time incident feed & evidence player. |
| **Developer 6 / Lead** | **Supabase & Cloudflare R2** | `src/features/storage-r2/`, `src/lib/` | `/api/` | Database schema, RLS policies, Cloudflare R2 pre-signed upload URLs, serverless grading action. |

---

## 2. The 3 Golden Rules of Zero Conflict

### Rule 1: Code ONLY inside your feature folder
- Work exclusively inside `src/features/<your-feature>/` and `src/app/sandbox/<your-feature>/`.
- **NEVER** edit another developer's feature folder directly.
- **NEVER** modify `src/app/page.tsx`, `src/app/layout.tsx`, or `src/app/globals.css` without prior team agreement.

### Rule 2: Shared Contracts Live in `src/types/index.ts`
- All interfaces (`Question`, `ExamSession`, `ExamIncident`, `ProctorStatus`, etc.) are defined centrally in `src/types/index.ts`.
- Every developer imports from `@/types`.
- If you need a new field in a shared type, propose it in the team chat or open an issue before changing `src/types/index.ts`.

### Rule 3: Develop Inside Your Isolated Sandbox
- Run `npm run dev`.
- Go to `http://localhost:3000/sandbox`.
- Click into your feature's playground (e.g., `/sandbox/vision` or `/sandbox/audio`).
- You can test, iterate, and reload your feature without needing anyone else's code to be finished!

---

## 3. Git Branching Workflow for Developers

### Step 1: Create your feature branch from `main`
```bash
git checkout main
git pull origin main
git checkout -b feat/proctor-vision   # Example for Developer 1
```

### Step 2: Work on your feature
- Add files to your feature directory and sandbox.
- Commit frequently with clear messages:
```bash
git add src/features/proctor-vision/ src/app/sandbox/vision/
git commit -m "feat(proctor-vision): add mediapipe facelandmarker hook"
```

### Step 3: Keep your branch up to date with `main`
Before opening a PR or merging, sync latest changes from teammates:
```bash
git fetch origin
git rebase origin/main   # Or git merge origin/main
```

### Step 4: Push and Open a Pull Request
```bash
git push -u origin feat/proctor-vision
```
Open a PR on GitHub. Because your code is isolated in `src/features/<your-feature>/` and `src/app/sandbox/<your-feature>/`, **Git will merge cleanly with 0 conflicts!**

---

## 4. Final Integration Step (When all features are ready)
Once each developer finishes their feature sandbox, the team integrates them into the final exam page (`src/app/exam/page.tsx`):
```tsx
// Final integration is just importing the tested components!
import { VisionProctorView } from "@/features/proctor-vision";
import { AudioProctorView } from "@/features/proctor-audio";
import { AntiCheatProvider } from "@/features/anti-cheat";
import { QuestionPalette, QuestionCard } from "@/features/exam-session";
```
Everything plugs in seamlessly like Lego bricks!
