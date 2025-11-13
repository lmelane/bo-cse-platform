'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { eventsApi, participantsApi, Event, GlobalParticipantsResponse, GlobalParticipant } from '@/lib/api';
import { Users, Loader2, Calendar, DollarSign, UserCheck, UserX, Clock, Eye, Search, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ParticipantDetailsModal from '@/components/ParticipantDetailsModal';
import { exportToCSV } from '@/lib/csv-utils';
import toast from 'react-hot-toast';

export default function ParticipantsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [participantsData, setParticipantsData] = useState<GlobalParticipantsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<GlobalParticipant | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Charger la liste des événements au montage
  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger les participants quand un événement est sélectionné
  useEffect(() => {
    loadParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await eventsApi.getAll();
      setEvents(response.data);
      // loadParticipants sera appelé automatiquement par le useEffect
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erreur lors du chargement des événements');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      setLoadingParticipants(true);
      setError(null);
      
      // Si "all" est sélectionné, ne pas filtrer par eventId
      const params = selectedEventId === 'all' 
        ? undefined 
        : { eventId: selectedEventId };
      
      const data = await participantsApi.getAll(params);
      setParticipantsData(data);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erreur lors du chargement des participants');
      console.error('Error loading participants:', err);
    } finally {
      setLoadingParticipants(false);
    }
  };

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

  // Exporter les participants (adhérents + invités) en CSV (sécurisé contre XSS)
  const handleExportParticipants = () => {
    if (!participantsData) return;

    const headers = [
      'Type',
      'ID',
      'Nom',
      'Prénom',
      'Email',
      'Association',
      'Parrain',
      'Statut',
      'Événement',
      'Date Événement',
      'Ville',
      'Lieu',
      'ID Réservation',
      'Titulaire - Nom',
      'Titulaire - Prénom',
      'Titulaire - Email',
      'Nombre de places',
      'Prix total (€)',
      'Payé',
      'Date d\'ajout'
    ];

    const rows: (string | number | boolean | null)[][] = [];
    
    // Pour chaque réservation
    filteredParticipants.forEach(p => {
      // Ajouter l'adhérent (titulaire)
      rows.push([
        'Adhérent',
        p.holder.userId,
        p.holder.lastName,
        p.holder.firstName,
        p.holder.email,
        p.holder.association,
        null, // Pas de parrain pour un adhérent
        'Titulaire',
        p.event.title,
        p.event.startsAt,
        p.event.city,
        p.event.venueName,
        p.bookingId,
        p.holder.lastName,
        p.holder.firstName,
        p.holder.email,
        p.totalPlaces,
        (p.totalPriceCents / 100).toFixed(2),
        p.isPaid ? 'Oui' : 'Non',
        p.createdAt
      ]);
      
      // Ajouter tous les invités de cette réservation
      p.guests.forEach(g => {
        rows.push([
          'Invité',
          g.id,
          g.lastName,
          g.firstName,
          g.email,
          null,
          `${p.holder.firstName} ${p.holder.lastName}`, // Parrain = le titulaire
          g.status === 'validated' ? 'Validé' : g.status === 'pending' ? 'En attente' : 'Refusé',
          p.event.title,
          p.event.startsAt,
          p.event.city,
          p.event.venueName,
          p.bookingId,
          p.holder.lastName,
          p.holder.firstName,
          p.holder.email,
          p.totalPlaces,
          (p.totalPriceCents / 100).toFixed(2),
          p.isPaid ? 'Oui' : 'Non',
          g.createdAt
        ]);
      });
    });

    const eventName = selectedEventId === 'all' ? 'tous' : events.find(e => e.id === selectedEventId)?.title || 'event';
    const filename = `participants_${eventName}_${new Date().toISOString().split('T')[0]}.csv`;
    
    exportToCSV(filename, headers, rows);
  };

  // Filtrer les participants par recherche
  const filteredParticipants = participantsData?.data.filter((participant) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const firstName = participant.holder.firstName?.toLowerCase() || '';
    const lastName = participant.holder.lastName?.toLowerCase() || '';
    const email = participant.holder.email?.toLowerCase() || '';
    const fullName = `${firstName} ${lastName}`;
    
    return firstName.includes(searchLower) ||
           lastName.includes(searchLower) ||
           email.includes(searchLower) ||
           fullName.includes(searchLower);
  }) || [];

  // Calculer les statistiques à partir des participants filtrés
  const filteredStats = {
    totalBookings: filteredParticipants.length,
    totalPlaces: filteredParticipants.reduce((sum, p) => sum + p.totalPlaces, 0),
    totalRevenue: filteredParticipants.reduce((sum, p) => sum + p.totalPriceCents, 0),
    paidBookings: filteredParticipants.filter(p => p.isPaid).length,
    unpaidBookings: filteredParticipants.filter(p => !p.isPaid).length,
    totalGuests: filteredParticipants.reduce((sum, p) => sum + p.guests.length, 0),
    guestsValidated: filteredParticipants.reduce((sum, p) => sum + p.guests.filter(g => g.status === 'validated').length, 0),
    guestsPending: filteredParticipants.reduce((sum, p) => sum + p.guests.filter(g => g.status === 'pending').length, 0),
    guestsRefused: filteredParticipants.reduce((sum, p) => sum + p.guests.filter(g => g.status === 'refused').length, 0),
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Participants</h1>
            <p className="text-neutral-600 mt-2">
              Gérer les participants aux événements
            </p>
          </div>
          {!loading && participantsData && participantsData.data.length > 0 && (
            <button
              onClick={handleExportParticipants}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Exporter les participants
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
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="space-y-4">
              {/* Barre de recherche */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Rechercher un participant
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, prénom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
                  />
                </div>
              </div>

              {/* Sélecteur d'événement */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Filtrer par événement
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
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
        {participantsData && !loadingParticipants && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Réservations */}
              <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Réservations</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {filteredStats.totalBookings}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {filteredStats.totalPlaces} places
                    </p>
                  </div>
                </div>
              </div>

              {/* Revenu Total */}
              <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Revenu total</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {formatPrice(filteredStats.totalRevenue)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {filteredStats.paidBookings} payées / {filteredStats.unpaidBookings} impayées
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Invités */}
              <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Total invités</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {filteredStats.totalGuests}
                    </p>
                  </div>
                </div>
              </div>

              {/* Statut des invités */}
              <div className="bg-white p-6 rounded-xl border border-neutral-200">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-neutral-700">Statut invités</p>
                  <div className="flex items-center gap-2 text-xs">
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span className="text-neutral-600">Validés: {filteredStats.guestsValidated}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Clock className="w-4 h-4 text-yellow-600" />
                    <span className="text-neutral-600">En attente: {filteredStats.guestsPending}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <UserX className="w-4 h-4 text-red-600" />
                    <span className="text-neutral-600">Refusés: {filteredStats.guestsRefused}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tableau des participants */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">
                  Liste des participants
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  {filteredParticipants.length} réservation(s) affichée(s) sur {participantsData.data.length}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                        Nom de l'adhérent
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                        Événement
                      </th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-neutral-700">
                        Nombre total de participants
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                        Date de l'événement
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                        Date réservation
                      </th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredParticipants
                      .sort((a, b) => {
                        // Trier par date de l'événement (du plus récent au plus ancien)
                        if (!a.event.startsAt) return 1;
                        if (!b.event.startsAt) return -1;
                        return new Date(b.event.startsAt).getTime() - new Date(a.event.startsAt).getTime();
                      })
                      .map((participant) => (
                      <tr key={participant.bookingId} className="hover:bg-neutral-50 transition-colors">
                        {/* Nom de l'adhérent */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-neutral-900">
                              {participant.holder.firstName} {participant.holder.lastName}
                            </div>
                            <div className="text-sm text-neutral-500">{participant.holder.email}</div>
                            {participant.holder.association && (
                              <div className="text-xs text-neutral-400 mt-1">{participant.holder.association}</div>
                            )}
                          </div>
                        </td>

                        {/* Événement */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-neutral-900">
                              {participant.event.title}
                            </div>
                            {(participant.event.city || participant.event.venueName) && (
                              <div className="text-xs text-neutral-400 mt-1">
                                {participant.event.venueName && `${participant.event.venueName}`}
                                {participant.event.city && ` - ${participant.event.city}`}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Nombre total de participants */}
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand/10 text-brand text-lg font-bold">
                              {1 + participant.guests.length}
                            </span>
                            <span className="text-xs text-neutral-500 mt-1">
                              {participant.guests.length > 0 ? `1 adhérent + ${participant.guests.length} invité${participant.guests.length > 1 ? 's' : ''}` : '1 adhérent'}
                            </span>
                          </div>
                        </td>

                        {/* Date de l'événement */}
                        <td className="px-6 py-4 text-sm text-neutral-700">
                          {participant.event.startsAt ? (
                            <div>
                              <div className="font-medium">{formatDate(participant.event.startsAt)}</div>
                            </div>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>

                        {/* Date réservation */}
                        <td className="px-6 py-4 text-sm text-neutral-600">
                          {formatDate(participant.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewDetails(participant)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Détails
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

        {/* Loading Participants */}
        {loadingParticipants && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-brand" />
          </div>
        )}

        {/* Empty State - No Results */}
        {participantsData && participantsData.data.length > 0 && filteredParticipants.length === 0 && !loadingParticipants && (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Aucun résultat
            </h3>
            <p className="text-neutral-600 mb-4">
              Aucun participant ne correspond à votre recherche.
            </p>
            <button
              onClick={() => setSearchTerm('')}
              className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
            >
              Réinitialiser la recherche
            </button>
          </div>
        )}

        {/* Empty State - No Participants */}
        {participantsData && participantsData.data.length === 0 && !loadingParticipants && (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <Users className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Aucun participant
            </h3>
            <p className="text-neutral-600">
              {selectedEventId === 'all' 
                ? "Aucun participant trouvé pour l'instant."
                : "Cet événement n'a pas encore de participants."}
            </p>
          </div>
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
