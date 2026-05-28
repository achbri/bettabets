
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: (specificUserId?: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);
  const lastCheck = useRef<number>(0);
  const isLoadingRef = useRef(true);

  useEffect(() => {
    userRef.current = user;
    isLoadingRef.current = loading;
  }, [user, loading]);

  const fetchProfile = async (userId: string, retries = 3): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, role, subscription, expiry_date, is_blocked, created_at, profile_pic')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        // If it's a network error and we have retries left, wait and try again
        if (retries > 0 && (error.message.includes('fetch') || error.message.includes('network'))) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchProfile(userId, retries - 1);
        }
        throw error;
      }
      return data as User;
    } catch (e: any) {
      if (retries > 0 && (e.message?.includes('fetch') || e.message?.includes('network'))) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return fetchProfile(userId, retries - 1);
      }
      console.error("Profile fetch error:", e);
      return null;
    }
  };

  const syncAuth = async (session: any) => {
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      if (profile && !profile.is_blocked) {
        setUser(profile);
      } else {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Initial session check
    const init = async () => {
      // Safety timeout: force loading to false if it takes too long
      const timeout = setTimeout(() => {
        if (isLoadingRef.current) {
          console.warn("Auth sync timed out, continuing anyway.");
          setLoading(false);
        }
      }, 8000);

      try {
        const getSessionWithRetry = async (attempts = 2): Promise<any> => {
          try {
            return await supabase.auth.getSession();
          } catch (err) {
            if (attempts > 0) {
              await new Promise(r => setTimeout(r, 1000));
              return getSessionWithRetry(attempts - 1);
            }
            throw err;
          }
        };

        const { data: { session } } = await getSessionWithRetry();
        await syncAuth(session);
      } catch (e) {
        console.error("Auth init error:", e);
        setLoading(false);
      } finally {
        clearTimeout(timeout);
      }
    };

    init();

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`Auth event: ${event}`);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        await syncAuth(session);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // Smart Visibility Listener
    const handleVisible = async () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Check every time but throttle the actual API call
        if (now - lastCheck.current < 60000) return;
        lastCheck.current = now;

        console.log("App resumed, ensuring session is active...");
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.warn("Session retrieval error on resume:", error);
            // If we have an error, try a force refresh
            const { data: refreshed } = await supabase.auth.refreshSession();
            await syncAuth(refreshed.session);
          } else if (session) {
            // Check if token is near expiry (less than 5 mins)
            const expiresAt = session.expires_at || 0;
            const buffer = 300; // 5 mins
            if (expiresAt - (Date.now() / 1000) < buffer) {
              console.log("Token near expiry, refreshing...");
              const { data: refreshed } = await supabase.auth.refreshSession();
              await syncAuth(refreshed.session);
            } else {
              await syncAuth(session);
            }
          } else if (userRef.current) {
            // We were logged in but session is gone - attempt one recovery
            console.log("Session lost, attempting recovery...");
            const { data: refreshed } = await supabase.auth.refreshSession();
            if (refreshed.session) {
              await syncAuth(refreshed.session);
            } else {
              setUser(null);
            }
          }
        } catch (e) {
          console.error("Critical resume error:", e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisible);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisible);
    };
  }, []);

  const signOut = async () => {
    try {
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Signout timeout')), 3000));
      await Promise.race([signOutPromise, timeoutPromise]);
    } catch (e) {
      console.warn("Server signout failed or timed out, forcing local clear:", e);
    } finally {
      setUser(null);
      localStorage.removeItem('betta_bets_session');
      localStorage.removeItem('betta_bets_auth_session'); // clear legacy key too just in case
      window.location.reload();
    }
  };

  const refreshProfile = async (specificUserId?: string) => {
    const targetId = specificUserId || userRef.current?.id;
    if (targetId) {
      const profile = await fetchProfile(targetId);
      if (profile) setUser(profile);
      return profile;
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
