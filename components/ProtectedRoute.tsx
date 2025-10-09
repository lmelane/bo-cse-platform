'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand mx-auto mb-4" />
          <p className="text-neutral-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Non authentifié (sera redirigé par useEffect)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-brand mx-auto mb-4" />
          <p className="text-neutral-600">Redirection...</p>
        </div>
      </div>
    );
  }

  // Vérifier que l'utilisateur est admin
  if (user && user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <div className="bg-red-100 text-red-700 p-6 rounded-xl">
            <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
            <p>Seuls les administrateurs peuvent accéder au back-office.</p>
          </div>
        </div>
      </div>
    );
  }

  // Authentifié et admin
  return <>{children}</>;
}
