import { db } from "../db";
import { 
  superAdmins, studentRegistrations, supervisorRegistrations, schoolCollaborations, coordinators,
  partners, partnerApplications, partnerEarnings, partnerPayouts, partnerAgreements,
  olympiadCategories, exams, questions, payments, examRegistrations, attempts, certificates,
  emailTemplates, emailCampaigns,
  blogCategories, blogTags, blogPosts, blogPostTags,
  cmsPages,
  enquiries, chatbotAgents, chatbotKnowledgeBase, chatbotLeads, announcements, calendarEvents,
  countries, users
} from "@workspace/db";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";

const INDIAN_FIRST_NAMES_MALE = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Muhammad", "Sai", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharv", "Advait", "Pranav", "Rudra", "Kabir", "Dhruv", "Harsh", "Mohammed", "Ali", "Ahmed", "Rahul", "Vikram", "Rohan", "Amit", "Suresh", "Rajesh", "Manish", "Deepak", "Akash", "Nikhil", "Gaurav", "Sandeep", "Varun"];
const INDIAN_FIRST_NAMES_FEMALE = ["Ananya", "Aanya", "Aadhya", "Myra", "Ira", "Riya", "Saanvi", "Avni", "Aisha", "Diya", "Pari", "Priya", "Neha", "Pooja", "Shreya", "Sakshi", "Fatima", "Zara", "Sneha", "Kavya", "Meera", "Nisha", "Sanya", "Tanvi", "Divya", "Anjali", "Ritika", "Simran", "Preeti", "Komal"];
const LAST_NAMES = ["Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Shah", "Reddy", "Nair", "Iyer", "Mehta", "Joshi", "Agarwal", "Mishra", "Pandey", "Rao", "Sinha", "Das", "Roy", "Banerjee", "Chatterjee", "Mukherjee", "Sen", "Khan", "Ahmed", "Sheikh", "Ansari", "Dubey", "Tiwari", "Saxena", "Kapoor", "Malhotra", "Chopra", "Khanna", "Bhatia"];

const INDIAN_CITIES = [
  { name: "Delhi", state: "Delhi" },
  { name: "Mumbai", state: "Maharashtra" },
  { name: "Pune", state: "Maharashtra" },
  { name: "Bangalore", state: "Karnataka" },
  { name: "Chennai", state: "Tamil Nadu" },
  { name: "Hyderabad", state: "Telangana" },
  { name: "Kolkata", state: "West Bengal" },
  { name: "Jaipur", state: "Rajasthan" },
  { name: "Indore", state: "Madhya Pradesh" },
  { name: "Patna", state: "Bihar" },
  { name: "Ranchi", state: "Jharkhand" },
  { name: "Kochi", state: "Kerala" },
  { name: "Trivandrum", state: "Kerala" },
  { name: "Guwahati", state: "Assam" },
  { name: "Lucknow", state: "Uttar Pradesh" },
  { name: "Chandigarh", state: "Punjab" },
  { name: "Ahmedabad", state: "Gujarat" },
  { name: "Bhopal", state: "Madhya Pradesh" },
  { name: "Nagpur", state: "Maharashtra" },
  { name: "Coimbatore", state: "Tamil Nadu" }
];

const SCHOOL_NAMES = [
  "Delhi Public School", "Kendriya Vidyalaya", "St. Xavier's High School", "Cambridge International School",
  "Ryan International School", "Bharatiya Vidya Bhavan", "DAV Public School", "Modern School",
  "The Heritage School", "Amity International School", "Springdales School", "Mount Carmel School",
  "La Martiniere College", "Don Bosco School", "Army Public School", "Jawahar Navodaya Vidyalaya",
  "Sarvodaya Vidyalaya", "DPS International", "The Shri Ram School", "Sanskriti School",
  "Pathways World School", "Step by Step School", "Mother's International School", "Bal Bharati Public School",
  "Father Agnel School", "St. Mary's School", "Holy Child School", "Loreto Convent", "Carmel Convent", "Sacred Heart School"
];

const BOARDS = ["CBSE", "ICSE", "State Board", "IB", "Cambridge"];
const GRADES = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePhone(): string {
  return `+91${randomNumber(7000000000, 9999999999)}`;
}

