import axios from 'axios';
import { tokenStorage } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Instance axios configurée
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT à toutes les requêtes
api.interceptors.request.use((config) => {
  const userToken = tokenStorage.get();
  if (userToken) {
    config.headers.Authorization = `Bearer ${userToken}`;
  }
  return config;
});

// Types
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  association: string | null;
  role: 'user' | 'admin';
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  // Identifiants
  id: string;
  slug: string;
  
  // Informations principales
  title: string;
  subtitle: string | null;
  categoryTag: string | null;
  availabilityBadge: string | null;
  
  // Intervenants
  presenterName: string | null;
  organizerName: string | null;
  organizerUrl: string | null;
  
  // Dates et horaires
  startsAt: string | null;
  endsAt: string | null;
  timezone: string | null;
  rawDatetimeLabel: string | null;
  
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
  
  // Médias
  coverImageUrl: string | null;
  galleryUrls: string[];
  
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
  
  updateRole: async (id: string, role: 'user' | 'admin') => {
    const response = await api.patch<{ success: boolean; data: User }>(`/api/mgnt-sys-cse/users/${id}/role`, { role });
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
  availability_badge: data.availabilityBadge,
  
  // Intervenants
  presenter_name: data.presenterName,
  organizer_name: data.organizerName,
  organizer_url: data.organizerUrl,
  
  // Dates et horaires
  starts_at: data.startsAt,
  ends_at: data.endsAt,
  timezone: data.timezone || 'Europe/Paris',
  raw_datetime_label: data.rawDatetimeLabel,
  
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
  currency: data.currency || 'EUR',
  ticket_status: data.ticketStatus,
  external_booking_url: data.externalBookingUrl,
  
  // Médias
  cover_image_url: data.coverImageUrl,
  gallery_urls: data.galleryUrls || [],
  
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
};
