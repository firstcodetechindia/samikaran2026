import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Fetch all exams
export function useExams() {
  return useQuery({
    queryKey: [api.exams.list.path],
    queryFn: async () => {
      const res = await fetch(api.exams.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch exams");
      return api.exams.list.responses[200].parse(await res.json());
    },
  });
}

// Fetch single exam (with optional questions)
export function useExam(id: number) {
  return useQuery({
    queryKey: [api.exams.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.exams.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch exam");
      return api.exams.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Fetch exam questions explicitly
export function useExamQuestions(id: number) {
  return useQuery({
    queryKey: [api.exams.getQuestions.path, id],
    queryFn: async () => {
      const url = buildUrl(api.exams.getQuestions.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch questions");
      return api.exams.getQuestions.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

// Create Exam
export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.exams.create.input>) => {
      // Coerce dates to ISO strings if needed, though Zod usually handles dates in JSON as strings
      const res = await fetch(api.exams.create.path, {
        method: api.exams.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create exam");
      }
      return api.exams.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.exams.list.path] }),
  });
}

// Create Question
export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.questions.create.input>) => {
      const res = await fetch(api.questions.create.path, {
        method: api.questions.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to create question");
      return api.questions.create.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.exams.getQuestions.path, variables.examId] });
      queryClient.invalidateQueries({ queryKey: [api.exams.get.path, variables.examId] });
    },
  });
}

// Delete Question
export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.questions.delete.path, { id });
      const res = await fetch(url, { method: api.questions.delete.method, credentials: "include" });
      if (!res.ok) throw new Error("Failed to delete question");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.exams.getQuestions.path] });
    },
  });
}

// Generate Questions with AI
export function useGenerateQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.ai.generateQuestions.input>) => {
      const res = await fetch(api.ai.generateQuestions.path, {
        method: api.ai.generateQuestions.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate questions");
      return api.ai.generateQuestions.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.exams.getQuestions.path, variables.examId] });
    },
  });
}
