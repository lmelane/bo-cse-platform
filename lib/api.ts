import axios, { AxiosError } from 'axios';
import { API_TIMEOUT, DEFAULT_TIMEZONE, DEFAULT_CURRENCY, API_DEFAULT_LIMIT } from './config';

// Instance axios configurée
// Les appels /api/* sont proxiés par Next.js rewrites vers cse-plateform.
// Pas de baseURL nécessaire — tout passe par le même origin (same-origin).
// Le cookie httpOnly est envoyé automatiquement (same-origin, pas de CORS).
export const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: API_TIMEOUT,
});

// Intercepteur de réponse pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Erreur réseau (pas de réponse du serveur)
    if (!error.response) {
      console.error('[API] Erreur réseau:', error.message);
      return Promise.reject(new Error('Erreur de connexion au serveur. Vérifiez votre connexion internet.'));
    }

    // Si 401 (non autorisé), rediriger vers login
    if (error.response.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?session=expired';
      }
    }

    // Si 403 (interdit), l'utilisateur n'a pas les droits
    if (error.response.status === 403) {
      console.error('[API] Accès refusé');
    }

    // Si 429 (rate limit), informer l'utilisateur
    if (error.response.status === 429) {
      console.error('[API] Trop de requêtes');
      return Promise.reject(new Error('Trop de requêtes. Veuillez patienter quelques instants.'));
    }

    // Si 500+, erreur serveur
    if (error.response.status >= 500) {
      console.error('[API] Erreur serveur:', error.response.status);
      return Promise.reject(new Error('Erreur serveur. Veuillez réessayer plus tard.'));
    }

    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  association: string | null;
  linkedinUrl: string | null;
  role: 'user' | 'admin';
  onboardingCompleted: boolean;

  // Informations professionnelles
  currentPosition: string | null;
  activitySector: string | null;
  positionDuration: string | null;
  careerPath: string | null;
  interests: string[] | null;

  // Informations d'abonnement
  subscriptionType: 'event_based' | 'unlimited' | null;
  subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED' | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  subscriptionPriceCents: number | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'pending' | 'validated' | 'refused';
  createdAt: string;

  // Info sur la réservation
  booking: {
    id: string;
    isPaid: boolean;
    totalPriceCents: number;
    holder: {
      email: string;
      firstName: string;
      lastName: string;
    };
  };

  // Info sur l'événement
  event: {
    id: string;
    title: string;
    startsAt: string;
  };
}

export interface GuestsResponse {
  stats: {
    total: number;
    validated: number;
    pending: number;
    refused: number;
  };
  guests: Guest[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface Participant {
  bookingId: string;
  createdAt: string;
  isPaid: boolean;
  totalPlaces: number;
  totalPriceCents: number;
  status: string;

  // Titulaire de la réservation
  holder: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    association: string | null;
  };

  // Liste des invités
  guests: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: 'pending' | 'validated' | 'refused';
    createdAt: string;
  }[];
}

export interface ParticipantsResponse {
  success: boolean;
  event: {
    id: string;
    title: string;
    startsAt: string | null;
  };
  stats: {
    totalBookings: number;
    totalPlaces: number;
    totalRevenue: number;
    paidBookings: number;
    unpaidBookings: number;
    totalGuests: number;
    guestsValidated: number;
    guestsPending: number;
    guestsRefused: number;
  };
  data: Participant[];
}

// Structure de la réponse de l'API /api/mgnt-sys-cse/participants
export interface ParticipantBooking {
  type: 'booking';
  bookingId: string;
  createdAt: string;
  isPaid: boolean;
  totalPlaces: number;
  totalPriceCents: number;
  status: 'active' | 'cancelled';

  // Présence
  presenceStatus: 'PRESENT' | 'ABSENT' | 'AWAITING';
  scannedAt: string | null;
  scannedBy: string | null;

  participant: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    association: string;
  };

  event: {
    id: string;
    title: string;
    startsAt: string;
    city: string | null;
    venueName: string | null;
  };

  guests: Array<{
    guestId: string;
    email: string;
    firstName: string;
    lastName: string;
    status: 'validated' | 'pending' | 'refused';
    createdAt: string;
    presenceStatus: 'PRESENT' | 'ABSENT' | 'AWAITING';
    scannedAt: string | null;
    scannedBy: string | null;
  }>;
}

