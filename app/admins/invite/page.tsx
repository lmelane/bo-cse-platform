'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi, adminsApi, type AdminUser } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { UserPlus, Mail, Check, AlertCircle, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function AdminStatusBadge({ status }: { status: AdminUser['status'] }) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
        En attente
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
      Actif
    </span>
  );
}

function RoleBadge({ role }: { role: AdminUser['role'] }) {
  if (role === 'superadmin') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
        Super Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-50 text-neutral-600 border border-neutral-200">
      Admin
    </span>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function AdminListTable() {
  const { data: admins = [], isLoading, error } = useQuery<AdminUser[]>({
    queryKey: ['admins'],
    queryFn: async () => {
      const response = await adminsApi.getAll();
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
        <span className="ml-2 text-xs text-neutral-500">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-red-500">
        <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
        Erreur lors du chargement des administrateurs
      </div>
    );
  }

  if (admins.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-neutral-400">
        Aucun administrateur
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
            <th className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">Role</th>
            <th className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">Date de creation</th>
            <th className="px-4 py-2 text-xs font-medium text-neutral-500 uppercase tracking-wider">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {admins.map((admin) => (
            <tr key={admin.id} className="hover:bg-neutral-50/50 transition-colors">
              <td className="px-4 py-2.5 text-sm text-neutral-900 font-medium">{admin.email}</td>
              <td className="px-4 py-2.5"><RoleBadge role={admin.role} /></td>
              <td className="px-4 py-2.5 text-xs text-neutral-500">{formatDate(admin.createdAt)}</td>
              <td className="px-4 py-2.5"><AdminStatusBadge status={admin.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InviteAdminPage() {
  const { isSuperAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <h2 className="text-sm font-semibold text-neutral-900 mb-1">Acces refuse</h2>
            <p className="text-xs text-neutral-500">Seul le super-administrateur peut inviter des administrateurs.</p>
          </div>
        </div>
      </AdminLayout>
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
      toast.success(result.message || 'Invitation envoyee');
      // Refresh the admin list after successful invite
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-neutral-900">Inviter un administrateur</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Envoyez une invitation par email. Le nouvel administrateur recevra un lien pour creer son mot de passe.
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-900">Invitation envoyee</h3>
                <p className="text-xs text-green-700 mt-0.5">
                  L&apos;administrateur recevra un email avec un lien pour configurer son acces.
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

            <div className="p-4 space-y-3">
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

              <p className="text-xs text-neutral-400">
                Un email d&apos;invitation sera envoye avec un lien pour definir le mot de passe. Le lien est valable 7 jours.
              </p>
            </div>

            <div className="px-4 pb-4 flex gap-2">
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

        {/* Admin list */}
        <div className="mt-8 bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-500" />
            <h2 className="text-sm font-semibold text-neutral-700">Administrateurs</h2>
          </div>
          <AdminListTable />
        </div>
      </div>
    </AdminLayout>
  );
}
