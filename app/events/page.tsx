'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { eventsApi, dashboardApi, Event } from '@/lib/api';
import Pagination from '@/components/Pagination';
import { Search, Loader2, Plus, Edit, Trash2, Globe, EyeOff, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { ITEMS_PER_PAGE_EVENTS, FRONTEND_URL } from '@/lib/config';

export default function EventsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error: queryError } = useQuery({
    queryKey: ['events-dashboard'],
    queryFn: () => dashboardApi.getEvents(),
  });

  const events: Event[] = data?.events ?? [];
  const error = queryError ? 'Erreur lors du chargement' : '';

  const fmtDate = (d: string | null) => d ? format(new Date(d), 'dd MMM yyyy', { locale: fr }) : '—';

  const handleDelete = async (event: Event) => {
    if (!confirm(`Supprimer "${event.title}" ?`)) return;
    try {
      await eventsApi.delete(event.id);
      toast.success('Supprime');
      setExpandedId(null);
      await queryClient.invalidateQueries({ queryKey: ['events-dashboard'] });
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const handlePublication = async (event: Event, state: 'online' | 'offline') => {
    if (!confirm(`${state === 'online' ? 'Publier' : 'Depublier'} "${event.title}" ?`)) return;
    try {
      await eventsApi.updatePublication(event.id, state);
      toast.success(state === 'online' ? 'Publie' : 'Depublie');
      await queryClient.invalidateQueries({ queryKey: ['events-dashboard'] });
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const filtered = events.filter(e =>
    !searchTerm || e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE_EVENTS);
  const paginated = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE_EVENTS;
    return filtered.slice(s, s + ITEMS_PER_PAGE_EVENTS);
  }, [filtered, currentPage]);

  const toggleExpand = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-neutral-900">Evenements</h1>
          <Link
            href="/events/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-md hover:bg-neutral-800 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Creer
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Rechercher un evenement..."
            className="w-full h-9 pl-10 pr-3 border border-neutral-200 rounded-md text-sm bg-white focus:outline-none focus:border-neutral-400"
          />
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-4 h-4 animate-spin text-neutral-400" /></div>
        ) : error ? (
          <div className="bg-white rounded-md border border-neutral-200 p-4 text-sm text-neutral-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-md border border-neutral-200 p-8 text-center">
            <p className="text-sm text-neutral-500">Aucun evenement trouve</p>
          </div>
        ) : (
          <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
            {/* Table — 4 columns only: Title, Date, Status, Published */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-2.5 text-left text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Evenement</th>
                  <th className="px-4 py-2.5 text-left text-[11px] text-neutral-500 uppercase tracking-wider font-medium hidden sm:table-cell">Date</th>
                  <th className="px-4 py-2.5 text-left text-[11px] text-neutral-500 uppercase tracking-wider font-medium hidden md:table-cell">Lieu</th>
                  <th className="px-4 py-2.5 text-right text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((event) => (
                  <React.Fragment key={event.id}>
                    {/* Main row — clickable to expand */}
                    <tr
                      onClick={() => toggleExpand(event.id)}
                      className={`border-b border-neutral-100 cursor-pointer transition-colors ${expandedId === event.id ? 'bg-neutral-50' : 'hover:bg-neutral-50/50'}`}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-neutral-900 truncate max-w-xs">{event.title}</p>
                        {event.categoryTag && (
                          <span className="text-[10px] text-neutral-400">{event.categoryTag}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 hidden sm:table-cell whitespace-nowrap">
                        {fmtDate(event.startsAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-500 truncate max-w-[150px] hidden md:table-cell">
                        {event.venueName || event.city || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={`inline-flex items-center gap-1 text-[11px] ${
                            event.publicationStatus === 'online' ? 'text-neutral-600' : 'text-neutral-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              event.publicationStatus === 'online' ? 'bg-green-500' : 'bg-neutral-300'
                            }`} />
                            {event.publicationStatus === 'online' ? 'En ligne' : event.publicationStatus === 'draft' ? 'Brouillon' : 'Hors ligne'}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row — action panel */}
                    {expandedId === event.id && (
                      <tr>
                        <td colSpan={4} className="bg-neutral-50 border-b border-neutral-200">
                          <div className="px-4 py-3 flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/events/${event.id}/edit`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-white border border-neutral-200 rounded-md transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" /> Modifier
                            </Link>
                            <button
                              onClick={(e) => { e.stopPropagation(); window.open(`${FRONTEND_URL}/events/${event.slug}`, '_blank'); }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-white border border-neutral-200 rounded-md transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Voir sur le site
                            </button>

                            <div className="w-px h-5 bg-neutral-200 mx-1" />

                            {event.publicationStatus !== 'online' ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePublication(event, 'online'); }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-white border border-neutral-200 rounded-md transition-colors"
                              >
                                <Globe className="w-3.5 h-3.5" /> Publier
                              </button>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePublication(event, 'offline'); }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-600 hover:bg-white border border-neutral-200 rounded-md transition-colors"
                              >
                                <EyeOff className="w-3.5 h-3.5" /> Depublier
                              </button>
                            )}

                            <div className="w-px h-5 bg-neutral-200 mx-1" />

                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(event); }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 border border-neutral-200 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Supprimer
                            </button>

                            {/* Quick info */}
                            <div className="ml-auto flex items-center gap-4 text-[11px] text-neutral-400">
                              {event.maxParticipants && <span>{event.maxParticipants} places max</span>}
                              {(event.minPriceCents ?? 0) > 0 && <span>{((event.minPriceCents ?? 0) / 100).toFixed(0)} EUR</span>}
                              {event.eventType === 'WEBINAR' && <span>Webinar</span>}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-neutral-100">
                <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE_EVENTS} onPageChange={setCurrentPage} />
              </div>
            )}
          </div>
        )}

        {/* Stats summary */}
        <div className="flex items-center gap-4 text-[11px] text-neutral-400">
          <span>{events.length} evenement{events.length > 1 ? 's' : ''}</span>
          <span>{events.filter(e => e.publicationStatus === 'online').length} en ligne</span>
          <span>{events.filter(e => e.status === 'scheduled').length} a venir</span>
        </div>
      </div>
    </AdminLayout>
  );
}
