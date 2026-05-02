import { db } from "./db";
import { exams, questions, examRegistrations, attempts, answers, attemptQuestions, studentRegistrations } from "@shared/schema";
import { eq, and, like, or, ilike, sql } from "drizzle-orm";

const DEMO_EXAM_PREFIX = "DEMO_GK_";
const DEMO_EXAM_SLUG = "demo-gk-olympiad-2026";

async function findDemoExam() {
  const found = await db.select().from(exams).where(eq(exams.slug, DEMO_EXAM_SLUG));
  if (found.length > 0) return found[0];
  const byTitle = await db.select().from(exams).where(like(exams.title, `${DEMO_EXAM_PREFIX}%`));
  return byTitle.length > 0 ? byTitle[0] : null;
}

const mcqQuestions = [
  {
    question: "Which planet is known as the 'Red Planet'?",
    options: [
      { id: "a", text: "Venus" },
      { id: "b", text: "Mars" },
      { id: "c", text: "Jupiter" },
      { id: "d", text: "Saturn" }
    ],
    correctOptionId: "b",
    explanation: "Mars is called the Red Planet because of its reddish appearance due to iron oxide (rust) on its surface.",
    language: "en",
  },
  {
    question: "Which gas do plants absorb from the atmosphere during photosynthesis?",
    options: [
      { id: "a", text: "Oxygen" },
      { id: "b", text: "Nitrogen" },
      { id: "c", text: "Carbon Dioxide" },
      { id: "d", text: "Hydrogen" }
    ],
    correctOptionId: "c",
    explanation: "Plants absorb carbon dioxide (CO₂) from the atmosphere and use it along with sunlight and water to produce glucose and oxygen.",
    language: "en",
  },
  {
    question: "Who wrote the Indian national anthem 'Jana Gana Mana'?",
    options: [
      { id: "a", text: "Bankim Chandra Chattopadhyay" },
      { id: "b", text: "Rabindranath Tagore" },
      { id: "c", text: "Sarojini Naidu" },
      { id: "d", text: "Mahatma Gandhi" }
    ],
    correctOptionId: "b",
    explanation: "Rabindranath Tagore composed 'Jana Gana Mana', which was adopted as India's national anthem on January 24, 1950.",
    language: "en",
  },
  {
    question: "How many continents are there on Earth?",
    options: [
      { id: "a", text: "5" },
      { id: "b", text: "6" },
      { id: "c", text: "7" },
      { id: "d", text: "8" }
    ],
    correctOptionId: "c",
    explanation: "There are 7 continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia/Oceania.",
    language: "en",
  },
  {
    question: "What is the chemical symbol for Gold?",
    options: [
      { id: "a", text: "Go" },
      { id: "b", text: "Gd" },
      { id: "c", text: "Au" },
      { id: "d", text: "Ag" }
    ],
    correctOptionId: "c",
    explanation: "The chemical symbol for Gold is Au, derived from the Latin word 'Aurum'.",
    language: "en",
  },
  {
    question: "Which vitamin is produced when human skin is exposed to sunlight?",
    options: [
      { id: "a", text: "Vitamin A" },
      { id: "b", text: "Vitamin B12" },
      { id: "c", text: "Vitamin C" },
      { id: "d", text: "Vitamin D" }
    ],
    correctOptionId: "d",
    explanation: "Vitamin D is synthesized in the skin upon exposure to ultraviolet B (UVB) rays from sunlight.",
    language: "en",
  },
  {
    question: "What is the longest river in India?",
    options: [
      { id: "a", text: "Yamuna" },
      { id: "b", text: "Godavari" },
      { id: "c", text: "Ganga" },
      { id: "d", text: "Brahmaputra" }
    ],
    correctOptionId: "c",
    explanation: "The Ganga (Ganges) is the longest river in India, flowing approximately 2,525 km through the northern plains.",
    language: "en",
  },
  {
    question: "What is the national flower of India?",
    options: [
      { id: "a", text: "Rose" },
      { id: "b", text: "Lotus" },
      { id: "c", text: "Sunflower" },
      { id: "d", text: "Jasmine" }
    ],
    correctOptionId: "b",
    explanation: "The Lotus (Nelumbo nucifera) is the national flower of India, symbolizing purity, beauty, and spiritual awakening.",
    language: "en",
  },
  {
    question: "भारत की राजधानी क्या है?",
    options: [
      { id: "a", text: "मुम्बई" },
      { id: "b", text: "कोलकाता" },
      { id: "c", text: "नई दिल्ली" },
      { id: "d", text: "चेन्नई" }
    ],
    correctOptionId: "c",
    explanation: "नई दिल्ली भारत की राजधानी है। यह 1911 में कलकत्ता (अब कोलकाता) की जगह राजधानी बनी।",
    language: "hi",
  },
  {
    question: "सूर्य किस दिशा में उगता है?",
    options: [
      { id: "a", text: "पश्चिम" },
      { id: "b", text: "उत्तर" },
      { id: "c", text: "दक्षिण" },
      { id: "d", text: "पूर्व" }
    ],
    correctOptionId: "d",
    explanation: "सूर्य पूर्व दिशा में उगता है और पश्चिम दिशा में अस्त होता है।",
    language: "hi",
  },
  {
    question: "भारत का राष्ट्रीय पशु कौन सा है?",
    options: [
      { id: "a", text: "शेर" },
      { id: "b", text: "हाथी" },
      { id: "c", text: "बाघ" },
      { id: "d", text: "मोर" }
    ],
    correctOptionId: "c",
    explanation: "बाघ (Royal Bengal Tiger) भारत का राष्ट्रीय पशु है। इसे 1973 में राष्ट्रीय पशु घोषित किया गया।",
    language: "hi",
  },
  {
    question: "महात्मा गाँधी का पूरा नाम क्या है?",
    options: [
      { id: "a", text: "मोहनदास करमचंद गाँधी" },
      { id: "b", text: "रामचंद्र गाँधी" },
      { id: "c", text: "देवदास गाँधी" },
      { id: "d", text: "हरिलाल गाँधी" }
    ],
    correctOptionId: "a",
    explanation: "महात्मा गाँधी का पूरा नाम मोहनदास करमचंद गाँधी था। उनका जन्म 2 अक्टूबर 1869 को पोरबंदर, गुजरात में हुआ था।",
    language: "hi",
  },
];

