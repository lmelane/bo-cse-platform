'use client';

import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { dashboardApi } from '@/lib/api';
import { Loader2 } from 'lucide-react';

type DashboardStats = Awaited<ReturnType<typeof dashboardApi.getStats>>;

export default function DashboardPage() {
  const { data: stats, isLoading: loading, error: queryError } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    staleTime: 30000, // 30s avant refresh
  });

  const error = queryError
    ? 'Erreur lors du chargement des données'
    : null;

  const formatCurrency = (cents: number) => `${(cents / 100).toFixed(2)} \u20AC`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-sm md:text-base text-neutral-500 mt-1 md:mt-2">
            Vue d&apos;ensemble de votre activit&eacute;
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* KPIs Principaux */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">ARR</p>
                <p className="text-3xl font-bold text-neutral-900">{formatCurrency(stats.financial.arr)}</p>
                <p className="text-xs text-neutral-400 mt-2">Revenue annuel r&eacute;current</p>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">MRR</p>
                <p className="text-3xl font-bold text-neutral-900">{formatCurrency(stats.financial.mrr)}</p>
                <p className="text-xs text-neutral-400 mt-2">Revenue mensuel r&eacute;current</p>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">Abonn&eacute;s</p>
                <p className="text-3xl font-bold text-neutral-900">{stats.financial.activeSubscriptions}</p>
                <p className="text-sm text-neutral-500 mt-2">sur {stats.totalUsers} total</p>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">Churn</p>
                <p className="text-3xl font-bold text-neutral-900">{stats.financial.churnRate.toFixed(1)}%</p>
                <p className="text-xs text-neutral-400 mt-2">{stats.financial.expiredSubscriptions} expir&eacute;s</p>
              </div>
            </div>

            {/* Métriques Secondaires */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">ARPU</p>
                <p className="text-2xl font-bold text-neutral-900">{formatCurrency(stats.financial.arpu)}</p>
                <p className="text-xs text-neutral-400 mt-2">Revenue moyen par utilisateur</p>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">Taux de conversion</p>
                <p className="text-2xl font-bold text-neutral-900">{stats.financial.conversionRate.toFixed(1)}%</p>
                <p className="text-xs text-neutral-400 mt-2">Utilisateurs abonn&eacute;s</p>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">CA Total</p>
                <p className="text-2xl font-bold text-neutral-900">{formatCurrency(stats.financial.totalRevenue)}</p>
                <p className="text-xs text-neutral-400 mt-2">Abonnements cumul&eacute;s</p>
              </div>
            </div>

            {/* Répartition par Type */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-6">R&eacute;partition des abonnements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-4">Adh&eacute;sion &Eacute;v&eacute;nementielle</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Nombre d&apos;abonn&eacute;s</span>
                      <span className="text-lg font-bold text-neutral-900">{stats.financial.eventBasedCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Prix unitaire</span>
                      <span className="text-sm font-medium text-neutral-700">35,00 &euro; / an</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-neutral-700 mb-4">Adh&eacute;sion Illimit&eacute;e</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Nombre d&apos;abonn&eacute;s</span>
                      <span className="text-lg font-bold text-neutral-900">{stats.financial.unlimitedCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Prix unitaire</span>
                      <span className="text-sm font-medium text-neutral-700">235,00 &euro; / an</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Événements */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-6">&Eacute;v&eacute;nements</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">Total</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.events.total}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">&Agrave; venir</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.events.upcoming}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">Pass&eacute;s</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.events.past}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">Annul&eacute;s</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.events.cancelled}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">En ligne</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.events.online}</p>
                </div>
              </div>
            </div>

            {/* Participation */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-6">Participation</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-neutral-500 mb-1">R&eacute;servations</p>
                  <p className="text-3xl font-bold text-neutral-900">{stats.participants.totalBookings}</p>
                  <p className="text-xs text-neutral-400 mt-2">
                    Moy. {stats.participants.averagePerEvent.toFixed(1)}/&eacute;v&eacute;nement
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Invit&eacute;s</p>
                  <p className="text-3xl font-bold text-neutral-900">{stats.participants.totalGuests}</p>
                  <p className="text-xs text-neutral-400 mt-2">
                    {stats.participants.guestsValidated} valid&eacute;s, {stats.participants.guestsPending} en attente
                  </p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">CA &Eacute;v&eacute;nements</p>
                  <p className="text-3xl font-bold text-neutral-900">{formatCurrency(stats.participants.totalRevenue)}</p>
                  <p className="text-xs text-neutral-400 mt-2">Billetterie</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500 mb-1">Places r&eacute;serv&eacute;es</p>
                  <p className="text-3xl font-bold text-neutral-900">{stats.participants.totalPlaces}</p>
                  <p className="text-xs text-neutral-400 mt-2">Total</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
