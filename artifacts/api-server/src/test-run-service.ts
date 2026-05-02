import { db } from "./db";
import { eq, like, inArray, and, sql } from "drizzle-orm";
import { 
  studentRegistrations, 
  exams, 
  questions, 
  registrations, 
  attempts, 
  answers, 
  olympiadResults,
  olympiadCategories,
  users
} from "@workspace/db";
import bcrypt from "bcrypt";
import {
  INDIAN_STATES_CITIES,
  INDIAN_FIRST_NAMES,
  INDIAN_LAST_NAMES,
  INDIAN_SCHOOLS,
  OLYMPIAD_CONFIGS,
  QUESTION_TEMPLATES,
  TEST_DATA_MARKER,
  generatePhoneNumber,
  generateDateOfBirth,
  generateGradeLevel,
  generateScoreDistribution,
  generateTimeTaken,
  assignMedal,
  getPerformanceRemark
} from "./test-data-config";

interface TestRunLog {
  step: string;
  status: "success" | "error" | "info";
  message: string;
  count?: number;
}

interface DemoCredential {
  studentId: string;
  name: string;
  email: string;
  password: string;
  school: string;
  grade: string;
}

interface TestRunResult {
  success: boolean;
  logs: TestRunLog[];
  demoCredentials: DemoCredential[];
  summary: {
    studentsCreated: number;
    olympiadsCreated: number;
    questionsCreated: number;
    registrationsCreated: number;
    attemptsSimulated: number;
    resultsGenerated: number;
  };
}

// Generate unique Student ID
function generateStudentId(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  const sequence = Math.floor(100000 + Math.random() * 900000);
  return `${TEST_DATA_MARKER}SAM${year}${sequence}`;
}

// Generate unique email
function generateEmail(firstName: string, lastName: string, index: number): string {
  return `${TEST_DATA_MARKER}${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@testrun.samikaranolympiad.com`;
}

