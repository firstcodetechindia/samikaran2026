import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Announcement, ManagedStudent, Payment, Certificate, CalendarEvent, ExamRegistration, StudentRegistration, Exam } from "@shared/schema";

// Announcements hook
export function useAnnouncements(audience?: string) {
  return useQuery<Announcement[]>({
    queryKey: ['/api/announcements', audience],
    queryFn: async () => {
      const url = audience ? `/api/announcements?audience=${audience}` : '/api/announcements';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch announcements');
      return res.json();
    }
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Announcement, 'id' | 'createdAt'>) => {
      const res = await apiRequest('POST', '/api/announcements', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
    }
  });
}

// Managed Students hook
export function useManagedStudents(managerId: number, managerType: string) {
  return useQuery<(ManagedStudent & { student: StudentRegistration })[]>({
    queryKey: ['/api/managed-students', managerId, managerType],
    queryFn: async () => {
      const res = await fetch(`/api/managed-students?managerId=${managerId}&managerType=${managerType}`);
      if (!res.ok) throw new Error('Failed to fetch managed students');
      return res.json();
    },
    enabled: !!managerId && !!managerType
  });
}

export function useCreateManagedStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { studentId: number; managerId: number; managerType: string; relationship?: string }) => {
      const res = await apiRequest('POST', '/api/managed-students', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/managed-students'] });
    }
  });
}

export function useDeleteManagedStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/managed-students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/managed-students'] });
    }
  });
}

// Payments hook
export function usePayments(userId: number, userType: string) {
  return useQuery<Payment[]>({
    queryKey: ['/api/payments', userId, userType],
    queryFn: async () => {
      const res = await fetch(`/api/payments?userId=${userId}&userType=${userType}`);
      if (!res.ok) throw new Error('Failed to fetch payments');
      return res.json();
    },
    enabled: !!userId && !!userType
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Payment, 'id' | 'createdAt' | 'paidAt'>) => {
      const res = await apiRequest('POST', '/api/payments', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
    }
  });
}

// Certificates hook - fetches student's earned certificates
export interface StudentCertificate {
  id: number;
  type: string;
  rank: number | null;
  score: number | null;
  certificateUrl: string | null;
  issuedAt: string | null;
  downloadCount: number | null;
  examId: number | null;
  examTitle: string | null;
  examSubject: string | null;
  examStartTime: string | null;
}

export function useCertificates(studentId: number) {
  return useQuery<StudentCertificate[]>({
    queryKey: ['/api/certificates/student', studentId],
    queryFn: async () => {
      const res = await fetch(`/api/certificates/student/${studentId}`);
      if (!res.ok) throw new Error('Failed to fetch certificates');
      return res.json();
    },
    enabled: !!studentId
  });
}

export function useCertificatesByManager(managerId: number, managerType: string) {
  return useQuery<(Certificate & { student: StudentRegistration; exam?: Exam })[]>({
    queryKey: ['/api/certificates/managed', managerId, managerType],
    queryFn: async () => {
      const res = await fetch(`/api/certificates/managed?managerId=${managerId}&managerType=${managerType}`);
      if (!res.ok) throw new Error('Failed to fetch certificates');
      return res.json();
    },
    enabled: !!managerId && !!managerType
  });
}

// Calendar Events hook
export function useCalendarEvents(audience?: string) {
  return useQuery<CalendarEvent[]>({
    queryKey: ['/api/calendar-events', audience],
    queryFn: async () => {
      const url = audience ? `/api/calendar-events?audience=${audience}` : '/api/calendar-events';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch calendar events');
      return res.json();
    }
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
      const res = await apiRequest('POST', '/api/calendar-events', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar-events'] });
    }
  });
}

// Exam Registrations hook
export function useExamRegistrations(studentId: number) {
  return useQuery<(ExamRegistration & { exam: Exam })[]>({
    queryKey: ['/api/exam-registrations', studentId],
    queryFn: async () => {
      const res = await fetch(`/api/exam-registrations?studentId=${studentId}`);
      if (!res.ok) throw new Error('Failed to fetch exam registrations');
      return res.json();
    },
    enabled: !!studentId
  });
}