const trueFalseQuestions = [
  {
    question: "The Great Wall of China is visible from space with the naked eye.",
    options: [
      { id: "a", text: "True" },
      { id: "b", text: "False" }
    ],
    correctOptionId: "b",
    explanation: "This is a common myth. The Great Wall of China is not visible from space with the naked eye. It is too narrow to be seen from orbit."
  },
  {
    question: "Sound travels faster in water than in air.",
    options: [
      { id: "a", text: "True" },
      { id: "b", text: "False" }
    ],
    correctOptionId: "a",
    explanation: "Sound travels about 4 times faster in water (~1,480 m/s) than in air (~343 m/s) because water molecules are more tightly packed."
  },
  {
    question: "The human brain uses approximately 20% of the body's total energy.",
    options: [
      { id: "a", text: "True" },
      { id: "b", text: "False" }
    ],
    correctOptionId: "a",
    explanation: "Despite being only 2% of body weight, the brain consumes about 20% of the body's energy, primarily for neuron signaling."
  },
  {
    question: "Mount Everest is located entirely within Nepal.",
    options: [
      { id: "a", text: "True" },
      { id: "b", text: "False" }
    ],
    correctOptionId: "b",
    explanation: "Mount Everest straddles the border between Nepal and Tibet (China). The summit ridge forms the boundary between the two countries."
  },
  {
    question: "DNA stands for Deoxyribonucleic Acid.",
    options: [
      { id: "a", text: "True" },
      { id: "b", text: "False" }
    ],
    correctOptionId: "a",
    explanation: "DNA (Deoxyribonucleic Acid) is the molecule that carries the genetic instructions for the development and functioning of living organisms."
  },
];

