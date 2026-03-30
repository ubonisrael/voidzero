import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "./types";
import { findUser, createUser, getUserById, getUsers } from "./mock-db";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => string | null;
  signup: (name: string, email: string, password: string, role: User["role"]) => string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("voidzero_current_user");
    if (id) {
      const u = getUserById(id);
      if (u) setUser(u);
    }
  }, []);

  const login = (email: string, password: string): string | null => {
    const u = findUser(email, password);
    if (!u) return "Invalid email or password";
    setUser(u);
    localStorage.setItem("voidzero_current_user", u.id);
    return null;
  };

  const signup = (name: string, email: string, password: string, role: User["role"]): string | null => {
    if (getUsers().some(u => u.email === email)) return "Email already exists";
    const newUser: User = { id: `user-${Date.now()}`, name, email, password, role };
    createUser(newUser);
    setUser(newUser);
    localStorage.setItem("voidzero_current_user", newUser.id);
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("voidzero_current_user");
  };

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