function generateEmail(firstName: string, lastName: string, index: number): string {
  const domains = ["gmail.com", "yahoo.co.in", "outlook.com", "rediffmail.com"];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${randomItem(domains)}`;
}

function generateRazorpayId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "pay_";
  for (let i = 0; i < 14; i++) id += chars[randomNumber(0, chars.length - 1)];
  return id;
}

function generateInvoiceNumber(index: number): string {
  return `INV-2024-${String(1000 + index).padStart(6, '0')}`;
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

function getAgeFromGrade(grade: string): number {
  const gradeNum = parseInt(grade.replace("Grade ", ""));
  return gradeNum + 5 + randomNumber(0, 1);
}

function getDobFromAge(age: number): string {
  const year = new Date().getFullYear() - age;
  const month = String(randomNumber(1, 12)).padStart(2, '0');
  const day = String(randomNumber(1, 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function seedProductionData() {
  console.log("Starting comprehensive production data seeding...");
  
  // Check if olympiad exams already exist - if so, skip all seeding to prevent duplicates
  const existingExams = await db.select({ id: exams.id }).from(exams).limit(1);
  
  if (existingExams.length > 0) {
    console.log("Production data already seeded (exams exist). Skipping to prevent duplicates.");
    return;
  }

  const hashedPassword = await hashPassword("Olympiad@2024");
  const indiaCountry = await db.select().from(countries).where(eq(countries.code, "IN")).limit(1);
  const indiaId = indiaCountry[0]?.id || 1;

  console.log("Seeding Super Admins...");
  const adminData = [
    { email: "admin@samikaranolympiad.com", firstName: "Vikram", lastName: "Sharma", role: "super_admin" },
    { email: "operations@samikaranolympiad.com", firstName: "Priya", lastName: "Mehta", role: "super_admin" },
    { email: "tech@samikaranolympiad.com", firstName: "Rahul", lastName: "Gupta", role: "admin" },
    { email: "support@samikaranolympiad.com", firstName: "Anjali", lastName: "Singh", role: "admin" }
  ];
  
  for (const admin of adminData) {
    await db.insert(superAdmins).values({
      email: admin.email,
      password: hashedPassword,
      firstName: admin.firstName,
      lastName: admin.lastName,
      role: admin.role,
      isActive: true,
      lastLoginAt: pastDate(randomNumber(1, 30))
    }).onConflictDoNothing();
  }

  console.log("Seeding Olympiad Categories...");
  const categoryData = [
    { name: "Mathematics Olympiad", slug: "mathematics", description: "International Mathematics Olympiad for analytical and problem-solving skills" },
    { name: "Science Olympiad", slug: "science", description: "National Science Olympiad covering Physics, Chemistry, and Biology" },
    { name: "English Olympiad", slug: "english", description: "International English Olympiad for language and comprehension skills" },
    { name: "Computer Science Olympiad", slug: "computer-science", description: "National Cyber Olympiad for programming and digital literacy" },
    { name: "Reasoning & Aptitude", slug: "reasoning", description: "Logical reasoning and mental aptitude assessment" },
    { name: "General Knowledge", slug: "general-knowledge", description: "Current affairs and general awareness olympiad" },
    { name: "Hindi Olympiad", slug: "hindi", description: "Hindi language proficiency and literature olympiad" },
    { name: "Social Studies Olympiad", slug: "social-studies", description: "History, Geography, and Civics olympiad" }
  ];
  
  const createdCategories: number[] = [];
  for (const cat of categoryData) {
    const result = await db.insert(olympiadCategories).values({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      language: "en",
      isActive: true,
      displayOrder: createdCategories.length
    }).onConflictDoNothing().returning({ id: olympiadCategories.id });
    if (result[0]) createdCategories.push(result[0].id);
  }
  const existingCats = await db.select({ id: olympiadCategories.id }).from(olympiadCategories);
  const categoryIds = existingCats.map(c => c.id);

  console.log("Seeding School Collaborations...");
  const schoolIds: number[] = [];
  for (let i = 0; i < 30; i++) {
    const city = randomItem(INDIAN_CITIES);
    const schoolName = `${SCHOOL_NAMES[i % SCHOOL_NAMES.length]}, ${city.name}`;
    const email = `admin${i + 1}@${schoolName.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu.in`;
    
    const result = await db.insert(schoolCollaborations).values({
      email,
      password: hashedPassword,
      teacherFirstName: randomItem([...INDIAN_FIRST_NAMES_MALE, ...INDIAN_FIRST_NAMES_FEMALE]),
      teacherLastName: randomItem(LAST_NAMES),
      teacherEmail: `coordinator${i}@school.edu.in`,
      country: "India",
      schoolName,
      schoolCity: city.name,
      schoolAddress: `${randomNumber(1, 500)} ${city.name} Main Road, ${city.state}`,
      expectedStudents: String(randomNumber(50, 500)),
      categoryRange: "1-12",
      profileStatus: "complete",
      termsAccepted: true,
      verified: true,
      profileCompletedAt: pastDate(randomNumber(30, 180))
    }).onConflictDoNothing().returning({ id: schoolCollaborations.id });
    
    if (result[0]) schoolIds.push(result[0].id);
  }

  console.log("Seeding Coordinators/Teachers...");
  for (let i = 0; i < 35; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = randomItem(isMale ? INDIAN_FIRST_NAMES_MALE : INDIAN_FIRST_NAMES_FEMALE);
    const lastName = randomItem(LAST_NAMES);
    const city = randomItem(INDIAN_CITIES);
    const subjects = ["Mathematics", "Science", "English", "Computer Science", "Social Studies"];
    
    await db.insert(coordinators).values({
      schoolId: schoolIds.length > 0 ? randomItem(schoolIds) : null,
      type: randomItem(["teacher", "coordinator", "hod"]),
      name: `${firstName} ${lastName}`,
      email: generateEmail(firstName, lastName, 1000 + i),
      phone: generatePhone(),
      password: hashedPassword,
      department: randomItem(subjects),
      assignedGrades: `${randomNumber(1, 6)}-${randomNumber(7, 12)}`,
      organizationName: randomItem(SCHOOL_NAMES),
      city: city.name,
      state: city.state,
      country: "India",
      verified: true
    }).onConflictDoNothing();
  }

  console.log("Seeding Partners...");
  const partnerIds: number[] = [];
  const partnerTypes = ["commission", "school_institute", "regional", "commission"];
  
  await db.insert(partnerAgreements).values({
    version: "1.0",
    title: "Samikaran Olympiad Partner Agreement",
    content: "This Partner Agreement outlines the terms and conditions for partnership with Samikaran Olympiad...",
    isActive: true
  }).onConflictDoNothing();

  for (let i = 0; i < 15; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = randomItem(isMale ? INDIAN_FIRST_NAMES_MALE : INDIAN_FIRST_NAMES_FEMALE);
    const lastName = randomItem(LAST_NAMES);
    const city = randomItem(INDIAN_CITIES);
    const partnerType = randomItem(partnerTypes);
    
    const appResult = await db.insert(partnerApplications).values({
      fullName: `${firstName} ${lastName}`,
      email: generateEmail(firstName, lastName, 2000 + i),
      phone: generatePhone(),
      countryCode: "+91",
      countryId: indiaId,
      organizationName: Math.random() > 0.5 ? `${lastName} Education Services` : null,
      organizationType: randomItem(["individual", "school", "institute", "company"]),
      partnershipType: partnerType,
      expectedStudentsPerMonth: String(randomNumber(20, 200)),
      targetGeography: `${city.name}, ${city.state}`,
      status: "approved",
      termsAccepted: true
    }).onConflictDoNothing().returning({ id: partnerApplications.id });

    if (appResult[0]) {
      const partnerResult = await db.insert(partners).values({
        applicationId: appResult[0].id,
        fullName: `${firstName} ${lastName}`,
        email: generateEmail(firstName, lastName, 2000 + i),
        phone: generatePhone(),
        password: hashedPassword,
        organizationName: Math.random() > 0.5 ? `${lastName} Education Services` : null,
        organizationType: randomItem(["individual", "school", "institute"]),
        partnershipType: partnerType,
        partnerCode: `SAM${String(i + 1).padStart(4, '0')}`,
        referralLink: `https://samikaranolympiad.com/ref/SAM${String(i + 1).padStart(4, '0')}`,
        commissionRate: randomNumber(10, 25),
        status: "active",
        agreementAccepted: true,
        agreementAcceptedAt: pastDate(randomNumber(30, 180)),
        agreementVersion: "1.0",
        bankAccountName: `${firstName} ${lastName}`,
        bankAccountNumber: String(randomNumber(10000000000, 99999999999)),
        bankIfscCode: `HDFC00${randomNumber(10000, 99999)}`,
        bankName: randomItem(["HDFC Bank", "ICICI Bank", "SBI", "Axis Bank", "Kotak Mahindra"]),
        totalStudents: randomNumber(10, 150),
        totalEarnings: randomNumber(5000, 50000) * 100,
        pendingPayout: randomNumber(1000, 10000) * 100
      }).onConflictDoNothing().returning({ id: partners.id });
      
      if (partnerResult[0]) partnerIds.push(partnerResult[0].id);
    }
  }

  console.log("Seeding Students (200+)...");
  const studentIds: number[] = [];
  for (let i = 0; i < 220; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = randomItem(isMale ? INDIAN_FIRST_NAMES_MALE : INDIAN_FIRST_NAMES_FEMALE);
    const lastName = randomItem(LAST_NAMES);
    const grade = randomItem(GRADES);
    const age = getAgeFromGrade(grade);
    const city = randomItem(INDIAN_CITIES);
    const registrationType = randomItem(["individual", "parent", "school", "group"] as const);
    
    const result = await db.insert(studentRegistrations).values({
      email: generateEmail(firstName, lastName, i),
      firstName,
      middleName: Math.random() > 0.7 ? randomItem(LAST_NAMES) : null,
      lastName,
      dateOfBirth: getDobFromAge(age),
      gender: isMale ? "male" : "female",
      countryCode: "+91",
      phone: generatePhone(),
      registrationType,
      countryId: indiaId,
      addressLine1: `${randomNumber(1, 999)} ${city.name} Road`,
      pincode: String(randomNumber(100000, 999999)),
      schoolName: randomItem(SCHOOL_NAMES),
      schoolCity: city.name,
      gradeLevel: grade,
      password: hashedPassword,
      profileStatus: Math.random() > 0.1 ? "complete" : "pending_profile",
      primaryContactType: randomItem(["email", "phone"]),
      emailVerified: Math.random() > 0.1,
      phoneVerified: Math.random() > 0.2,
      termsAccepted: true,
      emailConsent: Math.random() > 0.3,
      promotionalConsent: Math.random() > 0.5,
      verified: Math.random() > 0.1,
      profileCompletedAt: pastDate(randomNumber(1, 180)),
      myReferralCode: `STU${String(10000 + i).padStart(6, '0')}`,
      referredByPartnerId: partnerIds.length > 0 && Math.random() > 0.6 ? randomItem(partnerIds) : null
    }).onConflictDoNothing().returning({ id: studentRegistrations.id });
    
    if (result[0]) studentIds.push(result[0].id);
  }

  console.log("Seeding Supervisors/Parents...");
  for (let i = 0; i < 40; i++) {
    const isMale = Math.random() > 0.5;
    const firstName = randomItem(isMale ? INDIAN_FIRST_NAMES_MALE : INDIAN_FIRST_NAMES_FEMALE);
    const lastName = randomItem(LAST_NAMES);
    const city = randomItem(INDIAN_CITIES);
    
    await db.insert(supervisorRegistrations).values({
      email: generateEmail(firstName, lastName, 5000 + i),
      firstName,
      lastName,
      dateOfBirth: getDobFromAge(randomNumber(30, 50)),
      gender: isMale ? "male" : "female",
      countryCode: "+91",
      phone: generatePhone(),
      schoolLocation: city.state,
      schoolCity: city.name,
      schoolName: randomItem(SCHOOL_NAMES),
      password: hashedPassword,
      profileStatus: "complete",
      primaryContactType: "email",
      emailVerified: true,
      phoneVerified: true,
      termsAccepted: true,
      verified: true,
      profileCompletedAt: pastDate(randomNumber(30, 180))
    }).onConflictDoNothing();
  }

  // SKIP Olympiad creation - handled by seed-realistic-data.ts instead
  // This prevents duplicate/garbage olympiad data
  console.log("Skipping Exams/Olympiads creation (handled by realistic data seed)...");
  const examIds: number[] = [];

  console.log("Seeding Questions...");
  const mathQuestions = [
    { q: "What is the value of 15 + 27?", opts: ["42", "41", "43", "40"], correct: "42" },
    { q: "If x + 5 = 12, what is the value of x?", opts: ["7", "6", "8", "5"], correct: "7" },
    { q: "What is 25% of 200?", opts: ["50", "40", "60", "25"], correct: "50" },
    { q: "Find the area of a rectangle with length 8cm and width 5cm.", opts: ["40 sq cm", "26 sq cm", "13 sq cm", "80 sq cm"], correct: "40 sq cm" },
    { q: "What is the next number in the sequence: 2, 6, 12, 20, ?", opts: ["30", "28", "32", "26"], correct: "30" }
  ];

  const scienceQuestions = [
    { q: "What is the chemical symbol for Gold?", opts: ["Au", "Ag", "Fe", "Cu"], correct: "Au" },
    { q: "Which planet is known as the Red Planet?", opts: ["Mars", "Venus", "Jupiter", "Saturn"], correct: "Mars" },
    { q: "What is the powerhouse of the cell?", opts: ["Mitochondria", "Nucleus", "Ribosome", "Golgi apparatus"], correct: "Mitochondria" },
    { q: "What is the boiling point of water in Celsius?", opts: ["100°C", "90°C", "110°C", "80°C"], correct: "100°C" },
    { q: "Which gas do plants absorb from the atmosphere?", opts: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"], correct: "Carbon dioxide" }
  ];

  const englishQuestions = [
    { q: "Choose the correct spelling:", opts: ["Accommodate", "Accomodate", "Acommodate", "Acomodate"], correct: "Accommodate" },
    { q: "What is the antonym of 'Generous'?", opts: ["Stingy", "Kind", "Wealthy", "Humble"], correct: "Stingy" },
    { q: "Identify the noun in: 'The quick brown fox jumps.'", opts: ["fox", "quick", "brown", "jumps"], correct: "fox" },
    { q: "What is the past tense of 'go'?", opts: ["went", "goed", "gone", "going"], correct: "went" },
    { q: "Choose the correct preposition: 'She is good ___ mathematics.'", opts: ["at", "in", "on", "for"], correct: "at" }
  ];

  for (const examId of examIds.slice(0, Math.min(10, examIds.length))) {
    const questionSet = randomItem([mathQuestions, scienceQuestions, englishQuestions]);
    for (let i = 0; i < 15; i++) {
      const q = questionSet[i % questionSet.length];
      await db.insert(questions).values({
        examId,
        type: "mcq",
        content: {
          question: q.q,
          options: q.opts.map((opt, idx) => ({ id: `opt_${idx}`, text: opt })),
          correct: q.correct
        },
        marks: 4,
        negativeMarks: 1,
        language: "en",
        difficulty: randomItem(["easy", "medium", "hard"]),
        tags: "olympiad,practice",
        displayOrder: i + 1,
        isActive: true
      });
    }
  }

  console.log("Seeding Payments and Registrations...");
  const completedExamIds = examIds.slice(0, Math.min(6, examIds.length));
  const paymentIds: number[] = [];

  for (let i = 0; i < Math.min(150, studentIds.length); i++) {
    const studentId = studentIds[i];
    const examId = randomItem(completedExamIds);
    const baseAmount = randomItem([10000, 15000, 20000, 25000]);
    const taxAmount = Math.round(baseAmount * 0.18);
    const totalAmount = baseAmount + taxAmount;
    const status = Math.random() > 0.1 ? "paid" : randomItem(["failed", "refunded"]);
    
    const paymentResult = await db.insert(payments).values({
      userId: studentId,
      userType: "student",
      examId,
      studentId,
      gateway: Math.random() > 0.3 ? "razorpay" : "stripe",
      gatewayOrderId: `order_${generateRazorpayId()}`,
      gatewayPaymentId: status === "paid" ? generateRazorpayId() : null,
      baseAmount,
      amount: totalAmount,
      currency: "INR",
      taxRate: 18,
      taxAmount,
      cgstAmount: Math.round(taxAmount / 2),
      sgstAmount: Math.round(taxAmount / 2),
      country: "IN",
      state: randomItem(INDIAN_CITIES).state,
      status,
      environment: "live",
      invoiceNumber: status === "paid" ? generateInvoiceNumber(i) : null,
      paidAt: status === "paid" ? pastDate(randomNumber(1, 120)) : null
    }).returning({ id: payments.id });

    if (paymentResult[0] && status === "paid") {
      paymentIds.push(paymentResult[0].id);
      
      await db.insert(examRegistrations).values({
        studentId,
        examId,
        registeredByType: "self",
        paymentId: paymentResult[0].id,
        status: "confirmed",
        paymentStatus: "unlocked"
      });
    }
  }

  console.log("Seeding Users for Attempts...");
  const userIds: string[] = [];
  for (let i = 0; i < Math.min(100, studentIds.length); i++) {
    const studentId = studentIds[i];
    const isMale = Math.random() > 0.5;
    const firstName = randomItem(isMale ? INDIAN_FIRST_NAMES_MALE : INDIAN_FIRST_NAMES_FEMALE);
    const lastName = randomItem(LAST_NAMES);
    const email = generateEmail(firstName, lastName, 6000 + i);
    const grade = randomItem(GRADES);
    
    const userResult = await db.insert(users).values({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      userType: "student",
      phone: generatePhone(),
      grade,
      schoolName: randomItem(SCHOOL_NAMES)
    }).onConflictDoNothing().returning({ id: users.id });
    
    if (userResult[0]) userIds.push(userResult[0].id);
  }

  console.log("Seeding Exam Attempts and Results...");
  const attemptIds: number[] = [];
  for (let i = 0; i < Math.min(100, userIds.length); i++) {
    const userId = userIds[i];
    const studentId = studentIds[i] || studentIds[0];
    const examId = randomItem(completedExamIds);
    const score = randomNumber(30, 95);
    
    const attemptResult = await db.insert(attempts).values({
      userId,
      examId,
      startTime: pastDate(randomNumber(30, 90)),
      endTime: pastDate(randomNumber(30, 90)),
      score,
      status: "completed"
    }).returning({ id: attempts.id });

    if (attemptResult[0]) {
      attemptIds.push(attemptResult[0].id);
      
      let certType = "participation";
      if (score >= 90) certType = "merit_gold";
      else if (score >= 80) certType = "merit_silver";
      else if (score >= 70) certType = "merit_bronze";
      
      await db.insert(certificates).values({
        studentId,
        attemptId: attemptResult[0].id,
        examId,
        type: certType,
        rank: certType !== "participation" ? randomNumber(1, 100) : null,
        score,
        downloadCount: randomNumber(0, 5)
      });
    }
  }

  console.log("Seeding Partner Earnings and Payouts...");
  for (const partnerId of partnerIds) {
    for (let i = 0; i < randomNumber(5, 20); i++) {
      const paymentAmount = randomItem([10000, 15000, 20000, 25000]);
      const commissionRate = randomNumber(10, 25);
      const commissionAmount = Math.round(paymentAmount * commissionRate / 100);
      
      await db.insert(partnerEarnings).values({
        partnerId,
        paymentId: paymentIds.length > 0 ? randomItem(paymentIds) : null,
        studentId: randomItem(studentIds),
        examId: randomItem(examIds),
        paymentAmount,
        commissionRate,
        commissionAmount,
        status: randomItem(["pending", "confirmed", "paid"])
      });
    }

    if (Math.random() > 0.5) {
      await db.insert(partnerPayouts).values({
        partnerId,
        amount: randomNumber(5000, 30000) * 100,
        currency: "INR",
        status: randomItem(["pending", "approved", "paid"]),
        payoutMethod: randomItem(["bank_transfer", "upi"]),
        transactionId: Math.random() > 0.5 ? `TXN${randomNumber(100000, 999999)}` : null
      });
    }
  }

  console.log("Seeding Blog Categories and Posts...");
  const blogCatData = [
    { name: "Olympiad Tips", slug: "olympiad-tips", description: "Tips and strategies for olympiad preparation" },
    { name: "Success Stories", slug: "success-stories", description: "Inspiring stories of olympiad achievers" },
    { name: "Subject Guides", slug: "subject-guides", description: "In-depth subject-wise preparation guides" },
    { name: "Parent Resources", slug: "parent-resources", description: "Resources and guides for parents" },
    { name: "News & Updates", slug: "news-updates", description: "Latest olympiad news and announcements" }
  ];

  const blogCatIds: number[] = [];
  for (const cat of blogCatData) {
    const result = await db.insert(blogCategories).values({
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      isActive: true
    }).onConflictDoNothing().returning({ id: blogCategories.id });
    if (result[0]) blogCatIds.push(result[0].id);
  }

  const blogTagData = ["olympiad", "mathematics", "science", "preparation", "tips", "success", "students", "parents", "exams", "study-techniques"];
  const tagIds: number[] = [];
  for (const tag of blogTagData) {
    const result = await db.insert(blogTags).values({
      name: tag.charAt(0).toUpperCase() + tag.slice(1),
      slug: tag
    }).onConflictDoNothing().returning({ id: blogTags.id });
    if (result[0]) tagIds.push(result[0].id);
  }

  const blogPostData = [
    { title: "10 Essential Tips to Crack Mathematics Olympiad", excerpt: "Master these proven strategies to excel in your Math Olympiad preparation." },
    { title: "How Ananya from Delhi Became a National Topper", excerpt: "An inspiring journey of dedication and smart preparation." },
    { title: "Science Olympiad 2025: Complete Preparation Guide", excerpt: "Everything you need to know about preparing for the upcoming Science Olympiad." },
    { title: "Why Olympiads Matter for Your Child's Future", excerpt: "Understanding the long-term benefits of olympiad participation." },
    { title: "Top 5 Mistakes to Avoid in Olympiad Exams", excerpt: "Learn from others' mistakes and maximize your olympiad score." },
    { title: "English Olympiad: Grammar Tips That Actually Work", excerpt: "Practical grammar strategies for English Olympiad success." },
    { title: "From Average to Exceptional: A Parent's Guide", excerpt: "How parents can support their children's olympiad journey." },
    { title: "Computer Science Olympiad: Coding Basics for Beginners", excerpt: "Start your programming journey with these fundamental concepts." }
  ];

  for (let i = 0; i < blogPostData.length; i++) {
    const post = blogPostData[i];
    const result = await db.insert(blogPosts).values({
      title: post.title,
      slug: post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-'),
      excerpt: post.excerpt,
      content: [{ type: "paragraph", content: post.excerpt + " This comprehensive guide covers all the essential aspects you need to know." }],
      plainContent: post.excerpt,
      categoryId: blogCatIds.length > 0 ? randomItem(blogCatIds) : null,
      authorName: `${randomItem(INDIAN_FIRST_NAMES_MALE)} ${randomItem(LAST_NAMES)}`,
      status: "published",
      visibility: "public",
      publishedAt: pastDate(randomNumber(1, 90)),
      metaTitle: post.title,
      metaDescription: post.excerpt,
      allowComments: true,
      isFeatured: i < 3,
      readingTimeMinutes: randomNumber(3, 10),
      viewCount: randomNumber(100, 5000)
    }).onConflictDoNothing().returning({ id: blogPosts.id });

    if (result[0] && tagIds.length > 0) {
      const selectedTags = tagIds.slice(0, randomNumber(2, 4));
      for (const tagId of selectedTags) {
        await db.insert(blogPostTags).values({
          postId: result[0].id,
          tagId
        }).onConflictDoNothing();
      }
    }
  }

  try {
    console.log("Seeding Email Templates and Campaigns...");
    const templateData = [
      { name: "Welcome Email", slug: "welcome-email", category: "system", type: "transactional", subject: "Welcome to Samikaran Olympiad!" },
      { name: "Registration Confirmation", slug: "registration-confirmation", category: "system", type: "transactional", subject: "Registration Confirmed - Samikaran Olympiad" },
      { name: "Exam Reminder", slug: "exam-reminder", category: "system", type: "transactional", subject: "Your Olympiad Exam is Tomorrow!" },
      { name: "Result Announcement", slug: "result-announcement", category: "results", type: "transactional", subject: "Your Olympiad Results Are Ready!" },
      { name: "New Olympiad Announcement", slug: "olympiad-announcement", category: "marketing", type: "marketing", subject: "New Olympiad Registration Open - Limited Seats!" },
      { name: "Early Bird Discount", slug: "early-bird-discount", category: "marketing", type: "marketing", subject: "25% Early Bird Discount - Register Now!" }
    ];

    const templateIds: number[] = [];
    for (const tpl of templateData) {
      const result = await db.insert(emailTemplates).values({
        name: tpl.name,
        slug: tpl.slug,
        category: tpl.category,
        type: tpl.type,
        subject: tpl.subject,
        htmlContent: `<html><body><h1>${tpl.subject}</h1><p>Dear {{name}},</p><p>Thank you for being part of Samikaran Olympiad.</p></body></html>`,
        variables: ["name", "email"],
        isActive: true,
        isDefault: false
      }).onConflictDoNothing().returning({ id: emailTemplates.id });
      if (result[0]) templateIds.push(result[0].id);
    }

    const campaignData = [
      { name: "Welcome Campaign - January 2025", type: "one-time", status: "sent" },
      { name: "Mathematics Olympiad Promo", type: "one-time", status: "sent" },
      { name: "Science Olympiad Early Bird", type: "scheduled", status: "sent" },
      { name: "Result Announcement Batch", type: "one-time", status: "sent" },
      { name: "New Year Discount Campaign", type: "one-time", status: "sent" }
    ];

    for (const campaign of campaignData) {
      await db.insert(emailCampaigns).values({
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        templateId: templateIds.length > 0 ? randomItem(templateIds) : null,
        subject: campaign.name,
        audienceType: "all-students",
        totalRecipients: randomNumber(500, 2000),
        sentCount: randomNumber(450, 1900),
        deliveredCount: randomNumber(400, 1800),
        openedCount: randomNumber(150, 800),
        clickedCount: randomNumber(50, 300),
        bouncedCount: randomNumber(5, 50),
        unsubscribedCount: randomNumber(1, 10),
        sentAt: pastDate(randomNumber(5, 60)),
        completedAt: pastDate(randomNumber(5, 60))
      });
    }
  } catch (emailErr) {
    console.log("Email templates seeding skipped (schema mismatch):", String(emailErr).substring(0, 100));
  }

  console.log("Seeding CMS Pages...");
  const cmsData = [
    { title: "About Us", slug: "about-us", type: "content" },
    { title: "Contact Us", slug: "contact-us", type: "contact" },
    { title: "Privacy Policy", slug: "privacy-policy", type: "policy" },
    { title: "Terms of Service", slug: "terms-of-service", type: "policy" },
    { title: "FAQ", slug: "faq", type: "faq" },
    { title: "How It Works", slug: "how-it-works", type: "content" }
  ];

  for (const page of cmsData) {
    await db.insert(cmsPages).values({
      title: page.title,
      slug: page.slug,
      pageType: page.type,
      status: "published",
      metaTitle: `${page.title} - Samikaran Olympiad`,
      metaDescription: `Learn more about ${page.title.toLowerCase()} at Samikaran Olympiad.`,
      showInFooter: true,
      footerColumn: page.type === "policy" ? "legal" : "company",
      publishedAt: pastDate(randomNumber(60, 180))
    }).onConflictDoNothing();
  }

  console.log("Seeding Enquiries and Leads...");
  for (let i = 0; i < 50; i++) {
    const firstName = randomItem([...INDIAN_FIRST_NAMES_MALE, ...INDIAN_FIRST_NAMES_FEMALE]);
    const lastName = randomItem(LAST_NAMES);
    
    await db.insert(enquiries).values({
      name: `${firstName} ${lastName}`,
      email: generateEmail(firstName, lastName, 9000 + i),
      phone: generatePhone(),
      subject: randomItem(["Registration Query", "Payment Issue", "Exam Schedule", "Partnership Inquiry", "School Collaboration"]),
      message: "I would like to know more about Samikaran Olympiad programs.",
      source: randomItem(["contact", "coming_soon", "landing_page"]),
      isProcessed: Math.random() > 0.3,
      processedAt: Math.random() > 0.3 ? pastDate(randomNumber(1, 30)) : null
    });
  }

  console.log("Seeding Chatbot Agents and Knowledge Base...");
  await db.insert(chatbotAgents).values({
    name: "Sakhi",
    gender: "female",
    tone: "friendly",
    systemPrompt: "You are Sakhi, a helpful assistant for Samikaran Olympiad. Help students and parents with registration, exam information, and general queries.",
    confidenceThreshold: 75,
    languages: ["en", "hi"],
    isActive: true
  }).onConflictDoNothing();

  await db.insert(chatbotAgents).values({
    name: "Arjun",
    gender: "male",
    tone: "professional",
    systemPrompt: "You are Arjun, a professional support agent for Samikaran Olympiad. Assist with technical queries, payment issues, and partner inquiries.",
    confidenceThreshold: 80,
    languages: ["en"],
    isActive: true
  }).onConflictDoNothing();

  const kbData = [
    { title: "Registration Process", content: "Students can register for Samikaran Olympiad through our website. Visit the registration page, fill in your details, select your grade and subjects, and complete the payment.", category: "registration" },
    { title: "Exam Schedule", content: "Olympiad exams are conducted in three levels: Level 1 (January-March), Level 2 (April-May), and Finals (June). You can choose your preferred date within the exam window.", category: "exams" },
    { title: "Fee Structure", content: "Registration fees start from Rs. 100 per subject. Combo packages and early bird discounts are available. GST is applicable.", category: "fees" },
    { title: "Result Declaration", content: "Results are typically declared within 15 days of exam completion. You can check your results and download certificates from your student dashboard.", category: "results" },
    { title: "Refund Policy", content: "Full refund is available if cancelled before exam window. No refund for no-shows or after exam attempt.", category: "policies" }
  ];

  for (const kb of kbData) {
    await db.insert(chatbotKnowledgeBase).values({
      title: kb.title,
      content: kb.content,
      sourceType: "manual",
      language: "en",
      category: kb.category,
      confidenceWeight: 100,
      isActive: true
    });
  }

  console.log("Seeding Announcements...");
  const announcementData = [
    { title: "Mathematics Olympiad 2025 Registration Open", content: "Register now for the upcoming Mathematics Olympiad. Early bird discount available!", type: "exam", important: true },
    { title: "Science Olympiad Results Declared", content: "Check your results in the student dashboard. Congratulations to all participants!", type: "exam", important: true },
    { title: "New Practice Tests Available", content: "Free practice tests for all subjects are now available. Start practicing today!", type: "general", important: false },
    { title: "Holiday Notice", content: "Our support will be unavailable on January 26 (Republic Day). Emergency support via email.", type: "deadline", important: false }
  ];

  for (const ann of announcementData) {
    await db.insert(announcements).values({
      title: ann.title,
      content: ann.content,
      type: ann.type,
      important: ann.important,
      targetAudience: "all",
      startDate: pastDate(randomNumber(1, 30)),
      endDate: futureDate(randomNumber(15, 60))
    });
  }

  console.log("Seeding Calendar Events...");
  const eventData = [
    { title: "Mathematics Olympiad Level 1", type: "exam", date: futureDate(45) },
    { title: "Science Olympiad Level 1", type: "exam", date: futureDate(52) },
    { title: "Registration Deadline - Math Olympiad", type: "deadline", date: futureDate(30) },
    { title: "Result Declaration - Winter Olympiad", type: "result", date: futureDate(20) },
    { title: "Republic Day Holiday", type: "holiday", date: new Date("2025-01-26") },
    { title: "Parent Orientation Webinar", type: "webinar", date: futureDate(15) }
  ];

  for (const evt of eventData) {
    await db.insert(calendarEvents).values({
      title: evt.title,
      eventType: evt.type,
      eventDate: evt.date,
      targetAudience: "all"
    });
  }

  console.log("Seeding Chatbot Leads...");
  for (let i = 0; i < 30; i++) {
    const firstName = randomItem([...INDIAN_FIRST_NAMES_MALE, ...INDIAN_FIRST_NAMES_FEMALE]);
    const lastName = randomItem(LAST_NAMES);
    
    await db.insert(chatbotLeads).values({
      name: `${firstName} ${lastName}`,
      phone: generatePhone(),
      email: generateEmail(firstName, lastName, 7000 + i),
      reason: randomItem(["inquiry", "support_request", "registration_help", "escalation"]),
      status: randomItem(["new", "contacted", "qualified", "converted"]),
      notes: "Lead generated from chatbot conversation."
    });
  }

  console.log("Production data seeding completed successfully!");
  console.log(`
Summary:
- Super Admins: 4
- Schools: ~30
- Coordinators/Teachers: 35
- Partners: 15
- Students: 220+
- Supervisors/Parents: 40
- Olympiad Categories: 8
- Exams: ${examIds.length}
- Payments: ${paymentIds.length}
- Attempts: ${attemptIds.length}
- Blog Posts: ${blogPostData.length}
- Email Templates: ${templateIds.length}
- Email Campaigns: ${campaignData.length}
  `);
}
