"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { 
  QuestionScope, 
  QuestionType, 
  AttendanceStatus, 
  SlotStatus, 
  ExamStatus 
} from "@/types";

// ============================================================================
// SERIALIZED INTERFACES FOR CLIENT COMPONENTS
// ============================================================================

export interface SerializedDepartment {
  id: string;
  code: string;
  name: string;
  description: string;
  created_at: string;
  scholar_count: number;
  question_count: number;
}

export interface SerializedStudent {
  id: string;
  reg_number: string;
  full_name: string;
  email: string;
  phone: string;
  department_id: string;
  department_code?: string;
  department_name?: string;
  access_code: string;
  created_at: string;
  active_sessions_count?: number;
}

export interface SerializedSlot {
  id: string;
  exam_id: string;
  slot_number: number;
  slot_name: string;
  login_opens_at: string;
  start_time: string;
  join_window_closes_at: string;
  end_time: string;
  status: SlotStatus;
  is_retest_slot: boolean;
  enrolled_count: number;
  attended_count: number;
}

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
  slots: SerializedSlot[];
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
  id: string; // Session ID
  student_id: string;
  name: string;
  email: string;
  reg_number: string;
  department_code: string;
  department_name: string;
  exam_id: string;
  exam_title: string;
  slot_id: string | null;
  slot_name: string;
  slot_number: number;
  status: ExamStatus;
  attendance_status: AttendanceStatus;
  login_at: string | null;
  started_at: string | null;
  submitted_at: string | null;
  final_score: number | null;
  common_score: number | null;
  department_score: number | null;
  is_passed: boolean | null;
  violation_count: number;
  integrity_score: number;
  attempt_number: number;
  is_eligible_for_retest: boolean;
  retest_slot_id: string | null;
  recent_incident?: string;
}

export interface SerializedQuestion {
  id: string;
  exam_id: string;
  scope: QuestionScope;
  department_id: string | null;
  department_code?: string;
  section_name: string;
  question_text: string;
  question_type: QuestionType;
  options: { id: string; text: string }[];
  correct_answers: string[];
  marks: number;
  negative_marks: number;
  order_index: number;
}

export interface AntiCheatConfigInput {
  enable_face_tracking?: boolean;
  enable_audio_monitoring?: boolean;
  max_tab_switches?: number;
  max_fullscreen_exits?: number;
  periodic_snapshot_interval_sec?: number;
  allowed_yaw_angle_deg?: number;
  allowed_pitch_angle_deg?: number;
  [key: string]: unknown;
}

export interface SerializedAuditLog {
  id: string;
  session_id: string;
  event_type: string;
  severity: string;
  timestamp: string;
  evidence_snapshot_url: string | null;
  evidence_audio_url: string | null;
  details: Record<string, unknown>;
}

export interface CandidateResponseDetail {
  questionId: string;
  questionText: string;
  sectionName: string;
  scope: string;
  questionType: string;
  marks: number;
  negativeMarks: number;
  options: { id: string; text: string }[];
  correctAnswers: string[];
  selectedOptions: string[];
  textResponse: string | null;
  isCorrect: boolean;
  scoreEarned: number;
}

// ----------------------------------------------------------------------------
// 1. DEPARTMENT ACTIONS
// ----------------------------------------------------------------------------

export async function getDepartmentsAction(): Promise<SerializedDepartment[]> {
  try {
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { students: true, questions: true },
        },
      },
      orderBy: { code: "asc" },
    });

    return departments.map((d) => ({
      id: d.id,
      code: d.code,
      name: d.name,
      description: d.description || "",
      created_at: d.createdAt.toISOString(),
      scholar_count: d._count.students,
      question_count: d._count.questions,
    }));
  } catch (error) {
    console.error("Error in getDepartmentsAction:", error);
    return [];
  }
}

