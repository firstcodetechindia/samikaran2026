import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// List all attempts (history)
export function useAttempts() {
  return useQuery({
    queryKey: [api.attempts.list.path],
    queryFn: async () => {
      const res = await fetch(api.attempts.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch attempts");
      return api.attempts.list.responses[200].parse(await res.json());
    },
  });
}

// Start Attempt
export function useStartAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: z.infer<typeof api.attempts.start.input>) => {
      const res = await fetch(api.attempts.start.path, {
        method: api.attempts.start.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to start exam attempt");
      return api.attempts.start.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.attempts.list.path] }),
  });
}

// Submit single answer
export function useSubmitAnswer() {
  return useMutation({
    mutationFn: async ({ attemptId, questionId, selectedOption }: { attemptId: number, questionId: number, selectedOption: string }) => {
      const url = buildUrl(api.attempts.submitAnswer.path, { id: attemptId });
      const res = await fetch(url, {
        method: api.attempts.submitAnswer.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, selectedOption }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      return api.attempts.submitAnswer.responses[200].parse(await res.json());
    },
  });
}

// Finish Attempt
export function useFinishAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (attemptId: number) => {
      const url = buildUrl(api.attempts.finish.path, { id: attemptId });
      const res = await fetch(url, {
        method: api.attempts.finish.method,
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to finish exam");
      return api.attempts.finish.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.attempts.list.path] }),
  });
}
