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
  /* Extra users-table columns (plan, etc.) without typing each one */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

interface AuthContextType {
  authUser:       User | null;
  session:        Session | null;
  profile:        UserProfile | null;
  isLoggedIn:     boolean;
  loading:        boolean;
  refreshProfile: () => Promise<void>;
  signOut:        () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  authUser:       null,
  session:        null,
  profile:        null,
  isLoggedIn:     false,
  loading:        false, /* default false — don't block anything */
  refreshProfile: async () => {},
  signOut:        async () => {},
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

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  useEffect(() => {
    /* Hard timeout — never block UI more than 5 seconds */
    const timeout = setTimeout(() => setLoading(false), 5000);

    supabase.auth.getSession()
      .then(async ({ data: { session: s } }) => {
        setSession(s);
        setAuthUser(s?.user ?? null);
        /* Wait for the profile BEFORE declaring auth loaded —
           otherwise role-guarded pages redirect on a null profile */
        if (s?.user) await fetchProfile(s.user.id);
        clearTimeout(timeout);
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthUser(s?.user ?? null);
      if (s?.user) {
        /* setTimeout defers the Supabase call out of the auth callback
           (awaiting directly inside onAuthStateChange can deadlock) */
        const uid = s.user.id;
        setTimeout(async () => {
          await fetchProfile(uid);
          setLoading(false);
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  return (
    <AuthContext.Provider value={{ authUser, session, profile, isLoggedIn: !!authUser, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
