'use client';

import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { dashboardApi } from '@/lib/api';
import { DASHBOARD_STALE_TIME, SUBSCRIPTION_PRICES } from '@/lib/config';
import {
  Loader2, Users, CreditCard, TrendingUp, Repeat,
  CalendarDays, ArrowUpRight, Clock, XCircle, Globe,
  Ticket, UserCheck, DollarSign, BarChart3,
} from 'lucide-react';

type DashboardStats = Awaited<ReturnType<typeof dashboardApi.getStats>>;

const fmt = (cents: number) => {
  const e = cents / 100;
  return e >= 1000 ? `${(e / 1000).toFixed(1).replace(/\.0$/, '')}k €` : `${e.toFixed(0)} €`;
};
const fmtFull = (cents: number) => `${(cents / 100).toFixed(2)} €`;
const pct = (v: number) => `${v.toFixed(1)}%`;

export default function DashboardPage() {
  const { data: stats, isLoading, error: queryError } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
    staleTime: DASHBOARD_STALE_TIME,
  });

  return (
    <AdminLayout>
      <div className="space-y-5">
        <h1 className="text-base font-semibold text-neutral-900">Dashboard</h1>

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
          </div>
        )}

        {queryError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            Erreur lors du chargement
          </div>
        )}

        {stats && (
          <>
            {/* ── Row 1: Revenue KPIs ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: TrendingUp, label: 'ARR', value: fmt(stats.financial.arr), sub: 'Revenu annuel récurrent', accent: 'text-brand' },
                { icon: DollarSign, label: 'MRR', value: fmt(stats.financial.mrr), sub: 'Revenu mensuel', accent: 'text-neutral-900' },
                { icon: UserCheck, label: 'Abonnés actifs', value: stats.financial.activeSubscriptions, sub: `sur ${stats.totalUsers} inscrits`, accent: 'text-green-600' },
                { icon: Repeat, label: 'Churn', value: pct(stats.financial.churnRate), sub: `${stats.financial.expiredSubscriptions} expirés`, accent: 'text-orange-600' },
              ].map(({ icon: Icon, label, value, sub, accent }) => (
                <div key={label} className="bg-white rounded-lg border border-neutral-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-neutral-400" />
                    <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">{label}</span>
                  </div>
                  <p className={`text-xl font-semibold ${accent} leading-none`}>{value}</p>
                  {sub && <p className="text-[10px] text-neutral-400 mt-1.5">{sub}</p>}
                </div>
              ))}
            </div>

            {/* ── Row 2: Financial details + Subscription breakdown ── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              {/* Financial metrics */}
              <div className="lg:col-span-3 bg-white rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-neutral-400" />
                  <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">Métriques financières</span>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  {[
                    { label: 'ARPU', value: fmtFull(stats.financial.arpu) },
                    { label: 'Taux conversion', value: pct(stats.financial.conversionRate) },
                    { label: 'CA total', value: fmtFull(stats.financial.totalRevenue) },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[11px] text-neutral-400 mb-1">{label}</p>
                      <p className="text-lg font-semibold text-neutral-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subscription breakdown */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-neutral-400" />
                  <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">Répartition abonnements</span>
                </div>
                <div className="space-y-0">
                  {[
                    { label: 'Événementielle', value: stats.financial.eventBasedCount, sub: `× ${fmtFull(SUBSCRIPTION_PRICES.event_based.cents)}/an`, bar: stats.financial.eventBasedCount, color: 'bg-brand' },
                    { label: 'Illimitée', value: stats.financial.unlimitedCount, sub: `× ${fmtFull(SUBSCRIPTION_PRICES.unlimited.cents)}/an`, bar: stats.financial.unlimitedCount, color: 'bg-green-500' },
                    { label: 'Inactifs', value: stats.financial.inactiveSubscriptions, sub: '', bar: stats.financial.inactiveSubscriptions, color: 'bg-neutral-300' },
                  ].map(({ label, value, sub, bar, color }) => {
                    const total = stats.financial.eventBasedCount + stats.financial.unlimitedCount + stats.financial.inactiveSubscriptions;
                    const w = total > 0 ? (bar / total) * 100 : 0;
                    return (
                      <div key={label} className="py-2 border-b border-neutral-50 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-neutral-600">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-900">{value}</span>
                            {sub && <span className="text-[10px] text-neutral-400">{sub}</span>}
                          </div>
                        </div>
                        <div className="w-full h-1 bg-neutral-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${w}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Row 3: Events + Participation ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Events */}
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CalendarDays className="w-4 h-4 text-neutral-400" />
                  <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">Événements</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { icon: CalendarDays, label: 'Total', value: stats.events.total },
                    { icon: ArrowUpRight, label: 'À venir', value: stats.events.upcoming },
                    { icon: Clock, label: 'Passés', value: stats.events.past },
                    { icon: XCircle, label: 'Annulés', value: stats.events.cancelled },
                    { icon: Globe, label: 'En ligne', value: stats.events.online },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-md bg-neutral-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-neutral-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900 leading-none">{value}</p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Participation */}
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Ticket className="w-4 h-4 text-neutral-400" />
                  <span className="text-[11px] text-neutral-500 font-medium uppercase tracking-wider">Participation</span>
                </div>
                <div className="space-y-0">
                  {[
                    { label: 'Réservations', value: stats.participants.totalBookings, sub: `moy. ${stats.participants.averagePerEvent.toFixed(1)}/evt` },
                    { label: 'Invités', value: stats.participants.totalGuests, sub: `${stats.participants.guestsValidated} validés · ${stats.participants.guestsPending} en attente` },
                    { label: 'CA billetterie', value: fmtFull(stats.participants.totalRevenue), sub: '' },
                    { label: 'Places réservées', value: stats.participants.totalPlaces, sub: '' },
                  ].map(({ label, value, sub }) => (
                    <div key={label} className="flex items-center justify-between py-2.5 border-b border-neutral-50 last:border-0">
                      <span className="text-xs text-neutral-500">{label}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-neutral-900">{value}</span>
                        {sub && <span className="text-[10px] text-neutral-400 ml-2">{sub}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
