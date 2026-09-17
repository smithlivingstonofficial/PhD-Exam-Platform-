"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { QuestionType, QuestionScope, SeverityLevel } from "@/types";

// ============================================================================
// CANDIDATE PORTAL TYPES
// ============================================================================

export type CandidatePortalStage = 
  | "TOO_EARLY" 
  | "WAITING_ROOM" 
  | "ACTIVE_EXAM" 
  | "LATE_JOIN_LOCKED" 
  | "ALREADY_SUBMITTED";

export interface CandidateSessionPayload {
  stage: CandidatePortalStage;
  sessionId: string;
  studentId: string;
  regNumber: string;
  fullName: string;
  email: string;
  departmentCode: string;
  departmentName: string;
  examId: string;
  examTitle: string;
  courseCode: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  slotNumber: number;
  slotName: string;
  isRetestSlot: boolean;
  loginOpensAt: string;
  startTime: string;
  joinWindowClosesAt: string;
  endTime: string;
  startedAt: string | null;
  serverTime: string;
  antiCheatConfig: {
    enable_face_tracking: boolean;
    enable_audio_monitoring: boolean;
    max_tab_switches: number;
    max_fullscreen_exits: number;
    periodic_snapshot_interval_sec: number;
  };
}

export interface CandidateQuestion {
  id: string;
  orderIndex: number;
  scope: QuestionScope;
  sectionName: string;
  questionText: string;
  questionType: QuestionType;
  marks: number;
  negativeMarks: number;
  options: { id: string; text: string }[];
  // NOTE: correctAnswers is 100% strictly excluded from candidate payload
}

export interface CandidateSavedAnswer {
  questionId: string;
  selectedOptions: string[];
  textResponse: string | null;
  isMarkedForReview: boolean;
}

// ----------------------------------------------------------------------------
// 1. CANDIDATE AUTHENTICATION & TIMING WINDOW CHECK
// ----------------------------------------------------------------------------

export async function candidateLoginAction(data: {
  regNumber: string;
  accessCode: string;
}): Promise<{ success: boolean; payload?: CandidateSessionPayload; error?: string }> {
  try {
    const reg = data.regNumber.toUpperCase().trim();
    const pin = data.accessCode.trim();

    // 1. Verify scholar credentials
    const student = await prisma.student.findUnique({
      where: { regNumber: reg },
      include: {
        department: true,
        examSessions: {
          include: {
            exam: true,
            slot: true,
          },
          orderBy: { attemptNumber: "desc" }, // Slot 2 attempt comes first if enrolled!
        },
      },
    });

    if (!student) {
      return { success: false, error: "Scholar registration number not recognized in university registry." };
    }

    if (student.accessCode !== pin) {
      return { success: false, error: "Invalid access PIN. Check your registration slip or contact examiner." };
    }

    if (student.examSessions.length === 0) {
      return { success: false, error: "No scheduled examination session found for your registration profile." };
    }

    // Pick active session (Slot 2 if enrolled, otherwise Slot 1)
    const session = student.examSessions[0];
    const exam = session.exam;
    const slot = session.slot;

    if (!slot) {
      return { success: false, error: "No active slot scheduled for this examination." };
    }

    const now = new Date();
    let stage: CandidatePortalStage = "WAITING_ROOM";

    // Timing assertions
    if (session.status === "SUBMITTED") {
      stage = "ALREADY_SUBMITTED";
    } else if (now < slot.loginOpensAt) {
      stage = "TOO_EARLY";
    } else if (now >= slot.loginOpensAt && now < slot.startTime) {
      stage = "WAITING_ROOM";
      // Mark attendance as logged in if not already
      if (session.attendanceStatus === "NOT_REPORTED") {
        await prisma.examSession.update({
          where: { id: session.id },
          data: { attendanceStatus: "LOGGED_IN", loginAt: now },
        });
      }
    } else if (now >= slot.startTime) {
      if (session.startedAt) {
        // Candidate already started earlier, resume!
        stage = "ACTIVE_EXAM";
      } else if (now <= slot.joinWindowClosesAt) {
        // Within late-join grace period
        stage = "ACTIVE_EXAM";
      } else {
        // Past late join window and never started -> LOCKED OUT
        stage = "LATE_JOIN_LOCKED";
        await prisma.examSession.update({
          where: { id: session.id },
          data: { attendanceStatus: "ABSENT", status: "ABSENT" },
        });
      }
    }

    const antiCheat = typeof exam.antiCheatConfig === "object" && exam.antiCheatConfig !== null
      ? (exam.antiCheatConfig as Record<string, unknown>)
      : {};

    return {
      success: true,
      payload: {
        stage,
        sessionId: session.id,
        studentId: student.id,
        regNumber: student.regNumber,
        fullName: student.fullName,
        email: student.email,
        departmentCode: student.department.code,
        departmentName: student.department.name,
        examId: exam.id,
        examTitle: exam.title,
        courseCode: exam.courseCode,
        durationMinutes: exam.durationMinutes,
        totalMarks: Number(exam.totalMarks),
        passingMarks: Number(exam.passingMarks),
        slotNumber: slot.slotNumber,
        slotName: slot.slotName,
        isRetestSlot: slot.isRetestSlot,
        loginOpensAt: slot.loginOpensAt.toISOString(),
        startTime: slot.startTime.toISOString(),
        joinWindowClosesAt: slot.joinWindowClosesAt.toISOString(),
        endTime: slot.endTime.toISOString(),
        startedAt: session.startedAt ? session.startedAt.toISOString() : null,
        serverTime: now.toISOString(),
        antiCheatConfig: {
          enable_face_tracking: Boolean(antiCheat.enable_face_tracking ?? true),
          enable_audio_monitoring: Boolean(antiCheat.enable_audio_monitoring ?? true),
          max_tab_switches: Number(antiCheat.max_tab_switches ?? 3),
          max_fullscreen_exits: Number(antiCheat.max_fullscreen_exits ?? 3),
          periodic_snapshot_interval_sec: Number(antiCheat.periodic_snapshot_interval_sec ?? 60),
        },
      },
    };
  } catch (error) {
    console.error("Error in candidateLoginAction:", error);
    return { success: false, error: String(error) };
  }
}

