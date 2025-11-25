'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { usersApi, type User } from '@/lib/api';
import { User as UserIcon, Shield, ShieldOff, Loader2, Euro, TrendingUp, MoreVertical, Search, Filter, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/csv-utils';
import toast from 'react-hot-toast';
import { useDebounce } from 'use-debounce';
import Pagination from '@/components/Pagination';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300); // Debounce de 300ms
  const [filterType, setFilterType] = useState<'all' | 'event_based' | 'unlimited'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

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
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erreur lors du chargement des utilisateurs');
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
      toast.success(`Rôle mis à jour avec succès : ${newRole}`);
      // Recharger la liste
      await loadUsers();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour du rôle');
      console.error('Error updating role:', err);
    } finally {
      setUpdatingUserId(null);
    }
  };

  // Exporter les utilisateurs en CSV (sécurisé contre XSS)
  const handleExportUsers = () => {
    const headers = [
      'ID',
      'Email',
      'Prénom',
      'Nom',
      'Association',
      'Rôle',
      'Onboarding complété',
      'Type abonnement',
      'Statut abonnement',
      'Prix abonnement (€)',
      'Date début abonnement',
      'Date fin abonnement',
      'Stripe Customer ID',
      'Stripe Subscription ID',
      'Date de création',
      'Date de mise à jour'
    ];

    const rows = users.map(user => [
      user.id,
      user.email,
      user.firstName,
      user.lastName,
      user.association,
      user.role,
      user.onboardingCompleted ? 'Oui' : 'Non',
      user.subscriptionType === 'event_based' ? 'Adhésion Événementielle' : user.subscriptionType === 'unlimited' ? 'Adhésion Illimitée' : '',
      user.subscriptionStatus,
      user.subscriptionPriceCents ? (user.subscriptionPriceCents / 100).toFixed(2) : '',
      user.subscriptionStartDate,
      user.subscriptionEndDate,
      user.stripeCustomerId,
      user.stripeSubscriptionId,
      user.createdAt,
      user.updatedAt
    ]);

    const filename = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(filename, headers, rows);
    toast.success(`${users.length} utilisateurs exportés avec succès`);
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

  // Filtrer les utilisateurs (avec debounce sur la recherche)
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Recherche par nom, prénom, email (debouncée)
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesSearch =
        !debouncedSearchTerm ||
        user.email.toLowerCase().includes(searchLower) ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower);

      // Filtre par type d'abonnement
      const matchesType = filterType === 'all' || user.subscriptionType === filterType;

      // Filtre par statut d'abonnement
      const matchesStatus = filterStatus === 'all' || user.subscriptionStatus === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [users, debouncedSearchTerm, filterType, filterStatus]);

  // Calculer les données paginées
  const { paginatedUsers, totalPages } = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;

    return {
      paginatedUsers: filteredUsers.slice(startIndex, endIndex),
      totalPages: Math.ceil(filteredUsers.length / ITEMS_PER_PAGE),
    };
  }, [filteredUsers, currentPage, ITEMS_PER_PAGE]);

  // Réinitialiser à la page 1 quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterType, filterStatus]);

  // Calculer les statistiques d'abonnements (basées sur les utilisateurs filtrés)
  const subscriptionStats = {
    totalRevenue: filteredUsers.reduce((sum, user) => {
      return sum + (user.subscriptionPriceCents || 0);
    }, 0),
    activeSubscriptions: filteredUsers.filter(user => user.subscriptionStatus === 'ACTIVE').length,
  };

  // Format type d'abonnement - Affiche le nom réel du plan
  const formatSubscriptionType = (type: 'event_based' | 'unlimited' | null) => {
    if (!type) return '-';
    const subscriptionNames = {
      event_based: 'Adhésion Événementielle',
      unlimited: 'Adhésion Illimitée',
    };
    return subscriptionNames[type] || '-';
  };

  // Format statut d'abonnement
  const formatSubscriptionStatus = (status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | null) => {
    if (!status) return null;
    const statusConfig = {
      ACTIVE: { label: 'Actif', className: 'bg-green-100 text-green-700' },
      INACTIVE: { label: 'Inactif', className: 'bg-gray-100 text-gray-700' },
      EXPIRED: { label: 'Expiré', className: 'bg-red-100 text-red-700' },
    };
    return statusConfig[status];
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Utilisateurs</h1>
            <p className="text-sm md:text-base text-neutral-600 mt-1 md:mt-2">
              {!loading && `${filteredUsers.length} utilisateur${filteredUsers.length > 1 ? 's' : ''} affiché${filteredUsers.length > 1 ? 's' : ''} sur ${users.length}`}
            </p>
          </div>
          {!loading && users.length > 0 && (
            <button
              onClick={handleExportUsers}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors font-medium whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exporter les utilisateurs</span>
              <span className="sm:hidden">Exporter</span>
            </button>
          )}
        </div>

        {/* Recherche et filtres */}
        {!loading && !error && (
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Barre de recherche */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, prénom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
              </div>

              {/* Filtre type d'abonnement */}
              <div className="w-full md:w-64">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="all">Tous les types</option>
                  <option value="event_based">Adhésion Événementielle</option>
                  <option value="unlimited">Adhésion Illimitée</option>
                </select>
              </div>

              {/* Filtre statut d'abonnement */}
              <div className="w-full md:w-64">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="ACTIVE">Actif</option>
                  <option value="INACTIVE">Inactif</option>
                  <option value="EXPIRED">Expiré</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques d'abonnements */}
        {!loading && !error && users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chiffre d'affaires total */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-1">
                    Chiffre d&apos;affaires total
                  </p>
                  <p className="text-3xl font-bold text-neutral-900">
                    {(subscriptionStats.totalRevenue / 100).toFixed(2)} €
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Euro className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                Somme de tous les abonnements
              </p>
            </div>

            {/* Abonnements actifs */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-1">
                    Abonnements actifs
                  </p>
                  <p className="text-3xl font-bold text-neutral-900">
                    {subscriptionStats.activeSubscriptions}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-brand" />
                </div>
              </div>
              <p className="text-xs text-neutral-500 mt-3">
                Utilisateurs avec abonnement actif
              </p>
            </div>
          </div>
        )}

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
        {!loading && !error && filteredUsers.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
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
                      Type abonnement
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                      Statut abonnement
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
                  {paginatedUsers.map((user) => (
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
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
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

                      {/* Type abonnement */}
                      <td className="px-6 py-4">
                        <span className="text-sm text-neutral-700">
                          {formatSubscriptionType(user.subscriptionType)}
                        </span>
                      </td>

                      {/* Statut abonnement */}
                      <td className="px-6 py-4">
                        {user.subscriptionStatus ? (
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${formatSubscriptionStatus(user.subscriptionStatus)?.className
                              }`}
                          >
                            {formatSubscriptionStatus(user.subscriptionStatus)?.label}
                          </span>
                        ) : (
                          <span className="text-sm text-neutral-400">-</span>
                        )}
                      </td>

                      {/* Onboarding */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${user.onboardingCompleted
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
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                            disabled={updatingUserId === user.id}
                          >
                            {updatingUserId === user.id ? (
                              <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
                            ) : (
                              <MoreVertical className="w-5 h-5 text-neutral-600" />
                            )}
                          </button>

                          {/* Menu déroulant */}
                          {openMenuId === user.id && (
                            <>
                              {/* Overlay pour fermer le menu */}
                              <div
                                className="fixed inset-0 z-[90]"
                                onClick={() => setOpenMenuId(null)}
                              />

                              {/* Menu */}
                              <div className="absolute right-0 top-10 z-[100] w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1">
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    handleRoleChange(user.id, user.role);
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-neutral-50 transition-colors flex items-center gap-3"
                                >
                                  {user.role === 'admin' ? (
                                    <>
                                      <ShieldOff className="w-4 h-4 text-neutral-600" />
                                      <span className="text-sm text-neutral-700">Retirer admin</span>
                                    </>
                                  ) : (
                                    <>
                                      <Shield className="w-4 h-4 text-brand" />
                                      <span className="text-sm text-neutral-700">Promouvoir admin</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredUsers.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Empty State - Aucun résultat */}
        {!loading && !error && users.length > 0 && filteredUsers.length === 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <Filter className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Aucun résultat
            </h3>
            <p className="text-neutral-600 mb-4">
              Aucun utilisateur ne correspond à vos critères de recherche.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterStatus('all');
              }}
              className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Empty State - Aucun utilisateur */}
        {!loading && !error && users.length === 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <UserIcon className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Aucun utilisateur
            </h3>
            <p className="text-neutral-600">
              Il n&apos;y a aucun utilisateur enregistré pour le moment.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