const imageQuestions = [
  {
    question: "Which famous landmark is shown in this image?",
    questionImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Empire_State_Building_%28aerial_view%29.jpg/440px-Empire_State_Building_%28aerial_view%29.jpg",
    options: [
      { id: "a", text: "Burj Khalifa" },
      { id: "b", text: "Empire State Building" },
      { id: "c", text: "CN Tower" },
      { id: "d", text: "Eiffel Tower" }
    ],
    correctOptionId: "b",
    explanation: "The Empire State Building is a 102-story Art Deco skyscraper in Midtown Manhattan, New York City."
  },
  {
    question: "Identify the national flag shown in this image.",
    questionImageUrl: "https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Flag_of_India.svg/1200px-Flag_of_India.svg.png",
    options: [
      { id: "a", text: "Bangladesh" },
      { id: "b", text: "India" },
      { id: "c", text: "Sri Lanka" },
      { id: "d", text: "Niger" }
    ],
    correctOptionId: "b",
    explanation: "The Indian national flag (Tiranga) has three horizontal stripes of saffron, white, and green with a 24-spoke Ashoka Chakra in the center."
  },
  {
    question: "Which planet is shown in this image?",
    questionImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Jupiter_by_Cassini-Huygens.jpg/440px-Jupiter_by_Cassini-Huygens.jpg",
    options: [
      { id: "a", text: "Saturn" },
      { id: "b", text: "Neptune" },
      { id: "c", text: "Jupiter" },
      { id: "d", text: "Uranus" }
    ],
    correctOptionId: "c",
    explanation: "Jupiter is the largest planet in our solar system, known for its distinctive bands of clouds and the Great Red Spot."
  },
  {
    question: "Which famous monument is this?",
    questionImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Taj_Mahal%2C_Agra%2C_India_edit3.jpg/1280px-Taj_Mahal%2C_Agra%2C_India_edit3.jpg",
    options: [
      { id: "a", text: "Hawa Mahal" },
      { id: "b", text: "Red Fort" },
      { id: "c", text: "Taj Mahal" },
      { id: "d", text: "Qutub Minar" }
    ],
    correctOptionId: "c",
    explanation: "The Taj Mahal in Agra, India, was built by Emperor Shah Jahan in memory of his wife Mumtaz Mahal. It is a UNESCO World Heritage Site."
  },
  {
    question: "Which scientific instrument is shown in this image?",
    questionImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/Microscope_Nikon_Eclipse_E600.jpg/440px-Microscope_Nikon_Eclipse_E600.jpg",
    options: [
      { id: "a", text: "Telescope" },
      { id: "b", text: "Microscope" },
      { id: "c", text: "Periscope" },
      { id: "d", text: "Spectroscope" }
    ],
    correctOptionId: "b",
    explanation: "A microscope is a scientific instrument used to magnify small objects, allowing us to study cells, bacteria, and other microscopic structures."
  },
];

