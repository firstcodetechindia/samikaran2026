import { db } from "../db";
import { 
  studentRegistrations, exams, questions, examRegistrations, attempts, answers,
  announcements, calendarEvents, countries
} from "@workspace/db";
import { users } from "../models/auth";
import { eq, sql } from "drizzle-orm";
import * as bcrypt from "bcrypt";

const INDIAN_FIRST_NAMES_MALE = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharv", "Advait", "Pranav", "Rudra", "Kabir", "Dhruv", "Harsh", "Rahul", "Vikram"];
const INDIAN_FIRST_NAMES_FEMALE = ["Ananya", "Aanya", "Aadhya", "Myra", "Ira", "Riya", "Saanvi", "Avni", "Aisha", "Diya", "Pari", "Priya", "Neha", "Shreya", "Sakshi", "Sneha", "Kavya", "Meera", "Nisha", "Divya"];
const LAST_NAMES = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Shah", "Reddy", "Nair", "Iyer", "Mehta", "Joshi", "Agarwal", "Mishra", "Pandey", "Rao", "Sinha", "Das", "Roy", "Banerjee"];

const INDIAN_CITIES = [
  { name: "Delhi", state: "Delhi" },
  { name: "Mumbai", state: "Maharashtra" },
  { name: "Pune", state: "Maharashtra" },
  { name: "Bangalore", state: "Karnataka" },
  { name: "Chennai", state: "Tamil Nadu" },
  { name: "Hyderabad", state: "Telangana" },
  { name: "Kolkata", state: "West Bengal" },
  { name: "Jaipur", state: "Rajasthan" },
  { name: "Lucknow", state: "Uttar Pradesh" },
  { name: "Chandigarh", state: "Punjab" }
];

const SCHOOL_NAMES = [
  "Delhi Public School", "Kendriya Vidyalaya", "St. Xavier's High School", "Cambridge International School",
  "Ryan International School", "DAV Public School", "Modern School", "The Heritage School", 
  "Amity International School", "Springdales School"
];

