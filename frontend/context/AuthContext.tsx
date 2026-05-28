"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabase";
import type { UserProfile } from "@/utils/api";

/* ── Types ──────────────────────────────────────────────────── */
interface AuthContextValue {
  authUser:       User | null;
  profile:        UserProfile | null;
  session:        Session | null;
  loading:        boolean;
  isLoggedIn:     boolean;
  signUp:         (email: string, password: string, full_name: string, role?: string) => Promise<void>;
  signIn:         (email: string, password: string) => Promise<void>;
  signOut:        () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── Provider ───────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile,  setProfile]  = useState<UserProfile | null>(null);
  const [session,  setSession]  = useState<Session | null>(null);
  const [loading,  setLoading]  = useState(true);

  /* Fetch profile from public.users */
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, full_name, role, avatar_url, bio")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setProfile(data as UserProfile);
      }
    } catch {
      // Profile may not exist yet — that's okay
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (authUser) await fetchProfile(authUser.id);
  }, [authUser, fetchProfile]);

  /* Restore session on mount */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthUser(data.session?.user ?? null);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      }
      setLoading(false);
    });

    /* Listen for login / logout / token refresh */
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthUser(newSession?.user ?? null);
      if (newSession?.user) {
        fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

  /* ── SIGN UP ──────────────────────────────────────────────── */
  const signUp = async (
    email: string,
    password: string,
    full_name: string,
    role = "buyer"
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role },
      },
    });

    if (error) throw new Error(error.message);
    // The trigger in user_trigger.sql automatically creates
    // the public.users profile row — no manual insert needed.
  };

  /* ── SIGN IN ──────────────────────────────────────────────── */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw new Error(error.message);
    // onAuthStateChange fires automatically and sets authUser + profile
  };

  /* ── SIGN OUT ─────────────────────────────────────────────── */
  const signOut = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{
      authUser,
      profile,
      session,
      loading,
      isLoggedIn: !!authUser,
      signUp,
      signIn,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ── useAuth hook ───────────────────────────────────────────── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/* ── useRequireAuth — redirect if not logged in ─────────────── */
export function useRequireAuth(redirectTo = "/login") {
  const { authUser, loading } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!authUser && typeof window !== "undefined") {
        window.location.href = redirectTo;
      } else {
        setReady(true);
      }
    }
  }, [authUser, loading, redirectTo]);

  return { isReady: ready, loading };
}
