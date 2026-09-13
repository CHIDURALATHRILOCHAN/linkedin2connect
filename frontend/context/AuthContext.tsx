"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
  created_at: string;
}

export interface LinkedInStatus {
  connected: boolean;
  linkedin_member_id?: string;
  member_name?: string;
  member_picture?: string;
  access_token_expires_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  linkedInStatus: LinkedInStatus;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  refreshLinkedInStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [linkedInStatus, setLinkedInStatus] = useState<LinkedInStatus>({ connected: false });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
      fetchMe(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchMe = async (authToken: string) => {
    try {
      const userData = await apiRequest<User>("/auth/me");
      setUser(userData);
      await fetchLinkedInStatus();
    } catch (err) {
      console.error("Session expired or invalid token:", err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedInStatus = async () => {
    try {
      const status = await apiRequest<LinkedInStatus>("/linkedin/status");
      setLinkedInStatus(status);
    } catch (err) {
      console.error("Failed to fetch LinkedIn status:", err);
      setLinkedInStatus({ connected: false });
    }
  };

  const login = (authToken: string, userData: User) => {
    localStorage.setItem("token", authToken);
    setToken(authToken);
    setUser(userData);
    fetchLinkedInStatus();
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setLinkedInStatus({ connected: false });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        linkedInStatus,
        loading,
        login,
        logout,
        refreshLinkedInStatus: fetchLinkedInStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
