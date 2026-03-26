'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import Pagination from '@/components/Pagination';
import { Event, GlobalParticipantsResponse, GlobalParticipant, api, eventsApi, ParticipantBooking } from '@/lib/api';
import { Loader2, Search, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { exportToCSV } from '@/lib/csv-utils';
import toast from 'react-hot-toast';
import { useDebounce } from 'use-debounce';
import { ITEMS_PER_PAGE_PARTICIPANTS, SEARCH_DEBOUNCE_MS } from '@/lib/config';

function Dot({ color }: { color: string }) {
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
}

export default function ParticipantsPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['participants-events'],
    queryFn: async () => { const r = await eventsApi.getAll(); return r.data; },
  });

  const { data: queryData, isLoading, error: queryError } = useQuery({
    queryKey: ['participants', selectedEventId],
    queryFn: async () => {
      const url = selectedEventId === 'all' ? '/api/mgnt-sys-cse/participants' : `/api/mgnt-sys-cse/participants?eventId=${selectedEventId}`;
      const response = await api.get<GlobalParticipantsResponse>(url);
      const apiData = response.data;

      const flattened: GlobalParticipant[] = apiData.data.flatMap((booking: ParticipantBooking) => {
        const parts: GlobalParticipant[] = [{
          type: 'booking', id: booking.bookingId,
          firstName: booking.participant.firstName, lastName: booking.participant.lastName,
          email: booking.participant.email, association: booking.participant.association,
          referredBy: null, status: booking.status, isPaid: booking.isPaid,
          totalPlaces: booking.totalPlaces, totalPriceCents: booking.totalPriceCents,
          eventId: booking.event.id, eventTitle: booking.event.title,
          eventDate: booking.event.startsAt, createdAt: booking.createdAt,
          presenceStatus: booking.presenceStatus || 'AWAITING', scannedAt: booking.scannedAt,
        }];
        booking.guests.forEach((g) => {
          parts.push({
            type: 'guest', id: g.guestId,
            firstName: g.firstName, lastName: g.lastName, email: g.email,
            association: null, referredBy: `${booking.participant.firstName} ${booking.participant.lastName}`,
            status: g.status, isPaid: booking.isPaid, totalPlaces: 1, totalPriceCents: 0,
            eventId: booking.event.id, eventTitle: booking.event.title,
            eventDate: booking.event.startsAt, createdAt: g.createdAt,
            presenceStatus: g.presenceStatus || 'AWAITING', scannedAt: g.scannedAt,
          });
        });
        return parts;
      });

      return { stats: apiData.stats, flat: flattened, raw: apiData };
    },
  });

  const error = queryError ? 'Erreur lors du chargement' : null;
  const stats = queryData?.stats;
  const flat = queryData?.flat ?? [];

  const fmtDate = (d: string) => format(new Date(d), 'dd MMM yyyy', { locale: fr });
  const fmtPrice = (c: number) => `${(c / 100).toFixed(2)} €`;

  const filtered = flat.filter((p: GlobalParticipant) => {
    if (!debouncedSearchTerm) return true;
    const s = debouncedSearchTerm.toLowerCase();
    return [p.firstName, p.lastName, p.email].some(v => v?.toLowerCase().includes(s));
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE_PARTICIPANTS);
  const paginated = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const s = (currentPage - 1) * ITEMS_PER_PAGE_PARTICIPANTS;
    return sorted.slice(s, s + ITEMS_PER_PAGE_PARTICIPANTS);
  }, [filtered, currentPage]);

  const getPresence = (p: GlobalParticipant) => {
    if (p.presenceStatus === 'PRESENT') return { label: 'Présent', dot: 'bg-green-500' };
    const started = p.eventDate ? new Date() >= new Date(p.eventDate) : true;
    return started ? { label: 'Absent', dot: 'bg-neutral-300' } : { label: 'En attente', dot: 'bg-blue-400' };
  };

  const handleExport = () => {
    const headers = ['Type', 'Nom', 'Prénom', 'Email', 'Événement', 'Présence', 'Date inscription'];
    const rows = filtered.map((p: GlobalParticipant) => [
      p.type === 'booking' ? 'Adhérent' : 'Invité',
      p.lastName || '', p.firstName || '', p.email || '',
      p.eventTitle, getPresence(p).label, fmtDate(p.createdAt),
    ]);
    const name = selectedEventId === 'all' ? 'tous' : events.find(e => e.id === selectedEventId)?.title || 'event';
    exportToCSV(`participants_${name}_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
    toast.success(`${rows.length} participants exportés`);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-neutral-900">Participants</h1>
          {flat.length > 0 && (
            <button onClick={handleExport} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-600 border border-neutral-200 rounded-md hover:bg-neutral-50 font-medium">
              <Download className="w-3.5 h-3.5" /> Exporter
            </button>
          )}
        </div>

        {/* KPIs — inline row */}
        {stats && !isLoading && (
          <div className="flex items-center gap-5 text-xs text-neutral-500">
            <span><strong className="text-neutral-900 font-semibold">{stats.totalBookings}</strong> réservations</span>
            <span><strong className="text-neutral-900 font-semibold">{stats.totalPlaces}</strong> places</span>
            <span><strong className="text-neutral-900 font-semibold">{fmtPrice(stats.totalRevenue)}</strong> CA</span>
            <span><strong className="text-neutral-900 font-semibold">{stats.totalGuests}</strong> invités</span>
          </div>
        )}

        {/* Filters */}
        {!isLoading && !error && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text" value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Rechercher..."
                className="w-full h-9 pl-10 pr-3 border border-neutral-200 rounded-md text-sm bg-white focus:outline-none focus:border-neutral-400"
              />
            </div>
            <select
              value={selectedEventId}
              onChange={(e) => { setSelectedEventId(e.target.value); setCurrentPage(1); }}
              className="h-9 px-3 border border-neutral-200 rounded-md text-sm bg-white focus:outline-none focus:border-neutral-400 max-w-xs"
            >
              <option value="all">Tous les événements</option>
              {events.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
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
            <p className="text-sm text-neutral-500">{flat.length === 0 ? 'Aucun participant' : 'Aucun résultat'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="px-4 py-2.5 text-left text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Participant</th>
                  <th className="px-4 py-2.5 text-left text-[11px] text-neutral-500 uppercase tracking-wider font-medium hidden md:table-cell">Événement</th>
                  <th className="px-4 py-2.5 text-left text-[11px] text-neutral-500 uppercase tracking-wider font-medium hidden sm:table-cell">Date</th>
                  <th className="px-4 py-2.5 text-right text-[11px] text-neutral-500 uppercase tracking-wider font-medium">Présence</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p: GlobalParticipant) => {
                  const presence = getPresence(p);
                  const isExpanded = expandedId === p.id;
                  return (
                    <React.Fragment key={p.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        className={`border-b border-neutral-100 cursor-pointer transition-colors ${isExpanded ? 'bg-neutral-50' : 'hover:bg-neutral-50/50'}`}
                      >
                        <td className="px-4 py-2.5">
                          <p className="text-sm font-medium text-neutral-900">{p.firstName} {p.lastName}</p>
                          <p className="text-[11px] text-neutral-400">{p.email}</p>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-neutral-600 truncate max-w-[200px] hidden md:table-cell">{p.eventTitle}</td>
                        <td className="px-4 py-2.5 text-sm text-neutral-500 hidden sm:table-cell whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="inline-flex items-center gap-1.5 text-[11px] text-neutral-600">
                            <Dot color={presence.dot} />
                            {presence.label}
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={4} className="bg-neutral-50 border-b border-neutral-200 px-4 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-neutral-400">Type</span>
                                <p className="text-neutral-900 font-medium">{p.type === 'booking' ? 'Adhérent' : 'Invité'}</p>
                              </div>
                              {p.referredBy && (
                                <div>
                                  <span className="text-neutral-400">Invité par</span>
                                  <p className="text-neutral-900 font-medium">{p.referredBy}</p>
                                </div>
                              )}
                              {p.association && (
                                <div>
                                  <span className="text-neutral-400">Association</span>
                                  <p className="text-neutral-900 font-medium">{p.association}</p>
                                </div>
                              )}
                              <div>
                                <span className="text-neutral-400">Places</span>
                                <p className="text-neutral-900 font-medium">{p.totalPlaces}</p>
                              </div>
                              {p.totalPriceCents > 0 && (
                                <div>
                                  <span className="text-neutral-400">Montant</span>
                                  <p className="text-neutral-900 font-medium">{fmtPrice(p.totalPriceCents)}</p>
                                </div>
                              )}
                              <div>
                                <span className="text-neutral-400">Payé</span>
                                <p className="text-neutral-900 font-medium">{p.isPaid ? 'Oui' : 'Non'}</p>
                              </div>
                              {p.scannedAt && (
                                <div>
                                  <span className="text-neutral-400">Scanné le</span>
                                  <p className="text-neutral-900 font-medium">{format(new Date(p.scannedAt), 'dd/MM HH:mm', { locale: fr })}</p>
                                </div>
                              )}
                              <div>
                                <span className="text-neutral-400">ID</span>
                                <p className="text-neutral-500 font-mono text-[10px]">{p.id.substring(0, 8)}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-neutral-100">
                <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} itemsPerPage={ITEMS_PER_PAGE_PARTICIPANTS} onPageChange={setCurrentPage} />
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
