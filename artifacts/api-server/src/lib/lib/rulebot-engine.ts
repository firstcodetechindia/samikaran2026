import { db } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  ruleBotIntents,
  ruleBotResponses,
  ruleBotConversations,
  ruleBotMessages,
  ruleBotQuickActions,
  studentRegistrations,
  attempts,
  exams,
  RuleBotIntent,
  RuleBotResponse,
} from "@workspace/db";

interface UserContext {
  userId?: number;
  firstName?: string;
  role?: string;
  isGuest: boolean;
  deviceType?: string;
  currentPage?: string;
  lastExamId?: number;
  lastExamTitle?: string;
  accuracy?: number;
  recentActivity?: string;
  className?: number;
}

interface MatchResult {
  intent: RuleBotIntent;
  confidence: number;
  matchedKeywords: string[];
}

interface BotResponse {
  content: string;
  responseType: string;
  quickReplies?: Array<{ label: string; action: string }>;
  actionCards?: any;
  intentMatched?: string;
  confidence?: number;
}

const DEFAULT_INTENTS: Array<{
  name: string;
  category: string;
  keywords: string[];
  patterns?: string[];
  requiredAuth: boolean;
  allowedRoles?: string[];
  priority: number;
}> = [
  {
    name: "greeting",
    category: "general",
    keywords: ["hello", "hi", "hey", "namaste", "good morning", "good evening", "good afternoon"],
    priority: 100,
    requiredAuth: false,
  },
  {
    name: "exam_info",
    category: "exam",
    keywords: ["exam", "olympiad", "test", "competition", "upcoming", "schedule", "when", "date"],
    priority: 80,
    requiredAuth: false,
  },
  {
    name: "registration",
    category: "exam",
    keywords: ["register", "sign up", "enroll", "join", "apply", "participate"],
    priority: 85,
    requiredAuth: false,
  },
  {
    name: "result_query",
    category: "result",
    keywords: ["result", "score", "marks", "performance", "how did i do", "my score"],
    priority: 90,
    requiredAuth: true,
    allowedRoles: ["student"],
  },
  {
    name: "weak_topics",
    category: "result",
    keywords: ["weak", "improve", "practice", "study", "help", "struggling", "difficult"],
    priority: 75,
    requiredAuth: true,
    allowedRoles: ["student"],
  },
  {
    name: "pricing",
    category: "general",
    keywords: ["price", "cost", "fee", "payment", "money", "charge", "how much"],
    priority: 70,
    requiredAuth: false,
  },
  {
    name: "eligibility",
    category: "exam",
    keywords: ["eligible", "eligibility", "who can", "age", "class", "grade", "qualify"],
    priority: 75,
    requiredAuth: false,
  },
  {
    name: "certificate",
    category: "result",
    keywords: ["certificate", "award", "prize", "recognition", "download"],
    priority: 65,
    requiredAuth: true,
    allowedRoles: ["student"],
  },
  {
    name: "contact_support",
    category: "support",
    keywords: ["contact", "support", "help", "issue", "problem", "complaint", "speak to"],
    priority: 60,
    requiredAuth: false,
  },
  {
    name: "goodbye",
    category: "general",
    keywords: ["bye", "goodbye", "thanks", "thank you", "see you", "later"],
    priority: 50,
    requiredAuth: false,
  },
  {
    name: "child_performance",
    category: "result",
    keywords: ["child", "son", "daughter", "kid", "performance", "how is", "progress"],
    priority: 85,
    requiredAuth: true,
    allowedRoles: ["parent", "school"],
  },
  {
    name: "bulk_registration",
    category: "exam",
    keywords: ["bulk", "multiple students", "school registration", "batch", "group"],
    priority: 80,
    requiredAuth: true,
    allowedRoles: ["school", "partner"],
  },
  {
    name: "partnership",
    category: "general",
    keywords: ["partner", "partnership", "affiliate", "referral", "commission", "earn"],
    priority: 70,
    requiredAuth: false,
  },
];

