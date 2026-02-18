import React, { createContext, useContext, useState, ReactNode } from "react";

export type UserRole = "admin";

export interface User {
  username: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminPassword, setAdminPassword] = useState("admin123");

  const login = (username: string, password: string): boolean => {
    if (username === "DIM/0245/25" && password === adminPassword) {
      setUser({ username: "DIM/0245/25", name: "Newton Kamau", role: "admin" });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  const changePassword = (currentPassword: string, newPassword: string): boolean => {
    if (currentPassword !== adminPassword) return false;
    if (newPassword.length < 6) return false;
    setAdminPassword(newPassword);
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
