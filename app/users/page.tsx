'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { usersApi, type User } from '@/lib/api';
import { User as UserIcon, Shield, ShieldOff, Loader2 } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Charger les utilisateurs
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getAll();
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Changer le rôle d'un utilisateur
  const handleRoleChange = async (userId: string, currentRole: 'user' | 'admin') => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const confirmMessage = `Êtes-vous sûr de vouloir changer le rôle en "${newRole}" ?`;
    
    if (!confirm(confirmMessage)) return;

    try {
      setUpdatingUserId(userId);
      await usersApi.updateRole(userId, newRole);
      // Recharger la liste
      await loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erreur lors de la mise à jour du rôle');
      console.error('Error updating role:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Utilisateurs</h1>
            <p className="text-neutral-600 mt-2">
              {!loading && `${users.length} utilisateur${users.length > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Users Table */}
        {!loading && !error && users.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                      Utilisateur
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                      Association
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                      Rôle
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                      Onboarding
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                      Date de création
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                      {/* Utilisateur */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-brand" />
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : 'Non renseigné'}
                            </div>
                            <div className="text-sm text-neutral-500">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Association */}
                      <td className="px-6 py-4">
                        <span className="text-neutral-700">
                          {user.association || 'Non renseignée'}
                        </span>
                      </td>

                      {/* Rôle */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin'
                              ? 'bg-brand/10 text-brand'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {user.role === 'admin' ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <UserIcon className="w-3 h-3" />
                          )}
                          {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
                        </span>
                      </td>

                      {/* Onboarding */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                            user.onboardingCompleted
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {user.onboardingCompleted ? 'Complété' : 'En cours'}
                        </span>
                      </td>

                      {/* Date de création */}
                      <td className="px-6 py-4 text-sm text-neutral-600">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleRoleChange(user.id, user.role)}
                          disabled={updatingUserId === user.id}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingUserId === user.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Mise à jour...</span>
                            </>
                          ) : (
                            <>
                              {user.role === 'admin' ? (
                                <ShieldOff className="w-4 h-4" />
                              ) : (
                                <Shield className="w-4 h-4" />
                              )}
                              <span>
                                {user.role === 'admin' ? 'Retirer admin' : 'Promouvoir admin'}
                              </span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && users.length === 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <UserIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Aucun utilisateur
            </h3>
            <p className="text-neutral-600">
              Il n'y a aucun utilisateur enregistré pour le moment.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
