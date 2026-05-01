# Samikaran Olympiad — School Olympiad Platform

## Overview
Samikaran is an AI-powered online olympiad SaaS focused exclusively on **School Olympiads for Class 1–12** (Math, Science, English, Reasoning, Computer Science, GK & more). It provides secure AI-proctored examinations, AI-generated questions, real-time analytics, and multi-tenant capabilities for schools, students, parents, and supervisors. Production site: www.samikaranolympiad.com.

## User Preferences
Preferred communication style: Simple, everyday language.

### Form Validation Requirements
- All mandatory fields (text inputs, radio buttons, checkboxes, file uploads, dropdowns) must shake when validation fails.
- Use `animate-shake` class for the shake effect.
- Combine with `border-destructive` for red border highlighting.
- For checkboxes: add `bg-destructive/5` background when invalid.
- All OTPs are real — generated randomly and sent via Brevo email + MSG91 SMS. No hardcoded/default OTPs.

### Branding
- Always use "Samikaran Olympiad" (not just "Samikaran").
- Logo format: "SAMIKARAN." above "Olympiad" below.
- Brand colors: Purple-to-pink gradient (#8A2BE2 to #FF2FBF).

### Placeholder Data
- Use Indian names for placeholder/demo data (e.g., "Ananya Singh" instead of "John Doe").
- Use Indian-style example emails (e.g., "ananya@example.com" instead of "john@example.com").
- Avoid Western placeholder names like John, Jane, etc.
- **No hardcoded mock data in dashboards**: All dashboard data (students, announcements, results, certificates, payments, analytics, testimonials, certificate signatories, contact info, partner stats) must come from database/API. Use loading skeletons and empty states instead of fake data.
- **Public settings API**: `GET /api/public/settings` serves configurable values (contact_phone, support_email, certificate signatories, testimonials, partner_stats) from `site_settings` table.

### Alert Message Styling
Use consistent CSS classes for all alert messages:
- Error messages: `alert-error` class (red background, white text).
- Success messages: `alert-success` class (green background, white text).
- Warning messages: `alert-warning` class (yellow background, dark text).

### Premium Glassmorphism Design System
The platform uses a world-class premium glassmorphism UI design for all dashboards (Student, School, Partner, Group).
- **Glass Components**: `GlassCard`, `StatCard`, `ProgressRing`, `SkeletonCard`, `DashboardHeader`, `SectionHeader`, `EmptyState`.
- **CSS Utilities**: `.glass-panel`, `.glass-stat-card`, `.icon-gradient-*`, `.dashboard-mesh`, `.skeleton-pulse`, `glow-*`.
- **Premium Animations**: `animate-fade-in`, `animate-slide-up`, `animate-scale-in` for entry; `animate-float`, `animate-pulse-glow` for looping; `stagger-1` through `stagger-6` for delays. Reduced motion support via `prefers-reduced-motion`.
- **Premium Button Style Pattern**: `className="bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md"`. Do not add custom hover states.

### Modal/Popup Scroll Requirement
All modals and popups must have scroll by default, handled centrally by the dialog system.
- `DialogContent`: `max-h-[90vh] flex flex-col overflow-hidden`.
- `DialogHeader`: `flex-shrink-0`.
- `DialogBody`: Use for scrollable content (`flex-1 overflow-y-auto`).
- `DialogFooter`: `flex-shrink-0`.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with shadcn/ui
- **Animations**: Framer Motion
- **Build Tool**: Vite

### Backend
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful endpoints with Zod validation
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth via OpenID Connect with Passport.js
- **Session Storage**: PostgreSQL-backed sessions

### Dual-Track Platform (Key Architecture)
- **examCategories** table: stores exam category slugs (upsc, ssc, banking, railway, state_psc, defense)
- **competitiveExams** table: stores individual competitive exams linked to a category
- **studentRegistrations.userType**: `STUDENT` (default) or `ASPIRANT`
- **studentRegistrations aspirant fields**: `educationLevel`, `targetExamCategory`, `preparationStage`
- **Public API**: `GET /api/public/exam-categories`, `GET /api/public/competitive-exams?categorySlug=xxx`
- **Routes**: `/competitive-exams` (CompetitiveExams.tsx), `/upsc-exams` → `/competitive-exams?category=upsc` (redirect pattern)
- **Registration**: Role selector includes "Competitive Exam Aspirant" card; aspirant form collects education level, target exam, and preparation stage

### Core Features
- **User Management System**: Super Admin panel for Students, Supervisors, Schools, Coordinators, Partners with comprehensive management tools.
- **Exam Management**: Creation, scheduling, and administration of online exams with AI question generation, including a Demo Exam system.
- **Student Exam Workflow**: Secure submission, automated scoring, AI-powered proctoring, and multi-language support.
- **Question & Olympiad Architecture**: Supports subject, grade, language, and various question types without negative marking.
- **Content Management System (CMS)**: Page builder, blogging system, and media library with SEO features.
- **Payment & Tax System**: Configurable gateways, automated GST calculation, and invoice generation.
- **Email System**: Real-time email sending via Brevo SMTP with pre-built branded templates and tracking.
- **AI Integration**: Centralized AI provider management for content generation, image generation, research, speech-to-text, face detection, and vision AI.
- **SEO & SEM**: Fully implemented for public pages; admin/dashboard pages are noindexed.
- **AI Chatbot Platform**: GPT-4o powered support with agent management, visual flow builder, knowledge base, and voice chat.
- **TARA Credit System**: Configurable credit distribution and manual credit management for students.
- **Student Performance Analytics**: Advanced analytics with AI insights and personalized suggestions.
- **Documentation & Guides**: PDF-ready presentations, versioning for changelogs, HTML user guides, and a portal guide.
- **Enterprise Support System**: AI-human handover and real-time WebSocket chat.
- **Secure Server Terminal**: Browser-based SSH terminal in Super Admin panel with OTP verification.
- **Certificate Templates System**: Customizable templates with live preview, QR codes, and watermarks.
- **System Audit & Self-Healing**: Health monitoring, API checks, scheduled audits, alerts, and auto-fix algorithms.
- **QA & Release Governance System**: Enterprise-grade QA management with test suites, defect tracking, and release management.
- **Student ID Authentication System**: Auto-generated Student IDs, login via Student ID, Email, or Phone.
- **Single-Session Login Enforcement**: Students can only log in on one device, with session validation and force logout.
- **Login As User Type Selection**: Login page adapts based on selected user type.
- **Route Persistence**: Saves last visited route and redirects authenticated users based on role.
- **Mobile App Experience (PWA)**: Mobile-first design with PWA features.
- **Multi-Tenant School Module**: School portal with academic structure (classes, subjects, chapters), student registration and management, and student linking. School Bridge API (`server/school-bridge-routes.ts`) auto-provisions `schools` record from `school_collaborations` login. Schools manage students only — all exams are Olympiad exams created by Super Admin. School dashboard tabs: Overview, Announcements, Coordinators, Students, Bulk Upload, Olympiad Calendar, Billing, Profile.
- **Olympiad Exam System**: Super Admin creates and manages all Olympiad exams with AI question generation. Students take exams via SecureExam page with proctoring. School exam system (SchoolExamManager, QuestionBank, ExamResults, SchoolExamTake) was removed — only Olympiad exams remain.
- **Student Menu Simplification**: Arena (Class 6-12) and Adventure (Class 1-5) use simplified, tailored menu labels.
- **Little Champs / Elite Seniors Category System**: Platform-wide Junior (Class 1-5) and Senior (Class 6-12) classification.
- **Full Portal Theme System (Class-Based)**: Entire student portal themed based on class (Arena for 6-12, Adventure for 1-5) with distinct UI/UX, top status bars, and gamification hooks.
- **World-Class Olympiad Detail Pages**: Database-driven, subject-themed pages with animated SVG illustrations, dynamic content, and SEO features.

## External Dependencies

### Database
- PostgreSQL

### Authentication
- Replit Auth

### AI Services
- OpenAI API (via Replit AI Integrations)
- Google Gemini API (via `aiProviders` table)

### Support Chatbot Architecture
- OpenAI (Replit integration)
- Admin OpenAI (`aiProviders` table)
- Gemini (`aiProviders` table)
- Google Translate API (for TTS)

### Payment Gateways
- Razorpay
- Stripe

### SMS & WhatsApp Service
- MSG91

### Email Service Providers
- AWS SES
- SendGrid
- Mailgun

## School Student Registration
- **Backend**: `POST /api/school/my-school/students/register` creates a student account in `student_registrations` + links via `school_student_links` (transactional). Auto-generates student ID (e.g., DELH260001) and password. Returns credentials in response.
- **Backend**: `GET /api/school/my-school/students` lists all students linked to the school (joins student_registrations + school_classes).
- **Frontend**: `AddStudentForm` component in `SchoolDashboard.tsx` — Grade dropdown loads from school's own classes (`/api/school/my-school/classes`), section dynamically updates based on class selection. After registration, credentials card is shown with copy buttons.
- **Auth pattern**: Uses `x-user-id` (school_collaborations.id) + `x-user-type` headers.
- **Rate limiting**: 10 requests/min on student registration endpoint.

## Production Audit (Completed)
- Partner login uses bcrypt.compare (not plain text)
- Health endpoints (`/sysctrl/api/health/*`) require super admin auth
- Investor stats endpoint requires super admin auth, returns real DB data only
- Certificate verification returns real data or 404 (no demo fallback)
- No hardcoded revenue charts, exam counts, or promotional banners in dashboards
- All contact info (WhatsApp, chatbot phone) from site_settings/API, not hardcoded
- "Coming Soon" buttons disabled instead of showing toasts
- CREDENTIALS.txt removed, added to .gitignore
- Template preview uses non-personal placeholder data
- `/api/exam-registrations/manager` requires auth + ownership check

## Admin Panel Features (/sysctrl/console)

### New Tabs Added (Features 2–10)
- **Coupons & Discounts** (`coupons`): Full coupon management — create/edit/delete discount codes with percentage/flat/free-entry types, usage limits, expiry, and usage tracking. DB: `coupons` table.
- **WhatsApp** (`whatsapp`): WhatsApp campaign management — create campaigns, send bulk messages, manage opt-outs, view delivery stats. DB: `whatsapp_campaigns`, `whatsapp_messages`, `whatsapp_opt_outs`.
- **Leaderboards** (`leaderboards`): Exam-specific leaderboard view with rank, score, percentile, performance badges.
- **Certificates** (`certificates`): Certificate template designer — drag-and-drop layout builder, bulk PDF generation/download, exam-specific issuance. DB: `certificate_templates`.
- **Parents** (`parents`): Parent account management — link/unlink parent-student relationships, view parent profiles. DB: `parent_accounts`, `parent_student_links`.
- **Notifications** (`notifications`): Admin notification history and dispatch — view all sent notifications with type/priority filters. DB: `admin_notifications`.
- **Support Tickets** (`support`): Full support ticket system — view/assign/close tickets, thread replies, canned responses. DB: `support_tickets`, `ticket_messages`, `canned_responses`.
- **Reports** (`reports`): Advanced analytics — revenue, exam performance, registration trends, export-ready charts.
- **NotificationBell**: Real-time bell icon in dashboard header with unread count badge and dropdown.

### Super Admin Credentials
- Email: apps.ananyasoftware@gmail.com
- Password: Admin@1234
- OTP: 090313 (master OTP, always works)

## URL-Based Dashboard Tab Routing
All major dashboards now use URL-based tab routing instead of internal state only:
- **School**: `/school/:tab?` (e.g., `/school/students`, `/school/exams`, `/school/profile`)
- **Student**: `/dashboard/:tab?` or `/student-dashboard/:tab?` (e.g., `/dashboard/exams`, `/dashboard/results`)
- **Group**: `/group/:tab?` (e.g., `/group/students`, `/group/results`)
- **Partner**: `/partner/dashboard/:tab?` (e.g., `/partner/dashboard/earnings`, `/partner/dashboard/analytics`)
- Active sidebar item is highlighted with gradient styling (`from-violet-500 to-fuchsia-500`)
- Invalid tab segments auto-redirect to the default tab
- Browser back/forward navigation works correctly with tabs