
/**
 * Lightweight client-side route registry.
 *
 * This file intentionally has NO imports from @workspace/db, drizzle-orm, or zod.
 * It replaces the @shared/routes alias on the frontend to eliminate the ~553 KB
 * shared-routes bundle (which pulled in all drizzle table definitions + full Zod schemas).
 *
 * The `.parse()` stubs on each response entry are pass-through — they preserve
 * the call-sites in use-exams.ts / use-attempts.ts without runtime schema validation.
 * Validation happens on the server; skipping it client-side is safe for these admin hooks.
 */

const pass = <T>(data: unknown): T => data as T;
const resp = () => ({ parse: pass });

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  if (!params) return path;
  return Object.entries(params).reduce(
    (url, [key, value]) => url.replace(`:${key}`, String(value)),
    path
  );
}

export const api = {
  exams: {
    list: {
      method: "GET" as const,
      path: "/api/exams",
      responses: { 200: { parse: pass } },
    },
    create: {
      method: "POST" as const,
      path: "/api/exams",
      input: {} as any,
      responses: { 201: { parse: pass } },
    },
    get: {
      method: "GET" as const,
      path: "/api/exams/:id",
      responses: { 200: { parse: pass }, 404: { parse: pass } },
    },
    getQuestions: {
      method: "GET" as const,
      path: "/api/exams/:id/questions",
      responses: { 200: { parse: pass }, 404: { parse: pass } },
    },
  },
  questions: {
    create: {
      method: "POST" as const,
      path: "/api/questions",
      input: {} as any,
      responses: { 201: { parse: pass } },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/questions/:id",
      responses: { 200: { parse: pass } },
    },
  },
  attempts: {
    list: {
      method: "GET" as const,
      path: "/api/attempts",
      responses: { 200: { parse: pass } },
    },
    start: {
      method: "POST" as const,
      path: "/api/attempts/start",
      input: {} as any,
      responses: { 201: { parse: pass } },
    },
    submitAnswer: {
      method: "POST" as const,
      path: "/api/attempts/:id/answer",
      responses: { 200: { parse: pass } },
    },
    finish: {
      method: "POST" as const,
      path: "/api/attempts/:id/finish",
      responses: { 200: { parse: pass } },
    },
  },
  ai: {
    generateQuestions: {
      method: "POST" as const,
      path: "/api/ai/generate-questions",
      input: {} as any,
      responses: { 200: { parse: pass } },
    },
  },
  otp: {
    send: {
      method: "POST" as const,
      path: "/api/otp/send",
      responses: { 200: { parse: pass } },
    },
    verify: {
      method: "POST" as const,
      path: "/api/otp/verify",
      responses: { 200: { parse: pass } },
    },
  },
  registration: {
    student: {
      method: "POST" as const,
      path: "/api/registration/student",
      responses: { 201: { parse: pass } },
    },
    supervisor: {
      method: "POST" as const,
      path: "/api/registration/supervisor",
      responses: { 201: { parse: pass } },
    },
    school: {
      method: "POST" as const,
      path: "/api/registration/school",
      responses: { 201: { parse: pass } },
    },
    coordinator: {
      method: "POST" as const,
      path: "/api/registration/coordinator",
      responses: { 201: { parse: pass } },
    },
  },
  announcements: {
    list: {
      method: "GET" as const,
      path: "/api/announcements",
      responses: { 200: { parse: pass } },
    },
    create: {
      method: "POST" as const,
      path: "/api/announcements",
      responses: { 201: { parse: pass } },
    },
  },
  managedStudents: {
    list: {
      method: "GET" as const,
      path: "/api/managed-students",
      responses: { 200: { parse: pass } },
    },
    create: {
      method: "POST" as const,
      path: "/api/managed-students",
      responses: { 201: { parse: pass } },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/managed-students/:id",
      responses: { 200: { parse: pass } },
    },
  },
  payments: {
    list: {
      method: "GET" as const,
      path: "/api/payments",
      responses: { 200: { parse: pass } },
    },
    create: {
      method: "POST" as const,
      path: "/api/payments",
      responses: { 201: { parse: pass } },
    },
  },
  certificates: {
    list: {
      method: "GET" as const,
      path: "/api/certificates",
      responses: { 200: { parse: pass } },
    },
    listManaged: {
      method: "GET" as const,
      path: "/api/certificates/managed",
      responses: { 200: { parse: pass } },
    },
    create: {
      method: "POST" as const,
      path: "/api/certificates",
      responses: { 201: { parse: pass } },
    },
  },
  calendarEvents: {
    list: {
      method: "GET" as const,
      path: "/api/calendar-events",
      responses: { 200: { parse: pass } },
    },
    create: {
      method: "POST" as const,
      path: "/api/calendar-events",
      responses: { 201: { parse: pass } },
    },
  },
  examRegistrations: {
    list: {
      method: "GET" as const,
      path: "/api/exam-registrations",
      responses: { 200: { parse: pass } },
    },
    create: {
      method: "POST" as const,
      path: "/api/exam-registrations",
      responses: { 201: { parse: pass } },
    },
  },
  students: {
    list: {
      method: "GET" as const,
      path: "/api/students",
      responses: { 200: { parse: pass } },
    },
    get: {
      method: "GET" as const,
      path: "/api/students/:id",
      responses: { 200: { parse: pass }, 404: { parse: pass } },
    },
  },
  coordinators: {
    list: {
      method: "GET" as const,
      path: "/api/coordinators",
      responses: { 200: { parse: pass } },
    },
  },
} as const;
