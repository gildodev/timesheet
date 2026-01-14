/**
 * Authentication Context
 * Manages user authentication state with Supabase
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { User } from '@/types';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  isPremium: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Map Supabase user to AuthUser
 * ⚠️ MUST be synchronous - NO async/await
 */
function mapSupabaseUser(user: SupabaseUser, isPremium: boolean = false): AuthUser {
  return {
    id: user.id,
    email: user.email!,
    username: user.user_metadata?.username || user.email!.split('@')[0],
    isPremium,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (authUser: AuthUser) => {
    setUser(authUser);
    // Store premium status in localStorage
    localStorage.setItem('timeflow_premium', authUser.isPremium.toString());
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('timeflow_premium');
  };

  const refreshUser = async () => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser) {
      const isPremium = localStorage.getItem('timeflow_premium') === 'true';
      setUser(mapSupabaseUser(supabaseUser, isPremium));
    }
  };

  useEffect(() => {
    let mounted = true;

    // Safety #1: Check existing session (page refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session?.user) {
        const isPremium = localStorage.getItem('timeflow_premium') === 'true';
        login(mapSupabaseUser(session.user, isPremium));
      }
      if (mounted) setLoading(false);
    });

    // Safety #2: Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        const isPremium = localStorage.getItem('timeflow_premium') === 'true';
        login(mapSupabaseUser(session.user, isPremium));
        setLoading(false);
      } else if (event === 'SIGNED_OUT') {
        logout();
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        const isPremium = localStorage.getItem('timeflow_premium') === 'true';
        login(mapSupabaseUser(session.user, isPremium));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
