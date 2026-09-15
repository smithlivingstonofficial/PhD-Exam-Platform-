# Ph.D Online Exam Platform

An enterprise-grade, privacy-first, and cost-optimized online examination platform tailored for academic research institutions, university Ph.D coursework, and competitive entrance evaluations.

Built with **Next.js 16 (App Router)**, **Supabase PostgreSQL**, **Cloudflare R2**, **Vercel**, and **Client-Side Edge AI (Google MediaPipe & Silero VAD)**.

---

## 🌟 Key Architectural Highlights

- **Edge-AI Proctoring (Zero Server GPU Cost)**:
  - **Visual Behavior**: Real-time candidate absence, multi-person incursion, gaze diversion, and head pose (Yaw/Pitch) monitoring powered client-side by **Google MediaPipe FaceLandmarker**.
  - **Environment Audio**: Voice Activity Detection (VAD) via **Silero VAD in WebAssembly** to distinguish real human speech/whispers from mechanical keyboard clicks or ambient noise.
- **Zero-Egress Evidence Storage**:
  - Eliminates bandwidth and video streaming costs.
  - Event-triggered compressed WebP snapshots (20 KB) and Opus audio clips (10 KB) upload directly to **Cloudflare R2** with **$0 egress fees**.
- **Hardened Anti-Cheating & Integrity**:
  - Fullscreen enforcement with violation counters.
  - Page Visibility and Alt-Tab detection.
  - DevTools inhibitors and clipboard lockdown.
  - Dynamic randomized question/choice shuffling seeded per student.
  - Server-authoritative countdown timers in PostgreSQL.
- **Data Protection & RLS**:
  - Supabase Row Level Security (RLS) ensures questions are delivered without answer keys over the wire.
  - Server-side grading prevents tampering.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend & SSR** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, Glassmorphism Design System |
| **Database & Auth** | Supabase (PostgreSQL 15+, Row Level Security) |
| **Evidence Storage** | Cloudflare R2 (S3-compatible, $0 egress) |
| **Edge CDN & WAF** | Cloudflare DNS, Turnstile CAPTCHA, WAF |
| **Hosting** | Vercel (Edge Network) |
| **Edge Vision AI** | Google MediaPipe Tasks Vision (WebAssembly / WebGPU) |
| **Edge Audio AI** | Silero VAD (`@ricky0123/vad-web`) + Web Audio API |

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### 2. Installation
```bash
# Clone repository
git clone https://github.com/smithlivingstonofficial/PhD-Exam-Platform-.git
cd PhD-Exam-Platform-/site

# Install dependencies
npm install
```

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

### 4. Production Build
```bash
npm run build
npm run start
```

---

## 👥 Team Development & Project Management

- 📖 **[Master Engineering Plan](plan.md)**: Detailed architectural specifications, proctoring algorithms, database schema, and cost math.
- 🤝 **[Team Collaboration Guide](docs/TEAM_MANAGEMENT.md)**: Git branching strategy, commit conventions, and review standards.
- ⚙️ **[Antigravity Custom Skill](.agents/skills/phd-exam-platform/SKILL.md)**: Workspace guardrails and Edge-AI proctoring standards.

---

## 📄 License
MIT License. Built for MCA III-Semester academic evaluation.
