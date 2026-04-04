import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    async function initAuth() {
      try {
        // Fail-safe: if auth takes longer than 10s, stop loading and show error
        timeoutId = setTimeout(() => {
          setLoading(false);
          setError('Authentication timed out. Check your Supabase URL and anon key in the .env file.');
        }, 10000);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user) {
          setUser(session.user);
        } else {
          const { data, error: signInError } = await supabase.auth.signInAnonymously();
          if (signInError) throw signInError;
          if (!data.user) throw new Error('Anonymous sign-in returned no user');
          setUser(data.user);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to initialize authentication';
        console.error('[Taskly Auth]', message, err);
        setError(message);
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
