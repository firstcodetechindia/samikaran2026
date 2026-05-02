import { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { 
  gurujiSettings, gurujiConversations, gurujiMessages, 
  gurujiCreditsLedger, gurujiStudentCredits, gurujiCreditPackages,
  gurujiPrintLogs, studentRegistrations, users, aiProviders, examRegistrations, exams
} from "@workspace/db";
import { eq, and, desc, asc, sql, gte, lte, ilike, or } from "drizzle-orm";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Cache for STT/TTS OpenAI client using database API key
let sttTtsOpenAIClient: OpenAI | null = null;
let sttTtsApiKeyCache: string | null = null;

// Get OpenAI client for STT/TTS using API key from database
async function getSttTtsOpenAI(): Promise<OpenAI | null> {
  try {
    // Check for active OpenAI provider for speech_to_text category
    const [provider] = await db.select().from(aiProviders)
      .where(and(
        eq(aiProviders.category, "speech_to_text"),
        eq(aiProviders.isActive, true),
        eq(aiProviders.providerCode, "openai")
      )).limit(1);
    
    if (!provider || !provider.apiKey) {
      console.log("No active OpenAI API key found for STT/TTS in database");
      return null;
    }
    
    // Return cached client if API key hasn't changed
    if (sttTtsOpenAIClient && sttTtsApiKeyCache === provider.apiKey) {
      return sttTtsOpenAIClient;
    }
    
    // Create new OpenAI client with direct API key (not Replit proxy)
    sttTtsOpenAIClient = new OpenAI({
      apiKey: provider.apiKey,
    });
    sttTtsApiKeyCache = provider.apiKey;
    
    console.log("Created OpenAI client for STT/TTS using database API key");
    return sttTtsOpenAIClient;
  } catch (error) {
    console.error("Error getting STT/TTS OpenAI client:", error);
    return null;
  }
}

// Cache for Gemini client
let geminiClient: GoogleGenerativeAI | null = null;
let geminiApiKeyCache: string | null = null;

// Get Gemini client from database API key
async function getGeminiClient(): Promise<GoogleGenerativeAI | null> {
  try {
    // Look for gemini provider in content category (used for AI chat)
    const [provider] = await db.select().from(aiProviders)
      .where(and(
        eq(aiProviders.category, "content"),
        eq(aiProviders.isActive, true),
        eq(aiProviders.providerCode, "gemini")
      )).limit(1);
    
    if (!provider || !provider.apiKey) {
      return null;
    }
    
    if (geminiClient && geminiApiKeyCache === provider.apiKey) {
      return geminiClient;
    }
    
    geminiClient = new GoogleGenerativeAI(provider.apiKey);
    geminiApiKeyCache = provider.apiKey;
    return geminiClient;
  } catch (error) {
    console.error("Error getting Gemini client:", error);
    return null;
  }
}

// Search for image URL from Wikipedia
async function searchWikipediaImage(query: string): Promise<string | null> {
  try {
    // Clean up the query - extract person/thing name (more comprehensive)
    const cleanQuery = query
      .replace(/मुझे|मैं|हमें|की|का|के|को|में|से|पर|एक|वो|वह|ये|यह|इसकी|उसकी|फोटो|तस्वीर|photo|picture|image|tasveer|pic/gi, '')
      .replace(/दिखाओ|दिखाइए|दिखाए|दिखाई|देखाओ|देखाइए|देखाए|दिखा|देखा|show|dikha|dikhao|dikhaiye|dekhao/gi, '')
      .replace(/please|कृपया|ज़रा|जरा|भेजो|बताओ|batao|bhejo/gi, '')
      .replace(/[।,.!?]/g, '')
      .trim();
    
    console.log(`[GURUJI IMAGE] Clean query: "${cleanQuery}"`);
    
    if (!cleanQuery) return null;
    
    // Add context for famous personalities to get accurate results
    let searchQuery = cleanQuery;
    const lowerQuery = cleanQuery.toLowerCase();
    
    // Add context for common searches
    if (lowerQuery.includes('नरेंद्र मोदी') || lowerQuery.includes('narendra modi') || lowerQuery.includes('modi')) {
      searchQuery = 'Narendra Modi Prime Minister India';
    } else if (lowerQuery.includes('राहुल गांधी') || lowerQuery.includes('rahul gandhi')) {
      searchQuery = 'Rahul Gandhi politician India';
    } else if (lowerQuery.includes('अमिताभ') || lowerQuery.includes('amitabh')) {
      searchQuery = 'Amitabh Bachchan actor';
    } else if (lowerQuery.includes('शाहरुख') || lowerQuery.includes('shahrukh') || lowerQuery.includes('shah rukh')) {
      searchQuery = 'Shah Rukh Khan actor Bollywood';
    } else if (lowerQuery.includes('विराट') || lowerQuery.includes('virat')) {
      searchQuery = 'Virat Kohli cricketer India';
    } else if (lowerQuery.includes('सचिन') || lowerQuery.includes('sachin')) {
      searchQuery = 'Sachin Tendulkar cricketer';
    } else if (lowerQuery.includes('ताज महल') || lowerQuery.includes('taj mahal')) {
      searchQuery = 'Taj Mahal Agra monument';
    } else if (lowerQuery.includes('qutub') || lowerQuery.includes('कुतुब')) {
      searchQuery = 'Qutub Minar Delhi';
    } else if (lowerQuery.includes('periodic') || lowerQuery.includes('पीरियोडिक') || lowerQuery.includes('आवर्त')) {
      searchQuery = 'Periodic table chemical elements';
    } else if (lowerQuery.includes('solar system') || lowerQuery.includes('सौर मंडल')) {
      searchQuery = 'Solar System planets';
    } else if (lowerQuery.includes('india map') || lowerQuery.includes('भारत का नक्शा')) {
      searchQuery = 'India political map';
    } else if (lowerQuery.includes('world map') || lowerQuery.includes('विश्व नक्शा')) {
      searchQuery = 'World map political';
    } else if (lowerQuery.includes('human body') || lowerQuery.includes('मानव शरीर')) {
      searchQuery = 'Human body anatomy';
    } else if (lowerQuery.includes('digestive system') || lowerQuery.includes('पाचन तंत्र')) {
      searchQuery = 'Human digestive system';
    } else if (lowerQuery.includes('cell') || lowerQuery.includes('कोशिका')) {
      searchQuery = 'Animal cell biology diagram';
    }
    
    console.log(`[GURUJI IMAGE] Search query: "${searchQuery}"`);
    
    // Search Wikipedia for the page
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&format=json&origin=*`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.query?.search?.[0]?.title) return null;
    
    const pageTitle = searchData.query.search[0].title;
    
    // Get the page images
    const imageUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&format=json&pithumbsize=400&origin=*`;
    const imageResponse = await fetch(imageUrl);
    const imageData = await imageResponse.json();
    
    const pages = imageData.query?.pages;
    if (!pages) return null;
    
    const page = Object.values(pages)[0] as any;
    if (page?.thumbnail?.source) {
      return page.thumbnail.source;
    }
    
    return null;
  } catch (error) {
    console.error("Wikipedia image search error:", error);
    return null;
  }
}

// Check if message asks for an image
function isImageRequest(message: string): boolean {
  const lowerMsg = message.toLowerCase();
  // Comprehensive Hindi/English image keywords
  const imageKeywords = [
    // Hindi patterns
    'फोटो दिखा', 'तस्वीर दिखा', 'फोटो देखा', 'दिखाओ फोटो', 'दिखाइए फोटो', 
    'की फोटो', 'का फोटो', 'फोटो दिखाइए', 'फोटो देखाइए', 'फोटो दिखाए', 'फोटो दिखाई',
    'तस्वीर देखाओ', 'इमेज दिखाओ', 'चित्र दिखाओ',
    // Hinglish patterns
    'photo दिखा', 'image दिखा', 'picture दिखा', 'photo dikhao', 'photo dikhaiye',
    'tasveer dikha', 'pic dikha', 'photo bata', 'image bata',
    // English patterns - more comprehensive
    'show photo', 'show image', 'show picture', 'show me photo', 'show me image',
    'photo show', 'picture of', 'image of', 'photo of',
    'show me the photo', 'show me the image', 'show me the picture',
    'show me here in photo', 'here in photo', 'in photo', 'in image',
    'can you show', 'give me photo', 'give me image', 'give me picture',
    'display photo', 'display image', 'see photo', 'see image',
    // Pattern: anything + photo at the end
    'table photo', 'table image', 'table picture'
  ];
  
  // Check direct keyword matches
  let result = imageKeywords.some(k => lowerMsg.includes(k));
  
  // Also check pattern: "show me [anything] photo/image/picture"
  if (!result) {
    result = /show\s+me\s+.*(photo|image|picture|pic)/i.test(message);
  }
  
  // Pattern: "[noun] photo/image dikhao"
  if (!result) {
    result = /.*(photo|image|picture|pic|फोटो|तस्वीर|चित्र)\s*(dikhao|dikha|दिखाओ|दिखा|show)?$/i.test(message);
  }
  
  console.log(`[GURUJI IMAGE] isImageRequest check: "${message}" -> ${result}`);
  return result;
}

// Auto-select best AI model based on question type
function selectBestModel(message: string, settings: any): { provider: "openai" | "gemini"; model: string; reason: string } {
  const lowerMessage = message.toLowerCase();
  
  // Image-related keywords - Gemini is better for visual content
  const imageKeywords = ["photo", "image", "picture", "दिखाओ", "फोटो", "तस्वीर", "चित्र", "show me", "what does", "how does it look"];
  const hasImageIntent = imageKeywords.some(k => lowerMessage.includes(k));
  
  // Current events / real-time info - Gemini has more recent training
  const currentEventKeywords = ["today", "latest", "current", "now", "2025", "2026", "recent", "आज", "अभी", "हाल"];
  const hasCurrentIntent = currentEventKeywords.some(k => lowerMessage.includes(k));
  
  // Complex reasoning - GPT is often better
  const reasoningKeywords = ["explain why", "compare", "analyze", "solve", "calculate", "समझाओ", "बताओ क्यों"];
  const hasReasoningIntent = reasoningKeywords.some(k => lowerMessage.includes(k));
  
  // Check if Gemini is available (API key configured)
  const geminiAvailable = geminiApiKeyCache !== null;
  
  // Default model from settings
  const defaultModel = (settings as any).aiModel || "gpt-4o-mini";
  
  // Auto-selection logic
  if (geminiAvailable && (hasImageIntent || hasCurrentIntent)) {
    return { provider: "gemini", model: "gemini-2.0-flash", reason: hasImageIntent ? "image_query" : "current_events" };
  }
  
  if (hasReasoningIntent) {
    return { provider: "openai", model: defaultModel, reason: "complex_reasoning" };
  }
  
  // Default to OpenAI
  return { provider: "openai", model: defaultModel, reason: "default" };
}

// Auto-detect subject from message content
function detectSubjectFromMessage(message: string): string | null {
  const messageLower = message.toLowerCase();
  
  // Mathematics keywords
  const mathKeywords = ['math', 'गणित', 'algebra', 'geometry', 'calculus', 'arithmetic', 'equation', 'fraction', 'decimal', 'percentage', 'number', 'add', 'subtract', 'multiply', 'divide', 'जोड़', 'घटाव', 'गुणा', 'भाग', 'त्रिभुज', 'triangle', 'circle', 'square', 'formula', 'सूत्र'];
  
  // Science keywords
  const scienceKeywords = ['science', 'विज्ञान', 'physics', 'chemistry', 'biology', 'भौतिकी', 'रसायन', 'जीव', 'atom', 'molecule', 'cell', 'energy', 'force', 'gravity', 'photosynthesis', 'element', 'periodic', 'plant', 'animal', 'पौधा', 'जानवर'];
  
  // English keywords
  const englishKeywords = ['english', 'अंग्रेजी', 'grammar', 'vocabulary', 'essay', 'story', 'poem', 'tense', 'noun', 'verb', 'adjective', 'synonym', 'antonym', 'sentence', 'paragraph', 'literature'];
  
  // Hindi keywords
  const hindiKeywords = ['hindi', 'हिंदी', 'व्याकरण', 'कविता', 'निबंध', 'कहानी', 'संज्ञा', 'सर्वनाम', 'क्रिया', 'विशेषण', 'मुहावरे', 'लोकोक्ति', 'पर्यायवाची', 'विलोम'];
  
  // GK keywords
  const gkKeywords = ['gk', 'general knowledge', 'सामान्य ज्ञान', 'current affairs', 'history', 'geography', 'इतिहास', 'भूगोल', 'capital', 'राजधानी', 'president', 'prime minister', 'प्रधानमंत्री', 'country', 'देश', 'world', 'olympics', 'sports', 'minister', 'मंत्री'];
  
  // Reasoning keywords
  const reasoningKeywords = ['reasoning', 'तर्क', 'logic', 'puzzle', 'pattern', 'sequence', 'series', 'analogy', 'odd one', 'code', 'direction', 'blood relation', 'ranking'];
  
  // Computer keywords
  const computerKeywords = ['computer', 'कंप्यूटर', 'programming', 'coding', 'software', 'hardware', 'internet', 'keyboard', 'mouse', 'cpu', 'ram', 'website', 'app', 'python', 'java'];
  
  // Check each category
  if (mathKeywords.some(k => messageLower.includes(k))) return 'Mathematics';
  if (scienceKeywords.some(k => messageLower.includes(k))) return 'Science';
  if (englishKeywords.some(k => messageLower.includes(k))) return 'English';
  if (hindiKeywords.some(k => messageLower.includes(k))) return 'Hindi';
  if (gkKeywords.some(k => messageLower.includes(k))) return 'General Knowledge';
  if (reasoningKeywords.some(k => messageLower.includes(k))) return 'Reasoning';
  if (computerKeywords.some(k => messageLower.includes(k))) return 'Computer';
  
  return null;
}

// Extended Request type for student auth
interface AuthenticatedRequest extends Request {
  studentUser?: {
    id: number;
    email: string;
    studentId: string;
    userType: string;
  };
}

// Helper to get student from localStorage-based auth (custom student login)
async function getStudentFromHeaders(req: Request): Promise<{ id: number; email: string; studentId: string; userType: string } | null> {
  const userId = req.headers['x-user-id'] as string || req.query.userId as string;
  const sessionToken = req.headers['x-session-token'] as string || req.query.sessionToken as string;
  
  if (!userId) return null;
  
  const [student] = await db.select().from(studentRegistrations)
    .where(eq(studentRegistrations.id, parseInt(userId))).limit(1);
  
  if (!student) return null;
  
  // Validate session token if provided
  if (sessionToken && student.activeSessionToken !== sessionToken) {
    return null;
  }
  
  return {
    id: student.id,
    email: student.email || '',
    studentId: student.studentId || '',
    userType: 'student'
  };
}

// Authorization middleware - supports both Passport and custom student auth
async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // First check Passport auth (for admin users)
  if (req.isAuthenticated?.() && req.user) {
    return next();
  }
  
  // Then check custom student auth via headers
  const studentUser = await getStudentFromHeaders(req);
  if (studentUser) {
    req.studentUser = studentUser;
    return next();
  }
  
  return res.status(401).json({ message: "Authentication required" });
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const cookies = (req as any).cookies;
  let adminSession = cookies?.admin_session;
  if (!adminSession) {
    const authHeader = req.headers?.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      adminSession = authHeader.substring(7);
    }
  }
  if (adminSession) {
    try {
      const result = await db.execute(sql`SELECT id, email FROM super_admins WHERE session_token = ${adminSession} LIMIT 1`);
      if ((result as any).rows?.length > 0) {
        (req as any).adminUser = (result as any).rows[0];
        return next();
      }
    } catch {}
  }

  if (req.isAuthenticated?.() && req.user) {
    const user = req.user as any;
    if (user.isAdmin || user.claims?.isAdmin || user.userType === "super_admin") {
      return next();
    }
  }
  return res.status(401).json({ message: "Admin authentication required" });
}