export function useCreateExamRegistration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { studentId: number; examId: number }) => {
      const res = await apiRequest('POST', '/api/exam-registrations', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/exam-registrations'] });
    }
  });
}

// All Students hook (for coordinators/schools)
export function useAllStudents() {
  return useQuery<StudentRegistration[]>({
    queryKey: ['/api/students'],
    queryFn: async () => {
      const res = await fetch('/api/students');
      if (!res.ok) throw new Error('Failed to fetch students');
      return res.json();
    }
  });
}

export function useStudent(id: number) {
  return useQuery<StudentRegistration>({
    queryKey: ['/api/students', id],
    queryFn: async () => {
      const res = await fetch(`/api/students/${id}`);
      if (!res.ok) throw new Error('Failed to fetch student');
      return res.json();
    },
    enabled: !!id
  });
}

// Profile hooks for each user type
export function useProfile(userId: number, userType: string) {
  return useQuery<any>({
    queryKey: ['/api/profile', userId, userType],
    queryFn: async () => {
      const res = await fetch(`/api/profile?userId=${userId}&userType=${userType}`);
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: !!userId && !!userType
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { userId: number; userType: string; updates: Record<string, any> }) => {
      const res = await apiRequest('PATCH', '/api/profile', data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile', variables.userId, variables.userType] });
    }
  });
}

// Student olympiad results hook
export interface StudentOlympiadResult {
  id: number;
  examId: number;
  totalQuestions: number;
  attemptedQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  totalMaxMarks: number;
  finalObtainedMarks: number;
  percentage: number;
  overallRank: number | null;
  classRank: number | null;
  stateRank: number | null;
  cityRank: number | null;
  schoolRank: number | null;
  performanceRemark: string | null;
  timeTakenSeconds: number | null;
  calculatedAt: string | null;
  examTitle: string | null;
  examSubject: string | null;
  examStartTime: string | null;
}

export interface StudentRegion {
  stateName: string | null;
  cityName: string | null;
  schoolName: string | null;
  gradeLevel: string | null;
}

export interface StudentResultsResponse {
  results: StudentOlympiadResult[];
  studentRegion: StudentRegion;
}

export function useStudentResults(studentId: number) {
  return useQuery<StudentResultsResponse>({
    queryKey: ['/api/results/student', studentId],
    queryFn: async () => {
      const res = await fetch(`/api/results/student/${studentId}`);
      if (!res.ok) throw new Error('Failed to fetch results');
      const data = await res.json();
      if (Array.isArray(data)) {
        return { results: data, studentRegion: { stateName: null, cityName: null, schoolName: null, gradeLevel: null } };
      }
      return data;
    },
    enabled: !!studentId
  });
}

// Referral stats hook
interface ReferralStats {
  totalReferrals: number;
  earnedDiscounts: number;
  usedDiscounts: number;
  pendingDiscounts: number;
}

export function useReferralStats(studentId: number) {
  return useQuery<ReferralStats>({
    queryKey: ['/api/referral/stats', studentId],
    queryFn: async () => {
      const res = await fetch(`/api/referral/stats?studentId=${studentId}`);
      if (!res.ok) throw new Error('Failed to fetch referral stats');
      return res.json();
    },
    enabled: !!studentId
  });
}

// Manager exam registrations hook - fetches total exam registrations for managed students
export function useManagerExamRegistrations(managerId: number, managerType: string) {
  return useQuery<ExamRegistration[]>({
    queryKey: ['/api/exam-registrations/manager', managerId, managerType],
    queryFn: async () => {
      const res = await fetch(`/api/exam-registrations/manager?managerId=${managerId}&managerType=${managerType}`);
      if (!res.ok) throw new Error('Failed to fetch exam registrations');
      return res.json();
    },
    enabled: !!managerId && !!managerType
  });
}
