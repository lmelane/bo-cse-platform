'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { usersApi, adminsApi, type AdminUser } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';
import { Mail, Check, AlertCircle, Users, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function StatusBadge({ status }: { status: AdminUser['status'] }) {
  const dotColor = status === 'pending' ? 'bg-blue-500' : 'bg-green-500';
  const label = status === 'pending' ? 'En attente' : 'Actif';

  return (
    <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-[11px]">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
    </span>
  );
}

function RoleBadge({ role }: { role: AdminUser['role'] }) {
  const dotColor = role === 'superadmin' ? 'bg-purple-500' : 'bg-neutral-400';
  const label = role === 'superadmin' ? 'Super Admin' : 'Admin';

  return (
    <span className="inline-flex items-center gap-1.5 bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-[11px]">
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      {label}
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
      <div className="flex items-center justify-center py-8 text-xs text-neutral-500">
        <AlertCircle className="w-4 h-4 text-neutral-400 mr-1.5" />
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
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-neutral-200">
          <th className="px-4 py-2 text-xs font-medium text-neutral-500">Email</th>
          <th className="px-4 py-2 text-xs font-medium text-neutral-500">Role</th>
          <th className="px-4 py-2 text-xs font-medium text-neutral-500">Date de creation</th>
          <th className="px-4 py-2 text-xs font-medium text-neutral-500">Statut</th>
        </tr>
      </thead>
      <tbody>
        {admins.map((admin) => (
          <tr key={admin.id} className="border-b border-neutral-100">
            <td className="px-4 py-2.5 text-sm text-neutral-900">{admin.email}</td>
            <td className="px-4 py-2.5"><RoleBadge role={admin.role} /></td>
            <td className="px-4 py-2.5 text-sm text-neutral-500">{formatDate(admin.createdAt)}</td>
            <td className="px-4 py-2.5"><StatusBadge status={admin.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
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
            <AlertCircle className="w-4 h-4 text-neutral-400 mx-auto mb-2" />
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
      queryClient.invalidateQueries({ queryKey: ['admins'] });
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Erreur lors de l'envoi");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="w-full">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-base font-semibold text-neutral-900">Inviter un administrateur</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Envoyez une invitation par email. Le nouvel administrateur recevra un lien pour creer son mot de passe.
          </p>
        </div>

        {/* Invite form card */}
        <div className="bg-white border border-neutral-200 rounded-lg p-4 mb-6">
          {success ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Check className="w-4 h-4 text-green-500" />
                <span>Invitation envoyee. L&apos;administrateur recevra un email avec un lien pour configurer son acces.</span>
              </div>
              <button
                onClick={() => setSuccess(false)}
                className="text-xs text-neutral-500 hover:text-neutral-900 font-medium whitespace-nowrap ml-4"
              >
                Inviter un autre
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <label htmlFor="admin-email" className="text-xs text-neutral-500 whitespace-nowrap">
                Email
              </label>
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full h-9 pl-10 pr-3 border border-neutral-200 rounded-md text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-200"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="h-9 px-4 text-sm font-medium text-white bg-brand rounded-md hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                {isLoading ? 'Envoi...' : "Envoyer l'invitation"}
              </button>
            </form>
          )}
        </div>

        {/* Admin list */}
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-200 flex items-center gap-2">
            <Users className="w-4 h-4 text-neutral-400" />
            <h2 className="text-sm font-medium text-neutral-900">Administrateurs</h2>
          </div>
          <AdminListTable />
        </div>
      </div>
    </AdminLayout>
  );
}