export async function createDepartmentAction(data: {
  code: string;
  name: string;
  description?: string;
}): Promise<{ success: boolean; departmentId?: string; error?: string }> {
  try {
    const dept = await prisma.department.create({
      data: {
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/departments");
    revalidatePath("/admin/questions");
    revalidatePath("/admin/candidates");
    return { success: true, departmentId: dept.id };
  } catch (error) {
    console.error("Error creating department:", error);
    return { success: false, error: String(error) };
  }
}

export async function deleteDepartmentAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.department.delete({ where: { id } });
    revalidatePath("/admin");
    revalidatePath("/admin/departments");
    return { success: true };
  } catch (error) {
    console.error("Error deleting department:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateDepartmentAction(
  id: string,
  data: { code: string; name: string; description?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.department.update({
      where: { id },
      data: {
        code: data.code.toUpperCase().trim(),
        name: data.name.trim(),
        description: data.description?.trim() || null,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/departments");
    revalidatePath("/admin/questions");
    revalidatePath("/admin/candidates");
    return { success: true };
  } catch (error) {
    console.error("Error updating department:", error);
    return { success: false, error: String(error) };
  }
}

export async function getDepartmentDetailsAction(id: string) {
  try {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        students: {
          orderBy: { regNumber: "asc" },
        },
        questions: {
          include: { exam: { select: { title: true, courseCode: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!dept) return { success: false, error: "Department not found", department: null };

    return {
      success: true,
      department: {
        id: dept.id,
        code: dept.code,
        name: dept.name,
        description: dept.description || "",
        students: dept.students.map((s) => ({
          id: s.id,
          reg_number: s.regNumber,
          full_name: s.fullName,
          email: s.email,
          phone: s.phone || "",
          access_code: s.accessCode,
          created_at: s.createdAt.toISOString(),
        })),
        questions: dept.questions.map((q) => ({
          id: q.id,
          exam_title: q.exam.title,
          course_code: q.exam.courseCode,
          section_name: q.sectionName,
          question_text: q.questionText,
          marks: Number(q.marks),
          question_type: q.questionType,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching department details:", error);
    return { success: false, error: String(error), department: null };
  }
}

// ----------------------------------------------------------------------------
// 2. STUDENT / RESEARCH SCHOLAR ACTIONS
// ----------------------------------------------------------------------------

export async function getStudentsAction(departmentId?: string): Promise<SerializedStudent[]> {
  try {
    const where = departmentId ? { departmentId } : {};
    const students = await prisma.student.findMany({
      where,
      include: {
        department: { select: { code: true, name: true } },
        _count: { select: { examSessions: true } },
      },
      orderBy: { regNumber: "asc" },
    });

    return students.map((s) => ({
      id: s.id,
      reg_number: s.regNumber,
      full_name: s.fullName,
      email: s.email,
      phone: s.phone || "",
      department_id: s.departmentId,
      department_code: s.department.code,
      department_name: s.department.name,
      access_code: s.accessCode,
      created_at: s.createdAt.toISOString(),
      active_sessions_count: s._count.examSessions,
    }));
  } catch (error) {
    console.error("Error in getStudentsAction:", error);
    return [];
  }
}

export async function createStudentAction(data: {
  reg_number: string;
  full_name: string;
  email: string;
  department_id: string;
  phone?: string;
  access_code?: string;
}): Promise<{ success: boolean; studentId?: string; error?: string }> {
  try {
    const code = data.access_code || Math.floor(100000 + Math.random() * 900000).toString();
    const student = await prisma.student.create({
      data: {
        regNumber: data.reg_number.toUpperCase().trim(),
        fullName: data.full_name.trim(),
        email: data.email.toLowerCase().trim(),
        departmentId: data.department_id,
        phone: data.phone?.trim() || null,
        accessCode: code,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/candidates");
    return { success: true, studentId: student.id };
  } catch (error) {
    console.error("Error creating student:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateStudentAction(
  id: string,
  data: {
    full_name: string;
    email: string;
    department_id: string;
    phone?: string;
    access_code?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.student.update({
      where: { id },
      data: {
        fullName: data.full_name.trim(),
        email: data.email.toLowerCase().trim(),
        departmentId: data.department_id,
        phone: data.phone?.trim() || null,
        ...(data.access_code ? { accessCode: data.access_code.trim() } : {}),
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/candidates");
    return { success: true };
  } catch (error) {
    console.error("Error updating student:", error);
    return { success: false, error: String(error) };
  }
}

export async function deleteStudentAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.student.delete({ where: { id } });
    revalidatePath("/admin");
    revalidatePath("/admin/candidates");
    return { success: true };
  } catch (error) {
    console.error("Error deleting student:", error);
    return { success: false, error: String(error) };
  }
}

export async function bulkImportStudentsAction(
  students: Array<{
    reg_number: string;
    full_name: string;
    email: string;
    department_code: string;
    phone?: string;
  }>
): Promise<{
  success: boolean;
  insertedCount: number;
  duplicateCount: number;
  errors: string[];
}> {
  try {
    const departments = await prisma.department.findMany();
    const deptMap: Record<string, string> = {};
    for (const d of departments) {
      deptMap[d.code.toUpperCase()] = d.id;
    }

    let insertedCount = 0;
    let duplicateCount = 0;
    const errors: string[] = [];

    for (const s of students) {
      const reg = s.reg_number.toUpperCase().trim();
      const email = s.email.toLowerCase().trim();
      const deptCode = s.department_code.toUpperCase().trim();

      if (!deptMap[deptCode]) {
        errors.push(`Row with Reg ${reg}: Unknown department code "${deptCode}"`);
        continue;
      }

      const existing = await prisma.student.findFirst({
        where: {
          OR: [{ regNumber: reg }, { email: email }],
        },
      });

      if (existing) {
        duplicateCount++;
        continue;
      }

      await prisma.student.create({
        data: {
          regNumber: reg,
          fullName: s.full_name.trim(),
          email: email,
          departmentId: deptMap[deptCode],
          phone: s.phone?.trim() || null,
          accessCode: Math.floor(100000 + Math.random() * 900000).toString(),
        },
      });
      insertedCount++;
    }

    revalidatePath("/admin");
    revalidatePath("/admin/candidates");
    return { success: true, insertedCount, duplicateCount, errors };
  } catch (error) {
    console.error("Error bulk importing students:", error);
    return { success: false, insertedCount: 0, duplicateCount: 0, errors: [String(error)] };
  }
}

export async function enrollStudentInExamAction(
  studentId: string,
  examId: string,
  slotId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if student is already enrolled in this exam attempt 1
    const existing = await prisma.examSession.findFirst({
      where: { studentId, examId, attemptNumber: 1 },
    });

    if (existing) {
      return { success: false, error: "Scholar is already enrolled in this exam." };
    }

    let targetSlotId = slotId;
    if (!targetSlotId) {
      const primarySlot = await prisma.examSlot.findFirst({
        where: { examId, slotNumber: 1 },
      });
      targetSlotId = primarySlot?.id;
    }

    await prisma.examSession.create({
      data: {
        examId,
        slotId: targetSlotId || null,
        studentId,
        status: "SCHEDULED",
        attendanceStatus: "NOT_REPORTED",
        attemptNumber: 1,
        integrityScore: 100,
        violationCount: 0,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/candidates");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error) {
    console.error("Error enrolling student:", error);
    return { success: false, error: String(error) };
  }
}

export async function getStudentProfileHistoryAction(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        department: true,
        examSessions: {
          include: {
            exam: { select: { title: true, courseCode: true, passingMarks: true, totalMarks: true } },
            slot: { select: { slotName: true, slotNumber: true, startTime: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!student) return { success: false, error: "Scholar not found", student: null };

    return {
      success: true,
      student: {
        id: student.id,
        reg_number: student.regNumber,
        full_name: student.fullName,
        email: student.email,
        phone: student.phone || "",
        department_code: student.department.code,
        department_name: student.department.name,
        access_code: student.accessCode,
        created_at: student.createdAt.toISOString(),
        sessions: student.examSessions.map((es) => ({
          sessionId: es.id,
          examTitle: es.exam.title,
          courseCode: es.exam.courseCode,
          slotName: es.slot?.slotName || "Main Session",
          attemptNumber: es.attemptNumber,
          status: es.status,
          attendanceStatus: es.attendanceStatus,
          finalScore: es.finalScore !== null ? Number(es.finalScore) : null,
          isPassed: es.isPassed,
          integrityScore: es.integrityScore,
          violationCount: es.violationCount,
          loginAt: es.loginAt ? es.loginAt.toISOString() : null,
          submittedAt: es.submittedAt ? es.submittedAt.toISOString() : null,
        })),
      },
    };
  } catch (error) {
    console.error("Error fetching scholar history:", error);
    return { success: false, error: String(error), student: null };
  }
}

// ----------------------------------------------------------------------------
// 3. EXAM & SLOTS ACTIONS (WITH TIMING WINDOW CONTROLS)
// ----------------------------------------------------------------------------

export async function getAdminOverviewData(): Promise<{
  exams: SerializedExam[];
  candidates: SerializedCandidate[];
}> {
  try {
    const [exams, sessions] = await Promise.all([
      prisma.exam.findMany({
        include: {
          slots: {
            orderBy: { slotNumber: "asc" },
            include: {
              _count: {
                select: { examSessions: true },
              },
            },
          },
          _count: {
            select: { questions: true, examSessions: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.examSession.findMany({
        include: {
          exam: {
            select: { title: true, courseCode: true },
          },
          slot: true,
          student: {
            include: { department: true },
          },
          auditLogs: {
            take: 1,
            orderBy: { timestamp: "desc" },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

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
        slots: e.slots.map((s) => ({
          id: s.id,
          exam_id: s.examId,
          slot_number: s.slotNumber,
          slot_name: s.slotName,
          login_opens_at: s.loginOpensAt.toISOString(),
          start_time: s.startTime.toISOString(),
          join_window_closes_at: s.joinWindowClosesAt.toISOString(),
          end_time: s.endTime.toISOString(),
          status: s.status as SlotStatus,
          is_retest_slot: s.isRetestSlot,
          enrolled_count: s._count.examSessions,
          attended_count: 0,
        })),
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

    const serializedCandidates: SerializedCandidate[] = sessions.map((s) => {
      const recentLog = s.auditLogs[0];
      return {
        id: s.id,
        student_id: s.student.id,
        name: s.student.fullName,
        email: s.student.email,
        reg_number: s.student.regNumber,
        department_code: s.student.department.code,
        department_name: s.student.department.name,
        exam_id: s.exam.courseCode,
        exam_title: s.exam.title,
        slot_id: s.slot?.id || null,
        slot_name: s.slot?.slotName || "Standard Slot",
        slot_number: s.slot?.slotNumber || 1,
        status: s.status as ExamStatus,
        attendance_status: s.attendanceStatus as AttendanceStatus,
        login_at: s.loginAt ? s.loginAt.toISOString() : null,
        started_at: s.startedAt ? s.startedAt.toISOString() : null,
        submitted_at: s.submittedAt ? s.submittedAt.toISOString() : null,
        final_score: s.finalScore !== null ? Number(s.finalScore) : null,
        common_score: s.commonScore !== null ? Number(s.commonScore) : null,
        department_score: s.departmentScore !== null ? Number(s.departmentScore) : null,
        is_passed: s.isPassed,
        violation_count: s.violationCount,
        integrity_score: s.integrityScore,
        attempt_number: s.attemptNumber,
        is_eligible_for_retest: s.isEligibleForRetest,
        retest_slot_id: s.retestSlotId,
        recent_incident: recentLog ? `${recentLog.eventType} (${recentLog.severity})` : "Normal candidate behavior detected",
      };
    });

    return { exams: serializedExams, candidates: serializedCandidates };
  } catch (error) {
    console.error("Prisma error in getAdminOverviewData:", error);
    return { exams: [], candidates: [] };
  }
}

export async function createExamAction(data: {
  title: string;
  course_code: string;
  description: string;
  duration_minutes: number;
  total_marks: number;
  passing_marks: number;
  start_time: string;
  end_time: string;
  login_opens_at?: string;
  join_window_minutes?: number;
  anti_cheat_config: AntiCheatConfigInput;
}) {
  try {
    const startTime = new Date(data.start_time);
    const endTime = new Date(data.end_time);
    const loginOpensAt = data.login_opens_at 
      ? new Date(data.login_opens_at)
      : new Date(startTime.getTime() - 15 * 60 * 1000); // 15 mins before
    
    const joinWindowMinutes = data.join_window_minutes || 15;
    const joinWindowClosesAt = new Date(startTime.getTime() + joinWindowMinutes * 60 * 1000);

    // Create Exam and initial primary Slot 1 atomically
    const exam = await prisma.$transaction(async (tx) => {
      const createdExam = await tx.exam.create({
        data: {
          title: data.title,
          courseCode: data.course_code.toUpperCase(),
          description: data.description,
          durationMinutes: data.duration_minutes,
          totalMarks: data.total_marks,
          passingMarks: data.passing_marks,
          startTime: startTime,
          endTime: endTime,
          antiCheatConfig: data.anti_cheat_config as object,
          isPublished: false,
        },
      });

      await tx.examSlot.create({
        data: {
          examId: createdExam.id,
          slotNumber: 1,
          slotName: "Slot 1 - Primary Session",
          loginOpensAt,
          startTime,
          joinWindowClosesAt,
          endTime,
          status: "SCHEDULED",
          isRetestSlot: false,
        },
      });

      return createdExam;
    });

    revalidatePath("/admin");
    revalidatePath("/admin/exams");
    return { success: true, examId: exam.id };
  } catch (error) {
    console.error("Error creating exam:", error);
    return { success: false, error: String(error) };
  }
}

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

export async function updateExamAction(
  id: string,
  data: {
    title: string;
    course_code: string;
    description: string;
    duration_minutes: number;
    total_marks: number;
    passing_marks: number;
    start_time?: string;
    end_time?: string;
    anti_cheat_config: AntiCheatConfigInput;
  }
) {
  try {
    await prisma.exam.update({
      where: { id },
      data: {
        title: data.title,
        courseCode: data.course_code.toUpperCase().trim(),
        description: data.description,
        durationMinutes: data.duration_minutes,
        totalMarks: data.total_marks,
        passingMarks: data.passing_marks,
        ...(data.start_time ? { startTime: new Date(data.start_time) } : {}),
        ...(data.end_time ? { endTime: new Date(data.end_time) } : {}),
        antiCheatConfig: data.anti_cheat_config as object,
      },
    });

    revalidatePath("/admin");
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error) {
    console.error("Error updating exam:", error);
    return { success: false, error: String(error) };
  }
}

export async function deleteExamAction(id: string) {
  try {
    await prisma.exam.delete({ where: { id } });
    revalidatePath("/admin");
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error) {
    console.error("Error deleting exam:", error);
    return { success: false, error: String(error) };
  }
}

export async function getExamSlotsAction(examId: string): Promise<SerializedSlot[]> {
  try {
    const slots = await prisma.examSlot.findMany({
      where: { examId },
      include: {
        _count: {
          select: { examSessions: true },
        },
      },
      orderBy: { slotNumber: "asc" },
    });

    return slots.map((s) => ({
      id: s.id,
      exam_id: s.examId,
      slot_number: s.slotNumber,
      slot_name: s.slotName,
      login_opens_at: s.loginOpensAt.toISOString(),
      start_time: s.startTime.toISOString(),
      join_window_closes_at: s.joinWindowClosesAt.toISOString(),
      end_time: s.endTime.toISOString(),
      status: s.status as SlotStatus,
      is_retest_slot: s.isRetestSlot,
      enrolled_count: s._count.examSessions,
      attended_count: 0,
    }));
  } catch (error) {
    console.error("Error getting exam slots:", error);
    return [];
  }
}

export async function createExamSlotAction(data: {
  exam_id: string;
  slot_name: string;
  login_opens_at: string;
  start_time: string;
  join_window_closes_at: string;
  end_time: string;
  is_retest_slot?: boolean;
}) {
  try {
    const count = await prisma.examSlot.count({ where: { examId: data.exam_id } });
    const slotNumber = count + 1;

    const slot = await prisma.examSlot.create({
      data: {
        examId: data.exam_id,
        slotNumber,
        slotName: data.slot_name.trim(),
        loginOpensAt: new Date(data.login_opens_at),
        startTime: new Date(data.start_time),
        joinWindowClosesAt: new Date(data.join_window_closes_at),
        endTime: new Date(data.end_time),
        status: "SCHEDULED",
        isRetestSlot: data.is_retest_slot ?? false,
      },
    });

    revalidatePath("/admin/exams");
    return { success: true, slotId: slot.id };
  } catch (error) {
    console.error("Error creating slot:", error);
    return { success: false, error: String(error) };
  }
}

export async function updateExamSlotAction(
  slotId: string,
  data: {
    slot_name?: string;
    login_opens_at?: string;
    start_time?: string;
    join_window_closes_at?: string;
    end_time?: string;
    status?: SlotStatus;
  }
) {
  try {
    await prisma.examSlot.update({
      where: { id: slotId },
      data: {
        ...(data.slot_name ? { slotName: data.slot_name.trim() } : {}),
        ...(data.login_opens_at ? { loginOpensAt: new Date(data.login_opens_at) } : {}),
        ...(data.start_time ? { startTime: new Date(data.start_time) } : {}),
        ...(data.join_window_closes_at ? { joinWindowClosesAt: new Date(data.join_window_closes_at) } : {}),
        ...(data.end_time ? { endTime: new Date(data.end_time) } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
    });

    revalidatePath("/admin/exams");
    revalidatePath("/admin/attendance");
    return { success: true };
  } catch (error) {
    console.error("Error updating slot:", error);
    return { success: false, error: String(error) };
  }
}

export async function deleteExamSlotAction(slotId: string) {
  try {
    await prisma.examSlot.delete({ where: { id: slotId } });
    revalidatePath("/admin/exams");
    return { success: true };
  } catch (error) {
    console.error("Error deleting slot:", error);
    return { success: false, error: String(error) };
  }
}

// ----------------------------------------------------------------------------
// 4. QUESTION BANK (COMMON + DEPARTMENT-SPECIFIC)
// ----------------------------------------------------------------------------

export async function getQuestionsForExamAction(
  examId: string, 
  filters?: { scope?: QuestionScope; departmentId?: string }
): Promise<SerializedQuestion[]> {
  try {
    const where: Record<string, unknown> = { examId };
    if (filters?.scope) {
      where.scope = filters.scope;
    }
    if (filters?.departmentId) {
      where.departmentId = filters.departmentId;
    }

    const questions = await prisma.question.findMany({
      where,
      include: {
        department: { select: { code: true } },
      },
      orderBy: [{ scope: "asc" }, { orderIndex: "asc" }],
    });

    return questions.map((q) => ({
      id: q.id,
      exam_id: q.examId,
      scope: q.scope as QuestionScope,
      department_id: q.departmentId,
      department_code: q.department?.code,
      section_name: q.sectionName || (q.scope === "COMMON" ? "Part A: General & Research Aptitude" : "Part B: Core Domain"),
      question_text: q.questionText,
      question_type: q.questionType as QuestionType,
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

export async function createQuestionAction(data: {
  exam_id: string;
  scope?: QuestionScope;
  department_id?: string | null;
  section_name?: string;
  question_text: string;
  question_type: QuestionType;
  options: { id: string; text: string }[];
  correct_answers: string[];
  marks: number;
  negative_marks: number;
}) {
  try {
    const scope = data.scope || "COMMON";
    const departmentId = scope === "COMMON" ? null : data.department_id || null;
    const sectionName = data.section_name || (scope === "COMMON" ? "Part A: General & Research Aptitude" : "Part B: Department Specialization");

    const count = await prisma.question.count({ 
      where: { 
        examId: data.exam_id, 
        scope, 
        departmentId 
      } 
    });

    await prisma.question.create({
      data: {
        examId: data.exam_id,
        scope,
        departmentId,
        sectionName,
        questionText: data.question_text,
        questionType: data.question_type,
        options: data.options as object,
        correctAnswers: data.correct_answers as object,
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

export async function updateQuestionAction(
  id: string,
  data: {
    scope?: QuestionScope;
    department_id?: string | null;
    section_name?: string;
    question_text: string;
    question_type: QuestionType;
    options: { id: string; text: string }[];
    correct_answers: string[];
    marks: number;
    negative_marks: number;
    explanation?: string;
  }
) {
  try {
    const scope = data.scope || "COMMON";
    const departmentId = scope === "COMMON" ? null : data.department_id || null;
    const sectionName = data.section_name || (scope === "COMMON" ? "Part A: General & Research Aptitude" : "Part B: Department Specialization");

    await prisma.question.update({
      where: { id },
      data: {
        scope,
        departmentId,
        sectionName,
        questionText: data.question_text,
        questionType: data.question_type,
        options: data.options as object,
        correctAnswers: data.correct_answers as object,
        marks: data.marks,
        negativeMarks: data.negative_marks,
        explanation: data.explanation || null,
      },
    });

    revalidatePath("/admin/questions");
    return { success: true };
  } catch (error) {
    console.error("Error updating question:", error);
    return { success: false, error: String(error) };
  }
}

export async function bulkImportQuestionsAction(
  examId: string,
  questions: Array<{
    scope: QuestionScope;
    department_code?: string;
    section_name?: string;
    question_text: string;
    question_type?: QuestionType;
    options: { id: string; text: string }[];
    correct_answers: string[];
    marks: number;
    negative_marks?: number;
    explanation?: string;
  }>
) {
  try {
    const depts = await prisma.department.findMany();
    const deptMap: Record<string, string> = {};
    for (const d of depts) {
      deptMap[d.code.toUpperCase()] = d.id;
    }

    const currentCount = await prisma.question.count({ where: { examId } });
    let inserted = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const scope = q.scope || "COMMON";
      let departmentId: string | null = null;
      if (scope === "DEPARTMENT_SPECIFIC" && q.department_code) {
        departmentId = deptMap[q.department_code.toUpperCase()] || null;
      }

      await prisma.question.create({
        data: {
          examId,
          scope,
          departmentId,
          sectionName: q.section_name || (scope === "COMMON" ? "Part A: General & Research Aptitude" : "Part B: Department Specialization"),
          questionText: q.question_text,
          questionType: q.question_type || "MCQ",
          options: q.options as object,
          correctAnswers: q.correct_answers as object,
          marks: q.marks,
          negativeMarks: q.negative_marks ?? 0,
          explanation: q.explanation || null,
          orderIndex: currentCount + i + 1,
        },
      });
      inserted++;
    }

    revalidatePath("/admin/questions");
    return { success: true, count: inserted };
  } catch (error) {
    console.error("Error bulk importing questions:", error);
    return { success: false, error: String(error), count: 0 };
  }
}

// ----------------------------------------------------------------------------
// 5. ATTENDANCE MANAGEMENT ACTIONS
// ----------------------------------------------------------------------------

export async function getAttendanceOverviewAction(examId: string, slotId?: string) {
  try {
    const where: Record<string, unknown> = { examId };
    if (slotId) {
      where.slotId = slotId;
    }

    const sessions = await prisma.examSession.findMany({
      where,
      include: {
        student: {
          include: { department: true },
        },
        slot: true,
      },
      orderBy: { student: { regNumber: "asc" } },
    });

    const counts = {
      total: sessions.length,
      not_reported: sessions.filter((s) => s.attendanceStatus === "NOT_REPORTED").length,
      logged_in: sessions.filter((s) => s.attendanceStatus === "LOGGED_IN").length,
      in_exam: sessions.filter((s) => s.attendanceStatus === "IN_EXAM").length,
      submitted: sessions.filter((s) => s.attendanceStatus === "SUBMITTED").length,
      absent: sessions.filter((s) => s.attendanceStatus === "ABSENT").length,
      disqualified: sessions.filter((s) => s.attendanceStatus === "DISQUALIFIED").length,
      technical_failure: sessions.filter((s) => s.attendanceStatus === "TECHNICAL_FAILURE").length,
    };

    return {
      success: true,
      counts,
      candidates: sessions.map((s) => ({
        sessionId: s.id,
        studentId: s.student.id,
        regNumber: s.student.regNumber,
        fullName: s.student.fullName,
        email: s.student.email,
        department: s.student.department.code,
        slotName: s.slot?.slotName || "Primary Slot",
        slotNumber: s.slot?.slotNumber || 1,
        attendanceStatus: s.attendanceStatus as AttendanceStatus,
        loginAt: s.loginAt ? s.loginAt.toISOString() : null,
        startedAt: s.startedAt ? s.startedAt.toISOString() : null,
        violationCount: s.violationCount,
      })),
    };
  } catch (error) {
    console.error("Error in getAttendanceOverviewAction:", error);
    return { success: false, error: String(error), counts: null, candidates: [] };
  }
}

export async function updateCandidateAttendanceAction(sessionId: string, status: AttendanceStatus) {
  try {
    await prisma.examSession.update({
      where: { id: sessionId },
      data: { 
        attendanceStatus: status,
        status: status === "SUBMITTED" ? "SUBMITTED" : status === "DISQUALIFIED" ? "DISQUALIFIED" : status === "ABSENT" ? "ABSENT" : undefined,
      },
    });

    revalidatePath("/admin/attendance");
    revalidatePath("/admin/candidates");
    return { success: true };
  } catch (error) {
    console.error("Error updating attendance:", error);
    return { success: false, error: String(error) };
  }
}

export async function bulkUpdateAttendanceAction(
  examId: string,
  slotId: string | undefined,
  fromStatus: AttendanceStatus,
  toStatus: AttendanceStatus
) {
  try {
    const where: Record<string, unknown> = {
      examId,
      attendanceStatus: fromStatus,
    };
    if (slotId) {
      where.slotId = slotId;
    }

    const updated = await prisma.examSession.updateMany({
      where,
      data: {
        attendanceStatus: toStatus,
        status: toStatus === "IN_EXAM" ? "IN_PROGRESS" : toStatus === "ABSENT" ? "ABSENT" : undefined,
        ...(toStatus === "IN_EXAM" ? { startedAt: new Date() } : {}),
      },
    });

    revalidatePath("/admin/attendance");
    return { success: true, count: updated.count };
  } catch (error) {
    console.error("Error bulk updating attendance:", error);
    return { success: false, error: String(error) };
  }
}

// ----------------------------------------------------------------------------
// 6. SECOND SLOT / RE-EXAM ENGINE
// ----------------------------------------------------------------------------

export async function getSecondSlotEligibleCandidatesAction(examId: string, slotId?: string) {
  try {
    // Find all sessions in the exam that:
    // 1. Are marked ABSENT (unattended)
    // 2. Are marked TECHNICAL_FAILURE
    // 3. Are marked DISQUALIFIED (optional flag)
    // 4. Have attemptNumber == 1 and no retestSlotId assigned yet
    const where: Record<string, unknown> = {
      examId,
      attemptNumber: 1,
      retestSlotId: null,
      OR: [
        { attendanceStatus: "ABSENT" },
        { attendanceStatus: "TECHNICAL_FAILURE" },
        { status: "ABSENT" },
        { status: "TECHNICAL_FAILURE" },
        { status: "DISQUALIFIED" },
        { attendanceStatus: "NOT_REPORTED" }, // Scheduled but never appeared
      ],
    };

    if (slotId) {
      where.slotId = slotId;
    }

    const eligibleSessions = await prisma.examSession.findMany({
      where,
      include: {
        student: {
          include: { department: true },
        },
        slot: true,
      },
      orderBy: { student: { regNumber: "asc" } },
    });

    return eligibleSessions.map((s) => ({
      sessionId: s.id,
      studentId: s.student.id,
      regNumber: s.student.regNumber,
      fullName: s.student.fullName,
      email: s.student.email,
      department: s.student.department.code,
      departmentName: s.student.department.name,
      previousSlotName: s.slot?.slotName || "Slot 1",
      reason: s.attendanceStatus === "ABSENT" || s.attendanceStatus === "NOT_REPORTED"
        ? "Unattended / Absent"
        : s.attendanceStatus === "TECHNICAL_FAILURE"
        ? "Technical Dropout / Failure"
        : s.status === "DISQUALIFIED"
        ? "Policy Disqualification (Review Required)"
        : "Incomplete Session",
      attendanceStatus: s.attendanceStatus,
    }));
  } catch (error) {
    console.error("Error in getSecondSlotEligibleCandidatesAction:", error);
    return [];
  }
}

export async function createSecondSlotAndEnrollAction(data: {
  exam_id: string;
  slot_name: string;
  login_opens_at: string;
  start_time: string;
  join_window_closes_at: string;
  end_time: string;
  candidate_student_ids: string[]; // List of student IDs to re-enroll
}) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Determine slotNumber (e.g. 2, 3...)
      const existingSlotCount = await tx.examSlot.count({ where: { examId: data.exam_id } });
      const nextSlotNumber = existingSlotCount + 1;

      // 2. Create the Second Slot
      const slot2 = await tx.examSlot.create({
        data: {
          examId: data.exam_id,
          slotNumber: nextSlotNumber,
          slotName: data.slot_name || `Slot ${nextSlotNumber} - Re-Exam / Makeup`,
          loginOpensAt: new Date(data.login_opens_at),
          startTime: new Date(data.start_time),
          joinWindowClosesAt: new Date(data.join_window_closes_at),
          endTime: new Date(data.end_time),
          status: "SCHEDULED",
          isRetestSlot: true,
        },
      });

      // 3. For each selected student:
      // a. Mark their Slot 1 session as retest-eligible and assign retestSlotId
      // b. Create a new ExamSession for Slot 2 with attemptNumber = 2
      for (const studentId of data.candidate_student_ids) {
        await tx.examSession.updateMany({
          where: { examId: data.exam_id, studentId, attemptNumber: 1 },
          data: {
            isEligibleForRetest: true,
            retestSlotId: slot2.id,
          },
        });

        // Create the attempt 2 session
        await tx.examSession.create({
          data: {
            examId: data.exam_id,
            slotId: slot2.id,
            studentId,
            status: "SCHEDULED",
            attendanceStatus: "NOT_REPORTED",
            attemptNumber: 2,
            integrityScore: 100,
            violationCount: 0,
          },
        });

        // Log to audit log
        await tx.examAuditLog.create({
          data: {
            sessionId: slot2.id, // reference or placeholder
            eventType: "RETEST_SLOT_ALLOCATED",
            severity: "INFO",
            details: {
              studentId,
              slotId: slot2.id,
              slotNumber: nextSlotNumber,
              reason: "Candidate enrolled in makeup second slot",
            },
          },
        }).catch(() => null); // Non-blocking
      }

      return slot2;
    });

    revalidatePath("/admin");
    revalidatePath("/admin/exams");
    revalidatePath("/admin/second-slot");
    revalidatePath("/admin/candidates");
    revalidatePath("/admin/attendance");
    return { success: true, slotId: result.id, slotNumber: result.slotNumber };
  } catch (error) {
    console.error("Error creating second slot:", error);
    return { success: false, error: String(error) };
  }
}

export async function manualAddCandidateToSecondSlotAction(
  examId: string,
  studentId: string,
  reason: string
) {
  try {
    let session = await prisma.examSession.findFirst({
      where: { examId, studentId, attemptNumber: 1 },
    });

    if (!session) {
      session = await prisma.examSession.create({
        data: {
          examId,
          studentId,
          status: "TECHNICAL_FAILURE",
          attendanceStatus: "TECHNICAL_FAILURE",
          attemptNumber: 1,
          isEligibleForRetest: true,
        },
      });
    } else {
      await prisma.examSession.update({
        where: { id: session.id },
        data: {
          isEligibleForRetest: true,
          attendanceStatus: session.attendanceStatus === "NOT_REPORTED" ? "ABSENT" : session.attendanceStatus,
        },
      });
    }

    await prisma.examAuditLog.create({
      data: {
        sessionId: session.id,
        eventType: "RETEST_ELIGIBILITY_MANUALLY_GRANTED",
        severity: "INFO",
        details: { studentId, examId, reason },
      },
    }).catch(() => null);

    revalidatePath("/admin/second-slot");
    return { success: true };
  } catch (error) {
    console.error("Error manually adding candidate to second slot:", error);
    return { success: false, error: String(error) };
  }
}

export async function getExistingSecondSlotsAction(examId: string) {
  try {
    const slots = await prisma.examSlot.findMany({
      where: { examId, isRetestSlot: true },
      include: {
        examSessions: {
          include: {
            student: { include: { department: true } },
          },
        },
      },
      orderBy: { slotNumber: "asc" },
    });

    return slots.map((s) => ({
      id: s.id,
      slot_name: s.slotName,
      slot_number: s.slotNumber,
      start_time: s.startTime.toISOString(),
      end_time: s.endTime.toISOString(),
      status: s.status,
      enrolled_candidates: s.examSessions.map((es) => ({
        sessionId: es.id,
        regNumber: es.student.regNumber,
        fullName: es.student.fullName,
        departmentCode: es.student.department.code,
        status: es.status,
        attendanceStatus: es.attendanceStatus,
      })),
    }));
  } catch (error) {
    console.error("Error fetching existing second slots:", error);
    return [];
  }
}

// ----------------------------------------------------------------------------
// 7. RESULTS & EVALUATION ACTIONS
// ----------------------------------------------------------------------------

export async function getExamResultsAction(examId: string, slotId?: string) {
  try {
    const where: Record<string, unknown> = { examId };
    if (slotId) {
      where.slotId = slotId;
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { title: true, courseCode: true, passingMarks: true, totalMarks: true },
    });

    const sessions = await prisma.examSession.findMany({
      where,
      include: {
        student: {
          include: { department: true },
        },
        slot: true,
      },
      orderBy: { finalScore: "desc" },
    });

    return {
      success: true,
      exam,
      results: sessions.map((s) => ({
        sessionId: s.id,
        regNumber: s.student.regNumber,
        fullName: s.student.fullName,
        email: s.student.email,
        departmentCode: s.student.department.code,
        slotName: s.slot?.slotName || "Slot 1",
        attemptNumber: s.attemptNumber,
        status: s.status,
        attendanceStatus: s.attendanceStatus,
        finalScore: s.finalScore !== null ? Number(s.finalScore) : null,
        commonScore: s.commonScore !== null ? Number(s.commonScore) : null,
        departmentScore: s.departmentScore !== null ? Number(s.departmentScore) : null,
        isPassed: s.isPassed ?? (s.finalScore !== null && exam ? Number(s.finalScore) >= Number(exam.passingMarks) : null),
        integrityScore: s.integrityScore,
        violationCount: s.violationCount,
        submittedAt: s.submittedAt ? s.submittedAt.toISOString() : null,
      })),
    };
  } catch (error) {
    console.error("Error in getExamResultsAction:", error);
    return { success: false, error: String(error), exam: null, results: [] };
  }
}

export async function getCandidateSessionResponsesAction(sessionId: string) {
  try {
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        student: { include: { department: true } },
        exam: {
          include: {
            questions: {
              orderBy: [{ scope: "asc" }, { orderIndex: "asc" }],
            },
          },
        },
        answers: true,
      },
    });

    if (!session) return { success: false, error: "Session not found", candidate: null, responses: [] };

    const answerMap = new Map(session.answers.map((a) => [a.questionId, a]));

    const applicableQuestions = session.exam.questions.filter(
      (q) => q.scope === "COMMON" || q.departmentId === session.student.departmentId
    );

    const responses: CandidateResponseDetail[] = applicableQuestions.map((q) => {
      const ans = answerMap.get(q.id);
      const selected = Array.isArray(ans?.selectedOptions) ? (ans.selectedOptions as string[]) : [];
      const correct = Array.isArray(q.correctAnswers) ? (q.correctAnswers as string[]) : [];
      const isCorrect = selected.length === correct.length && selected.every((val) => correct.includes(val));
      const marks = Number(q.marks);
      const neg = Number(q.negativeMarks);
      const scoreEarned = isCorrect ? marks : selected.length > 0 ? -neg : 0;

      return {
        questionId: q.id,
        questionText: q.questionText,
        sectionName: q.sectionName || "Section",
        scope: q.scope,
        questionType: q.questionType,
        marks,
        negativeMarks: neg,
        options: Array.isArray(q.options) ? (q.options as { id: string; text: string }[]) : [],
        correctAnswers: correct,
        selectedOptions: selected,
        textResponse: ans?.textResponse || null,
        isCorrect,
        scoreEarned,
      };
    });

    return {
      success: true,
      candidate: {
        fullName: session.student.fullName,
        regNumber: session.student.regNumber,
        departmentCode: session.student.department.code,
        examTitle: session.exam.title,
        finalScore: session.finalScore !== null ? Number(session.finalScore) : null,
        isPassed: session.isPassed,
        integrityScore: session.integrityScore,
        violationCount: session.violationCount,
      },
      responses,
    };
  } catch (error) {
    console.error("Error fetching candidate response breakdown:", error);
    return { success: false, error: String(error), candidate: null, responses: [] };
  }
}

export async function overrideCandidateScoreAction(
  sessionId: string,
  finalScore: number,
  isPassed: boolean,
  remark?: string
) {
  try {
    await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        finalScore,
        isPassed,
      },
    });

    await prisma.examAuditLog.create({
      data: {
        sessionId,
        eventType: "SCORE_OVERRIDDEN_BY_COMMITTEE",
        severity: "MEDIUM",
        details: {
          adjustedFinalScore: finalScore,
          adjustedIsPassed: isPassed,
          committeeRemark: remark || "Evaluated under university discretionary appeal",
        },
      },
    });

    revalidatePath("/admin/results");
    return { success: true };
  } catch (error) {
    console.error("Error overriding candidate score:", error);
    return { success: false, error: String(error) };
  }
}

// ----------------------------------------------------------------------------
// 8. PROCTOR & SECURITY ACTIONS
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
        attendanceStatus: "DISQUALIFIED",
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
    revalidatePath("/admin/attendance");
    return { success: true };
  } catch (error) {
    console.error("Error terminating session:", error);
    return { success: false, error: String(error) };
  }
}

export async function getCandidateAuditLogsAction(sessionId: string): Promise<SerializedAuditLog[]> {
  try {
    const logs = await prisma.examAuditLog.findMany({
      where: { sessionId },
      orderBy: { timestamp: "desc" },
    });

    return logs.map((l) => ({
      id: l.id,
      session_id: l.sessionId,
      event_type: l.eventType,
      severity: l.severity,
      timestamp: l.timestamp.toISOString(),
      evidence_snapshot_url: l.evidenceSnapshotUrl,
      evidence_audio_url: l.evidenceAudioUrl,
      details: (l.details as Record<string, unknown>) || {},
    }));
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return [];
  }
}

export async function broadcastProctorAnnouncementAction(examId: string, message: string) {
  try {
    const sessions = await prisma.examSession.findMany({
      where: {
        examId,
        status: { in: ["IN_PROGRESS", "WAITING_ROOM"] },
      },
      select: { id: true },
    });

    for (const s of sessions) {
      await prisma.examAuditLog.create({
        data: {
          sessionId: s.id,
          eventType: "PROCTOR_ANNOUNCEMENT_BROADCAST",
          severity: "INFO",
          details: { message, broadcastAt: new Date().toISOString() },
        },
      }).catch(() => null);
    }

    revalidatePath("/admin/proctor");
    return { success: true, count: sessions.length };
  } catch (error) {
    console.error("Error broadcasting announcement:", error);
    return { success: false, error: String(error) };
  }
}

// ----------------------------------------------------------------------------
// 9. SEED DEMO DATA ACTION (POPULATE DEPARTMENTS, STUDENTS, EXAM & QUESTIONS)
// ----------------------------------------------------------------------------

export async function seedDemoDataAction(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Create Academic Departments
    const depts = [
      { code: "CSE", name: "Computer Science & Engineering", description: "Advanced Computing, Systems, and AI Research" },
      { code: "MECH", name: "Mechanical Engineering", description: "Thermal, Fluid Dynamics, and Robotics Research" },
      { code: "ECE", name: "Electronics & Communication", description: "VLSI, Wireless Networks, and Signal Processing" },
      { code: "MATH", name: "Mathematical Sciences", description: "Applied Mathematics, Topology, and Statistics" },
    ];

    const createdDepts: Record<string, string> = {};
    for (const d of depts) {
      const existing = await prisma.department.findUnique({ where: { code: d.code } });
      if (existing) {
        createdDepts[d.code] = existing.id;
      } else {
        const created = await prisma.department.create({ data: d });
        createdDepts[d.code] = created.id;
      }
    }

    // 2. Create Research Scholars
    const scholars = [
      { reg: "PHD26-CSE-001", name: "Ananya Sharma", email: "ananya.sharma@research.univ.edu", dept: "CSE" },
      { reg: "PHD26-CSE-002", name: "Devansh Patel", email: "devansh.patel@research.univ.edu", dept: "CSE" },
      { reg: "PHD26-CSE-003", name: "Pooja Hegde", email: "pooja.hegde@research.univ.edu", dept: "CSE" },
      { reg: "PHD26-MECH-001", name: "Rahul Verma", email: "rahul.verma@research.univ.edu", dept: "MECH" },
      { reg: "PHD26-MECH-002", name: "Karthik Raja", email: "karthik.raja@research.univ.edu", dept: "MECH" },
      { reg: "PHD26-ECE-001", name: "Sneha Nair", email: "sneha.nair@research.univ.edu", dept: "ECE" },
      { reg: "PHD26-MATH-001", name: "Arjun Mukherjee", email: "arjun.m@research.univ.edu", dept: "MATH" },
    ];

    const studentMap: Record<string, string> = {};
    for (const s of scholars) {
      const existing = await prisma.student.findUnique({ where: { regNumber: s.reg } });
      if (existing) {
        studentMap[s.reg] = existing.id;
      } else {
        const created = await prisma.student.create({
          data: {
            regNumber: s.reg,
            fullName: s.name,
            email: s.email,
            departmentId: createdDepts[s.dept],
            accessCode: "998877",
          },
        });
        studentMap[s.reg] = created.id;
      }
    }

    // 3. Create Demonstration Exam
    const examCode = "PHD-RES-2026";
    let exam = await prisma.exam.findFirst({ where: { courseCode: examCode } });
    if (!exam) {
      const now = new Date();
      const startTime = new Date(now.getTime() + 10 * 60 * 1000); // starts in 10 mins
      const endTime = new Date(now.getTime() + 130 * 60 * 1000);

      exam = await prisma.exam.create({
        data: {
          title: "Ph.D Research Qualifying & Coursework Examination (Spring 2026)",
          courseCode: examCode,
          description: "Dual-paper qualifying examination: Part A Common Research Aptitude + Part B Departmental Specialization",
          durationMinutes: 90,
          totalMarks: 100,
          passingMarks: 50,
          startTime,
          endTime,
          isPublished: true,
          antiCheatConfig: {
            enable_face_tracking: true,
            enable_audio_monitoring: true,
            max_tab_switches: 3,
            max_fullscreen_exits: 3,
            periodic_snapshot_interval_sec: 45,
            allowed_yaw_angle_deg: 28,
            allowed_pitch_angle_deg: 20,
          },
        },
      });

      // Create Slot 1
      const slot1 = await prisma.examSlot.create({
        data: {
          examId: exam.id,
          slotNumber: 1,
          slotName: "Slot 1 - Regular Morning Session",
          loginOpensAt: new Date(now.getTime() - 5 * 60 * 1000), // Login already open
          startTime: startTime,
          joinWindowClosesAt: new Date(startTime.getTime() + 15 * 60 * 1000),
          endTime: endTime,
          status: "LOGIN_OPEN",
          isRetestSlot: false,
        },
      });

      // 4. Create Common & Department Questions
      const questionsData = [
        // Common Questions (Part A)
        {
          scope: "COMMON" as QuestionScope,
          departmentId: null,
          sectionName: "Part A: Research Methodology & Ethics (Common to All Departments)",
          text: "In empirical scientific research, a Type I error occurs when:",
          type: "MCQ" as QuestionType,
          options: [
            { id: "a", text: "The researcher rejects a true null hypothesis (False Positive)" },
            { id: "b", text: "The researcher fails to reject a false null hypothesis (False Negative)" },
            { id: "c", text: "The sample size is statistically inadequate for inference" },
            { id: "d", text: "The measurement instrument has high variance and low reliability" },
          ],
          correct: ["a"],
          marks: 4,
          neg: 1,
        },
        {
          scope: "COMMON" as QuestionScope,
          departmentId: null,
          sectionName: "Part A: Research Methodology & Ethics (Common to All Departments)",
          text: "Which ethical principle strictly forbids presenting another author's thoughts, methods, or words without appropriate attribution?",
          type: "MCQ" as QuestionType,
          options: [
            { id: "a", text: "Informed Consent" },
            { id: "b", text: "Academic Plagiarism Prohibition" },
            { id: "c", text: "Double-Blind Peer Anonymity" },
            { id: "d", text: "Selective Falsification Protection" },
          ],
          correct: ["b"],
          marks: 4,
          neg: 1,
        },
        // CSE Specific Questions (Part B)
        {
          scope: "DEPARTMENT_SPECIFIC" as QuestionScope,
          departmentId: createdDepts["CSE"],
          sectionName: "Part B: Computer Science & Engineering Core",
          text: "What is the asymptotic time complexity of Tarjan's algorithm for finding Strongly Connected Components in a directed graph G = (V, E)?",
          type: "MCQ" as QuestionType,
          options: [
            { id: "a", text: "O(V + E)" },
            { id: "b", text: "O(V * log V)" },
            { id: "c", text: "O(V^2)" },
            { id: "d", text: "O(E * log V)" },
          ],
          correct: ["a"],
          marks: 4,
          neg: 1,
        },
        {
          scope: "DEPARTMENT_SPECIFIC" as QuestionScope,
          departmentId: createdDepts["CSE"],
          sectionName: "Part B: Computer Science & Engineering Core",
          text: "In distributed consensus protocols (e.g., Raft / Paxos), what fundamental invariant guarantees safety against split-brain leader elections?",
          type: "MCQ" as QuestionType,
          options: [
            { id: "a", text: "Heartbeat timeouts shorter than RTT" },
            { id: "b", text: "Strict majority quorum overlap (N/2 + 1)" },
            { id: "c", text: "Synchronized atomic clock hardware (PTP)" },
            { id: "d", text: "Asymmetric RSA leader signature tokens" },
          ],
          correct: ["b"],
          marks: 4,
          neg: 1,
        },
        // Mechanical Specific Questions (Part B)
        {
          scope: "DEPARTMENT_SPECIFIC" as QuestionScope,
          departmentId: createdDepts["MECH"],
          sectionName: "Part B: Mechanical Engineering Core",
          text: "According to the Carnot principle, the thermal efficiency of a reversible heat engine operating between two reservoirs depends strictly on:",
          type: "MCQ" as QuestionType,
          options: [
            { id: "a", text: "The working fluid composition and viscosity" },
            { id: "b", text: "The absolute temperatures of the source and sink reservoirs" },
            { id: "c", text: "The compression ratio and mechanical friction index" },
            { id: "d", text: "The enthalpy change during isothermal expansion" },
          ],
          correct: ["b"],
          marks: 4,
          neg: 1,
        },
      ];

      for (let i = 0; i < questionsData.length; i++) {
        const q = questionsData[i];
        await prisma.question.create({
          data: {
            examId: exam.id,
            scope: q.scope,
            departmentId: q.departmentId,
            sectionName: q.sectionName,
            questionText: q.text,
            questionType: q.type,
            options: q.options,
            correctAnswers: q.correct,
            marks: q.marks,
            negativeMarks: q.neg,
            orderIndex: i + 1,
          },
        });
      }

      // 5. Enroll Scholars with diverse realistic states (some present, some submitted, some unattended/absent!)
      const enrollments = [
        {
          reg: "PHD26-CSE-001",
          status: "SUBMITTED" as ExamStatus,
          att: "SUBMITTED" as AttendanceStatus,
          score: 88,
          cScore: 40,
          dScore: 48,
          passed: true,
          integrity: 98,
        },
        {
          reg: "PHD26-CSE-002",
          status: "IN_PROGRESS" as ExamStatus,
          att: "IN_EXAM" as AttendanceStatus,
          score: null,
          cScore: null,
          dScore: null,
          passed: null,
          integrity: 92,
        },
        {
          // Candidate missed exam -> ABSENT! Perfect candidate for Slot 2!
          reg: "PHD26-CSE-003",
          status: "ABSENT" as ExamStatus,
          att: "ABSENT" as AttendanceStatus,
          score: null,
          cScore: null,
          dScore: null,
          passed: false,
          integrity: 100,
        },
        {
          reg: "PHD26-MECH-001",
          status: "SUBMITTED" as ExamStatus,
          att: "SUBMITTED" as AttendanceStatus,
          score: 76,
          cScore: 36,
          dScore: 40,
          passed: true,
          integrity: 95,
        },
        {
          // Candidate experienced technical dropout -> TECHNICAL_FAILURE! Perfect for Slot 2!
          reg: "PHD26-MECH-002",
          status: "TECHNICAL_FAILURE" as ExamStatus,
          att: "TECHNICAL_FAILURE" as AttendanceStatus,
          score: null,
          cScore: null,
          dScore: null,
          passed: false,
          integrity: 85,
        },
        {
          // Candidate in waiting room
          reg: "PHD26-ECE-001",
          status: "WAITING_ROOM" as ExamStatus,
          att: "LOGGED_IN" as AttendanceStatus,
          score: null,
          cScore: null,
          dScore: null,
          passed: null,
          integrity: 100,
        },
        {
          // Unattended
          reg: "PHD26-MATH-001",
          status: "SCHEDULED" as ExamStatus,
          att: "NOT_REPORTED" as AttendanceStatus,
          score: null,
          cScore: null,
          dScore: null,
          passed: null,
          integrity: 100,
        },
      ];

      for (const enr of enrollments) {
        const studentId = studentMap[enr.reg];
        if (studentId) {
          await prisma.examSession.create({
            data: {
              examId: exam.id,
              slotId: slot1.id,
              studentId,
              status: enr.status,
              attendanceStatus: enr.att,
              startedAt: enr.att === "IN_EXAM" || enr.att === "SUBMITTED" ? new Date(Date.now() - 30 * 60 * 1000) : null,
              submittedAt: enr.att === "SUBMITTED" ? new Date() : null,
              loginAt: enr.att !== "NOT_REPORTED" && enr.att !== "ABSENT" ? new Date(Date.now() - 35 * 60 * 1000) : null,
              finalScore: enr.score,
              commonScore: enr.cScore,
              departmentScore: enr.dScore,
              isPassed: enr.passed,
              integrityScore: enr.integrity,
              violationCount: enr.integrity < 95 ? 1 : 0,
              attemptNumber: 1,
            },
          });
        }
      }
    }

    revalidatePath("/admin");
    revalidatePath("/admin/exams");
    revalidatePath("/admin/questions");
    revalidatePath("/admin/candidates");
    revalidatePath("/admin/departments");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/results");
    revalidatePath("/admin/second-slot");

    return { success: true, message: "Demo departments, scholars, qualifying exam, dual-tier questions, and diverse session attendance seeded successfully!" };
  } catch (error) {
    console.error("Error seeding demo data:", error);
    return { success: false, message: String(error) };
  }
}

// ----------------------------------------------------------------------------
// 10. CLEAR ALL DATABASE DATA (DANGER ACTION)
// ----------------------------------------------------------------------------

export async function clearAllDatabaseDataAction(): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete in reverse relational order (cascade-safe)
    await prisma.examAuditLog.deleteMany();
    await prisma.sessionAnswer.deleteMany();
    await prisma.examSession.deleteMany();
    await prisma.question.deleteMany();
    await prisma.examSlot.deleteMany();
    await prisma.student.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.department.deleteMany();

    revalidatePath("/admin");
    revalidatePath("/admin/exams");
    revalidatePath("/admin/questions");
    revalidatePath("/admin/proctor");
    revalidatePath("/admin/candidates");
    revalidatePath("/admin/departments");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/results");
    revalidatePath("/admin/second-slot");
    return { success: true };
  } catch (error) {
    console.error("Failed to clear database records:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to clear database" };
  }
}
