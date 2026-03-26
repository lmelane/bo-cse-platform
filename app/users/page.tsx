'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { usersApi, type User } from '@/lib/api';
import { Loader2, Search, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/csv-utils';
import toast from 'react-hot-toast';
import { useDebounce } from 'use-debounce';
import { ITEMS_PER_PAGE_USERS, SEARCH_DEBOUNCE_MS } from '@/lib/config';
import Pagination from '@/components/Pagination';
import UserDetailsModal from '@/components/UserDetailsModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function Dot({ color }: { color: string }) {
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
}

export default function UsersPage() {
  const { data: users = [], isLoading, error: queryError } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => { const r = await usersApi.getAll(); return r.data; },
  });

  const error = queryError ? 'Erreur lors du chargement' : null;

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'EXPIRED'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filterStatus]);

  const filtered = useMemo(() => users.filter(u => {
    const s = debouncedSearch.toLowerCase();
    const matchSearch = !s || [u.email, u.firstName, u.lastName].some(v => v?.toLowerCase().includes(s));
    const matchStatus = filterStatus === 'all' || u.subscriptionStatus === filterStatus;
    return matchSearch && matchStatus;
  }), [users, debouncedSearch, filterStatus]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE_USERS);
  const paginated = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE_USERS;
    return filtered.slice(s, s + ITEMS_PER_PAGE_USERS);
  }, [filtered, currentPage]);

  const handleExport = () => {
    const headers = ['Nom', 'Email', 'Association', 'Abonnement', 'Statut', 'Date inscription'];
    const rows = filtered.map(u => [
      `${u.firstName || ''} ${u.lastName || ''}`.trim() || '—',
      u.email, u.association || '—',
      u.subscriptionType === 'unlimited' ? 'Illimitée' : u.subscriptionType === 'event_based' ? 'Événementielle' : '—',
      u.subscriptionStatus || '—',
      u.createdAt ? format(new Date(u.createdAt), 'dd/MM/yyyy', { locale: fr }) : '—',
    ]);
    exportToCSV(`utilisateurs_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    toast.success(`${rows.length} utilisateurs exportés`);
  };

  const handleViewUser = async (user: User) => {
    try {
      const r = await usersApi.getById(user.id);
      setSelectedUser(r.data);
      setIsDetailsOpen(true);
    } catch { toast.error('Erreur de chargement'); }
  };

  const activeCount = users.filter(u => u.subscriptionStatus === 'ACTIVE').length;

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-neutral-900">Utilisateurs</h1>
          {filtered.length > 0 && (
            <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 font-medium">
              <Download className="w-3.5 h-3.5" /> Exporter
            </button>
          )}
        </div>

        {/* KPIs inline */}
        {!isLoading && (
          <div className="flex items-center gap-5 text-xs text-neutral-500">
            <span><strong className="text-neutral-900 font-semibold">{users.length}</strong> inscrits</span>
            <span><strong className="text-neutral-900 font-semibold">{activeCount}</strong> abonnés actifs</span>
            <span><strong className="text-neutral-900 font-semibold">{users.length - activeCount}</strong> inactifs/expirés</span>
          </div>
        )}

        {/* Filters */}
        {!isLoading && !error && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text" value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher..."
                className="w-full h-9 pl-10 pr-3 border border-neutral-200 rounded-md text-sm bg-white focus:outline-none focus:border-neutral-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="h-9 px-3 border border-neutral-200 rounded-md text-sm bg-white focus:outline-none focus:border-neutral-400"
            >
              <option value="all">Tous</option>
              <option value="ACTIVE">Actifs</option>
              <option value="EXPIRED">Expirés</option>
            </select>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-4 h-4 animate-spin text-neutral-400" /></div>
        ) : error ? (
          <div className="bg-white rounded-md border border-neutral-200 p-4 text-sm text-neutral-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-md border border-neutral-200 p-8 text-center">
            <p className="text-sm text-neutral-500">{users.length === 0 ? 'Aucun utilisateur' : 'Aucun résultat'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-2.5 text-left text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Utilisateur</th>
                  <th className="px-4 py-2.5 text-left text-[11px] text-neutral-500 uppercase tracking-wider font-medium hidden md:table-cell">Abonnement</th>
                  <th className="px-4 py-2.5 text-left text-[11px] text-neutral-500 uppercase tracking-wider font-medium hidden sm:table-cell">Inscription</th>
                  <th className="px-4 py-2.5 text-right text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleViewUser(user)}
                    className="border-b border-neutral-100 cursor-pointer hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <p className="text-sm font-medium text-neutral-900">
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Non renseigné'}
                      </p>
                      <p className="text-[11px] text-neutral-400">{user.email}</p>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-neutral-600 hidden md:table-cell">
                      {user.subscriptionType === 'unlimited' ? 'Illimitée' : user.subscriptionType === 'event_based' ? 'Événementielle' : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-neutral-500 hidden sm:table-cell whitespace-nowrap">
                      {user.createdAt ? format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr }) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600">
                        <Dot color={user.subscriptionStatus === 'ACTIVE' ? 'bg-green-500' : 'bg-neutral-300'} />
                        {user.subscriptionStatus === 'ACTIVE' ? 'Actif' : user.subscriptionStatus === 'EXPIRED' ? 'Expiré' : 'Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-neutral-100">
                <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE_USERS} onPageChange={setCurrentPage} />
              </div>
            )}
          </div>
        )}
      </div>

      <UserDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        user={selectedUser}
      />
    </AdminLayout>
  );
}