export interface GlobalParticipantsResponse {
  success: boolean;
  stats: {
    totalBookings: number;
    totalPlaces: number;
    totalRevenue: number;
    paidBookings: number;
    unpaidBookings: number;
    totalGuests: number;
    guestsValidated: number;
    guestsPending: number;
    guestsRefused: number;
  };
  data: ParticipantBooking[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Type aplati pour l'affichage dans le tableau
export interface GlobalParticipant {
  type: 'booking' | 'guest';
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  association: string | null;
  referredBy: string | null;
  status: string;
  isPaid: boolean;
  totalPlaces: number;
  totalPriceCents: number;
  eventId: string;
  eventTitle: string;
  eventDate: string | null;
  createdAt: string;
  presenceStatus: string;
  scannedAt: string | null;
}

export interface Event {
  // Identifiants
  id: string;
  slug: string;

  // Informations principales
  title: string;
  subtitle: string | null;
  categoryTag: string | null;

  // Type d'événement (NOUVEAU - optionnel pour rétrocompatibilité)
  eventType?: 'PHYSICAL' | 'WEBINAR';
  webinarUrl: string | null;

  // Intervenants
  presenterName: string | null;
  organizerName: string | null;
  organizerUrl: string | null;

  // Dates et horaires
  startsAt: string | null;
  endsAt: string | null;
  timezone: string | null;

  // Localisation
  venueName: string | null;
  addressLine1: string | null;
  postalCode: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  fullAddress: string | null;
  latitude: number | null;
  longitude: number | null;

  // Tarification
  minPriceCents: number | null;
  currency: string | null;
  ticketStatus: string | null;
  externalBookingUrl: string | null;

  // Gestion des places
  maxParticipants: number | null;
  limitedThreshold: number | null;

  // Médias
  coverImageUrl: string | null;

  // Contenu
  descriptionHtml: string | null;
  infoPratiquesJson: Record<string, unknown> | null;
  policyJson: Record<string, unknown> | null;

  // Statut
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  publicationStatus: 'online' | 'offline' | 'draft';
  source: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// API Endpoints - Users
export const usersApi = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; count: number; data: User[] }>('/api/mgnt-sys-cse/users');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: User }>(`/api/mgnt-sys-cse/users/${id}`);
    return response.data;
  },

  createSubscription: async (id: string, data: {
    subscription_type: 'event_based' | 'unlimited';
    start_date: string;
    end_date: string;
  }) => {
    const response = await api.post<{ success: boolean; message: string; data: User }>(
      `/api/mgnt-sys-cse/users/${id}/subscription`,
      data
    );
    return response.data;
  },

  inviteAdmin: async (email: string) => {
    const response = await api.post<{ success: boolean; message: string }>('/api/mgnt-sys-cse/admins/invite', { email });
    return response.data;
  },
};

// Helper: Convertir Event (camelCase) vers format API (snake_case)
const eventToApiFormat = (data: Partial<Event>) => ({
  // Identifiants
  title: data.title,
  slug: data.slug,

  // Informations principales
  subtitle: data.subtitle,
  category_tag: data.categoryTag,

  // Type d'événement (NOUVEAU)
  event_type: data.eventType || 'PHYSICAL',
  webinar_url: data.webinarUrl,

  // Intervenants
  presenter_name: data.presenterName,
  organizer_name: data.organizerName,
  organizer_url: data.organizerUrl,

  // Dates et horaires
  starts_at: data.startsAt,
  ends_at: data.endsAt,
  timezone: data.timezone || DEFAULT_TIMEZONE,

  // Localisation
  venue_name: data.venueName,
  address_line1: data.addressLine1,
  postal_code: data.postalCode,
  city: data.city,
  region: data.region,
  country: data.country,
  full_address: data.fullAddress,
  latitude: data.latitude,
  longitude: data.longitude,

  // Tarification
  min_price_cents: data.minPriceCents,
  currency: data.currency || DEFAULT_CURRENCY,
  ticket_status: data.ticketStatus,
  external_booking_url: data.externalBookingUrl,

  // Gestion des places
  max_participants: data.maxParticipants,
  limited_threshold: data.limitedThreshold,

  // Médias
  cover_image_url: data.coverImageUrl,

  // Contenu
  description_html: data.descriptionHtml,
  info_pratiques_json: data.infoPratiquesJson,
  policy_json: data.policyJson,

  // Statut
  status: data.status || 'scheduled',
  publication_status: data.publicationStatus || 'draft',
  source: data.source,
});

