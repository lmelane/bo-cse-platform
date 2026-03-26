'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { usersApi, type User } from '@/lib/api';
import { User as UserIcon, Shield, Loader2, Euro, TrendingUp, MoreVertical, Search, Filter, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/csv-utils';
import toast from 'react-hot-toast';
import { useDebounce } from 'use-debounce';
import { ITEMS_PER_PAGE_USERS, SEARCH_DEBOUNCE_MS } from '@/lib/config';
import Pagination from '@/components/Pagination';
import UserDetailsModal from '@/components/UserDetailsModal';

export default function UsersPage() {
  const { data: users = [], isLoading: loading, error: queryError } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersApi.getAll();
      return response.data;
    },
  });

  const error = queryError ? (queryError as { response?: { data?: { message?: string } } }).response?.data?.message || 'Erreur lors du chargement des utilisateurs' : null;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  const [filterType, setFilterType] = useState<'all' | 'event_based' | 'unlimited'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'EXPIRED'>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = ITEMS_PER_PAGE_USERS;

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

    // BO-CSV fix: exporter les utilisateurs filtrés, pas tous
    const rows = filteredUsers.map(user => [
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
    toast.success(`${filteredUsers.length} utilisateurs exportés avec succès`);
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
      <div className="space-y-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-neutral-900">Utilisateurs</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {!loading && `${filteredUsers.length} utilisateur${filteredUsers.length > 1 ? 's' : ''} affiché${filteredUsers.length > 1 ? 's' : ''} sur ${users.length}`}
            </p>
          </div>
          {!loading && users.length > 0 && (
            <button
              onClick={handleExportUsers}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-md transition-colors font-medium text-xs whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exporter les utilisateurs</span>
              <span className="sm:hidden">Exporter</span>
            </button>
          )}
        </div>

        {/* Recherche et filtres */}
        {!loading && !error && (
          <div className="bg-white rounded-md border border-neutral-200 p-3">
            <div className="flex flex-col md:flex-row gap-2.5">
              {/* Barre de recherche */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, prénom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              {/* Filtre type d'abonnement */}
              <div className="w-full md:w-52">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                  className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                >
                  <option value="all">Tous les types</option>
                  <option value="event_based">Adhésion Événementielle</option>
                  <option value="unlimited">Adhésion Illimitée</option>
                </select>
              </div>

              {/* Filtre statut d'abonnement */}
              <div className="w-full md:w-48">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                  className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Chiffre d'affaires total */}
            <div className="bg-white rounded-md border border-neutral-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-0.5">
                    Chiffre d&apos;affaires total
                  </p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {(subscriptionStats.totalRevenue / 100).toFixed(2)} €
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                  <Euro className="w-3.5 h-3.5 text-green-600" />
                </div>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Somme de tous les abonnements
              </p>
            </div>

            {/* Abonnements actifs */}
            <div className="bg-white rounded-md border border-neutral-200 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500 mb-0.5">
                    Abonnements actifs
                  </p>
                  <p className="text-lg font-semibold text-neutral-900">
                    {subscriptionStats.activeSubscriptions}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand/5 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-brand" />
                </div>
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
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
          <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <th className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                      Utilisateur
                    </th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                      Association
                    </th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                      Rôle
                    </th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                      Type abonnement
                    </th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                      Statut abonnement
                    </th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                      Onboarding
                    </th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                      Date de création
                    </th>
                    <th className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {paginatedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-neutral-50 transition-colors">
                      {/* Utilisateur */}
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand/5 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="w-3.5 h-3.5 text-brand" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-neutral-900 truncate">
                              {user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : 'Non renseigné'}
                            </div>
                            <div className="text-xs text-neutral-500 truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Association */}
                      <td className="px-3 py-1.5">
                        <span className="text-neutral-700">
                          {user.association || 'Non renseignée'}
                        </span>
                      </td>

                      {/* Rôle */}
                      <td className="px-3 py-1.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${user.role.toLowerCase() === 'admin'
                            ? 'bg-brand/10 text-brand'
                            : 'bg-neutral-100 text-neutral-700'
                            }`}
                        >
                          {user.role.toLowerCase() === 'admin' ? (
                            <Shield className="w-3 h-3" />
                          ) : (
                            <UserIcon className="w-3 h-3" />
                          )}
                          {user.role.toLowerCase() === 'admin' ? 'Admin' : 'Utilisateur'}
                        </span>
                      </td>

                      {/* Type abonnement */}
                      <td className="px-3 py-1.5">
                        <span className="text-sm text-neutral-700">
                          {formatSubscriptionType(user.subscriptionType)}
                        </span>
                      </td>

                      {/* Statut abonnement */}
                      <td className="px-3 py-1.5">
                        {user.subscriptionStatus ? (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${formatSubscriptionStatus(user.subscriptionStatus)?.className
                              }`}
                          >
                            {formatSubscriptionStatus(user.subscriptionStatus)?.label}
                          </span>
                        ) : (
                          <span className="text-sm text-neutral-400">-</span>
                        )}
                      </td>

                      {/* Onboarding */}
                      <td className="px-3 py-1.5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium ${user.onboardingCompleted
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                            }`}
                        >
                          {user.onboardingCompleted ? 'Complété' : 'En cours'}
                        </span>
                      </td>

                      {/* Date de création */}
                      <td className="px-3 py-2.5 text-sm text-neutral-600">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-1.5">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-neutral-600" />
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
                                  onClick={async () => {
                                    setOpenMenuId(null);
                                    // Récupérer les détails complets de l'utilisateur
                                    try {
                                      const response = await usersApi.getById(user.id);
                                      setSelectedUser(response.data);
                                      setIsDetailsModalOpen(true);
                                    } catch {
                                      toast.error('Erreur lors du chargement des détails');
                                    }
                                  }}
                                  className="w-full text-left px-4 py-2 hover:bg-neutral-50 transition-colors flex items-center gap-3"
                                >
                                  <UserIcon className="w-4 h-4 text-neutral-600" />
                                  <span className="text-sm text-neutral-700">Voir les détails</span>
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
          <div className="bg-white rounded-md border border-neutral-200 p-6 text-center">
            <Filter className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-900 mb-1.5">
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
              className="px-3 py-1.5 text-xs bg-brand text-white rounded-md hover:bg-brand-dark transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Empty State - Aucun utilisateur */}
        {!loading && !error && users.length === 0 && (
          <div className="bg-white rounded-md border border-neutral-200 p-6 text-center">
            <UserIcon className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-900 mb-1.5">
              Aucun utilisateur
            </h3>
            <p className="text-neutral-600">
              Il n&apos;y a aucun utilisateur enregistré pour le moment.
            </p>
          </div>
        )}
      </div>

      {/* Modal de détails utilisateur */}
      <UserDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        user={selectedUser}
      />
    </AdminLayout>
  );
}
