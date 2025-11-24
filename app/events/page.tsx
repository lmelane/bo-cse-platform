'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { eventsApi, participantsApi, Event, GlobalParticipantsResponse } from '@/lib/api';
import EventFormModal from '@/components/EventFormModal';
import { tokenStorage } from '@/lib/auth';
import { 
  Calendar, Search, Loader2, AlertCircle, Plus, Edit, Trash2, 
  Globe, EyeOff, FileText, MoreVertical, Users, UserCheck, Euro, 
  CheckCircle, Clock, XCircle, ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface EventAttendance {
  totalParticipants: number;
  presentCount: number;
  awaitingCount: number;
  attendanceRate: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [participants, setParticipants] = useState<GlobalParticipantsResponse | null>(null);
  const [eventAttendance, setEventAttendance] = useState<Map<string, EventAttendance>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEventId, setFilterEventId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // URL du site frontend pour voir l'événement
  const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

  // Ouvrir l'événement dans un nouvel onglet
  const handleViewEvent = (event: Event) => {
    const eventUrl = `${FRONTEND_URL}/evenements/${event.slug}`;
    window.open(eventUrl, '_blank', 'noopener,noreferrer');
    setOpenMenuId(null);
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = async () => {
    // Éviter les appels simultanés
    if (isRefreshing) return;
    
    try {
      setIsRefreshing(true);
      setLoading(true);
      setLoadingStats(true);
      setError('');
      
      const token = tokenStorage.get();
      if (!token) {
        setError('Token manquant');
        return;
      }

      // UN SEUL appel API pour tout
      const response = await fetch('http://localhost:3001/api/admin/events/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement');
      }

      const data = await response.json();
      
      setEvents(data.events);
      setParticipants(data.participants);
      
      // Convertir l'objet attendance en Map
      const attendanceMap = new Map<string, EventAttendance>();
      Object.entries(data.attendance).forEach(([eventId, stats]) => {
        attendanceMap.set(eventId, stats as EventAttendance);
      });
      setEventAttendance(attendanceMap);
      
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erreur lors du chargement des événements');
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
      setLoadingStats(false);
      setIsRefreshing(false);
    }
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
        // Mise à jour
        await eventsApi.update(selectedEvent.id, data);
        toast.success('Événement mis à jour avec succès !');
      } else {
        // Création
        await eventsApi.create(data);
        toast.success('Événement créé avec succès !');
      }
      
      setIsModalOpen(false);
      await loadDashboard();
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
      await loadDashboard();
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
      await loadDashboard();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
    setOpenMenuId(null);
  };

  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Event['status']) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-700',
      ongoing: 'bg-green-100 text-green-700',
      completed: 'bg-neutral-100 text-neutral-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    
    const labels = {
      scheduled: 'Planifié',
      ongoing: 'En cours',
      completed: 'Terminé',
      cancelled: 'Annulé',
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getPublicationBadge = (publicationStatus: Event['publicationStatus']) => {
    const styles = {
      online: 'bg-green-100 text-green-700',
      draft: 'bg-yellow-100 text-yellow-700',
      offline: 'bg-neutral-100 text-neutral-700',
    };
    
    const labels = {
      online: 'En ligne',
      draft: 'Brouillon',
      offline: 'Hors ligne',
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[publicationStatus]}`}>
        {labels[publicationStatus]}
      </span>
    );
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Événements</h1>
            <p className="text-sm md:text-base text-neutral-600 mt-1 md:mt-2">
              {events.length} événement{events.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors font-medium whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Créer un événement</span>
            <span className="sm:hidden">Créer</span>
          </button>
        </div>

        {/* Recherche et filtres */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Barre de recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, slug ou ville..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                />
              </div>
            </div>

            {/* Filtre par événement */}
            <div className="w-full md:w-80">
              <select
                value={filterEventId}
                onChange={(e) => setFilterEventId(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
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

        {/* Statistiques des participants */}
        {!loading && !loadingStats && participants && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Nombre de participants (réservations) */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-600">Réservations</p>
                <Users className="w-5 h-5 text-brand" />
              </div>
              <p className="text-3xl font-bold text-neutral-900 mb-1">
                {participants.stats.totalBookings}
              </p>
              <p className="text-xs text-neutral-500">
                {participants.stats.totalPlaces} places au total
              </p>
            </div>

            {/* Nombre d'invités */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-600">Invités</p>
                <UserCheck className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-neutral-900 mb-1">
                {participants.stats.totalGuests}
              </p>
              <div className="flex gap-3 mt-2 text-xs">
                <span className="text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {participants.stats.guestsValidated}
                </span>
                <span className="text-yellow-600 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {participants.stats.guestsPending}
                </span>
                <span className="text-red-600 flex items-center gap-1">
                  <XCircle className="w-3 h-3" />
                  {participants.stats.guestsRefused}
                </span>
              </div>
            </div>

            {/* Revenu total */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-neutral-600">Revenu Total</p>
                <Euro className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-neutral-900 mb-1">
                {(participants.stats.totalRevenue / 100).toFixed(2)} €
              </p>
              <p className="text-xs text-neutral-500">
                {participants.stats.paidBookings} payées / {participants.stats.unpaidBookings} impayées
              </p>
            </div>
          </div>
        )}

        {/* Loading des stats */}
        {loadingStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-neutral-200 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-neutral-200 rounded w-1/2 mb-3"></div>
                  <div className="h-8 bg-neutral-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-neutral-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contenu */}
        {loading ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <Loader2 className="w-12 h-12 text-brand mx-auto mb-4 animate-spin" />
            <p className="text-neutral-600">Chargement des événements...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900 mb-1">Erreur</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <Calendar className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Aucun événement trouvé
            </h3>
            <p className="text-neutral-600 mb-4">
              {searchTerm ? 'Essayez une autre recherche.' : 'Aucun événement disponible.'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-4 h-4" />
                Créer le premier événement
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Vue mobile : Cartes */}
            <div className="lg:hidden space-y-4">
              {filteredEvents.map((event) => {
                const attendance = eventAttendance.get(event.id);
                return (
                  <div key={event.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                    {/* Image + Titre */}
                    <div className="relative">
                      {event.coverImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img 
                          src={event.coverImageUrl} 
                          alt={event.title}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2 flex gap-2">
                        {getPublicationBadge(event.publicationStatus)}
                        {getStatusBadge(event.status)}
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-4 space-y-3">
                      {/* Titre */}
                      <div>
                        <h3 className="font-semibold text-neutral-900 text-lg">{event.title}</h3>
                        {event.subtitle && (
                          <p className="text-sm text-neutral-600 mt-1">{event.subtitle}</p>
                        )}
                        {event.categoryTag && (
                          <span className="inline-block mt-2 px-2 py-1 rounded-md text-xs font-medium bg-brand/10 text-brand">
                            {event.categoryTag}
                          </span>
                        )}
                      </div>

                      {/* Infos */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-neutral-500 text-xs">Date</p>
                          <p className="text-neutral-900 font-medium">{formatDate(event.startsAt)}</p>
                        </div>
                        <div>
                          <p className="text-neutral-500 text-xs">Lieu</p>
                          <p className="text-neutral-900 font-medium truncate">{event.venueName || event.city || '-'}</p>
                        </div>
                        {attendance && (
                          <>
                            <div>
                              <p className="text-neutral-500 text-xs">Participants</p>
                              <p className="text-neutral-900 font-bold text-lg">{attendance.totalParticipants}</p>
                            </div>
                            <div>
                              <p className="text-neutral-500 text-xs">Présents</p>
                              <p className="text-green-600 font-bold text-lg">
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

                      {/* Actions */}
                      <div className="flex gap-2 pt-3 border-t border-neutral-100">
                        <button
                          onClick={() => handleViewEvent(event)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-brand hover:bg-brand/5 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Voir
                        </button>
                        <button
                          onClick={() => handleEdit(event)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          Modifier
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                            className="px-3 py-2 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-5 h-5 text-neutral-600" />
                          </button>
                          
                          {openMenuId === event.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />
                              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20">
                                <button
                                  onClick={() => handlePublicationChange(event, 'online')}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2 text-green-700"
                                >
                                  <Globe className="w-4 h-4" />
                                  Mettre en ligne
                                </button>
                                <button
                                  onClick={() => handlePublicationChange(event, 'offline')}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2 text-orange-700"
                                >
                                  <EyeOff className="w-4 h-4" />
                                  Mettre hors ligne
                                </button>
                                <button
                                  onClick={() => handlePublicationChange(event, 'draft')}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                                >
                                  <FileText className="w-4 h-4" />
                                  Brouillon
                                </button>
                                <div className="border-t border-neutral-200 my-1" />
                                <button
                                  onClick={() => handleDelete(event)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
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

            {/* Vue desktop : Tableau */}
            <div className="hidden lg:block bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-xs font-medium text-neutral-700 uppercase tracking-tight">
                      Événement
                    </th>
                    <th className="px-2 py-2.5 text-left text-xs font-medium text-neutral-700 uppercase tracking-tight whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-2 py-2.5 text-left text-xs font-medium text-neutral-700 uppercase tracking-tight whitespace-nowrap">
                      Lieu
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-neutral-700 uppercase tracking-tight whitespace-nowrap">
                      Total
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-neutral-700 uppercase tracking-tight whitespace-nowrap">
                      Présents
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-neutral-700 uppercase tracking-tight whitespace-nowrap">
                      Statut
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-neutral-700 uppercase tracking-tight whitespace-nowrap">
                      Publié
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-neutral-700 uppercase tracking-tight whitespace-nowrap">
                      Catégorie
                    </th>
                    <th className="px-2 py-2.5 text-right text-xs font-medium text-neutral-700 uppercase tracking-tight whitespace-nowrap w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2">
                          {event.coverImageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={event.coverImageUrl} 
                              alt={event.title}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 max-w-[250px]">
                            <div className="font-medium text-neutral-900 truncate text-sm">
                              {event.title}
                            </div>
                            {event.subtitle && (
                              <div className="text-xs text-neutral-600 truncate">
                                {event.subtitle}
                              </div>
                            )}
                            <div className="text-[10px] text-neutral-500 font-mono mt-0.5 truncate">
                              {event.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">
                          {formatDate(event.startsAt)}
                        </div>
                        {event.endsAt && (
                          <div className="text-xs text-neutral-500">
                            → {formatDate(event.endsAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-3">
                        <div className="text-sm text-neutral-900 truncate max-w-[100px]">
                          {event.venueName || '-'}
                        </div>
                        {event.city && (
                          <div className="text-xs text-neutral-500 truncate max-w-[100px]">
                            {event.city}
                          </div>
                        )}
                      </td>
                      {/* Colonne Total Participants */}
                      <td className="px-2 py-3">
                        {(() => {
                          const attendance = eventAttendance.get(event.id);
                          if (!attendance) {
                            return (
                              <div className="text-center">
                                <span className="text-sm text-neutral-400">-</span>
                              </div>
                            );
                          }
                          return (
                            <div className="text-center">
                              <div className="text-base font-bold text-neutral-900">
                                {attendance.totalParticipants}
                              </div>
                              <div className="text-[10px] text-neutral-500">
                                total
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      
                      {/* Colonne Présents */}
                      <td className="px-2 py-3">
                        {(() => {
                          const attendance = eventAttendance.get(event.id);
                          if (!attendance) {
                            return (
                              <div className="text-center">
                                <span className="text-sm text-neutral-400">-</span>
                              </div>
                            );
                          }
                          return (
                            <div className="text-center">
                              <div className="text-base font-bold text-green-600">
                                {attendance.presentCount}
                              </div>
                              <div className="text-[10px] text-neutral-500">
                                {attendance.totalParticipants > 0 
                                  ? `${((attendance.presentCount / attendance.totalParticipants) * 100).toFixed(0)}%`
                                  : '0%'
                                }
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center">
                        {getStatusBadge(event.status)}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center">
                        {getPublicationBadge(event.publicationStatus)}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center">
                        {event.categoryTag ? (
                          <span className="px-2 py-1 rounded-md text-xs font-medium bg-brand/10 text-brand whitespace-nowrap">
                            {event.categoryTag}
                          </span>
                        ) : (
                          <span className="text-sm text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap relative">
                        <div className="flex justify-end">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                            className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            <MoreVertical className="w-4 h-4 text-neutral-600" />
                          </button>
                        </div>
                        
                        {openMenuId === event.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-2 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-20">
                              <button
                                onClick={() => handleViewEvent(event)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2 text-brand"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Voir l&apos;événement
                              </button>

                              <button
                                onClick={() => handleEdit(event)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Modifier
                              </button>
                              
                              <div className="border-t border-neutral-200 my-1" />
                              
                              <button
                                onClick={() => handlePublicationChange(event, 'online')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2 text-green-700"
                              >
                                <Globe className="w-4 h-4" />
                                Mettre en ligne
                              </button>
                              
                              <button
                                onClick={() => handlePublicationChange(event, 'offline')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2 text-orange-700"
                              >
                                <EyeOff className="w-4 h-4" />
                                Mettre hors ligne
                              </button>
                              
                              <button
                                onClick={() => handlePublicationChange(event, 'draft')}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 flex items-center gap-2"
                              >
                                <FileText className="w-4 h-4" />
                                Mettre en brouillon
                              </button>
                              
                              <div className="border-t border-neutral-200 my-1" />
                              
                              <button
                                onClick={() => handleDelete(event)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Modal de création/édition */}
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
