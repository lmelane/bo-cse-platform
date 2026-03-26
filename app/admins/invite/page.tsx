'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi } from '@/lib/api';
import { UserPlus, Mail, Check, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function InviteAdminPage() {
  const { isSuperAdmin } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
          <h2 className="text-sm font-semibold text-neutral-900 mb-1">Accès refusé</h2>
          <p className="text-xs text-neutral-500">Seul le super-administrateur peut inviter des administrateurs.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const result = await usersApi.inviteAdmin(email.trim().toLowerCase());
      setSuccess(true);
      setEmail('');
      toast.success(result.message || 'Invitation envoyée');
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-neutral-900">Inviter un administrateur</h1>
        <p className="text-sm text-neutral-500 mt-1">
          Envoyez une invitation par email. Le nouvel administrateur recevra un lien pour créer son mot de passe.
        </p>
      </div>

      {success ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-green-900">Invitation envoyée</h3>
              <p className="text-xs text-green-700 mt-0.5">
                L&apos;administrateur recevra un email avec un lien pour configurer son accès.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSuccess(false)}
            className="mt-3 text-xs text-green-700 hover:text-green-900 font-medium hover:underline"
          >
            Inviter un autre administrateur
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-semibold text-neutral-700">Nouvel administrateur</h2>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label htmlFor="admin-email" className="block text-xs font-medium text-neutral-700 mb-1">
                Adresse email <span className="text-brand">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full h-9 pl-10 pr-3 border border-neutral-200 rounded-md text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>

            <p className="text-xs text-neutral-500">
              Un email d&apos;invitation sera envoyé avec un lien pour définir le mot de passe. Le lien est valable 7 jours.
            </p>
          </div>

          <div className="px-4 pb-4 flex gap-2">
            <button
              type="button"
              onClick={() => router.push('/users')}
              className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-md transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="px-4 py-1.5 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isLoading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Envoi...
                </span>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5" />
                  Envoyer l&apos;invitation
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