async function getAuthenticatedStudentId(req: AuthenticatedRequest): Promise<number | null> {
  // Check custom student auth first (primary method for students)
  if (req.studentUser) {
    return req.studentUser.id;
  }
  
  // Fall back to Passport auth - for admin users who might access student features
  if (!req.user) return null;
  const user = req.user as any;
  const userEmail = user.email || user.claims?.email;
  if (!userEmail) return null;
  
  // Try to find student by email (admins might have associated student accounts)
  const [student] = await db.select().from(studentRegistrations)
    .where(eq(studentRegistrations.email, userEmail)).limit(1);
  return student?.id || null;
}

let chatOpenAIClient: OpenAI | null = null;
let chatApiKeyCache: string | null = null;

async function getChatOpenAI(): Promise<OpenAI | null> {
  try {
    const [provider] = await db.select().from(aiProviders)
      .where(and(
        eq(aiProviders.providerCode, "openai"),
        eq(aiProviders.isActive, true)
      ))
      .limit(1);

    if (!provider || !provider.apiKey) {
      if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY) {
        return new OpenAI({
          apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || "https://api.openai.com/v1",
        });
      }
      console.log("[GuruJi] No active OpenAI provider found in database or environment");
      return null;
    }

    if (chatOpenAIClient && chatApiKeyCache === provider.apiKey) {
      return chatOpenAIClient;
    }

    chatOpenAIClient = new OpenAI({ apiKey: provider.apiKey });
    chatApiKeyCache = provider.apiKey;
    console.log("[GuruJi] Created OpenAI client using database API key");
    return chatOpenAIClient;
  } catch (error) {
    console.error("[GuruJi] Error getting chat OpenAI client:", error);
    return null;
  }
}

