import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from "react";
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/supabaseHelpers';

export type AppRole = 'admin' | 'student' | 'teacher';

export interface UserProfile {
  id: string;
  email: string | null;
  fullName: string | null;
  mobile: string | null;
  role: AppRole;
  avatarUrl: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: AppRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  refetchUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth timeout - don't wait forever
const AUTH_TIMEOUT = 5000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track if initial load is complete to prevent race conditions
  const initialLoadComplete = useRef(false);
  const isMounted = useRef(true);

  const fetchUserRole = useCallback(async (userId: string): Promise<AppRole> => {
    try {
      const result = await withTimeout(
        Promise.resolve(supabase.rpc('get_user_role', { _user_id: userId })),
        AUTH_TIMEOUT
      );
      if (result.error) throw result.error;
      return (result.data as AppRole) || 'student';
    } catch (err) {
      console.error('Error fetching role:', err);
      return 'student';
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      const userRole = await fetchUserRole(userId);
      
      return {
        id: data.id,
        email: data.email,
        fullName: data.full_name,
        mobile: data.mobile,
        role: userRole,
        avatarUrl: data.avatar_url,
      };
    } catch (err) {
      console.error('Error fetching profile:', err);
      return null;
    }
  }, [fetchUserRole]);

  const refetchUserData = useCallback(async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      if (isMounted.current) {
        setProfile(userProfile);
        if (userProfile) setRole(userProfile.role);
      }
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    isMounted.current = true;

    // INITIAL LOAD: Fetch session and role before setting isLoading = false
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!isMounted.current) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        // Fetch role BEFORE setting loading false
        if (session?.user) {
          const userRole = await fetchUserRole(session.user.id);
          if (isMounted.current) {
            setRole(userRole);
            // Fetch profile in background (non-blocking)
            fetchProfile(session.user.id).then(p => {
              if (isMounted.current) setProfile(p);
            });
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          initialLoadComplete.current = true;
        }
      }
    };

    initializeAuth();

    // ONGOING AUTH CHANGES: Fire and forget, don't control isLoading
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted.current) return;
        
        // Skip if this is during initial load
        if (!initialLoadComplete.current) return;
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Fire and forget - don't await, don't set loading
          fetchUserRole(session.user.id).then(r => {
            if (isMounted.current) setRole(r);
          });
          fetchProfile(session.user.id).then(p => {
            if (isMounted.current) setProfile(p);
          });
        } else {
          setRole(null);
          setProfile(null);
        }
      }
    );

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole, fetchProfile]);

  const login = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return { error: error as Error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) return { error: error as Error };
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isAuthenticated: !!user,
        isLoading,
        isAdmin: role === 'admin',
        isStudent: role === 'student',
        isTeacher: role === 'teacher',
        login,
        signup,
        logout,
        refetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
