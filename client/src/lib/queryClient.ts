import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    let message = text;
    try {
      const parsed = JSON.parse(text);
      if (parsed.message) {
        message = parsed.message;
      }
    } catch {
      if (res.status === 401) message = "Session expired. Please log in again.";
      else if (res.status === 403) message = "You don't have permission for this action.";
      else if (res.status === 404) message = "The requested resource was not found.";
      else if (res.status === 429) message = "Too many requests. Please try again later.";
      else if (res.status >= 500) message = "Something went wrong. Please try again.";
    }
    throw new Error(message);
  }
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const authData = localStorage.getItem("superAdminAuth");
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.sessionToken) {
        headers["Authorization"] = `Bearer ${parsed.sessionToken}`;
      }
    }
  } catch {}
  try {
    const studentToken = localStorage.getItem("samikaran_session_token");
    if (studentToken) {
      headers["x-student-session"] = studentToken;
    }
    const studentData = localStorage.getItem("samikaran_user");
    if (studentData) {
      const parsed = JSON.parse(studentData);
      if (parsed.id) {
        headers["x-student-id"] = String(parsed.id);
        headers["x-user-id"] = String(parsed.id);
      }
      if (parsed.userType) {
        headers["x-user-type"] = parsed.userType;
      }
    }
  } catch {}
  try {
    const schoolToken = localStorage.getItem("schoolToken");
    if (schoolToken) {
      headers["x-school-token"] = schoolToken;
    }
  } catch {}
  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...getAuthHeaders(),
    ...(data ? { "Content-Type": "application/json" } : {}),
  };
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: getAuthHeaders(),
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