const DEFAULT_RESPONSES: Record<string, Array<{ content: string; conditions?: any; quickReplies?: any[] }>> = {
  greeting: [
    {
      content: "Hi {{firstName}}! Great to see you back. How can I help you today with your Olympiad journey?",
      conditions: { isGuest: false },
      quickReplies: [
        { label: "View Results", action: "show_results" },
        { label: "Upcoming Exams", action: "show_exams" },
        { label: "My Performance", action: "show_performance" },
      ],
    },
    {
      content: "Welcome to Samikaran Olympiad! I'm here to help you with exam information, registration, and more. How can I assist you today?",
      conditions: { isGuest: true },
      quickReplies: [
        { label: "Available Olympiads", action: "show_exams" },
        { label: "How to Register", action: "registration_help" },
        { label: "Login / Sign Up", action: "login" },
      ],
    },
  ],
  exam_info: [
    {
      content: "We have exciting Olympiad exams in Mathematics, Science, English, Computer Science, and Reasoning for students from Class 1-12. Would you like to know about a specific subject?",
      quickReplies: [
        { label: "Math Olympiad", action: "exam_math" },
        { label: "Science Olympiad", action: "exam_science" },
        { label: "All Olympiads", action: "show_all_exams" },
      ],
    },
  ],
  registration: [
    {
      content: "To register for an Olympiad:\n1. Login or create an account\n2. Go to 'Available Olympiads'\n3. Select your preferred exam\n4. Complete the registration form\n5. Make payment\n\nWould you like me to help you with registration?",
      quickReplies: [
        { label: "Register Now", action: "register" },
        { label: "View Olympiads", action: "show_exams" },
      ],
    },
  ],
  result_query: [
    {
      content: "Your recent exam results are ready! {{#if lastExamTitle}}Your last exam was '{{lastExamTitle}}'{{/if}}. Would you like to view your detailed scorecard?",
      conditions: { role: "student" },
      quickReplies: [
        { label: "View Results", action: "show_results" },
        { label: "View Analysis", action: "show_analysis" },
      ],
    },
    {
      content: "Let me check your results. Please go to the Results section in your dashboard to view your scores and performance analysis.",
      quickReplies: [
        { label: "Go to Results", action: "navigate_results" },
      ],
    },
  ],
  weak_topics: [
    {
      content: "{{#if accuracy}}Based on your accuracy of {{accuracy}}%, I recommend focusing on {{#if accuracy < 50}}fundamental concepts{{else}}advanced problems{{/if}}.{{/if}} Practice makes perfect! Check your performance analytics for detailed weak areas.",
      conditions: { role: "student" },
      quickReplies: [
        { label: "View Weak Areas", action: "show_weak_areas" },
        { label: "Practice Tests", action: "practice" },
      ],
    },
  ],
  pricing: [
    {
      content: "Our Olympiad exam fees vary by exam type:\n• Standard Olympiad: Rs. 150-250\n• Premium Olympiad: Rs. 300-500\n\nSchools get special bulk discounts! Would you like more details?",
      quickReplies: [
        { label: "View All Prices", action: "show_pricing" },
        { label: "School Discount", action: "school_pricing" },
      ],
    },
  ],
  eligibility: [
    {
      content: "Our Olympiads are open to students from Class 1 to Class 12. Each exam may have specific eligibility:\n• Age-appropriate difficulty levels\n• Subject-specific requirements\n\nWant to check eligibility for a specific Olympiad?",
      quickReplies: [
        { label: "Check Eligibility", action: "check_eligibility" },
        { label: "View Olympiads", action: "show_exams" },
      ],
    },
  ],
  certificate: [
    {
      content: "Certificates are available for participants who complete exams. Top performers receive special recognition!\n\n• Participation Certificate: All participants\n• Merit Certificate: Top 30%\n• Excellence Award: Top 10%",
      quickReplies: [
        { label: "Download Certificate", action: "download_cert" },
        { label: "View Awards", action: "show_awards" },
      ],
    },
  ],
  contact_support: [
    {
      content: "I'm here to help! For additional support:\n\nEmail: support@samikaranolympiad.com\nPhone: 1800-XXX-XXXX (toll-free)\n\nOr you can leave your details and we'll call you back!",
      quickReplies: [
        { label: "Email Support", action: "email_support" },
        { label: "Request Callback", action: "request_callback" },
      ],
    },
  ],
  goodbye: [
    {
      content: "Thank you for chatting with me! Good luck with your Olympiad preparation. Feel free to come back anytime you need help!",
    },
  ],
  child_performance: [
    {
      content: "I can help you track your child's Olympiad performance. Please check the dashboard for:\n• Recent exam scores\n• Subject-wise analysis\n• Improvement suggestions",
      conditions: { role: "parent" },
      quickReplies: [
        { label: "View Performance", action: "child_performance" },
        { label: "Improvement Tips", action: "improvement_tips" },
      ],
    },
    {
      content: "To view student performance in your school, please check the Analytics section in your School Dashboard.",
      conditions: { role: "school" },
      quickReplies: [
        { label: "School Analytics", action: "school_analytics" },
      ],
    },
  ],
  bulk_registration: [
    {
      content: "Great! For bulk registration:\n1. Go to Students section\n2. Click 'Bulk Upload'\n3. Download our template\n4. Fill student details\n5. Upload and confirm\n\nNeed help with the process?",
      quickReplies: [
        { label: "Bulk Upload", action: "bulk_upload" },
        { label: "Download Template", action: "download_template" },
      ],
    },
  ],
  partnership: [
    {
      content: "Join our Partner Program and earn commissions!\n• Up to 30% referral commission\n• Dedicated partner dashboard\n• Marketing materials provided\n• Monthly payouts\n\nInterested in becoming a partner?",
      quickReplies: [
        { label: "Become Partner", action: "partner_signup" },
        { label: "Learn More", action: "partner_info" },
      ],
    },
  ],
  fallback: [
    {
      content: "I'm not sure I understood that. Here are some things I can help you with:",
      quickReplies: [
        { label: "Olympiad Info", action: "exam_info" },
        { label: "Registration", action: "registration" },
        { label: "Contact Support", action: "contact_support" },
      ],
    },
  ],
};

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, "");
}