const audioQuestions = [
  {
    question: "What is the largest organ in the human body?",
    referenceAnswer: "Skin",
    explanation: "The skin is the largest organ in the human body, covering about 1.7 square meters and weighing about 3.6 kilograms in adults.",
    keywords: ["skin"],
    language: "en",
  },
  {
    question: "What is the capital of Australia?",
    referenceAnswer: "Canberra",
    explanation: "Canberra is the capital city of Australia, chosen as a compromise between Sydney and Melbourne.",
    keywords: ["canberra"],
    language: "en",
  },
  {
    question: "What force keeps the planets orbiting around the Sun?",
    referenceAnswer: "Gravity or Gravitational force",
    explanation: "Gravity is the force of attraction between objects with mass. The Sun's massive gravity keeps the planets in their orbits.",
    keywords: ["gravity", "gravitational"],
    language: "en",
  },
  {
    question: "भारत का सबसे ऊँचा पर्वत शिखर कौन सा है?",
    referenceAnswer: "कंचनजंगा",
    explanation: "कंचनजंगा भारत का सबसे ऊँचा पर्वत शिखर है, जिसकी ऊँचाई 8,586 मीटर है। यह सिक्किम में स्थित है।",
    keywords: ["कंचनजंगा", "kanchenjunga"],
    language: "hi",
  },
  {
    question: "हमारे सौरमंडल में कितने ग्रह हैं?",
    referenceAnswer: "आठ",
    explanation: "हमारे सौरमंडल में आठ ग्रह हैं — बुध, शुक्र, पृथ्वी, मंगल, बृहस्पति, शनि, अरुण और वरुण।",
    keywords: ["आठ", "8", "eight"],
    language: "hi",
  },
  {
    question: "भारत की सबसे लंबी नदी का नाम बताइए।",
    referenceAnswer: "गंगा",
    explanation: "गंगा भारत की सबसे लंबी नदी है जो लगभग 2,525 किलोमीटर लंबी है।",
    keywords: ["गंगा", "ganga", "ganges"],
    language: "hi",
  },
  {
    question: "ਭਾਰਤ ਦਾ ਰਾਸ਼ਟਰੀ ਪੰਛੀ ਕਿਹੜਾ ਹੈ?",
    referenceAnswer: "ਮੋਰ",
    explanation: "ਮੋਰ (Peacock) ਭਾਰਤ ਦਾ ਰਾਸ਼ਟਰੀ ਪੰਛੀ ਹੈ। ਇਸ ਨੂੰ 1963 ਵਿੱਚ ਰਾਸ਼ਟਰੀ ਪੰਛੀ ਘੋਸ਼ਿਤ ਕੀਤਾ ਗਿਆ ਸੀ।",
    keywords: ["ਮੋਰ", "mor", "peacock"],
    language: "pa",
  },
  {
    question: "ਸਾਡੀ ਧਰਤੀ ਸੂਰਜ ਦੁਆਲੇ ਇੱਕ ਚੱਕਰ ਕਿੰਨੇ ਦਿਨਾਂ ਵਿੱਚ ਲਗਾਉਂਦੀ ਹੈ?",
    referenceAnswer: "365 ਦਿਨ",
    explanation: "ਧਰਤੀ ਸੂਰਜ ਦੁਆਲੇ ਇੱਕ ਪੂਰਾ ਚੱਕਰ ਲਗਭਗ 365 ਦਿਨ ਅਤੇ 6 ਘੰਟੇ ਵਿੱਚ ਪੂਰਾ ਕਰਦੀ ਹੈ, ਇਸ ਨੂੰ ਇੱਕ ਸਾਲ ਕਿਹਾ ਜਾਂਦਾ ਹੈ।",
    keywords: ["365", "ਤਿੰਨ ਸੌ ਪੈਂਹਠ", "three hundred sixty five"],
    language: "pa",
  },
];

