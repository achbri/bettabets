
import { createClient } from '@supabase/supabase-js';

// Extremely aggressive fix for iOS/Safari/Mobile PWA LockManager background deadlocks.
// When an app goes to the background, locks are often held and never released,
// causing Supabase auth functions to hang forever when returning.
if (typeof window !== 'undefined' && window.navigator && window.navigator.locks) {
  const originalRequest = window.navigator.locks.request.bind(window.navigator.locks);
  window.navigator.locks.request = async (name: string, ...args: any[]) => {
    const callback = args.length > 0 && typeof args[args.length - 1] === 'function' 
      ? args[args.length - 1] 
      : null;
      
    if (callback) {
      // Bypass the native lock entirely to ensure promises ALWAYS resolve.
      // Provide a mock Lock object so the SDK doesn't throw a null reference error.
      const mockLock = { name, mode: 'exclusive' };
      return callback(mockLock);
    }
    
    // Fallback if signature mismatch
    return originalRequest(name, ...args);
  };
}

const supabaseUrl = 'https://llcyclufhzibzocimghs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsY3ljbHVmaHppYnpvY2ltZ2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5NzY4MzQsImV4cCI6MjA5NTU1MjgzNH0.hysnt-wZT-o3_4Fq1hxAFQjlwpABnG-rK_ntN5xTH1o';

// Resilient storage helper for iframe environments
const getStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Test if storage is actually writable
      const key = '__storage_test__';
      window.localStorage.setItem(key, key);
      window.localStorage.removeItem(key);
      return window.localStorage;
    }
  } catch (e) {
    console.warn("LocalStorage blocked in this environment, using memory fallback");
  }
  return undefined; // Supabase will fallback to memory if undefined
};

// Highly resilient Supabase configuration
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: getStorage(),
    storageKey: 'betta_bets_session'
  },
  global: {
    headers: { 'x-application-name': 'betta-bets' }
  }
});

// Helper to check server health with a hard timeout and retries
export const checkConnection = async (retries = 2): Promise<boolean> => {
  if (typeof window !== 'undefined' && !window.navigator.onLine) return false;
  
  try {
    // Select something small to verify auth/db connectivity
    const fetchPromise = supabase.from('app_config').select('id').limit(1);
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Network Timeout')), 3000));
    
    const { error } = await Promise.race([fetchPromise, timeoutPromise]) as any;
    
    if (error && retries > 0 && (error.message?.includes('fetch') || error.message?.includes('network'))) {
      await new Promise(r => setTimeout(r, 1000));
      return checkConnection(retries - 1);
    }
    
    return !error;
  } catch (err: any) {
    if (retries > 0 && (err.message?.includes('fetch') || err.message?.includes('network'))) {
      await new Promise(r => setTimeout(r, 1000));
      return checkConnection(retries - 1);
    }
    return false;
  }
};