// API Endpoints - Events
export const eventsApi = {
  getAll: async () => {
    const response = await api.get<{ success: boolean; count: number; data: Event[] }>('/api/mgnt-sys-cse/events');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<{ success: boolean; data: Event }>(`/api/mgnt-sys-cse/events/${id}`);
    return response.data;
  },

  create: async (data: Partial<Event>) => {
    const apiData = eventToApiFormat(data);
    const response = await api.post<{ success: boolean; data: Event }>('/api/mgnt-sys-cse/events', apiData);
    return response.data;
  },

  update: async (id: string, data: Partial<Event>) => {
    const apiData = eventToApiFormat(data);
    const response = await api.put<{ success: boolean; data: Event }>(`/api/mgnt-sys-cse/events/${id}`, apiData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/api/mgnt-sys-cse/events/${id}`);
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await api.patch<{ success: boolean; data: Event }>(`/api/mgnt-sys-cse/events/${id}/cancel`);
    return response.data;
  },

  updatePublication: async (id: string, publicationState: 'online' | 'offline' | 'draft') => {
    const response = await api.patch<{ success: boolean; data: Event }>(`/api/mgnt-sys-cse/events/${id}/publication`, { publication_state: publicationState });
    return response.data;
  },

  getParticipants: async (id: string) => {
    const response = await api.get<ParticipantsResponse>(`/api/mgnt-sys-cse/events/${id}/participants`);
    return response.data;
  },
};

// API Endpoints - Participants (Global)
export const participantsApi = {
  getAll: async (params?: {
    eventId?: string;
    status?: 'validated' | 'pending' | 'cancelled';
    isPaid?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.eventId) queryParams.append('eventId', params.eventId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.isPaid !== undefined) queryParams.append('isPaid', params.isPaid.toString());

    // Limite par défaut pour éviter de charger trop de données
    const limit = params?.limit ?? API_DEFAULT_LIMIT;
    const offset = params?.offset ?? 0;

    queryParams.append('limit', limit.toString());
    queryParams.append('offset', offset.toString());

    const url = `/api/mgnt-sys-cse/participants${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<GlobalParticipantsResponse>(url);
    return response.data;
  },
};

// API Endpoints - Scanner (admin)
export const scannerApi = {
  validate: async (qrToken: string) => {
    const response = await api.post<{
      success: boolean;
      message: string;
      alreadyScanned?: boolean;
      scannedAt?: string;
      participant?: {
        type?: string;
        name: string;
        email?: string;
        event: string;
        places?: number;
        scannedAt?: string;
      };
    }>('/api/admin/scanner/validate', { qrToken });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get<{
      totalScans: number;
      successfulScans: number;
      failedScans: number;
      duplicateScans: number;
      todayScans: number;
      attendanceRate: number;
      scansPerHour: Array<{ hour: string; count: number }>;
      recentScans: Array<{
        id: string;
        participantName: string;
        eventTitle: string;
        scannedAt: string;
        success: boolean;
      }>;
      topEvents: Array<{
        eventTitle: string;
        totalParticipants: number;
        scannedCount: number;
        attendanceRate: number;
      }>;
    }>('/api/admin/scanner/stats');
    return response.data;
  },
};

// API Endpoints - Admin Dashboard
export const dashboardApi = {
  getEvents: async () => {
    const response = await api.get('/api/admin/events/dashboard');
    return response.data;
  },

  // BO1 fix: Agrégations serveur pour le dashboard (remplace le chargement total côté client)
  getStats: async () => {
    const response = await api.get<{
      financial: {
        totalRevenue: number;
        arr: number;
        mrr: number;
        activeSubscriptions: number;
        expiredSubscriptions: number;
        inactiveSubscriptions: number;
        churnRate: number;
        eventBasedCount: number;
        unlimitedCount: number;
        conversionRate: number;
        arpu: number;
      };
      events: {
        total: number;
        upcoming: number;
        past: number;
        cancelled: number;
        online: number;
      };
      participants: {
        totalBookings: number;
        totalPlaces: number;
        totalRevenue: number;
        totalGuests: number;
        guestsValidated: number;
        guestsPending: number;
        guestsRefused: number;
        averagePerEvent: number;
      };
      totalUsers: number;
    }>('/api/admin/dashboard/stats');
    return response.data;
  },
};

// API Endpoints - Guests
export const guestsApi = {
  getAll: async (params?: {
    status?: 'pending' | 'validated' | 'refused';
    eventId?: string;
    limit?: number;
    offset?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.eventId) queryParams.append('eventId', params.eventId);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `/api/mgnt-sys-cse/guests${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await api.get<GuestsResponse>(url);
    return response.data;
  },
};