const GRADES = ["5", "6", "7", "8", "9", "10", "11", "12"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(): string {
  return `${randomNumber(7000000000, 9999999999)}`;
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const domains = ["gmail.com", "yahoo.co.in", "outlook.com"];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${randomItem(domains)}`;
}

function pastDate(daysAgo: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function futureDate(daysAhead: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d;
}

function generateReferralCode(firstName: string, id: number): string {
  return `${firstName.substring(0, 3).toUpperCase()}${id}${randomNumber(1000, 9999)}`;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function seedRealisticData() {
  console.log("Starting realistic production data seeding...");
  
  // Check if realistic data already exists - skip to prevent duplicates
  const existingExams = await db.select({ id: exams.id }).from(exams).limit(1);
  if (existingExams.length > 0) {
    console.log("Realistic data already exists (exams found). Skipping to prevent duplicates.");
    return;
  }
  
  const hashedPassword = await hashPassword("Student@123");
  const indiaCountry = await db.select().from(countries).where(eq(countries.code, "IN")).limit(1);
  const indiaId = indiaCountry[0]?.id || 1;

  // First, clean up old demo exams to avoid duplicates - only keep 2026 olympiads
  console.log("Cleaning up old realistic demo data...");
  await db.delete(exams).where(sql`slug LIKE '%realistic-demo%' OR slug LIKE '%2024%' OR slug LIKE '%2025%'`);

  // ========== SEED 20 REALISTIC STUDENTS ==========
  console.log("Seeding 20 realistic students...");
  const studentIds: number[] = [];
  
  for (let i = 0; i < 20; i++) {
    const isMale = i % 2 === 0;
    const firstName = isMale ? INDIAN_FIRST_NAMES_MALE[i % 20] : INDIAN_FIRST_NAMES_FEMALE[i % 20];
    const lastName = LAST_NAMES[i % 20];
    const grade = GRADES[i % 8];
    const city = INDIAN_CITIES[i % 10];
    const email = generateEmail(firstName, lastName, 8000 + i);
    
    const existing = await db.select({ id: studentRegistrations.id })
      .from(studentRegistrations)
      .where(eq(studentRegistrations.email, email))
      .limit(1);
    
    if (existing.length > 0) {
      studentIds.push(existing[0].id);
      continue;
    }
    
    const result = await db.insert(studentRegistrations).values({
      email,
      firstName,
      lastName,
      dateOfBirth: `20${10 - parseInt(grade)}-${String(randomNumber(1, 12)).padStart(2, '0')}-${String(randomNumber(1, 28)).padStart(2, '0')}`,
      gender: isMale ? "male" : "female",
      countryCode: "+91",
      phone: generatePhone(),
      registrationType: "individual",
      countryId: indiaId,
      addressLine1: `${randomNumber(1, 500)} ${city.name} Main Road`,
      pincode: String(randomNumber(100000, 999999)),
      schoolName: SCHOOL_NAMES[i % 10],
      schoolCity: city.name,
      schoolLocation: city.state,
      gradeLevel: grade,
      password: hashedPassword,
      profileStatus: "complete",
      primaryContactType: "email",
      emailVerified: true,
      phoneVerified: true,
      termsAccepted: true,
      emailConsent: true,
      promotionalConsent: true,
      verified: true,
      profileCompletedAt: pastDate(randomNumber(30, 90)),
      myReferralCode: generateReferralCode(firstName, 8000 + i)
    }).returning({ id: studentRegistrations.id });
    
    if (result[0]) studentIds.push(result[0].id);
  }
  console.log(`Created/found ${studentIds.length} students`);

  // ========== SEED 6 OLYMPIADS (ALL 2026) ==========
  console.log("Seeding 6 olympiads for 2026...");
  
  const olympiadData = [
    // 6 UPCOMING OLYMPIADS (2026)
    {
      title: "Spring Mathematics Olympiad 2026",
      slug: "spring-mathematics-2026",
      description: "Challenge yourself with advanced problem-solving, algebra, geometry, and number theory in the Spring Mathematics Olympiad 2026.",
      subject: "Mathematics",
      durationMinutes: 90,
      startTime: futureDate(30),
      endTime: futureDate(37),
      registrationOpenDate: pastDate(10),
      registrationCloseDate: futureDate(25),
      totalMarks: 100,
      maxQuestions: 40,
      negativeMarking: true,
      negativeMarkingWrongCount: 3,
      negativeMarkingDeduction: 1,
      proctoring: true,
      warningLanguages: ["en", "hi"],
      participationFee: 19900,
      minClass: 6,
      maxClass: 12,
      isVisible: true,
      status: "published" as const,
      difficultyLevel: "hard" as const,
      totalQuestions: 40,
      mcqCount: 35,
      trueFalseCount: 5,
      shuffleQuestionOrder: true,
      shuffleOptionOrder: true,
      createdBy: "admin-seed"
    },
    {
      title: "International Science Challenge 2026",
      slug: "international-science-2026",
      description: "Explore Physics, Chemistry, and Biology in the International Science Challenge 2026. Compete with students worldwide!",
      subject: "Science",
      durationMinutes: 75,
      startTime: futureDate(45),
      endTime: futureDate(52),
      registrationOpenDate: pastDate(5),
      registrationCloseDate: futureDate(40),
      totalMarks: 80,
      maxQuestions: 35,
      negativeMarking: true,
      negativeMarkingWrongCount: 4,
      negativeMarkingDeduction: 1,
      proctoring: true,
      warningLanguages: ["en", "hi"],
      participationFee: 24900,
      minClass: 5,
      maxClass: 12,
      isVisible: true,
      status: "published" as const,
      difficultyLevel: "medium" as const,
      totalQuestions: 35,
      mcqCount: 30,
      trueFalseCount: 5,
      shuffleQuestionOrder: true,
      shuffleOptionOrder: true,
      createdBy: "admin-seed"
    },
    {
      title: "English Excellence Olympiad 2026",
      slug: "english-excellence-2026",
      description: "Test your grammar, vocabulary, reading comprehension and writing skills in the English Excellence Olympiad 2026.",
      subject: "English",
      durationMinutes: 60,
      startTime: futureDate(60),
      endTime: futureDate(67),
      registrationOpenDate: futureDate(5),
      registrationCloseDate: futureDate(55),
      totalMarks: 60,
      maxQuestions: 30,
      negativeMarking: false,
      negativeMarkingWrongCount: 3,
      negativeMarkingDeduction: 1,
      proctoring: true,
      warningLanguages: ["en"],
      participationFee: 14900,
      minClass: 3,
      maxClass: 10,
      isVisible: true,
      status: "published" as const,
      difficultyLevel: "easy" as const,
      totalQuestions: 30,
      mcqCount: 25,
      trueFalseCount: 5,
      shuffleQuestionOrder: true,
      shuffleOptionOrder: true,
      createdBy: "admin-seed"
    },
    {
      title: "Samikaran Reasoning Challenge 2026",
      slug: "reasoning-challenge-2026",
      description: "Test your logical thinking, pattern recognition, and analytical skills in the Samikaran Reasoning Challenge 2026.",
      subject: "Reasoning",
      durationMinutes: 60,
      startTime: futureDate(75),
      endTime: futureDate(82),
      registrationOpenDate: futureDate(10),
      registrationCloseDate: futureDate(70),
      totalMarks: 80,
      maxQuestions: 40,
      negativeMarking: true,
      negativeMarkingWrongCount: 3,
      negativeMarkingDeduction: 1,
      proctoring: true,
      warningLanguages: ["en", "hi"],
      participationFee: 0,
      minClass: 4,
      maxClass: 12,
      isVisible: true,
      status: "published" as const,
      difficultyLevel: "medium" as const,
      totalQuestions: 40,
      mcqCount: 35,
      trueFalseCount: 5,
      shuffleQuestionOrder: true,
      shuffleOptionOrder: true,
      createdBy: "admin-seed"
    },
    {
      title: "Cyber Olympiad 2026",
      slug: "cyber-olympiad-2026",
      description: "Test your knowledge of computers, programming basics, and digital literacy in the Cyber Olympiad 2026.",
      subject: "Computer Science",
      durationMinutes: 45,
      startTime: futureDate(90),
      endTime: futureDate(97),
      registrationOpenDate: futureDate(20),
      registrationCloseDate: futureDate(85),
      totalMarks: 60,
      maxQuestions: 30,
      negativeMarking: false,
      negativeMarkingWrongCount: 3,
      negativeMarkingDeduction: 1,
      proctoring: true,
      warningLanguages: ["en", "hi"],
      participationFee: 19900,
      minClass: 5,
      maxClass: 12,
      isVisible: true,
      status: "published" as const,
      difficultyLevel: "medium" as const,
      totalQuestions: 30,
      mcqCount: 28,
      trueFalseCount: 2,
      shuffleQuestionOrder: true,
      shuffleOptionOrder: true,
      createdBy: "admin-seed"
    },
    {
      title: "Hindi Sahitya Olympiad 2026",
      slug: "hindi-sahitya-2026",
      description: "हिंदी साहित्य ओलंपियाड 2026! व्याकरण, साहित्य और भाषा कौशल का परीक्षण करें।",
      subject: "Hindi",
      durationMinutes: 50,
      startTime: futureDate(105),
      endTime: futureDate(112),
      registrationOpenDate: futureDate(30),
      registrationCloseDate: futureDate(100),
      totalMarks: 50,
      maxQuestions: 25,
      negativeMarking: false,
      negativeMarkingWrongCount: 3,
      negativeMarkingDeduction: 1,
      proctoring: true,
      warningLanguages: ["hi"],
      participationFee: 9900,
      minClass: 1,
      maxClass: 10,
      isVisible: true,
      status: "published" as const,
      difficultyLevel: "easy" as const,
      totalQuestions: 25,
      mcqCount: 20,
      trueFalseCount: 5,
      shuffleQuestionOrder: true,
      shuffleOptionOrder: true,
      createdBy: "admin-seed"
    },
    ];

  const createdExamIds: number[] = [];
  const pastExamIds: number[] = [];
  const ongoingExamIds: number[] = [];
  const upcomingExamIds: number[] = [];
  
  for (let i = 0; i < olympiadData.length; i++) {
    const exam = olympiadData[i];
    
    // Check if exam already exists by slug
    const existingExam = await db.select({ id: exams.id })
      .from(exams)
      .where(eq(exams.slug, exam.slug))
      .limit(1);
    
    let examId: number;
    if (existingExam.length > 0) {
      examId = existingExam[0].id;
    } else {
      const result = await db.insert(exams).values(exam).returning({ id: exams.id });
      if (!result[0]) continue;
      examId = result[0].id;
    }
    
    createdExamIds.push(examId);
    if (i < 3) pastExamIds.push(examId);
    else if (i < 6) ongoingExamIds.push(examId);
    else upcomingExamIds.push(examId);
  }
  console.log(`Created ${createdExamIds.length} olympiads`);

  // ========== SEED QUESTIONS FOR ALL EXAMS ==========
  console.log("Seeding questions for all exams...");
  
  const questionBanks = {
    Mathematics: [
      { q: "If 3x + 7 = 22, what is x?", opts: ["5", "4", "6", "3"], correct: "5" },
      { q: "What is the area of a circle with radius 7 cm? (π = 22/7)", opts: ["154 sq cm", "144 sq cm", "156 sq cm", "148 sq cm"], correct: "154 sq cm" },
      { q: "Find the HCF of 24 and 36.", opts: ["12", "6", "8", "4"], correct: "12" },
      { q: "What is 15% of 240?", opts: ["36", "32", "38", "40"], correct: "36" },
      { q: "Solve: 2³ × 2⁴ = ?", opts: ["128", "64", "256", "32"], correct: "128" }
    ],
    Science: [
      { q: "Which organ pumps blood throughout the body?", opts: ["Heart", "Lungs", "Liver", "Kidney"], correct: "Heart" },
      { q: "What is the atomic number of Carbon?", opts: ["6", "8", "12", "14"], correct: "6" },
      { q: "Which planet has the most moons?", opts: ["Saturn", "Jupiter", "Mars", "Neptune"], correct: "Saturn" },
      { q: "What type of energy does a battery store?", opts: ["Chemical", "Kinetic", "Nuclear", "Thermal"], correct: "Chemical" },
      { q: "What is the SI unit of force?", opts: ["Newton", "Joule", "Watt", "Pascal"], correct: "Newton" }
    ],
    English: [
      { q: "Choose the correct spelling:", opts: ["Necessary", "Neccessary", "Necesary", "Neccesary"], correct: "Necessary" },
      { q: "What is the synonym of 'Abundant'?", opts: ["Plentiful", "Scarce", "Limited", "Rare"], correct: "Plentiful" },
      { q: "Identify the verb: 'The cat sleeps on the mat.'", opts: ["sleeps", "cat", "mat", "on"], correct: "sleeps" },
      { q: "Complete: 'Neither the teacher ___ the students were present.'", opts: ["nor", "or", "and", "but"], correct: "nor" },
      { q: "What is the plural of 'Child'?", opts: ["Children", "Childs", "Childes", "Childrens"], correct: "Children" }
    ],
    Reasoning: [
      { q: "Complete the series: 2, 6, 12, 20, ?", opts: ["30", "28", "32", "26"], correct: "30" },
      { q: "If APPLE is coded as BQQMF, how is MANGO coded?", opts: ["NBOHP", "NBOHO", "MBOHP", "NBNHP"], correct: "NBOHP" },
      { q: "Find the odd one out: 3, 5, 7, 9, 11", opts: ["9", "3", "5", "11"], correct: "9" },
      { q: "A is B's sister. C is B's mother. D is C's father. How is A related to D?", opts: ["Granddaughter", "Daughter", "Grandmother", "Sister"], correct: "Granddaughter" },
      { q: "If 5 workers can complete a task in 12 days, how many days will 10 workers take?", opts: ["6", "8", "10", "24"], correct: "6" }
    ],
    "Computer Science": [
      { q: "What does CPU stand for?", opts: ["Central Processing Unit", "Computer Personal Unit", "Central Program Unit", "Computer Processing Unit"], correct: "Central Processing Unit" },
      { q: "Which key is used to delete text to the right of cursor?", opts: ["Delete", "Backspace", "Enter", "Shift"], correct: "Delete" },
      { q: "What is the brain of the computer?", opts: ["CPU", "RAM", "Hard Disk", "Monitor"], correct: "CPU" },
      { q: "Which of these is an input device?", opts: ["Keyboard", "Monitor", "Printer", "Speaker"], correct: "Keyboard" },
      { q: "What does RAM stand for?", opts: ["Random Access Memory", "Read Access Memory", "Run Access Memory", "Real Access Memory"], correct: "Random Access Memory" }
    ],
    Hindi: [
      { q: "हिंदी भाषा की लिपि कौन सी है?", opts: ["देवनागरी", "रोमन", "गुरुमुखी", "फारसी"], correct: "देवनागरी" },
      { q: "'गंगा' शब्द का पर्यायवाची है:", opts: ["भागीरथी", "यमुना", "सरस्वती", "नर्मदा"], correct: "भागीरथी" },
      { q: "'पुस्तक' का बहुवचन है:", opts: ["पुस्तकें", "पुस्तकों", "पुस्तकाएं", "पुस्तक"], correct: "पुस्तकें" },
      { q: "'सूर्य' का विलोम शब्द है:", opts: ["चंद्रमा", "तारा", "आकाश", "प्रकाश"], correct: "चंद्रमा" },
      { q: "संज्ञा के कितने भेद होते हैं?", opts: ["5", "3", "4", "6"], correct: "5" }
    ],
    "General Knowledge": [
      { q: "Who is the current President of India (2025)?", opts: ["Droupadi Murmu", "Ram Nath Kovind", "Pranab Mukherjee", "A.P.J. Abdul Kalam"], correct: "Droupadi Murmu" },
      { q: "Which is the largest ocean in the world?", opts: ["Pacific Ocean", "Atlantic Ocean", "Indian Ocean", "Arctic Ocean"], correct: "Pacific Ocean" },
      { q: "What is the capital of Japan?", opts: ["Tokyo", "Beijing", "Seoul", "Bangkok"], correct: "Tokyo" },
      { q: "Who wrote 'Gitanjali'?", opts: ["Rabindranath Tagore", "Mahatma Gandhi", "Jawaharlal Nehru", "Sarojini Naidu"], correct: "Rabindranath Tagore" },
      { q: "What is the national bird of India?", opts: ["Peacock", "Sparrow", "Parrot", "Eagle"], correct: "Peacock" }
    ]
  };

  for (const examId of createdExamIds) {
    const examInfo = await db.select({ subject: exams.subject, totalQuestions: exams.totalQuestions }).from(exams).where(eq(exams.id, examId)).limit(1);
    if (!examInfo[0]) continue;
    
    const subject = examInfo[0].subject;
    const totalQs = examInfo[0].totalQuestions || 20;
    const bank = questionBanks[subject as keyof typeof questionBanks] || questionBanks.Mathematics;
    
    for (let i = 0; i < Math.min(totalQs, 20); i++) {
      const q = bank[i % bank.length];
      await db.insert(questions).values({
        examId,
        type: "mcq",
        content: {
          question: q.q,
          options: q.opts.map((opt, idx) => ({ id: `opt_${idx}`, text: opt })),
          correct: q.correct
        },
        marks: i < 10 ? 2 : 4,
        difficulty: i % 3 === 0 ? "easy" : (i % 3 === 1 ? "medium" : "hard"),
        tags: `${subject.toLowerCase()},olympiad`
      });
    }
  }

  // ========== SEED REGISTRATIONS FOR ONGOING & UPCOMING EXAMS ==========
  console.log("Seeding exam registrations...");
  
  for (let i = 0; i < Math.min(15, studentIds.length); i++) {
    const studentId = studentIds[i];
    
    for (const examId of [...ongoingExamIds, ...upcomingExamIds]) {
      if (Math.random() > 0.6) continue;
      
      const existingReg = await db.select({ id: examRegistrations.id })
        .from(examRegistrations)
        .where(sql`${examRegistrations.studentId} = ${studentId} AND ${examRegistrations.examId} = ${examId}`)
        .limit(1);
      
      if (existingReg.length > 0) continue;
      
      await db.insert(examRegistrations).values({
        studentId,
        examId,
        registeredByType: "self",
        status: "confirmed",
        paymentStatus: "paid"
      });
    }
  }

  // ========== SEED REGISTRATIONS AND ATTEMPTS FOR PAST EXAMS ==========
  console.log("Seeding registrations for past exams (completed participants)...");
  
  const pastAttempts: Array<{studentId: number, examId: number, regId: number}> = [];
  
  for (let i = 0; i < Math.min(18, studentIds.length); i++) {
    const studentId = studentIds[i];
    
    for (const examId of pastExamIds) {
      if (Math.random() > 0.5) continue;
      
      const existingReg = await db.select({ id: examRegistrations.id })
        .from(examRegistrations)
        .where(sql`${examRegistrations.studentId} = ${studentId} AND ${examRegistrations.examId} = ${examId}`)
        .limit(1);
      
      if (existingReg.length > 0) {
        pastAttempts.push({ studentId, examId, regId: existingReg[0].id });
        continue;
      }
      
      const regResult = await db.insert(examRegistrations).values({
        studentId,
        examId,
        registeredByType: "self",
        status: "confirmed",
        paymentStatus: "paid"
      }).returning({ id: examRegistrations.id });
      
      if (regResult[0]) {
        pastAttempts.push({ studentId, examId, regId: regResult[0].id });
      }
    }
  }

  // ========== SEED COMPLETED ATTEMPTS FOR PAST EXAMS ==========
  console.log("Seeding completed attempts for past exams (for result calculation)...");
  
  // First, create user entries for students who don't have them
  const studentUserMap = new Map<number, string>();
  
  for (const { studentId } of pastAttempts) {
    if (studentUserMap.has(studentId)) continue;
    
    // Get student info
    const studentInfo = await db.select({
      email: studentRegistrations.email,
      firstName: studentRegistrations.firstName,
      lastName: studentRegistrations.lastName,
      phone: studentRegistrations.phone,
      gradeLevel: studentRegistrations.gradeLevel,
      schoolName: studentRegistrations.schoolName
    }).from(studentRegistrations).where(eq(studentRegistrations.id, studentId)).limit(1);
    
    if (!studentInfo[0]) continue;
    
    const email = studentInfo[0].email;
    if (!email) continue;
    
    // Check if user already exists
    const existingUser = await db.select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      studentUserMap.set(studentId, existingUser[0].id);
      continue;
    }
    
    // Create user entry
    const userResult = await db.insert(users).values({
      email,
      firstName: studentInfo[0].firstName,
      lastName: studentInfo[0].lastName,
      phone: studentInfo[0].phone,
      userType: "student",
      grade: studentInfo[0].gradeLevel,
      schoolName: studentInfo[0].schoolName
    }).returning({ id: users.id });
    
    if (userResult[0]) {
      studentUserMap.set(studentId, userResult[0].id);
    }
  }
  
  console.log(`Created ${studentUserMap.size} user entries for students`);
  
  let attemptCount = 0;
  for (const { studentId, examId } of pastAttempts) {
    const userId = studentUserMap.get(studentId);
    if (!userId) continue;
    
    const existingAttempt = await db.select({ id: attempts.id })
      .from(attempts)
      .where(sql`${attempts.userId} = ${userId} AND ${attempts.examId} = ${examId}`)
      .limit(1);
    
    if (existingAttempt.length > 0) continue;
    
    const examInfo = await db.select({ 
      totalMarks: exams.totalMarks,
      totalQuestions: exams.totalQuestions,
      startTime: exams.startTime,
      durationMinutes: exams.durationMinutes
    }).from(exams).where(eq(exams.id, examId)).limit(1);
    
    if (!examInfo[0]) continue;
    
    const totalMarks = examInfo[0].totalMarks || 100;
    const totalQs = examInfo[0].totalQuestions || 20;
    const duration = examInfo[0].durationMinutes || 60;
    
    // Calculate score based on performance
    const correctCount = randomNumber(Math.floor(totalQs * 0.4), Math.floor(totalQs * 0.95));
    const wrongCount = randomNumber(0, totalQs - correctCount);
    
    const marksPerQ = totalMarks / totalQs;
    const earnedMarks = Math.floor(correctCount * marksPerQ);
    const negativeMarks = Math.floor(wrongCount * 0.25);
    const finalScore = Math.max(0, earnedMarks - negativeMarks);
    
    const examStartDate = new Date(examInfo[0].startTime || pastDate(45));
    const attemptStart = new Date(examStartDate.getTime() + randomNumber(0, 2) * 60 * 60 * 1000);
    const timeTaken = randomNumber(Math.floor(duration * 0.6), duration);
    const attemptEnd = new Date(attemptStart.getTime() + timeTaken * 60 * 1000);
    
    // Get question IDs for this exam
    const examQuestions = await db.select({ id: questions.id })
      .from(questions)
      .where(eq(questions.examId, examId))
      .limit(totalQs);
    
    const questionIds = examQuestions.map(q => q.id);
    
    // Insert attempt with schema-compliant fields
    const attemptResult = await db.insert(attempts).values({
      userId,
      examId,
      status: "completed",
      startTime: attemptStart,
      endTime: attemptEnd,
      score: finalScore,
      assignedQuestionIds: questionIds
    }).returning({ id: attempts.id });
    
    if (attemptResult[0] && examQuestions.length > 0) {
      // Insert individual answers into the answers table
      for (let qi = 0; qi < examQuestions.length; qi++) {
        const q = examQuestions[qi];
        const isCorrect = qi < correctCount;
        
        await db.insert(answers).values({
          attemptId: attemptResult[0].id,
          questionId: q.id,
          selectedOption: isCorrect ? "opt_0" : "opt_1",
          isCorrect
        });
      }
    }
    
    attemptCount++;
  }
  
  console.log(`Created ${attemptCount} completed attempts for past exams.`);

  // ========== SEED ANNOUNCEMENTS ==========
  console.log("Skipping announcements seeding (managed via admin panel)...");

  // ========== SEED CALENDAR EVENTS ==========
  console.log("Skipping calendar events seeding (managed via admin panel)...");

  console.log("Realistic production data seeding completed successfully!");
  console.log(`Summary: ${studentIds.length} students, ${createdExamIds.length} olympiads (3 past, 3 ongoing, 3 upcoming), registrations, attempts, announcements, and calendar events created.`);
}
