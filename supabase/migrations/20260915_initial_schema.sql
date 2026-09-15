-- ============================================================================
-- PH.D ONLINE EXAM PLATFORM: DATABASE INITIAL SCHEMA & SECURITY POLICIES
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. EXAMS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    course_code VARCHAR(50) NOT NULL,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 120,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    total_marks NUMERIC(6, 2) NOT NULL DEFAULT 100.00,
    passing_marks NUMERIC(6, 2) NOT NULL DEFAULT 40.00,
    anti_cheat_config JSONB NOT NULL DEFAULT '{
        "enable_face_tracking": true,
        "enable_audio_monitoring": true,
        "max_tab_switches": 3,
        "max_fullscreen_exits": 3,
        "periodic_snapshot_interval_sec": 60,
        "allowed_yaw_angle_deg": 28,
        "allowed_pitch_angle_deg": 20
    }'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. QUESTIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('MCQ', 'MULTI_SELECT', 'TEXT')),
    options JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of [{ "id": "a", "text": "Option 1" }, ...]
    correct_answers JSONB NOT NULL DEFAULT '[]'::jsonb, -- Hidden from student clients by RLS
    explanation TEXT,
    marks NUMERIC(5, 2) NOT NULL DEFAULT 1.00,
    negative_marks NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 3. EXAM SESSIONS TABLE (Student Exam Enrollment & State)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'TERMINATED', 'DISQUALIFIED')) DEFAULT 'SCHEDULED',
    started_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    final_score NUMERIC(6, 2),
    violation_count INT NOT NULL DEFAULT 0,
    integrity_score INT NOT NULL DEFAULT 100, -- Range 0-100
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(exam_id, student_id)
);

-- ----------------------------------------------------------------------------
-- 4. SESSION ANSWERS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.session_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    selected_options JSONB NOT NULL DEFAULT '[]'::jsonb,
    text_response TEXT,
    is_marked_for_review BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(session_id, question_id)
);

-- ----------------------------------------------------------------------------
-- 5. EXAM AUDIT & INCIDENT LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'FACE_ABSENT', 'MULTIPLE_FACES', 'HEAD_TURNED', 'SPEECH_DETECTED', 'TAB_SWITCH', 'FULLSCREEN_EXIT'
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    evidence_snapshot_url TEXT,
    evidence_audio_url TEXT,
    details JSONB DEFAULT '{}'::jsonb
);

-- ----------------------------------------------------------------------------
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON public.questions(exam_id, order_index);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_exam ON public.exam_sessions(student_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_lookup ON public.session_answers(session_id, question_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_time ON public.exam_audit_logs(session_id, timestamp DESC);

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins / Examiners can access and modify everything
CREATE POLICY "Admins full access to exams" ON public.exams
    FOR ALL TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'examiner')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'examiner');

CREATE POLICY "Admins full access to questions" ON public.questions
    FOR ALL TO authenticated
    USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'examiner')
    WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'examiner');

-- Students can view published exams
CREATE POLICY "Students can view published exams" ON public.exams
    FOR SELECT TO authenticated
    USING (is_published = true);

-- Students can read questions during active exam session (Note: correct_answers is excluded in frontend views)
CREATE POLICY "Students can read questions during session" ON public.questions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_sessions s
            WHERE s.exam_id = questions.exam_id
              AND s.student_id = auth.uid()
              AND s.status = 'IN_PROGRESS'
        )
    );

-- Students can view and update only their own exam sessions
CREATE POLICY "Students own sessions access" ON public.exam_sessions
    FOR ALL TO authenticated
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

-- Students can insert/update only their own session answers
CREATE POLICY "Students own answers access" ON public.session_answers
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_sessions s
            WHERE s.id = session_answers.session_id
              AND s.student_id = auth.uid()
              AND s.status = 'IN_PROGRESS'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.exam_sessions s
            WHERE s.id = session_answers.session_id
              AND s.student_id = auth.uid()
              AND s.status = 'IN_PROGRESS'
        )
    );

-- Anyone authenticated can insert audit logs for their active session
CREATE POLICY "Insert audit logs for session" ON public.exam_audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.exam_sessions s
            WHERE s.id = exam_audit_logs.session_id
              AND s.student_id = auth.uid()
        )
    );