export async function createDemoExam() {
  const now = new Date();
  const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const endTime = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const regOpen = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const regClose = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const examData = await findDemoExam();
  if (examData) {
    const existingQuestions = await db.select().from(questions).where(eq(questions.examId, examData.id));
    const assignedStudents = await db
      .select({
        regId: examRegistrations.id,
        studentId: examRegistrations.studentId,
        status: examRegistrations.status,
        paymentStatus: examRegistrations.paymentStatus,
      })
      .from(examRegistrations)
      .where(eq(examRegistrations.examId, examData.id));

    const mcqCount = existingQuestions.filter(q => q.type === "mcq").length;
    const tfCount = existingQuestions.filter(q => q.type === "true_false").length;
    const imgCount = existingQuestions.filter(q => q.type === "image_based").length;
    const audioCount = existingQuestions.filter(q => q.type === "audio_based" || (q as any).isVoiceEnabled).length;

    return {
      success: true,
      alreadyExists: true,
      exam: examData,
      questionCount: existingQuestions.length,
      breakdown: { mcq: mcqCount, trueFalse: tfCount, imageBased: imgCount, audio: audioCount },
      assignedStudents,
    };
  }

  const totalQuestions = mcqQuestions.length + trueFalseQuestions.length + imageQuestions.length + audioQuestions.length;

  const [newExam] = await db.insert(exams).values({
    title: `${DEMO_EXAM_PREFIX}General Knowledge Olympiad 2026`,
    slug: "demo-gk-olympiad-2026",
    description: "A demo General Knowledge Olympiad with 30 mixed questions (MCQ, True/False, Image-based, Audio) covering Science, History, Geography, Current Affairs, and more.",
    subject: "General Knowledge",
    durationMinutes: 45,
    startTime,
    endTime,
    registrationOpenDate: regOpen,
    registrationCloseDate: regClose,
    totalMarks: totalQuestions * 4,
    maxQuestions: totalQuestions,
    negativeMarking: false,
    proctoring: false,
    participationFee: 0,
    minClass: 1,
    maxClass: 12,
    classCategory: "1-12",
    isVisible: false,
    status: "active",
    difficultyLevel: "medium",
    totalQuestions,
    mcqCount: mcqQuestions.length,
    trueFalseCount: trueFalseQuestions.length,
    imageBasedCount: imageQuestions.length,
    shuffleQuestionOrder: true,
    shuffleOptionOrder: true,
    enableRandomDistribution: false,
    questionsPerStudent: totalQuestions,
    createdBy: "superadmin",
  }).returning();

  let order = 1;

  for (const q of mcqQuestions) {
    await db.insert(questions).values({
      examId: newExam.id,
      type: "mcq",
      content: q,
      marks: 4,
      difficulty: "medium",
      displayOrder: order++,
      isActive: true,
    });
  }

  for (const q of trueFalseQuestions) {
    await db.insert(questions).values({
      examId: newExam.id,
      type: "true_false",
      content: q,
      marks: 4,
      difficulty: "medium",
      displayOrder: order++,
      isActive: true,
    });
  }

  for (const q of imageQuestions) {
    await db.insert(questions).values({
      examId: newExam.id,
      type: "mcq",
      content: {
        question: q.question,
        options: q.options,
        correctOptionId: q.correctOptionId,
        explanation: q.explanation,
        questionImageUrl: q.questionImageUrl,
      },
      marks: 4,
      difficulty: "medium",
      displayOrder: order++,
      isActive: true,
    });
  }

  for (const q of audioQuestions) {
    await db.insert(questions).values({
      examId: newExam.id,
      type: "mcq",
      content: {
        question: q.question,
        options: [],
        correctOptionId: "",
        explanation: q.explanation,
        language: q.language || "en",
      },
      marks: 4,
      difficulty: "medium",
      displayOrder: order++,
      isActive: true,
      isVoiceEnabled: true,
      spokenAnswerFormat: "short_explanation",
      voiceEvaluationMethod: "semantic_match",
      referenceAnswer: q.referenceAnswer,
      maxRecordingDuration: 30,
    });
  }

  const enMcq = mcqQuestions.filter(q => q.language === "en").length;
  const hiMcq = mcqQuestions.filter(q => q.language === "hi").length;
  const enAudio = audioQuestions.filter(q => q.language === "en").length;
  const hiAudio = audioQuestions.filter(q => q.language === "hi").length;
  const paAudio = audioQuestions.filter(q => q.language === "pa").length;

  return {
    success: true,
    alreadyExists: false,
    exam: newExam,
    questionCount: totalQuestions,
    breakdown: {
      mcq: mcqQuestions.length,
      trueFalse: trueFalseQuestions.length,
      imageBased: imageQuestions.length,
      audio: audioQuestions.length,
    },
    languageBreakdown: {
      mcq: { en: enMcq, hi: hiMcq },
      audio: { en: enAudio, hi: hiAudio, pa: paAudio },
    },
    assignedStudents: [],
  };
}

