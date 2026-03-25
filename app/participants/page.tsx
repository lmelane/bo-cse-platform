'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import Pagination from '@/components/Pagination';
import { Event, GlobalParticipantsResponse, GlobalParticipant, api, eventsApi, ParticipantBooking } from '@/lib/api';
import { Users, Loader2, Calendar, DollarSign, UserCheck, UserX, Clock, Search, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { exportToCSV } from '@/lib/csv-utils';
import ParticipantDetailsModal from '@/components/ParticipantDetailsModal';
import toast from 'react-hot-toast';
import { useDebounce } from 'use-debounce';
import { ITEMS_PER_PAGE_PARTICIPANTS, SEARCH_DEBOUNCE_MS } from '@/lib/config';

export default function ParticipantsPage() {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  const [selectedParticipant, setSelectedParticipant] = useState<GlobalParticipant | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = ITEMS_PER_PAGE_PARTICIPANTS;

  // Charger les événements pour le filtre
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ['participants-events'],
    queryFn: async () => {
      const eventsResponse = await eventsApi.getAll();
      return eventsResponse.data;
    },
  });

  // Charger les participants (re-fetch quand selectedEventId change)
  const { data: participantsQueryData, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['participants', selectedEventId],
    queryFn: async () => {
      const url = selectedEventId === 'all'
        ? '/api/mgnt-sys-cse/participants'
        : `/api/mgnt-sys-cse/participants?eventId=${selectedEventId}`;

      const response = await api.get<GlobalParticipantsResponse>(url);
      const apiData = response.data;

      // Transformer les données : aplatir bookings + guests
      const flattened: GlobalParticipant[] = apiData.data.flatMap((booking: ParticipantBooking) => {
        const participants: GlobalParticipant[] = [];

        // Ajouter l'adhérent (titulaire de la réservation)
        participants.push({
          type: 'booking',
          id: booking.bookingId,
          firstName: booking.participant.firstName,
          lastName: booking.participant.lastName,
          email: booking.participant.email,
          association: booking.participant.association,
          referredBy: null,
          status: booking.status,
          isPaid: booking.isPaid,
          totalPlaces: booking.totalPlaces,
          totalPriceCents: booking.totalPriceCents,
          eventId: booking.event.id,
          eventTitle: booking.event.title,
          eventDate: booking.event.startsAt,
          createdAt: booking.createdAt,
          presenceStatus: booking.presenceStatus || 'AWAITING',
          scannedAt: booking.scannedAt,
        });

        // Ajouter les invités
        booking.guests.forEach((guest) => {
          participants.push({
            type: 'guest',
            id: guest.guestId,
            firstName: guest.firstName,
            lastName: guest.lastName,
            email: guest.email,
            association: null,
            referredBy: `${booking.participant.firstName} ${booking.participant.lastName}`,
            status: guest.status,
            isPaid: booking.isPaid,
            totalPlaces: 1,
            totalPriceCents: 0,
            eventId: booking.event.id,
            eventTitle: booking.event.title,
            eventDate: booking.event.startsAt,
            createdAt: guest.createdAt,
            presenceStatus: guest.presenceStatus || 'AWAITING',
            scannedAt: guest.scannedAt,
          });
        });

        return participants;
      });

      return {
        participantsData: {
          success: apiData.success,
          stats: apiData.stats,
          data: apiData.data,
          pagination: apiData.pagination,
        } as GlobalParticipantsResponse,
        flattenedParticipants: flattened,
      };
    },
  });

  const error = queryError ? (queryError as { response?: { data?: { message?: string } } }).response?.data?.message || 'Erreur lors du chargement des données' : null;
  const participantsData = participantsQueryData?.participantsData ?? null;
  const flattenedParticipants = participantsQueryData?.flattenedParticipants ?? [];

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2) + ' €';
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy à HH:mm', { locale: fr });
  };

  const handleViewDetails = (participant: GlobalParticipant) => {
    setSelectedParticipant(participant);
    setIsDetailsModalOpen(true);
  };

  // Exporter les participants (adhérents + invités) en CSV
  const handleExportParticipants = () => {
    if (!participantsData) return;

    const headers = [
      'Type',
      'ID',
      'Nom',
      'Prénom',
      'Email',
      'Association',
      'Parrain/Référent',
      'Statut',
      'Événement',
      'Date Événement',
      'Payé',
      'Prix (€)',
      'Places',
      'Présence',
      'Scanné le',
      'Date Inscription',
    ];

    // Construire les lignes pour chaque participant
    const rows = flattenedParticipants.map((p: GlobalParticipant) => [
      p.type === 'booking' ? 'Adhérent' : 'Invité',
      p.id,
      p.lastName || '',
      p.firstName || '',
      p.email || '',
      p.association || '',
      p.referredBy || '',
      p.status,
      p.eventTitle,
      p.eventDate ? formatDate(p.eventDate) : '',
      p.isPaid ? 'Oui' : 'Non',
      (p.totalPriceCents / 100).toFixed(2),
      p.totalPlaces.toString(),
      (() => {
        if (p.presenceStatus === 'PRESENT') return 'Présent';
        const now = new Date();
        const eventStart = p.eventDate ? new Date(p.eventDate) : null;
        const isEventStarted = eventStart ? now >= eventStart : true;
        return isEventStarted ? 'Absent' : 'En attente';
      })(),
      p.scannedAt ? formatDate(p.scannedAt) : '',
      formatDate(p.createdAt),
    ]);

    const eventName = selectedEventId === 'all' ? 'tous' : events.find(e => e.id === selectedEventId)?.title || 'event';
    const filename = `participants_${eventName}_${new Date().toISOString().split('T')[0]}.csv`;

    exportToCSV(filename, headers, rows);
    toast.success(`${rows.length} participants exportés avec succès`);
  };

  // Filtrer les participants par recherche (debouncée)
  const filteredParticipants = flattenedParticipants.filter((participant: GlobalParticipant) => {
    if (!debouncedSearchTerm) return true;

    const searchLower = debouncedSearchTerm.toLowerCase();
    const firstName = participant.firstName?.toLowerCase() || '';
    const lastName = participant.lastName?.toLowerCase() || '';
    const email = participant.email?.toLowerCase() || '';
    const fullName = `${firstName} ${lastName}`;

    return firstName.includes(searchLower) ||
      lastName.includes(searchLower) ||
      email.includes(searchLower) ||
      fullName.includes(searchLower);
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredParticipants.length / ITEMS_PER_PAGE);
  const paginatedParticipants = useMemo(() => {
    const sorted = [...filteredParticipants].sort((a: GlobalParticipant, b: GlobalParticipant) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sorted.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredParticipants, currentPage, ITEMS_PER_PAGE]);

  // Utiliser les stats du serveur (pas besoin de recalculer)
  const filteredStats = participantsData?.stats || {
    totalBookings: 0,
    totalPlaces: 0,
    totalRevenue: 0,
    paidBookings: 0,
    unpaidBookings: 0,
    totalGuests: 0,
    guestsValidated: 0,
    guestsPending: 0,
    guestsRefused: 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold text-neutral-900">Participants</h1>
            <p className="text-xs text-neutral-500 mt-0.5">
              Gérer les participants aux événements
            </p>
          </div>
          {!loading && participantsData && flattenedParticipants.length > 0 && (
            <button
              onClick={handleExportParticipants}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-md transition-colors font-medium text-xs whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exporter les participants</span>
              <span className="sm:hidden">Exporter</span>
            </button>
          )}
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

        {/* Recherche et filtres */}
        {!loading && !error && (
          <div className="bg-white rounded-md border border-neutral-200 p-3">
            <div className="flex flex-col md:flex-row gap-2.5">
              {/* Barre de recherche */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, prénom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                  />
                </div>
              </div>

              {/* Sélecteur d'événement */}
              <div className="w-full md:w-72">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                >
                  <option value="all">Tous les événements</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title} {event.startsAt ? `- ${format(new Date(event.startsAt), 'dd/MM/yyyy', { locale: fr })}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Statistiques */}
        {participantsData && !loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Total Réservations */}
              <div className="bg-white p-3 rounded-md border border-neutral-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 rounded-md">
                    <Calendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Réservations</p>
                    <p className="text-lg font-semibold text-neutral-900">
                      {filteredStats.totalBookings}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {filteredStats.totalPlaces} places
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenu Total */}
              <div className="bg-white p-3 rounded-md border border-neutral-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-green-50 rounded-md">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Revenu total</p>
                    <p className="text-lg font-semibold text-neutral-900">
                      {formatPrice(filteredStats.totalRevenue)}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {filteredStats.paidBookings} payées / {filteredStats.unpaidBookings} impayées
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Invités */}
              <div className="bg-white p-3 rounded-md border border-neutral-200">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-50 rounded-md">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500">Total invités</p>
                    <p className="text-lg font-semibold text-neutral-900">
                      {filteredStats.totalGuests}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statut des invités */}
              <div className="bg-white p-3 rounded-md border border-neutral-200">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-neutral-600">Statut invités</p>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <UserCheck className="w-3.5 h-3.5 text-green-600" />
                    <span className="text-neutral-600">Validés: {filteredStats.guestsValidated}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-yellow-600" />
                    <span className="text-neutral-600">En attente: {filteredStats.guestsPending}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <UserX className="w-3.5 h-3.5 text-red-600" />
                    <span className="text-neutral-600">Refusés: {filteredStats.guestsRefused}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau des participants */}
            <div className="bg-white rounded-md border border-neutral-200 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-neutral-200">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Liste des participants
                </h2>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  {filteredParticipants.length} participant(s) affiché(s) sur {flattenedParticipants.length}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">Type</th>
                      <th className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">Nom</th>
                      <th className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">Email</th>
                      <th className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">Événement</th>
                      <th className="text-center px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">Présence</th>
                      <th className="text-left px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">Date</th>
                      <th className="text-center px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {paginatedParticipants.map((participant: GlobalParticipant) => (
                      <tr key={participant.id} className="hover:bg-neutral-50">
                        <td className="px-3 py-1.5">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${participant.type === 'booking' ? 'bg-brand/10 text-brand' : 'bg-purple-100 text-purple-700'
                            }`}>
                            {participant.type === 'booking' ? 'Adhérent' : 'Invité'}
                          </span>
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="text-sm font-medium text-neutral-900">{participant.firstName} {participant.lastName}</div>
                          {participant.referredBy && <div className="text-[11px] text-neutral-500">Via: {participant.referredBy}</div>}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">{participant.email}</td>
                        <td className="px-6 py-4 text-sm text-neutral-900">{participant.eventTitle}</td>
                        <td className="px-6 py-4 text-center">
                          {(() => {
                            const now = new Date();
                            const eventStart = participant.eventDate ? new Date(participant.eventDate) : null;
                            const isEventStarted = eventStart ? now >= eventStart : true;

                            if (participant.presenceStatus === 'PRESENT') {
                              return (
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-700">
                                  Présent
                                </span>
                              );
                            }

                            // Si l'événement n'a pas encore commencé
                            if (!isEventStarted) {
                              return (
                                <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-700">
                                  En attente
                                </span>
                              );
                            }

                            // Si l'événement a commencé ou est terminé et pas scanné
                            return (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                                Absent
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">{formatDate(participant.createdAt)}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleViewDetails(participant)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-brand hover:bg-brand-dark text-white rounded-md transition-colors text-xs font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Voir
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Empty State - No Results */}
        {participantsData && flattenedParticipants.length > 0 && filteredParticipants.length === 0 && !loading && (
          <div className="bg-white rounded-md border border-neutral-200 p-6 text-center">
            <Search className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-900 mb-1.5">
              Aucun résultat
            </h3>
            <p className="text-neutral-600 mb-4">
              Aucun participant ne correspond à votre recherche.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-3 py-1.5 text-xs bg-brand text-white rounded-md hover:bg-brand-dark transition-colors"
            >
              Réinitialiser la recherche
            </button>
          </div>
        )}

        {/* Empty State - No Participants */}
        {participantsData && flattenedParticipants.length === 0 && !loading && (
          <div className="bg-white rounded-md border border-neutral-200 p-6 text-center">
            <Users className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-900 mb-1.5">
              Aucun participant
            </h3>
            <p className="text-neutral-600">
              {selectedEventId === 'all'
                ? "Aucun participant trouvé pour l'instant."
                : "Cet événement n'a pas encore de participants."}
            </p>
          </div>
        )}

        {/* Pagination */}
        {filteredParticipants.length > ITEMS_PER_PAGE && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredParticipants.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modale de détails */}
      <ParticipantDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        participant={selectedParticipant}
      />
    </AdminLayout>
  );
}
