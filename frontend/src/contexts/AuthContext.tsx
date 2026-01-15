import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'Citizen' | 'NGO' | 'Government';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  reportsSubmitted: number;
  cleanUpsJoined: number;
  createdAt?: string;
  location?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
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
      console.log('🔍 [AuthContext] Fetching profile for user:', sbUser.id);

      // Timeout promise for DB fetch (3 seconds max)
      const dbFetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', sbUser.id)
        .single();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
      );

      let profile = null;
      try {
        const { data } = await Promise.race([dbFetchPromise, timeoutPromise]) as any;
        profile = data;
      } catch (err) {
        console.warn('⚠️ [AuthContext] DB Profile fetch failed or timed out, using metadata fallback:', err);
      }

      console.log('📊 [AuthContext] Database profile:', profile);
      console.log('📊 [AuthContext] Supabase metadata:', sbUser.user_metadata);

      const roleRaw = profile?.role || sbUser.user_metadata?.role || 'citizen';
      console.log('🎭 [AuthContext] Raw role from DB/metadata:', roleRaw);

      // Map backend role (lowercase) to frontend UserRole (properly capitalized)
      const roleMap: Record<string, UserRole> = {
        'citizen': 'Citizen',
        'ngo': 'NGO',
        'government': 'Government',
      };
      let role = roleMap[roleRaw.toLowerCase()] || 'Citizen';

      // 🚨 DEMO OVERRIDE: Force green@ngo.org to be Government if needed
      if (sbUser.email === 'green@ngo.org' && localStorage.getItem('demo_mode_govt') === 'true') {
        console.log("🚨 DEMO MODE: Forcing Government Role for NGO account");
        role = 'Government';
      }

      const newUser: User = {
        id: sbUser.id,
        email: sbUser.email || '',
        name: profile?.full_name || sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || 'User',
        role: role,
        reportsSubmitted: 0, // Will be updated by fetchUserStats
        cleanUpsJoined: 0,
        nftsAdopted: 0,
        createdAt: profile?.created_at || sbUser.created_at,
        location: profile?.location || 'India',
      };

      console.log('👤 [AuthContext] Setting user state:', newUser);

      // ALWAYS update state to unblock UI, even if DB fetch failed
      setUser(newUser);

      // Phase 2: Fetch stats in the background (Non-blocking)
      fetchUserStats(sbUser.id);
    } catch (error) {
      console.error('❌ [AuthContext] Critical setup error:', error);
      // Even in critical error, try to set a basic user to allow access
      setUser({
        id: sbUser.id,
        email: sbUser.email || '',
        name: 'User',
        role: 'Citizen',
        reportsSubmitted: 0,
        cleanUpsJoined: 0,
        nftsAdopted: 0,
      });
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      const [reportsRes, cleanupsRes] = await Promise.all([
        supabase.from('reports').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('cleanup_participation').select('id', { count: 'exact' }).eq('user_id', userId)
      ]);

      setUser(prev => prev ? ({
        ...prev,
        reportsSubmitted: reportsRes.count || 0,
        cleanUpsJoined: cleanupsRes.count || 0,
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
    // Force refresh on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        console.log('🔄 [AuthContext] Force refreshing user profile on mount');
        fetchUserProfile(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔔 [AuthContext] Auth state changed:', event);
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'TOKEN_REFRESHED') && session?.user) {
        console.log('🔄 [AuthContext] Fetching fresh profile due to:', event);
        await fetchUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 [AuthContext] User signed out');
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
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

  // Simulated login removed to enforce real authentication

  const signup = async (email: string, password: string, name: string, role: UserRole): Promise<{ success: boolean; message?: string }> => {
    try {
      console.log(`🚀 Starting signup - Role: ${role}`);

      // Timeout wrapper
      const signupPromise = (async () => {
        // Direct Supabase signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name, role: role.toLowerCase() },
            emailRedirectTo: window.location.origin
          }
        });

        if (authError) {
          console.error('❌ Auth error:', authError);
          throw new Error(authError.message);
        }

        if (!authData.user) {
          throw new Error('No user data returned');
        }

        console.log('✅ Auth user created:', authData.user.id);

        // Create profile with role (don't wait for this)
        supabase
          .from('users')
          .upsert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: name,
            role: role.toLowerCase()
          }, { onConflict: 'id' })
          .then(({ error }) => {
            if (error) {
              console.error('⚠️ Profile error:', error);
            } else {
              console.log('✅ Profile created with role:', role.toLowerCase());
            }
          });

        // If session exists, user is logged in immediately
        if (authData.session) {
          await fetchUserProfile(authData.user);
          return { success: true, message: 'Account created successfully!' };
        }

        // If no session, email confirmation is required
        return {
          success: true,
          message: 'Account created! Please check your email to confirm your account.'
        };
      })();

      // 10 second timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Signup timeout - please try again')), 10000)
      );

      return await Promise.race([signupPromise, timeoutPromise]) as { success: boolean; message?: string };

    } catch (error: any) {
      console.error('❌ Signup error:', error);
      return { success: false, message: error.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    console.log("👋 Logging out...");

    // 1. Clear simulated session immediately
    localStorage.removeItem('aqua_simulated_user');
    localStorage.removeItem('aqua_user_role');

    // 2. Clear user state to update UI immediately
    setUser(null);

    // 3. Attempt Supabase signout in background (don't block UI)
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("⚠️ Supabase signout warning:", error.message);
    } catch (e) {
      console.error("⚠️ Logout non-critical error:", e);
    }
  };

  const value = {
    user,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    refreshUserStats
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};