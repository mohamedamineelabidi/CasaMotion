import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { login as apiLogin, probeHealth } from '@/lib/api';
import {
  clearSession,
  getRole,
  getToken,
  getUsername,
  saveSession,
} from '@/lib/auth';
import { Role } from '@/lib/types';

interface AuthState {
  ready: boolean;
  isAuthenticated: boolean;
  username: string | null;
  role: Role | null;
  /** true when the backend /health probe fails → screens use mock data. */
  demoMode: boolean;
  backendOnline: boolean;
  signIn: (username: string, role: Role) => Promise<void>;
  signOut: () => Promise<void>;
  refreshHealth: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [backendOnline, setBackendOnline] = useState(false);

  const refreshHealth = useCallback(async () => {
    const health = await probeHealth();
    setBackendOnline(!!health);
  }, []);

  useEffect(() => {
    (async () => {
      const [t, r, u] = await Promise.all([getToken(), getRole(), getUsername()]);
      setToken(t);
      setRole(r);
      setUsername(u);
      await refreshHealth();
      setReady(true);
    })();
  }, [refreshHealth]);

  const signIn = useCallback(async (name: string, r: Role) => {
    const health = await probeHealth();
    setBackendOnline(!!health);
    if (health) {
      const res = await apiLogin(name, r);
      await saveSession(res.access_token, r, name);
      setToken(res.access_token);
    } else {
      // Demo mode: no reachable backend, create a local-only session.
      const demoToken = `demo.${Date.now()}`;
      await saveSession(demoToken, r, name);
      setToken(demoToken);
    }
    setRole(r);
    setUsername(name);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    setToken(null);
    setRole(null);
    setUsername(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      ready,
      isAuthenticated: !!token,
      username,
      role,
      demoMode: !backendOnline,
      backendOnline,
      signIn,
      signOut,
      refreshHealth,
    }),
    [ready, token, username, role, backendOnline, signIn, signOut, refreshHealth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