export async function getDemoExamStatus() {
  const examData = await findDemoExam();
  if (!examData) {
    return { exists: false, exam: null, questionCount: 0, breakdown: { mcq: 0, trueFalse: 0, imageBased: 0, audio: 0 }, assignedStudents: [] };
  }
  const questionList = await db.select().from(questions).where(eq(questions.examId, examData.id));

  const mcqCount = questionList.filter(q => q.type === "mcq" && !q.isVoiceEnabled && !(q.content as any)?.questionImageUrl).length;
  const tfCount = questionList.filter(q => q.type === "true_false").length;
  const imgCount = questionList.filter(q => (q.content as any)?.questionImageUrl).length;
  const audioCount = questionList.filter(q => q.isVoiceEnabled).length;

  const assignedStudentsRaw = await db
    .select({
      regId: examRegistrations.id,
      studentId: examRegistrations.studentId,
      status: examRegistrations.status,
      paymentStatus: examRegistrations.paymentStatus,
    })
    .from(examRegistrations)
    .where(eq(examRegistrations.examId, examData.id));

  const studentDetails = [];
  for (const reg of assignedStudentsRaw) {
    const [student] = await db.select().from(studentRegistrations).where(eq(studentRegistrations.id, reg.studentId));
    const studentAttempts = await db
      .select()
      .from(attempts)
      .where(and(eq(attempts.userId, String(reg.studentId)), eq(attempts.examId, examData.id)));

    studentDetails.push({
      ...reg,
      studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
      studentIdCode: student?.studentId || "",
      email: student?.email || "",
      gradeLevel: student?.gradeLevel || "",
      hasAttempted: studentAttempts.length > 0,
      attemptStatus: studentAttempts.length > 0 ? studentAttempts[0].status : null,
      attemptScore: studentAttempts.length > 0 ? studentAttempts[0].score : null,
    });
  }

  const enMcqCount = questionList.filter(q => q.type === "mcq" && !q.isVoiceEnabled && !(q.content as any)?.questionImageUrl && ((q.content as any)?.language === "en" || !(q.content as any)?.language)).length;
  const hiMcqCount = questionList.filter(q => q.type === "mcq" && !q.isVoiceEnabled && !(q.content as any)?.questionImageUrl && (q.content as any)?.language === "hi").length;
  const enAudioCount = questionList.filter(q => q.isVoiceEnabled && ((q.content as any)?.language === "en" || !(q.content as any)?.language)).length;
  const hiAudioCount = questionList.filter(q => q.isVoiceEnabled && (q.content as any)?.language === "hi").length;
  const paAudioCount = questionList.filter(q => q.isVoiceEnabled && (q.content as any)?.language === "pa").length;

  return {
    exists: true,
    exam: examData,
    questionCount: questionList.length,
    breakdown: { mcq: mcqCount, trueFalse: tfCount, imageBased: imgCount, audio: audioCount },
    languageBreakdown: {
      mcq: { en: enMcqCount, hi: hiMcqCount },
      audio: { en: enAudioCount, hi: hiAudioCount, pa: paAudioCount },
    },
    assignedStudents: studentDetails,
  };
}

export async function toggleDemoProctoring() {
  const examData = await findDemoExam();
  if (!examData) {
    throw new Error("Demo exam not found.");
  }
  const newValue = !examData.proctoring;
  await db.update(exams).set({ proctoring: newValue }).where(eq(exams.id, examData.id));
  return { success: true, proctoring: newValue };
}

export async function assignDemoExam(studentId: number) {
  const examData = await findDemoExam();
  if (!examData) {
    throw new Error("Demo exam not found. Please create it first.");
  }

  const existing = await db
    .select()
    .from(examRegistrations)
    .where(and(eq(examRegistrations.studentId, studentId), eq(examRegistrations.examId, examData.id)));

  if (existing.length > 0) {
    throw new Error("Student is already assigned to this demo exam.");
  }

  const [student] = await db.select().from(studentRegistrations).where(eq(studentRegistrations.id, studentId));
  if (!student) {
    throw new Error("Student not found.");
  }

  const [registration] = await db.insert(examRegistrations).values({
    studentId,
    examId: examData.id,
    registeredByType: "admin",
    status: "confirmed",
    paymentStatus: "unlocked",
  }).returning();

  return {
    success: true,
    registration,
    studentName: `${student.firstName} ${student.lastName}`,
  };
}

export async function unassignDemoExam(studentId: number) {
  const examData = await findDemoExam();
  if (!examData) {
    throw new Error("Demo exam not found.");
  }

  const studentAttempts = await db.select().from(attempts).where(
    and(eq(attempts.userId, String(studentId)), eq(attempts.examId, examData.id))
  );

  for (const attempt of studentAttempts) {
    await db.delete(attemptQuestions).where(eq(attemptQuestions.attemptId, attempt.id));
    await db.delete(answers).where(eq(answers.attemptId, attempt.id));
  }

  await db.delete(attempts).where(
    and(eq(attempts.userId, String(studentId)), eq(attempts.examId, examData.id))
  );

  await db.delete(examRegistrations).where(
    and(eq(examRegistrations.studentId, studentId), eq(examRegistrations.examId, examData.id))
  );

  return { success: true };
}

export async function resetDemoExamForStudent(studentId: number) {
  const examData = await findDemoExam();
  if (!examData) {
    throw new Error("Demo exam not found.");
  }

  const studentAttempts = await db.select().from(attempts).where(
    and(eq(attempts.userId, String(studentId)), eq(attempts.examId, examData.id))
  );

  for (const attempt of studentAttempts) {
    await db.delete(attemptQuestions).where(eq(attemptQuestions.attemptId, attempt.id));
    await db.delete(answers).where(eq(answers.attemptId, attempt.id));
  }

  await db.delete(attempts).where(
    and(eq(attempts.userId, String(studentId)), eq(attempts.examId, examData.id))
  );

  return { success: true, message: "Exam reset successfully. Student can retake the exam." };
}

