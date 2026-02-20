import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import * as api from "@/lib/api";

export type UserRole = "admin";

export interface User {
  username: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  // Simplifying changePassword for now, can be fully implemented later if needed
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial load: try to restore user from localStorage/token
    const storedUser = localStorage.getItem("toolport_user");
    const token = localStorage.getItem("toolport_token");

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem("toolport_user");
        localStorage.removeItem("toolport_token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login({ username, password });
      const { token, user: userData } = response as any;

      localStorage.setItem("toolport_token", token);
      localStorage.setItem("toolport_user", JSON.stringify(userData));
      setUser(userData);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("toolport_token");
    localStorage.removeItem("toolport_user");
    setUser(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      await api.changePassword({ oldPassword: currentPassword, newPassword });
      return true;
    } catch (error) {
      console.error("Change password failed:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
