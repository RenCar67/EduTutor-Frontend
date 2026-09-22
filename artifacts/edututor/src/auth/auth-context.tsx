import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { InteractionStatus, type AccountInfo, type IdTokenClaims } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { azureConfigured, loginRequest, tokenRequest } from './authConfig';
import { configureBffInterceptor } from './httpClient';
import { setAuthTokenGetter, setRequestContext } from '@workspace/api-client-react';

export type AppRole = 'ESTUDIANTE' | 'TUTOR' | 'ADMIN';
export type AuthMode = 'azure' | 'mock';

export type AppUser = {
  userId: string;
  name: string;
  username: string;
  role: AppRole;
  source: AuthMode;
};

type AuthContextValue = {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginWithAzure: () => Promise<void>;
  loginMock: (role: AppRole) => void;
  logout: () => Promise<void>;
  isAzureConfigured: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const AUTH_MODE_KEY = 'edututor.auth.mode';
const MOCK_USER_KEY = 'edututor.auth.mock-user';

const mockUsers: Record<AppRole, AppUser> = {
  ESTUDIANTE: {
    userId: 'student-001',
    name: 'Sofía Estudiante',
    username: 'student@edututor.demo',
    role: 'ESTUDIANTE',
    source: 'mock',
  },
  TUTOR: {
    userId: 'tutor-003',
    name: 'Camila Pérez',
    username: 'tutor@edututor.demo',
    role: 'TUTOR',
    source: 'mock',
  },
  ADMIN: {
    userId: 'admin-001',
    name: 'Mariana García',
    username: 'admin@edututor.demo',
    role: 'ADMIN',
    source: 'mock',
  },
};

function readStoredMode(): AuthMode {
  const stored = window.localStorage.getItem(AUTH_MODE_KEY);
  return stored === 'azure' || stored === 'mock' ? stored : 'mock';
}

function readStoredMockUser(): AppUser | null {
  const stored = window.localStorage.getItem(MOCK_USER_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as AppUser;
    return parsed.source === 'mock' && parsed.role in mockUsers ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeRole(value: unknown): AppRole | null {
  if (typeof value !== 'string') return null;
  const role = value.trim().toUpperCase();
  if (role.includes('ADMIN')) return 'ADMIN';
  if (role.includes('TUTOR') || role.includes('TEACHER')) return 'TUTOR';
  if (role.includes('ESTUDIANTE') || role.includes('STUDENT')) return 'ESTUDIANTE';
  return null;
}

function mapClaimsToRole(claims: IdTokenClaims | undefined): AppRole {
  const roles = Array.isArray(claims?.roles) ? claims.roles : [];
  return roles.map(normalizeRole).find((role): role is AppRole => Boolean(role)) ?? 'ESTUDIANTE';
}

function accountToUser(account: AccountInfo): AppUser {
  const claims = account.idTokenClaims as (IdTokenClaims & Record<string, unknown>) | undefined;
  const userId = String(claims?.oid ?? claims?.sub ?? account.localAccountId);
  const name = String(claims?.name ?? account.name ?? 'Usuario institucional');
  const username = String(claims?.preferred_username ?? account.username ?? '');

  return {
    userId,
    name,
    username,
    role: mapClaimsToRole(claims),
    source: 'azure',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { instance, accounts, inProgress } = useMsal();
  const [mode, setModeState] = useState<AuthMode>(readStoredMode);
  const [mockUser, setMockUser] = useState<AppUser | null>(readStoredMockUser);
  const [azureUser, setAzureUser] = useState<AppUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectHandled, setRedirectHandled] = useState(false);

  const account = accounts[0] ?? null;
  const user = mode === 'mock' ? mockUser : azureUser;
  const isAuthenticated = Boolean(user);
  const isLoading = inProgress !== InteractionStatus.None || !redirectHandled;

  useEffect(() => {
    let active = true;
    void instance
      .handleRedirectPromise()
      .then((result) => {
        if (!active) return;
        if (result?.account) {
          instance.setActiveAccount(result.account);
          setAzureUser(accountToUser(result.account));
          setModeState('azure');
          window.localStorage.setItem(AUTH_MODE_KEY, 'azure');
        }
      })
      .catch(() => {
        if (active) setError('No pudimos completar el inicio de sesión institucional.');
      })
      .finally(() => {
        if (active) setRedirectHandled(true);
      });
    return () => {
      active = false;
    };
  }, [instance]);

  useEffect(() => {
    if (account && mode === 'azure') {
      setAzureUser(accountToUser(account));
    }
  }, [account, mode]);

  const acquireAccessToken = async (): Promise<string | null> => {
    if (mode !== 'azure' || !account) return null;
    try {
      const result = await instance.acquireTokenSilent(tokenRequest(account));
      return result.accessToken;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const contextUser = mode === 'mock' ? mockUser : azureUser;
    const context = contextUser
      ? { userId: contextUser.userId, userRole: contextUser.role }
      : null;

    setRequestContext(context);
    setAuthTokenGetter(mode === 'azure' ? acquireAccessToken : null);
    configureBffInterceptor({
      getAccessToken: acquireAccessToken,
      getContext: () => context,
    });

    return () => {
      setAuthTokenGetter(null);
      setRequestContext(null);
    };
  }, [mode, mockUser, azureUser, account, instance]);

  const setMode = (nextMode: AuthMode) => {
    setModeState(nextMode);
    window.localStorage.setItem(AUTH_MODE_KEY, nextMode);
    setError(null);
    if (nextMode === 'azure') {
      setMockUser(null);
      window.localStorage.removeItem(MOCK_USER_KEY);
    }
  };

  const loginWithAzure = async () => {
    setError(null);
    if (!azureConfigured) {
      setError('Azure AD no está configurado. Define VITE_AZURE_CLIENT_ID y VITE_AZURE_TENANT_ID para activar este modo.');
      return;
    }
    setMode('azure');
    await instance.loginRedirect(loginRequest);
  };

  const loginMock = (role: AppRole) => {
    const nextUser = mockUsers[role];
    setModeState('mock');
    setMockUser(nextUser);
    window.localStorage.setItem(AUTH_MODE_KEY, 'mock');
    window.localStorage.setItem(MOCK_USER_KEY, JSON.stringify(nextUser));
    setError(null);
  };

  const logout = async () => {
    if (mode === 'azure') {
      await instance.logoutRedirect({ account: account ?? undefined });
      return;
    }
    setMockUser(null);
    window.localStorage.removeItem(MOCK_USER_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      mode,
      setMode,
      user,
      isAuthenticated,
      isLoading,
      error,
      loginWithAzure,
      loginMock,
      logout,
      isAzureConfigured: azureConfigured,
    }),
    [mode, user, isAuthenticated, isLoading, error, account],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