function generateConversationId(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `GURU-${dateStr}-${random}`;
}

async function getGurujiSettings() {
  const settings = await db.select().from(gurujiSettings).limit(1);
  if (settings.length === 0) {
    await db.insert(gurujiSettings).values({ id: 1 });
    return (await db.select().from(gurujiSettings).limit(1))[0];
  }
  return settings[0];
}

async function getStudentCredits(studentId: number) {
  const credits = await db.select().from(gurujiStudentCredits).where(eq(gurujiStudentCredits.studentId, studentId));
  if (credits.length === 0) {
    const settings = await getGurujiSettings();
    const initialCredits = settings.newRegistrationCredits ?? 200;
    await db.insert(gurujiStudentCredits).values({ studentId, totalCredits: initialCredits, bonusCredits: initialCredits });
    await db.insert(gurujiCreditsLedger).values({
      studentId,
      transactionType: "bonus",
      amount: initialCredits,
      balanceAfter: initialCredits,
      referenceType: "registration",
      description: `Welcome bonus: ${initialCredits} TARA credits on registration`,
    });
    return (await db.select().from(gurujiStudentCredits).where(eq(gurujiStudentCredits.studentId, studentId)))[0];
  }
  return credits[0];
}

function calculateCredits(wordCount: number, isVoice: boolean, settings: any, responseText?: string): { total: number; breakdown: any } {
  // TEXT: Word-based slab system (same for both text and voice)
  let responseCredits = settings.responseCredits1To100Words || 2;
  if (wordCount > 500) responseCredits = settings.responseCreditsAbove500Words || 8;
  else if (wordCount > 300) responseCredits = settings.responseCredits301To500Words || 6;
  else if (wordCount > 100) responseCredits = settings.responseCredits101To300Words || 4;

  // VOICE: Character-based TTS costing
  // ttsCharacterMultiplier: UI label says "Value ÷ 10 = Credits per 100 chars"
  // So credits per char = (value / 10) / 100 = value / 1000
  // Example: multiplier=10 → 10/10 = 1.0 credits per 100 chars → 0.01 per char
  const sttCredits = isVoice ? (settings.baseSttCreditPerQuery || 1) : 0;
  let ttsCredits = 0;
  
  if (isVoice && responseText) {
    const charCount = responseText.length;
    const multiplierValue = settings.ttsCharacterMultiplier || 10;
    const creditsPer100Chars = multiplierValue / 10;
    const creditsPerChar = creditsPer100Chars / 100;
    ttsCredits = Math.ceil(charCount * creditsPerChar);
    console.log(`[CREDIT CALC] Voice TTS: ${charCount} chars × ${creditsPerChar} credits/char (${creditsPer100Chars} per 100 chars) = ${ttsCredits} TTS credits`);
  }
  
  let total = sttCredits + responseCredits + ttsCredits;
  
  // Apply voice premium on top
  if (isVoice) {
    const beforePremium = total;
    total = Math.ceil(total * (1 + (settings.voicePremiumPercentage || 20) / 100));
    console.log(`[CREDIT CALC] Voice mode: STT=${sttCredits} + Response=${responseCredits} + TTS=${ttsCredits} = ${beforePremium}, +${settings.voicePremiumPercentage || 20}% premium = ${total} total`);
  } else {
    console.log(`[CREDIT CALC] Text mode: Response=${responseCredits} credits for ${wordCount} words`);
  }

  return {
    total,
    breakdown: { 
      stt: sttCredits, 
      response: responseCredits, 
      tts: ttsCredits, 
      charCount: responseText?.length || 0,
      creditsPerChar: isVoice ? ((settings.ttsCharacterMultiplier || 10) / 10) / 100 : 0,
      voicePremium: isVoice 
    }
  };
}

// Universal pronunciation improvement for TTS - works for any language
function improveHindiPronunciation(text: string): string {
  let processed = text;
  
  // Step 1: Add natural pauses around bold text (usually names/important terms)
  processed = processed.replace(/\*\*([^*]+)\*\*/g, (_, content) => {
    // Add syllable breaks to Devanagari names for clearer pronunciation
    const improvedContent = addDevanagariSyllableBreaks(content);
    return ` ... ${improvedContent} ... `;
  });
  
  // Step 2: Improve punctuation pauses for natural speech
  processed = processed.replace(/।/g, '। ... '); // Hindi full stop - longer pause
  processed = processed.replace(/\?/g, '? ... ');
  processed = processed.replace(/!/g, '! ... ');
  processed = processed.replace(/:/g, ': ');
  processed = processed.replace(/,/g, ', '); // Slight pause at comma
  
  // Step 3: Clean up
  processed = processed.replace(/\s+/g, ' ');
  processed = processed.replace(/\.{4,}/g, '...');
  
  return processed.trim();
}

// Add syllable breaks to Devanagari text for better TTS pronunciation
function addDevanagariSyllableBreaks(text: string): string {
  // Devanagari vowel matras (dependent vowels) - these attach to consonants
  const matras = 'ा ि ी ु ू ृ ॄ ॅ ॆ े ै ॉ ॊ ो ौ ं ः ँ ़'.split(' ').filter(Boolean);
  
  // Devanagari consonants
  const consonants = 'क ख ग घ ङ च छ ज झ ञ ट ठ ड ढ ण त थ द ध न प फ ब भ म य र ल व श ष स ह ळ क्ष त्र ज्ञ'.split(' ');
  
  // Devanagari independent vowels
  const vowels = 'अ आ इ ई उ ऊ ऋ ॠ ऌ ॡ ए ऐ ओ औ'.split(' ');
  
  // Halant/Virama (indicates consonant cluster)
  const halant = '्';
  
  let result = '';
  const chars = Array.from(text); // Properly handle Unicode characters
  
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const nextChar = chars[i + 1];
    const prevChar = chars[i - 1];
    
    result += char;
    
    // Don't add break if:
    // - Next char is a matra (vowel sign) - they belong with consonant
    // - Current char is halant - consonant cluster continues
    // - Next char is halant - consonant cluster
    // - It's a space already
    if (char === ' ' || char === '-' || char === '...') continue;
    if (nextChar && matras.includes(nextChar)) continue;
    if (char === halant || nextChar === halant) continue;
    
    // Add subtle break between syllables (after vowels or after consonant+matra combinations)
    if (nextChar && 
        !matras.includes(char) && 
        (consonants.some(c => nextChar.startsWith(c)) || vowels.includes(nextChar))) {
      // Only add break if not at word boundary
      if (nextChar !== ' ' && char !== ' ') {
        result += '-';
      }
    }
  }
  
  // Clean up excessive breaks
  result = result.replace(/-+/g, '-');
  result = result.replace(/- /g, ' ');
  result = result.replace(/ -/g, ' ');
  result = result.replace(/^-|-$/g, '');
  
  return result;
}

