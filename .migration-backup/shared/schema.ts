import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, real, uniqueIndex } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- Import models from integrations ---
export * from "./models/auth";
export * from "./models/chat";

import { users } from "./models/auth";

// ============================
// REGION/GEOGRAPHY MODULE
// ============================

// --- COUNTRIES ---
export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // ISO country code (IN, US, UK, etc.)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- STATES ---
export const states = pgTable("states", {
  id: serial("id").primaryKey(),
  countryId: integer("country_id").notNull().references(() => countries.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  code: text("code"), // State code (optional)
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- CITIES ---
export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  stateId: integer("state_id").notNull().references(() => states.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================
// OLYMPIAD CATEGORIES MODULE
// ============================

// --- OLYMPIAD CATEGORIES ---
export const olympiadCategories = pgTable("olympiad_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  language: text("language").notNull().default("en"), // en, hi, etc.
  categoryGroup: text("category_group").default("stem"), // stem, languages, humanities, skills, vocational
  themeColor: text("theme_color"), // hex color for theming
  iconName: text("icon_name"), // lucide icon name
  eligibleClasses: text("eligible_classes").default("3-12"), // e.g., "3-12", "6-12", "9-12"
  registrationFee: integer("registration_fee").default(250), // in rupees
  imageUrl: text("image_url"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- OLYMPIAD PAGE CONTENT (Rich text content for olympiad detail pages) ---
export const olympiadPageContent = pgTable("olympiad_page_content", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => olympiadCategories.id, { onDelete: "cascade" }),
  // SEO fields
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  // Hero section
  heroTitle: text("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  heroImageUrl: text("hero_image_url"),
  // Content sections (all stored as rich HTML)
  overviewContent: text("overview_content"), // What is this olympiad
  whyParticipateContent: text("why_participate_content"), // Benefits of participation
  eligibilityContent: text("eligibility_content"), // Who can participate
  syllabusContent: text("syllabus_content"), // Syllabus & exam pattern
  importantDatesContent: text("important_dates_content"), // Timeline
  registrationProcessContent: text("registration_process_content"), // How to register
  preparationTipsContent: text("preparation_tips_content"), // Study tips
  awardsContent: text("awards_content"), // Awards & recognition
  faqContent: jsonb("faq_content"), // Array of {question, answer} objects
  // Additional custom sections
  customSections: jsonb("custom_sections"), // Array of {title, content} objects
  // Control fields
  status: text("status").default("draft"), // draft, live, scheduled, archived
  isRegistrationOpen: boolean("is_registration_open").default(false),
  registrationButtonText: text("registration_button_text").default("Register Now"),
  registrationUrl: text("registration_url"),
  // Scheduling
  scheduledPublishDate: timestamp("scheduled_publish_date"),
  scheduledArchiveDate: timestamp("scheduled_archive_date"),
  // Theme customization
  themeColor: text("theme_color"), // Primary color override
  // Metadata
  createdBy: varchar("created_by"),
  lastEditedBy: varchar("last_edited_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
});

// --- EXAMS / OLYMPIADS ---
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  // Basic info
  title: text("title").notNull(),
  slug: text("slug"),
  description: text("description").notNull(),
  subject: text("subject").notNull(),
  // Category reference
  categoryId: integer("category_id").references(() => olympiadCategories.id),
  // Timing
  durationMinutes: integer("duration_minutes").notNull(),
  startTime: timestamp("start_time").notNull(), // Exam start time
  endTime: timestamp("end_time").notNull(), // Exam end time
  // Registration period
  registrationOpenDate: timestamp("registration_open_date"),
  registrationCloseDate: timestamp("registration_close_date"),
  // Marks configuration
  totalMarks: integer("total_marks").notNull(),
  maxQuestions: integer("max_questions").default(50), // Maximum questions allowed in this olympiad
  negativeMarking: boolean("negative_marking").default(false),
  negativeMarkingWrongCount: integer("negative_marking_wrong_count").default(3), // How many wrong answers trigger deduction
  negativeMarkingDeduction: integer("negative_marking_deduction").default(1), // Marks to deduct when wrong count reached
  // Proctoring
  proctoring: boolean("proctoring").default(false),
  // Warning languages for proctoring (array of language codes like ["en", "hi", "ta"])
  warningLanguages: text("warning_languages").array().default(["en", "hi"]),
  // Participation settings
  participationFee: integer("participation_fee").default(0), // Fee in paise/cents
  participantLimit: integer("participant_limit"), // null = unlimited
  isParticipantLimited: boolean("is_participant_limited").default(false),
  // Eligibility
  classCategory: text("class_category"), // e.g., "5-8", "9-12"
  minClass: integer("min_class"),
  maxClass: integer("max_class"),
  maxAge: integer("max_age"), // Maximum age allowed (validated against DOB)
  // Image/Branding
  imageUrl: text("image_url"),
  // Result & Visibility
  resultDeclarationDate: timestamp("result_declaration_date"),
  isVisible: boolean("is_visible").default(false), // Hidden until enabled
  status: text("status").default("draft"), // draft, published, active, completed, cancelled
  // Difficulty level for all questions in this olympiad
  difficultyLevel: text("difficulty_level").default("medium"), // very_easy, easy, medium, hard, olympiad
  // Question settings
  totalQuestions: integer("total_questions").default(0),
  mcqCount: integer("mcq_count").default(0),
  trueFalseCount: integer("true_false_count").default(0),
  imageBasedCount: integer("image_based_count").default(0),
  // Random Question Distribution Settings
  enableRandomDistribution: boolean("enable_random_distribution").default(false), // Enable random question selection from pool
  questionsPerStudent: integer("questions_per_student"), // Number of questions each student receives (null = all questions)
  shuffleQuestionOrder: boolean("shuffle_question_order").default(true), // Shuffle the order of questions per student
  shuffleOptionOrder: boolean("shuffle_option_order").default(true), // Shuffle MCQ options per student
  syllabusData: jsonb("syllabus_data"),
  examPattern: jsonb("exam_pattern"),
  sampleQuestions: jsonb("sample_questions"),
  preparationTips: text("preparation_tips"),
  // Platform track
  examCategory: text("exam_category").default("SCHOOL_OLYMPIAD"), // SCHOOL_OLYMPIAD, UPSC, SSC, BANKING, RAILWAY, STATE_PSC, DEFENSE
  targetLevel: text("target_level"), // Class 1-12, GRADUATION, POST_GRADUATION
  // Metadata
  createdBy: varchar("created_by").notNull(), // admin user id
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- QUESTIONS ---
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("mcq"), // mcq, true_false, image_based
  // Rich text content stored as JSON
  // { question: "HTML content", options: [{id, text, imageUrl?}], correctOptionId: "id", explanation?: "HTML" }
  content: jsonb("content").notNull(),
  // For image-based questions
  questionImageUrl: text("question_image_url"),
  // Marks
  marks: integer("marks").notNull().default(4),
  // Metadata (language inherited from olympiad)
  difficulty: text("difficulty").default("medium"), // easy, medium, hard
  tags: text("tags"), // comma-separated tags
  isAiGenerated: boolean("is_ai_generated").default(false),
  aiGenerationPrompt: text("ai_generation_prompt"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  // Voice answer configuration
  isVoiceEnabled: boolean("is_voice_enabled").default(false),
  spokenAnswerFormat: text("spoken_answer_format"), // one_word, short_explanation, formula_term
  voiceEvaluationMethod: text("voice_evaluation_method"), // exact_match, keyword_match, semantic_match
  referenceAnswer: text("reference_answer"), // Expected spoken answer text
  acceptedVariations: jsonb("accepted_variations"), // Array of acceptable answer variations
  voiceKeywords: jsonb("voice_keywords"), // Array of key concepts/keywords for evaluation
  confidenceThreshold: integer("confidence_threshold").default(70), // 0-100%
  maxRecordingDuration: integer("max_recording_duration").default(60), // seconds
  allowTextFallback: boolean("allow_text_fallback").default(true), // Allow text input if mic fails
});

// --- ATTEMPT QUESTIONS (stores randomized order per student) ---
export const attemptQuestions = pgTable("attempt_questions", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  displayOrder: integer("display_order").notNull(), // Randomized order for this student
  optionOrder: jsonb("option_order"), // Array of option IDs in shuffled order
  createdAt: timestamp("created_at").defaultNow(),
});

// --- REGISTRATIONS ---
export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  examId: integer("exam_id").notNull().references(() => exams.id),
  registeredAt: timestamp("registered_at").defaultNow(),
});

// --- ATTEMPTS ---
export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  examId: integer("exam_id").notNull().references(() => exams.id),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  score: integer("score"),
  status: text("status").notNull().default("in_progress"), // in_progress, completed, disqualified
  // Random Question Distribution - Locked assignment per student
  assignedQuestionIds: jsonb("assigned_question_ids"), // Array of question IDs assigned to this student (locked after assignment)
  questionAssignmentTimestamp: timestamp("question_assignment_timestamp"), // When questions were assigned
  shuffleSeed: text("shuffle_seed"), // Seed reference for audit (optional)
});

// --- ANSWERS ---
export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => attempts.id),
  questionId: integer("question_id").notNull().references(() => questions.id),
  selectedOption: text("selected_option"), // or text answer
  isCorrect: boolean("is_correct"),
  // Voice answer fields
  audioUrl: text("audio_url"), // URL to stored audio file
  transcript: text("transcript"), // Raw speech-to-text output
  normalizedTranscript: text("normalized_transcript"), // Processed transcript (numbers, units normalized)
  evaluationScore: integer("evaluation_score"), // 0-100 confidence/match score
  voiceEvaluationMethod: text("voice_evaluation_method"), // Method used: exact_match, keyword_match, semantic_match
  aiConfidence: integer("ai_confidence"), // AI confidence in the evaluation
  evaluationStatus: text("evaluation_status").default("pending"), // pending, processing, completed, failed
  evaluationDetails: jsonb("evaluation_details"), // Detailed evaluation results (matched keywords, etc.)
});

// --- OTP CODES ---
export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  contact: text("contact").notNull(), // email or phone
  contactType: text("contact_type").notNull().default("email"), // email or phone
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  attempts: integer("attempts").default(0), // brute-force protection
  verificationToken: text("verification_token"), // token issued after verification
  createdAt: timestamp("created_at").defaultNow(),
});

// --- VERIFIED CONTACTS (persists verified state) ---
export const verifiedContacts = pgTable("verified_contacts", {
  id: serial("id").primaryKey(),
  contact: text("contact").notNull(),
  contactType: text("contact_type").notNull(), // email or phone
  token: text("token").notNull().unique(), // verification token for registration
  expiresAt: timestamp("expires_at").notNull(), // token expiration
  used: boolean("used").default(false), // prevent token reuse
  createdAt: timestamp("created_at").defaultNow(),
});

// --- PROFILE STATUS ENUM ---
// pending_contact: OTP not yet verified
// pending_profile: Basic info incomplete
// pending_photos: Photos not uploaded (students only)
// pending_review: Awaiting admin review (schools)
// complete: Profile fully complete

