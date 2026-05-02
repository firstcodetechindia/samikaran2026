import { z } from 'zod';
import { insertExamSchema, insertQuestionSchema, insertAttemptSchema, insertAnswerSchema, insertStudentRegistrationSchema, insertSupervisorRegistrationSchema, insertSchoolCollaborationSchema, insertCoordinatorSchema, insertAnnouncementSchema, insertManagedStudentSchema, insertPaymentSchema, insertCertificateSchema, insertCalendarEventSchema, insertExamRegistrationSchema, exams, questions, attempts, answers, studentRegistrations, supervisorRegistrations, schoolCollaborations, coordinators, announcements, managedStudents, payments, certificates, calendarEvents, examRegistrations } from '@workspace/db';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  exams: {
    list: {
      method: 'GET' as const,
      path: '/api/exams',
      responses: {
        200: z.array(z.custom<typeof exams.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/exams',
      input: insertExamSchema,
      responses: {
        201: z.custom<typeof exams.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/exams/:id',
      responses: {
        200: z.custom<typeof exams.$inferSelect & { questions?: (typeof questions.$inferSelect)[] }>(),
        404: errorSchemas.notFound,
      },
    },
    getQuestions: {
      method: 'GET' as const,
      path: '/api/exams/:id/questions',
      responses: {
        200: z.array(z.custom<typeof questions.$inferSelect>()),
        404: errorSchemas.notFound,
      },
    }
  },
  questions: {
    create: {
      method: 'POST' as const,
      path: '/api/questions',
      input: insertQuestionSchema,
      responses: {
        201: z.custom<typeof questions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/questions/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      }
    }
  },
  attempts: {
    start: {
      method: 'POST' as const,
      path: '/api/attempts/start',
      input: z.object({ examId: z.number() }),
      responses: {
        201: z.custom<typeof attempts.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    submitAnswer: {
      method: 'POST' as const,
      path: '/api/attempts/:id/answer',
      input: z.object({ 
        questionId: z.number(), 
        selectedOption: z.string().optional(),
        // Voice answer fields
        audioUrl: z.string().optional(),
        transcript: z.string().optional(),
        isVoiceAnswer: z.boolean().optional(),
      }),
      responses: {
        200: z.custom<typeof answers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    finish: {
      method: 'POST' as const,
      path: '/api/attempts/:id/finish',
      responses: {
        200: z.custom<typeof attempts.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    list: {
        method: 'GET' as const,
        path: '/api/attempts',
        responses: {
            200: z.array(z.custom<typeof attempts.$inferSelect & { exam: typeof exams.$inferSelect }>()),
        }
    }
  },
  ai: {
    generateQuestions: {
      method: 'POST' as const,
      path: '/api/ai/generate-questions',
      input: z.object({
        topic: z.string(),
        count: z.number().default(5),
        difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
        examId: z.number()
      }),
      responses: {
        200: z.object({ count: z.number() }),
        500: errorSchemas.internal
      }
    }
  },
  otp: {
    send: {
      method: 'POST' as const,
      path: '/api/otp/send',
      input: z.object({
        contact: z.string().min(1, "Email or phone is required"),
        type: z.enum(["email", "phone"]).default("email")
      }),
      responses: {
        200: z.object({ message: z.string(), expiresIn: z.number() }),
        400: errorSchemas.validation,
        429: z.object({ message: z.string() })
      }
    },
    verify: {
      method: 'POST' as const,
      path: '/api/otp/verify',
      input: z.object({
        contact: z.string(),
        code: z.string().length(6, "OTP must be 6 digits")
      }),
      responses: {
        200: z.object({ verified: z.boolean(), token: z.string().optional() }),
        400: errorSchemas.validation
      }
    }
  },
  registration: {
    student: {
      method: 'POST' as const,
      path: '/api/registration/student',
      input: insertStudentRegistrationSchema,
      responses: {
        201: z.custom<typeof studentRegistrations.$inferSelect>(),
        400: errorSchemas.validation
      }
    },
    supervisor: {
      method: 'POST' as const,
      path: '/api/registration/supervisor',
      input: insertSupervisorRegistrationSchema,
      responses: {
        201: z.custom<typeof supervisorRegistrations.$inferSelect>(),
        400: errorSchemas.validation
      }
    },
    school: {
      method: 'POST' as const,
      path: '/api/registration/school',
      input: insertSchoolCollaborationSchema,
      responses: {
        201: z.custom<typeof schoolCollaborations.$inferSelect>(),
        400: errorSchemas.validation
      }
    },
    coordinator: {
      method: 'POST' as const,
      path: '/api/registration/coordinator',
      input: insertCoordinatorSchema,
      responses: {
        201: z.custom<typeof coordinators.$inferSelect>(),
        400: errorSchemas.validation
      }
    }
  },
  announcements: {
    list: {
      method: 'GET' as const,
      path: '/api/announcements',
      responses: {
        200: z.array(z.custom<typeof announcements.$inferSelect>())
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/announcements',
      input: insertAnnouncementSchema,
      responses: {
        201: z.custom<typeof announcements.$inferSelect>(),
        400: errorSchemas.validation
      }
    }
  },
  managedStudents: {
    list: {
      method: 'GET' as const,
      path: '/api/managed-students',
      responses: {
        200: z.array(z.custom<typeof managedStudents.$inferSelect & { student: typeof studentRegistrations.$inferSelect }>())
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/managed-students',
      input: insertManagedStudentSchema,
      responses: {
        201: z.custom<typeof managedStudents.$inferSelect>(),
        400: errorSchemas.validation
      }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/managed-students/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound
      }
    }
  },
  payments: {
    list: {
      method: 'GET' as const,
      path: '/api/payments',
      responses: {
        200: z.array(z.custom<typeof payments.$inferSelect>())
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/payments',
      input: insertPaymentSchema,
      responses: {
        201: z.custom<typeof payments.$inferSelect>(),
        400: errorSchemas.validation
      }
    }
  },
  certificates: {
    list: {
      method: 'GET' as const,
      path: '/api/certificates',
      responses: {
        200: z.array(z.custom<typeof certificates.$inferSelect & { exam?: typeof exams.$inferSelect }>())
      }
    },
    listByManager: {
      method: 'GET' as const,
      path: '/api/certificates/managed',
      responses: {
        200: z.array(z.custom<typeof certificates.$inferSelect & { student: typeof studentRegistrations.$inferSelect; exam?: typeof exams.$inferSelect }>())
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/certificates',
      input: insertCertificateSchema,
      responses: {
        201: z.custom<typeof certificates.$inferSelect>(),
        400: errorSchemas.validation
      }
    }
  },
  calendarEvents: {
    list: {
      method: 'GET' as const,
      path: '/api/calendar-events',
      responses: {
        200: z.array(z.custom<typeof calendarEvents.$inferSelect>())
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/calendar-events',
      input: insertCalendarEventSchema,
      responses: {
        201: z.custom<typeof calendarEvents.$inferSelect>(),
        400: errorSchemas.validation
      }
    }
  },
  examRegistrations: {
    list: {
      method: 'GET' as const,
      path: '/api/exam-registrations',
      responses: {
        200: z.array(z.custom<typeof examRegistrations.$inferSelect & { exam: typeof exams.$inferSelect }>())
      }
    },
    create: {
      method: 'POST' as const,
      path: '/api/exam-registrations',
      input: insertExamRegistrationSchema,
      responses: {
        201: z.custom<typeof examRegistrations.$inferSelect>(),
        400: errorSchemas.validation
      }
    }
  },
  students: {
    list: {
      method: 'GET' as const,
      path: '/api/students',
      responses: {
        200: z.array(z.custom<typeof studentRegistrations.$inferSelect>())
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/students/:id',
      responses: {
        200: z.custom<typeof studentRegistrations.$inferSelect>(),
        404: errorSchemas.notFound
      }
    }
  },
  coordinators: {
    listBySchool: {
      method: 'GET' as const,
      path: '/api/coordinators',
      responses: {
        200: z.array(z.custom<typeof coordinators.$inferSelect>())
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
