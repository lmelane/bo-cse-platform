'use client';

import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { dashboardApi } from '@/lib/api';
import { DASHBOARD_STALE_TIME, SUBSCRIPTION_PRICES } from '@/lib/config';
import {
  Loader2,
  TrendingUp,
  DollarSign,
  UserCheck,
  Repeat,
  CalendarDays,
  ArrowUpRight,
  Clock,
  XCircle,
  Globe,
} from 'lucide-react';

type DashboardStats = Awaited<ReturnType<typeof dashboardApi.getStats>>;

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 bg-white rounded-lg border border-neutral-200 p-4">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-neutral-50 border border-neutral-100">
        <Icon className="w-4 h-4 text-neutral-400" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-neutral-500 leading-none">{label}</p>
        <p className="text-lg font-semibold text-neutral-900 mt-1 leading-none">{value}</p>
        {sub && <p className="text-[11px] text-neutral-400 mt-1.5 leading-tight">{sub}</p>}
      </div>
    </div>
  );
}

function InlineRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-b-0">
      <span className="text-xs text-neutral-500">{label}</span>
      <div className="text-right">
        <span className="text-sm font-medium text-neutral-900">{value}</span>
        {sub && <span className="text-[11px] text-neutral-400 ml-1.5">{sub}</span>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    data: stats,
    isLoading: loading,
    error: queryError,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    staleTime: DASHBOARD_STALE_TIME,
  });

  const error = queryError ? 'Erreur lors du chargement des données' : null;

  const fmt = (cents: number) => {
    const euros = cents / 100;
    return euros >= 1000
      ? `${(euros / 1000).toFixed(1).replace(/\.0$/, '')}k \u20AC`
      : `${euros.toFixed(0)} \u20AC`;
  };

  const fmtFull = (cents: number) => `${(cents / 100).toFixed(2)} \u20AC`;

  return (
    <AdminLayout>
      <div className="max-w-5xl">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-base font-semibold text-neutral-900">Dashboard</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Vue d&apos;ensemble de votre activit&eacute;
          </p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-xs">
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* Revenue KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard
                icon={TrendingUp}
                label="ARR"
                value={fmt(stats.financial.arr)}
                sub="Revenu annuel r&eacute;current"
              />
              <StatCard
                icon={DollarSign}
                label="MRR"
                value={fmt(stats.financial.mrr)}
              />
              <StatCard
                icon={UserCheck}
                label="Abonn&eacute;s actifs"
                value={stats.financial.activeSubscriptions}
                sub={`sur ${stats.totalUsers} utilisateurs`}
              />
              <StatCard
                icon={Repeat}
                label="Churn"
                value={`${stats.financial.churnRate.toFixed(1)}%`}
                sub={`${stats.financial.expiredSubscriptions} expir&eacute;s`}
              />
            </div>

            {/* Secondary metrics + Subscription breakdown side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
              {/* Left: secondary financial metrics */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-neutral-200 p-4">
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-3">
                  M&eacute;triques financi&egrave;res
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-neutral-500">ARPU</p>
                    <p className="text-base font-semibold text-neutral-900 mt-0.5">
                      {fmtFull(stats.financial.arpu)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Conversion</p>
                    <p className="text-base font-semibold text-neutral-900 mt-0.5">
                      {stats.financial.conversionRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">CA total</p>
                    <p className="text-base font-semibold text-neutral-900 mt-0.5">
                      {fmtFull(stats.financial.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: subscription breakdown */}
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-3">
                  Abonnements
                </h3>
                <InlineRow
                  label="&Eacute;v&eacute;nementielle"
                  value={stats.financial.eventBasedCount}
                  sub={`\u00D7 ${fmtFull(SUBSCRIPTION_PRICES.event_based.cents)}/an`}
                />
                <InlineRow
                  label="Illimit&eacute;e"
                  value={stats.financial.unlimitedCount}
                  sub={`\u00D7 ${fmtFull(SUBSCRIPTION_PRICES.unlimited.cents)}/an`}
                />
                <InlineRow
                  label="Inactifs"
                  value={stats.financial.inactiveSubscriptions}
                />
              </div>
            </div>

            {/* Events + Participation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
              {/* Events */}
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-3">
                  &Eacute;v&eacute;nements
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-xs text-neutral-500">Total</span>
                    <span className="ml-auto text-sm font-medium text-neutral-900">{stats.events.total}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-xs text-neutral-500">&Agrave; venir</span>
                    <span className="ml-auto text-sm font-medium text-neutral-900">{stats.events.upcoming}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-xs text-neutral-500">Pass&eacute;s</span>
                    <span className="ml-auto text-sm font-medium text-neutral-900">{stats.events.past}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-xs text-neutral-500">Annul&eacute;s</span>
                    <span className="ml-auto text-sm font-medium text-neutral-900">{stats.events.cancelled}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-xs text-neutral-500">En ligne</span>
                    <span className="ml-auto text-sm font-medium text-neutral-900">{stats.events.online}</span>
                  </div>
                </div>
              </div>

              {/* Participation */}
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <h3 className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 mb-3">
                  Participation
                </h3>
                <InlineRow
                  label="R&eacute;servations"
                  value={stats.participants.totalBookings}
                  sub={`moy. ${stats.participants.averagePerEvent.toFixed(1)}/evt`}
                />
                <InlineRow
                  label="Invit&eacute;s"
                  value={stats.participants.totalGuests}
                  sub={`${stats.participants.guestsValidated} valid&eacute;s \u00B7 ${stats.participants.guestsPending} en attente`}
                />
                <InlineRow
                  label="CA billetterie"
                  value={fmtFull(stats.participants.totalRevenue)}
                />
                <InlineRow
                  label="Places r&eacute;serv&eacute;es"
                  value={stats.participants.totalPlaces}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
