'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { authService, type AuthUser } from '@/lib/auth';
import { SESSION_CHECK_INTERVAL } from '@/lib/config';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

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

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  // Vérifier l'auth au chargement via le cookie httpOnly
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await authService.me();
        setUser(userData);
      } catch {
        // Pas de session valide — l'utilisateur n'est pas connecté
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Vérification périodique de la session (toutes les 5 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        await authService.me();
      } catch {
        toast.error('Votre session a expiré. Veuillez vous reconnecter.');
        logout();
      }
    }, SESSION_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user, logout]);

  const login = async (email: string, password: string) => {
    try {
      const { user: userData } = await authService.login(email, password);
      setUser(userData);
      router.push('/');
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      throw new Error(axiosError.response?.data?.message || axiosError.message || 'Erreur de connexion');
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