// ----------------------------------------------------------------------------
// 2. START EXAM SESSION (Questions Unlock)
// ----------------------------------------------------------------------------

export async function startExamSessionAction(sessionId: string): Promise<{ success: boolean; startedAt?: string; error?: string }> {
  try {
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { exam: true, slot: true },
    });

    if (!session || !session.slot) {
      return { success: false, error: "Session not found." };
    }

    const now = new Date();
    // Validate that questions start time has arrived
    if (now < session.slot.startTime) {
      return { success: false, error: "Questions are locked until official start time." };
    }

    // Check late join cutoff
    if (!session.startedAt && now > session.slot.joinWindowClosesAt) {
      return { success: false, error: "Late join grace period has elapsed." };
    }

    const startedAt = session.startedAt || now;
    const expiresAt = new Date(startedAt.getTime() + session.exam.durationMinutes * 60 * 1000);

    // Hard ceiling at slot.endTime
    const finalExpiresAt = expiresAt > session.slot.endTime ? session.slot.endTime : expiresAt;

    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        startedAt,
        expiresAt: finalExpiresAt,
        status: "IN_PROGRESS",
        attendanceStatus: "IN_EXAM",
      },
    });

    return { success: true, startedAt: startedAt.toISOString() };
  } catch (error) {
    console.error("Error in startExamSessionAction:", error);
    return { success: false, error: String(error) };
  }
}

// ----------------------------------------------------------------------------
// 3. GET CLOAKED QUESTION PAPER (PART A COMMON + PART B DEPARTMENT ONLY)
// ----------------------------------------------------------------------------

export async function getCandidateQuestionPaperAction(sessionId: string): Promise<{
  success: boolean;
  questions: CandidateQuestion[];
  savedAnswers: CandidateSavedAnswer[];
  error?: string;
}> {
  try {
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        student: true,
        answers: true,
      },
    });

    if (!session) {
      return { success: false, questions: [], savedAnswers: [], error: "Invalid session." };
    }

    // Query questions:
    // 1. Where scope = 'COMMON' (for all scholars)
    // 2. OR scope = 'DEPARTMENT_SPECIFIC' and departmentId = student.departmentId
    // SECURITY: Exclude correctAnswers and explanation explicitly!
    const questions = await prisma.question.findMany({
      where: {
        examId: session.examId,
        OR: [
          { scope: "COMMON" },
          { departmentId: session.student.departmentId },
        ],
      },
      select: {
        id: true,
        orderIndex: true,
        scope: true,
        sectionName: true,
        questionText: true,
        questionType: true,
        marks: true,
        negativeMarks: true,
        options: true,
        // correctAnswers is STRICTLY NOT SELECTED (Cloaked)
        // explanation is STRICTLY NOT SELECTED (Cloaked)
      },
      orderBy: [{ scope: "asc" }, { orderIndex: "asc" }],
    });

    const candidateQuestions: CandidateQuestion[] = questions.map((q) => ({
      id: q.id,
      orderIndex: q.orderIndex,
      scope: q.scope as QuestionScope,
      sectionName: q.sectionName || (q.scope === "COMMON" ? "Part A: General & Research Aptitude" : "Part B: Core Domain"),
      questionText: q.questionText,
      questionType: q.questionType as QuestionType,
      marks: Number(q.marks),
      negativeMarks: Number(q.negativeMarks),
      options: Array.isArray(q.options) ? (q.options as { id: string; text: string }[]) : [],
    }));

    const savedAnswers: CandidateSavedAnswer[] = session.answers.map((a) => ({
      questionId: a.questionId,
      selectedOptions: Array.isArray(a.selectedOptions) ? (a.selectedOptions as string[]) : [],
      textResponse: a.textResponse,
      isMarkedForReview: a.isMarkedForReview,
    }));

    return {
      success: true,
      questions: candidateQuestions,
      savedAnswers,
    };
  } catch (error) {
    console.error("Error in getCandidateQuestionPaperAction:", error);
    return { success: false, questions: [], savedAnswers: [], error: String(error) };
  }
}

