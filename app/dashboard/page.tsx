'use client';

import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { dashboardApi } from '@/lib/api';
import { DASHBOARD_STALE_TIME, SUBSCRIPTION_PRICES } from '@/lib/config';
import { Loader2 } from 'lucide-react';

type DashboardStats = Awaited<ReturnType<typeof dashboardApi.getStats>>;

export default function DashboardPage() {
  const { data: stats, isLoading: loading, error: queryError } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    staleTime: DASHBOARD_STALE_TIME,
  });

  const error = queryError
    ? 'Erreur lors du chargement des données'
    : null;

  const formatCurrency = (cents: number) => `${(cents / 100).toFixed(2)} \u20AC`;

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-base font-semibold text-neutral-900">Dashboard</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Vue d&apos;ensemble de votre activit&eacute;
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-brand" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* KPIs Principaux */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-md border border-neutral-200 p-3 hover:border-brand/40 transition-colors">
                <p className="text-xs text-neutral-500 mb-0.5">ARR</p>
                <p className="text-lg font-semibold text-neutral-900">{formatCurrency(stats.financial.arr)}</p>
                <p className="text-[11px] text-neutral-400 mt-1">Revenue annuel r&eacute;current</p>
              </div>

              <div className="bg-white rounded-md border border-neutral-200 p-3 hover:border-brand/40 transition-colors">
                <p className="text-xs text-neutral-500 mb-0.5">MRR</p>
                <p className="text-lg font-semibold text-neutral-900">{formatCurrency(stats.financial.mrr)}</p>
                <p className="text-[11px] text-neutral-400 mt-1">Revenue mensuel r&eacute;current</p>
              </div>

              <div className="bg-white rounded-md border border-neutral-200 p-3 hover:border-brand/40 transition-colors">
                <p className="text-xs text-neutral-500 mb-0.5">Abonn&eacute;s</p>
                <p className="text-lg font-semibold text-neutral-900">{stats.financial.activeSubscriptions}</p>
                <p className="text-[11px] text-neutral-500 mt-1">sur {stats.totalUsers} total</p>
              </div>

              <div className="bg-white rounded-md border border-neutral-200 p-3 hover:border-brand/40 transition-colors">
                <p className="text-xs text-neutral-500 mb-0.5">Churn</p>
                <p className="text-lg font-semibold text-neutral-900">{stats.financial.churnRate.toFixed(1)}%</p>
                <p className="text-[11px] text-neutral-400 mt-1">{stats.financial.expiredSubscriptions} expir&eacute;s</p>
              </div>
            </div>

            {/* Métriques Secondaires */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-md border border-neutral-200 p-3 hover:border-brand/40 transition-colors">
                <p className="text-xs text-neutral-500 mb-0.5">ARPU</p>
                <p className="text-base font-semibold text-neutral-900">{formatCurrency(stats.financial.arpu)}</p>
                <p className="text-[11px] text-neutral-400 mt-1">Revenue moyen par utilisateur</p>
              </div>

              <div className="bg-white rounded-md border border-neutral-200 p-3 hover:border-brand/40 transition-colors">
                <p className="text-xs text-neutral-500 mb-0.5">Taux de conversion</p>
                <p className="text-base font-semibold text-neutral-900">{stats.financial.conversionRate.toFixed(1)}%</p>
                <p className="text-[11px] text-neutral-400 mt-1">Utilisateurs abonn&eacute;s</p>
              </div>

              <div className="bg-white rounded-md border border-neutral-200 p-3 hover:border-brand/40 transition-colors">
                <p className="text-xs text-neutral-500 mb-0.5">CA Total</p>
                <p className="text-base font-semibold text-neutral-900">{formatCurrency(stats.financial.totalRevenue)}</p>
                <p className="text-[11px] text-neutral-400 mt-1">Abonnements cumul&eacute;s</p>
              </div>
            </div>

            {/* Répartition par Type */}
            <div className="bg-white rounded-md border border-neutral-200 p-3">
              <h2 className="text-xs font-medium mb-2.5 uppercase tracking-wider text-neutral-500">R&eacute;partition des abonnements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <h3 className="text-xs font-medium text-neutral-700 mb-2">Adh&eacute;sion &Eacute;v&eacute;nementielle</h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">Nombre d&apos;abonn&eacute;s</span>
                      <span className="text-sm font-semibold text-neutral-900">{stats.financial.eventBasedCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">Prix unitaire</span>
                      <span className="text-xs font-medium text-neutral-700">{formatCurrency(SUBSCRIPTION_PRICES.event_based.cents)} / an</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-neutral-700 mb-2">Adh&eacute;sion Illimit&eacute;e</h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">Nombre d&apos;abonn&eacute;s</span>
                      <span className="text-sm font-semibold text-neutral-900">{stats.financial.unlimitedCount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-neutral-600">Prix unitaire</span>
                      <span className="text-xs font-medium text-neutral-700">{formatCurrency(SUBSCRIPTION_PRICES.unlimited.cents)} / an</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Événements */}
            <div className="bg-white rounded-md border border-neutral-200 p-3">
              <h2 className="text-xs font-medium mb-2.5 uppercase tracking-wider text-neutral-500">&Eacute;v&eacute;nements</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="text-center">
                  <p className="text-xs text-neutral-500 mb-0.5">Total</p>
                  <p className="text-base font-semibold text-neutral-900">{stats.events.total}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-neutral-500 mb-0.5">&Agrave; venir</p>
                  <p className="text-base font-semibold text-neutral-900">{stats.events.upcoming}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-neutral-500 mb-0.5">Pass&eacute;s</p>
                  <p className="text-base font-semibold text-neutral-900">{stats.events.past}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-neutral-500 mb-0.5">Annul&eacute;s</p>
                  <p className="text-base font-semibold text-neutral-900">{stats.events.cancelled}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-neutral-500 mb-0.5">En ligne</p>
                  <p className="text-base font-semibold text-neutral-900">{stats.events.online}</p>
                </div>
              </div>
            </div>

            {/* Participation */}
            <div className="bg-white rounded-md border border-neutral-200 p-3">
              <h2 className="text-xs font-medium mb-2.5 uppercase tracking-wider text-neutral-500">Participation</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-xs text-neutral-500 mb-0.5">R&eacute;servations</p>
                  <p className="text-lg font-semibold text-neutral-900">{stats.participants.totalBookings}</p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Moy. {stats.participants.averagePerEvent.toFixed(1)}/&eacute;v&eacute;nement
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-0.5">Invit&eacute;s</p>
                  <p className="text-lg font-semibold text-neutral-900">{stats.participants.totalGuests}</p>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    {stats.participants.guestsValidated} valid&eacute;s, {stats.participants.guestsPending} en attente
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-0.5">CA &Eacute;v&eacute;nements</p>
                  <p className="text-lg font-semibold text-neutral-900">{formatCurrency(stats.participants.totalRevenue)}</p>
                  <p className="text-[11px] text-neutral-400 mt-1">Billetterie</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-0.5">Places r&eacute;serv&eacute;es</p>
                  <p className="text-lg font-semibold text-neutral-900">{stats.participants.totalPlaces}</p>
                  <p className="text-[11px] text-neutral-400 mt-1">Total</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
