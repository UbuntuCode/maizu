"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface UserProfile {
  id:        string;
  full_name: string;
  email:     string;
  role:      string;
  avatar_url?: string;
  [key: string]: any; /* allows plan, bio, etc. */
}

interface AuthContextType {
  authUser:    User | null;
  session:     Session | null;
  profile:     UserProfile | null;
  isLoggedIn:  boolean;
  loading:     boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authUser:    null,
  session:     null,
  profile:     null,
  isLoggedIn:  false,
  loading:     true,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [session,  setSession]  = useState<Session | null>(null);
  const [profile,  setProfile]  = useState<UserProfile | null>(null);
  const [loading,  setLoading]  = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
      if (data) setProfile(data);
    } catch { /* silent — profile table may not have row yet */ }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (authUser) await fetchProfile(authUser.id);
  }, [authUser, fetchProfile]);

  useEffect(() => {
    /* ── 1. Restore session on mount (reads from localStorage automatically) ── */
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setAuthUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      setLoading(false);
    });

    /* ── 2. Listen for auth state changes (login, logout, token refresh) ── */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        setSession(s);
        setAuthUser(s?.user ?? null);
        if (s?.user) {
          await fetchProfile(s.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{
      authUser,
      session,
      profile,
      isLoggedIn: !!authUser,
      loading,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
