import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axiosClient from '../api/axiosClient';

export interface User {
  id: string;
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response: any = await axiosClient.get('/users/me');
      setUser(response);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      setUser(null);
      localStorage.removeItem('accessToken');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('accessToken', token);
    await fetchProfile();
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
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
