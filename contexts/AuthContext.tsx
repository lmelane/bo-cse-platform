'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, tokenStorage, type AuthUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Vérifier le token au chargement
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        setLoading(false);
        return;
      }

      const userData = await authService.me(token);
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      tokenStorage.remove();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      
      // Sauvegarder le token
      tokenStorage.set(response.token);
      
      // Sauvegarder l'utilisateur
      setUser(response.user);
      
      // Rediriger vers le dashboard
      router.push('/');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Erreur de connexion');
    }
  };

  const logout = async () => {
    try {
      const token = tokenStorage.get();
      if (token) {
        await authService.logout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenStorage.remove();
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
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