export async function runTestData(): Promise<TestRunResult> {
  const logs: TestRunLog[] = [];
  const demoCredentials: DemoCredential[] = [];
  let summary = {
    studentsCreated: 0,
    olympiadsCreated: 0,
    questionsCreated: 0,
    registrationsCreated: 0,
    attemptsSimulated: 0,
    resultsGenerated: 0
  };

  try {
    // ===========================================
    // STEP 1: CLEAN PREVIOUS TEST DATA (UNCONDITIONAL)
    // ===========================================
    logs.push({ step: "Step 1", status: "info", message: "Starting test data cleanup..." });

    // UNCONDITIONAL CLEANUP: Always run all cleanup queries to handle partial failures
    let cleanedCount = 0;

    // Step 1a: Find and delete olympiad results for test students
    const testStudents = await db.select({ id: studentRegistrations.id })
      .from(studentRegistrations)
      .where(like(studentRegistrations.studentId, `${TEST_DATA_MARKER}%`));
    
    if (testStudents.length > 0) {
      const testStudentIds = testStudents.map(s => s.id);
      await db.delete(olympiadResults).where(inArray(olympiadResults.studentId, testStudentIds));
      cleanedCount += testStudents.length;
    }

    // Step 1b: Delete answers and attempts for test users (always run)
    const testAttempts = await db.select({ id: attempts.id })
      .from(attempts)
      .where(like(attempts.userId, `${TEST_DATA_MARKER}%`));
    
    if (testAttempts.length > 0) {
      const attemptIds = testAttempts.map(a => a.id);
      await db.delete(answers).where(inArray(answers.attemptId, attemptIds));
      await db.delete(attempts).where(inArray(attempts.id, attemptIds));
      cleanedCount += testAttempts.length;
    }

    // Step 1c: Delete registrations for test users (always run)
    await db.delete(registrations).where(like(registrations.userId, `${TEST_DATA_MARKER}%`));
    
    // Step 1d: Delete test student registrations (always run)
    await db.delete(studentRegistrations).where(like(studentRegistrations.studentId, `${TEST_DATA_MARKER}%`));
    
    // Step 1e: Delete test users (always run)
    await db.delete(users).where(like(users.id, `${TEST_DATA_MARKER}%`));

    // Step 1f: Delete test olympiads and their questions (always run)
    const testExams = await db.select({ id: exams.id })
      .from(exams)
      .where(like(exams.title, `${TEST_DATA_MARKER}%`));

    if (testExams.length > 0) {
      const examIds = testExams.map(e => e.id);
      await db.delete(questions).where(inArray(questions.examId, examIds));
      await db.delete(exams).where(inArray(exams.id, examIds));
      cleanedCount += testExams.length;
    }

    logs.push({ step: "Step 1", status: "success", message: "Previous test data cleaned successfully", count: cleanedCount });

    // ===========================================
    // STEP 2: CREATE 200 STUDENTS
    // ===========================================
    logs.push({ step: "Step 2", status: "info", message: "Creating 200 Indian students..." });

    const stateNames = Object.keys(INDIAN_STATES_CITIES);
    const createdStudents: { id: number; studentId: string; userId: string; firstName: string; lastName: string; email: string; school: string; grade: string }[] = [];
    const testPassword = "Test@123";
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    for (let i = 0; i < 200; i++) {
      const firstName = INDIAN_FIRST_NAMES[Math.floor(Math.random() * INDIAN_FIRST_NAMES.length)];
      const lastName = INDIAN_LAST_NAMES[Math.floor(Math.random() * INDIAN_LAST_NAMES.length)];
      const stateName = stateNames[i % stateNames.length];
      const cities = INDIAN_STATES_CITIES[stateName];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const school = INDIAN_SCHOOLS[Math.floor(Math.random() * INDIAN_SCHOOLS.length)];
      const grade = generateGradeLevel();
      const studentId = generateStudentId();
      const email = generateEmail(firstName, lastName, i);
      const phone = generatePhoneNumber();
      const dob = generateDateOfBirth();
      const userId = `${TEST_DATA_MARKER}user_${i}_${Date.now()}`;

      // Create user entry
      await db.insert(users).values({
        id: userId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        password: hashedPassword,
        userType: "student",
        phone: phone,
        grade: grade,
        schoolName: `${school}, ${city}`
      });

      // Create student registration
      const [student] = await db.insert(studentRegistrations).values({
        studentId: studentId,
        email: email,
        firstName: firstName,
        lastName: lastName,
        dateOfBirth: dob,
        gender: Math.random() > 0.5 ? "Male" : "Female",
        phone: phone,
        schoolLocation: stateName,
        schoolCity: city,
        schoolName: `${school}, ${city}`,
        gradeLevel: grade,
        password: hashedPassword,
        profileStatus: "complete",
        profileStep: 5,
        emailVerified: true,
        phoneVerified: true,
        termsAccepted: true,
        verified: true,
        profileCompletedAt: new Date()
      }).returning();

      createdStudents.push({
        id: student.id,
        studentId: studentId,
        userId: userId,
        firstName: firstName,
        lastName: lastName,
        email: email,
        school: `${school}, ${city}`,
        grade: grade
      });

      // Store demo credentials for first 5 students
      if (i < 5) {
        demoCredentials.push({
          studentId: studentId.replace(TEST_DATA_MARKER, ""),
          name: `${firstName} ${lastName}`,
          email: email,
          password: testPassword,
          school: `${school}, ${city}`,
          grade: `Grade ${grade}`
        });
      }
    }

    summary.studentsCreated = createdStudents.length;
    logs.push({ step: "Step 2", status: "success", message: "Created 200 Indian students across all states", count: 200 });

    // ===========================================
    // STEP 3: DEMO CREDENTIALS (Already collected above)
    // ===========================================
    logs.push({ step: "Step 3", status: "success", message: "5 demo login credentials generated", count: 5 });

    // ===========================================
    // STEP 4: CREATE 5 OLYMPIADS
    // ===========================================
    logs.push({ step: "Step 4", status: "info", message: "Creating 5 Olympiads..." });

    const createdOlympiads: { id: number; title: string; subject: string; totalMarks: number; durationMinutes: number }[] = [];
    const now = new Date();
    const registrationOpen = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    const registrationClose = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000); // 1 day ago
    const examStart = new Date(now.getTime() - 12 * 60 * 60 * 1000); // 12 hours ago
    const examEnd = new Date(now.getTime() + 12 * 60 * 60 * 1000); // 12 hours from now
    const resultDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    for (const config of OLYMPIAD_CONFIGS) {
      const [exam] = await db.insert(exams).values({
        title: `${TEST_DATA_MARKER}${config.title}`,
        slug: `${TEST_DATA_MARKER}${config.title.toLowerCase().replace(/\s+/g, '-')}`,
        description: config.description,
        subject: config.subject,
        durationMinutes: 60,
        startTime: examStart,
        endTime: examEnd,
        registrationOpenDate: registrationOpen,
        registrationCloseDate: registrationClose,
        totalMarks: 120,
        maxQuestions: 30,
        negativeMarking: false,
        negativeMarkingWrongCount: 0,
        negativeMarkingDeduction: 0,
        proctoring: false,
        participationFee: 0,
        minClass: config.minClass,
        maxClass: config.maxClass,
        resultDeclarationDate: resultDate,
        isVisible: true,
        status: "active",
        difficultyLevel: "medium",
        totalQuestions: 30,
        mcqCount: 30,
        createdBy: "test-run-system"
      }).returning();

      createdOlympiads.push({
        id: exam.id,
        title: config.title,
        subject: config.subject,
        totalMarks: 120,
        durationMinutes: 60
      });
    }

    summary.olympiadsCreated = createdOlympiads.length;
    logs.push({ step: "Step 4", status: "success", message: "Created 5 Olympiads", count: 5 });

    // ===========================================
    // STEP 5: INSERT 30 QUESTIONS PER OLYMPIAD
    // ===========================================
    logs.push({ step: "Step 5", status: "info", message: "Inserting 30 questions per Olympiad..." });

    let totalQuestionsCreated = 0;

    for (const olympiad of createdOlympiads) {
      const templateKey = olympiad.subject as keyof typeof QUESTION_TEMPLATES;
      const questionTemplates = QUESTION_TEMPLATES[templateKey] || QUESTION_TEMPLATES["Science"];

      for (let i = 0; i < 30; i++) {
        const template = questionTemplates[i % questionTemplates.length];
        const options = template.options.map((opt, idx) => ({
          id: `opt_${idx}`,
          text: opt
        }));

        await db.insert(questions).values({
          examId: olympiad.id,
          type: "mcq",
          content: {
            question: template.question,
            options: options,
            correctOptionId: `opt_${template.correctIndex}`,
            explanation: `The correct answer is: ${template.options[template.correctIndex]}`
          },
          marks: 4,
          difficulty: ["easy", "medium", "hard"][Math.floor(Math.random() * 3)],
          displayOrder: i + 1,
          isActive: true
        });

        totalQuestionsCreated++;
      }
    }

    summary.questionsCreated = totalQuestionsCreated;
    logs.push({ step: "Step 5", status: "success", message: `Inserted ${totalQuestionsCreated} questions (30 per Olympiad)`, count: totalQuestionsCreated });

    // ===========================================
    // STEP 6: AUTO PARTICIPATION - Register all students
    // ===========================================
    logs.push({ step: "Step 6", status: "info", message: "Registering all 200 students in all 5 Olympiads..." });

    let totalRegistrations = 0;

    for (const student of createdStudents) {
      for (const olympiad of createdOlympiads) {
        await db.insert(registrations).values({
          userId: student.userId,
          examId: olympiad.id,
          registeredAt: new Date()
        });
        totalRegistrations++;
      }
    }

    summary.registrationsCreated = totalRegistrations;
    logs.push({ step: "Step 6", status: "success", message: `Registered all students in all Olympiads (${totalRegistrations} registrations)`, count: totalRegistrations });

    // ===========================================
    // STEP 7: EXAM SIMULATION
    // ===========================================
    logs.push({ step: "Step 7", status: "info", message: "Simulating exam attempts for all students..." });

    const attemptData: { attemptId: number; studentId: number; examId: number; score: number; percentage: number; timeTaken: number; correct: number; wrong: number; unattempted: number }[] = [];

    for (const olympiad of createdOlympiads) {
      // Get questions for this olympiad
      const olympiadQuestions = await db.select()
        .from(questions)
        .where(eq(questions.examId, olympiad.id));

      for (const student of createdStudents) {
        const { correct, wrong, unattempted } = generateScoreDistribution(30);
        const score = correct * 4 - Math.floor(wrong / 3); // 4 marks per correct, -1 for every 3 wrong
        const finalScore = Math.max(0, score);
        const percentage = (finalScore / olympiad.totalMarks) * 100;
        const timeTaken = generateTimeTaken(olympiad.durationMinutes);

        // Create attempt
        const [attempt] = await db.insert(attempts).values({
          userId: student.userId,
          examId: olympiad.id,
          startTime: examStart,
          endTime: new Date(examStart.getTime() + timeTaken * 1000),
          score: finalScore,
          status: "completed"
        }).returning();

        // Create answers
        let answeredCorrect = 0;
        let answeredWrong = 0;

        for (const question of olympiadQuestions) {
          const content = question.content as { correctOptionId: string; options: { id: string }[] };
          let selectedOption: string | null = null;
          let isCorrect = false;

          if (answeredCorrect < correct) {
            // Answer correctly
            selectedOption = content.correctOptionId;
            isCorrect = true;
            answeredCorrect++;
          } else if (answeredWrong < wrong) {
            // Answer incorrectly
            const wrongOptions = content.options.filter(o => o.id !== content.correctOptionId);
            selectedOption = wrongOptions[Math.floor(Math.random() * wrongOptions.length)]?.id || null;
            isCorrect = false;
            answeredWrong++;
          }
          // else leave unattempted (selectedOption = null)

          await db.insert(answers).values({
            attemptId: attempt.id,
            questionId: question.id,
            selectedOption: selectedOption,
            isCorrect: selectedOption ? isCorrect : null
          });
        }

        attemptData.push({
          attemptId: attempt.id,
          studentId: student.id,
          examId: olympiad.id,
          score: finalScore,
          percentage: percentage,
          timeTaken: timeTaken,
          correct: correct,
          wrong: wrong,
          unattempted: unattempted
        });
      }
    }

    summary.attemptsSimulated = attemptData.length;
    logs.push({ step: "Step 7", status: "success", message: `Simulated ${attemptData.length} exam attempts`, count: attemptData.length });

    // ===========================================
    // STEP 8: RESULT & MEDAL GENERATION
    // ===========================================
    logs.push({ step: "Step 8", status: "info", message: "Calculating ranks and generating medals..." });

    let totalResults = 0;

    for (const olympiad of createdOlympiads) {
      // Get all attempts for this olympiad, sorted by score descending
      const olympiadAttempts = attemptData
        .filter(a => a.examId === olympiad.id)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.timeTaken - b.timeTaken; // Tie-breaker: less time = better rank
        });

      let currentRank = 0;
      let previousScore = -1;
      let previousTime = -1;

      for (let i = 0; i < olympiadAttempts.length; i++) {
        const attempt = olympiadAttempts[i];
        
        // Assign rank (handle ties)
        if (attempt.score !== previousScore || attempt.timeTaken !== previousTime) {
          currentRank = i + 1;
        }
        previousScore = attempt.score;
        previousTime = attempt.timeTaken;

        const medal = assignMedal(currentRank);
        const remark = getPerformanceRemark(attempt.percentage);

        await db.insert(olympiadResults).values({
          examId: olympiad.id,
          attemptId: attempt.attemptId,
          studentId: attempt.studentId,
          totalQuestions: 30,
          attemptedQuestions: attempt.correct + attempt.wrong,
          unattemptedQuestions: attempt.unattempted,
          correctAnswers: attempt.correct,
          wrongAnswers: attempt.wrong,
          totalMaxMarks: olympiad.totalMarks,
          marksFromCorrect: attempt.correct * 4,
          negativeMarks: 0,
          finalObtainedMarks: attempt.score,
          percentage: attempt.percentage,
          overallRank: currentRank,
          timeTakenSeconds: attempt.timeTaken,
          performanceRemark: remark
        });

        totalResults++;
      }
    }

    summary.resultsGenerated = totalResults;
    logs.push({ step: "Step 8", status: "success", message: `Generated ${totalResults} results with medals`, count: totalResults });

    logs.push({ step: "Complete", status: "success", message: "Test-run completed successfully!" });

    return {
      success: true,
      logs,
      demoCredentials,
      summary
    };

  } catch (error: any) {
    logs.push({ step: "Error", status: "error", message: error.message || "Unknown error occurred" });
    return {
      success: false,
      logs,
      demoCredentials,
      summary
    };
  }
}
