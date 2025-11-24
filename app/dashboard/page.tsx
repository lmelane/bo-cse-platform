'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { usersApi, eventsApi, participantsApi, type User, type Event, type GlobalParticipantsResponse } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<GlobalParticipantsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [usersResponse, eventsResponse, participantsResponse] = await Promise.all([
        usersApi.getAll(),
        eventsApi.getAll(),
        participantsApi.getAll(),
      ]);
      setUsers(usersResponse.data);
      setEvents(eventsResponse.data);
      setParticipants(participantsResponse);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erreur lors du chargement des données');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculs financiers (optimisés avec useMemo)
  const financialStats = useMemo(() => {
    return {
      // Revenus totaux des abonnements
      totalRevenue: users.reduce((sum, user) => sum + (user.subscriptionPriceCents || 0), 0),
      
      // MRR (Monthly Recurring Revenue) - approximation annuelle / 12
      mrr: users
        .filter(user => user.subscriptionStatus === 'ACTIVE')
        .reduce((sum, user) => sum + (user.subscriptionPriceCents || 0), 0) / 12,
      
      // ARR (Annual Recurring Revenue)
      arr: users
        .filter(user => user.subscriptionStatus === 'ACTIVE')
        .reduce((sum, user) => sum + (user.subscriptionPriceCents || 0), 0),
      
      // Nombre d'abonnements actifs
      activeSubscriptions: users.filter(user => user.subscriptionStatus === 'ACTIVE').length,
      
      // Nombre d'abonnements inactifs/expirés
      inactiveSubscriptions: users.filter(user => 
        user.subscriptionStatus === 'INACTIVE' || user.subscriptionStatus === 'EXPIRED'
      ).length,
      
      // Churn rate (approximation)
      churnRate: users.length > 0 
        ? (users.filter(user => user.subscriptionStatus === 'EXPIRED').length / users.length) * 100
        : 0,
      
      // Répartition par type d'abonnement
      eventBasedCount: users.filter(user => user.subscriptionType === 'event_based' && user.subscriptionStatus === 'ACTIVE').length,
      unlimitedCount: users.filter(user => user.subscriptionType === 'unlimited' && user.subscriptionStatus === 'ACTIVE').length,
      
      // Revenus par type
      eventBasedRevenue: users
        .filter(user => user.subscriptionType === 'event_based' && user.subscriptionStatus === 'ACTIVE')
        .reduce((sum, user) => sum + (user.subscriptionPriceCents || 0), 0),
      unlimitedRevenue: users
        .filter(user => user.subscriptionType === 'unlimited' && user.subscriptionStatus === 'ACTIVE')
        .reduce((sum, user) => sum + (user.subscriptionPriceCents || 0), 0),
      
      // Taux de conversion (utilisateurs avec abonnement / total utilisateurs)
      conversionRate: users.length > 0
        ? (users.filter(user => user.subscriptionStatus === 'ACTIVE').length / users.length) * 100
        : 0,
      
      // ARPU (Average Revenue Per User)
      arpu: users.length > 0
        ? users.reduce((sum, user) => sum + (user.subscriptionPriceCents || 0), 0) / users.length
        : 0,
    };
  }, [users]);

  // Statistiques événements (optimisées)
  const eventStats = useMemo(() => {
    const now = new Date();
    return {
      total: events.length,
      upcoming: events.filter(e => e.startsAt && new Date(e.startsAt) > now && e.status !== 'cancelled').length,
      past: events.filter(e => e.startsAt && new Date(e.startsAt) <= now).length,
      cancelled: events.filter(e => e.status === 'cancelled').length,
      online: events.filter(e => e.publicationStatus === 'online').length,
    };
  }, [events]);

  // Statistiques participants (optimisées)
  const participantStats = useMemo(() => {
    if (!participants) return null;
    
    return {
      totalBookings: participants.stats.totalBookings,
      totalGuests: participants.stats.totalGuests,
      totalRevenue: participants.stats.totalRevenue,
      averagePerEvent: eventStats.total > 0 ? (participants.stats.totalBookings / eventStats.total).toFixed(1) : '0',
      conversionRate: users.length > 0 ? ((participants.stats.totalBookings / users.length) * 100).toFixed(1) : '0',
      guestsValidated: participants.stats.guestsValidated,
      guestsPending: participants.stats.guestsPending,
    };
  }, [participants, eventStats.total, users.length]);

  const formatCurrency = (cents: number) => {
    return `${(cents / 100).toFixed(2)} €`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-sm md:text-base text-neutral-500 mt-1 md:mt-2">
            Vue d&apos;ensemble de votre activité
          </p>
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

        {!loading && !error && (
          <>
            {/* KPIs Principaux */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* ARR */}
              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">ARR</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {formatCurrency(financialStats.arr)}
                </p>
                <p className="text-xs text-neutral-400 mt-2">Revenue annuel récurrent</p>
              </div>

              {/* MRR */}
              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">MRR</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {formatCurrency(financialStats.mrr)}
                </p>
                <p className="text-xs text-neutral-400 mt-2">Revenue mensuel récurrent</p>
              </div>

              {/* Abonnés Actifs */}
              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">Abonnés</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {financialStats.activeSubscriptions}
                </p>
                <p className="text-sm text-neutral-500 mt-2">
                  sur {users.length} total
                </p>
              </div>

              {/* Churn Rate */}
              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">Churn</p>
                <p className="text-3xl font-bold text-neutral-900">
                  {financialStats.churnRate.toFixed(1)}%
                </p>
                <p className="text-xs text-neutral-400 mt-2">
                  {financialStats.inactiveSubscriptions} expirés
                </p>
              </div>
            </div>

            {/* Métriques Secondaires */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">ARPU</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(financialStats.arpu)}
                </p>
                <p className="text-xs text-neutral-400 mt-2">Revenue moyen par utilisateur</p>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">Taux de conversion</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {financialStats.conversionRate.toFixed(1)}%
                </p>
                <p className="text-xs text-neutral-400 mt-2">Utilisateurs abonnés</p>
              </div>

              <div className="bg-white rounded-lg border border-neutral-200 p-6 hover:border-brand transition-colors">
                <p className="text-sm text-neutral-500 mb-1">CA Total</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {formatCurrency(financialStats.totalRevenue)}
                </p>
                <p className="text-xs text-neutral-400 mt-2">Abonnements cumulés</p>
              </div>
            </div>

            {/* Répartition par Type d'Abonnement */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-6">Répartition des abonnements</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Adhésion Événementielle */}
              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-4">
                  Adhésion Événementielle
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Nombre d&apos;abonnés</span>
                    <span className="text-lg font-bold text-neutral-900">
                      {financialStats.eventBasedCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Revenus annuels</span>
                    <span className="text-lg font-bold text-neutral-900">
                      {formatCurrency(financialStats.eventBasedRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Prix unitaire</span>
                    <span className="text-sm font-medium text-neutral-700">
                      35,00 € / an
                    </span>
                  </div>
                  <div className="pt-3 border-t border-neutral-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Part du CA</span>
                      <span className="text-sm font-bold text-brand">
                        {financialStats.arr > 0 
                          ? ((financialStats.eventBasedRevenue / financialStats.arr) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adhésion Illimitée */}
              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-4">
                  Adhésion Illimitée
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Nombre d&apos;abonnés</span>
                    <span className="text-lg font-bold text-neutral-900">
                      {financialStats.unlimitedCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Revenus annuels</span>
                    <span className="text-lg font-bold text-neutral-900">
                      {formatCurrency(financialStats.unlimitedRevenue)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Prix unitaire</span>
                    <span className="text-sm font-medium text-neutral-700">
                      235,00 € / an
                    </span>
                  </div>
                  <div className="pt-3 border-t border-neutral-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-neutral-600">Part du CA</span>
                      <span className="text-sm font-bold text-brand">
                        {financialStats.arr > 0 
                          ? ((financialStats.unlimitedRevenue / financialStats.arr) * 100).toFixed(1)
                          : 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>

            {/* Événements */}
            <div className="bg-white rounded-lg border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-6">Événements</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">Total</p>
                  <p className="text-2xl font-bold text-neutral-900">{eventStats.total}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">À venir</p>
                  <p className="text-2xl font-bold text-neutral-900">{eventStats.upcoming}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">Passés</p>
                  <p className="text-2xl font-bold text-neutral-900">{eventStats.past}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">Annulés</p>
                  <p className="text-2xl font-bold text-neutral-900">{eventStats.cancelled}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-neutral-500 mb-1">En ligne</p>
                  <p className="text-2xl font-bold text-neutral-900">{eventStats.online}</p>
                </div>
              </div>
            </div>

            {/* Participation */}
            {participantStats && (
                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-6">Participation</h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Réservations</p>
                      <p className="text-3xl font-bold text-neutral-900">
                        {participantStats.totalBookings}
                      </p>
                      <p className="text-xs text-neutral-400 mt-2">
                        Moy. {participantStats.averagePerEvent}/événement
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Invités</p>
                      <p className="text-3xl font-bold text-neutral-900">
                        {participantStats.totalGuests}
                      </p>
                      <p className="text-xs text-neutral-400 mt-2">
                        {participantStats.guestsValidated} validés, {participantStats.guestsPending} en attente
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-500 mb-1">CA Événements</p>
                      <p className="text-3xl font-bold text-neutral-900">
                        {formatCurrency(participantStats.totalRevenue)}
                      </p>
                      <p className="text-xs text-neutral-400 mt-2">
                        Billetterie
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-neutral-500 mb-1">Engagement</p>
                      <p className="text-3xl font-bold text-neutral-900">
                        {participantStats.conversionRate}%
                      </p>
                      <p className="text-xs text-neutral-400 mt-2">
                        Utilisateurs participants
                      </p>
                    </div>
                  </div>
                </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