export async function searchStudentsForDemo(query: string) {
  if (!query || query.length < 2) return [];

  const searchPattern = `%${query}%`;
  const results = await db.select({
    id: studentRegistrations.id,
    firstName: studentRegistrations.firstName,
    lastName: studentRegistrations.lastName,
    email: studentRegistrations.email,
    studentId: studentRegistrations.studentId,
    gradeLevel: studentRegistrations.gradeLevel,
  }).from(studentRegistrations)
    .where(
      or(
        ilike(studentRegistrations.firstName, searchPattern),
        ilike(studentRegistrations.lastName, searchPattern),
        ilike(studentRegistrations.email, searchPattern),
        ilike(studentRegistrations.studentId, searchPattern)
      )
    )
    .limit(20);

  return results;
}

export async function deleteDemoExam() {
  const examData = await findDemoExam();
  if (!examData) {
    return { success: true, message: "No demo exam found to delete." };
  }

  const allAttempts = await db.select().from(attempts).where(eq(attempts.examId, examData.id));
  for (const attempt of allAttempts) {
    await db.delete(attemptQuestions).where(eq(attemptQuestions.attemptId, attempt.id));
    await db.delete(answers).where(eq(answers.attemptId, attempt.id));
  }

  await db.delete(attempts).where(eq(attempts.examId, examData.id));
  await db.delete(examRegistrations).where(eq(examRegistrations.examId, examData.id));
  await db.delete(questions).where(eq(questions.examId, examData.id));
  await db.delete(exams).where(eq(exams.id, examData.id));

  return { success: true, message: "Demo exam deleted successfully." };
}

export async function evaluateAudioAnswer(questionId: number, transcript: string) {
  const [question] = await db.select().from(questions).where(eq(questions.id, questionId));
  if (!question) {
    throw new Error("Question not found.");
  }

  const referenceAnswer = (question.referenceAnswer || "").toLowerCase().trim();
  const studentAnswer = (transcript || "").toLowerCase().trim();

  if (!referenceAnswer || !studentAnswer) {
    return { isCorrect: false, score: 0, method: "empty" };
  }

  if (studentAnswer === referenceAnswer) {
    return { isCorrect: true, score: 100, method: "exact_match" };
  }

  if (referenceAnswer.includes(studentAnswer) || studentAnswer.includes(referenceAnswer)) {
    return { isCorrect: true, score: 90, method: "substring_match" };
  }

  const refWords = referenceAnswer.split(/\s+/);
  const studentWords = studentAnswer.split(/\s+/);
  const matchedWords = refWords.filter(w => studentWords.some(sw => sw.includes(w) || w.includes(sw)));
  const keywordScore = refWords.length > 0 ? (matchedWords.length / refWords.length) * 100 : 0;

  if (keywordScore >= 80) {
    return { isCorrect: true, score: Math.round(keywordScore), method: "keyword_match" };
  }

  try {
    const openaiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an exam evaluator. Compare the student's answer with the reference answer. Return ONLY a JSON object with two fields: 'score' (0-100 integer representing correctness percentage) and 'reasoning' (brief explanation). Be lenient - if the answer is substantially correct even with minor errors, give a high score."
            },
            {
              role: "user",
              content: `Question: ${(question.content as any)?.question || ""}\nReference Answer: ${question.referenceAnswer}\nStudent's Answer: ${transcript}\n\nEvaluate the student's answer.`
            }
          ],
          temperature: 0.1,
          max_tokens: 200,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const evaluation = JSON.parse(jsonMatch[0]);
            const aiScore = Number(evaluation.score) || 0;
            return {
              isCorrect: aiScore >= 80,
              score: aiScore,
              method: "ai_semantic",
              reasoning: evaluation.reasoning || "",
            };
          }
        } catch {}
      }
    }
  } catch {}

  return { isCorrect: keywordScore >= 50, score: Math.round(keywordScore), method: "keyword_fallback" };
}
