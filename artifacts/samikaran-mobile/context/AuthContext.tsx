import React, { createContext, useContext, useState, useEffect } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type UserRole = "student" | "school" | "parent" | "partner" | null;

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  email?: string;
  token?: string;
  xp?: number;
  level?: number;
  streak?: number;
  grade?: number;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isLoading: boolean;
  login: (userData: AuthUser) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
}

const USER_KEY = "samikaran_user";
const ONBOARD_KEY = "samikaran_onboarding_done";

async function secureSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function secureGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return AsyncStorage.getItem(key);
  }
}

async function secureDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    await AsyncStorage.removeItem(key);
  }
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const stored = await secureGet(USER_KEY);
      if (stored) {
        setUser(JSON.parse(stored) as AuthUser);
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  };

  const login = async (userData: AuthUser) => {
    setUser(userData);
    await secureSet(USER_KEY, JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    await secureDelete(USER_KEY);
    await secureDelete(ONBOARD_KEY);
  };

  const updateUser = (updates: Partial<AuthUser>) => {
    if (user) {
      const updated = { ...user, ...updates };
      setUser(updated);
      secureSet(USER_KEY, JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
