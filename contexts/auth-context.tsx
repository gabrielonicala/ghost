"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientSupabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  organizationId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientSupabase();

  const refresh = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);

      if (user) {
        // Fetch organizationId from API
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setOrganizationId(data.organizationId || null);
        }
      } else {
        setOrganizationId(null);
      }
    } catch (error) {
      console.error("Error refreshing auth:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        refresh();
      } else {
        setOrganizationId(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setOrganizationId(null);
  };

  return (
    <AuthContext.Provider value={{ user, organizationId, loading, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

