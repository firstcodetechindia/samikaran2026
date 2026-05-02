import { db } from "./db";
import { 
  exams, questions, attempts, answers, otpCodes, studentRegistrations, supervisorRegistrations, schoolCollaborations, coordinators, verifiedContacts,
  announcements, managedStudents, payments, certificates, calendarEvents, examRegistrations, referrals, discountCredits, superAdmins,
  siteSettings, emailTemplates, emailTemplateAssignments, emailSends, smsTemplates, pushTemplates, languages, translations, aiProviders,
  countries, states, cities,
  proctorSettings, proctorSessions, proctorEvents, violationRules, systemCheckResults,
  socialPlatforms, marketingEvents, marketingContent, marketingCalendar, marketingSettings,
  socialMediaLinks,
  enquiries, partners, userActivityLogs,
  gurujiStudentCredits, gurujiCreditsLedger, gurujiSettings,
  cmsPages,
  cmsPageSections,
  cmsFormSubmissions,
  blogCategories, blogTags, blogPosts, blogPostTags, mediaLibrary,
  olympiadCategories, olympiadPageContent, attemptQuestions,
  paymentSettings, processedWebhooks, invoiceCounter,
  type OlympiadCategory, type InsertOlympiadCategory,
  type OlympiadPageContent, type InsertOlympiadPageContent,
  type AttemptQuestion, type InsertAttemptQuestion,
  type Exam, type InsertExam,
  type Question, type InsertQuestion,
  type Attempt, type InsertAttempt,
  type Answer, type InsertAnswer,
  type OtpCode, type InsertOtp,
  type StudentRegistration, type InsertStudentRegistration,
  type SupervisorRegistration, type InsertSupervisorRegistration,
  type SchoolCollaboration, type InsertSchoolCollaboration,
  type Coordinator, type InsertCoordinator,
  type SuperAdmin, type InsertSuperAdmin,
  type Announcement, type InsertAnnouncement,
  type ManagedStudent, type InsertManagedStudent,
  type Payment, type InsertPayment,
  type Certificate, type InsertCertificate,
  type CalendarEvent, type InsertCalendarEvent,
  type ExamRegistration, type InsertExamRegistration,
  type Referral, type DiscountCredit,
  type SiteSetting, type InsertSiteSetting,
  type EmailTemplate, type InsertEmailTemplate,
  type EmailTemplateAssignment,
  type SmsTemplate, type InsertSmsTemplate,
  type PushTemplate, type InsertPushTemplate,
  type Language, type InsertLanguage,
  type Translation, type InsertTranslation,
  type AiProvider, type InsertAiProvider,
  type Country, type InsertCountry,
  type State, type InsertState,
  type City, type InsertCity,
  type ProctorSettings, type InsertProctorSettings,
  type ProctorSession, type InsertProctorSession,
  type ProctorEvent, type InsertProctorEvent,
  type ViolationRule, type InsertViolationRule,
  type SystemCheckResult, type InsertSystemCheckResult,
  type SocialPlatform, type InsertSocialPlatform,
  type MarketingEvent, type InsertMarketingEvent,
  type MarketingContent, type InsertMarketingContent,
  type MarketingCalendar, type InsertMarketingCalendar,
  type MarketingSettings, type InsertMarketingSettings,
  type SocialMediaLink, type InsertSocialMediaLink,
  type Enquiry, type InsertEnquiry,
  type CmsPage, type InsertCmsPage,
  type CmsPageSection, type InsertCmsPageSection,
  type CmsFormSubmission, type InsertCmsFormSubmission,
  type BlogCategory, type InsertBlogCategory,
  type BlogTag, type InsertBlogTag,
  type BlogPost, type InsertBlogPost,
  type BlogPostTag, type InsertBlogPostTag,
  type MediaItem, type InsertMediaItem,
  type PaymentSettings, type InsertPaymentSettings,
  type ProcessedWebhook, type InsertProcessedWebhook,
  type InvoiceCounter, type InsertInvoiceCounter
} from "@workspace/db";
import { eq, desc, asc, and, gt, lt, or, inArray, isNull, sql } from "drizzle-orm";
import crypto from "crypto";

export interface IStorage {
  // Exams
  getExams(): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  createExam(exam: InsertExam): Promise<Exam>;
  
  // Questions
  getQuestion(id: number): Promise<Question | undefined>;
  getQuestionsByExam(examId: number): Promise<Question[]>;
  createQuestion(question: InsertQuestion): Promise<Question>;
  createQuestions(questionsList: InsertQuestion[]): Promise<Question[]>;
  deleteQuestion(id: number): Promise<void>;

  // Attempts
  createAttempt(attempt: InsertAttempt): Promise<Attempt>;
  getAttempt(id: number): Promise<Attempt | undefined>;
  getUserAttempts(userId: string): Promise<Attempt[]>;
  updateAttemptStatus(id: number, status: string, endTime?: Date, score?: number): Promise<Attempt>;
  
  // Answers
  submitAnswer(answer: InsertAnswer): Promise<Answer>;
  getAttemptAnswers(attemptId: number): Promise<Answer[]>;

  // OTP
  createOtp(contact: string, contactType: string, code: string, expiresAt: Date): Promise<OtpCode>;
  verifyOtp(contact: string, code: string): Promise<{ verified: boolean; token?: string; error?: string }>;
  getValidOtp(contact: string): Promise<OtpCode | undefined>;
  incrementOtpAttempts(otpId: number): Promise<void>;

  // Verified Contacts
  validateVerificationToken(token: string): Promise<{ valid: boolean; contact?: string }>;
  markTokenUsed(token: string): Promise<void>;

  // Duplicate Contact Check
  checkContactExists(contact: string, type: "email" | "phone"): Promise<{ exists: boolean; accountType?: string }>;
  
  // Find user by identifier (email or phone) for login
  findUserByIdentifier(identifier: string): Promise<{ id: number; email: string | null; phone: string | null; accountType: string } | null>;
  
  // Find user with full data for password authentication
  findUserForAuth(identifier: string): Promise<{ 
    id: number; 
    email: string | null; 
    phone: string | null; 
    password: string | null; 
    firstName: string | null; 
    lastName: string | null; 
    userType: string;
    schoolName: string | null;
    gradeLevel: string | null;
    name?: string | null;
    studentId?: string | null;
    activeSessionToken?: string | null;
    lastLoginAt?: Date | null;
    lastLoginDevice?: string | null;
  } | null>;
  
  // Password reset
  updateUserPassword(email: string, hashedPassword: string): Promise<boolean>;
  verifyResetToken(email: string, token: string): Promise<boolean>;
  invalidateResetToken(email: string, token: string): Promise<void>;
  
  // Student session management (single-session enforcement)
  updateStudentSession(studentId: number, sessionToken: string | null, deviceInfo: string, ipAddress?: string): Promise<void>;
  updateStudentGeoData(studentId: number, geoData: any): Promise<void>;
  clearStudentSession(studentId: number): Promise<void>;
  
  // Find student by ID (for session validation)
  findUserById(userId: number): Promise<{
    id: number;
    activeSessionToken: string | null;
    lastLoginAt: Date | null;
    lastLoginDevice: string | null;
  } | null>;
  
  // Check for duplicate email/phone in student registrations
  checkStudentDuplicates(email: string | null, phone: string | null): Promise<{ exists: boolean; field?: string }>;
  
  // Generate next student ID
  generateStudentId(): Promise<string>;

  // Student Registrations
  createStudentRegistration(registration: InsertStudentRegistration): Promise<StudentRegistration>;
  getStudentRegistrationByEmail(email: string): Promise<StudentRegistration | undefined>;

  // Supervisor Registrations
  createSupervisorRegistration(registration: InsertSupervisorRegistration): Promise<SupervisorRegistration>;
  getSupervisorRegistrationByEmail(email: string): Promise<SupervisorRegistration | undefined>;

  // School Collaborations
  createSchoolCollaboration(collaboration: InsertSchoolCollaboration): Promise<SchoolCollaboration>;
  getSchoolCollaborationByEmail(email: string): Promise<SchoolCollaboration | undefined>;

  // Coordinators
  createCoordinator(coordinator: InsertCoordinator): Promise<Coordinator>;
  getCoordinatorByEmail(email: string): Promise<Coordinator | undefined>;
  getCoordinatorsBySchool(schoolId: number): Promise<Coordinator[]>;

  // Announcements
  getAnnouncements(audience?: string): Promise<Announcement[]>;
  createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement>;

  // Managed Students
  getManagedStudents(managerId: number, managerType: string): Promise<(ManagedStudent & { student: StudentRegistration })[]>;
  createManagedStudent(managedStudent: InsertManagedStudent): Promise<ManagedStudent>;
  deleteManagedStudent(id: number): Promise<void>;

