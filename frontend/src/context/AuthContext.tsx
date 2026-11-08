import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthResponse } from '../types';
import { api, setAuthToken, TOKEN_STORAGE_KEY } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResponse>;
  register: (fullName: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (storedToken) {
          setAuthToken(storedToken);
          setTokenState(storedToken);
          const userData = await api.getCurrentUser();
          setUser(userData);
        } else {
          // Attempt cookie-based /auth/me lookup
          try {
            const userData = await api.getCurrentUser();
            setUser(userData);
          } catch {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Session verification fallback to unauthenticated state:', err);
        setAuthToken(null);
        setTokenState(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeSession();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<AuthResponse> => {
    const response = await api.login({ email, password, remember_me: rememberMe });
    setUser(response.user);
    setTokenState(response.access_token);
    return response;
  };

  const register = async (fullName: string, email: string, password: string): Promise<AuthResponse> => {
    const response = await api.register({ full_name: fullName, email, password, terms_accepted: true });
    setUser(response.user);
    setTokenState(response.access_token);
    return response;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.warn('Backend logout cleanup warning:', err);
    } finally {
      setUser(null);
      setTokenState(null);
      setAuthToken(null);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await api.getCurrentUser();
      setUser(userData);
    } catch {
      setUser(null);
      setTokenState(null);
      setAuthToken(null);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

