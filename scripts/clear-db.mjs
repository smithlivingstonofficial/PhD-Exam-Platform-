import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasourceUrl: process.env.DIRECT_URL || process.env.DATABASE_URL,
});

async function main() {
  console.log("Checking existing records in database...");
  const examCount = await prisma.exam.count();
  const questionCount = await prisma.question.count();
  const sessionCount = await prisma.examSession.count();
  const answerCount = await prisma.sessionAnswer.count();
  const auditLogCount = await prisma.examAuditLog.count();

  console.log({
    exams: examCount,
    questions: questionCount,
    examSessions: sessionCount,
    sessionAnswers: answerCount,
    examAuditLogs: auditLogCount,
  });

  console.log("Removing all records...");
  const deletedAuditLogs = await prisma.examAuditLog.deleteMany();
  console.log(`Deleted ${deletedAuditLogs.count} audit logs.`);

  const deletedAnswers = await prisma.sessionAnswer.deleteMany();
  console.log(`Deleted ${deletedAnswers.count} session answers.`);

  const deletedSessions = await prisma.examSession.deleteMany();
  console.log(`Deleted ${deletedSessions.count} exam sessions.`);

  const deletedQuestions = await prisma.question.deleteMany();
  console.log(`Deleted ${deletedQuestions.count} questions.`);

  const deletedExams = await prisma.exam.deleteMany();
  console.log(`Deleted ${deletedExams.count} exams.`);

  console.log("Database cleared successfully!");
}

main()
  .catch((e) => {
    console.error("Error clearing database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