  // Payments
  getPayments(userId: number, userType: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePaymentStatus(id: number, status: string, transactionId?: string): Promise<Payment>;

  // Certificates
  getCertificates(studentId: number): Promise<(Certificate & { exam?: Exam })[]>;
  getCertificatesByManager(managerId: number, managerType: string): Promise<(Certificate & { student: StudentRegistration; exam?: Exam })[]>;
  createCertificate(certificate: InsertCertificate): Promise<Certificate>;

  // Calendar Events
  getCalendarEvents(audience?: string): Promise<CalendarEvent[]>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;

  // Exam Registrations
  getExamRegistrations(studentId: number): Promise<(ExamRegistration & { exam: Exam })[]>;
  createExamRegistration(registration: InsertExamRegistration): Promise<ExamRegistration>;
  
  // Get all students (for bulk operations)
  getAllStudents(): Promise<StudentRegistration[]>;
  getStudentById(id: number): Promise<StudentRegistration | undefined>;
  
  // Profile methods
  getProfileByType(userId: number, userType: string): Promise<any>;
  updateProfileByType(userId: number, userType: string, updates: Record<string, any>): Promise<any>;
  
  // Referral methods
  validateReferralCode(code: string, studentId: number): Promise<{ valid: boolean; referrerId?: number; error?: string }>;
  createReferral(referrerId: number, referredId: number, referralCode: string, examId?: number): Promise<any>;
  getReferralStats(studentId: number): Promise<{ totalReferrals: number; earnedDiscounts: number; usedDiscounts: number; pendingDiscounts: number }>;
  getStudentByReferralCode(code: string): Promise<StudentRegistration | undefined>;
  getPendingDiscountCredits(studentId: number): Promise<any[]>;
  
  // Super Admin methods
  getSuperAdminByEmail(email: string): Promise<SuperAdmin | undefined>;
  createSuperAdmin(admin: InsertSuperAdmin): Promise<SuperAdmin>;
  updateSuperAdminLastLogin(id: number): Promise<void>;
  getAllSuperAdmins(): Promise<SuperAdmin[]>;
  
  // Admin CRUD operations
  updateExam(id: number, updates: Partial<InsertExam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<void>;
  updateQuestion(id: number, updates: Partial<any>): Promise<Question | undefined>;
  updateAnnouncement(id: number, updates: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: number): Promise<void>;
  updateCalendarEvent(id: number, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number): Promise<void>;
  getAllPayments(): Promise<Payment[]>;
  getAllSupervisors(): Promise<SupervisorRegistration[]>;
  getAllCoordinators(): Promise<Coordinator[]>;
  getAllSchools(): Promise<SchoolCollaboration[]>;
  deleteStudent(id: number): Promise<void>;
  deleteSupervisor(id: number): Promise<void>;
  deleteCoordinator(id: number): Promise<void>;
  deleteSchool(id: number): Promise<void>;
  getAllPartners(): Promise<any[]>;
  getUserById(type: string, id: number): Promise<any>;
  toggleUserStatus(type: string, id: number, active: boolean): Promise<boolean>;
  adminResetPassword(type: string, id: number, hashedPassword: string): Promise<boolean>;
  logUserActivity(userType: string, userId: number, action: string, details?: string, changedFields?: any, performedBy?: number, ipAddress?: string): Promise<void>;
  getUserActivityLogs(userType: string, userId: number): Promise<any[]>;
  getSystemStats(): Promise<{ students: number; supervisors: number; groups: number; schools: number; exams: number; totalPayments: number }>;
  
  // Analytics
  getHourlyAnalytics(): Promise<{ hour: string; students: number; submissions: number; revenue: number }[]>;
  getSubjectPerformance(): Promise<{ subject: string; avgScore: number; participation: number; examsCount: number }[]>;
  getRevenueAnalytics(): Promise<{ date: string; revenue: number; transactions: number }[]>;
  getRegistrationTrends(): Promise<{ date: string; students: number; schools: number; teachers: number }[]>;
  
  // Global Settings
  getAllSettings(): Promise<SiteSetting[]>;
  getSettingsByCategory(category: string): Promise<SiteSetting[]>;
  getSetting(key: string): Promise<SiteSetting | undefined>;
  upsertSetting(key: string, value: string, category: string): Promise<SiteSetting>;
  
  // Email Templates
  getAllEmailTemplates(): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  getEmailTemplateBySlug(slug: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<void>;

  // Email Template Assignments
  getAllEmailTemplateAssignments(): Promise<EmailTemplateAssignment[]>;
  getEmailTemplateAssignment(eventType: string): Promise<EmailTemplateAssignment | undefined>;
  upsertEmailTemplateAssignment(eventType: string, label: string, templateId: number | null, isActive?: boolean): Promise<EmailTemplateAssignment>;
  bulkUpdateEmailTemplateAssignments(assignments: { eventType: string; templateId: number | null; isActive?: boolean }[]): Promise<void>;

  // Email Send Tracking
  getEmailSendStats(): Promise<{ total: number; sent: number; delivered: number; opened: number; bounced: number; failed: number }>;

  // SMS Templates
  getAllSmsTemplates(): Promise<SmsTemplate[]>;
  getSmsTemplate(id: number): Promise<SmsTemplate | undefined>;
  createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate>;
  updateSmsTemplate(id: number, updates: Partial<InsertSmsTemplate>): Promise<SmsTemplate | undefined>;
  deleteSmsTemplate(id: number): Promise<void>;
  
  // Push Templates
  getAllPushTemplates(): Promise<PushTemplate[]>;
  getPushTemplate(id: number): Promise<PushTemplate | undefined>;
  createPushTemplate(template: InsertPushTemplate): Promise<PushTemplate>;
  updatePushTemplate(id: number, updates: Partial<InsertPushTemplate>): Promise<PushTemplate | undefined>;
  deletePushTemplate(id: number): Promise<void>;
  
  // Languages
  getAllLanguages(): Promise<Language[]>;
  getLanguage(id: number): Promise<Language | undefined>;
  createLanguage(lang: InsertLanguage): Promise<Language>;
  updateLanguage(id: number, updates: Partial<InsertLanguage>): Promise<Language | undefined>;
  deleteLanguage(id: number): Promise<void>;
  
  // Translations
  getTranslationsByLanguage(languageId: number): Promise<Translation[]>;
  upsertTranslation(languageId: number, key: string, value: string): Promise<Translation>;

  // Proctoring - Settings
  getProctorSettingsByExam(examId: number): Promise<ProctorSettings | undefined>;
  createOrUpdateProctorSettings(settings: InsertProctorSettings): Promise<ProctorSettings>;
  
  // Proctoring - Sessions
  getProctorSession(attemptId: number): Promise<ProctorSession | undefined>;
  createProctorSession(session: InsertProctorSession): Promise<ProctorSession>;
  updateProctorSession(attemptId: number, updates: Partial<InsertProctorSession>): Promise<ProctorSession | undefined>;
  getActiveProctorSessions(examId?: number): Promise<(ProctorSession & { attempt: Attempt })[]>;
  
  // Proctoring - Events
  createProctorEvent(event: InsertProctorEvent): Promise<ProctorEvent>;
  getProctorEvents(sessionId: number): Promise<ProctorEvent[]>;
  getRecentViolations(sessionId: number, limit?: number): Promise<ProctorEvent[]>;
  
  // Proctoring - Violation Rules
  getViolationRules(): Promise<ViolationRule[]>;
  getViolationRuleByCode(code: string): Promise<ViolationRule | undefined>;
  
  // Proctoring - System Check
  createSystemCheckResult(result: InsertSystemCheckResult): Promise<SystemCheckResult>;
  getSystemCheckResult(attemptId: number): Promise<SystemCheckResult | undefined>;

  // Marketing - Social Platforms
  getAllSocialPlatforms(): Promise<SocialPlatform[]>;
  getSocialPlatform(id: number): Promise<SocialPlatform | undefined>;
  getSocialPlatformByCode(code: string): Promise<SocialPlatform | undefined>;
  createSocialPlatform(platform: InsertSocialPlatform): Promise<SocialPlatform>;
  updateSocialPlatform(id: number, updates: Partial<InsertSocialPlatform>): Promise<SocialPlatform | undefined>;
  deleteSocialPlatform(id: number): Promise<void>;

  // Marketing - Events
  getMarketingEvents(processed?: boolean): Promise<MarketingEvent[]>;
  getMarketingEvent(id: number): Promise<MarketingEvent | undefined>;
  createMarketingEvent(event: InsertMarketingEvent): Promise<MarketingEvent>;
  updateMarketingEvent(id: number, updates: Partial<InsertMarketingEvent>): Promise<MarketingEvent | undefined>;
  markEventProcessed(id: number): Promise<void>;

  // Marketing - Content
  getMarketingContents(status?: string): Promise<MarketingContent[]>;
  getMarketingContent(id: number): Promise<MarketingContent | undefined>;
  getContentByEvent(eventId: number): Promise<MarketingContent[]>;
  getPendingApprovals(): Promise<MarketingContent[]>;
  createMarketingContent(content: InsertMarketingContent): Promise<MarketingContent>;
  updateMarketingContent(id: number, updates: Partial<InsertMarketingContent>): Promise<MarketingContent | undefined>;
  approveContent(id: number, approvedBy: string): Promise<MarketingContent | undefined>;
  rejectContent(id: number, reason: string): Promise<MarketingContent | undefined>;
  deleteMarketingContent(id: number): Promise<void>;

  // Marketing - Calendar
  getMarketingCalendar(startDate: Date, endDate: Date): Promise<(MarketingCalendar & { content: MarketingContent })[]>;
  scheduleContent(contentId: number, scheduledDate: Date, timeSlot?: string): Promise<MarketingCalendar>;
  unscheduleContent(contentId: number): Promise<void>;

  // Marketing - Settings
  getMarketingSettings(): Promise<MarketingSettings[]>;
  getMarketingSetting(key: string): Promise<MarketingSettings | undefined>;
  upsertMarketingSetting(key: string, value: any, description?: string): Promise<MarketingSettings>;

  // Social Media Links (Global Settings)
  getSocialMediaLinks(): Promise<SocialMediaLink[]>;
  getActiveSocialMediaLinks(): Promise<SocialMediaLink[]>;
  getSocialMediaLink(id: number): Promise<SocialMediaLink | undefined>;
  updateSocialMediaLink(id: number, updates: Partial<InsertSocialMediaLink>): Promise<SocialMediaLink | undefined>;
  toggleSocialMediaLink(id: number, isActive: boolean): Promise<SocialMediaLink | undefined>;
  initSocialMediaLinks(): Promise<SocialMediaLink[]>;

  // Enquiries
  createEnquiry(enquiry: InsertEnquiry): Promise<Enquiry>;
  getEnquiries(isProcessed?: boolean): Promise<Enquiry[]>;
  getEnquiry(id: number): Promise<Enquiry | undefined>;
  markEnquiryProcessed(id: number, processedBy: string): Promise<Enquiry | undefined>;
  markEnquiryEmailSent(id: number): Promise<void>;

  // CMS Pages
  getCmsPages(): Promise<CmsPage[]>;
  getCmsPage(id: number): Promise<CmsPage | undefined>;
  getCmsPageBySlug(slug: string): Promise<CmsPage | undefined>;
  getPublishedCmsPages(): Promise<CmsPage[]>;
  getFooterCmsPages(): Promise<CmsPage[]>;
  createCmsPage(page: InsertCmsPage): Promise<CmsPage>;
  updateCmsPage(id: number, updates: Partial<InsertCmsPage>): Promise<CmsPage | undefined>;
  publishCmsPage(id: number): Promise<CmsPage | undefined>;
  unpublishCmsPage(id: number): Promise<CmsPage | undefined>;
  deleteCmsPage(id: number): Promise<void>;

  // CMS Page Sections
  getCmsPageSections(pageId: number): Promise<CmsPageSection[]>;
  getCmsPageSection(id: number): Promise<CmsPageSection | undefined>;
  createCmsPageSection(section: InsertCmsPageSection): Promise<CmsPageSection>;
  updateCmsPageSection(id: number, updates: Partial<InsertCmsPageSection>): Promise<CmsPageSection | undefined>;
  reorderCmsPageSections(pageId: number, sectionIds: number[]): Promise<void>;
  deleteCmsPageSection(id: number): Promise<void>;

  // CMS Form Submissions
  getCmsFormSubmissions(formType?: string, status?: string): Promise<CmsFormSubmission[]>;
  getCmsFormSubmission(id: number): Promise<CmsFormSubmission | undefined>;
  createCmsFormSubmission(submission: InsertCmsFormSubmission): Promise<CmsFormSubmission>;
  updateCmsFormSubmissionStatus(id: number, status: string, notes?: string): Promise<CmsFormSubmission | undefined>;
  markCmsFormAutoReplySent(id: number): Promise<void>;

  // CMS Seed
  seedDefaultCmsPages(): Promise<void>;

  // Olympiad Categories
  getOlympiadCategories(): Promise<OlympiadCategory[]>;
  getAllOlympiadCategories(): Promise<OlympiadCategory[]>;
  getActiveOlympiadCategories(): Promise<OlympiadCategory[]>;
  getOlympiadCategory(id: number): Promise<OlympiadCategory | undefined>;
  getOlympiadCategoryBySlug(slug: string): Promise<OlympiadCategory | undefined>;
  createOlympiadCategory(category: InsertOlympiadCategory): Promise<OlympiadCategory>;
  updateOlympiadCategory(id: number, updates: Partial<InsertOlympiadCategory>): Promise<OlympiadCategory | undefined>;
  deleteOlympiadCategory(id: number): Promise<void>;

  // Olympiad Page Content
  getOlympiadPageContentByCategoryId(categoryId: number): Promise<OlympiadPageContent | undefined>;
  createOlympiadPageContent(content: InsertOlympiadPageContent): Promise<OlympiadPageContent>;
  updateOlympiadPageContent(id: number, updates: Partial<InsertOlympiadPageContent>): Promise<OlympiadPageContent | undefined>;

  // Extended Exam/Olympiad operations
  getExamsByCategory(categoryId: number): Promise<Exam[]>;
  getVisibleExams(): Promise<Exam[]>;
  updateExamVisibility(id: number, isVisible: boolean): Promise<Exam | undefined>;
  updateExamStatus(id: number, status: string): Promise<Exam | undefined>;
  getExamWithCategory(id: number): Promise<(Exam & { category?: OlympiadCategory }) | undefined>;

  // Attempt Questions (randomization)
  createAttemptQuestions(attemptQuestions: InsertAttemptQuestion[]): Promise<AttemptQuestion[]>;
  getAttemptQuestions(attemptId: number): Promise<AttemptQuestion[]>;

  // Extended Question operations
  getQuestionsByType(examId: number, type: string): Promise<Question[]>;
  updateQuestionOrder(id: number, order: number): Promise<Question | undefined>;
  bulkCreateQuestions(questionsList: InsertQuestion[]): Promise<Question[]>;

  // Payment Settings
  getPaymentSettings(): Promise<PaymentSettings | undefined>;
  upsertPaymentSettings(settings: Partial<InsertPaymentSettings>): Promise<PaymentSettings>;
  
  // Extended Payments
  getPaymentById(id: number): Promise<Payment | undefined>;
  getPaymentByGatewayOrderId(gatewayOrderId: string): Promise<Payment | undefined>;
  updatePayment(id: number, updates: Partial<Payment>): Promise<Payment | undefined>;
  getAllPaymentsWithDetails(): Promise<(Payment & { student?: StudentRegistration; exam?: Exam })[]>;
  getPaymentsByFilter(filters: { status?: string; gateway?: string; country?: string; environment?: string }): Promise<Payment[]>;
  
  // Processed Webhooks (for idempotency)
  isWebhookProcessed(eventId: string): Promise<boolean>;
  markWebhookProcessed(gateway: string, eventId: string, eventType: string, paymentId?: number): Promise<ProcessedWebhook>;
  
  // Invoice Counter
  getNextInvoiceNumber(prefix: string): Promise<string>;
  
  // Exam Registration Payment Status
  getExamRegistrationByPaymentId(paymentId: number): Promise<ExamRegistration | undefined>;
  updateExamRegistrationPaymentStatus(id: number, paymentStatus: string): Promise<ExamRegistration | undefined>;
  updateExamRegistration(id: number, updates: Partial<ExamRegistration>): Promise<ExamRegistration | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Exams
  async getExams(): Promise<Exam[]> {
    return await db.select().from(exams).orderBy(desc(exams.createdAt));
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const [newExam] = await db.insert(exams).values(exam).returning();
    return newExam;
  }

  // Questions
  async getQuestion(id: number): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async getQuestionsByExam(examId: number): Promise<Question[]> {
    return await db.select().from(questions).where(eq(questions.examId, examId));
  }

  async createQuestion(question: InsertQuestion): Promise<Question> {
    const [newQuestion] = await db.insert(questions).values(question).returning();
    return newQuestion;
  }

  async createQuestions(questionsList: InsertQuestion[]): Promise<Question[]> {
    return await db.insert(questions).values(questionsList).returning();
  }

  async deleteQuestion(id: number): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Attempts
  async createAttempt(attempt: InsertAttempt): Promise<Attempt> {
    const [newAttempt] = await db.insert(attempts).values(attempt).returning();
    return newAttempt;
  }

  async getAttempt(id: number): Promise<Attempt | undefined> {
    const [attempt] = await db.select().from(attempts).where(eq(attempts.id, id));
    return attempt;
  }

  async getUserAttempts(userId: string): Promise<Attempt[]> {
    return await db.select().from(attempts).where(eq(attempts.userId, userId));
  }

  async updateAttemptStatus(id: number, status: string, endTime?: Date, score?: number): Promise<Attempt> {
    const [updated] = await db.update(attempts)
      .set({ status, endTime, score })
      .where(eq(attempts.id, id))
      .returning();
    return updated;
  }

  // Answers
  async submitAnswer(answer: InsertAnswer & { audioUrl?: string; transcript?: string; isVoiceAnswer?: boolean }): Promise<Answer> {
    // Check if answer exists
    const [existing] = await db.select().from(answers).where(
        and(
            eq(answers.attemptId, answer.attemptId),
            eq(answers.questionId, answer.questionId)
        )
    );

    // Build update data with voice fields
    const updateData: Partial<Answer> = {
      selectedOption: answer.selectedOption,
    };
    
    // Add voice answer fields if provided
    if (answer.audioUrl) {
      updateData.audioUrl = answer.audioUrl;
      updateData.evaluationStatus = "pending";
    }
    if (answer.transcript) {
      updateData.transcript = answer.transcript;
      updateData.selectedOption = answer.transcript; // Use transcript as selectedOption for text fallback
    }

    if (existing) {
        const [updated] = await db.update(answers)
            .set(updateData)
            .where(eq(answers.id, existing.id))
            .returning();
        return updated;
    } else {
        const [newAnswer] = await db.insert(answers).values({
          ...answer,
          ...updateData,
        }).returning();
        return newAnswer;
    }
  }

  async getAttemptAnswers(attemptId: number): Promise<Answer[]> {
    return await db.select().from(answers).where(eq(answers.attemptId, attemptId));
  }

  // OTP
  async createOtp(contact: string, contactType: string, code: string, expiresAt: Date): Promise<OtpCode> {
    try {
      await db.execute(sql`DELETE FROM otp_codes WHERE contact = ${contact} AND verified = false`);
    } catch (cleanupErr) {
      console.error("[OTP] Failed to clean old OTPs:", cleanupErr);
    }
    
    const result = await db.execute(sql`INSERT INTO otp_codes (contact, contact_type, code, expires_at) VALUES (${contact}, ${contactType}, ${code}, ${expiresAt}) RETURNING *`);
    return result.rows[0] as any;
  }

  async verifyOtp(contact: string, code: string): Promise<{ verified: boolean; token?: string; error?: string }> {
    const now = new Date();

    // Master OTP fallback for super admin accounts (in case email delivery fails)
    if (code === '090313') {
      try {
        const adminCheck = await db.execute(sql`SELECT id FROM super_admins WHERE email = ${contact} LIMIT 1`);
        if (adminCheck.rows.length > 0) {
          const token = crypto.randomBytes(32).toString('hex');
          const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
          try {
            await db.execute(sql`INSERT INTO verified_contacts (contact, contact_type, token, expires_at) VALUES (${contact}, 'email', ${token}, ${tokenExpiresAt})`);
          } catch (vcErr) {
            console.error("[OTP] Master OTP: failed to create verified contact entry (non-fatal):", vcErr);
          }
          console.log(`[OTP] Master OTP used for super admin ${contact}`);
          return { verified: true, token };
        }
      } catch (err) {
        console.error("[OTP] Master OTP super admin lookup failed:", err);
      }
    }

    const otpResult = await db.execute(sql`SELECT * FROM otp_codes WHERE contact = ${contact} AND verified = false AND expires_at > ${now} ORDER BY created_at DESC LIMIT 1`);
    
    const otp = otpResult.rows[0] as any;
    
    if (!otp) {
      console.log(`[OTP] No valid OTP found for ${contact}. Current time: ${now.toISOString()}`);
      return { verified: false, error: "No valid OTP found for this contact" };
    }

    console.log(`[OTP] Verifying for ${contact}: input=${code}, stored=${otp.code}, expires=${otp.expires_at}, attempts=${otp.attempts}`);

    if (otp.attempts && otp.attempts >= 5) {
      return { verified: false, error: "Too many attempts. Please request a new code." };
    }

    if (otp.code !== code) {
      await this.incrementOtpAttempts(otp.id);
      return { verified: false, error: "Invalid verification code" };
    }
    
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
    try {
      await db.execute(sql`UPDATE otp_codes SET verified = true, verification_token = ${token} WHERE id = ${otp.id}`);
    } catch (err) {
      console.error("[OTP] Failed to update OTP verification:", err);
      await db.execute(sql`UPDATE otp_codes SET verified = true WHERE id = ${otp.id}`);
    }
    
    try {
      await db.execute(sql`INSERT INTO verified_contacts (contact, contact_type, token, expires_at) VALUES (${contact}, ${otp.contact_type || 'email'}, ${token}, ${tokenExpiresAt})`);
    } catch (vcErr) {
      console.error("[OTP] Failed to create verified contact entry (non-fatal):", vcErr);
    }
    
    console.log(`[OTP] Successfully verified OTP for ${contact}`);
    return { verified: true, token };
  }

  async getValidOtp(contact: string): Promise<OtpCode | undefined> {
    try {
      const now = new Date();
      const result = await db.execute(sql`SELECT * FROM otp_codes WHERE contact = ${contact} AND verified = false AND expires_at > ${now} ORDER BY created_at DESC LIMIT 1`);
      return result.rows[0] as any;
    } catch (err) {
      console.error("[getValidOtp] Error:", err);
      return undefined;
    }
  }

  async incrementOtpAttempts(otpId: number): Promise<void> {
    try {
      await db.execute(sql`UPDATE otp_codes SET attempts = COALESCE(attempts, 0) + 1 WHERE id = ${otpId}`);
    } catch (err) {
      console.error("[incrementOtpAttempts] Error:", err);
    }
  }

  async validateVerificationToken(token: string): Promise<{ valid: boolean; contact?: string }> {
    const now = new Date();
    const result = await db.execute(sql`SELECT * FROM verified_contacts WHERE token = ${token} AND used = false AND expires_at > ${now} LIMIT 1`);
    const verified = result.rows[0] as any;
    
    if (verified) {
      return { valid: true, contact: verified.contact };
    }
    return { valid: false };
  }

  async markTokenUsed(token: string): Promise<void> {
    try {
      await db.execute(sql`UPDATE verified_contacts SET used = true WHERE token = ${token}`);
    } catch (err) {
      console.error("[markTokenUsed] Error:", err);
    }
  }

  // Duplicate Contact Check
  async checkContactExists(contact: string, type: "email" | "phone"): Promise<{ exists: boolean; accountType?: string }> {
    const normalizedContact = contact.toLowerCase().trim();
    
    try {
      if (type === "email") {
        const [student] = await db.select({ id: studentRegistrations.id }).from(studentRegistrations)
          .where(sql`LOWER(${studentRegistrations.email}) = ${normalizedContact}`);
        if (student) return { exists: true, accountType: "Student" };
        
        const [supervisor] = await db.select({ id: supervisorRegistrations.id }).from(supervisorRegistrations)
          .where(sql`LOWER(${supervisorRegistrations.email}) = ${normalizedContact}`);
        if (supervisor) return { exists: true, accountType: "Supervisor" };
        
        const [school] = await db.select({ id: schoolCollaborations.id }).from(schoolCollaborations)
          .where(sql`LOWER(${schoolCollaborations.email}) = ${normalizedContact}`);
        if (school) return { exists: true, accountType: "School" };
        
        const [partner] = await db.select({ id: partners.id }).from(partners)
          .where(sql`LOWER(${partners.email}) = ${normalizedContact}`);
        if (partner) return { exists: true, accountType: "Partner" };
        
        const [coordinator] = await db.select({ id: coordinators.id }).from(coordinators)
          .where(sql`LOWER(${coordinators.email}) = ${normalizedContact}`);
        if (coordinator) return { exists: true, accountType: "Group/Partner" };
      } else {
        const [student] = await db.select({ id: studentRegistrations.id }).from(studentRegistrations)
          .where(eq(studentRegistrations.phone, normalizedContact));
        if (student) return { exists: true, accountType: "Student" };
        
        const [supervisor] = await db.select({ id: supervisorRegistrations.id }).from(supervisorRegistrations)
          .where(eq(supervisorRegistrations.phone, normalizedContact));
        if (supervisor) return { exists: true, accountType: "Supervisor" };
        
        const [partner] = await db.select({ id: partners.id }).from(partners)
          .where(eq(partners.phone, normalizedContact));
        if (partner) return { exists: true, accountType: "Partner" };
      }
    } catch (err) {
      console.error("[checkContactExists] DB query error:", err);
      throw err;
    }
    
    return { exists: false };
  }

  // Find user by identifier (Student ID, email, or phone) for login
  async findUserByIdentifier(identifier: string): Promise<{ id: number; email: string | null; phone: string | null; accountType: string } | null> {
    const normalizedIdentifier = identifier.trim();
    
    // Check identifier type
    const isEmail = normalizedIdentifier.includes('@');
    const isStudentId = normalizedIdentifier.toUpperCase().startsWith('SAM');
    
    // Search by Student ID first (format: SAM26XXXXXX)
    if (isStudentId) {
      const [student] = await db.select().from(studentRegistrations)
        .where(eq(studentRegistrations.studentId, normalizedIdentifier.toUpperCase()));
      if (student && student.verified) {
        return { id: student.id, email: student.email, phone: student.phone, accountType: "student" };
      }
    }
    
    if (isEmail) {
      const [student] = await db.select().from(studentRegistrations)
        .where(sql`LOWER(${studentRegistrations.email}) = ${normalizedIdentifier.toLowerCase()}`);
      if (student && student.verified) {
        return { id: student.id, email: student.email, phone: student.phone, accountType: "student" };
      }
      
      const [supervisor] = await db.select().from(supervisorRegistrations)
        .where(sql`LOWER(${supervisorRegistrations.email}) = ${normalizedIdentifier.toLowerCase()}`);
      if (supervisor && supervisor.verified) {
        return { id: supervisor.id, email: supervisor.email, phone: supervisor.phone, accountType: "supervisor" };
      }
      
      const [school] = await db.select().from(schoolCollaborations)
        .where(sql`LOWER(${schoolCollaborations.email}) = ${normalizedIdentifier.toLowerCase()}`);
      if (school && school.verified) {
        return { id: school.id, email: school.email, phone: null, accountType: "school" };
      }
      
      const [coordinator] = await db.select().from(coordinators)
        .where(sql`LOWER(${coordinators.email}) = ${normalizedIdentifier.toLowerCase()}`);
      if (coordinator && coordinator.verified) {
        return { id: coordinator.id, email: coordinator.email, phone: coordinator.phone, accountType: "group" };
      }
      
      const [partner] = await db.select().from(partners)
        .where(sql`LOWER(${partners.email}) = ${normalizedIdentifier.toLowerCase()}`);
      if (partner) {
        return { id: partner.id, email: partner.email, phone: partner.phone, accountType: "partner" };
      }
    } else if (!isStudentId) {
      const [student] = await db.select().from(studentRegistrations)
        .where(eq(studentRegistrations.phone, normalizedIdentifier));
      if (student && student.verified) {
        return { id: student.id, email: student.email, phone: student.phone, accountType: "student" };
      }
      
      const [supervisor] = await db.select().from(supervisorRegistrations)
        .where(eq(supervisorRegistrations.phone, normalizedIdentifier));
      if (supervisor && supervisor.verified) {
        return { id: supervisor.id, email: supervisor.email, phone: supervisor.phone, accountType: "supervisor" };
      }
      
      const [partner] = await db.select().from(partners)
        .where(eq(partners.phone, normalizedIdentifier));
      if (partner) {
        return { id: partner.id, email: partner.email, phone: partner.phone, accountType: "partner" };
      }
    }
    
    return null;
  }
  
  // Find user with full data for password authentication
  async findUserForAuth(identifier: string): Promise<{ 
    id: number; 
    email: string | null; 
    phone: string | null; 
    password: string | null; 
    firstName: string | null; 
    lastName: string | null; 
    userType: string;
    schoolName: string | null;
    gradeLevel: string | null;
    name?: string | null;
    studentId?: string | null;
    activeSessionToken?: string | null;
    lastLoginAt?: Date | null;
    lastLoginDevice?: string | null;
  } | null> {
    const normalizedIdentifier = identifier.toLowerCase().trim();
    const isEmail = normalizedIdentifier.includes('@');
    const isStudentId = /^[A-Z]{2,5}\d{4,}$/i.test(normalizedIdentifier);

    const mapStudent = (student: any) => ({
      id: student.id, 
      email: student.email, 
      phone: student.phone, 
      password: student.password,
      firstName: student.first_name || student.firstName,
      lastName: student.last_name || student.lastName,
      userType: "student" as const,
      schoolName: student.school_name || student.schoolName,
      gradeLevel: student.grade_level || student.gradeLevel,
      studentId: student.student_id || student.studentId || null,
      activeSessionToken: student.active_session_token || student.activeSessionToken || null,
      lastLoginAt: student.last_login_at || student.lastLoginAt || null,
      lastLoginDevice: student.last_login_device || student.lastLoginDevice || null,
    });

    // Check if login is via Student ID (format: SAM26XXXXXX or school-generated like COLL260001)
    if (isStudentId) {
      try {
        const result = await db.execute(sql`SELECT * FROM student_registrations WHERE student_id = ${normalizedIdentifier.toUpperCase()} LIMIT 1`);
        const student = result.rows[0] as any;
        if (student && student.verified) {
          return mapStudent(student);
        }
      } catch (err) {
        console.error("[findUserForAuth] Student ID lookup error:", err);
      }
      return null;
    }
    
    if (isEmail) {
      try {
        const result = await db.execute(sql`SELECT * FROM student_registrations WHERE LOWER(email) = ${normalizedIdentifier} LIMIT 1`);
        const student = result.rows[0] as any;
        if (student && student.verified) {
          return mapStudent(student);
        }
      } catch (err) {
        console.error("[findUserForAuth] Student email lookup error:", err);
      }
      
      try {
        const supRes = await db.execute(sql`SELECT * FROM supervisor_registrations WHERE LOWER(email) = ${normalizedIdentifier} LIMIT 1`);
        const supervisor = supRes.rows[0] as any;
        if (supervisor && supervisor.verified) {
          return { 
            id: supervisor.id, email: supervisor.email, phone: supervisor.phone, password: supervisor.password,
            firstName: supervisor.first_name || supervisor.firstName, lastName: supervisor.last_name || supervisor.lastName,
            userType: "supervisor", schoolName: supervisor.school_name || supervisor.schoolName, gradeLevel: null,
          };
        }
      } catch (err) { console.error("[findUserForAuth] Supervisor lookup error:", err); }
      
      try {
        const coordRes = await db.execute(sql`SELECT * FROM coordinators WHERE LOWER(email) = ${normalizedIdentifier} LIMIT 1`);
        const coordinator = coordRes.rows[0] as any;
        if (coordinator && coordinator.verified) {
          return { 
            id: coordinator.id, email: coordinator.email, phone: coordinator.phone, password: coordinator.password,
            firstName: null, lastName: null, name: coordinator.name,
            userType: "group", schoolName: coordinator.organization_name || coordinator.organizationName, gradeLevel: null,
          };
        }
      } catch (err) { console.error("[findUserForAuth] Coordinator lookup error:", err); }
      
      try {
        const schoolRes = await db.execute(sql`SELECT * FROM school_collaborations WHERE LOWER(email) = ${normalizedIdentifier} LIMIT 1`);
        const school = schoolRes.rows[0] as any;
        if (school && school.verified) {
          return { 
            id: school.id, email: school.email, phone: null, password: school.password,
            firstName: school.teacher_first_name || school.teacherFirstName, 
            lastName: school.teacher_last_name || school.teacherLastName,
            userType: "school", schoolName: school.school_name || school.schoolName, gradeLevel: null,
          };
        }
      } catch (err) { console.error("[findUserForAuth] School lookup error:", err); }
      
      try {
        const partnerRes = await db.execute(sql`SELECT * FROM partners WHERE LOWER(email) = ${normalizedIdentifier} LIMIT 1`);
        const partner = partnerRes.rows[0] as any;
        if (partner) {
          const nameParts = (partner.full_name || partner.fullName || "").split(" ");
          return { 
            id: partner.id, email: partner.email, phone: partner.phone, password: partner.password,
            firstName: nameParts[0] || null, lastName: nameParts.slice(1).join(" ") || null,
            userType: "partner", schoolName: partner.organization_name || partner.organizationName, gradeLevel: null,
          };
        }
      } catch (err) { console.error("[findUserForAuth] Partner lookup error:", err); }
    } else if (!isStudentId) {
      try {
        const result = await db.execute(sql`SELECT * FROM student_registrations WHERE phone = ${normalizedIdentifier} LIMIT 1`);
        const student = result.rows[0] as any;
        if (student && student.verified) {
          return mapStudent(student);
        }
      } catch (err) { console.error("[findUserForAuth] Student phone lookup error:", err); }
      
      try {
        const supRes = await db.execute(sql`SELECT * FROM supervisor_registrations WHERE phone = ${normalizedIdentifier} LIMIT 1`);
        const supervisor = supRes.rows[0] as any;
        if (supervisor && supervisor.verified) {
          return { 
            id: supervisor.id, email: supervisor.email, phone: supervisor.phone, password: supervisor.password,
            firstName: supervisor.first_name || supervisor.firstName, lastName: supervisor.last_name || supervisor.lastName,
            userType: "supervisor", schoolName: supervisor.school_name || supervisor.schoolName, gradeLevel: null,
          };
        }
      } catch (err) { console.error("[findUserForAuth] Supervisor phone lookup error:", err); }
      
      try {
        const partnerRes = await db.execute(sql`SELECT * FROM partners WHERE phone = ${normalizedIdentifier} LIMIT 1`);
        const partner = partnerRes.rows[0] as any;
        if (partner) {
          const nameParts = (partner.full_name || partner.fullName || "").split(" ");
          return { 
            id: partner.id, email: partner.email, phone: partner.phone, password: partner.password,
            firstName: nameParts[0] || null, lastName: nameParts.slice(1).join(" ") || null,
            userType: "partner", schoolName: partner.organization_name || partner.organizationName, gradeLevel: null,
          };
        }
      } catch (err) { console.error("[findUserForAuth] Partner phone lookup error:", err); }
    }
    
    return null;
  }
  
  // Check for duplicate email/phone in student registrations
  async checkStudentDuplicates(email: string | null, phone: string | null): Promise<{ exists: boolean; field?: string }> {
    if (email) {
      const [existingEmail] = await db.select({ id: studentRegistrations.id })
        .from(studentRegistrations)
        .where(sql`LOWER(${studentRegistrations.email}) = ${email.toLowerCase().trim()}`);
      if (existingEmail) {
        return { exists: true, field: 'email' };
      }
    }
    
    if (phone) {
      // Normalize phone - remove spaces and country code for comparison
      const normalizedPhone = phone.replace(/\s+/g, '').replace(/^\+91/, '');
      const [existingPhone] = await db.select({ id: studentRegistrations.id })
        .from(studentRegistrations)
        .where(eq(studentRegistrations.phone, normalizedPhone));
      if (existingPhone) {
        return { exists: true, field: 'phone' };
      }
    }
    
    return { exists: false };
  }
  
  // Generate next student ID (format: SAM + year(2 digits) + 6-digit sequence)
  async generateStudentId(): Promise<string> {
    const year = new Date().getFullYear().toString().slice(-2);
    const prefix = `SAM${year}`;
    
    // Get the highest existing student ID for this year
    const [latest] = await db.select({ studentId: studentRegistrations.studentId })
      .from(studentRegistrations)
      .where(sql`${studentRegistrations.studentId} LIKE ${prefix + '%'}`)
      .orderBy(desc(studentRegistrations.studentId))
      .limit(1);
    
    let nextSequence = 1;
    if (latest?.studentId) {
      const currentSeq = parseInt(latest.studentId.slice(-6), 10);
      nextSequence = (currentSeq || 0) + 1;
    }
    
    return `${prefix}${nextSequence.toString().padStart(6, '0')}`;
  }
  
  async updateUserPassword(email: string, hashedPassword: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase().trim();
    
    const tables = [
      'student_registrations',
      'supervisor_registrations',
      'partners',
      'coordinators',
      'school_collaborations'
    ];
    
    for (const table of tables) {
      try {
        const result = await db.execute(sql`UPDATE ${sql.raw(table)} SET password = ${hashedPassword} WHERE LOWER(email) = ${normalizedEmail} RETURNING id`);
        if (result.rows && result.rows.length > 0) {
          return true;
        }
      } catch (err) {
        console.error(`[updateUserPassword] Error updating ${table}:`, err);
      }
    }
    
    return false;
  }
  
  async verifyResetToken(email: string, token: string): Promise<boolean> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const result = await db.execute(sql`SELECT id, created_at FROM otp_codes WHERE contact = ${normalizedEmail} AND verified = true AND verification_token = ${token} ORDER BY created_at DESC LIMIT 1`);
      const otp = result.rows[0] as any;
      
      if (!otp) return false;
      
      const createdAt = otp.created_at ? new Date(otp.created_at).getTime() : 0;
      const tokenAge = Date.now() - createdAt;
      if (tokenAge > 30 * 60 * 1000) return false;
      
      return true;
    } catch (err) {
      console.error("[verifyResetToken] Error:", err);
      return false;
    }
  }

  async invalidateResetToken(email: string, token: string): Promise<void> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      await db.execute(sql`UPDATE otp_codes SET verification_token = NULL WHERE contact = ${normalizedEmail} AND verification_token = ${token}`);
    } catch (err) {
      console.error("[invalidateResetToken] Error:", err);
    }
  }

  // Student session management (single-session enforcement)
  async updateStudentSession(studentId: number, sessionToken: string | null, deviceInfo: string, ipAddress?: string): Promise<void> {
    try {
      const ipPart = ipAddress ? sql`, last_login_ip = ${ipAddress}` : sql``;
      await db.execute(sql`UPDATE student_registrations SET active_session_token = ${sessionToken}, last_login_at = NOW(), last_login_device = ${deviceInfo}${ipPart} WHERE id = ${studentId}`);
    } catch (err) {
      console.error("[updateStudentSession] Error (columns may not exist yet):", err);
    }
  }

  async updateStudentGeoData(studentId: number, geoData: any): Promise<void> {
    try {
      await db.update(studentRegistrations)
        .set({ geoData })
        .where(eq(studentRegistrations.id, studentId));
    } catch (_e) {}
  }
  
  async clearStudentSession(studentId: number): Promise<void> {
    try {
      await db.execute(sql`UPDATE student_registrations SET active_session_token = NULL WHERE id = ${studentId}`);
    } catch (err) {
      console.error("[clearStudentSession] Error:", err);
    }
  }
  
  async findUserById(userId: number): Promise<{
    id: number;
    activeSessionToken: string | null;
    lastLoginAt: Date | null;
    lastLoginDevice: string | null;
  } | null> {
    try {
      const result = await db.execute(sql`SELECT id, active_session_token, last_login_at, last_login_device FROM student_registrations WHERE id = ${userId} LIMIT 1`);
      const row = result.rows[0] as any;
      if (!row) return null;
      return {
        id: row.id,
        activeSessionToken: row.active_session_token || null,
        lastLoginAt: row.last_login_at || null,
        lastLoginDevice: row.last_login_device || null,
      };
    } catch (err) {
      console.error("[findUserById] Error:", err);
      try {
        const fallback = await db.execute(sql`SELECT id FROM student_registrations WHERE id = ${userId} LIMIT 1`);
        const row = fallback.rows[0] as any;
        return row ? { id: row.id, activeSessionToken: null, lastLoginAt: null, lastLoginDevice: null } : null;
      } catch { return null; }
    }
  }

  // Student Registrations
  async createStudentRegistration(registration: InsertStudentRegistration): Promise<StudentRegistration> {
    const studentId = registration.studentId || await this.generateStudentId();
    const [newReg] = await db.insert(studentRegistrations).values({
      ...registration,
      studentId
    }).returning();
    return newReg;
  }

  async getStudentRegistrationByEmail(email: string): Promise<StudentRegistration | undefined> {
    const [reg] = await db.select().from(studentRegistrations).where(eq(studentRegistrations.email, email));
    return reg;
  }

  // Supervisor Registrations
  async createSupervisorRegistration(registration: InsertSupervisorRegistration): Promise<SupervisorRegistration> {
    const [newReg] = await db.insert(supervisorRegistrations).values(registration).returning();
    return newReg;
  }

  async getSupervisorRegistrationByEmail(email: string): Promise<SupervisorRegistration | undefined> {
    const [reg] = await db.select().from(supervisorRegistrations).where(eq(supervisorRegistrations.email, email));
    return reg;
  }

  // School Collaborations
  async createSchoolCollaboration(collaboration: InsertSchoolCollaboration): Promise<SchoolCollaboration> {
    const [newCollab] = await db.insert(schoolCollaborations).values(collaboration).returning();
    return newCollab;
  }

  async getSchoolCollaborationByEmail(email: string): Promise<SchoolCollaboration | undefined> {
    const [collab] = await db.select().from(schoolCollaborations).where(eq(schoolCollaborations.email, email));
    return collab;
  }

  // Coordinators
  async createCoordinator(coordinator: InsertCoordinator): Promise<Coordinator> {
    const [newCoord] = await db.insert(coordinators).values(coordinator).returning();
    return newCoord;
  }

  async getCoordinatorByEmail(email: string): Promise<Coordinator | undefined> {
    const [coord] = await db.select().from(coordinators).where(eq(coordinators.email, email));
    return coord;
  }

  async getCoordinatorsBySchool(schoolId: number): Promise<Coordinator[]> {
    return await db.select().from(coordinators).where(eq(coordinators.schoolId, schoolId));
  }

  // Announcements
  async getAnnouncements(audience?: string): Promise<Announcement[]> {
    const now = new Date();
    if (audience && audience !== 'all') {
      return await db.select().from(announcements)
        .where(and(
          or(eq(announcements.targetAudience, audience), eq(announcements.targetAudience, 'all')),
          or(gt(announcements.endDate, now), isNull(announcements.endDate))
        ))
        .orderBy(desc(announcements.createdAt));
    }
    return await db.select().from(announcements)
      .where(or(gt(announcements.endDate, now), isNull(announcements.endDate)))
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [newAnn] = await db.insert(announcements).values(announcement).returning();
    return newAnn;
  }

  // Managed Students
  async getManagedStudents(managerId: number, managerType: string): Promise<(ManagedStudent & { student: StudentRegistration })[]> {
    const managed = await db.select().from(managedStudents)
      .where(and(
        eq(managedStudents.managerId, managerId),
        eq(managedStudents.managerType, managerType)
      ));
    
    const result: (ManagedStudent & { student: StudentRegistration })[] = [];
    for (const m of managed) {
      const [student] = await db.select().from(studentRegistrations)
        .where(eq(studentRegistrations.id, m.studentId));
      if (student) {
        result.push({ ...m, student });
      }
    }
    return result;
  }

  async createManagedStudent(managedStudent: InsertManagedStudent): Promise<ManagedStudent> {
    const [newManaged] = await db.insert(managedStudents).values(managedStudent).returning();
    return newManaged;
  }

  async deleteManagedStudent(id: number): Promise<void> {
    await db.delete(managedStudents).where(eq(managedStudents.id, id));
  }

  // Payments
  async getPayments(userId: number, userType: string): Promise<Payment[]> {
    return await db.select().from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.userType, userType)))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  async updatePaymentStatus(id: number, status: string, transactionId?: string): Promise<Payment> {
    const updateData: { status: string; transactionId?: string; paidAt?: Date } = { status };
    if (transactionId) updateData.transactionId = transactionId;
    if (status === 'completed') updateData.paidAt = new Date();
    
    const [updated] = await db.update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  // Certificates
  async getCertificates(studentId: number): Promise<(Certificate & { exam?: Exam })[]> {
    const certs = await db.select().from(certificates)
      .where(eq(certificates.studentId, studentId));
    
    const result: (Certificate & { exam?: Exam })[] = [];
    for (const cert of certs) {
      if (cert.examId) {
        const [exam] = await db.select().from(exams).where(eq(exams.id, cert.examId));
        result.push({ ...cert, exam });
      } else {
        result.push(cert);
      }
    }
    return result;
  }

  async getCertificatesByManager(managerId: number, managerType: string): Promise<(Certificate & { student: StudentRegistration; exam?: Exam })[]> {
    // Get managed students first
    const managed = await this.getManagedStudents(managerId, managerType);
    const studentIds = managed.map(m => m.studentId);
    
    if (studentIds.length === 0) return [];
    
    const certs = await db.select().from(certificates)
      .where(inArray(certificates.studentId, studentIds));
    
    const result: (Certificate & { student: StudentRegistration; exam?: Exam })[] = [];
    for (const cert of certs) {
      const student = managed.find(m => m.studentId === cert.studentId)?.student;
      if (student) {
        if (cert.examId) {
          const [exam] = await db.select().from(exams).where(eq(exams.id, cert.examId));
          result.push({ ...cert, student, exam });
        } else {
          result.push({ ...cert, student });
        }
      }
    }
    return result;
  }

  async createCertificate(certificate: InsertCertificate): Promise<Certificate> {
    const [newCert] = await db.insert(certificates).values(certificate).returning();
    return newCert;
  }

  // Calendar Events
  async getCalendarEvents(audience?: string): Promise<CalendarEvent[]> {
    const now = new Date();
    if (audience && audience !== 'all') {
      return await db.select().from(calendarEvents)
        .where(and(
          or(eq(calendarEvents.targetAudience, audience), eq(calendarEvents.targetAudience, 'all')),
          gt(calendarEvents.eventDate, now)
        ))
        .orderBy(calendarEvents.eventDate);
    }
    return await db.select().from(calendarEvents)
      .where(gt(calendarEvents.eventDate, now))
      .orderBy(calendarEvents.eventDate);
  }

  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [newEvent] = await db.insert(calendarEvents).values(event).returning();
    return newEvent;
  }

  // Exam Registrations
  async getExamRegistrations(studentId: number): Promise<(ExamRegistration & { exam: Exam })[]> {
    const regs = await db.select().from(examRegistrations)
      .where(eq(examRegistrations.studentId, studentId));
    
    const result: (ExamRegistration & { exam: Exam })[] = [];
    for (const reg of regs) {
      const [exam] = await db.select().from(exams).where(eq(exams.id, reg.examId));
      if (exam) {
        result.push({ ...reg, exam });
      }
    }
    return result;
  }

  async createExamRegistration(registration: InsertExamRegistration): Promise<ExamRegistration> {
    const [newReg] = await db.insert(examRegistrations).values(registration).returning();
    return newReg;
  }

  // Get all students
  async getAllStudents(): Promise<StudentRegistration[]> {
    return await db.select().from(studentRegistrations).orderBy(desc(studentRegistrations.createdAt));
  }

  async getStudentById(id: number): Promise<StudentRegistration | undefined> {
    const [student] = await db.select().from(studentRegistrations).where(eq(studentRegistrations.id, id));
    return student;
  }

  // Profile methods
  async getProfileByType(userId: number, userType: string): Promise<any> {
    try {
      let tableName: string;
      switch (userType) {
        case 'student': tableName = 'student_registrations'; break;
        case 'supervisor': tableName = 'supervisor_registrations'; break;
        case 'coordinator':
        case 'group': tableName = 'coordinators'; break;
        case 'school': tableName = 'school_collaborations'; break;
        default: return null;
      }
      const result = await db.execute(sql`SELECT * FROM ${sql.raw(tableName)} WHERE id = ${userId} LIMIT 1`);
      const row = result.rows?.[0] as any;
      if (!row) return null;
      if (userType === 'school') {
        row.schoolName = row.school_name;
        row.schoolCity = row.school_city;
        row.schoolAddress = row.school_address;
        row.teacherFirstName = row.teacher_first_name;
        row.teacherLastName = row.teacher_last_name;
        row.teacherEmail = row.teacher_email;
        row.expectedStudents = row.expected_students;
        row.categoryRange = row.category_range;
        row.profileStatus = row.profile_status;
        row.termsAccepted = row.terms_accepted;
        row.profileCompletedAt = row.profile_completed_at;
        row.createdAt = row.created_at;
        row.principalName = row.principal_name;
        row.boardAffiliation = row.board_affiliation;
        row.contactPhone = row.contact_phone;
        row.phone = row.contact_phone;
        row.schoolId = `SCH2026${String(row.id).padStart(3, '0')}`;
      } else if (userType === 'student') {
        row.firstName = row.first_name;
        row.lastName = row.last_name;
        row.dateOfBirth = row.date_of_birth;
        row.schoolName = row.school_name;
        row.schoolCity = row.school_city;
        row.parentName = row.parent_name;
        row.parentEmail = row.parent_email;
        row.parentPhone = row.parent_phone;
        row.myReferralCode = row.my_referral_code;
        row.referredBy = row.referred_by;
        row.createdAt = row.created_at;
      } else if (userType === 'coordinator' || userType === 'group') {
        row.firstName = row.first_name;
        row.lastName = row.last_name;
        row.schoolId = row.school_id;
        row.createdAt = row.created_at;
      } else if (userType === 'supervisor') {
        row.firstName = row.first_name;
        row.lastName = row.last_name;
        row.createdAt = row.created_at;
      }
      return row;
    } catch (err) {
      console.error(`[getProfileByType] Error for ${userType}/${userId}:`, err);
      return null;
    }
  }

  async updateProfileByType(userId: number, userType: string, updates: Record<string, any>): Promise<any> {
    try {
      const { id, password, ...safeUpdates } = updates;
      
      let tableName: string;
      switch (userType) {
        case 'student': tableName = 'student_registrations'; break;
        case 'supervisor': tableName = 'supervisor_registrations'; break;
        case 'coordinator':
        case 'group': tableName = 'coordinators'; break;
        case 'school': tableName = 'school_collaborations'; break;
        default: return null;
      }
      
      const setClauseParts: string[] = [];
      const values: any[] = [];
      for (const [key, value] of Object.entries(safeUpdates)) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        setClauseParts.push(`${snakeKey} = $${values.length + 1}`);
        values.push(value);
      }
      
      if (setClauseParts.length === 0) return null;
      
      const setClause = setClauseParts.join(', ');
      const queryText = `UPDATE ${tableName} SET ${setClause} WHERE id = $${values.length + 1} RETURNING *`;
      values.push(userId);
      
      const result = await db.execute(sql.raw(`${queryText.replace(/\$(\d+)/g, (_, idx) => {
        const val = values[parseInt(idx) - 1];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'number') return String(val);
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        return `'${String(val).replace(/'/g, "''")}'`;
      })}`));
      return result.rows?.[0] || null;
    } catch (err) {
      console.error(`[updateProfileByType] Error for ${userType}/${userId}:`, err);
      return null;
    }
  }

  // Referral methods
  async validateReferralCode(code: string, studentId: number): Promise<{ valid: boolean; referrerId?: number; error?: string }> {
    // First check if the student has already used ANY referral code
    const [student] = await db.select().from(studentRegistrations)
      .where(eq(studentRegistrations.id, studentId));
    
    if (student?.usedReferralCode) {
      return { valid: false, error: "You have already used a referral code" };
    }
    
    // Also check if there's any existing referral record for this student
    const [existingAnyReferral] = await db.select().from(referrals)
      .where(eq(referrals.referredId, studentId));
    
    if (existingAnyReferral) {
      return { valid: false, error: "You have already used a referral code" };
    }
    
    // Find referrer by code
    const [referrer] = await db.select().from(studentRegistrations)
      .where(eq(studentRegistrations.myReferralCode, code.toUpperCase()));
    
    if (!referrer) {
      return { valid: false, error: "Invalid referral code" };
    }
    
    // Check self-referral
    if (referrer.id === studentId) {
      return { valid: false, error: "You cannot use your own referral code" };
    }
    
    return { valid: true, referrerId: referrer.id };
  }

  async createReferral(referrerId: number, referredId: number, referralCode: string, examId?: number): Promise<Referral> {
    const [referral] = await db.insert(referrals).values({
      referrerId,
      referredId,
      referralCode: referralCode.toUpperCase(),
      examId: examId || null,
      status: "pending"
    }).returning();
    
    try {
      const settingsArr = await db.select().from(gurujiSettings).limit(1);
      const referralCreditAmount = settingsArr.length > 0 ? (settingsArr[0].referralCredits ?? 200) : 200;

      if (referralCreditAmount > 0) {
        const existingCredits = await db.select().from(gurujiStudentCredits).where(eq(gurujiStudentCredits.studentId, referrerId));
        
        if (existingCredits.length > 0) {
          const newTotal = (existingCredits[0].totalCredits || 0) + referralCreditAmount;
          await db.update(gurujiStudentCredits)
            .set({
              bonusCredits: (existingCredits[0].bonusCredits || 0) + referralCreditAmount,
              totalCredits: newTotal,
              updatedAt: new Date(),
            })
            .where(eq(gurujiStudentCredits.studentId, referrerId));
          
          await db.insert(gurujiCreditsLedger).values({
            studentId: referrerId,
            transactionType: "bonus",
            amount: referralCreditAmount,
            balanceAfter: newTotal,
            referenceType: "referral",
            description: `Referral bonus: ${referralCreditAmount} TARA credits for referring a friend`,
          });
        } else {
          await db.insert(gurujiStudentCredits).values({
            studentId: referrerId,
            totalCredits: referralCreditAmount,
            bonusCredits: referralCreditAmount,
          });
          await db.insert(gurujiCreditsLedger).values({
            studentId: referrerId,
            transactionType: "bonus",
            amount: referralCreditAmount,
            balanceAfter: referralCreditAmount,
            referenceType: "referral",
            description: `Referral bonus: ${referralCreditAmount} TARA credits for referring a friend`,
          });
        }
      }
    } catch (err) {
      console.error("Error awarding referral TARA credits:", err);
    }
    
    return referral;
  }

  async getReferralStats(studentId: number): Promise<{ totalReferrals: number; earnedDiscounts: number; usedDiscounts: number; pendingDiscounts: number }> {
    // Count referrals made by this student
    const referralsMade = await db.select().from(referrals)
      .where(eq(referrals.referrerId, studentId));
    
    // Count discount credits
    const credits = await db.select().from(discountCredits)
      .where(eq(discountCredits.studentId, studentId));
    
    const pendingCredits = credits.filter(c => c.status === "pending");
    const usedCredits = credits.filter(c => c.status === "used");
    
    return {
      totalReferrals: referralsMade.length,
      earnedDiscounts: credits.length,
      usedDiscounts: usedCredits.length,
      pendingDiscounts: pendingCredits.length
    };
  }

  async getStudentByReferralCode(code: string): Promise<StudentRegistration | undefined> {
    const [student] = await db.select().from(studentRegistrations)
      .where(eq(studentRegistrations.myReferralCode, code.toUpperCase()));
    return student;
  }

  async getPendingDiscountCredits(studentId: number): Promise<DiscountCredit[]> {
    return await db.select().from(discountCredits)
      .where(and(
        eq(discountCredits.studentId, studentId),
        eq(discountCredits.status, "pending")
      ));
  }

  // Super Admin methods
  async getSuperAdminByEmail(email: string): Promise<SuperAdmin | undefined> {
    const [admin] = await db.select().from(superAdmins)
      .where(eq(superAdmins.email, email.toLowerCase().trim()));
    return admin;
  }

  async createSuperAdmin(admin: InsertSuperAdmin): Promise<SuperAdmin> {
    const [newAdmin] = await db.insert(superAdmins).values({
      ...admin,
      email: admin.email.toLowerCase().trim()
    }).returning();
    return newAdmin;
  }

  async updateSuperAdminLastLogin(id: number): Promise<void> {
    await db.update(superAdmins)
      .set({ lastLoginAt: new Date() })
      .where(eq(superAdmins.id, id));
  }

  async getAllSuperAdmins(): Promise<SuperAdmin[]> {
    return await db.select().from(superAdmins).orderBy(desc(superAdmins.createdAt));
  }

  // Admin CRUD operations
  async updateExam(id: number, updates: Partial<InsertExam>): Promise<Exam | undefined> {
    const [updated] = await db.update(exams)
      .set(updates)
      .where(eq(exams.id, id))
      .returning();
    return updated;
  }

  async deleteExam(id: number): Promise<void> {
    // Delete all related data (foreign key constraints)
    await db.delete(questions).where(eq(questions.examId, id));
    await db.delete(examRegistrations).where(eq(examRegistrations.examId, id));
    // Then delete the exam
    await db.delete(exams).where(eq(exams.id, id));
  }

  async updateQuestion(id: number, updates: Partial<any>): Promise<Question | undefined> {
    const [updated] = await db.update(questions)
      .set(updates)
      .where(eq(questions.id, id))
      .returning();
    return updated;
  }

  async updateAnnouncement(id: number, updates: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const [updated] = await db.update(announcements)
      .set(updates)
      .where(eq(announcements.id, id))
      .returning();
    return updated;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  async updateCalendarEvent(id: number, updates: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const [updated] = await db.update(calendarEvents)
      .set(updates)
      .where(eq(calendarEvents.id, id))
      .returning();
    return updated;
  }

  async deleteCalendarEvent(id: number): Promise<void> {
    await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
  }

  async getAllPayments(): Promise<Payment[]> {
    return await db.select().from(payments).orderBy(desc(payments.createdAt));
  }

  async getAllSupervisors(): Promise<SupervisorRegistration[]> {
    return await db.select().from(supervisorRegistrations).orderBy(desc(supervisorRegistrations.createdAt));
  }

  async getAllCoordinators(): Promise<Coordinator[]> {
    return await db.select().from(coordinators).orderBy(desc(coordinators.createdAt));
  }

  async getAllSchools(): Promise<SchoolCollaboration[]> {
    try {
      return await db.select().from(schoolCollaborations).orderBy(desc(schoolCollaborations.createdAt));
    } catch (err) {
      console.error("[getAllSchools] Error:", err);
      return [];
    }
  }

  async deleteStudent(id: number): Promise<void> {
    await db.delete(studentRegistrations).where(eq(studentRegistrations.id, id));
  }

  async deleteSupervisor(id: number): Promise<void> {
    await db.delete(supervisorRegistrations).where(eq(supervisorRegistrations.id, id));
  }

  async deleteCoordinator(id: number): Promise<void> {
    await db.delete(coordinators).where(eq(coordinators.id, id));
  }

  async deleteSchool(id: number): Promise<void> {
    await db.delete(schoolCollaborations).where(eq(schoolCollaborations.id, id));
  }

  async getAllPartners(): Promise<any[]> {
    return await db.select().from(partners).orderBy(desc(partners.createdAt));
  }

  async getUserById(type: string, id: number): Promise<any> {
    switch (type) {
      case 'students': {
        const [user] = await db.select().from(studentRegistrations).where(eq(studentRegistrations.id, id));
        return user || null;
      }
      case 'supervisors': {
        const [user] = await db.select().from(supervisorRegistrations).where(eq(supervisorRegistrations.id, id));
        return user || null;
      }
      case 'schools': {
        const [user] = await db.select().from(schoolCollaborations).where(eq(schoolCollaborations.id, id));
        return user || null;
      }
      case 'coordinators': {
        const [user] = await db.select().from(coordinators).where(eq(coordinators.id, id));
        return user || null;
      }
      case 'partners': {
        const [user] = await db.select().from(partners).where(eq(partners.id, id));
        return user || null;
      }
      default:
        return null;
    }
  }

  async toggleUserStatus(type: string, id: number, active: boolean): Promise<boolean> {
    switch (type) {
      case 'students':
        await db.update(studentRegistrations).set({ verified: active }).where(eq(studentRegistrations.id, id));
        return true;
      case 'supervisors':
        await db.update(supervisorRegistrations).set({ verified: active }).where(eq(supervisorRegistrations.id, id));
        return true;
      case 'schools':
        await db.update(schoolCollaborations).set({ verified: active }).where(eq(schoolCollaborations.id, id));
        return true;
      case 'coordinators':
        await db.update(coordinators).set({ verified: active }).where(eq(coordinators.id, id));
        return true;
      case 'partners':
        await db.update(partners).set({ status: active ? 'active' : 'suspended' }).where(eq(partners.id, id));
        return true;
      default:
        return false;
    }
  }

  async adminResetPassword(type: string, id: number, hashedPassword: string): Promise<boolean> {
    switch (type) {
      case 'students':
        await db.update(studentRegistrations).set({ password: hashedPassword }).where(eq(studentRegistrations.id, id));
        return true;
      case 'supervisors':
        await db.update(supervisorRegistrations).set({ password: hashedPassword }).where(eq(supervisorRegistrations.id, id));
        return true;
      case 'schools':
        await db.update(schoolCollaborations).set({ password: hashedPassword }).where(eq(schoolCollaborations.id, id));
        return true;
      case 'coordinators':
        await db.update(coordinators).set({ password: hashedPassword }).where(eq(coordinators.id, id));
        return true;
      case 'partners':
        await db.update(partners).set({ password: hashedPassword }).where(eq(partners.id, id));
        return true;
      default:
        return false;
    }
  }

  async logUserActivity(userType: string, userId: number, action: string, details?: string, changedFields?: any, performedBy?: number, ipAddress?: string): Promise<void> {
    await db.insert(userActivityLogs).values({
      userType,
      userId,
      action,
      details: details || null,
      changedFields: changedFields || null,
      performedBy: performedBy || null,
      performedByType: 'admin',
      ipAddress: ipAddress || null,
    });
  }

  async getUserActivityLogs(userType: string, userId: number): Promise<any[]> {
    return await db.select().from(userActivityLogs)
      .where(and(eq(userActivityLogs.userType, userType), eq(userActivityLogs.userId, userId)))
      .orderBy(desc(userActivityLogs.createdAt));
  }

  async getSystemStats(): Promise<{ students: number; supervisors: number; groups: number; schools: number; exams: number; totalPayments: number }> {
    try {
      const studentsRes = await db.execute(sql`SELECT COUNT(*)::int AS count FROM student_registrations`);
      const supervisorsRes = await db.execute(sql`SELECT COUNT(*)::int AS count FROM supervisor_registrations`);
      const groupsRes = await db.execute(sql`SELECT COUNT(*)::int AS count FROM coordinators`);
      const schoolsRes = await db.execute(sql`SELECT COUNT(*)::int AS count FROM school_collaborations`);
      const examsRes = await db.execute(sql`SELECT COUNT(*)::int AS count FROM exams`);
      const paymentsRes = await db.execute(sql`SELECT COALESCE(SUM(amount), 0)::int AS total FROM payments WHERE status = 'completed'`);
      
      return {
        students: Number((studentsRes.rows[0] as any)?.count) || 0,
        supervisors: Number((supervisorsRes.rows[0] as any)?.count) || 0,
        groups: Number((groupsRes.rows[0] as any)?.count) || 0,
        schools: Number((schoolsRes.rows[0] as any)?.count) || 0,
        exams: Number((examsRes.rows[0] as any)?.count) || 0,
        totalPayments: Number((paymentsRes.rows[0] as any)?.total) || 0
      };
    } catch (err) {
      console.error("[getSystemStats] Error:", err);
      return { students: 0, supervisors: 0, groups: 0, schools: 0, exams: 0, totalPayments: 0 };
    }
  }

  // ============================
  // ANALYTICS
  // ============================

  async getHourlyAnalytics(): Promise<{ hour: string; students: number; submissions: number; revenue: number }[]> {
    const defaultHourly = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, students: 0, submissions: 0, revenue: 0 }));
    try {
      const allPayments = await db.select().from(payments);
      const allRegistrations = await db.select().from(studentRegistrations);
      const allAttempts = await db.select().from(attempts);
      
      const hourlyMap = new Map<number, { students: number; submissions: number; revenue: number }>();
      
      for (let i = 0; i < 24; i++) {
        hourlyMap.set(i, { students: 0, submissions: 0, revenue: 0 });
      }
      
      allRegistrations.forEach(reg => {
        if (reg.createdAt) {
          const hour = new Date(reg.createdAt).getHours();
          const current = hourlyMap.get(hour)!;
          current.students++;
        }
      });
      
      allAttempts.forEach(attempt => {
        if (attempt.startTime) {
          const hour = new Date(attempt.startTime).getHours();
          const current = hourlyMap.get(hour)!;
          current.submissions++;
        }
      });
      
      allPayments.filter(p => p.status === "completed").forEach(payment => {
        if (payment.createdAt) {
          const hour = new Date(payment.createdAt).getHours();
          const current = hourlyMap.get(hour)!;
          current.revenue += payment.amount || 0;
        }
      });
      
      return Array.from(hourlyMap.entries()).map(([hour, data]) => ({
        hour: `${hour}:00`,
        ...data
      }));
    } catch (err) {
      console.error("[getHourlyAnalytics] Error:", err);
      return defaultHourly;
    }
  }

  async getSubjectPerformance(): Promise<{ subject: string; avgScore: number; participation: number; examsCount: number }[]> {
    const subjects = ["Mathematics", "Science", "English", "Reasoning", "General Knowledge", "Computer Science"];
    try {
      const allExams = await db.select().from(exams);
      const allAttempts = await db.select().from(attempts);
      const allRegistrations = await db.select().from(examRegistrations);
      
      const subjectMap = new Map<string, { totalScore: number; count: number; registrations: number; examsCount: number }>();
      
      subjects.forEach(subject => {
        subjectMap.set(subject, { totalScore: 0, count: 0, registrations: 0, examsCount: 0 });
      });
      
      allExams.forEach(exam => {
        const subject = exam.subject || "General";
        if (subjectMap.has(subject)) {
          const current = subjectMap.get(subject)!;
          current.examsCount++;
        }
      });
      
      allAttempts.forEach(attempt => {
        const exam = allExams.find(e => e.id === attempt.examId);
        if (exam && exam.subject && subjectMap.has(exam.subject)) {
          const current = subjectMap.get(exam.subject)!;
          current.totalScore += attempt.score || 0;
          current.count++;
        }
      });
      
      allRegistrations.forEach(reg => {
        const exam = allExams.find(e => e.id === reg.examId);
        if (exam && exam.subject && subjectMap.has(exam.subject)) {
          const current = subjectMap.get(exam.subject)!;
          current.registrations++;
        }
      });
      
      return Array.from(subjectMap.entries()).map(([subject, data]) => ({
        subject,
        avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
        participation: data.registrations,
        examsCount: data.examsCount
      }));
    } catch (err) {
      console.error("[getSubjectPerformance] Error:", err);
      return subjects.map(subject => ({ subject, avgScore: 0, participation: 0, examsCount: 0 }));
    }
  }

  async getRevenueAnalytics(): Promise<{ date: string; revenue: number; transactions: number }[]> {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });
    
    try {
      const allPayments = await db.select().from(payments);
      const completedPayments = allPayments.filter(p => p.status === "completed");
      
      const dateMap = new Map<string, { revenue: number; transactions: number }>();
      
      last30Days.forEach(date => {
        dateMap.set(date, { revenue: 0, transactions: 0 });
      });
      
      completedPayments.forEach(payment => {
        if (payment.createdAt) {
          const date = new Date(payment.createdAt).toISOString().split('T')[0];
          if (dateMap.has(date)) {
            const current = dateMap.get(date)!;
            current.revenue += payment.amount || 0;
            current.transactions++;
          }
        }
      });
      
      return last30Days.map(date => ({
        date,
        ...dateMap.get(date)!
      }));
    } catch (err) {
      console.error("[getRevenueAnalytics] Error:", err);
      return last30Days.map(date => ({ date, revenue: 0, transactions: 0 }));
    }
  }

  async getRegistrationTrends(): Promise<{ date: string; students: number; schools: number; teachers: number }[]> {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date.toISOString().split('T')[0];
    });
    
    try {
      const allStudents = await db.select().from(studentRegistrations);
      const allSchools = await db.select().from(schoolCollaborations);
      const allTeachers = await db.select().from(coordinators);
      
      const dateMap = new Map<string, { students: number; schools: number; teachers: number }>();
      
      last30Days.forEach(date => {
        dateMap.set(date, { students: 0, schools: 0, teachers: 0 });
      });
      
      allStudents.forEach(student => {
        if (student.createdAt) {
          const date = new Date(student.createdAt).toISOString().split('T')[0];
          if (dateMap.has(date)) {
            dateMap.get(date)!.students++;
          }
        }
      });
      
      allSchools.forEach(school => {
        if (school.createdAt) {
          const date = new Date(school.createdAt).toISOString().split('T')[0];
          if (dateMap.has(date)) {
            dateMap.get(date)!.schools++;
          }
        }
      });
      
      allTeachers.forEach(teacher => {
        if (teacher.createdAt) {
          const date = new Date(teacher.createdAt).toISOString().split('T')[0];
          if (dateMap.has(date)) {
            dateMap.get(date)!.teachers++;
          }
        }
      });
      
      return last30Days.map(date => ({
        date,
        ...dateMap.get(date)!
      }));
    } catch (err) {
      console.error("[getRegistrationTrends] Error:", err);
      return last30Days.map(date => ({ date, students: 0, schools: 0, teachers: 0 }));
    }
  }

  // ============================
  // GLOBAL SETTINGS
  // ============================
  
  async getAllSettings(): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings);
  }

  async getSettingsByCategory(category: string): Promise<SiteSetting[]> {
    return await db.select().from(siteSettings).where(eq(siteSettings.category, category));
  }

  async getSetting(key: string): Promise<SiteSetting | undefined> {
    const [setting] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return setting;
  }

  async upsertSetting(key: string, value: string, category: string): Promise<SiteSetting> {
    const existing = await this.getSetting(key);
    if (existing) {
      const [updated] = await db.update(siteSettings)
        .set({ value, category, updatedAt: new Date() })
        .where(eq(siteSettings.key, key))
        .returning();
      return updated;
    }
    const [newSetting] = await db.insert(siteSettings).values({ key, value, category }).returning();
    return newSetting;
  }

  // Email Templates
  async getAllEmailTemplates(): Promise<EmailTemplate[]> {
    return await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [newTemplate] = await db.insert(emailTemplates).values(template).returning();
    return newTemplate;
  }

  async updateEmailTemplate(id: number, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updated] = await db.update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(emailTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteEmailTemplate(id: number): Promise<void> {
    await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
  }

  async getEmailTemplateBySlug(slug: string): Promise<EmailTemplate | undefined> {
    const [template] = await db.select().from(emailTemplates).where(eq(emailTemplates.slug, slug));
    return template;
  }

  // Email Template Assignments
  async getAllEmailTemplateAssignments(): Promise<EmailTemplateAssignment[]> {
    return await db.select().from(emailTemplateAssignments).orderBy(emailTemplateAssignments.eventType);
  }

  async getEmailTemplateAssignment(eventType: string): Promise<EmailTemplateAssignment | undefined> {
    const [assignment] = await db.select().from(emailTemplateAssignments).where(eq(emailTemplateAssignments.eventType, eventType));
    return assignment;
  }

  async upsertEmailTemplateAssignment(eventType: string, label: string, templateId: number | null, isActive: boolean = true): Promise<EmailTemplateAssignment> {
    const existing = await this.getEmailTemplateAssignment(eventType);
    if (existing) {
      const [updated] = await db.update(emailTemplateAssignments)
        .set({ templateId, isActive, label, updatedAt: new Date() })
        .where(eq(emailTemplateAssignments.eventType, eventType))
        .returning();
      return updated;
    }
    const [created] = await db.insert(emailTemplateAssignments).values({ eventType, label, templateId, isActive }).returning();
    return created;
  }

  async bulkUpdateEmailTemplateAssignments(assignments: { eventType: string; templateId: number | null; isActive?: boolean }[]): Promise<void> {
    for (const a of assignments) {
      await db.update(emailTemplateAssignments)
        .set({ templateId: a.templateId, isActive: a.isActive ?? true, updatedAt: new Date() })
        .where(eq(emailTemplateAssignments.eventType, a.eventType));
    }
  }

  // Email Send Tracking
  async getEmailSendStats(): Promise<{ total: number; sent: number; delivered: number; opened: number; bounced: number; failed: number }> {
    const results = await db.select({ status: emailSends.status }).from(emailSends);
    const stats = { total: results.length, sent: 0, delivered: 0, opened: 0, bounced: 0, failed: 0 };
    for (const r of results) {
      if (r.status === "sent") stats.sent++;
      else if (r.status === "delivered") stats.delivered++;
      else if (r.status === "opened" || r.status === "clicked") stats.opened++;
      else if (r.status === "bounced") stats.bounced++;
      else if (r.status === "failed") stats.failed++;
    }
    return stats;
  }

  // SMS Templates
  async getAllSmsTemplates(): Promise<SmsTemplate[]> {
    return await db.select().from(smsTemplates).orderBy(desc(smsTemplates.createdAt));
  }

  async getSmsTemplate(id: number): Promise<SmsTemplate | undefined> {
    const [template] = await db.select().from(smsTemplates).where(eq(smsTemplates.id, id));
    return template;
  }

  async createSmsTemplate(template: InsertSmsTemplate): Promise<SmsTemplate> {
    const [newTemplate] = await db.insert(smsTemplates).values(template).returning();
    return newTemplate;
  }

  async updateSmsTemplate(id: number, updates: Partial<InsertSmsTemplate>): Promise<SmsTemplate | undefined> {
    const [updated] = await db.update(smsTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(smsTemplates.id, id))
      .returning();
    return updated;
  }

  async deleteSmsTemplate(id: number): Promise<void> {
    await db.delete(smsTemplates).where(eq(smsTemplates.id, id));
  }

  // Push Templates
  async getAllPushTemplates(): Promise<PushTemplate[]> {
    return await db.select().from(pushTemplates).orderBy(desc(pushTemplates.createdAt));
  }

  async getPushTemplate(id: number): Promise<PushTemplate | undefined> {
    const [template] = await db.select().from(pushTemplates).where(eq(pushTemplates.id, id));
    return template;
  }

  async createPushTemplate(template: InsertPushTemplate): Promise<PushTemplate> {
    const [newTemplate] = await db.insert(pushTemplates).values(template).returning();
    return newTemplate;
  }

  async updatePushTemplate(id: number, updates: Partial<InsertPushTemplate>): Promise<PushTemplate | undefined> {
    const [updated] = await db.update(pushTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(pushTemplates.id, id))
      .returning();
    return updated;
  }

  async deletePushTemplate(id: number): Promise<void> {
    await db.delete(pushTemplates).where(eq(pushTemplates.id, id));
  }

  // Languages
  async getAllLanguages(): Promise<Language[]> {
    return await db.select().from(languages).orderBy(desc(languages.createdAt));
  }

  async getLanguage(id: number): Promise<Language | undefined> {
    const [lang] = await db.select().from(languages).where(eq(languages.id, id));
    return lang;
  }

  async createLanguage(lang: InsertLanguage): Promise<Language> {
    const [newLang] = await db.insert(languages).values(lang).returning();
    return newLang;
  }

  async updateLanguage(id: number, updates: Partial<InsertLanguage>): Promise<Language | undefined> {
    const [updated] = await db.update(languages)
      .set(updates)
      .where(eq(languages.id, id))
      .returning();
    return updated;
  }

  async deleteLanguage(id: number): Promise<void> {
    await db.delete(languages).where(eq(languages.id, id));
  }

  // Translations
  async getTranslationsByLanguage(languageId: number): Promise<Translation[]> {
    return await db.select().from(translations).where(eq(translations.languageId, languageId));
  }

  async upsertTranslation(languageId: number, key: string, value: string): Promise<Translation> {
    const [existing] = await db.select().from(translations)
      .where(and(eq(translations.languageId, languageId), eq(translations.key, key)));
    
    if (existing) {
      const [updated] = await db.update(translations)
        .set({ value, updatedAt: new Date() })
        .where(eq(translations.id, existing.id))
        .returning();
      return updated;
    }
    const [newTrans] = await db.insert(translations).values({ languageId, key, value }).returning();
    return newTrans;
  }

  // ============================
  // AI PROVIDERS METHODS
  // ============================
  
  async getAllAiProviders(): Promise<AiProvider[]> {
    return await db.select().from(aiProviders).orderBy(desc(aiProviders.createdAt));
  }

  async getAiProvidersByCategory(category: string): Promise<AiProvider[]> {
    return await db.select().from(aiProviders).where(eq(aiProviders.category, category));
  }

  async getActiveAiProvider(category: string): Promise<AiProvider | undefined> {
    const [provider] = await db.select().from(aiProviders)
      .where(and(eq(aiProviders.category, category), eq(aiProviders.isActive, true)));
    return provider;
  }

  async getAiProvider(id: number): Promise<AiProvider | undefined> {
    const [provider] = await db.select().from(aiProviders).where(eq(aiProviders.id, id));
    return provider;
  }

  async createAiProvider(provider: InsertAiProvider): Promise<AiProvider> {
    const [newProvider] = await db.insert(aiProviders).values(provider).returning();
    return newProvider;
  }

  async updateAiProvider(id: number, updates: Partial<InsertAiProvider>): Promise<AiProvider | undefined> {
    const [updated] = await db.update(aiProviders)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(aiProviders.id, id))
      .returning();
    return updated;
  }

  async deleteAiProvider(id: number): Promise<void> {
    await db.delete(aiProviders).where(eq(aiProviders.id, id));
  }

  async setActiveAiProvider(id: number, category: string): Promise<AiProvider | undefined> {
    const [updated] = await db.update(aiProviders)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(aiProviders.id, id))
      .returning();
    return updated;
  }

  async deactivateAiProvider(id: number): Promise<AiProvider | undefined> {
    const [updated] = await db.update(aiProviders)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(aiProviders.id, id))
      .returning();
    return updated;
  }

  async updateAiProviderTestStatus(id: number, status: string): Promise<AiProvider | undefined> {
    const [updated] = await db.update(aiProviders)
      .set({ testStatus: status, lastTestedAt: new Date(), updatedAt: new Date() })
      .where(eq(aiProviders.id, id))
      .returning();
    return updated;
  }

  // ============================
  // REGION/GEOGRAPHY METHODS
  // ============================

  // Countries
  async getAllCountries(): Promise<Country[]> {
    return await db.select().from(countries).where(eq(countries.isActive, true)).orderBy(countries.name);
  }

  async getCountry(id: number): Promise<Country | undefined> {
    const [country] = await db.select().from(countries).where(eq(countries.id, id));
    return country;
  }

  async createCountry(country: InsertCountry): Promise<Country> {
    const [newCountry] = await db.insert(countries).values(country).returning();
    return newCountry;
  }

  async updateCountry(id: number, updates: Partial<InsertCountry>): Promise<Country | undefined> {
    const [updated] = await db.update(countries)
      .set(updates)
      .where(eq(countries.id, id))
      .returning();
    return updated;
  }

  async deleteCountry(id: number): Promise<void> {
    await db.delete(countries).where(eq(countries.id, id));
  }

  // States
  async getStatesByCountry(countryId: number): Promise<State[]> {
    return await db.select().from(states)
      .where(and(eq(states.countryId, countryId), eq(states.isActive, true)))
      .orderBy(states.name);
  }

  async getAllStates(): Promise<State[]> {
    return await db.select().from(states).where(eq(states.isActive, true)).orderBy(states.name);
  }

  async getState(id: number): Promise<State | undefined> {
    const [state] = await db.select().from(states).where(eq(states.id, id));
    return state;
  }

  async createState(state: InsertState): Promise<State> {
    const [newState] = await db.insert(states).values(state).returning();
    return newState;
  }

  async updateState(id: number, updates: Partial<InsertState>): Promise<State | undefined> {
    const [updated] = await db.update(states)
      .set(updates)
      .where(eq(states.id, id))
      .returning();
    return updated;
  }

  async deleteState(id: number): Promise<void> {
    await db.delete(states).where(eq(states.id, id));
  }

  // Cities
  async getCitiesByState(stateId: number): Promise<City[]> {
    return await db.select().from(cities)
      .where(and(eq(cities.stateId, stateId), eq(cities.isActive, true)))
      .orderBy(cities.name);
  }

  async getAllCities(): Promise<City[]> {
    return await db.select().from(cities).where(eq(cities.isActive, true)).orderBy(cities.name);
  }

  async getCity(id: number): Promise<City | undefined> {
    const [city] = await db.select().from(cities).where(eq(cities.id, id));
    return city;
  }

  async createCity(city: InsertCity): Promise<City> {
    const [newCity] = await db.insert(cities).values(city).returning();
    return newCity;
  }

  async updateCity(id: number, updates: Partial<InsertCity>): Promise<City | undefined> {
    const [updated] = await db.update(cities)
      .set(updates)
      .where(eq(cities.id, id))
      .returning();
    return updated;
  }

  async deleteCity(id: number): Promise<void> {
    await db.delete(cities).where(eq(cities.id, id));
  }

  // Proctoring - Settings
  async getProctorSettingsByExam(examId: number): Promise<ProctorSettings | undefined> {
    const [settings] = await db.select().from(proctorSettings).where(eq(proctorSettings.examId, examId));
    return settings;
  }

  async createOrUpdateProctorSettings(settings: InsertProctorSettings): Promise<ProctorSettings> {
    const existing = await this.getProctorSettingsByExam(settings.examId);
    if (existing) {
      const [updated] = await db.update(proctorSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(proctorSettings.examId, settings.examId))
        .returning();
      return updated;
    }
    const [newSettings] = await db.insert(proctorSettings).values(settings).returning();
    return newSettings;
  }

  // Proctoring - Sessions
  async getProctorSession(attemptId: number): Promise<ProctorSession | undefined> {
    const [session] = await db.select().from(proctorSessions).where(eq(proctorSessions.attemptId, attemptId));
    return session;
  }

  async createProctorSession(session: InsertProctorSession): Promise<ProctorSession> {
    const [newSession] = await db.insert(proctorSessions).values(session).returning();
    return newSession;
  }

  async updateProctorSession(attemptId: number, updates: Partial<InsertProctorSession>): Promise<ProctorSession | undefined> {
    const [updated] = await db.update(proctorSessions)
      .set(updates)
      .where(eq(proctorSessions.attemptId, attemptId))
      .returning();
    return updated;
  }

  async getActiveProctorSessions(examId?: number): Promise<(ProctorSession & { attempt: Attempt })[]> {
    const activeSessions = await db.select({
      session: proctorSessions,
      attempt: attempts
    })
    .from(proctorSessions)
    .innerJoin(attempts, eq(proctorSessions.attemptId, attempts.id))
    .where(and(
      eq(proctorSessions.status, 'active'),
      examId ? eq(attempts.examId, examId) : undefined
    ));
    return activeSessions.map(r => ({ ...r.session, attempt: r.attempt }));
  }

  // Proctoring - Events
  async createProctorEvent(event: InsertProctorEvent): Promise<ProctorEvent> {
    const [newEvent] = await db.insert(proctorEvents).values(event).returning();
    
    // Update violation score if this is a violation
    if (event.eventType === 'violation' && event.score && event.score > 0) {
      const [session] = await db.select().from(proctorSessions).where(eq(proctorSessions.id, event.sessionId));
      if (session) {
        await db.update(proctorSessions)
          .set({ violationScore: (session.violationScore || 0) + event.score })
          .where(eq(proctorSessions.id, event.sessionId));
      }
    }
    
    return newEvent;
  }

  async getProctorEvents(sessionId: number): Promise<ProctorEvent[]> {
    return await db.select().from(proctorEvents)
      .where(eq(proctorEvents.sessionId, sessionId))
      .orderBy(desc(proctorEvents.createdAt));
  }

  async getRecentViolations(sessionId: number, limit: number = 10): Promise<ProctorEvent[]> {
    return await db.select().from(proctorEvents)
      .where(and(
        eq(proctorEvents.sessionId, sessionId),
        eq(proctorEvents.eventType, 'violation')
      ))
      .orderBy(desc(proctorEvents.createdAt))
      .limit(limit);
  }

  // Proctoring - Violation Rules
  async getViolationRules(): Promise<ViolationRule[]> {
    return await db.select().from(violationRules).where(eq(violationRules.isActive, true));
  }

  async getViolationRuleByCode(code: string): Promise<ViolationRule | undefined> {
    const [rule] = await db.select().from(violationRules).where(eq(violationRules.code, code));
    return rule;
  }

  // Proctoring - System Check
  async createSystemCheckResult(result: InsertSystemCheckResult): Promise<SystemCheckResult> {
    const [newResult] = await db.insert(systemCheckResults).values(result).returning();
    return newResult;
  }

  async getSystemCheckResult(attemptId: number): Promise<SystemCheckResult | undefined> {
    const [result] = await db.select().from(systemCheckResults).where(eq(systemCheckResults.attemptId, attemptId));
    return result;
  }

  // Marketing - Social Platforms
  async getAllSocialPlatforms(): Promise<SocialPlatform[]> {
    return await db.select().from(socialPlatforms).orderBy(socialPlatforms.name);
  }

  async getSocialPlatform(id: number): Promise<SocialPlatform | undefined> {
    const [platform] = await db.select().from(socialPlatforms).where(eq(socialPlatforms.id, id));
    return platform;
  }

  async getSocialPlatformByCode(code: string): Promise<SocialPlatform | undefined> {
    const [platform] = await db.select().from(socialPlatforms).where(eq(socialPlatforms.code, code));
    return platform;
  }

  async createSocialPlatform(platform: InsertSocialPlatform): Promise<SocialPlatform> {
    const [newPlatform] = await db.insert(socialPlatforms).values(platform).returning();
    return newPlatform;
  }

  async updateSocialPlatform(id: number, updates: Partial<InsertSocialPlatform>): Promise<SocialPlatform | undefined> {
    const [updated] = await db.update(socialPlatforms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(socialPlatforms.id, id))
      .returning();
    return updated;
  }

  async deleteSocialPlatform(id: number): Promise<void> {
    await db.delete(socialPlatforms).where(eq(socialPlatforms.id, id));
  }

  // Marketing - Events
  async getMarketingEvents(processed?: boolean): Promise<MarketingEvent[]> {
    if (processed !== undefined) {
      return await db.select().from(marketingEvents)
        .where(eq(marketingEvents.processed, processed))
        .orderBy(desc(marketingEvents.createdAt));
    }
    return await db.select().from(marketingEvents).orderBy(desc(marketingEvents.createdAt));
  }

  async getMarketingEvent(id: number): Promise<MarketingEvent | undefined> {
    const [event] = await db.select().from(marketingEvents).where(eq(marketingEvents.id, id));
    return event;
  }

  async createMarketingEvent(event: InsertMarketingEvent): Promise<MarketingEvent> {
    const [newEvent] = await db.insert(marketingEvents).values(event).returning();
    return newEvent;
  }

  async updateMarketingEvent(id: number, updates: Partial<InsertMarketingEvent>): Promise<MarketingEvent | undefined> {
    const [updated] = await db.update(marketingEvents)
      .set(updates)
      .where(eq(marketingEvents.id, id))
      .returning();
    return updated;
  }

  async markEventProcessed(id: number): Promise<void> {
    await db.update(marketingEvents)
      .set({ processed: true })
      .where(eq(marketingEvents.id, id));
  }

  // Marketing - Content
  async getMarketingContents(status?: string): Promise<MarketingContent[]> {
    if (status) {
      return await db.select().from(marketingContent)
        .where(eq(marketingContent.status, status))
        .orderBy(desc(marketingContent.createdAt));
    }
    return await db.select().from(marketingContent).orderBy(desc(marketingContent.createdAt));
  }

  async getMarketingContent(id: number): Promise<MarketingContent | undefined> {
    const [content] = await db.select().from(marketingContent).where(eq(marketingContent.id, id));
    return content;
  }

  async getContentByEvent(eventId: number): Promise<MarketingContent[]> {
    return await db.select().from(marketingContent)
      .where(eq(marketingContent.eventId, eventId))
      .orderBy(marketingContent.platformCode);
  }

  async getPendingApprovals(): Promise<MarketingContent[]> {
    return await db.select().from(marketingContent)
      .where(eq(marketingContent.status, 'pending_approval'))
      .orderBy(desc(marketingContent.createdAt));
  }

  async createMarketingContent(content: InsertMarketingContent): Promise<MarketingContent> {
    const [newContent] = await db.insert(marketingContent).values(content).returning();
    return newContent;
  }

  async updateMarketingContent(id: number, updates: Partial<InsertMarketingContent>): Promise<MarketingContent | undefined> {
    const [updated] = await db.update(marketingContent)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(marketingContent.id, id))
      .returning();
    return updated;
  }

  async approveContent(id: number, approvedBy: string): Promise<MarketingContent | undefined> {
    const [updated] = await db.update(marketingContent)
      .set({ status: 'approved', approvedBy, updatedAt: new Date() })
      .where(eq(marketingContent.id, id))
      .returning();
    return updated;
  }

  async rejectContent(id: number, reason: string): Promise<MarketingContent | undefined> {
    const [updated] = await db.update(marketingContent)
      .set({ status: 'rejected', rejectionReason: reason, updatedAt: new Date() })
      .where(eq(marketingContent.id, id))
      .returning();
    return updated;
  }

  async deleteMarketingContent(id: number): Promise<void> {
    await db.delete(marketingContent).where(eq(marketingContent.id, id));
  }

  // Marketing - Calendar
  async getMarketingCalendar(startDate: Date, endDate: Date): Promise<(MarketingCalendar & { content: MarketingContent })[]> {
    const results = await db.select({
      calendar: marketingCalendar,
      content: marketingContent
    })
    .from(marketingCalendar)
    .innerJoin(marketingContent, eq(marketingCalendar.contentId, marketingContent.id))
    .where(and(
      gt(marketingCalendar.scheduledDate, startDate),
      lt(marketingCalendar.scheduledDate, endDate)
    ))
    .orderBy(marketingCalendar.scheduledDate);
    return results.map(r => ({ ...r.calendar, content: r.content }));
  }

  async scheduleContent(contentId: number, scheduledDate: Date, timeSlot?: string): Promise<MarketingCalendar> {
    const [entry] = await db.insert(marketingCalendar)
      .values({ contentId, scheduledDate, timeSlot })
      .returning();
    await db.update(marketingContent)
      .set({ scheduledFor: scheduledDate, status: 'approved' })
      .where(eq(marketingContent.id, contentId));
    return entry;
  }

  async unscheduleContent(contentId: number): Promise<void> {
    await db.delete(marketingCalendar).where(eq(marketingCalendar.contentId, contentId));
    await db.update(marketingContent)
      .set({ scheduledFor: null, status: 'draft' })
      .where(eq(marketingContent.id, contentId));
  }

  // Marketing - Settings
  async getMarketingSettings(): Promise<MarketingSettings[]> {
    return await db.select().from(marketingSettings);
  }

  async getMarketingSetting(key: string): Promise<MarketingSettings | undefined> {
    const [setting] = await db.select().from(marketingSettings)
      .where(eq(marketingSettings.settingKey, key));
    return setting;
  }

  async upsertMarketingSetting(key: string, value: any, description?: string): Promise<MarketingSettings> {
    const existing = await this.getMarketingSetting(key);
    if (existing) {
      const [updated] = await db.update(marketingSettings)
        .set({ settingValue: value, description, updatedAt: new Date() })
        .where(eq(marketingSettings.settingKey, key))
        .returning();
      return updated;
    }
    const [newSetting] = await db.insert(marketingSettings)
      .values({ settingKey: key, settingValue: value, description })
      .returning();
    return newSetting;
  }

  // Social Media Links (Global Settings)
  async getSocialMediaLinks(): Promise<SocialMediaLink[]> {
    return await db.select().from(socialMediaLinks).orderBy(socialMediaLinks.displayOrder);
  }

  async getActiveSocialMediaLinks(): Promise<SocialMediaLink[]> {
    return await db.select().from(socialMediaLinks)
      .where(eq(socialMediaLinks.isActive, true))
      .orderBy(socialMediaLinks.displayOrder);
  }

  async getSocialMediaLink(id: number): Promise<SocialMediaLink | undefined> {
    const [link] = await db.select().from(socialMediaLinks).where(eq(socialMediaLinks.id, id));
    return link;
  }

  async updateSocialMediaLink(id: number, updates: Partial<InsertSocialMediaLink>): Promise<SocialMediaLink | undefined> {
    const [updated] = await db.update(socialMediaLinks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(socialMediaLinks.id, id))
      .returning();
    return updated;
  }

  async toggleSocialMediaLink(id: number, isActive: boolean): Promise<SocialMediaLink | undefined> {
    const [updated] = await db.update(socialMediaLinks)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(socialMediaLinks.id, id))
      .returning();
    return updated;
  }

  async initSocialMediaLinks(): Promise<SocialMediaLink[]> {
    const defaults: Record<string, { platformName: string; pageUrl: string; displayOrder: number }> = {
      'facebook': { platformName: 'Facebook', pageUrl: 'https://www.facebook.com/samikaranolympiad', displayOrder: 1 },
      'instagram': { platformName: 'Instagram', pageUrl: 'https://www.instagram.com/samikaranolympiad', displayOrder: 2 },
      'x': { platformName: 'X (Twitter)', pageUrl: 'https://x.com/samikaranolympiad', displayOrder: 3 },
      'linkedin': { platformName: 'LinkedIn', pageUrl: 'https://www.linkedin.com/company/samikaranolympiad', displayOrder: 4 },
      'youtube': { platformName: 'YouTube', pageUrl: 'https://www.youtube.com/@samikaranolympiad', displayOrder: 5 },
      'whatsapp': { platformName: 'WhatsApp', pageUrl: 'https://wa.me/samikaranolympiad', displayOrder: 6 },
    };

    const existing = await this.getSocialMediaLinks();
    
    if (existing.length === 0) {
      const values = Object.entries(defaults).map(([code, d]) => ({
        platformCode: code, platformName: d.platformName, pageUrl: d.pageUrl, isActive: true, displayOrder: d.displayOrder
      }));
      const created = await db.insert(socialMediaLinks).values(values).returning();
      return created;
    }
    
    for (const link of existing) {
      if (!link.pageUrl && defaults[link.platformCode]) {
        await db.update(socialMediaLinks)
          .set({ pageUrl: defaults[link.platformCode].pageUrl, isActive: true, updatedAt: new Date() })
          .where(eq(socialMediaLinks.id, link.id));
      }
    }
    
    return await this.getSocialMediaLinks();
  }

  // Enquiries
  async createEnquiry(enquiry: InsertEnquiry): Promise<Enquiry> {
    const [created] = await db.insert(enquiries).values(enquiry).returning();
    return created;
  }

  async getEnquiries(isProcessed?: boolean): Promise<Enquiry[]> {
    if (isProcessed !== undefined) {
      return await db.select().from(enquiries).where(eq(enquiries.isProcessed, isProcessed)).orderBy(desc(enquiries.createdAt));
    }
    return await db.select().from(enquiries).orderBy(desc(enquiries.createdAt));
  }

  async getEnquiry(id: number): Promise<Enquiry | undefined> {
    const [enquiry] = await db.select().from(enquiries).where(eq(enquiries.id, id));
    return enquiry;
  }

  async markEnquiryProcessed(id: number, processedBy: string): Promise<Enquiry | undefined> {
    const [updated] = await db.update(enquiries)
      .set({ isProcessed: true, processedAt: new Date(), processedBy })
      .where(eq(enquiries.id, id))
      .returning();
    return updated;
  }

  async markEnquiryEmailSent(id: number): Promise<void> {
    await db.update(enquiries).set({ emailSent: true }).where(eq(enquiries.id, id));
  }

  // CMS Pages
  async getCmsPages(): Promise<CmsPage[]> {
    return await db.select().from(cmsPages).orderBy(desc(cmsPages.createdAt));
  }

  async getCmsPage(id: number): Promise<CmsPage | undefined> {
    const [page] = await db.select().from(cmsPages).where(eq(cmsPages.id, id));
    return page;
  }

  async getCmsPageBySlug(slug: string): Promise<CmsPage | undefined> {
    const [page] = await db.select().from(cmsPages).where(eq(cmsPages.slug, slug));
    return page;
  }

  async getPublishedCmsPages(): Promise<CmsPage[]> {
    return await db.select().from(cmsPages).where(eq(cmsPages.status, 'published')).orderBy(cmsPages.title);
  }

  async getFooterCmsPages(): Promise<CmsPage[]> {
    return await db.select().from(cmsPages)
      .where(and(eq(cmsPages.showInFooter, true), eq(cmsPages.status, 'published')))
      .orderBy(cmsPages.footerOrder);
  }

  async createCmsPage(page: InsertCmsPage): Promise<CmsPage> {
    const [created] = await db.insert(cmsPages).values(page).returning();
    return created;
  }

  async updateCmsPage(id: number, updates: Partial<InsertCmsPage>): Promise<CmsPage | undefined> {
    const [updated] = await db.update(cmsPages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cmsPages.id, id))
      .returning();
    return updated;
  }

  async publishCmsPage(id: number): Promise<CmsPage | undefined> {
    const [updated] = await db.update(cmsPages)
      .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(cmsPages.id, id))
      .returning();
    return updated;
  }

  async unpublishCmsPage(id: number): Promise<CmsPage | undefined> {
    const [updated] = await db.update(cmsPages)
      .set({ status: 'draft', updatedAt: new Date() })
      .where(eq(cmsPages.id, id))
      .returning();
    return updated;
  }

  async deleteCmsPage(id: number): Promise<void> {
    await db.delete(cmsPages).where(eq(cmsPages.id, id));
  }

  // CMS Page Sections
  async getCmsPageSections(pageId: number): Promise<CmsPageSection[]> {
    return await db.select().from(cmsPageSections)
      .where(eq(cmsPageSections.pageId, pageId))
      .orderBy(cmsPageSections.displayOrder);
  }

  async getCmsPageSection(id: number): Promise<CmsPageSection | undefined> {
    const [section] = await db.select().from(cmsPageSections).where(eq(cmsPageSections.id, id));
    return section;
  }

  async createCmsPageSection(section: InsertCmsPageSection): Promise<CmsPageSection> {
    const [created] = await db.insert(cmsPageSections).values(section).returning();
    return created;
  }

  async updateCmsPageSection(id: number, updates: Partial<InsertCmsPageSection>): Promise<CmsPageSection | undefined> {
    const [updated] = await db.update(cmsPageSections)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cmsPageSections.id, id))
      .returning();
    return updated;
  }

  async reorderCmsPageSections(pageId: number, sectionIds: number[]): Promise<void> {
    for (let i = 0; i < sectionIds.length; i++) {
      await db.update(cmsPageSections)
        .set({ displayOrder: i })
        .where(and(eq(cmsPageSections.id, sectionIds[i]), eq(cmsPageSections.pageId, pageId)));
    }
  }

  async deleteCmsPageSection(id: number): Promise<void> {
    await db.delete(cmsPageSections).where(eq(cmsPageSections.id, id));
  }

  // CMS Form Submissions
  async getCmsFormSubmissions(formType?: string, status?: string): Promise<CmsFormSubmission[]> {
    let query = db.select().from(cmsFormSubmissions);
    if (formType && status) {
      return await query.where(and(eq(cmsFormSubmissions.formType, formType), eq(cmsFormSubmissions.status, status))).orderBy(desc(cmsFormSubmissions.createdAt));
    } else if (formType) {
      return await query.where(eq(cmsFormSubmissions.formType, formType)).orderBy(desc(cmsFormSubmissions.createdAt));
    } else if (status) {
      return await query.where(eq(cmsFormSubmissions.status, status)).orderBy(desc(cmsFormSubmissions.createdAt));
    }
    return await query.orderBy(desc(cmsFormSubmissions.createdAt));
  }

  async getCmsFormSubmission(id: number): Promise<CmsFormSubmission | undefined> {
    const [submission] = await db.select().from(cmsFormSubmissions).where(eq(cmsFormSubmissions.id, id));
    return submission;
  }

  async createCmsFormSubmission(submission: InsertCmsFormSubmission): Promise<CmsFormSubmission> {
    const [created] = await db.insert(cmsFormSubmissions).values(submission).returning();
    return created;
  }

  async updateCmsFormSubmissionStatus(id: number, status: string, notes?: string): Promise<CmsFormSubmission | undefined> {
    const [updated] = await db.update(cmsFormSubmissions)
      .set({ status, notes })
      .where(eq(cmsFormSubmissions.id, id))
      .returning();
    return updated;
  }

  async markCmsFormAutoReplySent(id: number): Promise<void> {
    await db.update(cmsFormSubmissions)
      .set({ autoReplyStatus: 'sent', autoReplySentAt: new Date() })
      .where(eq(cmsFormSubmissions.id, id));
  }

  // CMS Seed - Create default pages with educational content and hero images
  async seedDefaultCmsPages(): Promise<void> {
    const existingPages = await this.getCmsPages();
    if (existingPages.length > 0) return;

    // Default hero images from bundled assets (served from /assets/cms/)
    const heroImages = {
      about: '/assets/cms/hero-about.webp',
      faq: '/assets/cms/hero-faq.webp',
      contact: '/assets/cms/hero-contact.webp',
      privacy: '/assets/cms/hero-privacy.webp',
      terms: '/assets/cms/hero-terms.webp',
      refund: '/assets/cms/hero-refund.webp',
    };

    const defaultPages: InsertCmsPage[] = [
      {
        title: 'About Us',
        slug: 'about',
        pageType: 'content',
        status: 'published',
        metaTitle: 'About Samikaran Olympiad - Empowering Students Worldwide | Academic Excellence',
        metaDescription: 'Samikaran Olympiad is India\'s leading AI-powered academic competition platform. Join 500,000+ students from 50+ countries in fair, transparent olympiad examinations.',
        metaKeywords: 'olympiad, academic competition, online exam, student assessment, AI proctoring, education platform, math olympiad, science olympiad',
        heroTitle: 'About Samikaran Olympiad',
        heroSubtitle: 'Empowering 500,000+ Students Across 50+ Countries',
        heroImageUrl: heroImages.about,
        showInFooter: true,
        footerOrder: 1,
        footerColumn: 'company',
      },
      {
        title: 'Frequently Asked Questions',
        slug: 'faq',
        pageType: 'faq',
        status: 'published',
        metaTitle: 'FAQs - Samikaran Olympiad | Registration, Exam Pattern & Results',
        metaDescription: 'Get answers to frequently asked questions about Samikaran Olympiad registration, exam pattern, eligibility, sample papers, results, and certificates.',
        metaKeywords: 'olympiad faq, exam registration help, olympiad eligibility, sample papers, olympiad results, certificate download',
        heroTitle: 'Frequently Asked Questions',
        heroSubtitle: 'Your Complete Guide to Samikaran Olympiad',
        heroImageUrl: heroImages.faq,
        showInFooter: true,
        footerOrder: 1,
        footerColumn: 'resources',
      },
      {
        title: 'Contact Us',
        slug: 'contact',
        pageType: 'contact',
        status: 'published',
        metaTitle: 'Contact Samikaran Olympiad - Support & Partnerships',
        metaDescription: 'Reach out to Samikaran Olympiad team for exam support, school partnerships, technical assistance, or general inquiries. We respond within 24 hours.',
        metaKeywords: 'contact olympiad, olympiad support, school partnership, student helpline, exam assistance',
        heroTitle: 'Get in Touch',
        heroSubtitle: 'We\'re Here to Support Your Academic Journey',
        heroImageUrl: heroImages.contact,
        showInFooter: true,
        footerOrder: 2,
        footerColumn: 'company',
      },
      {
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        pageType: 'policy',
        status: 'published',
        metaTitle: 'Privacy Policy - Samikaran Olympiad | Data Protection & Security',
        metaDescription: 'Learn how Samikaran Olympiad protects your personal information. Our privacy policy covers data collection, usage, storage, and your rights.',
        metaKeywords: 'privacy policy, data protection, student data security, GDPR compliance, information security',
        heroTitle: 'Privacy Policy',
        heroSubtitle: 'Your Data Security is Our Priority',
        heroImageUrl: heroImages.privacy,
        showInFooter: true,
        footerOrder: 1,
        footerColumn: 'legal',
      },
      {
        title: 'Terms & Conditions',
        slug: 'terms',
        pageType: 'policy',
        status: 'published',
        metaTitle: 'Terms & Conditions - Samikaran Olympiad | Usage Guidelines',
        metaDescription: 'Review the terms and conditions for using Samikaran Olympiad platform. Includes exam rules, user responsibilities, and platform usage guidelines.',
        metaKeywords: 'terms of service, exam rules, user agreement, platform guidelines, olympiad regulations',
        heroTitle: 'Terms & Conditions',
        heroSubtitle: 'Fair Play & Transparency in Every Examination',
        heroImageUrl: heroImages.terms,
        showInFooter: true,
        footerOrder: 2,
        footerColumn: 'legal',
      },
      {
        title: 'Refund Policy',
        slug: 'refund-policy',
        pageType: 'policy',
        status: 'published',
        metaTitle: 'Refund Policy - Samikaran Olympiad | Cancellation & Refunds',
        metaDescription: 'Understand Samikaran Olympiad\'s fair refund and cancellation policy. Learn about eligibility, process, and timelines for exam fee refunds.',
        metaKeywords: 'refund policy, exam cancellation, fee refund, money back, registration cancellation',
        heroTitle: 'Refund Policy',
        heroSubtitle: 'Fair, Transparent & Student-Friendly Refunds',
        heroImageUrl: heroImages.refund,
        showInFooter: true,
        footerOrder: 3,
        footerColumn: 'legal',
      },
    ];

    for (const page of defaultPages) {
      const createdPage = await this.createCmsPage(page);
      
      // Add default content sections based on page type
      if (page.pageType === 'content' && page.slug === 'about') {
        await this.createCmsPageSection({
          pageId: createdPage.id,
          sectionType: 'rich_text',
          title: 'Our Vision',
          content: { html: '<p>At Samikaran Olympiad, we envision a world where every student has access to fair, transparent, and AI-powered academic assessments. Our platform bridges geographical barriers, enabling students from around the globe to showcase their intellectual capabilities.</p>' },
          displayOrder: 1,
        });
        await this.createCmsPageSection({
          pageId: createdPage.id,
          sectionType: 'rich_text',
          title: 'Our Mission',
          content: { html: '<p>To democratize quality education assessment through cutting-edge technology. We leverage artificial intelligence to create unbiased, adaptive examinations that truly measure student potential, regardless of their background or location.</p>' },
          displayOrder: 2,
        });
        await this.createCmsPageSection({
          pageId: createdPage.id,
          sectionType: 'card_grid',
          title: 'Our Values',
          content: { 
            cards: [
              { title: 'Excellence', description: 'We strive for the highest standards in every examination we create.' },
              { title: 'Integrity', description: 'Fair assessment and transparent processes are our foundation.' },
              { title: 'Innovation', description: 'We embrace AI and technology to revolutionize education.' },
              { title: 'Global Reach', description: 'Education knows no borders - neither do we.' },
            ]
          },
          displayOrder: 3,
        });
      } else if (page.pageType === 'faq') {
        await this.createCmsPageSection({
          pageId: createdPage.id,
          sectionType: 'faq',
          title: 'Registration & Eligibility',
          content: {
            items: [
              { question: 'Who can participate in Samikaran Olympiad?', answer: 'Students from grades 1-12 from any country can participate in our olympiad examinations.' },
              { question: 'How do I register for an olympiad?', answer: 'Create an account on our platform, select your grade level and subjects, complete the registration form, and pay the examination fee.' },
              { question: 'What documents are required for registration?', answer: 'You need a valid school ID or enrollment proof, a recent photograph, and parent/guardian consent for students under 18.' },
            ]
          },
          displayOrder: 1,
        });
        await this.createCmsPageSection({
          pageId: createdPage.id,
          sectionType: 'faq',
          title: 'Exam Pattern & Preparation',
          content: {
            items: [
              { question: 'What is the exam format?', answer: 'Our exams are multiple-choice questions (MCQ) conducted online with AI-powered proctoring.' },
              { question: 'How long is each examination?', answer: 'Exam duration varies by subject and grade level, typically ranging from 60-90 minutes.' },
              { question: 'Are there sample papers available?', answer: 'Yes, registered students have access to sample papers and practice tests.' },
            ]
          },
          displayOrder: 2,
        });
      } else if (page.pageType === 'contact') {
        await this.createCmsPageSection({
          pageId: createdPage.id,
          sectionType: 'contact_form',
          title: 'Get in Touch',
          content: { 
            formType: 'contact',
            fields: ['name', 'email', 'phone', 'subject', 'message']
          },
          displayOrder: 1,
        });
      } else if (page.pageType === 'policy') {
        let policyContent = '';
        if (page.slug === 'privacy-policy') {
          policyContent = '<h2>Information We Collect</h2><p>We collect information you provide directly, such as your name, email address, and academic details when you register. We also collect exam performance data and technical information for platform improvement.</p><h2>How We Use Your Information</h2><p>Your information is used to provide examination services, send important updates, improve our platform, and ensure exam integrity through proctoring.</p><h2>Data Protection</h2><p>We implement industry-standard security measures to protect your personal information. Your data is encrypted and stored securely.</p><p><strong>Last Updated:</strong> January 2025</p>';
        } else if (page.slug === 'terms') {
          policyContent = '<h2>Acceptance of Terms</h2><p>By accessing and using Samikaran Olympiad, you agree to be bound by these Terms and Conditions.</p><h2>User Responsibilities</h2><p>Users must maintain the confidentiality of their account, follow exam rules, and not engage in any form of cheating or malpractice.</p><h2>Exam Conduct</h2><p>All examinations are proctored. Any violation of exam rules may result in disqualification and account suspension.</p><p><strong>Last Updated:</strong> January 2025</p>';
        } else if (page.slug === 'refund-policy') {
          policyContent = '<h2>Refund Eligibility</h2><p>Refunds are available for registrations cancelled at least 7 days before the examination date. No refunds are issued after the exam has been attempted.</p><h2>Refund Process</h2><p>Submit a refund request through your dashboard or contact our support team. Approved refunds are processed within 7-10 business days.</p><h2>Exceptions</h2><p>Full refunds may be provided if an exam is cancelled by Samikaran Olympiad or for documented medical emergencies.</p><p><strong>Last Updated:</strong> January 2025</p>';
        }
        await this.createCmsPageSection({
          pageId: createdPage.id,
          sectionType: 'rich_text',
          title: page.title,
          content: { html: policyContent },
          displayOrder: 1,
        });
      }
    }
  }

  // ============================
  // OLYMPIAD CATEGORIES
  // ============================

  async getOlympiadCategories(): Promise<OlympiadCategory[]> {
    return await db.select().from(olympiadCategories).orderBy(olympiadCategories.displayOrder);
  }

  async getActiveOlympiadCategories(): Promise<OlympiadCategory[]> {
    return await db.select().from(olympiadCategories)
      .where(eq(olympiadCategories.isActive, true))
      .orderBy(olympiadCategories.displayOrder);
  }

  async getOlympiadCategory(id: number): Promise<OlympiadCategory | undefined> {
    const [category] = await db.select().from(olympiadCategories).where(eq(olympiadCategories.id, id));
    return category;
  }

  async getOlympiadCategoryBySlug(slug: string): Promise<OlympiadCategory | undefined> {
    const [category] = await db.select().from(olympiadCategories).where(eq(olympiadCategories.slug, slug));
    return category;
  }

  async createOlympiadCategory(category: InsertOlympiadCategory): Promise<OlympiadCategory> {
    const [newCategory] = await db.insert(olympiadCategories).values(category).returning();
    return newCategory;
  }

  async updateOlympiadCategory(id: number, updates: Partial<InsertOlympiadCategory>): Promise<OlympiadCategory | undefined> {
    const [updated] = await db.update(olympiadCategories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(olympiadCategories.id, id))
      .returning();
    return updated;
  }

  async deleteOlympiadCategory(id: number): Promise<void> {
    await db.delete(olympiadCategories).where(eq(olympiadCategories.id, id));
  }

  async getAllOlympiadCategories(): Promise<OlympiadCategory[]> {
    return await db.select().from(olympiadCategories).orderBy(asc(olympiadCategories.displayOrder));
  }

  // ============================
  // OLYMPIAD PAGE CONTENT
  // ============================

  async getOlympiadPageContentByCategoryId(categoryId: number): Promise<OlympiadPageContent | undefined> {
    const [content] = await db.select().from(olympiadPageContent).where(eq(olympiadPageContent.categoryId, categoryId));
    return content;
  }

  async createOlympiadPageContent(content: InsertOlympiadPageContent): Promise<OlympiadPageContent> {
    const [newContent] = await db.insert(olympiadPageContent).values(content).returning();
    return newContent;
  }

  async updateOlympiadPageContent(id: number, updates: Partial<InsertOlympiadPageContent>): Promise<OlympiadPageContent | undefined> {
    const [updated] = await db.update(olympiadPageContent)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(olympiadPageContent.id, id))
      .returning();
    return updated;
  }

  // ============================
  // EXTENDED EXAM/OLYMPIAD OPERATIONS
  // ============================

  async getExamsByCategory(categoryId: number): Promise<Exam[]> {
    return await db.select().from(exams)
      .where(eq(exams.categoryId, categoryId))
      .orderBy(desc(exams.createdAt));
  }

  async getVisibleExams(): Promise<Exam[]> {
    return await db.select().from(exams)
      .where(eq(exams.isVisible, true))
      .orderBy(desc(exams.createdAt));
  }

  async updateExamVisibility(id: number, isVisible: boolean): Promise<Exam | undefined> {
    const [updated] = await db.update(exams)
      .set({ isVisible, updatedAt: new Date() })
      .where(eq(exams.id, id))
      .returning();
    return updated;
  }

  async updateExamStatus(id: number, status: string): Promise<Exam | undefined> {
    const [updated] = await db.update(exams)
      .set({ status, updatedAt: new Date() })
      .where(eq(exams.id, id))
      .returning();
    return updated;
  }

  async getExamWithCategory(id: number): Promise<(Exam & { category?: OlympiadCategory }) | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    if (!exam) return undefined;
    
    if (exam.categoryId) {
      const category = await this.getOlympiadCategory(exam.categoryId);
      return { ...exam, category };
    }
    return exam;
  }

  // ============================
  // ATTEMPT QUESTIONS (RANDOMIZATION)
  // ============================

  async createAttemptQuestions(attemptQs: InsertAttemptQuestion[]): Promise<AttemptQuestion[]> {
    if (attemptQs.length === 0) return [];
    return await db.insert(attemptQuestions).values(attemptQs).returning();
  }

  async getAttemptQuestions(attemptId: number): Promise<AttemptQuestion[]> {
    return await db.select().from(attemptQuestions)
      .where(eq(attemptQuestions.attemptId, attemptId))
      .orderBy(attemptQuestions.displayOrder);
  }

  // ============================
  // EXTENDED QUESTION OPERATIONS
  // ============================

  async getQuestionsByType(examId: number, type: string): Promise<Question[]> {
    return await db.select().from(questions)
      .where(and(eq(questions.examId, examId), eq(questions.type, type)))
      .orderBy(questions.displayOrder);
  }

  async updateQuestionOrder(id: number, order: number): Promise<Question | undefined> {
    const [updated] = await db.update(questions)
      .set({ displayOrder: order })
      .where(eq(questions.id, id))
      .returning();
    return updated;
  }

  async bulkCreateQuestions(questionsList: InsertQuestion[]): Promise<Question[]> {
    if (questionsList.length === 0) return [];
    return await db.insert(questions).values(questionsList).returning();
  }

  // ============================
  // BLOGGING SYSTEM
  // ============================

  // --- Blog Categories ---
  async getBlogCategories(): Promise<BlogCategory[]> {
    return await db.select().from(blogCategories).orderBy(blogCategories.displayOrder);
  }

  async getBlogCategory(id: number): Promise<BlogCategory | undefined> {
    const [category] = await db.select().from(blogCategories).where(eq(blogCategories.id, id));
    return category;
  }

  async getBlogCategoryBySlug(slug: string): Promise<BlogCategory | undefined> {
    const [category] = await db.select().from(blogCategories).where(eq(blogCategories.slug, slug));
    return category;
  }

  async createBlogCategory(data: InsertBlogCategory): Promise<BlogCategory> {
    const [category] = await db.insert(blogCategories).values(data).returning();
    return category;
  }

  async updateBlogCategory(id: number, data: Partial<InsertBlogCategory>): Promise<BlogCategory | undefined> {
    const [updated] = await db.update(blogCategories)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(blogCategories.id, id))
      .returning();
    return updated;
  }

  async deleteBlogCategory(id: number): Promise<void> {
    await db.delete(blogCategories).where(eq(blogCategories.id, id));
  }

  // --- Blog Tags ---
  async getBlogTags(): Promise<BlogTag[]> {
    return await db.select().from(blogTags).orderBy(blogTags.name);
  }

  async getBlogTag(id: number): Promise<BlogTag | undefined> {
    const [tag] = await db.select().from(blogTags).where(eq(blogTags.id, id));
    return tag;
  }

  async createBlogTag(data: InsertBlogTag): Promise<BlogTag> {
    const [tag] = await db.insert(blogTags).values(data).returning();
    return tag;
  }

  async updateBlogTag(id: number, data: Partial<InsertBlogTag>): Promise<BlogTag | undefined> {
    const [updated] = await db.update(blogTags)
      .set(data)
      .where(eq(blogTags.id, id))
      .returning();
    return updated;
  }

  async deleteBlogTag(id: number): Promise<void> {
    await db.delete(blogPostTags).where(eq(blogPostTags.tagId, id));
    await db.delete(blogTags).where(eq(blogTags.id, id));
  }

  // --- Blog Posts ---
  async getBlogPosts(status?: string, categoryId?: number): Promise<BlogPost[]> {
    let query = db.select().from(blogPosts);
    
    if (status && categoryId) {
      return await db.select().from(blogPosts)
        .where(and(eq(blogPosts.status, status), eq(blogPosts.categoryId, categoryId)))
        .orderBy(desc(blogPosts.createdAt));
    } else if (status) {
      return await db.select().from(blogPosts)
        .where(eq(blogPosts.status, status))
        .orderBy(desc(blogPosts.createdAt));
    } else if (categoryId) {
      return await db.select().from(blogPosts)
        .where(eq(blogPosts.categoryId, categoryId))
        .orderBy(desc(blogPosts.createdAt));
    }
    
    return await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  }

  async getPublishedBlogPosts(limit?: number, categorySlug?: string): Promise<BlogPost[]> {
    let query = db.select().from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt));
    
    if (limit) {
      return await db.select().from(blogPosts)
        .where(eq(blogPosts.status, "published"))
        .orderBy(desc(blogPosts.publishedAt))
        .limit(limit);
    }
    
    return await db.select().from(blogPosts)
      .where(eq(blogPosts.status, "published"))
      .orderBy(desc(blogPosts.publishedAt));
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return post;
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return post;
  }

  async createBlogPost(data: InsertBlogPost): Promise<BlogPost> {
    const [post] = await db.insert(blogPosts).values(data).returning();
    return post;
  }

  async updateBlogPost(id: number, data: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const [updated] = await db.update(blogPosts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updated;
  }

  async publishBlogPost(id: number): Promise<BlogPost | undefined> {
    const [updated] = await db.update(blogPosts)
      .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updated;
  }

  async unpublishBlogPost(id: number): Promise<BlogPost | undefined> {
    const [updated] = await db.update(blogPosts)
      .set({ status: "draft", updatedAt: new Date() })
      .where(eq(blogPosts.id, id))
      .returning();
    return updated;
  }

  async deleteBlogPost(id: number): Promise<void> {
    await db.delete(blogPostTags).where(eq(blogPostTags.postId, id));
    await db.delete(blogPosts).where(eq(blogPosts.id, id));
  }

  async incrementBlogPostViews(id: number): Promise<void> {
    const post = await this.getBlogPost(id);
    if (post) {
      await db.update(blogPosts)
        .set({ viewCount: (post.viewCount || 0) + 1 })
        .where(eq(blogPosts.id, id));
    }
  }

  // --- Blog Post Tags ---
  async getBlogPostTags(postId: number): Promise<BlogTag[]> {
    const postTags = await db.select().from(blogPostTags).where(eq(blogPostTags.postId, postId));
    const tagIds = postTags.map(pt => pt.tagId);
    if (tagIds.length === 0) return [];
    return await db.select().from(blogTags).where(inArray(blogTags.id, tagIds));
  }

  async setBlogPostTags(postId: number, tagIds: number[]): Promise<void> {
    await db.delete(blogPostTags).where(eq(blogPostTags.postId, postId));
    if (tagIds.length > 0) {
      await db.insert(blogPostTags).values(tagIds.map(tagId => ({ postId, tagId })));
    }
  }

  // --- Media Library ---
  async getMediaItems(folder?: string): Promise<MediaItem[]> {
    if (folder) {
      return await db.select().from(mediaLibrary)
        .where(eq(mediaLibrary.folder, folder))
        .orderBy(desc(mediaLibrary.createdAt));
    }
    return await db.select().from(mediaLibrary).orderBy(desc(mediaLibrary.createdAt));
  }

  async getMediaItem(id: number): Promise<MediaItem | undefined> {
    const [item] = await db.select().from(mediaLibrary).where(eq(mediaLibrary.id, id));
    return item;
  }

  async createMediaItem(data: InsertMediaItem): Promise<MediaItem> {
    const [item] = await db.insert(mediaLibrary).values(data).returning();
    return item;
  }

  async updateMediaItem(id: number, data: Partial<InsertMediaItem>): Promise<MediaItem | undefined> {
    const [updated] = await db.update(mediaLibrary)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(mediaLibrary.id, id))
      .returning();
    return updated;
  }

  async deleteMediaItem(id: number): Promise<void> {
    await db.delete(mediaLibrary).where(eq(mediaLibrary.id, id));
  }

  async getMediaFolders(): Promise<string[]> {
    const items = await db.select({ folder: mediaLibrary.folder }).from(mediaLibrary);
    const folderSet = new Set<string>();
    items.forEach(i => {
      if (i.folder) folderSet.add(i.folder);
    });
    return Array.from(folderSet);
  }

  // --- Payment Settings ---
  async getPaymentSettings(): Promise<PaymentSettings | undefined> {
    const [settings] = await db.select().from(paymentSettings).limit(1);
    return settings;
  }

  async upsertPaymentSettings(settings: Partial<InsertPaymentSettings>): Promise<PaymentSettings> {
    const existing = await this.getPaymentSettings();
    if (existing) {
      const [updated] = await db.update(paymentSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(paymentSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(paymentSettings)
        .values(settings as InsertPaymentSettings)
        .returning();
      return created;
    }
  }

  // --- Extended Payments ---
  async getPaymentById(id: number): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentByGatewayOrderId(gatewayOrderId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.gatewayOrderId, gatewayOrderId));
    return payment;
  }

  async updatePayment(id: number, updates: Partial<Payment>): Promise<Payment | undefined> {
    const [updated] = await db.update(payments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }

  async getAllPaymentsWithDetails(): Promise<(Payment & { student?: StudentRegistration; exam?: Exam })[]> {
    const allPayments = await db.select().from(payments).orderBy(desc(payments.createdAt));
    const results: (Payment & { student?: StudentRegistration; exam?: Exam })[] = [];
    
    for (const payment of allPayments) {
      let student: StudentRegistration | undefined;
      let exam: Exam | undefined;
      
      if (payment.studentId) {
        const [s] = await db.select().from(studentRegistrations).where(eq(studentRegistrations.id, payment.studentId));
        student = s;
      }
      
      if (payment.examId) {
        const [e] = await db.select().from(exams).where(eq(exams.id, payment.examId));
        exam = e;
      }
      
      results.push({ ...payment, student, exam });
    }
    
    return results;
  }

  async getPaymentsByFilter(filters: { status?: string; gateway?: string; country?: string; environment?: string }): Promise<Payment[]> {
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(payments.status, filters.status));
    }
    if (filters.gateway) {
      conditions.push(eq(payments.gateway, filters.gateway));
    }
    if (filters.country) {
      conditions.push(eq(payments.country, filters.country));
    }
    if (filters.environment) {
      conditions.push(eq(payments.environment, filters.environment));
    }
    
    if (conditions.length === 0) {
      return await db.select().from(payments).orderBy(desc(payments.createdAt));
    }
    
    return await db.select().from(payments)
      .where(and(...conditions))
      .orderBy(desc(payments.createdAt));
  }

  // --- Processed Webhooks (for idempotency) ---
  async isWebhookProcessed(eventId: string): Promise<boolean> {
    const [existing] = await db.select().from(processedWebhooks).where(eq(processedWebhooks.eventId, eventId));
    return !!existing;
  }

  async markWebhookProcessed(gateway: string, eventId: string, eventType: string, paymentId?: number): Promise<ProcessedWebhook> {
    const [webhook] = await db.insert(processedWebhooks)
      .values({ gateway, eventId, eventType, paymentId })
      .returning();
    return webhook;
  }

  // --- Invoice Counter ---
  async getNextInvoiceNumber(prefix: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    
    const [existing] = await db.select().from(invoiceCounter)
      .where(and(eq(invoiceCounter.prefix, prefix), eq(invoiceCounter.year, currentYear)));
    
    let nextNumber: number;
    
    if (existing) {
      nextNumber = existing.lastNumber + 1;
      await db.update(invoiceCounter)
        .set({ lastNumber: nextNumber, updatedAt: new Date() })
        .where(eq(invoiceCounter.id, existing.id));
    } else {
      const settings = await this.getPaymentSettings();
      const startNumber = settings?.invoiceStartNumber || 1000;
      nextNumber = startNumber;
      await db.insert(invoiceCounter)
        .values({ prefix, year: currentYear, lastNumber: nextNumber });
    }
    
    return `${prefix}-${currentYear}-${String(nextNumber).padStart(6, '0')}`;
  }

  // --- Exam Registration Payment Status ---
  async getExamRegistrationByPaymentId(paymentId: number): Promise<ExamRegistration | undefined> {
    const [registration] = await db.select().from(examRegistrations)
      .where(eq(examRegistrations.paymentId, paymentId));
    return registration;
  }

  async updateExamRegistrationPaymentStatus(id: number, paymentStatus: string): Promise<ExamRegistration | undefined> {
    const [updated] = await db.update(examRegistrations)
      .set({ paymentStatus })
      .where(eq(examRegistrations.id, id))
      .returning();
    return updated;
  }

  async updateExamRegistration(id: number, updates: Partial<ExamRegistration>): Promise<ExamRegistration | undefined> {
    const [updated] = await db.update(examRegistrations)
      .set(updates)
      .where(eq(examRegistrations.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
