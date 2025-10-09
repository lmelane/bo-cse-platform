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
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  categoryTag: string | null;
  availabilityBadge: string | null;
  presenterName: string | null;
  organizerName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  venueName: string | null;
  city: string | null;
  coverImageUrl: string | null;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
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
  title: data.title,
  subtitle: data.subtitle,
  slug: data.slug,
  category_tag: data.categoryTag,
  availability_badge: data.availabilityBadge,
  presenter_name: data.presenterName,
  organizer_name: data.organizerName,
  starts_at: data.startsAt,
  ends_at: data.endsAt,
  venue_name: data.venueName,
  city: data.city,
  cover_image_url: data.coverImageUrl,
  status: data.status,
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
