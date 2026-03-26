'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { eventsApi, dashboardApi, Event, GlobalParticipantsResponse } from '@/lib/api';
import EventFormModal from '@/components/EventFormModal';
import Pagination from '@/components/Pagination';
import {
  Calendar, Search, Loader2, AlertCircle, Plus, Edit, Trash2,
  Globe, EyeOff, FileText, MoreVertical, Users, UserCheck, Euro,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { ITEMS_PER_PAGE_EVENTS, FRONTEND_URL } from '@/lib/config';

interface EventAttendance {
  totalParticipants: number;
  presentCount: number;
  awaitingCount: number;
  attendanceRate: number;
}

export default function EventsPage() {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEventId, setFilterEventId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = ITEMS_PER_PAGE_EVENTS;

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['events-dashboard'],
    queryFn: () => dashboardApi.getEvents(),
  });

  const events: Event[] = data?.events ?? [];
  const participants: GlobalParticipantsResponse | null = data?.participants ?? null;
  const eventAttendance: Map<string, EventAttendance> = (() => {
    const map = new Map<string, EventAttendance>();
    if (data?.attendance) {
      Object.entries(data.attendance).forEach(([eventId, stats]) => {
        map.set(eventId, stats as EventAttendance);
      });
    }
    return map;
  })();

  const loadingStats = loading;
  const error = queryError
    ? (queryError as { response?: { data?: { message?: string } } }).response?.data?.message ??
      'Erreur lors du chargement des événements'
    : '';

  const handleViewEvent = (event: Event) => {
    const eventUrl = `${FRONTEND_URL}/evenements/${event.slug}`;
    window.open(eventUrl, '_blank', 'noopener,noreferrer');
    setOpenMenuId(null);
  };

  const handleCreate = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  const handleSubmit = async (data: Partial<Event>) => {
    try {
      setIsSubmitting(true);

      if (selectedEvent) {
        await eventsApi.update(selectedEvent.id, data);
        toast.success('Événement mis à jour avec succès !');
      } else {
        await eventsApi.create(data);
        toast.success('Événement créé avec succès !');
      }

      setIsModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ['events-dashboard'] });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${event.title}" ?`)) return;

    try {
      await eventsApi.delete(event.id);
      toast.success('Événement supprimé');
      await queryClient.invalidateQueries({ queryKey: ['events-dashboard'] });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    }
    setOpenMenuId(null);
  };

  const handlePublicationChange = async (event: Event, state: 'online' | 'offline' | 'draft') => {
    try {
      await eventsApi.updatePublication(event.id, state);
      const stateLabels = { online: 'en ligne', offline: 'hors ligne', draft: 'en brouillon' };
      toast.success(`Événement mis ${stateLabels[state]}`);
      await queryClient.invalidateQueries({ queryKey: ['events-dashboard'] });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
    setOpenMenuId(null);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = !searchTerm ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterEventId === 'all' || event.id === filterEventId;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage, ITEMS_PER_PAGE]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
  const handleFilterChange = (value: string) => {
    setFilterEventId(value);
    setCurrentPage(1);
  };

  const statusLabels: Record<Event['status'], string> = {
    scheduled: 'Planifié',
    ongoing: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
  };

  const publicationLabels: Record<Event['publicationStatus'], string> = {
    online: 'En ligne',
    draft: 'Brouillon',
    offline: 'Hors ligne',
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
    } catch {
      return '-';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-neutral-900">Événements</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              {events.length} événement{events.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-md transition-colors font-medium text-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Créer un événement</span>
            <span className="sm:hidden">Créer</span>
          </button>
        </div>

        {/* Search and filters */}
        <div className="bg-white rounded-md border border-neutral-200 p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, slug ou ville..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
                />
              </div>
            </div>
            <div className="w-full md:w-72">
              <select
                value={filterEventId}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
              >
                <option value="all">Tous les événements</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        {!loading && !loadingStats && participants && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white rounded-md border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-neutral-500">Réservations</p>
                <Users className="w-4 h-4 text-neutral-400" />
              </div>
              <p className="text-lg font-medium text-neutral-900">
                {participants.stats.totalBookings}
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {participants.stats.totalPlaces} places au total
              </p>
            </div>

            <div className="bg-white rounded-md border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-neutral-500">Invités</p>
                <UserCheck className="w-4 h-4 text-neutral-400" />
              </div>
              <p className="text-lg font-medium text-neutral-900">
                {participants.stats.totalGuests}
              </p>
              <div className="flex gap-3 mt-1 text-[11px] text-neutral-500">
                <span>{participants.stats.guestsValidated} validés</span>
                <span>{participants.stats.guestsPending} en attente</span>
                <span>{participants.stats.guestsRefused} refusés</span>
              </div>
            </div>

            <div className="bg-white rounded-md border border-neutral-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-neutral-500">Revenu Total</p>
                <Euro className="w-4 h-4 text-neutral-400" />
              </div>
              <p className="text-lg font-medium text-neutral-900">
                {(participants.stats.totalRevenue / 100).toFixed(2)} €
              </p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                {participants.stats.paidBookings} payées / {participants.stats.unpaidBookings} impayées
              </p>
            </div>
          </div>
        )}

        {/* Loading skeleton for stats */}
        {loadingStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-md border border-neutral-200 p-4">
                <div className="animate-pulse">
                  <div className="h-3 bg-neutral-100 rounded w-1/2 mb-3"></div>
                  <div className="h-6 bg-neutral-100 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-neutral-100 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-md border border-neutral-200 p-6 text-center">
            <Loader2 className="w-8 h-8 text-neutral-400 mx-auto mb-3 animate-spin" />
            <p className="text-sm text-neutral-500">Chargement des événements...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-neutral-200 rounded-md p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-neutral-900 mb-0.5">Erreur</p>
              <p className="text-sm text-neutral-600">{error}</p>
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-md border border-neutral-200 p-6 text-center">
            <Calendar className="w-5 h-5 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-900 mb-1">
              Aucun événement trouvé
            </p>
            <p className="text-xs text-neutral-500 mb-4">
              {searchTerm ? 'Essayez une autre recherche.' : 'Aucun événement disponible.'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-md transition-colors font-medium text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Créer le premier événement
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile view: Cards */}
            <div className="lg:hidden space-y-3">
              {paginatedEvents.map((event) => {
                const attendance = eventAttendance.get(event.id);
                return (
                  <div key={event.id} className="bg-white rounded-md border border-neutral-200 overflow-hidden">
                    {event.coverImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.coverImageUrl}
                        alt={event.title}
                        className="w-full h-28 object-cover"
                      />
                    )}

                    <div className="p-4 space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-neutral-900">{event.title}</p>
                          <div className="flex gap-1.5 flex-shrink-0">
                            <span className="bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-[11px]">
                              {publicationLabels[event.publicationStatus]}
                            </span>
                            <span className="bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-[11px]">
                              {statusLabels[event.status]}
                            </span>
                          </div>
                        </div>
                        {event.subtitle && (
                          <p className="text-xs text-neutral-500 mt-0.5">{event.subtitle}</p>
                        )}
                        {event.categoryTag && (
                          <span className="inline-block mt-1.5 bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-[11px]">
                            {event.categoryTag}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-neutral-500">Date</p>
                          <p className="text-sm font-medium text-neutral-900">{formatDate(event.startsAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-500">Lieu</p>
                          <p className="text-sm font-medium text-neutral-900 truncate">{event.venueName || event.city || '-'}</p>
                        </div>
                        {attendance && (
                          <>
                            <div>
                              <p className="text-xs text-neutral-500">Participants</p>
                              <p className="text-sm font-medium text-neutral-900">{attendance.totalParticipants}</p>
                            </div>
                            <div>
                              <p className="text-xs text-neutral-500">Présents</p>
                              <p className="text-sm font-medium text-neutral-900">
                                {attendance.presentCount}
                                <span className="text-xs text-neutral-500 ml-1">
                                  ({attendance.totalParticipants > 0
                                    ? `${((attendance.presentCount / attendance.totalParticipants) * 100).toFixed(0)}%`
                                    : '0%'})
                                </span>
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 pt-3 border-t border-neutral-100">
                        <button
                          onClick={() => handleViewEvent(event)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 rounded-md transition-colors"
                        >
                          <ExternalLink className="w-4 h-4 text-neutral-400" />
                          Voir
                        </button>
                        <button
                          onClick={() => handleEdit(event)}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 rounded-md transition-colors"
                        >
                          <Edit className="w-4 h-4 text-neutral-400" />
                          Modifier
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                            className="px-2 py-1.5 hover:bg-neutral-50 rounded-md transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-neutral-400" />
                          </button>

                          {openMenuId === event.id && (
                            <>
                              <div
                                className="fixed inset-0 z-[90]"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-sm border border-neutral-200 py-1 z-[100]">
                                <button
                                  onClick={() => handlePublicationChange(event, 'online')}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 flex items-center gap-2 text-neutral-600"
                                >
                                  <Globe className="w-4 h-4 text-neutral-400" />
                                  Mettre en ligne
                                </button>
                                <button
                                  onClick={() => handlePublicationChange(event, 'offline')}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 flex items-center gap-2 text-neutral-600"
                                >
                                  <EyeOff className="w-4 h-4 text-neutral-400" />
                                  Mettre hors ligne
                                </button>
                                <button
                                  onClick={() => handlePublicationChange(event, 'draft')}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 flex items-center gap-2 text-neutral-600"
                                >
                                  <FileText className="w-4 h-4 text-neutral-400" />
                                  Brouillon
                                </button>
                                <div className="border-t border-neutral-100 my-1" />
                                <button
                                  onClick={() => handleDelete(event)}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 flex items-center gap-2 text-neutral-600"
                                >
                                  <Trash2 className="w-4 h-4 text-neutral-400" />
                                  Supprimer
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop view: Table */}
            <div className="hidden lg:block bg-white rounded-md border border-neutral-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                        Événement
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                        Date
                      </th>
                      <th className="px-2 py-2 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                        Lieu
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                        Total
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                        Présents
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                        Statut
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                        Publié
                      </th>
                      <th className="px-2 py-2 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap">
                        Catégorie
                      </th>
                      <th className="px-2 py-2 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap w-16">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEvents.map((event) => (
                      <tr key={event.id} className="border-b border-neutral-100 last:border-b-0">
                        <td className="px-3 py-2.5">
                          <div className="flex items-start gap-2">
                            {event.coverImageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={event.coverImageUrl}
                                alt={event.title}
                                className="w-9 h-9 rounded object-cover flex-shrink-0"
                              />
                            )}
                            <div className="min-w-0 max-w-[240px]">
                              <p className="text-sm font-medium text-neutral-900 truncate">
                                {event.title}
                              </p>
                              {event.subtitle && (
                                <p className="text-xs text-neutral-500 truncate">
                                  {event.subtitle}
                                </p>
                              )}
                              <p className="text-[10px] text-neutral-400 font-mono mt-0.5 truncate">
                                {event.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 py-2.5 whitespace-nowrap">
                          <p className="text-sm text-neutral-900">
                            {formatDate(event.startsAt)}
                          </p>
                          {event.endsAt && (
                            <p className="text-xs text-neutral-400">
                              → {formatDate(event.endsAt)}
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-2.5">
                          <p className="text-sm text-neutral-900 truncate max-w-[100px]">
                            {event.venueName || '-'}
                          </p>
                          {event.city && (
                            <p className="text-xs text-neutral-400 truncate max-w-[100px]">
                              {event.city}
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          {(() => {
                            const attendance = eventAttendance.get(event.id);
                            if (!attendance) return <span className="text-sm text-neutral-400">-</span>;
                            return (
                              <p className="text-sm font-medium text-neutral-900">
                                {attendance.totalParticipants}
                              </p>
                            );
                          })()}
                        </td>
                        <td className="px-2 py-2.5 text-center">
                          {(() => {
                            const attendance = eventAttendance.get(event.id);
                            if (!attendance) return <span className="text-sm text-neutral-400">-</span>;
                            return (
                              <div>
                                <p className="text-sm font-medium text-neutral-900">
                                  {attendance.presentCount}
                                </p>
                                <p className="text-[10px] text-neutral-400">
                                  {attendance.totalParticipants > 0
                                    ? `${((attendance.presentCount / attendance.totalParticipants) * 100).toFixed(0)}%`
                                    : '0%'
                                  }
                                </p>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-2 py-2.5 whitespace-nowrap text-center">
                          <span className="bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-[11px]">
                            {statusLabels[event.status]}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 whitespace-nowrap text-center">
                          <span className="bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-[11px]">
                            {publicationLabels[event.publicationStatus]}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 whitespace-nowrap text-center">
                          {event.categoryTag ? (
                            <span className="bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5 text-[11px]">
                              {event.categoryTag}
                            </span>
                          ) : (
                            <span className="text-sm text-neutral-400">-</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5 whitespace-nowrap relative">
                          <div className="flex justify-end">
                            <button
                              onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                              className="p-1 hover:bg-neutral-50 rounded-md transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-neutral-400" />
                            </button>
                          </div>

                          {openMenuId === event.id && (
                            <>
                              <div
                                className="fixed inset-0 z-[90]"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-2 mt-1 w-48 bg-white rounded-md shadow-sm border border-neutral-200 py-1 z-[100]">
                                <button
                                  onClick={() => handleViewEvent(event)}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 flex items-center gap-2 text-neutral-600"
                                >
                                  <ExternalLink className="w-4 h-4 text-neutral-400" />
                                  Voir l&apos;événement
                                </button>

                                <button
                                  onClick={() => handleEdit(event)}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 flex items-center gap-2 text-neutral-600"
                                >
                                  <Edit className="w-4 h-4 text-neutral-400" />
                                  Modifier
                                </button>

                                <div className="border-t border-neutral-100 my-1" />

                                <button
                                  onClick={() => handlePublicationChange(event, 'online')}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 flex items-center gap-2 text-neutral-600"
                                >
                                  <Globe className="w-4 h-4 text-neutral-400" />
                                  Mettre en ligne
                                </button>

                                <button
                                  onClick={() => handlePublicationChange(event, 'offline')}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 flex items-center gap-2 text-neutral-600"
                                >
                                  <EyeOff className="w-4 h-4 text-neutral-400" />
                                  Mettre hors ligne
                                </button>

                                <button
                                  onClick={() => handlePublicationChange(event, 'draft')}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 flex items-center gap-2 text-neutral-600"
                                >
                                  <FileText className="w-4 h-4 text-neutral-400" />
                                  Mettre en brouillon
                                </button>

                                <div className="border-t border-neutral-100 my-1" />

                                <button
                                  onClick={() => handleDelete(event)}
                                  className="w-full px-3 py-1.5 text-left text-xs hover:bg-neutral-50 flex items-center gap-2 text-neutral-600"
                                >
                                  <Trash2 className="w-4 h-4 text-neutral-400" />
                                  Supprimer
                                </button>
                              </div>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && filteredEvents.length > ITEMS_PER_PAGE && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredEvents.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Create/Edit modal */}
      <EventFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        event={selectedEvent}
        isLoading={isSubmitting}
      />
    </AdminLayout>
  );
}
