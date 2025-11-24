'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Event, GlobalParticipantsResponse, GlobalParticipant } from '@/lib/api';
import { tokenStorage } from '@/lib/auth';
import { Users, Loader2, Calendar, DollarSign, UserCheck, UserX, Clock, Search, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { exportToCSV } from '@/lib/csv-utils';
import ParticipantDetailsModal from '@/components/ParticipantDetailsModal';
import toast from 'react-hot-toast';
import { useDebounce } from 'use-debounce';

export default function ParticipantsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [participantsData, setParticipantsData] = useState<GlobalParticipantsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [selectedParticipant, setSelectedParticipant] = useState<GlobalParticipant | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Charger au montage et quand l'événement change
  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // UN SEUL appel API pour tout
      const token = tokenStorage.get();
      if (!token) {
        throw new Error('Token manquant');
      }

      const url = selectedEventId === 'all' 
        ? 'http://localhost:3001/api/admin/participants/dashboard'
        : `http://localhost:3001/api/admin/participants/dashboard?eventId=${selectedEventId}`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données');
      }

      const data = await response.json();
      
      // Mettre à jour les événements (seulement au premier chargement)
      if (events.length === 0) {
        setEvents(data.events);
      }
      
      // Mettre à jour les participants et stats
      setParticipantsData(data as GlobalParticipantsResponse);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Erreur lors du chargement des données');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
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
    const rows = participantsData.participants.map((p) => [
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
      p.presenceStatus === 'PRESENT' ? 'Présent' : 'Absent',
      p.scannedAt ? formatDate(p.scannedAt) : '',
      formatDate(p.createdAt),
    ]);

    const eventName = selectedEventId === 'all' ? 'tous' : events.find(e => e.id === selectedEventId)?.title || 'event';
    const filename = `participants_${eventName}_${new Date().toISOString().split('T')[0]}.csv`;
    
    exportToCSV(filename, headers, rows);
    toast.success(`${rows.length} participants exportés avec succès`);
  };

  // Filtrer les participants par recherche (debouncée)
  const filteredParticipants = participantsData?.participants.filter((participant) => {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Participants</h1>
            <p className="text-sm md:text-base text-neutral-600 mt-1 md:mt-2">
              Gérer les participants aux événements
            </p>
          </div>
          {!loading && participantsData && participantsData.participants.length > 0 && (
            <button
              onClick={handleExportParticipants}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors font-medium whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
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
        {participantsData && !loading && (
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
              <div className="px-4 md:px-6 py-4 border-b border-neutral-200">
                <h2 className="text-base md:text-lg font-semibold text-neutral-900">
                  Liste des participants
                </h2>
                <p className="text-xs md:text-sm text-neutral-600 mt-1">
                  {filteredParticipants.length} participant(s) affiché(s) sur {participantsData.participants.length}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Type</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Nom</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Email</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Événement</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-neutral-700">Présence</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-700">Date</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-neutral-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {filteredParticipants.sort((a, b) => 
                      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    ).map((participant) => (
                      <tr key={participant.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            participant.type === 'booking' ? 'bg-brand/10 text-brand' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {participant.type === 'booking' ? 'Adhérent' : 'Invité'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-neutral-900">{participant.firstName} {participant.lastName}</div>
                          {participant.referredBy && <div className="text-xs text-neutral-500 mt-1">Via: {participant.referredBy}</div>}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">{participant.email}</td>
                        <td className="px-6 py-4 text-sm text-neutral-900">{participant.eventTitle}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            participant.presenceStatus === 'PRESENT' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {participant.presenceStatus === 'PRESENT' ? 'Présent' : 'Absent'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-600">{formatDate(participant.createdAt)}</td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleViewDetails(participant)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors text-sm font-medium"
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
        {participantsData && participantsData.participants.length > 0 && filteredParticipants.length === 0 && !loading && (
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
        {participantsData && participantsData.participants.length === 0 && !loading && (
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
