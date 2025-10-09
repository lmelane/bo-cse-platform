'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { eventsApi, Event } from '@/lib/api';
import EventFormModal from '@/components/EventFormModal';
import { 
  Calendar, Search, Loader2, AlertCircle, Plus, Edit, Trash2, 
  Globe, EyeOff, FileText, MoreVertical 
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await eventsApi.getAll();
      setEvents(response.data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erreur lors du chargement des événements');
      toast.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
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
      await loadEvents();
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
      await loadEvents();
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
      await loadEvents();
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Événements</h1>
            <p className="text-neutral-600 mt-2">
              {events.length} événement{events.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Créer un événement
          </button>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
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
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Événement
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Lieu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Publication
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          {event.coverImageUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img 
                              src={event.coverImageUrl} 
                              alt={event.title}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-neutral-900 truncate">
                              {event.title}
                            </div>
                            {event.subtitle && (
                              <div className="text-sm text-neutral-600 truncate">
                                {event.subtitle}
                              </div>
                            )}
                            <div className="text-xs text-neutral-500 font-mono mt-1">
                              {event.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-neutral-900">
                          {formatDate(event.startsAt)}
                        </div>
                        {event.endsAt && (
                          <div className="text-xs text-neutral-500">
                            → {formatDate(event.endsAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-neutral-900">
                          {event.venueName || '-'}
                        </div>
                        {event.city && (
                          <div className="text-xs text-neutral-500">
                            {event.city}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(event.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPublicationBadge(event.publicationStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {event.categoryTag ? (
                          <span className="px-2 py-1 rounded-md text-xs font-medium bg-brand/10 text-brand">
                            {event.categoryTag}
                          </span>
                        ) : (
                          <span className="text-sm text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
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
