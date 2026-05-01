import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";

export interface CustomAuthUser {
  id: number;
  email: string;
  studentId: string | null;
  firstName: string | null;
  lastName: string | null;
  userType: "student" | "supervisor" | "group" | "school";
  schoolName: string | null;
  gradeLevel: string | null;
}

const STORAGE_KEY = "samikaran_user";

export function useCustomAuth() {
  const [user, setUser] = useState<CustomAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData: CustomAuthUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("lastVisitedRoute");
    setUser(null);
    setLocation("/login");
  }, [setLocation]);

  const isAuthenticated = !!user;

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
}

export function getStoredUser(): CustomAuthUser | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as CustomAuthUser;
  } catch {
    return null;
  }
}