// ----------------------------------------------------------------------------
// 4. AUTOSAVE CANDIDATE ANSWER
// ----------------------------------------------------------------------------

export async function saveCandidateAnswerAction(data: {
  sessionId: string;
  questionId: string;
  selectedOptions: string[];
  textResponse?: string;
  isMarkedForReview?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.sessionAnswer.upsert({
      where: {
        sessionId_questionId: {
          sessionId: data.sessionId,
          questionId: data.questionId,
        },
      },
      update: {
        selectedOptions: data.selectedOptions as object,
        textResponse: data.textResponse || null,
        isMarkedForReview: Boolean(data.isMarkedForReview),
      },
      create: {
        sessionId: data.sessionId,
        questionId: data.questionId,
        selectedOptions: data.selectedOptions as object,
        textResponse: data.textResponse || null,
        isMarkedForReview: Boolean(data.isMarkedForReview),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error saving candidate answer:", error);
    return { success: false, error: String(error) };
  }
}

// ----------------------------------------------------------------------------
// 5. RECORD PROCTORING TELEMETRY & INCIDENTS
// ----------------------------------------------------------------------------

export async function recordCandidateViolationAction(data: {
  sessionId: string;
  eventType: string;
  severity: SeverityLevel;
  details?: Record<string, unknown>;
  evidenceSnapshotUrl?: string;
}): Promise<{ success: boolean; violationCount?: number }> {
  try {
    await prisma.examAuditLog.create({
      data: {
        sessionId: data.sessionId,
        eventType: data.eventType,
        severity: data.severity,
        details: (data.details ?? {}) as unknown as Prisma.InputJsonValue,
        evidenceSnapshotUrl: data.evidenceSnapshotUrl || null,
      },
    });

    // Increment session violation count and adjust integrity
    const penalty = data.severity === "CRITICAL" ? 25 : data.severity === "HIGH" ? 15 : 5;

    const updated = await prisma.examSession.update({
      where: { id: data.sessionId },
      data: {
        violationCount: { increment: 1 },
        integrityScore: { decrement: penalty },
      },
      select: { violationCount: true, integrityScore: true },
    });

    return { success: true, violationCount: updated.violationCount };
  } catch (error) {
    console.error("Error recording candidate violation:", error);
    return { success: false };
  }
}

// ----------------------------------------------------------------------------
// 6. ATOMIC EXAM SUBMISSION & SERVER-SIDE GRADING
// ----------------------------------------------------------------------------

export async function submitCandidateExamAction(sessionId: string): Promise<{
  success: boolean;
  score?: number;
  isPassed?: boolean;
  error?: string;
}> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch session and its answers
      const session = await tx.examSession.findUnique({
        where: { id: sessionId },
        include: {
          exam: true,
          answers: true,
        },
      });

      if (!session) throw new Error("Exam session not found.");
      if (session.status === "SUBMITTED") return session;

      // 2. Fetch questions with server-side correct answers
      const questions = await tx.question.findMany({
        where: { examId: session.examId },
      });

      const questionMap = new Map(questions.map((q) => [q.id, q]));

      let commonScore = 0;
      let departmentScore = 0;
      let totalScore = 0;

      for (const ans of session.answers) {
        const q = questionMap.get(ans.questionId);
        if (!q) continue;

        const correct = Array.isArray(q.correctAnswers) ? (q.correctAnswers as string[]) : [];
        const selected = Array.isArray(ans.selectedOptions) ? (ans.selectedOptions as string[]) : [];

        const marks = Number(q.marks);
        const neg = Number(q.negativeMarks);

        let earned = 0;
        if (selected.length > 0) {
          // Check correctness
          const isCorrect =
            correct.length === selected.length &&
            correct.every((opt) => selected.includes(opt));

          if (isCorrect) {
            earned = marks;
          } else {
            earned = -neg;
          }
        }

        totalScore += earned;
        if (q.scope === "COMMON") {
          commonScore += earned;
        } else {
          departmentScore += earned;
        }
      }

      // Bound minimum score at 0
      totalScore = Math.max(0, totalScore);
      commonScore = Math.max(0, commonScore);
      departmentScore = Math.max(0, departmentScore);

      const isPassed = totalScore >= Number(session.exam.passingMarks);

      // 3. Mark session SUBMITTED
      const updated = await tx.examSession.update({
        where: { id: sessionId },
        data: {
          status: "SUBMITTED",
          attendanceStatus: "SUBMITTED",
          submittedAt: new Date(),
          finalScore: totalScore,
          commonScore,
          departmentScore,
          isPassed,
        },
      });

      return updated;
    });

    return {
      success: true,
      score: Number(result.finalScore),
      isPassed: result.isPassed ?? false,
    };
  } catch (error) {
    console.error("Error submitting candidate exam:", error);
    return { success: false, error: String(error) };
  }
}
