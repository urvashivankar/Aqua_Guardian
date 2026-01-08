import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'Student' | 'Citizen' | 'NGO' | 'Government' | 'Other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  reportsSubmitted: number;
  cleanUpsJoined: number;
  nftsAdopted: number;
  createdAt?: string;
  location?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; message?: string }>;
  loginSimulated: (role: UserRole, email?: string) => Promise<{ success: boolean; message?: string }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  refreshUserStats: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const fetchUserProfile = async (sbUser: SupabaseUser) => {
    try {
      // Phase 1: Fetch basic profile (Essential for immediate UI response)
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      const roleRaw = profile?.role || sbUser.user_metadata?.role || 'Citizen';
      const role = (roleRaw.charAt(0).toUpperCase() + roleRaw.slice(1)) as UserRole;

      const newUser: User = {
        id: sbUser.id,
        email: sbUser.email || '',
        name: profile?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
        role: role,
        reportsSubmitted: 0,
        cleanUpsJoined: 0,
        nftsAdopted: 0,
        createdAt: profile?.created_at || sbUser.created_at,
        location: profile?.location || 'India',
      };

      // Update state immediately to unblock the UI
      setUser(newUser);

      // Phase 2: Fetch stats in the background (Non-blocking)
      // We don't await this inside the login/session flow to keep it snappy
      fetchUserStats(sbUser.id);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      const [reportsRes, cleanupsRes, adoptionsRes] = await Promise.all([
        supabase.from('reports').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('cleanup_participation').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('adoptions').select('id', { count: 'exact' }).eq('user_id', userId)
      ]);

      setUser(prev => prev ? ({
        ...prev,
        reportsSubmitted: reportsRes.count || 0,
        cleanUpsJoined: cleanupsRes.count || 0,
        nftsAdopted: adoptionsRes.count || 0,
      }) : null);
    } catch (e) {
      console.warn("Stats fetch failed in background", e);
    }
  };

  const refreshUserStats = async () => {
    if (user?.id) {
      await fetchUserStats(user.id);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) fetchUserProfile(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        fetchUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string, role: UserRole): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { success: false, message: error.message };
      if (data?.user) {
        await fetchUserProfile(data.user);
        return { success: true };
      }
      return { success: false, message: "Login failed." };
    } catch (error: any) {
      return { success: false, message: error.message || "An unexpected error occurred." };
    }
  };

  const loginSimulated = async (role: UserRole, email: string = 'demo@example.com'): Promise<{ success: boolean; message?: string }> => {
    return { success: false, message: "Simulated login is disabled. Please use real login." };
  };

  const signup = async (email: string, password: string, name: string, role: UserRole): Promise<{ success: boolean; message?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } }
      });

      if (error) return { success: false, message: error.message };

      if (data?.user) {
        await supabase.from('users').insert([{
          id: data.user.id,
          email: data.user.email || email,
          full_name: name,
          role: role.toLowerCase(),
        }]);
        await fetchUserProfile(data.user);
        return { success: true };
      }
      return { success: false, message: "Registration failed." };
    } catch (error: any) {
      return { success: false, message: error.message || "An unexpected error occurred." };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    login,
    loginSimulated,
    signup,
    logout,
    isAuthenticated: !!user,
    refreshUserStats
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};