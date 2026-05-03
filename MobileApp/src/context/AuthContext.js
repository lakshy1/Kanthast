import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getToken, getUser, saveToken, saveUser, clearAllAppData } from "../utils/storage";
import { warmupBackend } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([getToken(), getUser()]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
        // Warmup backend on startup (fire and forget)
        warmupBackend();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (tokenValue, userData) => {
    await Promise.all([saveToken(tokenValue), saveUser(userData)]);
    setToken(tokenValue);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    await clearAllAppData();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async (userData) => {
    await saveUser(userData);
    setUser(userData);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