function matchIntent(
  message: string,
  intents: typeof DEFAULT_INTENTS,
  context: UserContext
): MatchResult | null {
  const normalizedMessage = normalizeText(message);
  const messageWords = normalizedMessage.split(/\s+/);

  let bestMatch: MatchResult | null = null;
  let highestScore = 0;

  for (const intent of intents) {
    if (intent.requiredAuth && context.isGuest) continue;
    if (intent.allowedRoles && context.role && !intent.allowedRoles.includes(context.role)) continue;

    const matchedKeywords: string[] = [];
    let keywordMatches = 0;

    for (const keyword of intent.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      if (normalizedMessage.includes(normalizedKeyword)) {
        matchedKeywords.push(keyword);
        keywordMatches++;
      }
    }

    if (keywordMatches > 0) {
      const keywordScore = (keywordMatches / intent.keywords.length) * 100;
      const priorityBonus = intent.priority / 10;
      const confidence = Math.min(100, keywordScore + priorityBonus);

      if (confidence > highestScore) {
        highestScore = confidence;
        bestMatch = {
          intent: intent as unknown as RuleBotIntent,
          confidence,
          matchedKeywords,
        };
      }
    }
  }

  return bestMatch;
}

function renderTemplate(template: string, context: UserContext): string {
  let result = template;

  result = result.replace(/\{\{firstName\}\}/g, context.firstName || "there");
  result = result.replace(/\{\{role\}\}/g, context.role || "guest");
  result = result.replace(/\{\{accuracy\}\}/g, String(context.accuracy || 0));
  result = result.replace(/\{\{lastExamTitle\}\}/g, context.lastExamTitle || "");
  result = result.replace(/\{\{className\}\}/g, String(context.className || ""));

  result = result.replace(/\{\{#if (\w+)\}\}(.*?)\{\{\/if\}\}/g, (match, condition, content) => {
    const conditionValue = (context as any)[condition];
    return conditionValue ? content : "";
  });

  result = result.replace(/\{\{#if (\w+) < (\d+)\}\}(.*?)\{\{else\}\}(.*?)\{\{\/if\}\}/g, 
    (match, field, threshold, ifContent, elseContent) => {
      const value = (context as any)[field];
      return value && value < parseInt(threshold) ? ifContent : elseContent;
    }
  );

  return result;
}

function selectResponse(
  intentName: string,
  context: UserContext
): { content: string; quickReplies?: any[] } {
  const responses = DEFAULT_RESPONSES[intentName] || DEFAULT_RESPONSES.fallback;

  for (const response of responses) {
    if (response.conditions) {
      let conditionsMet = true;
      for (const [key, value] of Object.entries(response.conditions)) {
        if ((context as any)[key] !== value) {
          conditionsMet = false;
          break;
        }
      }
      if (conditionsMet) {
        return {
          content: renderTemplate(response.content, context),
          quickReplies: response.quickReplies,
        };
      }
    }
  }

  const fallbackResponse = responses.find(r => !r.conditions) || responses[0];
  return {
    content: renderTemplate(fallbackResponse.content, context),
    quickReplies: fallbackResponse.quickReplies,
  };
}

export async function getUserContext(userId?: number, role?: string): Promise<UserContext> {
  const context: UserContext = {
    isGuest: !userId,
    role: role || "guest",
  };

  if (userId && role === "student") {
    try {
      const student = await db
        .select()
        .from(studentRegistrations)
        .where(eq(studentRegistrations.id, userId))
        .limit(1);

      if (student.length > 0) {
        const s = student[0];
        context.firstName = s.firstName || undefined;
        context.userId = s.id;
        context.className = s.gradeLevel ? parseInt(s.gradeLevel) : undefined;

        const recentAttempt = await db
          .select({
            examId: attempts.examId,
            score: attempts.score,
            totalMarks: exams.totalMarks,
            examTitle: exams.title,
          })
          .from(attempts)
          .leftJoin(exams, eq(attempts.examId, exams.id))
          .where(eq(attempts.userId, String(userId)))
          .orderBy(desc(attempts.endTime))
          .limit(1);

        if (recentAttempt.length > 0) {
          context.lastExamId = recentAttempt[0].examId;
          context.lastExamTitle = recentAttempt[0].examTitle || undefined;
          if (recentAttempt[0].totalMarks && recentAttempt[0].score) {
            context.accuracy = Math.round((recentAttempt[0].score / recentAttempt[0].totalMarks) * 100);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching user context:", error);
    }
  }

  return context;
}

export async function processMessage(
  message: string,
  sessionId: string,
  context: UserContext
): Promise<BotResponse> {
  const matchResult = matchIntent(message, DEFAULT_INTENTS, context);

  if (matchResult && matchResult.confidence >= 30) {
    const response = selectResponse(matchResult.intent.name as string, context);
    return {
      content: response.content,
      responseType: "text",
      quickReplies: response.quickReplies,
      intentMatched: matchResult.intent.name as string,
      confidence: matchResult.confidence,
    };
  }

  const fallbackResponse = selectResponse("fallback", context);
  return {
    content: fallbackResponse.content,
    responseType: "text",
    quickReplies: fallbackResponse.quickReplies,
    intentMatched: "fallback",
    confidence: 0,
  };
}

export function getWelcomeMessage(context: UserContext): BotResponse {
  if (context.isGuest) {
    return {
      content: "Namaste! Welcome to Samikaran Olympiad. I'm here to help you with exam information, registration, and more. How can I assist you today?",
      responseType: "text",
      quickReplies: [
        { label: "Available Olympiads", action: "show_exams" },
        { label: "How to Register", action: "registration" },
        { label: "Login / Sign Up", action: "login" },
      ],
    };
  }

  const greeting = getTimeBasedGreeting();
  return {
    content: `${greeting} ${context.firstName || ""}! Ready to continue your Olympiad journey? How can I help you today?`,
    responseType: "text",
    quickReplies: [
      { label: "View Results", action: "show_results" },
      { label: "Upcoming Exams", action: "show_exams" },
      { label: "My Performance", action: "show_performance" },
    ],
  };
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export async function getQuickActions(context: UserContext): Promise<Array<{
  title: string;
  message: string;
  actionType: string;
  actionPayload?: any;
}>> {
  const actions: Array<{
    title: string;
    message: string;
    actionType: string;
    actionPayload?: any;
  }> = [];

  if (context.isGuest) {
    actions.push({
      title: "Create Account",
      message: "Sign up to participate in Olympiads and track your progress!",
      actionType: "navigate",
      actionPayload: { route: "/student/register" },
    });
  }

  if (context.role === "student") {
    if (context.accuracy !== undefined && context.accuracy < 50) {
      actions.push({
        title: "Improve Your Score",
        message: "Your accuracy needs improvement. Check out study tips and practice more!",
        actionType: "suggest",
        actionPayload: { section: "weak_areas" },
      });
    }

    actions.push({
      title: "View Upcoming Olympiads",
      message: "Check available Olympiads and register before deadlines!",
      actionType: "navigate",
      actionPayload: { route: "/student/exams" },
    });
  }

  return actions;
}