// --- STUDENT REGISTRATIONS (for Olympiad - Individual Students) ---
export const studentRegistrations = pgTable("student_registrations", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").unique(), // Unique login ID (e.g., SAM26001234)
  email: text("email").unique(),
  firstName: text("first_name"),
  middleName: text("middle_name"), // NEW: for certificate printing
  lastName: text("last_name"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  countryCode: text("country_code").default("+91"),
  phone: text("phone").unique(),
  // NEW: Registration type (individual, parent, school, group)
  registrationType: text("registration_type").default("individual"),
  // NEW: Region fields for cascading dropdowns
  countryId: integer("country_id").references(() => countries.id),
  stateId: integer("state_id").references(() => states.id),
  cityId: integer("city_id").references(() => cities.id),
  addressLine1: text("address_line_1"),
  addressLine2: text("address_line_2"),
  pincode: text("pincode"), // TEXT for international formats
  // Legacy fields (kept for backward compatibility)
  schoolLocation: text("school_location"),
  schoolCity: text("school_city"),
  schoolName: text("school_name"),
  gradeLevel: text("grade_level"),
  password: text("password"),
  profilePhotoUrl: text("profile_photo_url"),
  schoolIdPhotoUrl: text("school_id_photo_url"),
  photoCropMeta: jsonb("photo_crop_meta"),
  profileStatus: text("profile_status").default("pending_profile"),
  profileStep: integer("profile_step").default(1),
  primaryContactType: text("primary_contact_type"),
  emailVerified: boolean("email_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  termsAccepted: boolean("terms_accepted").default(false),
  emailConsent: boolean("email_consent").default(false),
  promotionalConsent: boolean("promotional_consent").default(false),
  verified: boolean("verified").default(false),
  profileCompletedAt: timestamp("profile_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  usedReferralCode: text("used_referral_code"),
  myReferralCode: text("my_referral_code").unique(),
  referredByPartnerId: integer("referred_by_partner_id").references(() => partners.id),
  lockPin: text("lock_pin"),
  lockPinEnabled: boolean("lock_pin_enabled").default(false),
  activeSessionToken: text("active_session_token"),
  lastLoginAt: timestamp("last_login_at"),
  lastLoginDevice: text("last_login_device"),
  lastLoginIp: text("last_login_ip"),
  registrationIp: text("registration_ip"),
  geoData: jsonb("geo_data"),
});

// --- SUPERVISOR/PARENT REGISTRATIONS ---
export const supervisorRegistrations = pgTable("supervisor_registrations", {
  id: serial("id").primaryKey(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  countryCode: text("country_code").default("+91"),
  phone: text("phone").unique(),
  schoolLocation: text("school_location"),
  schoolCity: text("school_city"),
  schoolName: text("school_name"),
  branch: text("branch"),
  secondaryEmail: text("secondary_email"),
  password: text("password"),
  profileStatus: text("profile_status").default("pending_profile"),
  primaryContactType: text("primary_contact_type"),
  emailVerified: boolean("email_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  termsAccepted: boolean("terms_accepted").default(false),
  emailConsent: boolean("email_consent").default(false),
  promotionalConsent: boolean("promotional_consent").default(false),
  verified: boolean("verified").default(false),
  profileCompletedAt: timestamp("profile_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- SCHOOL COLLABORATION REGISTRATIONS ---
export const schoolCollaborations = pgTable("school_collaborations", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password"),
  teacherFirstName: text("teacher_first_name"),
  teacherLastName: text("teacher_last_name"),
  teacherEmail: text("teacher_email"),
  country: text("country"),
  schoolName: text("school_name"),
  schoolCity: text("school_city"),
  schoolAddress: text("school_address"),
  principalName: text("principal_name"),
  boardAffiliation: text("board_affiliation"),
  contactPhone: text("contact_phone"),
  expectedStudents: text("expected_students"),
  categoryRange: text("category_range"),
  message: text("message"),
  profileStatus: text("profile_status").default("pending_profile"),
  termsAccepted: boolean("terms_accepted").default(false),
  verified: boolean("verified").default(false),
  profileCompletedAt: timestamp("profile_completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- COORDINATORS (school staff managing grades) ---
export const coordinators = pgTable("coordinators", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").references(() => schoolCollaborations.id),
  type: text("type").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password"),
  department: text("department"),
  assignedGrades: text("assigned_grades"),
  organizationName: text("organization_name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull().default("India"),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- SUPER ADMINS (system administrators) ---
export const superAdmins = pgTable("super_admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").default("Super"),
  lastName: text("last_name").default("Admin"),
  role: text("role").default("super_admin"), // super_admin, admin
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  sessionToken: text("session_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- ANNOUNCEMENTS ---
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  type: text("type").default("general"), // general, exam, deadline, maintenance
  important: boolean("important").default(false),
  targetAudience: text("target_audience").default("all"), // all, student, supervisor, group, school
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- MANAGED STUDENTS (students managed by supervisors/groups/schools) ---
export const managedStudents = pgTable("managed_students", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentRegistrations.id),
  managerId: integer("manager_id").notNull(), // ID of supervisor, group, or school
  managerType: text("manager_type").notNull(), // supervisor, group, school
  relationship: text("relationship"), // parent, guardian, teacher (for supervisors)
  status: text("status").default("active"), // active, inactive, pending
  createdAt: timestamp("created_at").defaultNow(),
});

// --- PAYMENTS ---
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  userType: text("user_type").notNull(), // student, supervisor, school
  examId: integer("exam_id").references(() => exams.id),
  olympiadId: integer("olympiad_id").references(() => olympiadCategories.id),
  studentId: integer("student_id").references(() => studentRegistrations.id),
  
  // Gateway info
  gateway: text("gateway"), // razorpay, stripe
  gatewayOrderId: text("gateway_order_id"), // Razorpay order_id or Stripe payment_intent_id
  gatewayPaymentId: text("gateway_payment_id"), // Razorpay payment_id or Stripe charge_id
  
  // Amounts
  baseAmount: integer("base_amount").notNull().default(0), // Base price before tax (in paise/cents)
  amount: integer("amount").notNull(), // Total amount including tax (in paise/cents)
  currency: text("currency").default("INR"),
  
  // Tax breakdown
  taxRate: integer("tax_rate").default(0), // Tax percentage (e.g., 18 for 18%)
  taxAmount: integer("tax_amount").default(0), // Total tax amount
  cgstAmount: integer("cgst_amount").default(0), // CGST for intra-state India
  sgstAmount: integer("sgst_amount").default(0), // SGST for intra-state India
  igstAmount: integer("igst_amount").default(0), // IGST for inter-state India
  isExportService: boolean("is_export_service").default(false), // True for international (no tax)
  
  // Location info
  country: text("country"), // User's country code
  state: text("state"), // User's state (for GST calculation)
  
  // Status and retry
  status: text("status").default("pending"), // pending, paid, failed, refunded, cancelled
  retryCount: integer("retry_count").default(0),
  failureReason: text("failure_reason"),
  
  // Environment
  environment: text("environment").default("test"), // test, live
  
  // Invoice
  invoiceNumber: text("invoice_number"),
  invoiceUrl: text("invoice_url"),
  
  // Refund tracking
  refundedAt: timestamp("refunded_at"),
  refundReason: text("refund_reason"),
  
  // Legacy fields (kept for compatibility)
  paymentMethod: text("payment_method"),
  transactionId: text("transaction_id"),
  description: text("description"),
  
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- CERTIFICATES ---
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  verificationCode: text("verification_code").unique(), // Unique secure code like "NMO24-X7K9M2-SHAU"
  studentId: integer("student_id").references(() => studentRegistrations.id),
  attemptId: integer("attempt_id").references(() => attempts.id),
  examId: integer("exam_id").references(() => exams.id),
  type: text("type").notNull(), // participation, merit_bronze, merit_silver, merit_gold
  rank: integer("rank"),
  score: integer("score"),
  certificateUrl: text("certificate_url"),
  issuedAt: timestamp("issued_at").defaultNow(),
  downloadCount: integer("download_count").default(0),
});

// --- CERTIFICATE TEMPLATES ---
export const certificateTemplates = pgTable("certificate_templates", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().unique(), // gold, silver, bronze, participant
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  // Design Settings
  backgroundColor: text("background_color").default("#FFFFFF"),
  backgroundGradientStart: text("background_gradient_start"),
  backgroundGradientEnd: text("background_gradient_end"),
  borderColor: text("border_color").default("#D4AF37"),
  borderWidth: integer("border_width").default(8),
  // Header Settings
  logoUrl: text("logo_url"),
  headerText: text("header_text").default("SAMIKARAN OLYMPIAD"),
  headerSubText: text("header_sub_text").default("समीकरण = Equation = Equality"),
  headerColor: text("header_color").default("#1E1B4B"),
  // Award Title Settings
  awardTitle: text("award_title").default("Certificate of Achievement"),
  awardTitleColor: text("award_title_color").default("#D4AF37"),
  awardTitleFont: text("award_title_font").default("Playfair Display"),
  awardTitleFontSize: integer("award_title_font_size").default(28),
  // Content Settings
  contentText: text("content_text").default("This is to certify that"),
  contentColor: text("content_color").default("#333333"),
  contentFont: text("content_font").default("Inter"),
  contentFontSize: integer("content_font_size").default(12),
  studentNameFontSize: integer("student_name_font_size").default(24),
  // Achievement Text
  achievementText: text("achievement_text").default("for outstanding performance in"),
  // Signature Settings
  signature1Name: text("signature1_name").default("Director"),
  signature1Title: text("signature1_title").default("Samikaran Olympiad"),
  signature1ImageUrl: text("signature1_image_url"),
  signature2Name: text("signature2_name").default("President"),
  signature2Title: text("signature2_title").default("Samikaran Foundation"),
  signature2ImageUrl: text("signature2_image_url"),
  // Stamp/Seal Settings
  stampUrl: text("stamp_url"),
  showQrCode: boolean("show_qr_code").default(true),
  // Watermark Settings
  watermarkText: text("watermark_text"),
  watermarkOpacity: real("watermark_opacity").default(0.1),
  // Badge/Ribbon Settings
  showBadge: boolean("show_badge").default(true),
  badgeText: text("badge_text"), // e.g., "GOLD", "SILVER", etc.
  badgeColor: text("badge_color"),
  // Decorative Elements
  showDecorations: boolean("show_decorations").default(true),
  decorationStyle: text("decoration_style").default("classic"), // classic, modern, minimal
  // Custom CSS
  customCss: text("custom_css"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- CALENDAR EVENTS ---
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("event_type").notNull(), // exam, deadline, holiday, webinar, result
  eventDate: timestamp("event_date").notNull(),
  endDate: timestamp("end_date"),
  examId: integer("exam_id").references(() => exams.id),
  targetAudience: text("target_audience").default("all"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- EXAM REGISTRATIONS (for tracking who registered for which exam) ---
export const examRegistrations = pgTable("exam_registrations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentRegistrations.id),
  examId: integer("exam_id").notNull().references(() => exams.id),
  registeredBy: integer("registered_by"), // supervisor/group/school ID
  registeredByType: text("registered_by_type"), // self, supervisor, group, school
  paymentId: integer("payment_id").references(() => payments.id),
  invoiceNumber: text("invoice_number"), // Format: SAM-YYYY-OLY-{examId}-{sequence}
  status: text("status").default("registered"), // registered, confirmed, cancelled
  paymentStatus: text("payment_status").default("locked"), // locked, unlocked (for exam access)
  registeredAt: timestamp("registered_at").defaultNow(),
});

// --- PAYMENT SETTINGS (dedicated table for payment configuration) ---
export const paymentSettings = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  
  // Environment
  environmentMode: text("environment_mode").default("test"), // test, live
  
  // Razorpay Configuration
  razorpayEnabled: boolean("razorpay_enabled").default(false),
  razorpayKeyId: text("razorpay_key_id"),
  razorpayKeySecret: text("razorpay_key_secret"),
  razorpayWebhookSecret: text("razorpay_webhook_secret"),
  
  // Stripe Configuration
  stripeEnabled: boolean("stripe_enabled").default(false),
  stripeSecretKey: text("stripe_secret_key"),
  stripePublishableKey: text("stripe_publishable_key"),
  stripeWebhookSecret: text("stripe_webhook_secret"),
  
  // Smart Routing
  defaultCountry: text("default_country").default("IN"),
  
  // Tax Configuration
  taxEnabled: boolean("tax_enabled").default(true),
  taxName: text("tax_name").default("GST"),
  taxRate: integer("tax_rate").default(18), // percentage
  taxApplyIndiaOnly: boolean("tax_apply_india_only").default(true),
  
  // Business Identity
  businessName: text("business_name"),
  gstin: text("gstin"), // GST Identification Number
  businessAddress: text("business_address"),
  businessStateCode: text("business_state_code"), // For CGST/SGST calculation
  businessCity: text("business_city"),
  businessPincode: text("business_pincode"),
  
  // Invoice Settings
  autoGenerateInvoice: boolean("auto_generate_invoice").default(true),
  invoicePrefix: text("invoice_prefix").default("INV"),
  invoiceStartNumber: integer("invoice_start_number").default(1000),
  showTaxBreakdown: boolean("show_tax_breakdown").default(true),
  invoiceFooterNotes: text("invoice_footer_notes"),
  
  // Invoice Template Customization
  invoiceLogoUrl: text("invoice_logo_url"),
  invoiceShowLogo: boolean("invoice_show_logo").default(true),
  invoicePrimaryColor: text("invoice_primary_color").default("#8A2BE2"), // Brand purple
  invoiceSecondaryColor: text("invoice_secondary_color").default("#333333"),
  invoiceAccentColor: text("invoice_accent_color").default("#FF2FBF"), // Brand pink
  invoiceCompanyTagline: text("invoice_company_tagline"),
  invoiceTermsAndConditions: text("invoice_terms_and_conditions"),
  invoiceShowPaymentDetails: boolean("invoice_show_payment_details").default(true),
  invoiceShowQRCode: boolean("invoice_show_qr_code").default(false),
  invoiceLayout: text("invoice_layout").default("classic"), // classic, modern, minimal
  invoiceDateFormat: text("invoice_date_format").default("DD/MM/YYYY"),
  invoiceCurrencyPosition: text("invoice_currency_position").default("before"), // before, after
  
  // Payment UX Rules
  allowRetryOnFailure: boolean("allow_retry_on_failure").default(true),
  maxRetryAttempts: integer("max_retry_attempts").default(3),
  autoUnlockExamAfterPayment: boolean("auto_unlock_exam_after_payment").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- PROCESSED WEBHOOKS (for idempotency) ---
export const processedWebhooks = pgTable("processed_webhooks", {
  id: serial("id").primaryKey(),
  gateway: text("gateway").notNull(), // razorpay, stripe
  eventId: text("event_id").notNull().unique(), // Webhook event ID
  eventType: text("event_type").notNull(), // payment.captured, payment_intent.succeeded
  paymentId: integer("payment_id").references(() => payments.id),
  processedAt: timestamp("processed_at").defaultNow(),
});

// --- INVOICE COUNTER (for sequential invoice numbers) ---
export const invoiceCounter = pgTable("invoice_counter", {
  id: serial("id").primaryKey(),
  prefix: text("prefix").notNull(),
  year: integer("year").notNull(),
  lastNumber: integer("last_number").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- REFERRALS (tracks who referred whom) ---
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => studentRegistrations.id), // who referred
  referredId: integer("referred_id").notNull().references(() => studentRegistrations.id), // who was referred
  referralCode: text("referral_code").notNull(), // the code used
  examId: integer("exam_id").references(() => exams.id), // olympiad for which referral was used
  status: text("status").default("pending"), // pending, confirmed (after payment), expired
  referrerDiscountApplied: boolean("referrer_discount_applied").default(false), // has referrer used their discount?
  referredDiscountApplied: boolean("referred_discount_applied").default(false), // has referred used their discount?
  createdAt: timestamp("created_at").defaultNow(),
});

// --- DISCOUNT CREDITS (tracks pending and used discount credits) ---
export const discountCredits = pgTable("discount_credits", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentRegistrations.id),
  referralId: integer("referral_id").references(() => referrals.id), // which referral earned this credit
  discountPercent: integer("discount_percent").notNull().default(10), // 10%
  status: text("status").default("pending"), // pending, used, expired
  applicableExamId: integer("applicable_exam_id").references(() => exams.id), // optional: specific exam only
  usedOnPaymentId: integer("used_on_payment_id").references(() => payments.id), // which payment used this
  expiresAt: timestamp("expires_at"), // credit expiration date
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

// --- RELATIONS ---
export const examsRelations = relations(exams, ({ many }) => ({
  questions: many(questions),
  registrations: many(registrations),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  exam: one(exams, {
    fields: [questions.examId],
    references: [exams.id],
  }),
}));

export const attemptsRelations = relations(attempts, ({ one, many }) => ({
  exam: one(exams, {
    fields: [attempts.examId],
    references: [exams.id],
  }),
  user: one(users, {
    fields: [attempts.userId],
    references: [users.id],
  }),
  answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
  attempt: one(attempts, {
    fields: [answers.attemptId],
    references: [attempts.id],
  }),
  question: one(questions, {
    fields: [answers.questionId],
    references: [questions.id],
  }),
}));

// --- SCHEMAS ---
// Region schemas
export const insertCountrySchema = createInsertSchema(countries).omit({ id: true, createdAt: true });
export const insertStateSchema = createInsertSchema(states).omit({ id: true, createdAt: true });
export const insertCitySchema = createInsertSchema(cities).omit({ id: true, createdAt: true });

// Olympiad category schema
export const insertOlympiadCategorySchema = createInsertSchema(olympiadCategories).omit({ id: true, createdAt: true, updatedAt: true });

// Olympiad page content schema
export const insertOlympiadPageContentSchema = createInsertSchema(olympiadPageContent).omit({ id: true, createdAt: true, updatedAt: true, publishedAt: true });

export const insertExamSchema = createInsertSchema(exams).omit({ id: true, createdAt: true, updatedAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true, createdAt: true });
export const insertAttemptQuestionSchema = createInsertSchema(attemptQuestions).omit({ id: true, createdAt: true });
export const insertAttemptSchema = createInsertSchema(attempts).omit({ id: true, startTime: true, endTime: true, score: true, status: true });
export const insertAnswerSchema = createInsertSchema(answers).omit({ id: true, isCorrect: true });
export const insertOtpSchema = createInsertSchema(otpCodes).omit({ id: true, createdAt: true, verified: true });
export const insertStudentRegistrationSchema = createInsertSchema(studentRegistrations).omit({ id: true, createdAt: true, verified: true }).extend({
  partnerReferralCode: z.string().nullish()
});
export const insertSupervisorRegistrationSchema = createInsertSchema(supervisorRegistrations).omit({ id: true, createdAt: true, verified: true });
export const insertSchoolCollaborationSchema = createInsertSchema(schoolCollaborations).omit({ id: true, createdAt: true, verified: true });
export const insertCoordinatorSchema = createInsertSchema(coordinators).omit({ id: true, createdAt: true, verified: true });
export const insertSuperAdminSchema = createInsertSchema(superAdmins).omit({ id: true, createdAt: true, lastLoginAt: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true, createdAt: true });
export const insertManagedStudentSchema = createInsertSchema(managedStudents).omit({ id: true, createdAt: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true, issuedAt: true, downloadCount: true });
export const insertCertificateTemplateSchema = createInsertSchema(certificateTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({ id: true, createdAt: true });
export const insertExamRegistrationSchema = createInsertSchema(examRegistrations).omit({ id: true, registeredAt: true });
export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true, createdAt: true });
export const insertDiscountCreditSchema = createInsertSchema(discountCredits).omit({ id: true, createdAt: true });
export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProcessedWebhookSchema = createInsertSchema(processedWebhooks).omit({ id: true, processedAt: true });
export const insertInvoiceCounterSchema = createInsertSchema(invoiceCounter).omit({ id: true, updatedAt: true });

// --- TYPES ---
// Region types
export type Country = typeof countries.$inferSelect;
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type State = typeof states.$inferSelect;
export type InsertState = z.infer<typeof insertStateSchema>;
export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;

export type OlympiadCategory = typeof olympiadCategories.$inferSelect;
export type InsertOlympiadCategory = z.infer<typeof insertOlympiadCategorySchema>;

export type OlympiadPageContent = typeof olympiadPageContent.$inferSelect;
export type InsertOlympiadPageContent = z.infer<typeof insertOlympiadPageContentSchema>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type AttemptQuestion = typeof attemptQuestions.$inferSelect;
export type InsertAttemptQuestion = z.infer<typeof insertAttemptQuestionSchema>;
export type Attempt = typeof attempts.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Answer = typeof answers.$inferSelect;
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type OtpCode = typeof otpCodes.$inferSelect;
export type InsertOtp = z.infer<typeof insertOtpSchema>;
export type StudentRegistration = typeof studentRegistrations.$inferSelect;
export type InsertStudentRegistration = z.infer<typeof insertStudentRegistrationSchema>;
export type SupervisorRegistration = typeof supervisorRegistrations.$inferSelect;
export type InsertSupervisorRegistration = z.infer<typeof insertSupervisorRegistrationSchema>;
export type SchoolCollaboration = typeof schoolCollaborations.$inferSelect;
export type InsertSchoolCollaboration = z.infer<typeof insertSchoolCollaborationSchema>;
export type Coordinator = typeof coordinators.$inferSelect;
export type InsertCoordinator = z.infer<typeof insertCoordinatorSchema>;
export type SuperAdmin = typeof superAdmins.$inferSelect;
export type InsertSuperAdmin = z.infer<typeof insertSuperAdminSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type ManagedStudent = typeof managedStudents.$inferSelect;
export type InsertManagedStudent = z.infer<typeof insertManagedStudentSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
export type InsertCertificateTemplate = z.infer<typeof insertCertificateTemplateSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type ExamRegistration = typeof examRegistrations.$inferSelect;
export type InsertExamRegistration = z.infer<typeof insertExamRegistrationSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type DiscountCredit = typeof discountCredits.$inferSelect;
export type InsertDiscountCredit = z.infer<typeof insertDiscountCreditSchema>;
export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;
export type ProcessedWebhook = typeof processedWebhooks.$inferSelect;
export type InsertProcessedWebhook = z.infer<typeof insertProcessedWebhookSchema>;
export type InvoiceCounter = typeof invoiceCounter.$inferSelect;
export type InsertInvoiceCounter = z.infer<typeof insertInvoiceCounterSchema>;

// ============================
// GLOBAL SETTINGS MODULE
// ============================

// --- SITE SETTINGS (key-value store for basic settings) ---
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  category: text("category").notNull().default("general"), // general, seo, email, sms, storage, push, plugin
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- EMAIL TEMPLATES (Comprehensive Email Marketing System) ---
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(), // system, marketing, events, results, announcements, partner, investor
  type: text("type").notNull(), // transactional, marketing
  subject: text("subject").notNull(),
  previewText: text("preview_text"),
  htmlContent: text("html_content").notNull(),
  jsonContent: jsonb("json_content"), // For drag-drop editor blocks
  plainTextContent: text("plain_text_content"),
  variables: jsonb("variables").$type<string[]>(), // Dynamic variables used in template
  headerHtml: text("header_html"),
  footerHtml: text("footer_html"),
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // Default template for category
  version: integer("version").default(1),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- EMAIL TEMPLATE VERSIONS (for rollback) ---
export const emailTemplateVersions = pgTable("email_template_versions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull().references(() => emailTemplates.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  jsonContent: jsonb("json_content"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- EMAIL SEGMENTS (Audience Groups) ---
export const emailSegments = pgTable("email_segments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // dynamic, static, uploaded
  audienceType: text("audience_type").notNull(), // students, parents, schools, partners, investors, custom
  rules: jsonb("rules"), // Dynamic filter rules
  estimatedCount: integer("estimated_count").default(0),
  lastCalculatedAt: timestamp("last_calculated_at"),
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- EMAIL SEGMENT MEMBERS (for static segments) ---
export const emailSegmentMembers = pgTable("email_segment_members", {
  id: serial("id").primaryKey(),
  segmentId: integer("segment_id").notNull().references(() => emailSegments.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  userId: integer("user_id"),
  userType: text("user_type"), // student, school, partner, etc.
  metadata: jsonb("metadata"), // Additional user data
  addedAt: timestamp("added_at").defaultNow(),
});

// --- EMAIL CAMPAIGNS ---
export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // one-time, scheduled, recurring, trigger-based, drip, ab-test
  status: text("status").notNull().default("draft"), // draft, scheduled, sending, sent, paused, cancelled
  templateId: integer("template_id").references(() => emailTemplates.id),
  subject: text("subject"),
  previewText: text("preview_text"),
  htmlContent: text("html_content"),
  jsonContent: jsonb("json_content"),
  segmentIds: jsonb("segment_ids").$type<number[]>(),
  audienceType: text("audience_type"), // segment, all-students, all-schools, uploaded, manual
  uploadedAudienceData: jsonb("uploaded_audience_data"),
  scheduledAt: timestamp("scheduled_at"),
  timezone: text("timezone").default("Asia/Kolkata"),
  sendMode: text("send_mode").default("instant"), // instant, scheduled, timezone-based, ai-best-time
  recurringPattern: text("recurring_pattern"), // daily, weekly, monthly
  recurringEndDate: timestamp("recurring_end_date"),
  isAbTest: boolean("is_ab_test").default(false),
  abTestConfig: jsonb("ab_test_config"),
  throttleRate: integer("throttle_rate"),
  retryCount: integer("retry_count").default(3),
  aiOptimized: boolean("ai_optimized").default(false),
  aiPredictedOpenRate: integer("ai_predicted_open_rate"),
  aiPredictedClickRate: integer("ai_predicted_click_rate"),
  totalRecipients: integer("total_recipients").default(0),
  sentCount: integer("sent_count").default(0),
  deliveredCount: integer("delivered_count").default(0),
  openedCount: integer("opened_count").default(0),
  clickedCount: integer("clicked_count").default(0),
  bouncedCount: integer("bounced_count").default(0),
  unsubscribedCount: integer("unsubscribed_count").default(0),
  spamCount: integer("spam_count").default(0),
  sentAt: timestamp("sent_at"),
  completedAt: timestamp("completed_at"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- EMAIL CAMPAIGN RECIPIENTS ---
export const emailCampaignRecipients = pgTable("email_campaign_recipients", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull().references(() => emailCampaigns.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  userId: integer("user_id"),
  userType: text("user_type"),
  name: text("name"),
  metadata: jsonb("metadata"),
  status: text("status").default("pending"), // pending, sent, delivered, opened, clicked, bounced, failed
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  errorMessage: text("error_message"),
  abVariant: text("ab_variant"),
});

// --- EMAIL AUTOMATIONS (Workflow definitions) ---
export const emailAutomations = pgTable("email_automations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").notNull(), // registration, otp, olympiad-created, enrollment, exam-scheduled, exam-attempted, exam-missed, result-published, certificate-issued, blog-published, partner-onboarding, manual
  triggerConfig: jsonb("trigger_config"),
  status: text("status").default("inactive"), // active, inactive, paused
  isActive: boolean("is_active").default(false),
  totalTriggered: integer("total_triggered").default(0),
  totalCompleted: integer("total_completed").default(0),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- EMAIL AUTOMATION STEPS ---
export const emailAutomationSteps = pgTable("email_automation_steps", {
  id: serial("id").primaryKey(),
  automationId: integer("automation_id").notNull().references(() => emailAutomations.id, { onDelete: "cascade" }),
  stepOrder: integer("step_order").notNull(),
  stepType: text("step_type").notNull(), // send-email, delay, condition, branch, tag-user, move-segment, notify-admin
  config: jsonb("config").notNull(),
  templateId: integer("template_id").references(() => emailTemplates.id),
  positionX: integer("position_x").default(0),
  positionY: integer("position_y").default(0),
  nextStepId: integer("next_step_id"),
  conditionalNextSteps: jsonb("conditional_next_steps"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- EMAIL AUTOMATION RUNS ---
export const emailAutomationRuns = pgTable("email_automation_runs", {
  id: serial("id").primaryKey(),
  automationId: integer("automation_id").notNull().references(() => emailAutomations.id, { onDelete: "cascade" }),
  userId: integer("user_id"),
  userType: text("user_type"),
  email: text("email").notNull(),
  currentStepId: integer("current_step_id"),
  status: text("status").default("running"), // running, completed, paused, failed, cancelled
  triggerData: jsonb("trigger_data"),
  completedSteps: jsonb("completed_steps").$type<number[]>(),
  nextRunAt: timestamp("next_run_at"),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// --- EMAIL SENDS (Individual email send records) ---
export const emailSends = pgTable("email_sends", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => emailCampaigns.id),
  automationId: integer("automation_id").references(() => emailAutomations.id),
  automationStepId: integer("automation_step_id").references(() => emailAutomationSteps.id),
  templateId: integer("template_id").references(() => emailTemplates.id),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  recipientUserId: integer("recipient_user_id"),
  recipientUserType: text("recipient_user_type"),
  subject: text("subject").notNull(),
  fromEmail: text("from_email"),
  fromName: text("from_name"),
  replyTo: text("reply_to"),
  status: text("status").default("queued"), // queued, sending, sent, delivered, opened, clicked, bounced, failed, spam
  provider: text("provider"), // ses, sendgrid, mailgun
  providerMessageId: text("provider_message_id"),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  firstOpenedAt: timestamp("first_opened_at"),
  lastOpenedAt: timestamp("last_opened_at"),
  firstClickedAt: timestamp("first_clicked_at"),
  openDeviceType: text("open_device_type"),
  openCountry: text("open_country"),
  openCity: text("open_city"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  queuedAt: timestamp("queued_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  bouncedAt: timestamp("bounced_at"),
});

// --- EMAIL EVENTS (Granular tracking) ---
export const emailEvents = pgTable("email_events", {
  id: serial("id").primaryKey(),
  sendId: integer("send_id").notNull().references(() => emailSends.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // sent, delivered, opened, clicked, bounced, spam, unsubscribed
  eventData: jsonb("event_data"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceType: text("device_type"),
  country: text("country"),
  city: text("city"),
  occurredAt: timestamp("occurred_at").defaultNow(),
});

// --- EMAIL SUBSCRIBERS (Preferences & consent) ---
export const emailSubscribers = pgTable("email_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  userId: integer("user_id"),
  userType: text("user_type"),
  name: text("name"),
  marketingConsent: boolean("marketing_consent").default(false),
  transactionalConsent: boolean("transactional_consent").default(true),
  consentUpdatedAt: timestamp("consent_updated_at"),
  preferredFrequency: text("preferred_frequency").default("normal"),
  preferredCategories: jsonb("preferred_categories").$type<string[]>(),
  timezone: text("timezone"),
  engagementScore: integer("engagement_score").default(50),
  lastEmailSentAt: timestamp("last_email_sent_at"),
  lastEmailOpenedAt: timestamp("last_email_opened_at"),
  lastEmailClickedAt: timestamp("last_email_clicked_at"),
  totalEmailsSent: integer("total_emails_sent").default(0),
  totalEmailsOpened: integer("total_emails_opened").default(0),
  totalEmailsClicked: integer("total_emails_clicked").default(0),
  status: text("status").default("active"), // active, unsubscribed, bounced, complained
  unsubscribedAt: timestamp("unsubscribed_at"),
  unsubscribeReason: text("unsubscribe_reason"),
  bouncedAt: timestamp("bounced_at"),
  bounceType: text("bounce_type"),
  tags: jsonb("tags").$type<string[]>(),
  source: text("source"), // registration, import, manual
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- EMAIL SUPPRESSION LIST ---
export const emailSuppressionList = pgTable("email_suppression_list", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  reason: text("reason").notNull(), // unsubscribed, bounced, complained, manual
  source: text("source"),
  addedAt: timestamp("added_at").defaultNow(),
  addedBy: integer("added_by"),
});

// --- EMAIL SETTINGS ---
export const emailMarketingSettings = pgTable("email_marketing_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  category: text("category"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: integer("updated_by"),
});

// --- EMAIL TEMPLATE ASSIGNMENTS (Event-to-Template mapping) ---
export const emailTemplateAssignments = pgTable("email_template_assignments", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull().unique(),
  label: text("label").notNull(),
  templateId: integer("template_id").references(() => emailTemplates.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- EMAIL PROVIDER CONFIGS ---
export const emailProviderConfigs = pgTable("email_provider_configs", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull().unique(),
  isActive: boolean("is_active").default(false),
  isPrimary: boolean("is_primary").default(false),
  isFailover: boolean("is_failover").default(false),
  config: jsonb("config"),
  dailyLimit: integer("daily_limit"),
  hourlyLimit: integer("hourly_limit"),
  currentDailyCount: integer("current_daily_count").default(0),
  currentHourlyCount: integer("current_hourly_count").default(0),
  lastResetAt: timestamp("last_reset_at"),
  healthStatus: text("health_status").default("unknown"),
  lastHealthCheckAt: timestamp("last_health_check_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- SMS/WHATSAPP TEMPLATES (MSG91) ---
export const smsTemplates = pgTable("sms_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  body: text("body").notNull(),
  variables: text("variables").default(""),
  channel: text("channel").default("sms"),
  msg91SmsTemplateId: text("msg91_sms_template_id").default(""),
  msg91WhatsappTemplateName: text("msg91_whatsapp_template_name").default(""),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- PUSH NOTIFICATION TEMPLATES ---
export const pushTemplates = pgTable("push_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  actionUrl: text("action_url"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- LANGUAGES ---
export const languages = pgTable("languages", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // en, hi, fr
  name: text("name").notNull(), // English, Hindi, French
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- TRANSLATIONS (key-value per language) ---
export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  languageId: integer("language_id").notNull().references(() => languages.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- AI PROVIDERS (centralized AI configuration) ---
export const aiProviders = pgTable("ai_providers", {
  id: serial("id").primaryKey(),
  providerCode: text("provider_code").notNull(), // openai, gemini, claude, perplexity, stability, custom
  providerName: text("provider_name").notNull(), // Display name
  category: text("category").notNull(), // content, image, research
  apiKey: text("api_key"), // Encrypted API key (stored securely, never exposed after save)
  modelName: text("model_name"), // gpt-4, gemini-pro, claude-3, etc.
  baseUrl: text("base_url"), // Optional custom endpoint
  config: jsonb("config"), // { maxTokens, temperature, topP, etc. }
  isActive: boolean("is_active").default(false), // Only one per category can be active
  lastTestedAt: timestamp("last_tested_at"),
  testStatus: text("test_status"), // success, failed, pending
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- INSERT SCHEMAS ---
export const insertSiteSettingSchema = createInsertSchema(siteSettings).omit({ id: true, updatedAt: true });
export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({ id: true, createdAt: true, updatedAt: true, version: true });
export const insertEmailTemplateAssignmentSchema = createInsertSchema(emailTemplateAssignments).omit({ id: true, updatedAt: true });
export const insertEmailSegmentSchema = createInsertSchema(emailSegments).omit({ id: true, createdAt: true, updatedAt: true, estimatedCount: true, lastCalculatedAt: true });
export const insertEmailCampaignSchema = createInsertSchema(emailCampaigns).omit({ id: true, createdAt: true, updatedAt: true, sentAt: true, completedAt: true, totalRecipients: true, sentCount: true, deliveredCount: true, openedCount: true, clickedCount: true, bouncedCount: true, unsubscribedCount: true, spamCount: true });
export const insertEmailAutomationSchema = createInsertSchema(emailAutomations).omit({ id: true, createdAt: true, updatedAt: true, totalTriggered: true, totalCompleted: true });
export const insertEmailAutomationStepSchema = createInsertSchema(emailAutomationSteps).omit({ id: true, createdAt: true });
export const insertEmailSendSchema = createInsertSchema(emailSends).omit({ id: true, queuedAt: true, sentAt: true, deliveredAt: true, bouncedAt: true, openCount: true, clickCount: true, retryCount: true });
export const insertEmailSubscriberSchema = createInsertSchema(emailSubscribers).omit({ id: true, createdAt: true, updatedAt: true, engagementScore: true, totalEmailsSent: true, totalEmailsOpened: true, totalEmailsClicked: true });
export const insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPushTemplateSchema = createInsertSchema(pushTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLanguageSchema = createInsertSchema(languages).omit({ id: true, createdAt: true });
export const insertTranslationSchema = createInsertSchema(translations).omit({ id: true, updatedAt: true });
export const insertAiProviderSchema = createInsertSchema(aiProviders).omit({ id: true, createdAt: true, updatedAt: true });

// --- TYPES ---
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = z.infer<typeof insertSiteSettingSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplateAssignment = typeof emailTemplateAssignments.$inferSelect;
export type InsertEmailTemplateAssignment = z.infer<typeof insertEmailTemplateAssignmentSchema>;
export type EmailSegment = typeof emailSegments.$inferSelect;
export type InsertEmailSegment = z.infer<typeof insertEmailSegmentSchema>;
export type EmailCampaign = typeof emailCampaigns.$inferSelect;
export type InsertEmailCampaign = z.infer<typeof insertEmailCampaignSchema>;
export type EmailAutomation = typeof emailAutomations.$inferSelect;
export type InsertEmailAutomation = z.infer<typeof insertEmailAutomationSchema>;
export type EmailAutomationStep = typeof emailAutomationSteps.$inferSelect;
export type InsertEmailAutomationStep = z.infer<typeof insertEmailAutomationStepSchema>;
export type EmailSend = typeof emailSends.$inferSelect;
export type InsertEmailSend = z.infer<typeof insertEmailSendSchema>;
export type EmailSubscriber = typeof emailSubscribers.$inferSelect;
export type InsertEmailSubscriber = z.infer<typeof insertEmailSubscriberSchema>;
export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;
export type PushTemplate = typeof pushTemplates.$inferSelect;
export type InsertPushTemplate = z.infer<typeof insertPushTemplateSchema>;
export type Language = typeof languages.$inferSelect;
export type InsertLanguage = z.infer<typeof insertLanguageSchema>;
export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;
export type AiProvider = typeof aiProviders.$inferSelect;
export type InsertAiProvider = z.infer<typeof insertAiProviderSchema>;

// ============================
// PROCTORING MODULE
// ============================

// --- PROCTOR SETTINGS (per-exam configuration) ---
export const proctorSettings = pgTable("proctor_settings", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }).unique(),
  enabled: boolean("enabled").default(true),
  cameraRequired: boolean("camera_required").default(true),
  microphoneRequired: boolean("microphone_required").default(false),
  fullScreenRequired: boolean("full_screen_required").default(true),
  faceDetectionRequired: boolean("face_detection_required").default(true),
  snapshotInterval: integer("snapshot_interval").default(60), // seconds between snapshots
  maxViolationScore: integer("max_violation_score").default(100), // auto-submit threshold
  warnThreshold: integer("warn_threshold").default(30), // score to trigger warning
  flagThreshold: integer("flag_threshold").default(60), // score to flag for review
  blockCopyPaste: boolean("block_copy_paste").default(true),
  blockRightClick: boolean("block_right_click").default(true),
  blockTabSwitch: boolean("block_tab_switch").default(true),
  allowOfflineTolerance: integer("allow_offline_tolerance").default(30), // seconds allowed offline
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- PROCTOR SESSIONS (per-attempt tracking) ---
export const proctorSessions = pgTable("proctor_sessions", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }).unique(),
  status: text("status").notNull().default("pending"), // pending, active, paused, completed, terminated
  violationScore: integer("violation_score").default(0),
  warningCount: integer("warning_count").default(0),
  snapshotCount: integer("snapshot_count").default(0),
  lastHeartbeat: timestamp("last_heartbeat"),
  systemCheckPassed: boolean("system_check_passed").default(false),
  cameraEnabled: boolean("camera_enabled").default(false),
  microphoneEnabled: boolean("microphone_enabled").default(false),
  fullScreenActive: boolean("full_screen_active").default(false),
  faceDetected: boolean("face_detected").default(false),
  rulesAcknowledged: boolean("rules_acknowledged").default(false),
  deviceFingerprint: text("device_fingerprint"),
  browserInfo: text("browser_info"),
  ipAddress: text("ip_address"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- PROCTOR EVENTS (individual events/violations) ---
export const proctorEvents = pgTable("proctor_events", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => proctorSessions.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // snapshot, violation, warning, status_change, admin_action
  category: text("category"), // camera, audio, system, behavior, network
  severity: text("severity").default("low"), // low, medium, high, critical
  score: integer("score").default(0), // violation score impact
  description: text("description"),
  details: jsonb("details"), // additional event data
  snapshotUrl: text("snapshot_url"), // for snapshot events
  resolved: boolean("resolved").default(false),
  resolvedBy: text("resolved_by"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- VIOLATION RULES (defines violation types) ---
export const violationRules = pgTable("violation_rules", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // e.g., "FACE_NOT_DETECTED", "TAB_SWITCH"
  name: text("name").notNull(),
  category: text("category").notNull(), // camera, audio, system, behavior
  severity: text("severity").notNull().default("medium"), // low, medium, high, critical
  score: integer("score").notNull().default(10), // violation score impact
  description: text("description"),
  action: text("action").default("log"), // log, warn, flag, terminate
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- SYSTEM CHECK RESULTS (pre-exam checks) ---
export const systemCheckResults = pgTable("system_check_results", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
  browserCompatible: boolean("browser_compatible").default(false),
  cameraAccessGranted: boolean("camera_access_granted").default(false),
  microphoneAccessGranted: boolean("microphone_access_granted").default(false),
  networkStable: boolean("network_stable").default(false),
  faceDetected: boolean("face_detected").default(false),
  singleFaceConfirmed: boolean("single_face_confirmed").default(false),
  lightingAdequate: boolean("lighting_adequate").default(false),
  allChecksPassed: boolean("all_checks_passed").default(false),
  checkDetails: jsonb("check_details"), // detailed check results
  createdAt: timestamp("created_at").defaultNow(),
});

// --- PROCTORING WARNING SETTINGS (global admin-configurable) ---
export const proctoringWarningSettings = pgTable("proctoring_warning_settings", {
  id: serial("id").primaryKey(),
  
  // Warning Type Configuration
  warningType: text("warning_type").notNull().default("voice"), // "voice", "siren", "both"
  
  // Countdown Settings
  countdownDuration: integer("countdown_duration").notNull().default(60), // seconds before auto-submit
  firstWarningTime: integer("first_warning_time").notNull().default(20), // seconds before auto-submit for first urgent warning
  finalWarningTime: integer("final_warning_time").notNull().default(10), // seconds for final warning
  
  // Voice Settings
  voiceLanguage: text("voice_language").notNull().default("both"), // "english", "hindi", "both"
  voiceType: text("voice_type").notNull().default("young_female"), // "young_female", "adult_female", "mature_female"
  voiceRate: integer("voice_rate").notNull().default(85), // percentage (0-100)
  voiceVolume: integer("voice_volume").notNull().default(75), // percentage (0-100)
  voicePitch: integer("voice_pitch").notNull().default(100), // percentage (0-200, 100 = normal)
  voiceRepeatInterval: integer("voice_repeat_interval").notNull().default(15), // seconds between announcements
  
  // Warning Messages (English)
  fullscreenWarningEn: text("fullscreen_warning_en").notNull().default("Attention please. You have exited fullscreen mode. Please return to fullscreen immediately to continue your exam."),
  cameraWarningEn: text("camera_warning_en").notNull().default("Attention please. Your face is not visible in camera. Please position yourself in front of the camera."),
  multifaceWarningEn: text("multiface_warning_en").notNull().default("Attention please. Multiple faces detected. Only one person is allowed during the exam."),
  autoSubmitWarningEn: text("auto_submit_warning_en").notNull().default("Warning! Your exam will be automatically submitted in {seconds} seconds. Please resolve the issue immediately."),
  finalWarningEn: text("final_warning_en").notNull().default("Final warning! {seconds} seconds remaining."),
  
  // Warning Messages (Hindi)
  fullscreenWarningHi: text("fullscreen_warning_hi").notNull().default("Kripya dhyan dein. Aapne fullscreen mode se bahar nikle hain. Kripya turant fullscreen mein wapas aayein."),
  cameraWarningHi: text("camera_warning_hi").notNull().default("Kripya dhyan dein. Aapka chehra camera mein dikhai nahi de raha. Kripya camera ke saamne aayein."),
  multifaceWarningHi: text("multiface_warning_hi").notNull().default("Kripya dhyan dein. Ek se zyada log dikhai de rahe hain. Exam ke dauran sirf ek vyakti allowed hai."),
  autoSubmitWarningHi: text("auto_submit_warning_hi").notNull().default("Chetavni! Aapka exam {seconds} second mein auto-submit ho jayega. Kripya turant samasya suljhayein."),
  finalWarningHi: text("final_warning_hi").notNull().default("Antim chetavni! {seconds} second bache hain."),
  
  // Short Combined Messages
  fullscreenShortMsg: text("fullscreen_short_msg").notNull().default("Please return to fullscreen. Kripya fullscreen mein wapas aayein."),
  cameraShortMsg: text("camera_short_msg").notNull().default("Please look at camera. Kripya camera ki taraf dekhein."),
  multifaceShortMsg: text("multiface_short_msg").notNull().default("Only one person allowed. Sirf ek vyakti allowed hai."),
  
  // Siren Settings (if warningType includes siren)
  sirenVolume: integer("siren_volume").notNull().default(30), // percentage (0-100)
  sirenFrequencyLow: integer("siren_frequency_low").notNull().default(600), // Hz
  sirenFrequencyHigh: integer("siren_frequency_high").notNull().default(800), // Hz
  
  // Active/Inactive
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- PROCTORING WARNING TRANSLATIONS (per language) ---
export const proctoringWarningTranslations = pgTable("proctoring_warning_translations", {
  id: serial("id").primaryKey(),
  languageCode: text("language_code").notNull(), // en, hi, bn, te, etc.
  
  // Warning Messages
  fullscreenWarning: text("fullscreen_warning").notNull().default(""),
  cameraWarning: text("camera_warning").notNull().default(""),
  multifaceWarning: text("multiface_warning").notNull().default(""),
  autoSubmitWarning: text("auto_submit_warning").notNull().default(""), // Contains {seconds} placeholder
  finalWarning: text("final_warning").notNull().default(""), // Contains {seconds} placeholder
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- INSERT SCHEMAS ---
export const insertProctorSettingsSchema = createInsertSchema(proctorSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProctorSessionSchema = createInsertSchema(proctorSessions).omit({ id: true, createdAt: true });
export const insertProctorEventSchema = createInsertSchema(proctorEvents).omit({ id: true, createdAt: true });
export const insertViolationRuleSchema = createInsertSchema(violationRules).omit({ id: true, createdAt: true });
export const insertSystemCheckResultSchema = createInsertSchema(systemCheckResults).omit({ id: true, createdAt: true });
export const insertProctoringWarningSettingsSchema = createInsertSchema(proctoringWarningSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProctoringWarningTranslationSchema = createInsertSchema(proctoringWarningTranslations).omit({ id: true, createdAt: true, updatedAt: true });

// --- TYPES ---
export type ProctorSettings = typeof proctorSettings.$inferSelect;
export type InsertProctorSettings = z.infer<typeof insertProctorSettingsSchema>;
export type ProctorSession = typeof proctorSessions.$inferSelect;
export type InsertProctorSession = z.infer<typeof insertProctorSessionSchema>;
export type ProctorEvent = typeof proctorEvents.$inferSelect;
export type InsertProctorEvent = z.infer<typeof insertProctorEventSchema>;
export type ViolationRule = typeof violationRules.$inferSelect;
export type InsertViolationRule = z.infer<typeof insertViolationRuleSchema>;
export type SystemCheckResult = typeof systemCheckResults.$inferSelect;
export type InsertSystemCheckResult = z.infer<typeof insertSystemCheckResultSchema>;
export type ProctoringWarningSettings = typeof proctoringWarningSettings.$inferSelect;
export type InsertProctoringWarningSettings = z.infer<typeof insertProctoringWarningSettingsSchema>;
export type ProctoringWarningTranslation = typeof proctoringWarningTranslations.$inferSelect;
export type InsertProctoringWarningTranslation = z.infer<typeof insertProctoringWarningTranslationSchema>;

// ============================
// MARKETING AUTOMATION MODULE
// ============================

// --- SOCIAL PLATFORMS CONFIG ---
export const socialPlatforms = pgTable("social_platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Facebook, Instagram, X, LinkedIn
  code: text("code").notNull().unique(), // facebook, instagram, x, linkedin
  isEnabled: boolean("is_enabled").default(false),
  apiKeyConfigured: boolean("api_key_configured").default(false),
  settings: jsonb("settings"), // platform-specific settings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- MARKETING EVENTS (triggers for content) ---
export const marketingEvents = pgTable("marketing_events", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // blog_published, olympiad_announced, registration_opened, etc.
  sourceId: integer("source_id"), // ID of the related entity (exam, blog, etc.)
  sourceType: text("source_type"), // exam, blog, announcement
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"), // additional event data
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- AI GENERATED CONTENT ---
export const marketingContent = pgTable("marketing_content", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").references(() => marketingEvents.id, { onDelete: "set null" }),
  platformCode: text("platform_code").notNull(), // facebook, instagram, x, linkedin
  contentType: text("content_type").notNull().default("post"), // post, story, reel
  tone: text("tone").notNull().default("promotional"), // promotional, informative, celebratory, reminder
  title: text("title"),
  body: text("body").notNull(), // AI-generated text content
  hashtags: text("hashtags").array(), // array of hashtags
  callToAction: text("call_to_action"),
  imageUrl: text("image_url"), // AI-generated image URL
  imagePrompt: text("image_prompt"), // prompt used to generate image
  status: text("status").notNull().default("draft"), // draft, pending_approval, approved, rejected, published, failed
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  rejectionReason: text("rejection_reason"),
  approvedBy: varchar("approved_by"),
  publishResponse: jsonb("publish_response"), // API response from social platform
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- CONTENT CALENDAR ---
export const marketingCalendar = pgTable("marketing_calendar", {
  id: serial("id").primaryKey(),
  contentId: integer("content_id").notNull().references(() => marketingContent.id, { onDelete: "cascade" }),
  scheduledDate: timestamp("scheduled_date").notNull(),
  timeSlot: text("time_slot"), // morning, afternoon, evening
  priority: integer("priority").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- MARKETING SETTINGS ---
export const marketingSettings = pgTable("marketing_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================
// SOCIAL MEDIA LINKS (Global Settings)
// ============================

export const socialMediaLinks = pgTable("social_media_links", {
  id: serial("id").primaryKey(),
  platformCode: text("platform_code").notNull().unique(), // facebook, instagram, x, linkedin, youtube, etc.
  platformName: text("platform_name").notNull(), // Display name
  pageUrl: text("page_url"), // URL to the social media page
  isActive: boolean("is_active").default(false),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================
// ENQUIRIES MODULE
// ============================
export const enquiries = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  subject: text("subject"),
  message: text("message").notNull(),
  source: text("source").default("coming_soon"), // coming_soon, contact, etc.
  isProcessed: boolean("is_processed").default(false),
  processedAt: timestamp("processed_at"),
  processedBy: varchar("processed_by"),
  emailSent: boolean("email_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- INSERT SCHEMAS ---
export const insertSocialPlatformSchema = createInsertSchema(socialPlatforms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarketingEventSchema = createInsertSchema(marketingEvents).omit({ id: true, createdAt: true });
export const insertMarketingContentSchema = createInsertSchema(marketingContent).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMarketingCalendarSchema = createInsertSchema(marketingCalendar).omit({ id: true, createdAt: true });
export const insertMarketingSettingsSchema = createInsertSchema(marketingSettings).omit({ id: true, updatedAt: true });
export const insertSocialMediaLinkSchema = createInsertSchema(socialMediaLinks).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEnquirySchema = createInsertSchema(enquiries).omit({ id: true, createdAt: true, processedAt: true, processedBy: true, emailSent: true, isProcessed: true });

// --- TYPES ---
export type SocialPlatform = typeof socialPlatforms.$inferSelect;
export type InsertSocialPlatform = z.infer<typeof insertSocialPlatformSchema>;
export type MarketingEvent = typeof marketingEvents.$inferSelect;
export type InsertMarketingEvent = z.infer<typeof insertMarketingEventSchema>;
export type MarketingContent = typeof marketingContent.$inferSelect;
export type InsertMarketingContent = z.infer<typeof insertMarketingContentSchema>;
export type MarketingCalendar = typeof marketingCalendar.$inferSelect;
export type InsertMarketingCalendar = z.infer<typeof insertMarketingCalendarSchema>;
export type MarketingSettings = typeof marketingSettings.$inferSelect;
export type InsertMarketingSettings = z.infer<typeof insertMarketingSettingsSchema>;
export type SocialMediaLink = typeof socialMediaLinks.$inferSelect;
export type InsertSocialMediaLink = z.infer<typeof insertSocialMediaLinkSchema>;
export type Enquiry = typeof enquiries.$inferSelect;
export type InsertEnquiry = z.infer<typeof insertEnquirySchema>;

// ============================
// CONTENT CMS MODULE
// ============================

// --- CMS PAGES ---
export const cmsPages = pgTable("cms_pages", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  pageType: text("page_type").notNull().default("content"), // content, contact, faq, policy
  status: text("status").notNull().default("draft"), // draft, published, archived
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  heroTitle: text("hero_title"),
  heroSubtitle: text("hero_subtitle"),
  heroImageUrl: text("hero_image_url"),
  showInFooter: boolean("show_in_footer").default(false),
  footerOrder: integer("footer_order").default(0),
  footerColumn: text("footer_column").default("company"), // company, legal, resources
  lastUpdatedBy: varchar("last_updated_by"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- CMS PAGE SECTIONS ---
export const cmsPageSections = pgTable("cms_page_sections", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").notNull().references(() => cmsPages.id, { onDelete: "cascade" }),
  sectionType: text("section_type").notNull(), // rich_text, image, faq, gallery, timeline, card_grid, contact_form
  title: text("title"),
  content: jsonb("content"), // Flexible content based on section type
  displayOrder: integer("display_order").notNull().default(0),
  isVisible: boolean("is_visible").default(true),
  settings: jsonb("settings"), // Section-specific settings (layout, styling)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- CMS FORM SUBMISSIONS (distinct from enquiries for CMS-specific forms) ---
export const cmsFormSubmissions = pgTable("cms_form_submissions", {
  id: serial("id").primaryKey(),
  pageId: integer("page_id").references(() => cmsPages.id, { onDelete: "set null" }),
  formType: text("form_type").notNull(), // contact, partner, notify
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  subject: text("subject"),
  message: text("message"),
  formData: jsonb("form_data"), // Additional form fields
  status: text("status").notNull().default("new"), // new, read, replied, archived
  autoReplyStatus: text("auto_reply_status").default("pending"), // pending, sent, failed
  autoReplySentAt: timestamp("auto_reply_sent_at"),
  adminNotified: boolean("admin_notified").default(false),
  notes: text("notes"),
  repliedBy: varchar("replied_by"),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- CMS RELATIONS ---
export const cmsPagesRelations = relations(cmsPages, ({ many }) => ({
  sections: many(cmsPageSections),
}));

export const cmsPageSectionsRelations = relations(cmsPageSections, ({ one }) => ({
  page: one(cmsPages, {
    fields: [cmsPageSections.pageId],
    references: [cmsPages.id],
  }),
}));

// --- CMS INSERT SCHEMAS ---
export const insertCmsPageSchema = createInsertSchema(cmsPages).omit({ id: true, createdAt: true, updatedAt: true, publishedAt: true });
export const insertCmsPageSectionSchema = createInsertSchema(cmsPageSections).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCmsFormSubmissionSchema = createInsertSchema(cmsFormSubmissions).omit({ id: true, createdAt: true, autoReplySentAt: true, repliedAt: true });

// --- CMS TYPES ---
export type CmsPage = typeof cmsPages.$inferSelect;
export type InsertCmsPage = z.infer<typeof insertCmsPageSchema>;
export type CmsPageSection = typeof cmsPageSections.$inferSelect;
export type InsertCmsPageSection = z.infer<typeof insertCmsPageSectionSchema>;
export type CmsFormSubmission = typeof cmsFormSubmissions.$inferSelect;
export type InsertCmsFormSubmission = z.infer<typeof insertCmsFormSubmissionSchema>;

// ============================
// BLOGGING SYSTEM MODULE
// ============================

// --- BLOG CATEGORIES ---
export const blogCategories = pgTable("blog_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: integer("parent_id"), // For subcategories (self-referencing)
  imageUrl: text("image_url"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- BLOG TAGS ---
export const blogTags = pgTable("blog_tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- BLOG POSTS ---
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  excerpt: text("excerpt"), // Short summary for listings
  content: jsonb("content"), // Rich content blocks (drag-drop blocks)
  plainContent: text("plain_content"), // Plain text version for search/SEO
  featuredImageUrl: text("featured_image_url"),
  featuredImageAlt: text("featured_image_alt"),
  categoryId: integer("category_id").references(() => blogCategories.id, { onDelete: "set null" }),
  authorId: varchar("author_id"), // References user
  authorName: text("author_name"),
  authorAvatar: text("author_avatar"),
  status: text("status").notNull().default("draft"), // draft, published, scheduled, archived
  visibility: text("visibility").default("public"), // public, private, password-protected
  password: text("password"), // For password-protected posts
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),
  // SEO Fields
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  metaKeywords: text("meta_keywords"),
  canonicalUrl: text("canonical_url"),
  ogTitle: text("og_title"), // Open Graph title
  ogDescription: text("og_description"), // Open Graph description
  ogImage: text("og_image"), // Open Graph image
  twitterTitle: text("twitter_title"),
  twitterDescription: text("twitter_description"),
  twitterImage: text("twitter_image"),
  // Settings
  allowComments: boolean("allow_comments").default(true),
  isPinned: boolean("is_pinned").default(false), // Sticky post
  isFeatured: boolean("is_featured").default(false),
  readingTimeMinutes: integer("reading_time_minutes"),
  viewCount: integer("view_count").default(0),
  // AI Generation
  isAiGenerated: boolean("is_ai_generated").default(false),
  aiPrompt: text("ai_prompt"), // Prompt used to generate content
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- BLOG POST TAGS (Many-to-Many) ---
export const blogPostTags = pgTable("blog_post_tags", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  tagId: integer("tag_id").notNull().references(() => blogTags.id, { onDelete: "cascade" }),
});

// --- MEDIA LIBRARY ---
export const mediaLibrary = pgTable("media_library", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(), // File size in bytes
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  alt: text("alt"),
  caption: text("caption"),
  folder: text("folder").default("uploads"), // Folder organization
  width: integer("width"), // For images
  height: integer("height"), // For images
  uploadedBy: varchar("uploaded_by"),
  usedIn: jsonb("used_in"), // Array of references where this media is used
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- BLOG RELATIONS ---
export const blogCategoriesRelations = relations(blogCategories, ({ one, many }) => ({
  parent: one(blogCategories, {
    fields: [blogCategories.parentId],
    references: [blogCategories.id],
  }),
  children: many(blogCategories),
  posts: many(blogPosts),
}));

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  category: one(blogCategories, {
    fields: [blogPosts.categoryId],
    references: [blogCategories.id],
  }),
  postTags: many(blogPostTags),
}));

export const blogTagsRelations = relations(blogTags, ({ many }) => ({
  postTags: many(blogPostTags),
}));

export const blogPostTagsRelations = relations(blogPostTags, ({ one }) => ({
  post: one(blogPosts, {
    fields: [blogPostTags.postId],
    references: [blogPosts.id],
  }),
  tag: one(blogTags, {
    fields: [blogPostTags.tagId],
    references: [blogTags.id],
  }),
}));

// --- BLOG INSERT SCHEMAS ---
export const insertBlogCategorySchema = createInsertSchema(blogCategories).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBlogTagSchema = createInsertSchema(blogTags).omit({ id: true, createdAt: true });
export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({ id: true, createdAt: true, updatedAt: true, viewCount: true });
export const insertBlogPostTagSchema = createInsertSchema(blogPostTags).omit({ id: true });
export const insertMediaSchema = createInsertSchema(mediaLibrary).omit({ id: true, createdAt: true, updatedAt: true });

// --- BLOG TYPES ---
export type BlogCategory = typeof blogCategories.$inferSelect;
export type InsertBlogCategory = z.infer<typeof insertBlogCategorySchema>;
export type BlogTag = typeof blogTags.$inferSelect;
export type InsertBlogTag = z.infer<typeof insertBlogTagSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPostTag = typeof blogPostTags.$inferSelect;
export type InsertBlogPostTag = z.infer<typeof insertBlogPostTagSchema>;
export type MediaItem = typeof mediaLibrary.$inferSelect;
export type InsertMediaItem = z.infer<typeof insertMediaSchema>;

// ============================
// PARTNER ECOSYSTEM MODULE
// ============================

// --- PARTNER APPLICATIONS ---
export const partnerApplications = pgTable("partner_applications", {
  id: serial("id").primaryKey(),
  // Basic Details
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  countryCode: text("country_code").default("+91"),
  countryId: integer("country_id").references(() => countries.id),
  cityId: integer("city_id").references(() => cities.id),
  // Organization Details
  organizationName: text("organization_name"),
  organizationType: text("organization_type").notNull(), // individual, school, institute, company
  website: text("website"),
  yearsOfExperience: integer("years_of_experience"),
  // Partnership Type
  partnershipType: text("partnership_type").notNull(), // commission, school_institute, regional, saas_whitelabel
  // Business Capacity
  expectedStudentsPerMonth: text("expected_students_per_month"),
  targetGeography: text("target_geography"),
  marketingChannels: text("marketing_channels"),
  teamSize: text("team_size"),
  // Additional Info
  whyPartner: text("why_partner"),
  priorEdtechExperience: text("prior_edtech_experience"),
  // Status & Workflow
  status: text("status").notNull().default("pending"), // pending, approved, rejected, suspended
  adminNotes: text("admin_notes"),
  reviewedBy: integer("reviewed_by"),
  reviewedAt: timestamp("reviewed_at"),
  // Consent
  termsAccepted: boolean("terms_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- PARTNERS (Approved Partners) ---
export const partners = pgTable("partners", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").references(() => partnerApplications.id),
  // Identity
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  password: text("password"), // Hashed password for partner login
  // Organization
  organizationName: text("organization_name"),
  organizationType: text("organization_type").notNull(),
  // Partnership Details
  partnershipType: text("partnership_type").notNull(),
  partnerCode: text("partner_code").notNull().unique(), // Unique referral code
  referralLink: text("referral_link"),
  // Commission Settings (for commission partners)
  commissionRate: integer("commission_rate").default(10), // Percentage (e.g., 10 = 10%)
  // SaaS Settings (for SaaS/white-label partners)
  saasMonthlyFee: integer("saas_monthly_fee").default(0), // In paise/cents
  saasPlanName: text("saas_plan_name"),
  // Regional Settings
  restrictedToRegion: boolean("restricted_to_region").default(false),
  regionCountryId: integer("region_country_id").references(() => countries.id),
  regionStateId: integer("region_state_id").references(() => states.id),
  // Status
  status: text("status").notNull().default("active"), // active, suspended, terminated
  // Agreement
  agreementAccepted: boolean("agreement_accepted").default(false),
  agreementAcceptedAt: timestamp("agreement_accepted_at"),
  agreementVersion: text("agreement_version"),
  // Bank Details for Payouts
  bankAccountName: text("bank_account_name"),
  bankAccountNumber: text("bank_account_number"),
  bankIfscCode: text("bank_ifsc_code"),
  bankName: text("bank_name"),
  upiId: text("upi_id"),
  paypalEmail: text("paypal_email"),
  // Stats (cached for performance)
  totalStudents: integer("total_students").default(0),
  totalEarnings: integer("total_earnings").default(0), // In paise/cents
  pendingPayout: integer("pending_payout").default(0),
  // Timestamps
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- PARTNER AGREEMENTS ---
export const partnerAgreements = pgTable("partner_agreements", {
  id: serial("id").primaryKey(),
  version: text("version").notNull().unique(), // e.g., "1.0", "2.0"
  title: text("title").notNull(),
  content: text("content").notNull(), // Full agreement text (HTML/Markdown)
  isActive: boolean("is_active").default(false), // Only one active at a time
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- PARTNER EARNINGS (Transaction-level) ---
export const partnerEarnings = pgTable("partner_earnings", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull().references(() => partners.id),
  // Source
  paymentId: integer("payment_id").references(() => payments.id),
  studentId: integer("student_id"), // Reference to student registration
  examId: integer("exam_id").references(() => exams.id),
  // Amounts
  paymentAmount: integer("payment_amount").notNull(), // Original payment in paise/cents
  commissionRate: integer("commission_rate").notNull(), // % at time of transaction
  commissionAmount: integer("commission_amount").notNull(), // Calculated commission
  // Status
  status: text("status").notNull().default("pending"), // pending, confirmed, paid, cancelled
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
});

// --- PARTNER PAYOUTS ---
export const partnerPayouts = pgTable("partner_payouts", {
  id: serial("id").primaryKey(),
  partnerId: integer("partner_id").notNull().references(() => partners.id),
  // Amount
  amount: integer("amount").notNull(), // In paise/cents
  currency: text("currency").default("INR"),
  // Status
  status: text("status").notNull().default("pending"), // pending, approved, processing, paid, rejected
  // Payment Details
  payoutMethod: text("payout_method"), // bank_transfer, upi, paypal
  transactionId: text("transaction_id"), // External transaction reference
  // Admin
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  rejectedReason: text("rejected_reason"),
  // Notes
  partnerNotes: text("partner_notes"),
  adminNotes: text("admin_notes"),
  // Timestamps
  requestedAt: timestamp("requested_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- PARTNER SETTINGS (Admin-controlled global settings) ---
export const partnerSettings = pgTable("partner_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- PARTNER INSERT SCHEMAS ---
export const insertPartnerApplicationSchema = createInsertSchema(partnerApplications).omit({ 
  id: true, createdAt: true, updatedAt: true, status: true, reviewedBy: true, reviewedAt: true 
});
export const insertPartnerSchema = createInsertSchema(partners).omit({ 
  id: true, createdAt: true, updatedAt: true, totalStudents: true, totalEarnings: true, pendingPayout: true 
});
export const insertPartnerAgreementSchema = createInsertSchema(partnerAgreements).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPartnerEarningSchema = createInsertSchema(partnerEarnings).omit({ id: true, createdAt: true });
export const insertPartnerPayoutSchema = createInsertSchema(partnerPayouts).omit({ id: true, createdAt: true, requestedAt: true });

// --- PARTNER TYPES ---
export type PartnerApplication = typeof partnerApplications.$inferSelect;
export type InsertPartnerApplication = z.infer<typeof insertPartnerApplicationSchema>;
export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type PartnerAgreement = typeof partnerAgreements.$inferSelect;
export type InsertPartnerAgreement = z.infer<typeof insertPartnerAgreementSchema>;
export type PartnerEarning = typeof partnerEarnings.$inferSelect;
export type InsertPartnerEarning = z.infer<typeof insertPartnerEarningSchema>;
export type PartnerPayout = typeof partnerPayouts.$inferSelect;
export type InsertPartnerPayout = z.infer<typeof insertPartnerPayoutSchema>;

// ============================
// AI CHATBOT SYSTEM MODULE
// ============================

// --- CHATBOT AGENTS ---
export const chatbotAgents = pgTable("chatbot_agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gender: text("gender").notNull().default("female"), // male, female, neutral
  tone: text("tone").notNull().default("professional"), // warm, friendly, professional, formal
  avatarUrl: text("avatar_url"),
  systemPrompt: text("system_prompt").notNull(),
  confidenceThreshold: integer("confidence_threshold").notNull().default(75), // 0-100
  languages: jsonb("languages").notNull().default(["en"]), // Array of supported languages
  knowledgeScope: text("knowledge_scope"), // Comma-separated scope tags
  escalationRules: jsonb("escalation_rules"), // JSON rules for escalation
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- CHATBOT FLOWS ---
export const chatbotFlows = pgTable("chatbot_flows", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  triggerType: text("trigger_type").default("greeting"), // greeting, keyword, intent
  triggerValue: text("trigger_value"), // keyword or intent value
  version: integer("version").default(1),
  status: text("status").notNull().default("draft"), // draft, active, archived
  nodes: jsonb("nodes"), // React Flow nodes array for visual builder
  edges: jsonb("edges"), // React Flow edges array for visual builder
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- AGENT FLOW ASSIGNMENTS ---
export const agentFlows = pgTable("agent_flows", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => chatbotAgents.id, { onDelete: "cascade" }),
  flowId: integer("flow_id").notNull().references(() => chatbotFlows.id, { onDelete: "cascade" }),
  isDefault: boolean("is_default").default(false),
  priority: integer("priority").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- FLOW NODES ---
export const flowNodes = pgTable("flow_nodes", {
  id: serial("id").primaryKey(),
  flowId: integer("flow_id").notNull().references(() => chatbotFlows.id, { onDelete: "cascade" }),
  nodeType: text("node_type").notNull(), // start, message, question, condition, knowledge, ai_routing, escalation, end
  position: jsonb("position").notNull(), // {x: number, y: number}
  config: jsonb("config").notNull(), // Node-specific configuration
  createdAt: timestamp("created_at").defaultNow(),
});

// --- FLOW EDGES ---
export const flowEdges = pgTable("flow_edges", {
  id: serial("id").primaryKey(),
  flowId: integer("flow_id").notNull().references(() => chatbotFlows.id, { onDelete: "cascade" }),
  sourceNodeId: integer("source_node_id").notNull().references(() => flowNodes.id, { onDelete: "cascade" }),
  targetNodeId: integer("target_node_id").notNull().references(() => flowNodes.id, { onDelete: "cascade" }),
  condition: jsonb("condition"), // Optional condition for conditional edges
  label: text("label"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- KNOWLEDGE BASE ---
export const chatbotKnowledgeBase = pgTable("chatbot_knowledge_base", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  sourceType: text("source_type").notNull().default("manual"), // manual, document, url, faq
  sourceUrl: text("source_url"),
  language: text("language").notNull().default("en"),
  category: text("category"),
  tags: text("tags"), // Comma-separated tags
  confidenceWeight: integer("confidence_weight").default(100), // 0-100
  embedding: jsonb("embedding"), // Vector embedding for semantic search
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- HUMAN AGENTS (for escalation) ---
export const humanAgents = pgTable("human_agents", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id), // Link to system user
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  avatarUrl: text("avatar_url"),
  status: text("status").notNull().default("offline"), // online, offline, busy
  languagesSupported: jsonb("languages_supported").default([]), // Array of language codes
  maxActiveChats: integer("max_active_chats").default(5),
  currentActiveChats: integer("current_active_chats").default(0),
  department: text("department"),
  skills: jsonb("skills").default([]), // Array of skill tags
  lastActiveAt: timestamp("last_active_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- CHAT SESSIONS ---
export const chatbotSessions = pgTable("chatbot_sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(), // UUID for anonymous tracking
  userId: varchar("user_id").references(() => users.id), // Optional if logged in
  agentId: integer("agent_id").notNull().references(() => chatbotAgents.id),
  language: text("language").notNull().default("en"),
  userName: text("user_name"), // Collected during conversation
  userDob: text("user_dob"), // Collected during conversation
  userAge: integer("user_age"), // Calculated from DOB
  userPhone: text("user_phone"), // Collected during escalation
  userEmail: text("user_email"), // User email
  metadata: jsonb("metadata"), // Additional session data
  // Enhanced status: active, waiting_for_user, follow_up_sent, escalated_to_human, closed_by_inactivity, closed_by_user, closed_after_human_chat
  status: text("status").notNull().default("active"),
  lastUserMessageAt: timestamp("last_user_message_at"), // Track user activity
  lastAgentMessageAt: timestamp("last_agent_message_at"), // Track agent activity
  followUpSentAt: timestamp("follow_up_sent_at"), // When follow-up was sent
  closedReason: text("closed_reason"), // inactivity, user_request, resolved, human_closed
  escalatedAt: timestamp("escalated_at"), // When escalated to human
  humanAgentId: integer("human_agent_id").references(() => humanAgents.id), // Assigned human agent
  escalationReason: text("escalation_reason"), // Why escalated
  satisfactionScore: integer("satisfaction_score"), // 1-5 rating
  resolutionStatus: text("resolution_status"), // resolved, unresolved, transferred
  lowConfidenceCount: integer("low_confidence_count").default(0), // Track repeated low confidence
  dissatisfactionCount: integer("dissatisfaction_count").default(0), // Track dissatisfaction signals
  startedAt: timestamp("started_at").defaultNow(),
  endedAt: timestamp("ended_at"),
});

// --- CHAT ASSIGNMENTS (Human Agent to Session) ---
export const chatAssignments = pgTable("chat_assignments", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => chatbotSessions.id, { onDelete: "cascade" }),
  humanAgentId: integer("human_agent_id").notNull().references(() => humanAgents.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"), // When agent accepted
  closedAt: timestamp("closed_at"),
  closedBy: text("closed_by"), // agent, user, system
  internalNotes: text("internal_notes"), // Agent notes
  resolutionSummary: text("resolution_summary"),
  issueCategory: text("issue_category"), // exam, payment, login, result, certificate, technical, other
  status: text("status").notNull().default("pending"), // pending, active, completed, transferred
});

// --- SUPPORT AGENT SESSIONS (Login/Logout Tracking) ---
export const agentSessions = pgTable("agent_sessions", {
  id: serial("id").primaryKey(),
  humanAgentId: integer("human_agent_id").notNull().references(() => humanAgents.id, { onDelete: "cascade" }),
  sessionToken: text("session_token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  loginAt: timestamp("login_at").defaultNow(),
  logoutAt: timestamp("logout_at"),
  lastActivityAt: timestamp("last_activity_at").defaultNow(),
  isActive: boolean("is_active").default(true),
  logoutReason: text("logout_reason"), // manual, timeout, forced, disconnected
});

// --- AI HANDOVER LOGS ---
export const aiHandoverLogs = pgTable("ai_handover_logs", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => chatbotSessions.id, { onDelete: "cascade" }),
  fromAgentType: text("from_agent_type").notNull().default("ai"), // ai, human
  toAgentType: text("to_agent_type").notNull().default("human"), // human, ai
  humanAgentId: integer("human_agent_id").references(() => humanAgents.id),
  handoverReason: text("handover_reason").notNull(), // user_request, low_confidence, repeated_failure, sensitive_issue, agent_escalation
  aiConfidenceScore: integer("ai_confidence_score"), // AI confidence at handover
  userFrustrationLevel: integer("user_frustration_level"), // 0-100
  aiSummary: text("ai_summary"), // AI-generated summary for human agent
  contextData: jsonb("context_data"), // User profile, exam attempts, payments, etc.
  handoverAt: timestamp("handover_at").defaultNow(),
  humanAcceptedAt: timestamp("human_accepted_at"),
  wasSuccessful: boolean("was_successful"), // Did human resolve the issue?
});

// --- AGENT PERFORMANCE METRICS ---
export const agentPerformanceMetrics = pgTable("agent_performance_metrics", {
  id: serial("id").primaryKey(),
  humanAgentId: integer("human_agent_id").notNull().references(() => humanAgents.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(), // Metrics for this date
  totalChatsHandled: integer("total_chats_handled").default(0),
  chatsResolvedByAgent: integer("chats_resolved_by_agent").default(0),
  chatsTransferred: integer("chats_transferred").default(0),
  averageResponseTime: integer("avg_response_time"), // seconds
  averageResolutionTime: integer("avg_resolution_time"), // seconds
  averageSatisfactionScore: real("avg_satisfaction_score"), // 1-5
  firstResponseTime: integer("first_response_time"), // seconds
  totalMessagesSent: integer("total_messages_sent").default(0),
  escalationsReceived: integer("escalations_received").default(0),
  escalationsInitiated: integer("escalations_initiated").default(0),
  onlineMinutes: integer("online_minutes").default(0),
  busyMinutes: integer("busy_minutes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- ABUSE REPORTS ---
export const abuseReports = pgTable("abuse_reports", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatbotSessions.id),
  reportedUserId: varchar("reported_user_id").references(() => users.id),
  reportedByAgentId: integer("reported_by_agent_id").references(() => humanAgents.id),
  reportedByAdminId: varchar("reported_by_admin_id").references(() => users.id),
  reportType: text("report_type").notNull(), // abusive_language, spam, harassment, threats, other
  description: text("description"),
  evidenceMessageIds: jsonb("evidence_message_ids"), // Array of message IDs
  status: text("status").notNull().default("pending"), // pending, reviewed, action_taken, dismissed
  actionTaken: text("action_taken"), // warning, temporary_ban, permanent_ban, none
  actionTakenByAdminId: varchar("action_taken_by_admin_id").references(() => users.id),
  bannedUntil: timestamp("banned_until"),
  isPermanentBan: boolean("is_permanent_ban").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
});

// --- ISSUE CATEGORIES ---
export const issueCategories = pgTable("issue_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // exam, payment, login, result, certificate, technical, other
  displayName: text("display_name").notNull(),
  description: text("description"),
  priority: integer("priority").default(0), // Higher = more urgent
  autoEscalate: boolean("auto_escalate").default(false), // Automatically escalate to human
  slaMinutes: integer("sla_minutes").default(60), // Target resolution time
  keywords: jsonb("keywords").default([]), // Keywords for auto-detection
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- CHAT QUALITY REVIEWS (Admin reviews agent chats) ---
export const chatQualityReviews = pgTable("chat_quality_reviews", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => chatAssignments.id, { onDelete: "cascade" }),
  reviewedByAdminId: varchar("reviewed_by_admin_id").references(() => users.id),
  qualityScore: integer("quality_score"), // 1-10
  responseTimeScore: integer("response_time_score"), // 1-10
  resolutionScore: integer("resolution_score"), // 1-10
  professionalismScore: integer("professionalism_score"), // 1-10
  overallScore: real("overall_score"), // Calculated average
  feedback: text("feedback"),
  flaggedIssues: jsonb("flagged_issues"), // Array of issue types
  createdAt: timestamp("created_at").defaultNow(),
});

// --- QUICK REPLIES (Canned responses for agents) ---
export const quickReplies = pgTable("quick_replies", {
  id: serial("id").primaryKey(),
  humanAgentId: integer("human_agent_id").references(() => humanAgents.id), // null = global
  category: text("category"), // greeting, closing, apology, info, etc.
  title: text("title").notNull(),
  content: text("content").notNull(),
  shortcut: text("shortcut"), // Keyboard shortcut like "/greet"
  usageCount: integer("usage_count").default(0),
  isGlobal: boolean("is_global").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- SUPPORT SYSTEM SETTINGS ---
export const supportSettings = pgTable("support_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  valueType: text("value_type").default("string"), // string, number, boolean, json
  category: text("category"), // ai, routing, sla, notifications
  description: text("description"),
  updatedByAdminId: varchar("updated_by_admin_id").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- CHAT MESSAGES ---
export const chatbotMessages = pgTable("chatbot_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => chatbotSessions.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(), // user, agent, system
  message: text("message").notNull(),
  sourceType: text("source_type"), // flow, knowledge, ai_reasoning, escalation
  sourceId: text("source_id"), // Reference to flow node or KB entry
  confidenceScore: integer("confidence_score"), // 0-100
  metadata: jsonb("metadata"), // Additional message data
  createdAt: timestamp("created_at").defaultNow(),
});

// --- CHATBOT LEADS ---
export const chatbotLeads = pgTable("chatbot_leads", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatbotSessions.id),
  agentId: integer("agent_id").references(() => chatbotAgents.id),
  name: text("name"),
  phone: text("phone"),
  email: text("email"),
  reason: text("reason"), // Why lead was captured (escalation, inquiry, etc.)
  status: text("status").notNull().default("new"), // new, contacted, qualified, converted, lost
  notes: text("notes"),
  assignedTo: integer("assigned_to"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- CHATBOT BLOCKED DOMAINS (Safety) ---
export const chatbotBlockedDomains = pgTable("chatbot_blocked_domains", {
  id: serial("id").primaryKey(),
  domain: text("domain").notNull(), // medical, legal, financial, etc.
  keywords: jsonb("keywords").notNull(), // Array of keywords to detect
  responseTemplate: text("response_template").notNull(), // What to say when blocked
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- CHATBOT SETTINGS ---
export const chatbotSettings = pgTable("chatbot_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- AUDIO MESSAGES ---
export const audioMessages = pgTable("audio_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => chatbotSessions.id, { onDelete: "cascade" }),
  messageId: integer("message_id").references(() => chatbotMessages.id, { onDelete: "cascade" }),
  audioUrl: text("audio_url"), // URL to stored audio file
  transcript: text("transcript"), // Speech-to-text result
  detectedLanguage: text("detected_language").default("en"),
  clarityScore: integer("clarity_score").default(0), // 0-100
  intentScore: integer("intent_score").default(0), // 0-100
  confidenceScore: integer("confidence_score").default(0), // Combined confidence 0-100
  duration: integer("duration").default(0), // Audio duration in seconds
  createdAt: timestamp("created_at").defaultNow(),
});

// --- AGENT VOICE SETTINGS ---
export const agentVoiceSettings = pgTable("agent_voice_settings", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => chatbotAgents.id, { onDelete: "cascade" }),
  voiceEnabled: boolean("voice_enabled").default(false),
  voiceGender: text("voice_gender").default("female"), // male, female
  accent: text("accent").default("en-IN"), // Voice accent code
  speed: real("speed").default(1.0), // 0.5 to 2.0
  pitch: real("pitch").default(1.0), // 0.5 to 2.0
  replyMode: text("reply_mode").default("text"), // text, voice, both
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- CHATBOT INSERT SCHEMAS ---
export const insertChatbotAgentSchema = createInsertSchema(chatbotAgents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatbotFlowSchema = createInsertSchema(chatbotFlows).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAgentFlowSchema = createInsertSchema(agentFlows).omit({ id: true, createdAt: true });
export const insertFlowNodeSchema = createInsertSchema(flowNodes).omit({ id: true, createdAt: true });
export const insertFlowEdgeSchema = createInsertSchema(flowEdges).omit({ id: true, createdAt: true });
export const insertChatbotKnowledgeSchema = createInsertSchema(chatbotKnowledgeBase).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatbotSessionSchema = createInsertSchema(chatbotSessions).omit({ id: true, startedAt: true, endedAt: true });
export const insertChatbotMessageSchema = createInsertSchema(chatbotMessages).omit({ id: true, createdAt: true });
export const insertChatbotLeadSchema = createInsertSchema(chatbotLeads).omit({ id: true, createdAt: true, updatedAt: true });
export const insertAudioMessageSchema = createInsertSchema(audioMessages).omit({ id: true, createdAt: true });
export const insertAgentVoiceSettingsSchema = createInsertSchema(agentVoiceSettings).omit({ id: true, createdAt: true, updatedAt: true });
export const insertHumanAgentSchema = createInsertSchema(humanAgents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatAssignmentSchema = createInsertSchema(chatAssignments).omit({ id: true, assignedAt: true });
export const insertAgentSessionSchema = createInsertSchema(agentSessions).omit({ id: true, loginAt: true });
export const insertAiHandoverLogSchema = createInsertSchema(aiHandoverLogs).omit({ id: true, handoverAt: true });
export const insertAgentPerformanceMetricSchema = createInsertSchema(agentPerformanceMetrics).omit({ id: true, createdAt: true });
export const insertAbuseReportSchema = createInsertSchema(abuseReports).omit({ id: true, createdAt: true });
export const insertIssueCategorySchema = createInsertSchema(issueCategories).omit({ id: true, createdAt: true });
export const insertChatQualityReviewSchema = createInsertSchema(chatQualityReviews).omit({ id: true, createdAt: true });
export const insertQuickReplySchema = createInsertSchema(quickReplies).omit({ id: true, createdAt: true });
export const insertSupportSettingSchema = createInsertSchema(supportSettings).omit({ id: true, updatedAt: true });

// --- CHATBOT TYPES ---
export type ChatbotAgent = typeof chatbotAgents.$inferSelect;
export type InsertChatbotAgent = z.infer<typeof insertChatbotAgentSchema>;
export type ChatbotFlow = typeof chatbotFlows.$inferSelect;
export type InsertChatbotFlow = z.infer<typeof insertChatbotFlowSchema>;
export type AgentFlow = typeof agentFlows.$inferSelect;
export type InsertAgentFlow = z.infer<typeof insertAgentFlowSchema>;
export type FlowNode = typeof flowNodes.$inferSelect;
export type InsertFlowNode = z.infer<typeof insertFlowNodeSchema>;
export type FlowEdge = typeof flowEdges.$inferSelect;
export type InsertFlowEdge = z.infer<typeof insertFlowEdgeSchema>;
export type ChatbotKnowledge = typeof chatbotKnowledgeBase.$inferSelect;
export type InsertChatbotKnowledge = z.infer<typeof insertChatbotKnowledgeSchema>;
export type ChatbotSession = typeof chatbotSessions.$inferSelect;
export type InsertChatbotSession = z.infer<typeof insertChatbotSessionSchema>;
export type ChatbotMessage = typeof chatbotMessages.$inferSelect;
export type InsertChatbotMessage = z.infer<typeof insertChatbotMessageSchema>;
export type ChatbotLead = typeof chatbotLeads.$inferSelect;
export type InsertChatbotLead = z.infer<typeof insertChatbotLeadSchema>;
export type AudioMessage = typeof audioMessages.$inferSelect;
export type InsertAudioMessage = z.infer<typeof insertAudioMessageSchema>;
export type AgentVoiceSettings = typeof agentVoiceSettings.$inferSelect;
export type InsertAgentVoiceSettings = z.infer<typeof insertAgentVoiceSettingsSchema>;
export type HumanAgent = typeof humanAgents.$inferSelect;
export type InsertHumanAgent = z.infer<typeof insertHumanAgentSchema>;
export type ChatAssignment = typeof chatAssignments.$inferSelect;
export type InsertChatAssignment = z.infer<typeof insertChatAssignmentSchema>;
export type AgentSession = typeof agentSessions.$inferSelect;
export type InsertAgentSession = z.infer<typeof insertAgentSessionSchema>;
export type AiHandoverLog = typeof aiHandoverLogs.$inferSelect;
export type InsertAiHandoverLog = z.infer<typeof insertAiHandoverLogSchema>;
export type AgentPerformanceMetric = typeof agentPerformanceMetrics.$inferSelect;
export type InsertAgentPerformanceMetric = z.infer<typeof insertAgentPerformanceMetricSchema>;
export type AbuseReport = typeof abuseReports.$inferSelect;
export type InsertAbuseReport = z.infer<typeof insertAbuseReportSchema>;
export type IssueCategory = typeof issueCategories.$inferSelect;
export type InsertIssueCategory = z.infer<typeof insertIssueCategorySchema>;
export type ChatQualityReview = typeof chatQualityReviews.$inferSelect;
export type InsertChatQualityReview = z.infer<typeof insertChatQualityReviewSchema>;
export type QuickReply = typeof quickReplies.$inferSelect;
export type InsertQuickReply = z.infer<typeof insertQuickReplySchema>;
export type SupportSetting = typeof supportSettings.$inferSelect;
export type InsertSupportSetting = z.infer<typeof insertSupportSettingSchema>;

// ============================
// PLATFORM DOCUMENTATION VERSIONS
// ============================

export const platformDocVersions = pgTable("platform_doc_versions", {
  id: serial("id").primaryKey(),
  docType: text("doc_type").notNull(), // 'features' | 'security'
  version: text("version").notNull(),
  content: text("content").notNull(), // JSON stringified content
  changelog: text("changelog"), // What changed in this version
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertPlatformDocVersionSchema = createInsertSchema(platformDocVersions).omit({ id: true, createdAt: true });
export type PlatformDocVersion = typeof platformDocVersions.$inferSelect;
export type InsertPlatformDocVersion = z.infer<typeof insertPlatformDocVersionSchema>;

// ============================
// OLYMPIAD RESULTS SYSTEM
// ============================

// --- OLYMPIAD RESULTS (Individual student results) ---
export const olympiadResults = pgTable("olympiad_results", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  attemptId: integer("attempt_id").notNull().references(() => attempts.id, { onDelete: "cascade" }),
  studentId: integer("student_id").notNull().references(() => studentRegistrations.id, { onDelete: "cascade" }),
  
  // Basic calculation fields
  totalQuestions: integer("total_questions").notNull().default(0),
  attemptedQuestions: integer("attempted_questions").notNull().default(0),
  unattemptedQuestions: integer("unattempted_questions").notNull().default(0),
  correctAnswers: integer("correct_answers").notNull().default(0),
  wrongAnswers: integer("wrong_answers").notNull().default(0),
  
  // Marks calculation
  totalMaxMarks: integer("total_max_marks").notNull().default(0), // Maximum possible marks
  marksFromCorrect: integer("marks_from_correct").notNull().default(0),
  negativeMarks: integer("negative_marks").notNull().default(0), // Deducted marks
  finalObtainedMarks: integer("final_obtained_marks").notNull().default(0),
  percentage: real("percentage").notNull().default(0), // (Obtained / Max) * 100
  
  // Ranking
  overallRank: integer("overall_rank"), // Overall rank in olympiad
  classRank: integer("class_rank"), // Rank within same class/grade
  sectionRank: integer("section_rank"), // Rank within school section (if applicable)
  stateRank: integer("state_rank"), // Rank within same state
  cityRank: integer("city_rank"), // Rank within same city
  schoolRank: integer("school_rank"), // Rank within same school
  
  // Time taken
  timeTakenSeconds: integer("time_taken_seconds").default(0),
  
  // Section-wise breakup (JSON for flexibility)
  sectionWiseBreakup: jsonb("section_wise_breakup"), // {subject: {correct, wrong, marks}}
  
  // Performance rating
  performanceRemark: text("performance_remark"), // Excellent / Good / Average / Needs Improvement
  
  // Answer comparison (stored as JSON for detailed view)
  answerComparison: jsonb("answer_comparison"), // [{questionId, studentAnswer, correctAnswer, isCorrect, marks}]
  
  // Audit fields
  calculatedAt: timestamp("calculated_at").defaultNow(),
  calculatedBy: text("calculated_by"), // Admin who triggered calculation
});

// --- RESULT PUBLICATION STATUS ---
export const resultPublications = pgTable("result_publications", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }).unique(),
  
  // Status flags
  isCalculated: boolean("is_calculated").default(false),
  isLocked: boolean("is_locked").default(false), // Locked = immutable
  isPublished: boolean("is_published").default(false),
  isAnswerKeyReleased: boolean("is_answer_key_released").default(false),
  resultVisibility: text("result_visibility").default("private"), // private, students_only, public
  
  // Statistics
  totalStudentsAppeared: integer("total_students_appeared").default(0),
  averageMarks: real("average_marks").default(0),
  highestMarks: integer("highest_marks").default(0),
  lowestMarks: integer("lowest_marks").default(0),
  passPercentage: real("pass_percentage").default(0),
  
  // Score distribution (JSON for graph)
  scoreDistribution: jsonb("score_distribution"), // [{range: "0-20", count: 10}, ...]
  
  // Question-wise analytics (JSON)
  questionWiseAnalytics: jsonb("question_wise_analytics"), // [{questionId, attempted, correct, wrong, difficulty}]
  
  // Tie-breaker settings
  tieBreakerEnabled: boolean("tie_breaker_enabled").default(false),
  tieBreakerCriteria: text("tie_breaker_criteria").default("none"), // none, less_negative, less_time, more_correct
  
  // Timestamps
  calculatedAt: timestamp("calculated_at"),
  publishedAt: timestamp("published_at"),
  lockedAt: timestamp("locked_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- RESULT AUDIT LOG ---
export const resultAuditLogs = pgTable("result_audit_logs", {
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // calculated, recalculated, published, unpublished, locked, unlocked, answer_key_released
  performedBy: text("performed_by").notNull(), // Admin ID/name
  details: jsonb("details"), // Additional context
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- STUDENT PERFORMANCE REPORTS ---
export const studentPerformanceReports = pgTable("student_performance_reports", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentRegistrations.id, { onDelete: "cascade" }),
  
  // Report metadata
  reportType: text("report_type").default("comprehensive"), // comprehensive, subject_specific, quick_summary
  generatedBy: text("generated_by").default("student"), // student, parent, school, system
  
  // Overall Performance Snapshot
  totalOlympiadsAttempted: integer("total_olympiads_attempted").default(0),
  totalOlympiadsCompleted: integer("total_olympiads_completed").default(0),
  overallAveragePercentage: real("overall_average_percentage").default(0),
  overallAccuracy: real("overall_accuracy").default(0), // (correct / attempted) * 100
  totalCorrectAnswers: integer("total_correct_answers").default(0),
  totalWrongAnswers: integer("total_wrong_answers").default(0),
  totalQuestionsAttempted: integer("total_questions_attempted").default(0),
  
  // Best/Worst Performance
  bestPerformanceExamId: integer("best_performance_exam_id"),
  bestPerformancePercentage: real("best_performance_percentage"),
  worstPerformanceExamId: integer("worst_performance_exam_id"),
  worstPerformancePercentage: real("worst_performance_percentage"),
  
  // Improvement Trend
  improvementTrend: text("improvement_trend").default("stable"), // upward, stable, downward
  improvementScore: real("improvement_score").default(0), // Calculated score for trend
  
  // Subject-wise Analysis (JSON)
  subjectWiseAnalysis: jsonb("subject_wise_analysis"), 
  // [{subject, totalAttempts, avgScore, accuracy, timeSpent, strength: strong/average/weak}]
  
  // Topic-wise Analysis (JSON)
  topicWiseAnalysis: jsonb("topic_wise_analysis"),
  // [{topic, subject, attempts, accuracy, avgTimePerQuestion, trend, classification: strength/critical_weak/avoidance}]
  
  // Weakness Identification
  criticalWeakAreas: jsonb("critical_weak_areas"), // Low accuracy + high attempts
  avoidanceAreas: jsonb("avoidance_areas"), // Low attempts + low score
  strengthAreas: jsonb("strength_areas"), // High accuracy + low time
  
  // Comparison with Previous Report
  previousReportId: integer("previous_report_id"),
  subjectWiseChange: jsonb("subject_wise_change"), // [{subject, previousAccuracy, currentAccuracy, change}]
  overallChange: jsonb("overall_change"), // {previousAvg, currentAvg, changePercent}
  
  // Smart Insights (AI-generated or rule-based)
  insights: jsonb("insights"), // [{type, message, priority, actionable}]
  
  // Suggestions
  subjectSuggestions: jsonb("subject_suggestions"), // [{subject, action, priority}]
  topicSuggestions: jsonb("topic_suggestions"), // [{topic, action, priority}]
  behaviouralSuggestions: jsonb("behavioural_suggestions"), // [{type, message}]
  
  // Performance Timeline Data (for graphs)
  performanceTimeline: jsonb("performance_timeline"), // [{date, examId, percentage, subject}]
  accuracyTimeline: jsonb("accuracy_timeline"), // [{date, accuracy}]
  
  // Report Status
  isLatest: boolean("is_latest").default(true), // Mark latest report
  
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================
// RULE-BASED ASSISTANT MODULE (Cost-Free Chatbot)
// ============================

// --- RULE BOT INTENTS (Pattern matching rules) ---
export const ruleBotIntents = pgTable("rule_bot_intents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(), // general, exam, result, support
  keywords: text("keywords").array().notNull(),
  patterns: text("patterns").array(),
  priority: integer("priority").default(0),
  requiredAuth: boolean("required_auth").default(false),
  allowedRoles: text("allowed_roles").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- RULE BOT RESPONSES (Template responses per intent) ---
export const ruleBotResponses = pgTable("rule_bot_responses", {
  id: serial("id").primaryKey(),
  intentId: integer("intent_id").references(() => ruleBotIntents.id, { onDelete: "cascade" }),
  language: text("language").default("en"),
  responseType: text("response_type").default("text"),
  content: text("content").notNull(),
  quickReplies: jsonb("quick_replies"),
  actionCards: jsonb("action_cards"),
  conditions: jsonb("conditions"),
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- RULE BOT CONVERSATIONS (Session tracking) ---
export const ruleBotConversations = pgTable("rule_bot_conversations", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: integer("user_id"),
  userRole: text("user_role"),
  isGuest: boolean("is_guest").default(true),
  deviceType: text("device_type"),
  currentPage: text("current_page"),
  context: jsonb("context"),
  lastMessageAt: timestamp("last_message_at"),
  messageCount: integer("message_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- RULE BOT MESSAGES (Individual messages) ---
export const ruleBotMessages = pgTable("rule_bot_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => ruleBotConversations.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(),
  messageType: text("message_type").default("text"),
  content: text("content").notNull(),
  intentMatched: text("intent_matched"),
  confidence: real("confidence"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- RULE BOT QUICK ACTIONS (Context-based suggestions) ---
export const ruleBotQuickActions = pgTable("rule_bot_quick_actions", {
  id: serial("id").primaryKey(),
  triggerType: text("trigger_type").notNull(),
  targetRole: text("target_role").notNull(),
  conditions: jsonb("conditions"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionType: text("action_type"),
  actionPayload: jsonb("action_payload"),
  priority: integer("priority").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- RULE BOT INSERT SCHEMAS ---
export const insertRuleBotIntentSchema = createInsertSchema(ruleBotIntents).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRuleBotResponseSchema = createInsertSchema(ruleBotResponses).omit({ id: true, createdAt: true });
export const insertRuleBotConversationSchema = createInsertSchema(ruleBotConversations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertRuleBotMessageSchema = createInsertSchema(ruleBotMessages).omit({ id: true, createdAt: true });
export const insertRuleBotQuickActionSchema = createInsertSchema(ruleBotQuickActions).omit({ id: true, createdAt: true });

// --- RULE BOT TYPES ---
export type RuleBotIntent = typeof ruleBotIntents.$inferSelect;
export type InsertRuleBotIntent = z.infer<typeof insertRuleBotIntentSchema>;
export type RuleBotResponse = typeof ruleBotResponses.$inferSelect;
export type InsertRuleBotResponse = z.infer<typeof insertRuleBotResponseSchema>;
export type RuleBotConversation = typeof ruleBotConversations.$inferSelect;
export type InsertRuleBotConversation = z.infer<typeof insertRuleBotConversationSchema>;
export type RuleBotMessage = typeof ruleBotMessages.$inferSelect;
export type InsertRuleBotMessage = z.infer<typeof insertRuleBotMessageSchema>;
export type RuleBotQuickAction = typeof ruleBotQuickActions.$inferSelect;
export type InsertRuleBotQuickAction = z.infer<typeof insertRuleBotQuickActionSchema>;

// --- INSERT SCHEMAS ---
export const insertOlympiadResultSchema = createInsertSchema(olympiadResults).omit({ id: true, calculatedAt: true });
export const insertResultPublicationSchema = createInsertSchema(resultPublications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertResultAuditLogSchema = createInsertSchema(resultAuditLogs).omit({ id: true, createdAt: true });
export const insertStudentPerformanceReportSchema = createInsertSchema(studentPerformanceReports).omit({ id: true, createdAt: true });

// --- TYPES ---
export type OlympiadResult = typeof olympiadResults.$inferSelect;
export type InsertOlympiadResult = z.infer<typeof insertOlympiadResultSchema>;
export type ResultPublication = typeof resultPublications.$inferSelect;
export type InsertResultPublication = z.infer<typeof insertResultPublicationSchema>;
export type ResultAuditLog = typeof resultAuditLogs.$inferSelect;
export type InsertResultAuditLog = z.infer<typeof insertResultAuditLogSchema>;
export type StudentPerformanceReport = typeof studentPerformanceReports.$inferSelect;
export type InsertStudentPerformanceReport = z.infer<typeof insertStudentPerformanceReportSchema>;

// =====================================================
// ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
// =====================================================

// --- SYSTEM ROLES (Custom roles created by Super Admin) ---
export const systemRoles = pgTable("system_roles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(), // URL-safe identifier
  description: text("description"),
  priority: integer("priority").default(0), // Higher = more priority in conflicts
  isSystemRole: boolean("is_system_role").default(false), // True for built-in roles (COE, Finance, etc.)
  isActive: boolean("is_active").default(true),
  color: varchar("color", { length: 20 }), // For UI badge display
  icon: varchar("icon", { length: 50 }), // Lucide icon name
  createdBy: integer("created_by"), // Super Admin ID who created this role
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- SYSTEM PERMISSIONS (All available permissions in the platform) ---
// Permissions are defined at 4 levels: Module > Page > Action > DataScope
export const systemPermissions = pgTable("system_permissions", {
  id: serial("id").primaryKey(),
  
  // Permission structure (hierarchical)
  module: varchar("module", { length: 100 }).notNull(), // e.g., "exam_management", "finance", "marketing"
  page: varchar("page", { length: 100 }), // e.g., "exam_control", "proctoring", "results"
  action: varchar("action", { length: 50 }), // e.g., "view", "create", "edit", "delete", "approve", "export"
  
  // Permission identifier (unique key combining all levels)
  permissionKey: varchar("permission_key", { length: 255 }).notNull().unique(), // e.g., "exam_management.exam_control.edit"
  
  // Display info
  displayName: varchar("display_name", { length: 200 }).notNull(),
  description: text("description"),
  
  // Grouping for UI
  category: varchar("category", { length: 100 }), // For grouping in permission UI
  sortOrder: integer("sort_order").default(0),
  
  // Metadata
  isSystemPermission: boolean("is_system_permission").default(true), // Cannot be deleted
  requiresDataScope: boolean("requires_data_scope").default(false), // If true, needs data scope selection
  
  createdAt: timestamp("created_at").defaultNow(),
});

// --- ROLE PERMISSIONS (Junction table: which roles have which permissions) ---
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => systemRoles.id, { onDelete: "cascade" }),
  permissionId: integer("permission_id").notNull().references(() => systemPermissions.id, { onDelete: "cascade" }),
  
  // Data scope restrictions (when permission requiresDataScope = true)
  dataScope: varchar("data_scope", { length: 50 }).default("all"), // "all", "assigned_exams", "assigned_regions", "assigned_partners", "own_only"
  dataScopeValues: jsonb("data_scope_values"), // Specific IDs when dataScope != "all" (e.g., [1,2,3] for exam IDs)
  
  // Grant details
  grantedBy: integer("granted_by"), // Super Admin ID
  grantedAt: timestamp("granted_at").defaultNow(),
}, (table) => ({
  // Unique constraint: one permission per role
  uniqueRolePermission: uniqueIndex("unique_role_permission").on(table.roleId, table.permissionId),
}));

// --- USER ROLES (Junction table: which users have which roles - multi-role support) ---
export const userRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  
  // Can assign to either a regular user or a super admin
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  superAdminId: integer("super_admin_id").references(() => superAdmins.id, { onDelete: "cascade" }),
  
  roleId: integer("role_id").notNull().references(() => systemRoles.id, { onDelete: "cascade" }),
  
  // Assignment status
  isActive: boolean("is_active").default(true), // Can toggle role ON/OFF without deleting
  isPrimary: boolean("is_primary").default(false), // Primary role for display purposes
  
  // Assignment details
  assignedBy: integer("assigned_by"), // Super Admin ID who assigned this role
  assignedAt: timestamp("assigned_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // Optional expiration for temporary roles
  
  // Notes
  notes: text("notes"),
});

// --- PERMISSION AUDIT LOGS (Track all permission and role changes) ---
export const permissionAuditLogs = pgTable("permission_audit_logs", {
  id: serial("id").primaryKey(),
  
  // What changed
  entityType: varchar("entity_type", { length: 50 }).notNull(), // "role", "permission", "user_role", "role_permission"
  entityId: integer("entity_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(), // "create", "update", "delete", "assign", "revoke", "enable", "disable"
  
  // Change details
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  changedFields: text("changed_fields").array(), // List of fields that changed
  
  // Who made the change
  performedBy: integer("performed_by").notNull(), // Super Admin ID
  performedByEmail: varchar("performed_by_email", { length: 255 }),
  
  // Context
  reason: text("reason"), // Optional reason for the change
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// --- ROLE TEMPLATES (Pre-defined role templates for quick role creation) ---
export const roleTemplates = pgTable("role_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  permissionKeys: text("permission_keys").array(), // Array of permission keys included in this template
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- RBAC INSERT SCHEMAS ---
export const insertSystemRoleSchema = createInsertSchema(systemRoles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSystemPermissionSchema = createInsertSchema(systemPermissions).omit({ id: true, createdAt: true });
export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true, grantedAt: true });
export const insertUserRoleSchema = createInsertSchema(userRoles).omit({ id: true, assignedAt: true });
export const insertPermissionAuditLogSchema = createInsertSchema(permissionAuditLogs).omit({ id: true, createdAt: true });
export const insertRoleTemplateSchema = createInsertSchema(roleTemplates).omit({ id: true, createdAt: true });

// --- RBAC TYPES ---
export type SystemRole = typeof systemRoles.$inferSelect;
export type InsertSystemRole = z.infer<typeof insertSystemRoleSchema>;
export type SystemPermission = typeof systemPermissions.$inferSelect;
export type InsertSystemPermission = z.infer<typeof insertSystemPermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type PermissionAuditLog = typeof permissionAuditLogs.$inferSelect;
export type InsertPermissionAuditLog = z.infer<typeof insertPermissionAuditLogSchema>;
export type RoleTemplate = typeof roleTemplates.$inferSelect;
export type InsertRoleTemplate = z.infer<typeof insertRoleTemplateSchema>;

// --- PERMISSION KEY CONSTANTS (for type-safe permission checks) ---
export const PERMISSION_MODULES = {
  DASHBOARD: "dashboard",
  EXAM_MANAGEMENT: "exam_management",
  PROCTORING: "proctoring",
  RESULTS: "results",
  FINANCE: "finance",
  MARKETING: "marketing",
  CONTENT: "content",
  AI_CHATBOT: "ai_chatbot",
  SUPPORT: "support",
  ANALYTICS: "analytics",
  USERS: "users",
  PARTNERS: "partners",
  SCHOOLS: "schools",
  SETTINGS: "settings",
  SYSTEM: "system",
} as const;

export const PERMISSION_ACTIONS = {
  VIEW: "view",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
  APPROVE: "approve",
  REJECT: "reject",
  EXPORT: "export",
  IMPORT: "import",
  PUBLISH: "publish",
  UNPUBLISH: "unpublish",
  MANAGE: "manage", // Full control
} as const;

export const DATA_SCOPES = {
  ALL: "all",
  ASSIGNED_EXAMS: "assigned_exams",
  ASSIGNED_REGIONS: "assigned_regions",
  ASSIGNED_PARTNERS: "assigned_partners",
  OWN_ONLY: "own_only",
} as const;

// ============================
// SYSTEM AUDIT & HEALTH MODULE
// ============================

// --- SYSTEM AUDITS ---
export const systemAudits = pgTable("system_audits", {
  id: serial("id").primaryKey(),
  runId: varchar("run_id", { length: 50 }).notNull().unique(), // Unique identifier for this audit run
  status: varchar("status", { length: 20 }).notNull().default("running"), // running, completed, failed
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  runBy: varchar("run_by").references(() => users.id), // Super admin who triggered the audit
  
  // Overall Scores (0-100)
  overallScore: integer("overall_score"),
  securityScore: integer("security_score"),
  performanceScore: integer("performance_score"),
  databaseScore: integer("database_score"),
  
  // Module Results (JSON with module-wise breakdown)
  moduleResults: jsonb("module_results").$type<{
    moduleName: string;
    status: "passed" | "warning" | "failed";
    score: number;
    issuesCount: number;
    tests: {
      name: string;
      status: "passed" | "warning" | "failed";
      message?: string;
      severity?: "low" | "medium" | "high" | "critical";
    }[];
  }[]>(),
  
  // Security Findings
  securityFindings: jsonb("security_findings").$type<{
    type: string;
    severity: "low" | "medium" | "high" | "critical";
    module: string;
    description: string;
    fixed: boolean;
    fixApplied?: string;
  }[]>(),
  
  // Performance Metrics
  performanceMetrics: jsonb("performance_metrics").$type<{
    apiResponseTimes: Record<string, number>;
    dbQueryTimes: Record<string, number>;
    memoryUsage: number;
    suggestions: string[];
  }>(),
  
  // Database Health
  databaseHealth: jsonb("database_health").$type<{
    tableCount: number;
    totalRecords: number;
    indexHealth: "good" | "needs_optimization" | "poor";
    missingIndexes: string[];
    slowQueries: string[];
    suggestions: string[];
  }>(),
  
  // Summary counts
  totalTests: integer("total_tests").default(0),
  passedTests: integer("passed_tests").default(0),
  warningTests: integer("warning_tests").default(0),
  failedTests: integer("failed_tests").default(0),
  
  // Auto-fixes applied
  autoFixesApplied: jsonb("auto_fixes_applied").$type<{
    module: string;
    issue: string;
    fix: string;
    appliedAt: string;
  }[]>(),
  
  // Comparison with previous run
  comparisonWithPrevious: jsonb("comparison_with_previous").$type<{
    previousRunId: string;
    scoreChange: number;
    improved: string[];
    degraded: string[];
    unchanged: string[];
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// --- SYSTEM AUDIT INSERT SCHEMA ---
export const insertSystemAuditSchema = createInsertSchema(systemAudits).omit({ id: true, createdAt: true });
export type SystemAudit = typeof systemAudits.$inferSelect;
export type InsertSystemAudit = z.infer<typeof insertSystemAuditSchema>;

// --- AUDIT ALERT CONFIGURATIONS ---
export const auditAlertConfigs = pgTable("audit_alert_configs", {
  id: serial("id").primaryKey(),
  isEnabled: boolean("is_enabled").default(true),
  
  // Email Configuration
  emailEnabled: boolean("email_enabled").default(true),
  emailRecipients: text("email_recipients").array(), // List of email addresses
  emailProvider: varchar("email_provider", { length: 50 }).default("smtp"), // smtp, sendgrid, ses
  smtpHost: text("smtp_host"),
  smtpPort: integer("smtp_port").default(587),
  smtpUser: text("smtp_user"),
  smtpPassword: text("smtp_password"), // Encrypted
  smtpFromEmail: text("smtp_from_email"),
  smtpFromName: text("smtp_from_name").default("Samikaran Olympiad"),
  
  // SMS Configuration
  smsEnabled: boolean("sms_enabled").default(false),
  smsRecipients: text("sms_recipients").array(), // List of phone numbers
  smsProvider: varchar("sms_provider", { length: 50 }).default("twilio"), // twilio, sns
  twilioAccountSid: text("twilio_account_sid"),
  twilioAuthToken: text("twilio_auth_token"), // Encrypted
  twilioPhoneNumber: text("twilio_phone_number"),
  
  // Alert Thresholds
  alertOnCritical: boolean("alert_on_critical").default(true),
  alertOnHigh: boolean("alert_on_high").default(true),
  alertOnMedium: boolean("alert_on_medium").default(false),
  alertOnLow: boolean("alert_on_low").default(false),
  alertOnScoreDrop: boolean("alert_on_score_drop").default(true),
  scoreDropThreshold: integer("score_drop_threshold").default(10), // Alert if score drops by this much
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAuditAlertConfigSchema = createInsertSchema(auditAlertConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export type AuditAlertConfig = typeof auditAlertConfigs.$inferSelect;
export type InsertAuditAlertConfig = z.infer<typeof insertAuditAlertConfigSchema>;

// --- AUDIT SCHEDULE CONFIGURATION ---
export const auditScheduleConfigs = pgTable("audit_schedule_configs", {
  id: serial("id").primaryKey(),
  isEnabled: boolean("is_enabled").default(true),
  intervalHours: integer("interval_hours").default(24), // Run every N hours
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  autoFixEnabled: boolean("auto_fix_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAuditScheduleConfigSchema = createInsertSchema(auditScheduleConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export type AuditScheduleConfig = typeof auditScheduleConfigs.$inferSelect;
export type InsertAuditScheduleConfig = z.infer<typeof insertAuditScheduleConfigSchema>;

// --- API HEALTH CHECKS ---
export const apiHealthChecks = pgTable("api_health_checks", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull(), // e.g., "/api/auth/me"
  method: varchar("method", { length: 10 }).default("GET"),
  name: text("name").notNull(), // Human-readable name
  description: text("description"),
  isEnabled: boolean("is_enabled").default(true),
  expectedStatus: integer("expected_status").default(200),
  timeoutMs: integer("timeout_ms").default(5000),
  lastCheckedAt: timestamp("last_checked_at"),
  lastStatus: varchar("last_status", { length: 20 }), // healthy, degraded, down
  lastResponseTime: integer("last_response_time"), // in ms
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertApiHealthCheckSchema = createInsertSchema(apiHealthChecks).omit({ id: true, createdAt: true });
export type ApiHealthCheck = typeof apiHealthChecks.$inferSelect;
export type InsertApiHealthCheck = z.infer<typeof insertApiHealthCheckSchema>;

// --- AUDIT ALERT HISTORY ---
export const auditAlertHistory = pgTable("audit_alert_history", {
  id: serial("id").primaryKey(),
  auditRunId: varchar("audit_run_id", { length: 50 }).notNull(),
  alertType: varchar("alert_type", { length: 20 }).notNull(), // email, sms
  recipients: text("recipients").array(),
  subject: text("subject"),
  message: text("message"),
  status: varchar("status", { length: 20 }).default("pending"), // pending, sent, failed
  sentAt: timestamp("sent_at"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAuditAlertHistorySchema = createInsertSchema(auditAlertHistory).omit({ id: true, createdAt: true });
export type AuditAlertHistory = typeof auditAlertHistory.$inferSelect;
export type InsertAuditAlertHistory = z.infer<typeof insertAuditAlertHistorySchema>;

// ============================
// QA & RELEASE GOVERNANCE SYSTEM
// ============================

// --- QA TEST SUITES ---
// Groups of test cases by module/feature
export const qaTestSuites = pgTable("qa_test_suites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  module: text("module").notNull(), // e.g., "Authentication", "Exam Management", "Payment", "Results"
  priority: varchar("priority", { length: 20 }).default("medium"), // critical, high, medium, low
  isActive: boolean("is_active").default(true),
  totalCases: integer("total_cases").default(0),
  automatedCases: integer("automated_cases").default(0),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQaTestSuiteSchema = createInsertSchema(qaTestSuites).omit({ id: true, createdAt: true, updatedAt: true });
export type QaTestSuite = typeof qaTestSuites.$inferSelect;
export type InsertQaTestSuite = z.infer<typeof insertQaTestSuiteSchema>;

// --- QA TEST CASES ---
// Individual test cases with automation-ready fields
export const qaTestCases = pgTable("qa_test_cases", {
  id: serial("id").primaryKey(),
  testCaseId: varchar("test_case_id", { length: 50 }).notNull().unique(), // e.g., TC-AUTH-001
  suiteId: integer("suite_id").references(() => qaTestSuites.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  module: text("module").notNull(),
  feature: text("feature"), // Specific feature being tested
  priority: varchar("priority", { length: 20 }).default("medium"), // critical, high, medium, low
  testType: varchar("test_type", { length: 30 }).default("functional"), // functional, regression, smoke, integration, security, performance
  
  // Test Steps (machine-readable)
  preconditions: text("preconditions"), // Setup requirements
  testSteps: jsonb("test_steps").$type<Array<{
    stepNumber: number;
    action: string;
    expectedResult: string;
    testData?: string;
  }>>(),
  expectedResult: text("expected_result").notNull(),
  
  // Automation-Ready Fields
  automationEligible: boolean("automation_eligible").default(true),
  automationStatus: varchar("automation_status", { length: 30 }).default("not_started"), // not_started, in_progress, automated, blocked
  automationNotes: text("automation_notes"),
  apiEndpoint: text("api_endpoint"), // For API tests
  uiSelector: text("ui_selector"), // CSS/XPath selector for UI tests
  automationScript: text("automation_script"), // Reference to automation script
  
  // Metadata
  estimatedDuration: integer("estimated_duration"), // in minutes
  tags: text("tags").array(), // For filtering/searching
  isActive: boolean("is_active").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  lastUpdatedBy: varchar("last_updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQaTestCaseSchema = createInsertSchema(qaTestCases).omit({ id: true, createdAt: true, updatedAt: true });
export type QaTestCase = typeof qaTestCases.$inferSelect;
export type InsertQaTestCase = z.infer<typeof insertQaTestCaseSchema>;

// --- QA TEST RUNS ---
// Test execution cycles (manual or automated)
export const qaTestRuns = pgTable("qa_test_runs", {
  id: serial("id").primaryKey(),
  runId: varchar("run_id", { length: 50 }).notNull().unique(), // e.g., RUN-20260127-001
  name: text("name").notNull(),
  description: text("description"),
  releaseVersion: text("release_version"), // e.g., "v2.1.0"
  environment: varchar("environment", { length: 30 }).default("staging"), // development, staging, production
  runType: varchar("run_type", { length: 30 }).default("manual"), // manual, automated, regression, smoke
  
  // Scope
  suiteIds: integer("suite_ids").array(), // Which suites are included
  totalCases: integer("total_cases").default(0),
  
  // Status
  status: varchar("status", { length: 30 }).default("pending"), // pending, in_progress, completed, aborted
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  
  // Results Summary
  passedCount: integer("passed_count").default(0),
  failedCount: integer("failed_count").default(0),
  blockedCount: integer("blocked_count").default(0),
  skippedCount: integer("skipped_count").default(0),
  passRate: real("pass_rate"), // 0-100
  
  // Execution Details
  executedBy: varchar("executed_by").references(() => users.id),
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQaTestRunSchema = createInsertSchema(qaTestRuns).omit({ id: true, createdAt: true, updatedAt: true });
export type QaTestRun = typeof qaTestRuns.$inferSelect;
export type InsertQaTestRun = z.infer<typeof insertQaTestRunSchema>;

// --- QA TEST RESULTS ---
// Individual test case results within a run
export const qaTestResults = pgTable("qa_test_results", {
  id: serial("id").primaryKey(),
  runId: integer("run_id").references(() => qaTestRuns.id, { onDelete: "cascade" }),
  testCaseId: integer("test_case_id").references(() => qaTestCases.id),
  
  // Result
  status: varchar("status", { length: 20 }).notNull(), // passed, failed, blocked, skipped
  actualResult: text("actual_result"),
  
  // Evidence
  screenshots: text("screenshots").array(), // URLs to screenshots
  logs: text("logs"), // Relevant logs
  errorMessage: text("error_message"),
  
  // Defect Link
  defectId: integer("defect_id"), // Link to qa_defects if failed
  
  // Execution Details
  executedBy: varchar("executed_by").references(() => users.id),
  executedAt: timestamp("executed_at").defaultNow(),
  executionTime: integer("execution_time"), // in seconds
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQaTestResultSchema = createInsertSchema(qaTestResults).omit({ id: true, createdAt: true });
export type QaTestResult = typeof qaTestResults.$inferSelect;
export type InsertQaTestResult = z.infer<typeof insertQaTestResultSchema>;

// --- QA DEFECTS ---
// Bug/defect tracking
export const qaDefects = pgTable("qa_defects", {
  id: serial("id").primaryKey(),
  defectId: varchar("defect_id", { length: 50 }).notNull().unique(), // e.g., BUG-20260127-001
  title: text("title").notNull(),
  description: text("description").notNull(),
  
  // Classification
  severity: varchar("severity", { length: 20 }).notNull(), // critical, high, medium, low
  priority: varchar("priority", { length: 20 }).default("medium"), // critical, high, medium, low
  defectType: varchar("defect_type", { length: 30 }).default("functional"), // functional, ui, performance, security, data
  module: text("module").notNull(),
  feature: text("feature"),
  
  // Status
  status: varchar("status", { length: 30 }).default("open"), // open, in_progress, fixed, verified, closed, reopened, wont_fix
  resolution: text("resolution"),
  
  // Reproduction
  stepsToReproduce: text("steps_to_reproduce"),
  expectedBehavior: text("expected_behavior"),
  actualBehavior: text("actual_behavior"),
  environment: text("environment"),
  
  // Evidence
  screenshots: text("screenshots").array(),
  logs: text("logs"),
  
  // Links
  testCaseId: integer("test_case_id").references(() => qaTestCases.id),
  testRunId: integer("test_run_id").references(() => qaTestRuns.id),
  
  // Blocking flags
  isDeploymentBlocker: boolean("is_deployment_blocker").default(false),
  blockerReason: text("blocker_reason"), // Why this blocks deployment
  
  // Assignment
  reportedBy: varchar("reported_by").references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  
  // Timestamps
  reportedAt: timestamp("reported_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  verifiedAt: timestamp("verified_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQaDefectSchema = createInsertSchema(qaDefects).omit({ id: true, createdAt: true, updatedAt: true, reportedAt: true });
export type QaDefect = typeof qaDefects.$inferSelect;
export type InsertQaDefect = z.infer<typeof insertQaDefectSchema>;

// --- QA RELEASE CANDIDATES ---
// Release versions being evaluated
export const qaReleaseCandidates = pgTable("qa_release_candidates", {
  id: serial("id").primaryKey(),
  version: varchar("version", { length: 50 }).notNull(), // e.g., "v2.1.0"
  codename: text("codename"), // Optional release name
  description: text("description"),
  
  // Scope
  targetDate: timestamp("target_date"),
  features: text("features").array(), // List of features in this release
  modules: text("modules").array(), // Affected modules
  
  // Status
  status: varchar("status", { length: 30 }).default("draft"), // draft, testing, ready, released, cancelled
  
  // QA Summary
  totalTestRuns: integer("total_test_runs").default(0),
  latestTestRunId: integer("latest_test_run_id"),
  overallPassRate: real("overall_pass_rate"),
  
  // Release Readiness
  readinessScore: integer("readiness_score"), // 0-100
  isBlocked: boolean("is_blocked").default(false),
  blockingReasons: text("blocking_reasons").array(),
  
  // Approval
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  releaseNotes: text("release_notes"),
  
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQaReleaseCandidateSchema = createInsertSchema(qaReleaseCandidates).omit({ id: true, createdAt: true, updatedAt: true });
export type QaReleaseCandidate = typeof qaReleaseCandidates.$inferSelect;
export type InsertQaReleaseCandidate = z.infer<typeof insertQaReleaseCandidateSchema>;

// --- QA RELEASE EVALUATIONS ---
// Go/No-Go evaluations for releases
export const qaReleaseEvaluations = pgTable("qa_release_evaluations", {
  id: serial("id").primaryKey(),
  evaluationId: varchar("evaluation_id", { length: 50 }).notNull().unique(), // e.g., EVAL-20260127-001
  releaseCandidateId: integer("release_candidate_id").references(() => qaReleaseCandidates.id),
  
  // Scoring
  readinessScore: integer("readiness_score").notNull(), // 0-100
  decision: varchar("decision", { length: 20 }).notNull(), // GO, NO_GO, CONDITIONAL
  confidence: integer("confidence").default(0), // 0-100 confidence in decision
  
  // Score Breakdown
  testPassRate: real("test_pass_rate"), // 0-100
  criticalBugsCount: integer("critical_bugs_count").default(0),
  highBugsCount: integer("high_bugs_count").default(0),
  mediumBugsCount: integer("medium_bugs_count").default(0),
  lowBugsCount: integer("low_bugs_count").default(0),
  blockedTestsCount: integer("blocked_tests_count").default(0),
  regressionCoverage: real("regression_coverage"), // 0-100
  
  // Blocking Analysis
  isBlocked: boolean("is_blocked").default(false),
  blockingReasons: jsonb("blocking_reasons").$type<Array<{
    reason: string;
    severity: string;
    module: string;
    defectId?: string;
  }>>(),
  
  // Risk Assessment
  riskLevel: varchar("risk_level", { length: 20 }).default("medium"), // low, medium, high, critical
  riskSummary: text("risk_summary"),
  moduleRisks: jsonb("module_risks").$type<Array<{
    module: string;
    riskLevel: string;
    issues: number;
    testCoverage: number;
  }>>(),
  
  // Override (for emergency releases)
  wasOverridden: boolean("was_overridden").default(false),
  overrideReason: text("override_reason"),
  overriddenBy: varchar("overridden_by").references(() => users.id),
  overriddenAt: timestamp("overridden_at"),
  
  // Evaluation Details
  evaluatedBy: varchar("evaluated_by").references(() => users.id),
  evaluatedAt: timestamp("evaluated_at").defaultNow(),
  notes: text("notes"),
  
  // Link to system audit
  systemAuditRunId: varchar("system_audit_run_id", { length: 50 }),
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQaReleaseEvaluationSchema = createInsertSchema(qaReleaseEvaluations).omit({ id: true, createdAt: true });
export type QaReleaseEvaluation = typeof qaReleaseEvaluations.$inferSelect;
export type InsertQaReleaseEvaluation = z.infer<typeof insertQaReleaseEvaluationSchema>;

// --- QA COVERAGE SUGGESTIONS ---
// AI-generated test coverage suggestions
export const qaCoverageSuggestions = pgTable("qa_coverage_suggestions", {
  id: serial("id").primaryKey(),
  suggestionId: varchar("suggestion_id", { length: 50 }).notNull().unique(), // e.g., SUG-20260127-001
  
  // Suggestion Content
  title: text("title").notNull(),
  description: text("description").notNull(),
  suggestedTestCase: text("suggested_test_case"), // AI-generated test case text
  
  // Classification
  category: varchar("category", { length: 30 }).notNull(), // missing_coverage, weak_regression, high_risk, untested_scenario
  module: text("module").notNull(),
  feature: text("feature"),
  priority: varchar("priority", { length: 20 }).default("medium"), // critical, high, medium, low
  
  // AI Analysis
  confidence: integer("confidence").default(0), // 0-100 AI confidence score
  reasoning: text("reasoning"), // Why AI suggested this
  relatedBugs: text("related_bugs").array(), // Bug IDs that informed this suggestion
  relatedTestCases: text("related_test_cases").array(), // Related existing test cases
  
  // Status
  status: varchar("status", { length: 20 }).default("new"), // new, accepted, dismissed, converted
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"),
  
  // Conversion (when accepted and converted to test case)
  convertedToTestCaseId: integer("converted_to_test_case_id").references(() => qaTestCases.id),
  
  // Generation Details
  generatedAt: timestamp("generated_at").defaultNow(),
  generatedFrom: varchar("generated_from", { length: 50 }), // feature_analysis, bug_analysis, coverage_gap, risk_assessment
  
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertQaCoverageSuggestionSchema = createInsertSchema(qaCoverageSuggestions).omit({ id: true, createdAt: true });
export type QaCoverageSuggestion = typeof qaCoverageSuggestions.$inferSelect;
export type InsertQaCoverageSuggestion = z.infer<typeof insertQaCoverageSuggestionSchema>;

// --- QA TESTER PERFORMANCE ---
// Track tester productivity and quality
export const qaTesterPerformance = pgTable("qa_tester_performance", {
  id: serial("id").primaryKey(),
  testerId: varchar("tester_id").references(() => users.id).notNull(),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Execution Metrics
  testsExecuted: integer("tests_executed").default(0),
  testsPassed: integer("tests_passed").default(0),
  testsFailed: integer("tests_failed").default(0),
  testsBlocked: integer("tests_blocked").default(0),
  
  // Defect Metrics
  defectsReported: integer("defects_reported").default(0),
  criticalDefects: integer("critical_defects").default(0),
  validDefects: integer("valid_defects").default(0), // Defects that were confirmed
  invalidDefects: integer("invalid_defects").default(0), // Defects that were rejected
  
  // Efficiency
  averageExecutionTime: integer("average_execution_time"), // in minutes
  testRunsCompleted: integer("test_runs_completed").default(0),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertQaTesterPerformanceSchema = createInsertSchema(qaTesterPerformance).omit({ id: true, createdAt: true, updatedAt: true });
export type QaTesterPerformance = typeof qaTesterPerformance.$inferSelect;
export type InsertQaTesterPerformance = z.infer<typeof insertQaTesterPerformanceSchema>;

// ============================
// GURUJI AI VOICE ASSISTANT
// ============================

// --- GURUJI SETTINGS (admin-configurable global settings) ---
export const gurujiSettings = pgTable("guruji_settings", {
  id: serial("id").primaryKey(),
  
  // Feature Toggles
  voiceModeEnabled: boolean("voice_mode_enabled").default(true),
  textModeEnabled: boolean("text_mode_enabled").default(true),
  wakeWordEnabled: boolean("wake_word_enabled").default(true),
  
  // Credit Pricing - Base Costs
  baseSttCreditPerQuery: integer("base_stt_credit_per_query").default(1), // Speech-to-text base
  baseWordsPerCredit: integer("base_words_per_credit").default(20), // Words per credit chunk
  
  // Credit Pricing - AI Response
  responseCredits1To100Words: integer("response_credits_1_to_100_words").default(2),
  responseCredits101To300Words: integer("response_credits_101_to_300_words").default(4),
  responseCredits301To500Words: integer("response_credits_301_to_500_words").default(6),
  responseCreditsAbove500Words: integer("response_credits_above_500_words").default(8),
  
  // Credit Pricing - Extras
  diagramGenerationCredits: integer("diagram_generation_credits").default(3),
  translationCredits: integer("translation_credits").default(1),
  voicePremiumPercentage: integer("voice_premium_percentage").default(20), // +20% for voice mode
  ttsCharacterMultiplier: integer("tts_character_multiplier").default(20), // X/10 credits per 100 characters (20 = 2.0 credits per 100 chars, 25 = 2.5, etc.)
  
  // Usage Limits
  dailyCreditLimit: integer("daily_credit_limit").default(100),
  monthlyCreditLimit: integer("monthly_credit_limit").default(2000),
  maxConversationLength: integer("max_conversation_length").default(50), // Max messages per session
  sessionTimeoutMinutes: integer("session_timeout_minutes").default(30),
  
  // Exam Reward Credits
  rewardCredits90Plus: integer("reward_credits_90_plus").default(50),
  rewardCredits75To89: integer("reward_credits_75_to_89").default(30),
  rewardCredits60To74: integer("reward_credits_60_to_74").default(15),
  
  // AI Configuration
  defaultLanguage: text("default_language").default("en"),
  supportedLanguages: text("supported_languages").array().default(["en", "hi"]),
  ttsVoiceEnglish: text("tts_voice_english").default("alloy"),
  ttsVoiceHindi: text("tts_voice_hindi").default("shimmer"),
  ttsSpeechRate: text("tts_speech_rate").default("0.8"), // Slower for students
  
  // ElevenLabs Configuration (for better Indian voice)
  elevenLabsApiKey: text("eleven_labs_api_key"),
  elevenLabsVoiceId: text("eleven_labs_voice_id"), // Voice ID from ElevenLabs
  useElevenLabs: boolean("use_eleven_labs").default(false), // Toggle to use ElevenLabs instead of OpenAI
  
  // AI Response Configuration
  aiModel: text("ai_model").default("gpt-4o-mini"), // AI model to use
  maxTokens: integer("max_tokens").default(300), // Maximum tokens for AI response
  targetResponseWords: integer("target_response_words").default(80), // Target word count for responses
  aiTemperature: text("ai_temperature").default("0.7"), // AI creativity (0.0-1.0)
  
  // Safety Guardrails
  educationOnlyMode: boolean("education_only_mode").default(true),
  blockOffTopicQueries: boolean("block_off_topic_queries").default(true),
  maxQueryLength: integer("max_query_length").default(500), // Characters
  
  // Watermark for prints
  printWatermark: text("print_watermark").default("© SAMIKARAN Olympiad"),
  
  newRegistrationCredits: integer("new_registration_credits").default(200),
  referralCredits: integer("referral_credits").default(200),
  
  updatedAt: timestamp("updated_at").defaultNow(),
  updatedBy: varchar("updated_by").references(() => users.id),
});

// --- GURUJI CONVERSATIONS (Student AI Library) ---
export const gurujiConversations = pgTable("guruji_conversations", {
  id: serial("id").primaryKey(),
  conversationId: varchar("conversation_id", { length: 50 }).notNull().unique(), // e.g., GURU-20260128-001
  
  // Student Info
  studentId: integer("student_id").notNull().references(() => studentRegistrations.id, { onDelete: "cascade" }),
  
  // Session Info
  sessionStarted: timestamp("session_started").defaultNow(),
  sessionEnded: timestamp("session_ended"),
  messageCount: integer("message_count").default(0),
  
  // Mode
  mode: text("mode").notNull().default("text"), // text, voice
  language: text("language").default("en"),
  
  // Academic Context
  subject: text("subject"),
  chapter: text("chapter"),
  topic: text("topic"),
  gradeLevel: text("grade_level"), // Class 1-12
  olympiadCategory: text("olympiad_category"),
  
  // Credits
  totalCreditsConsumed: integer("total_credits_consumed").default(0),
  
  // Status
  status: text("status").default("active"), // active, completed, expired
  
  createdAt: timestamp("created_at").defaultNow(),
});

// --- GURUJI MESSAGES (individual messages within conversation) ---
export const gurujiMessages = pgTable("guruji_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => gurujiConversations.id, { onDelete: "cascade" }),
  
  // Message Type
  role: text("role").notNull(), // student, guruji
  messageType: text("message_type").notNull().default("text"), // text, voice
  
  // Content
  content: text("content").notNull(), // Text content
  audioUrl: text("audio_url"), // Voice recording URL
  transcript: text("transcript"), // STT transcript for voice
  
  // Response Details (for guruji messages)
  wordCount: integer("word_count").default(0),
  responseTimeMs: integer("response_time_ms"), // How long AI took to respond
  
  // Credits
  creditsCharged: integer("credits_charged").default(0),
  creditBreakdown: jsonb("credit_breakdown"), // { stt: 1, response: 4, tts: 1, translation: 0 }
  
  // Metadata
  wasSpokenAloud: boolean("was_spoken_aloud").default(false), // TTS used
  wasPrinted: boolean("was_printed").default(false),
  printedAt: timestamp("printed_at"),
  
  // AI Processing
  aiModel: text("ai_model"), // gpt-4o, etc.
  tokensUsed: integer("tokens_used"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// --- GURUJI CREDITS LEDGER (transaction history) ---
export const gurujiCreditsLedger = pgTable("guruji_credits_ledger", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentRegistrations.id, { onDelete: "cascade" }),
  
  // Transaction Type
  transactionType: text("transaction_type").notNull(), // purchase, exam_reward, consumption, refund, bonus
  
  // Amount
  amount: integer("amount").notNull(), // Positive for credit, negative for debit
  balanceAfter: integer("balance_after").notNull(),
  
  // Reference
  referenceType: text("reference_type"), // conversation, exam, payment, admin
  referenceId: text("reference_id"), // ID of related entity
  
  // Description
  description: text("description"),
  
  // Payment Info (for purchases)
  paymentId: integer("payment_id").references(() => payments.id),
  amountPaid: integer("amount_paid"), // In paise
  
  // Exam Reward Info
  examId: integer("exam_id").references(() => exams.id),
  scorePercentage: integer("score_percentage"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// --- GURUJI STUDENT CREDITS (current balance) ---
export const gurujiStudentCredits = pgTable("guruji_student_credits", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentRegistrations.id, { onDelete: "cascade" }).unique(),
  
  // Balances
  purchasedCredits: integer("purchased_credits").default(0),
  rewardCredits: integer("reward_credits").default(0),
  bonusCredits: integer("bonus_credits").default(0),
  totalCredits: integer("total_credits").default(0), // Sum of all
  
  // Usage
  creditsUsedToday: integer("credits_used_today").default(0),
  creditsUsedThisMonth: integer("credits_used_this_month").default(0),
  totalCreditsUsed: integer("total_credits_used").default(0),
  
  // Last Reset
  lastDailyReset: timestamp("last_daily_reset"),
  lastMonthlyReset: timestamp("last_monthly_reset"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- GURUJI CREDIT PACKAGES (purchasable packages) ---
export const gurujiCreditPackages = pgTable("guruji_credit_packages", {
  id: serial("id").primaryKey(),
  
  // Package Info
  name: text("name").notNull(),
  description: text("description"),
  credits: integer("credits").notNull(),
  
  // Pricing
  priceInPaise: integer("price_in_paise").notNull(), // e.g., 9900 = ₹99
  originalPriceInPaise: integer("original_price_in_paise"), // For showing discount
  
  // Bonus
  bonusCredits: integer("bonus_credits").default(0),
  bonusPercentage: integer("bonus_percentage").default(0), // e.g., 10% extra
  
  // Display
  isPopular: boolean("is_popular").default(false),
  isBestValue: boolean("is_best_value").default(false),
  sortOrder: integer("sort_order").default(0),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// --- GURUJI PRINT LOGS (track all print actions) ---
export const gurujiPrintLogs = pgTable("guruji_print_logs", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentRegistrations.id, { onDelete: "cascade" }),
  messageId: integer("message_id").notNull().references(() => gurujiMessages.id, { onDelete: "cascade" }),
  
  printedAt: timestamp("printed_at").defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// --- INSERT SCHEMAS ---
export const insertGurujiSettingsSchema = createInsertSchema(gurujiSettings).omit({ id: true, updatedAt: true });
export const insertGurujiConversationSchema = createInsertSchema(gurujiConversations).omit({ id: true, createdAt: true });
export const insertGurujiMessageSchema = createInsertSchema(gurujiMessages).omit({ id: true, createdAt: true });
export const insertGurujiCreditsLedgerSchema = createInsertSchema(gurujiCreditsLedger).omit({ id: true, createdAt: true });
export const insertGurujiStudentCreditsSchema = createInsertSchema(gurujiStudentCredits).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGurujiCreditPackageSchema = createInsertSchema(gurujiCreditPackages).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGurujiPrintLogSchema = createInsertSchema(gurujiPrintLogs).omit({ id: true, printedAt: true });

// --- TYPES ---
export type GurujiSettings = typeof gurujiSettings.$inferSelect;
export type InsertGurujiSettings = z.infer<typeof insertGurujiSettingsSchema>;
export type GurujiConversation = typeof gurujiConversations.$inferSelect;
export type InsertGurujiConversation = z.infer<typeof insertGurujiConversationSchema>;
export type GurujiMessage = typeof gurujiMessages.$inferSelect;
export type InsertGurujiMessage = z.infer<typeof insertGurujiMessageSchema>;
export type GurujiCreditsLedger = typeof gurujiCreditsLedger.$inferSelect;
export type InsertGurujiCreditsLedger = z.infer<typeof insertGurujiCreditsLedgerSchema>;
export type GurujiStudentCredits = typeof gurujiStudentCredits.$inferSelect;
export type InsertGurujiStudentCredits = z.infer<typeof insertGurujiStudentCreditsSchema>;
export type GurujiCreditPackage = typeof gurujiCreditPackages.$inferSelect;
export type InsertGurujiCreditPackage = z.infer<typeof insertGurujiCreditPackageSchema>;
export type GurujiPrintLog = typeof gurujiPrintLogs.$inferSelect;
export type InsertGurujiPrintLog = z.infer<typeof insertGurujiPrintLogSchema>;

// --- USER ACTIVITY LOGS ---
export const userActivityLogs = pgTable("user_activity_logs", {
  id: serial("id").primaryKey(),
  userType: text("user_type").notNull(),
  userId: integer("user_id").notNull(),
  action: text("action").notNull(),
  details: text("details"),
  changedFields: jsonb("changed_fields"),
  ipAddress: text("ip_address"),
  performedBy: integer("performed_by"),
  performedByType: text("performed_by_type").default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserActivityLogSchema = createInsertSchema(userActivityLogs).omit({ id: true, createdAt: true });
export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;

// ============================
// MULTI-TENANT SCHOOL SaaS MODULE
// ============================

export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  tagline: text("tagline"),
  address: text("address"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  principalName: text("principal_name"),
  boardAffiliation: text("board_affiliation"),
  academicYear: text("academic_year"),
  theme: text("theme").default("blue_academic"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const schoolClasses = pgTable("school_classes", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  name: text("name").notNull(),
  gradeNumber: integer("grade_number").notNull(),
  section: text("section").default("A"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schoolSubjects = pgTable("school_subjects", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  name: text("name").notNull(),
  code: text("code"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schoolChapters = pgTable("school_chapters", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => schoolSubjects.id),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  name: text("name").notNull(),
  chapterNumber: integer("chapter_number").notNull(),
  description: text("description"),
  syllabusText: text("syllabus_text"),
  syllabusPdfUrl: text("syllabus_pdf_url"),
  learningObjectives: jsonb("learning_objectives"),
  conceptTags: text("concept_tags").array(),
  difficultyLevel: text("difficulty_level").default("medium"),
  bloomTaxonomyTags: text("bloom_taxonomy_tags").array(),
  extractedConcepts: jsonb("extracted_concepts"),
  extractedFormulas: jsonb("extracted_formulas"),
  pdfProcessingStatus: text("pdf_processing_status").default("none"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schoolTeachers = pgTable("school_teachers", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  role: text("role").notNull().default("subject_teacher"),
  isClassTeacher: boolean("is_class_teacher").default(false),
  assignedClassId: integer("assigned_class_id"),
  assignedSubjectIds: jsonb("assigned_subject_ids"),
  isActive: boolean("is_active").default(true),
  sessionToken: text("session_token"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schoolStudentLinks = pgTable("school_student_links", {
  id: serial("id").primaryKey(),
  schoolId: integer("school_id").notNull().references(() => schools.id),
  studentId: integer("student_id").notNull().references(() => studentRegistrations.id),
  classId: integer("class_id").references(() => schoolClasses.id),
  section: text("section").default("A"),
  rollNumber: text("roll_number"),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

// --- MULTI-TENANT INSERT SCHEMAS ---
export const insertSchoolSchema = createInsertSchema(schools).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSchoolClassSchema = createInsertSchema(schoolClasses).omit({ id: true, createdAt: true });
export const insertSchoolSubjectSchema = createInsertSchema(schoolSubjects).omit({ id: true, createdAt: true });
export const insertSchoolChapterSchema = createInsertSchema(schoolChapters).omit({ id: true, createdAt: true });
export const insertSchoolTeacherSchema = createInsertSchema(schoolTeachers).omit({ id: true, createdAt: true, sessionToken: true, lastLoginAt: true });
export const insertSchoolStudentLinkSchema = createInsertSchema(schoolStudentLinks).omit({ id: true, enrolledAt: true });

// --- STUDENT PROCTORING LOGS ---
export const studentProctoringLogs = pgTable("student_proctoring_logs", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentRegistrations.id, { onDelete: "cascade" }),
  examId: integer("exam_id").references(() => exams.id),
  attemptId: integer("attempt_id").references(() => attempts.id),
  sessionStart: timestamp("session_start").defaultNow(),
  sessionEnd: timestamp("session_end"),
  warningType: text("warning_type"), // face_not_detected, multiple_faces, tab_switch, fullscreen_exit, copy_paste, phone_detected
  warningMessage: text("warning_message"),
  severity: text("severity").default("low"), // low, medium, high, critical
  autoDisqualified: boolean("auto_disqualified").default(false),
  snapshotUrl: text("snapshot_url"),
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- TARA AI USAGE LOGS ---
export const taraUsageLogs = pgTable("tara_usage_logs", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentRegistrations.id, { onDelete: "cascade" }),
  sessionDate: timestamp("session_date").defaultNow(),
  creditsUsed: integer("credits_used").default(1),
  messageCount: integer("message_count").default(0),
  sessionDurationSeconds: integer("session_duration_seconds").default(0),
  topicCategory: text("topic_category"), // exam_prep, doubt_solving, general, results
  examId: integer("exam_id").references(() => exams.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================
// COMPETITIVE EXAMS MODULE
// ============================

// --- EXAM CATEGORIES (UPSC, SSC, BANKING, RAILWAY, STATE_PSC, DEFENSE, SCHOOL_OLYMPIAD) ---
export const examCategories = pgTable("exam_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // UPSC, SSC, BANKING, RAILWAY, STATE_PSC, DEFENSE, SCHOOL_OLYMPIAD
  displayName: text("display_name").notNull(), // e.g., "UPSC Civil Services"
  description: text("description"),
  icon: text("icon").default("BookOpen"), // lucide icon name
  slug: text("slug").notNull().unique(),
  colorFrom: text("color_from").default("#7c3aed"), // gradient start
  colorTo: text("color_to").default("#ec4899"),     // gradient end
  targetAudience: text("target_audience").default("GRADUATION"), // GRADUATION, POST_GRADUATION, CLASS_1_12
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// --- COMPETITIVE EXAMS ---
export const competitiveExams = pgTable("competitive_exams", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull().references(() => examCategories.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // e.g., "UPSC Civil Services Preliminary 2026"
  slug: text("slug").notNull().unique(),
  examType: text("exam_type").notNull(), // IAS, SSC_CGL, IBPS_PO, RRB_NTPC, etc.
  description: text("description"),
  targetAudience: text("target_audience").default("GRADUATION"), // GRADUATION, POST_GRADUATION
  syllabusData: jsonb("syllabus_data"), // Sections: Reasoning, Quant, English, GK, Computer
  examDate: timestamp("exam_date"),
  registrationFee: integer("registration_fee").default(0), // in paise
  totalMarks: integer("total_marks").default(200),
  durationMinutes: integer("duration_minutes").default(120),
  negativeMarking: boolean("negative_marking").default(true),
  examMode: text("exam_mode").default("ONLINE"), // ONLINE, OFFLINE, HYBRID
  isVisible: boolean("is_visible").default(true),
  status: text("status").default("upcoming"), // upcoming, active, completed, cancelled
  imageUrl: text("image_url"),
  officialWebsite: text("official_website"),
  importantDates: jsonb("important_dates"), // {event: string, date: string}[]
  eligibilityCriteria: text("eligibility_criteria"),
  selectionProcess: text("selection_process"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertExamCategorySchema = createInsertSchema(examCategories).omit({ id: true, createdAt: true });
export const insertCompetitiveExamSchema = createInsertSchema(competitiveExams).omit({ id: true, createdAt: true, updatedAt: true });

export type ExamCategory = typeof examCategories.$inferSelect;
export type InsertExamCategory = z.infer<typeof insertExamCategorySchema>;
export type CompetitiveExam = typeof competitiveExams.$inferSelect;
export type InsertCompetitiveExam = z.infer<typeof insertCompetitiveExamSchema>;

// --- MULTI-TENANT TYPES ---
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type SchoolClass = typeof schoolClasses.$inferSelect;
export type InsertSchoolClass = z.infer<typeof insertSchoolClassSchema>;
export type SchoolSubject = typeof schoolSubjects.$inferSelect;
export type InsertSchoolSubject = z.infer<typeof insertSchoolSubjectSchema>;
export type SchoolChapter = typeof schoolChapters.$inferSelect;
export type InsertSchoolChapter = z.infer<typeof insertSchoolChapterSchema>;
export type SchoolTeacher = typeof schoolTeachers.$inferSelect;
export type InsertSchoolTeacher = z.infer<typeof insertSchoolTeacherSchema>;
export type SchoolStudentLink = typeof schoolStudentLinks.$inferSelect;
export type InsertSchoolStudentLink = z.infer<typeof insertSchoolStudentLinkSchema>;
