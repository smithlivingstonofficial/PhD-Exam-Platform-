"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

export interface SerializedExam {
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
  total_candidates: number;
  total_questions: number;
  anti_cheat_config: {
    enable_face_tracking: boolean;
    enable_audio_monitoring: boolean;
    max_tab_switches: number;
    max_fullscreen_exits: number;
    periodic_snapshot_interval_sec: number;
    allowed_yaw_angle_deg: number;
    allowed_pitch_angle_deg: number;
  };
  created_at: string;
}

export interface SerializedCandidate {
  id: string;
  name: string;
  email: string;
  exam_id: string;
  exam_title?: string;
  status: "SCHEDULED" | "IN_PROGRESS" | "SUBMITTED" | "TERMINATED" | "DISQUALIFIED";
  started_at: string | null;
  submitted_at: string | null;
  final_score: number | null;
  violation_count: number;
  integrity_score: number;
  recent_incident?: string;
}

export interface SerializedQuestion {
  id: string;
  exam_id: string;
  question_text: string;
  question_type: "MCQ" | "MULTI_SELECT" | "TEXT";
  options: { id: string; text: string }[];
  correct_answers: string[];
  marks: number;
  negative_marks: number;
  order_index: number;
}

// ----------------------------------------------------------------------------
// 1. GET OVERVIEW DATA (WITH SEED FALLBACK)
// ----------------------------------------------------------------------------
export async function getAdminOverviewData(): Promise<{
  exams: SerializedExam[];
  candidates: SerializedCandidate[];
}> {
  try {
    let exams = await prisma.exam.findMany({
      include: {
        _count: {
          select: { questions: true, examSessions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If database has 0 exams, seed initial Ph.D exams directly into Supabase
    if (exams.length === 0) {
      await seedInitialSupabaseData();
      exams = await prisma.exam.findMany({
        include: {
          _count: {
            select: { questions: true, examSessions: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    const sessions = await prisma.examSession.findMany({
      include: {
        exam: {
          select: { title: true, courseCode: true },
        },
        auditLogs: {
          take: 1,
          orderBy: { timestamp: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const serializedExams: SerializedExam[] = exams.map((e) => {
      const antiCheat = typeof e.antiCheatConfig === "object" && e.antiCheatConfig !== null
        ? (e.antiCheatConfig as Record<string, unknown>)
        : {};

      return {
        id: e.id,
        title: e.title,
        course_code: e.courseCode,
        description: e.description || "",
        duration_minutes: e.durationMinutes,
        start_time: e.startTime.toISOString(),
        end_time: e.endTime.toISOString(),
        total_marks: Number(e.totalMarks),
        passing_marks: Number(e.passingMarks),
        is_published: e.isPublished,
        total_candidates: e._count.examSessions,
        total_questions: e._count.questions,
        created_at: e.createdAt.toISOString(),
        anti_cheat_config: {
          enable_face_tracking: Boolean(antiCheat.enable_face_tracking ?? true),
          enable_audio_monitoring: Boolean(antiCheat.enable_audio_monitoring ?? true),
          max_tab_switches: Number(antiCheat.max_tab_switches ?? 3),
          max_fullscreen_exits: Number(antiCheat.max_fullscreen_exits ?? 3),
          periodic_snapshot_interval_sec: Number(antiCheat.periodic_snapshot_interval_sec ?? 60),
          allowed_yaw_angle_deg: Number(antiCheat.allowed_yaw_angle_deg ?? 28),
          allowed_pitch_angle_deg: Number(antiCheat.allowed_pitch_angle_deg ?? 20),
        },
      };
    });

    const serializedCandidates: SerializedCandidate[] = sessions.map((s, idx) => {
      const recentLog = s.auditLogs[0];
      return {
        id: s.id,
        name: `Research Scholar #${idx + 101}`,
        email: `scholar.${s.id.slice(0, 5)}@university.edu`,
        exam_id: s.exam.courseCode,
        exam_title: s.exam.title,
        status: s.status,
        started_at: s.startedAt ? s.startedAt.toISOString() : null,
        submitted_at: s.submittedAt ? s.submittedAt.toISOString() : null,
        final_score: s.finalScore ? Number(s.finalScore) : null,
        violation_count: s.violationCount,
        integrity_score: s.integrityScore,
        recent_incident: recentLog ? `${recentLog.eventType} (${recentLog.severity})` : "Normal candidate behavior detected",
      };
    });

    return { exams: serializedExams, candidates: serializedCandidates };
  } catch (error) {
    console.error("Prisma error in getAdminOverviewData:", error);
    return { exams: [], candidates: [] };
  }
}

// ----------------------------------------------------------------------------
// 2. CREATE EXAM ACTION
// ----------------------------------------------------------------------------
export async function createExamAction(data: {
  title: string;
  course_code: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  start_time: string;
  end_time: string;
  anti_cheat_config: Prisma.InputJsonValue;
}) {
  try {
    const exam = await prisma.exam.create({
      data: {
        title: data.title,
        courseCode: data.course_code.toUpperCase(),
        description: data.description,
        durationMinutes: data.duration_minutes,
        totalMarks: data.total_marks,
        passingMarks: data.passing_marks,
        startTime: new Date(data.start_time),
        endTime: new Date(data.end_time),
        antiCheatConfig: data.anti_cheat_config,
        isPublished: false,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/exams");
    return { success: true, examId: exam.id };
  } catch (error) {
    console.error("Error creating exam:", error);
    return { success: false, error: String(error) };
  }
}

// ----------------------------------------------------------------------------
// 3. TOGGLE PUBLISH EXAM ACTION
// ----------------------------------------------------------------------------
export async function toggleExamPublishAction(id: string, isPublished: boolean) {
  try {
    await prisma.exam.update({
      where: { id },
      data: { isPublished: !isPublished },
    });
    revalidatePath("/admin");
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error) {
    console.error("Error toggling publish:", error);
    return { success: false, error: String(error) };
  }
}

// ----------------------------------------------------------------------------
// 4. GET QUESTIONS FOR EXAM
// ----------------------------------------------------------------------------
export async function getQuestionsForExamAction(examId: string): Promise<SerializedQuestion[]> {
  try {
    const questions = await prisma.question.findMany({
      where: { examId },
      orderBy: { orderIndex: "asc" },
    });

    return questions.map((q) => ({
      id: q.id,
      exam_id: q.examId,
      question_text: q.questionText,
      question_type: q.questionType,
      options: Array.isArray(q.options) ? (q.options as { id: string; text: string }[]) : [],
      correct_answers: Array.isArray(q.correctAnswers) ? (q.correctAnswers as string[]) : [],
      marks: Number(q.marks),
      negative_marks: Number(q.negativeMarks),
      order_index: q.orderIndex,
    }));
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
}

// ----------------------------------------------------------------------------
// 5. CREATE QUESTION ACTION
// ----------------------------------------------------------------------------
export async function createQuestionAction(data: {
  exam_id: string;
  question_text: string;
  question_type: "MCQ" | "MULTI_SELECT" | "TEXT";
  options: { id: string; text: string }[];
  correct_answers: string[];
  marks: number;
  negative_marks: number;
}) {
  try {
    const count = await prisma.question.count({ where: { examId: data.exam_id } });

    await prisma.question.create({
      data: {
        examId: data.exam_id,
        questionText: data.question_text,
        questionType: data.question_type,
        options: data.options,
        correctAnswers: data.correct_answers,
        marks: data.marks,
        negativeMarks: data.negative_marks,
        orderIndex: count + 1,
      },
    });

    revalidatePath("/admin/questions");
    return { success: true };
  } catch (error) {
    console.error("Error creating question:", error);
    return { success: false, error: String(error) };
  }
}

// ----------------------------------------------------------------------------
// 6. DELETE QUESTION ACTION
// ----------------------------------------------------------------------------
export async function deleteQuestionAction(id: string) {
  try {
    await prisma.question.delete({ where: { id } });
    revalidatePath("/admin/questions");
    return { success: true };
  } catch (error) {
    console.error("Error deleting question:", error);
    return { success: false, error: String(error) };
  }
}

// ----------------------------------------------------------------------------
// 7. PROCTOR ACTIONS (WARN & TERMINATE)
// ----------------------------------------------------------------------------
export async function issueWarningAction(sessionId: string) {
  try {
    const session = await prisma.examSession.findUnique({ where: { id: sessionId } });
    if (!session) return { success: false };

    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        violationCount: { increment: 1 },
        integrityScore: Math.max(0, session.integrityScore - 10),
      },
    });

    await prisma.examAuditLog.create({
      data: {
        sessionId,
        eventType: "PROCTOR_WARNING_DISPATCHED",
        severity: "MEDIUM",
        details: { reason: "Examiner issued official manual warning" },
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/proctor");
    return { success: true };
  } catch (error) {
    console.error("Error issuing warning:", error);
    return { success: false, error: String(error) };
  }
}

export async function terminateSessionAction(sessionId: string) {
  try {
    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        status: "DISQUALIFIED",
        integrityScore: 0,
      },
    });

    await prisma.examAuditLog.create({
      data: {
        sessionId,
        eventType: "SESSION_TERMINATED_BY_EXAMINER",
        severity: "CRITICAL",
        details: { reason: "Disqualified by invigilator due to integrity policy violation" },
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/proctor");
    return { success: true };
  } catch (error) {
    console.error("Error terminating session:", error);
    return { success: false, error: String(error) };
  }
}

// ----------------------------------------------------------------------------
// HELPER: SEED INITIAL SUPABASE DATA VIA PRISMA
// ----------------------------------------------------------------------------
async function seedInitialSupabaseData() {
  const exam1 = await prisma.exam.create({
    data: {
      title: "Ph.D Coursework: Research Methodology & Statistical Modeling",
      courseCode: "PHD-RM-901",
      description: "Assessment on empirical design, hypothesis formulation, ANOVA/MANOVA modeling, and ethics.",
      durationMinutes: 90,
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalMarks: 100,
      passingMarks: 50,
      isPublished: true,
      antiCheatConfig: {
        enable_face_tracking: true,
        enable_audio_monitoring: true,
        max_tab_switches: 3,
        max_fullscreen_exits: 3,
        periodic_snapshot_interval_sec: 60,
        allowed_yaw_angle_deg: 28,
        allowed_pitch_angle_deg: 20,
      },
    },
  });

  await prisma.exam.create({
    data: {
      title: "Ph.D Advanced Computer Science: Edge AI & Distributed Systems",
      courseCode: "PHD-CS-904",
      description: "Assessment on WebAssembly inference optimization, consensus mechanisms, and federated learning.",
      durationMinutes: 120,
      startTime: new Date(),
      endTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      totalMarks: 100,
      passingMarks: 60,
      isPublished: false,
      antiCheatConfig: {
        enable_face_tracking: true,
        enable_audio_monitoring: true,
        max_tab_switches: 2,
        max_fullscreen_exits: 2,
        periodic_snapshot_interval_sec: 45,
        allowed_yaw_angle_deg: 25,
        allowed_pitch_angle_deg: 18,
      },
    },
  });

  // Seed Questions for Exam 1
  await prisma.question.createMany({
    data: [
      {
        examId: exam1.id,
        questionText: "In quantitative research design, which statistical test is most appropriate when comparing the means of three or more independent groups with normally distributed data?",
        questionType: "MCQ",
        options: [
          { id: "a", text: "Student's Independent Samples t-test" },
          { id: "b", text: "One-Way Analysis of Variance (ANOVA)" },
          { id: "c", text: "Mann-Whitney U Test" },
          { id: "d", text: "Pearson Chi-Square Test of Independence" },
        ],
        correctAnswers: ["b"],
        marks: 2,
        negativeMarks: 0.5,
        orderIndex: 1,
      },
      {
        examId: exam1.id,
        questionText: "Select all criteria necessary for establishing causal inference in empirical research:",
        questionType: "MULTI_SELECT",
        options: [
          { id: "a", text: "Temporal precedence (Cause precedes Effect in time)" },
          { id: "b", text: "Empirical covariance between variables" },
          { id: "c", text: "Non-spuriousness (Confounding variables ruled out)" },
          { id: "d", text: "Qualitative narrative endorsement by domain experts" },
        ],
        correctAnswers: ["a", "b", "c"],
        marks: 4,
        negativeMarks: 1.0,
        orderIndex: 2,
      },
    ],
  });

  // Seed sample sessions for live monitor
  const dummyStudentId1 = "00000000-0000-0000-0000-000000000001";
  const dummyStudentId2 = "00000000-0000-0000-0000-000000000002";
  const dummyStudentId3 = "00000000-0000-0000-0000-000000000003";

  await prisma.examSession.createMany({
    data: [
      {
        examId: exam1.id,
        studentId: dummyStudentId1,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        violationCount: 0,
        integrityScore: 98,
      },
      {
        examId: exam1.id,
        studentId: dummyStudentId2,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        violationCount: 2,
        integrityScore: 82,
      },
      {
        examId: exam1.id,
        studentId: dummyStudentId3,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        violationCount: 4,
        integrityScore: 62,
      },
    ],
  });
}
