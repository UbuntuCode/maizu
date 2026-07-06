"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/utils/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface UserProfile {
  id:          string;
  full_name:   string;
  email:       string;
  role:        string;
  avatar_url?: string;
  [key: string]: unknown;
}

interface AuthContextType {
  authUser:       User | null;
  session:        Session | null;
  profile:        UserProfile | null;
  isLoggedIn:     boolean;
  loading:        boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authUser:       null,
  session:        null,
  profile:        null,
  isLoggedIn:     false,
  loading:        false, /* default false â€” don't block anything */
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
      if (data) setProfile(data as UserProfile);
    } catch { /* silent */ }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (authUser) await fetchProfile(authUser.id);
  }, [authUser, fetchProfile]);

  useEffect(() => {
    /* Hard timeout â€” never block UI more than 2.5 seconds */
    const timeout = setTimeout(() => setLoading(false), 2500);

    supabase.auth.getSession()
      .then(({ data: { session: s } }) => {
        clearTimeout(timeout);
        setSession(s);
        setAuthUser(s?.user ?? null);
        if (s?.user) fetchProfile(s.user.id);
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthUser(s?.user ?? null);
      if (s?.user) fetchProfile(s.user.id);
      else setProfile(null);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ authUser, session, profile, isLoggedIn: !!authUser, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