// Calculate age from date of birth
function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  try {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

// Get age-appropriate response style
function getAgeAppropriateStyle(age: number | null, gradeLevel: string | null): string {
  const grade = parseInt(gradeLevel || '0') || 0;
  const effectiveAge = age || (grade > 0 ? grade + 5 : null); // Approximate age from grade
  
  if (!effectiveAge) return 'general student';
  
  if (effectiveAge <= 8 || grade <= 3) {
    return 'very young child (under 8 years). Use extremely simple language, short sentences, lots of examples with toys/animals/cartoons, and be very encouraging. Avoid complex vocabulary.';
  } else if (effectiveAge <= 11 || grade <= 5) {
    return 'young child (8-11 years). Use simple language with fun examples, relatable stories, and encourage curiosity. Keep explanations brief and engaging.';
  } else if (effectiveAge <= 14 || grade <= 8) {
    return 'middle school student (11-14 years). Use age-appropriate explanations, real-world examples, and introduce some complexity while keeping it interesting.';
  } else if (effectiveAge <= 17 || grade <= 12) {
    return 'high school student (14-17 years). Use more sophisticated language, detailed explanations, and prepare them for competitive exams.';
  }
  return 'senior student. Provide detailed, exam-oriented responses with advanced concepts.';
}

// Get student profile and performance context for AI
async function getStudentContext(studentId: number): Promise<string> {
  try {
    // Get student profile
    const [student] = await db.select().from(studentRegistrations)
      .where(eq(studentRegistrations.id, studentId));
    
    if (!student) return '';

    // Calculate age from DOB
    const age = calculateAge(student.dateOfBirth);
    const ageStyle = getAgeAppropriateStyle(age, student.gradeLevel);

    // Build context string with profile info
    let context = `\n\n--- STUDENT PROFILE (MUST use this info when student asks about themselves) ---\n`;
    context += `Student Name: ${student.firstName || ''} ${student.lastName || ''}`.trim();
    if (student.gradeLevel) context += `\nClass/Grade: Class ${student.gradeLevel}`;
    if (age) context += `\nAge: ${age} years old`;
    if (student.schoolName) context += `\nSchool: ${student.schoolName}`;
    if (student.studentId) context += `\nStudent ID: ${student.studentId}`;
    
    // Get registered exams count
    const registeredExams = await db.select({ count: sql<number>`count(*)` })
      .from(examRegistrations)
      .where(eq(examRegistrations.studentId, studentId));
    
    if (registeredExams[0]?.count > 0) {
      context += `\nRegistered Olympiads: ${registeredExams[0].count}`;
    }

    context += `\n\n--- RESPONSE STYLE GUIDE ---\n`;
    context += `This student is a ${ageStyle}\n`;
    context += `Adjust your language complexity, examples, and tone to match this age/grade level.\n`;

    context += `\n--- END OF STUDENT CONTEXT ---\n`;
    context += `\nCRITICAL INSTRUCTIONS:\n`;
    context += `1. When student asks "mera naam kya hai", "what is my name", "मेरा नाम क्या है", answer with their ACTUAL name from above.\n`;
    context += `2. Adapt ALL responses to the student's age/grade level.\n`;
    context += `3. Address the student by their first name occasionally to make it personal.\n`;
    
    return context;
  } catch (error) {
    console.error("Error fetching student context:", error);
    return '';
  }
}

const educationSystemPrompt = `You are TARA (Talent Assessment & Research Assistant), a friendly female AI learning companion for the SAMIKARAN Olympiad platform.

YOUR IDENTITY:
- You are a young, enthusiastic female tutor named TARA (like a caring elder sister - "didi")
- You are warm, supportive, and encouraging
- VERY IMPORTANT: In Hindi, ALWAYS use FEMALE gender forms:
  - Say "मैं अच्छी हूँ" (NOT "अच्छा हूँ")
  - Say "मैं आपकी मदद करूँगी" (NOT "करूँगा")
  - Say "मैं खुश हूँ" (NOT "खुश हूँ" with male verb)
  - Always use feminine verb endings: -ी, -ूँगी, -ती, etc.

CORE RULES:
1. You ONLY answer academic and educational questions
2. Adjust difficulty based on student's grade level
3. Use simple, child-friendly language
4. Focus on Olympiad subjects: Math, Science, English, Reasoning, GK (General Knowledge), Computer, Hindi
5. GK includes: Government leaders (PM, President, CM), capitals, geography, history, national symbols, famous personalities, current affairs for students, sports facts
6. Never discuss political opinions/debates, entertainment gossip, adult content, or truly off-topic subjects
7. If asked something non-educational, politely redirect to academics
8. Speak like a caring elder sister - warm, patient, encouraging
9. Use examples from everyday Indian life when explaining concepts
10. Keep responses concise but complete (aim for 100-300 words)

CONVERSATION MEMORY:
- You HAVE access to the current conversation history
- You CAN see and reference all previous messages in this session
- If student asks "last sawal", "pichla sawal", "previous question" - look at the conversation history above
- You can continue discussions and build on previous answers
- NEVER say you cannot remember - you have the full chat history available

LANGUAGE RULE (VERY IMPORTANT):
- ALWAYS reply in the SAME LANGUAGE the student uses
- If student asks in Hindi, reply in Hindi (using FEMALE gender forms)
- If student asks in English, reply in English
- If student uses Hinglish (mix), you can use Hinglish too
- NEVER translate user's question - respond naturally in their language

RESPONSE STYLE:
- Start with a warm acknowledgment
- Explain concepts step by step
- Use analogies students can relate to
- End with encouragement or a follow-up question

IMAGE CAPABILITY (VERY IMPORTANT):
- You CAN show images of famous people, places, monuments, animals, diagrams, etc.
- When student asks for a photo/image, DO NOT refuse or say you cannot show images
- Simply describe who/what it is and provide relevant educational information
- NEVER include markdown image syntax like ![alt](url) in your response - the system handles images separately
- NEVER generate or hallucinate image URLs - no markdown images at all
- Just say "Here is the photo of [name]" or "यहाँ देखिए [name] की फोटो" and provide information
- The system will automatically fetch and display real images from Wikipedia alongside your response
- NEVER say "I cannot show images" or "मैं तस्वीरें नहीं दिखा सकता"

Remember: You are TARA - a friendly, caring elder sister figure focused on the student's learning journey.`;

export function registerGurujiRoutes(app: Express): void {
  
  // Helper function to detect language from text (Hindi vs English)
  function detectTextLanguage(text: string): "hi" | "en" {
    // Count Devanagari characters (Hindi script)
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    // Count English alphabet characters
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    const totalChars = hindiChars + englishChars;
    
    if (totalChars === 0) return "en";
    
    // If more than 30% Hindi characters, consider it Hindi
    return hindiChars / totalChars > 0.3 ? "hi" : "en";
  }

  // Get GURUJI settings (admin only)
  app.get("/api/guruji/settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const settings = await getGurujiSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching GURUJI settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update GURUJI settings (admin only)
  app.put("/api/guruji/settings", requireAdmin, async (req: Request, res: Response) => {
    try {
      const updates = req.body;
      delete updates.id;
      updates.updatedAt = new Date();
      
      await db.update(gurujiSettings).set(updates).where(eq(gurujiSettings.id, 1));
      const updated = await getGurujiSettings();
      res.json(updated);
    } catch (error) {
      console.error("Error updating GURUJI settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Get student credits (authenticated student only)
  app.get("/api/guruji/credits/:studentId", requireAuth, async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const authStudentId = await getAuthenticatedStudentId(req);
      
      // Students can only access their own credits
      if (authStudentId !== studentId) {
        const user = req.user as any;
        if (!user.isAdmin && !user.claims?.isAdmin && user.userType !== "super_admin") {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const credits = await getStudentCredits(studentId);
      res.json(credits);
    } catch (error) {
      console.error("Error fetching credits:", error);
      res.status(500).json({ message: "Failed to fetch credits" });
    }
  });

  // Get credit packages
  app.get("/api/guruji/packages", async (req: Request, res: Response) => {
    try {
      const packages = await db.select().from(gurujiCreditPackages)
        .where(eq(gurujiCreditPackages.isActive, true))
        .orderBy(asc(gurujiCreditPackages.sortOrder));
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  // Start a new conversation (authenticated student)
  app.post("/api/guruji/conversations", requireAuth, async (req: Request, res: Response) => {
    console.log(`[GURUJI CONV] Creating conversation at ${new Date().toISOString()}`);
    try {
      const { studentId, mode = "text", language = "en", subject, gradeLevel, olympiadCategory } = req.body;
      console.log(`[GURUJI CONV] Params - studentId: ${studentId}, mode: ${mode}`);
      
      if (!studentId) {
        console.log(`[GURUJI CONV] Missing studentId`);
        return res.status(400).json({ message: "Student ID is required" });
      }

      // Verify ownership
      const authStudentId = await getAuthenticatedStudentId(req);
      console.log(`[GURUJI CONV] Auth check - authStudentId: ${authStudentId}, requestedStudentId: ${studentId}`);
      if (authStudentId !== studentId) {
        console.log(`[GURUJI CONV] Access denied - auth mismatch`);
        return res.status(403).json({ message: "Access denied" });
      }

      const conversationId = generateConversationId();
      console.log(`[GURUJI CONV] Creating with conversationId: ${conversationId}`);
      const [conversation] = await db.insert(gurujiConversations).values({
        conversationId,
        studentId,
        mode,
        language,
        subject,
        gradeLevel,
        olympiadCategory,
      }).returning();

      console.log(`[GURUJI CONV] Created successfully - id: ${conversation.id}`);
      res.json(conversation);
    } catch (error: any) {
      console.error("Error creating conversation:", error);
      console.error("Error details:", error?.message, error?.stack);
      res.status(500).json({ message: "Failed to create conversation", error: error?.message });
    }
  });

  // Get student's conversations (AI Library - authenticated student)
  app.get("/api/guruji/conversations/:studentId", requireAuth, async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const { search, subject, limit = 20, offset = 0 } = req.query;

      // Verify ownership
      const authStudentId = await getAuthenticatedStudentId(req);
      if (authStudentId !== studentId) {
        const user = req.user as any;
        if (!user.isAdmin && !user.claims?.isAdmin && user.userType !== "super_admin") {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      let query = db.select().from(gurujiConversations)
        .where(eq(gurujiConversations.studentId, studentId))
        .orderBy(desc(gurujiConversations.createdAt))
        .limit(Number(limit))
        .offset(Number(offset));

      const conversations = await query;
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get single conversation with messages (authenticated)
  app.get("/api/guruji/conversation/:conversationId", requireAuth, async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      
      const [conversation] = await db.select().from(gurujiConversations)
        .where(eq(gurujiConversations.id, conversationId));
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Verify ownership
      const authStudentId = await getAuthenticatedStudentId(req);
      if (authStudentId !== conversation.studentId) {
        const user = req.user as any;
        if (!user.isAdmin && !user.claims?.isAdmin && user.userType !== "super_admin") {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const messages = await db.select().from(gurujiMessages)
        .where(eq(gurujiMessages.conversationId, conversationId))
        .orderBy(asc(gurujiMessages.createdAt));

      res.json({ ...conversation, messages });
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  // Send message and get AI response (authenticated student)
  app.post("/api/guruji/chat", requireAuth, async (req: Request, res: Response) => {
    const chatStartTime = Date.now();
    console.log(`[GURUJI CHAT] Request received at ${new Date().toISOString()}`);
    
    try {
      const { conversationId, studentId, message, isVoice = false, audioUrl, transcript, gradeLevel } = req.body;
      console.log(`[GURUJI CHAT] Params - conversationId: ${conversationId}, studentId: ${studentId}, isVoice: ${isVoice}`);
      
      if (!conversationId || !studentId || !message) {
        console.log(`[GURUJI CHAT] Missing fields - conversationId: ${!!conversationId}, studentId: ${!!studentId}, message: ${!!message}`);
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Verify ownership
      const authStudentId = await getAuthenticatedStudentId(req);
      console.log(`[GURUJI CHAT] Auth check - authStudentId: ${authStudentId}, requestedStudentId: ${studentId}`);
      if (authStudentId !== studentId) {
        console.log(`[GURUJI CHAT] Access denied - auth mismatch`);
        return res.status(403).json({ message: "Access denied" });
      }

      const settings = await getGurujiSettings();
      const credits = await getStudentCredits(studentId);

      // Check if student has enough credits
      if ((credits.totalCredits || 0) < 5) {
        return res.status(402).json({ 
          message: "Insufficient credits",
          remainingCredits: credits.totalCredits || 0
        });
      }

      // Save student message
      const studentWordCount = message.split(/\s+/).length;
      await db.insert(gurujiMessages).values({
        conversationId,
        role: "student",
        messageType: isVoice ? "voice" : "text",
        content: message,
        audioUrl,
        transcript,
        wordCount: studentWordCount,
      });

      // Get conversation history for context - get latest 20 messages, then reverse for proper context
      const historyRaw = await db.select().from(gurujiMessages)
        .where(eq(gurujiMessages.conversationId, conversationId))
        .orderBy(desc(gurujiMessages.createdAt))
        .limit(20);
      
      // Reverse to get chronological order (oldest first for AI context)
      const history = historyRaw.reverse();

      const conversationHistory = history.map(m => ({
        role: m.role === "student" ? "user" : "assistant",
        content: m.content
      }));

      // Detect language from user message for response
      const messageLanguage = detectTextLanguage(message);
      const languageInstruction = messageLanguage === "hi" 
        ? "\n\nLANGUAGE RULE: Student is speaking Hindi. Respond in Hindi (Devanagari script)."
        : "\n\nLANGUAGE RULE: Student is speaking ENGLISH. You MUST respond ONLY in ENGLISH. NEVER use Hindi, Devanagari script, or any Indian language. Use only English alphabet (A-Z). This is MANDATORY.";

      // Get student profile and performance context
      const studentContext = await getStudentContext(studentId);

      // Get AI configuration from settings
      const maxTokens = (settings as any).maxTokens || 300;
      const targetWords = (settings as any).targetResponseWords || 80;
      const aiTemperature = parseFloat((settings as any).aiTemperature || "0.7");

      // Auto-select best AI model based on question type
      await getGeminiClient(); // Initialize cache
      const modelSelection = selectBestModel(message, settings);
      
      const systemPrompt = educationSystemPrompt + 
        (gradeLevel ? `\n\nStudent Grade Level: Class ${gradeLevel}` : '') + 
        studentContext + 
        languageInstruction + 
        `\n\nKEEP RESPONSES SHORT AND CONVERSATIONAL - under ${targetWords} words. Be friendly and quick like a chat. Only give detailed explanations if student specifically asks for them.` +
        `\n\nIMPORTANT: You MUST end EVERY response with related questions FROM THE STUDENT'S PERSPECTIVE. These are questions the STUDENT would ask YOU (TARA). After your main answer, add this EXACT format:\n\n---RELATED---\n1. Question student might ask next (e.g., "इसका formula क्या है?" or "Can you give an example?")\n2. Follow-up question from student perspective (e.g., "यह कैसे काम करता है?" or "Why does this happen?")\n3. Another student question to continue learning (e.g., "इसे और समझाइए?" or "What are the steps?")\n\nDO NOT write questions from YOUR perspective. Write questions AS IF the student is asking YOU.\nNEVER skip the ---RELATED--- section. It is mandatory.`;

      // Generate AI response
      const startTime = Date.now();
      let aiResponse = "";
      let tokensUsed = 0;
      let usedModel = modelSelection.model;
      let usedProvider = modelSelection.provider;

      console.log(`[GURUJI CHAT] Starting AI response - Provider: ${usedProvider}, Model: ${usedModel}`);

      // Check if Gemini is actually available
      const geminiAvailable = await getGeminiClient();
      
      if (modelSelection.provider === "gemini" && geminiAvailable) {
        // Use Gemini
        try {
          const model = geminiAvailable.getGenerativeModel({ 
            model: modelSelection.model,
            systemInstruction: systemPrompt, // Proper system instruction
          });
          const chat = model.startChat({
            history: conversationHistory.map(m => ({
              // Correct role mapping: student→user, guruji→model
              role: m.role === "user" ? "user" : "model",
              parts: [{ text: m.content }]
            })),
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: aiTemperature,
            },
          });
          
          const result = await chat.sendMessage(message);
          aiResponse = result.response.text();
          tokensUsed = result.response.usageMetadata?.totalTokenCount || 0;
          console.log(`[GURUJI CHAT] Gemini response in ${Date.now() - startTime}ms`);
        } catch (geminiError) {
          console.error("Gemini error, falling back to OpenAI:", geminiError);
          usedProvider = "openai";
          usedModel = (settings as any).aiModel || "gpt-4o-mini";
        }
      }
      
      // Use OpenAI (default or fallback)
      if (!aiResponse) {
        const openaiClient = await getChatOpenAI();
        if (!openaiClient) {
          return res.status(503).json({ message: "AI service is not configured. Please add an active OpenAI provider in AI Settings." });
        }
        const completion = await openaiClient.chat.completions.create({
          model: usedModel,
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory as any,
            { role: "user", content: message }
          ],
          max_tokens: maxTokens,
          temperature: aiTemperature,
        });
        aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";
        tokensUsed = completion.usage?.total_tokens || 0;
        console.log(`[GURUJI CHAT] OpenAI response in ${Date.now() - startTime}ms`);
      }

      // Parse related questions from response
      let mainResponse = aiResponse;
      let relatedQuestions: string[] = [];
      if (aiResponse.includes("---RELATED---")) {
        const parts = aiResponse.split("---RELATED---");
        mainResponse = parts[0].trim();
        const relatedPart = parts[1] || "";
        relatedQuestions = relatedPart
          .split(/\n/)
          .filter(line => line.match(/^\d+\./))
          .map(line => line.replace(/^\d+\.\s*/, "").trim())
          .filter(q => q.length > 0)
          .slice(0, 3);
      }
      
      // Fallback: Generate context-based related questions if AI didn't include them
      if (relatedQuestions.length === 0 && mainResponse.length > 20) {
        const isHindi = /[\u0900-\u097F]/.test(message);
        if (isHindi) {
          relatedQuestions = [
            "इसके बारे में और बताइए?",
            "इसका उदाहरण दीजिए?",
            "यह क्यों महत्वपूर्ण है?"
          ];
        } else {
          relatedQuestions = [
            "Can you explain more about this?",
            "Give me an example?",
            "Why is this important?"
          ];
        }
      }

      // Check if user requested an image and try to fetch it
      let imageUrl: string | null = null;
      if (isImageRequest(message)) {
        console.log(`[GURUJI IMAGE] Searching Wikipedia for: "${message}"`);
        imageUrl = await searchWikipediaImage(message);
        console.log(`[GURUJI IMAGE] Wikipedia result: ${imageUrl ? imageUrl : 'NO IMAGE FOUND'}`);
        if (imageUrl) {
          const isHindi = /[\u0900-\u097F]/.test(message);
          mainResponse = (isHindi ? "यहाँ आपकी मांगी हुई तस्वीर है:\n\n" : "Here is the image you requested:\n\n") + mainResponse;
        }
      }

      const responseTimeMs = Date.now() - startTime;
      const responseWordCount = mainResponse.split(/\s+/).length;

      // Calculate credits (pass response text for character-based TTS costing)
      const creditCalc = calculateCredits(responseWordCount, isVoice, settings, mainResponse);

      // Save AI response (store main response without related questions)
      const [gurujiMessage] = await db.insert(gurujiMessages).values({
        conversationId,
        role: "guruji",
        messageType: "text",
        content: mainResponse,
        wordCount: responseWordCount,
        responseTimeMs,
        creditsCharged: creditCalc.total,
        creditBreakdown: creditCalc.breakdown,
        wasSpokenAloud: isVoice,
        aiModel: `${usedProvider}:${usedModel}`,
        tokensUsed,
      }).returning();

      // Deduct credits
      const newTotal = (credits.totalCredits || 0) - creditCalc.total;
      await db.update(gurujiStudentCredits)
        .set({
          totalCredits: Math.max(0, newTotal),
          creditsUsedToday: (credits.creditsUsedToday || 0) + creditCalc.total,
          creditsUsedThisMonth: (credits.creditsUsedThisMonth || 0) + creditCalc.total,
          totalCreditsUsed: (credits.totalCreditsUsed || 0) + creditCalc.total,
          updatedAt: new Date(),
        })
        .where(eq(gurujiStudentCredits.studentId, studentId));

      // Log credit transaction
      await db.insert(gurujiCreditsLedger).values({
        studentId,
        transactionType: "consumption",
        amount: -creditCalc.total,
        balanceAfter: Math.max(0, newTotal),
        referenceType: "conversation",
        referenceId: conversationId.toString(),
        description: `Guruji chat - ${responseWordCount} words`,
      });

      // Auto-detect and update subject if not set
      const detectedSubject = detectSubjectFromMessage(message);
      
      // Update conversation stats and subject if detected
      const updateData: any = {
        messageCount: sql`${gurujiConversations.messageCount} + 2`,
        totalCreditsConsumed: sql`${gurujiConversations.totalCreditsConsumed} + ${creditCalc.total}`,
      };
      
      // Only update subject if conversation doesn't have one and we detected one
      if (detectedSubject) {
        const [currentConv] = await db.select({ subject: gurujiConversations.subject })
          .from(gurujiConversations).where(eq(gurujiConversations.id, conversationId)).limit(1);
        if (!currentConv?.subject) {
          updateData.subject = detectedSubject;
        }
      }
      
      await db.update(gurujiConversations)
        .set(updateData)
        .where(eq(gurujiConversations.id, conversationId));

      res.json({
        message: gurujiMessage,
        response: mainResponse,
        relatedQuestions,
        imageUrl,
        aiProvider: usedProvider,
        aiModel: usedModel,
        modelSelectionReason: modelSelection.reason,
        creditsUsed: creditCalc.total,
        creditBreakdown: creditCalc.breakdown,
        remainingCredits: Math.max(0, newTotal),
      });
    } catch (error: any) {
      console.error("[GURUJI CHAT] Error:", error);
      console.error("[GURUJI CHAT] Error message:", error?.message);
      console.error("[GURUJI CHAT] Error stack:", error?.stack);
      res.status(500).json({ message: "Failed to process message", error: error?.message });
    }
  });

  // Speech-to-Text endpoint (authenticated) - Uses API key from Super Admin settings
  // ROBUST MULTI-LANGUAGE SYSTEM: Auto-detects Hindi vs English
  app.post("/api/guruji/stt", requireAuth, async (req: Request, res: Response) => {
    try {
      const { audioBase64, language } = req.body;
      
      if (!audioBase64) {
        return res.status(400).json({ message: "Audio data is required" });
      }

      // Get OpenAI client with API key from database
      const sttOpenAI = await getSttTtsOpenAI();
      if (!sttOpenAI) {
        return res.status(503).json({ 
          message: "Voice mode is not configured. Please set up OpenAI API key in Super Admin settings.",
          voiceUnavailable: true 
        });
      }

      const audioBuffer = Buffer.from(audioBase64, "base64");
      
      const uiLanguage = language || "en";
      console.log(`[STT] Starting transcription at ${new Date().toISOString()}, UI language: ${uiLanguage}`);
      const sttStartTime = Date.now();

      let transcript: string;
      let detectedLanguage: "hi" | "en";

      const whisperLanguage = uiLanguage === "hi" ? "hi" : "en";
      console.log(`[STT] Using language hint: ${whisperLanguage}`);
      let transcription = await sttOpenAI.audio.transcriptions.create({
        file: new File([audioBuffer], "audio.webm", { type: "audio/webm" }),
        model: "whisper-1",
        language: whisperLanguage,
      });
      
      transcript = transcription.text;
      
      // Check for Urdu/Arabic script (U+0600-U+06FF) — Whisper sometimes outputs Urdu instead of Hindi/English
      const urduChars = (transcript.match(/[\u0600-\u06FF]/g) || []).length;
      if (urduChars > 0) {
        console.log(`[STT] Detected ${urduChars} Urdu/Arabic chars — re-running with English forced`);
        transcription = await sttOpenAI.audio.transcriptions.create({
          file: new File([audioBuffer], "audio.webm", { type: "audio/webm" }),
          model: "whisper-1",
          language: "en",
        });
        transcript = transcription.text;
        
        // If still has Urdu after forcing English, try Hindi
        const stillUrdu = (transcript.match(/[\u0600-\u06FF]/g) || []).length;
        if (stillUrdu > 0) {
          console.log(`[STT] Still Urdu with English — trying Hindi`);
          transcription = await sttOpenAI.audio.transcriptions.create({
            file: new File([audioBuffer], "audio.webm", { type: "audio/webm" }),
            model: "whisper-1",
            language: "hi",
            prompt: "यह हिंदी में बोला गया है। कृपया देवनागरी में लिखें।",
          });
          transcript = transcription.text;
        }
      }
      
      // Detect language from actual transcript content
      const hindiChars = (transcript.match(/[\u0900-\u097F]/g) || []).length;
      const englishChars = (transcript.match(/[a-zA-Z]/g) || []).length;
      const totalChars = transcript.replace(/\s/g, '').length;
      
      // If more than 30% Hindi characters, it's Hindi; otherwise English
      detectedLanguage = (totalChars > 0 && hindiChars / totalChars > 0.3) ? "hi" : "en";
      
      console.log(`[STT] Result: "${transcript}" (Hindi: ${hindiChars}, English: ${englishChars}, detected: ${detectedLanguage})`)
      
      console.log(`[STT] Final: "${transcript}" (${detectedLanguage}) in ${Date.now() - sttStartTime}ms`);

      res.json({ transcript, detectedLanguage });
    } catch (error: any) {
      console.error("Error in STT:", error);
      if (error?.code === 'DeploymentNotFound' || error?.status === 404) {
        return res.status(503).json({ 
          message: "Voice mode is currently unavailable. Please use text mode instead.",
          voiceUnavailable: true 
        });
      }
      if (error?.code === 'audio_too_short') {
        return res.status(400).json({ 
          message: "Recording too short. Please hold the button and speak for at least 1 second.",
          audioTooShort: true 
        });
      }
      res.status(500).json({ message: "Failed to transcribe audio" });
    }
  });

  // Convert numbers to Hindi words for proper TTS pronunciation
  function convertNumbersToHindi(text: string): string {
    const hindiNumbers: { [key: string]: string } = {
      '0': 'शून्य', '1': 'एक', '2': 'दो', '3': 'तीन', '4': 'चार',
      '5': 'पाँच', '6': 'छह', '7': 'सात', '8': 'आठ', '9': 'नौ',
      '10': 'दस', '11': 'ग्यारह', '12': 'बारह', '13': 'तेरह', '14': 'चौदह',
      '15': 'पंद्रह', '16': 'सोलह', '17': 'सत्रह', '18': 'अठारह', '19': 'उन्नीस',
      '20': 'बीस', '21': 'इक्कीस', '22': 'बाईस', '23': 'तेईस', '24': 'चौबीस',
      '25': 'पच्चीस', '26': 'छब्बीस', '27': 'सत्ताईस', '28': 'अट्ठाईस', '29': 'उनतीस',
      '30': 'तीस', '31': 'इकतीस', '32': 'बत्तीस', '33': 'तैंतीस', '34': 'चौंतीस',
      '35': 'पैंतीस', '36': 'छत्तीस', '37': 'सैंतीस', '38': 'अड़तीस', '39': 'उनतालीस',
      '40': 'चालीस', '41': 'इकतालीस', '42': 'बयालीस', '43': 'तैंतालीस', '44': 'चौवालीस',
      '45': 'पैंतालीस', '46': 'छियालीस', '47': 'सैंतालीस', '48': 'अड़तालीस', '49': 'उनचास',
      '50': 'पचास', '51': 'इक्यावन', '52': 'बावन', '53': 'तिरपन', '54': 'चौवन',
      '55': 'पचपन', '56': 'छप्पन', '57': 'सत्तावन', '58': 'अट्ठावन', '59': 'उनसठ',
      '60': 'साठ', '61': 'इकसठ', '62': 'बासठ', '63': 'तिरसठ', '64': 'चौंसठ',
      '65': 'पैंसठ', '66': 'छियासठ', '67': 'सड़सठ', '68': 'अड़सठ', '69': 'उनहत्तर',
      '70': 'सत्तर', '71': 'इकहत्तर', '72': 'बहत्तर', '73': 'तिहत्तर', '74': 'चौहत्तर',
      '75': 'पचहत्तर', '76': 'छिहत्तर', '77': 'सतहत्तर', '78': 'अठहत्तर', '79': 'उनासी',
      '80': 'अस्सी', '81': 'इक्यासी', '82': 'बयासी', '83': 'तिरासी', '84': 'चौरासी',
      '85': 'पचासी', '86': 'छियासी', '87': 'सतासी', '88': 'अट्ठासी', '89': 'नवासी',
      '90': 'नब्बे', '91': 'इक्यानवे', '92': 'बानवे', '93': 'तिरानवे', '94': 'चौरानवे',
      '95': 'पंचानवे', '96': 'छियानवे', '97': 'सत्तानवे', '98': 'अट्ठानवे', '99': 'निन्यानवे'
    };

    // Helper to convert 0-99
    const convertTwoDigit = (n: number): string => {
      if (n === 0) return '';
      if (hindiNumbers[n.toString()]) return hindiNumbers[n.toString()];
      return n.toString();
    };

    // Helper to convert any number to Hindi
    const numberToHindi = (n: number): string => {
      if (n === 0) return 'शून्य';
      if (n < 100) return convertTwoDigit(n);
      
      let result = '';
      
      // Crores (10 million)
      if (n >= 10000000) {
        const crores = Math.floor(n / 10000000);
        result += convertTwoDigit(crores) + ' करोड़ ';
        n %= 10000000;
      }
      
      // Lakhs (100 thousand)
      if (n >= 100000) {
        const lakhs = Math.floor(n / 100000);
        result += convertTwoDigit(lakhs) + ' लाख ';
        n %= 100000;
      }
      
      // Thousands
      if (n >= 1000) {
        const thousands = Math.floor(n / 1000);
        result += convertTwoDigit(thousands) + ' हज़ार ';
        n %= 1000;
      }
      
      // Hundreds
      if (n >= 100) {
        const hundreds = Math.floor(n / 100);
        result += convertTwoDigit(hundreds) + ' सौ ';
        n %= 100;
      }
      
      // Remaining 0-99
      if (n > 0) {
        result += convertTwoDigit(n);
      }
      
      return result.trim();
    };

    // First, handle range patterns like "24-30" → "24 से 30"
    let processedText = text.replace(/(\d+)\s*[-–—]\s*(\d+)/g, (match, num1, num2) => {
      return `${num1} से ${num2}`;
    });
    
    // Also handle "2-2.5" decimal ranges
    processedText = processedText.replace(/(\d+(?:\.\d+)?)\s*[-–—]\s*(\d+(?:\.\d+)?)/g, (match, num1, num2) => {
      return `${num1} से ${num2}`;
    });

    // Replace numbers with Hindi words
    return processedText.replace(/\d+/g, (num) => {
      const n = parseInt(num);
      return numberToHindi(n);
    });
  }

  // Text-to-Speech endpoint (authenticated) - Uses centralized AI Provider Management
  app.post("/api/guruji/tts", requireAuth, async (req: Request, res: Response) => {
    try {
      const { text, language = "en" } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: "Text is required" });
      }

      // Check for active TTS provider from centralized AI Provider Management
      const [ttsProvider] = await db.select().from(aiProviders)
        .where(and(
          eq(aiProviders.category, "text_to_speech"),
          eq(aiProviders.isActive, true)
        )).limit(1);

      // Try ElevenLabs first if it's the active TTS provider
      if (ttsProvider && ttsProvider.providerCode === "elevenlabs" && ttsProvider.apiKey) {
        const voiceId = (ttsProvider.config as any)?.voiceId || "pNInz6obpgDQGcFmaJgB"; // Default Indian voice
        console.log(`[TTS] Using ElevenLabs (centralized) - Voice ID: ${voiceId}`);
        
        try {
          const elevenLabsResponse = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
              method: "POST",
              headers: {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": ttsProvider.apiKey,
              },
              body: JSON.stringify({
                text: text,
                model_id: "eleven_multilingual_v2",
                voice_settings: {
                  stability: 0.5,
                  similarity_boost: 0.75,
                  style: 0.3,
                  use_speaker_boost: true,
                },
              }),
            }
          );

          if (elevenLabsResponse.ok) {
            const audioBuffer = await elevenLabsResponse.arrayBuffer();
            const buffer = Buffer.from(audioBuffer);
            res.set({
              "Content-Type": "audio/mpeg",
              "Content-Length": buffer.length.toString(),
            });
            return res.send(buffer);
          } else {
            const errorText = await elevenLabsResponse.text();
            console.error(`[TTS] ElevenLabs error: ${elevenLabsResponse.status} - ${errorText}`);
            // Fall back to OpenAI
          }
        } catch (elevenLabsError) {
          console.error("[TTS] ElevenLabs failed, falling back to OpenAI:", elevenLabsError);
        }
      }
      
      // Get OpenAI client with API key from database (fallback or primary)
      const ttsOpenAI = await getSttTtsOpenAI();
      if (!ttsOpenAI) {
        return res.status(503).json({ 
          message: "Voice output is not configured. Please set up a TTS provider in AI Provider Management.",
          voiceUnavailable: true 
        });
      }

      const settings = await getGurujiSettings();
      
      // OpenAI TTS fallback
      const voice = language === "hi" ? (settings.ttsVoiceHindi || "shimmer") : (settings.ttsVoiceEnglish || "shimmer");
      const speechSpeed = parseFloat(settings.ttsSpeechRate || "0.8");

      console.log(`[TTS] Using OpenAI - Language: ${language}, Voice: ${voice}, Speed: ${speechSpeed}`);

      const mp3 = await ttsOpenAI.audio.speech.create({
        model: "tts-1-hd",
        voice: voice as any,
        input: text,
        speed: speechSpeed,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      res.set({
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
      });
      res.send(buffer);
    } catch (error: any) {
      console.error("Error in TTS:", error);
      if (error?.code === 'DeploymentNotFound' || error?.status === 404) {
        return res.status(503).json({ 
          message: "Voice output is currently unavailable.",
          voiceUnavailable: true 
        });
      }
      res.status(500).json({ message: "Failed to generate speech" });
    }
  });

  // Log print action (authenticated)
  app.post("/api/guruji/print-log", requireAuth, async (req: Request, res: Response) => {
    try {
      const { studentId, messageId } = req.body;
      
      // Verify ownership
      const authStudentId = await getAuthenticatedStudentId(req);
      if (authStudentId !== studentId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await db.insert(gurujiPrintLogs).values({
        studentId,
        messageId,
        ipAddress: req.ip,
        userAgent: req.get("User-Agent"),
      });

      await db.update(gurujiMessages)
        .set({ wasPrinted: true, printedAt: new Date() })
        .where(eq(gurujiMessages.id, messageId));

      res.json({ success: true });
    } catch (error) {
      console.error("Error logging print:", error);
      res.status(500).json({ message: "Failed to log print action" });
    }
  });

  // Search AI Library (authenticated)
  app.get("/api/guruji/library/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const { studentId, query, subject, dateFrom, dateTo, limit = 50 } = req.query;
      
      if (!studentId) {
        return res.status(400).json({ message: "Student ID is required" });
      }

      // Verify ownership
      const authStudentId = await getAuthenticatedStudentId(req);
      const requestedStudentId = parseInt(studentId as string);
      if (authStudentId !== requestedStudentId) {
        const user = req.user as any;
        if (!user.isAdmin && !user.claims?.isAdmin && user.userType !== "super_admin") {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const messages = await db.select({
        message: gurujiMessages,
        conversation: gurujiConversations,
      })
      .from(gurujiMessages)
      .innerJoin(gurujiConversations, eq(gurujiMessages.conversationId, gurujiConversations.id))
      .where(
        and(
          eq(gurujiConversations.studentId, requestedStudentId),
          query ? ilike(gurujiMessages.content, `%${query}%`) : undefined,
          subject ? eq(gurujiConversations.subject, subject as string) : undefined,
        )
      )
      .orderBy(desc(gurujiMessages.createdAt))
      .limit(Number(limit));

      res.json(messages);
    } catch (error) {
      console.error("Error searching library:", error);
      res.status(500).json({ message: "Failed to search library" });
    }
  });

  // Credit transaction history (authenticated)
  app.get("/api/guruji/credits/history/:studentId", requireAuth, async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const { limit = 50 } = req.query;

      // Verify ownership
      const authStudentId = await getAuthenticatedStudentId(req);
      if (authStudentId !== studentId) {
        const user = req.user as any;
        if (!user.isAdmin && !user.claims?.isAdmin && user.userType !== "super_admin") {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const history = await db.select().from(gurujiCreditsLedger)
        .where(eq(gurujiCreditsLedger.studentId, studentId))
        .orderBy(desc(gurujiCreditsLedger.createdAt))
        .limit(Number(limit));

      res.json(history);
    } catch (error) {
      console.error("Error fetching credit history:", error);
      res.status(500).json({ message: "Failed to fetch credit history" });
    }
  });

  // Admin: Get all credit packages (admin only)
  app.get("/api/guruji/admin/packages", requireAdmin, async (req: Request, res: Response) => {
    try {
      const packages = await db.select().from(gurujiCreditPackages)
        .orderBy(asc(gurujiCreditPackages.sortOrder));
      res.json(packages);
    } catch (error) {
      console.error("Error fetching packages:", error);
      res.status(500).json({ message: "Failed to fetch packages" });
    }
  });

  // Admin: Create/Update credit package (admin only)
  app.post("/api/guruji/admin/packages", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { id, ...packageData } = req.body;
      
      if (id) {
        await db.update(gurujiCreditPackages).set({ ...packageData, updatedAt: new Date() }).where(eq(gurujiCreditPackages.id, id));
        const [updated] = await db.select().from(gurujiCreditPackages).where(eq(gurujiCreditPackages.id, id));
        res.json(updated);
      } else {
        const [created] = await db.insert(gurujiCreditPackages).values(packageData).returning();
        res.json(created);
      }
    } catch (error) {
      console.error("Error saving package:", error);
      res.status(500).json({ message: "Failed to save package" });
    }
  });

  // Admin: Delete credit package (admin only)
  app.delete("/api/guruji/admin/packages/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await db.delete(gurujiCreditPackages).where(eq(gurujiCreditPackages.id, parseInt(req.params.id)));
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting package:", error);
      res.status(500).json({ message: "Failed to delete package" });
    }
  });

  // Admin: Award bonus credits to student (admin only)
  app.post("/api/guruji/admin/award-credits", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { studentId, amount, reason } = req.body;
      
      const credits = await getStudentCredits(studentId);
      const newTotal = credits.totalCredits + amount;
      
      await db.update(gurujiStudentCredits)
        .set({
          bonusCredits: (credits.bonusCredits || 0) + amount,
          totalCredits: newTotal,
          updatedAt: new Date(),
        })
        .where(eq(gurujiStudentCredits.studentId, studentId));

      await db.insert(gurujiCreditsLedger).values({
        studentId,
        transactionType: "bonus",
        amount,
        balanceAfter: newTotal,
        referenceType: "admin",
        description: reason || "Admin bonus credits",
      });

      res.json({ success: true, newBalance: newTotal });
    } catch (error) {
      console.error("Error awarding credits:", error);
      res.status(500).json({ message: "Failed to award credits" });
    }
  });

  app.get("/api/guruji/admin/search-students", requireAdmin, async (req: Request, res: Response) => {
    try {
      const query = (req.query.q as string || "").trim();
      if (!query || query.length < 2) {
        return res.json([]);
      }

      const students = await db.select({
        id: studentRegistrations.id,
        firstName: studentRegistrations.firstName,
        lastName: studentRegistrations.lastName,
        email: studentRegistrations.email,
        studentId: studentRegistrations.studentId,
        gradeLevel: studentRegistrations.gradeLevel,
      })
        .from(studentRegistrations)
        .where(
          or(
            ilike(studentRegistrations.firstName, `%${query}%`),
            ilike(studentRegistrations.lastName, `%${query}%`),
            ilike(studentRegistrations.email, `%${query}%`),
            ilike(studentRegistrations.studentId, `%${query}%`)
          )
        )
        .limit(10);

      const studentsWithCredits = await Promise.all(
        students.map(async (s) => {
          const credits = await db.select({ totalCredits: gurujiStudentCredits.totalCredits })
            .from(gurujiStudentCredits)
            .where(eq(gurujiStudentCredits.studentId, s.id));
          return {
            ...s,
            currentCredits: credits.length > 0 ? credits[0].totalCredits : 0,
          };
        })
      );

      res.json(studentsWithCredits);
    } catch (error) {
      console.error("Error searching students:", error);
      res.status(500).json({ message: "Failed to search students" });
    }
  });

  app.post("/api/guruji/admin/distribute-credits", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { studentId, amount, reason } = req.body;

      if (!studentId || !amount || amount <= 0) {
        return res.status(400).json({ message: "Valid studentId and positive amount required" });
      }

      await getStudentCredits(studentId);

      const [updated] = await db.update(gurujiStudentCredits)
        .set({
          bonusCredits: sql`COALESCE(${gurujiStudentCredits.bonusCredits}, 0) + ${amount}`,
          totalCredits: sql`COALESCE(${gurujiStudentCredits.totalCredits}, 0) + ${amount}`,
          updatedAt: new Date(),
        })
        .where(eq(gurujiStudentCredits.studentId, studentId))
        .returning({ totalCredits: gurujiStudentCredits.totalCredits });

      const newTotal = updated?.totalCredits || amount;

      await db.insert(gurujiCreditsLedger).values({
        studentId,
        transactionType: "bonus",
        amount,
        balanceAfter: newTotal,
        referenceType: "admin",
        description: reason || `Admin distributed ${amount} TARA credits`,
      });

      const [student] = await db.select({
        firstName: studentRegistrations.firstName,
        lastName: studentRegistrations.lastName,
        studentId: studentRegistrations.studentId,
      }).from(studentRegistrations).where(eq(studentRegistrations.id, studentId));

      res.json({
        success: true,
        newBalance: newTotal,
        studentName: student ? `${student.firstName} ${student.lastName}` : "Unknown",
        studentIdCode: student?.studentId || "",
      });
    } catch (error) {
      console.error("Error distributing credits:", error);
      res.status(500).json({ message: "Failed to distribute credits" });
    }
  });

  app.get("/api/guruji/admin/credit-history/:studentId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const ledger = await db.select()
        .from(gurujiCreditsLedger)
        .where(eq(gurujiCreditsLedger.studentId, studentId))
        .orderBy(desc(gurujiCreditsLedger.createdAt))
        .limit(20);
      res.json(ledger);
    } catch (error) {
      console.error("Error fetching credit history:", error);
      res.status(500).json({ message: "Failed to fetch credit history" });
    }
  });

  console.log("GURUJI routes registered");
}
