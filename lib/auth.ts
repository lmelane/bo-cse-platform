import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'user' | 'admin';
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: AuthUser;
}

// Service d'authentification
export const authService = {
  // Connexion
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post<LoginResponse>(`${API_URL}/api/auth/login`, {
      email,
      password,
    });
    
    // Vérifier que l'utilisateur est admin
    if (response.data.user.role !== 'admin') {
      throw new Error('Accès refusé. Seuls les administrateurs peuvent se connecter.');
    }
    
    return response.data;
  },

  // Récupérer l'utilisateur actuel
  me: async (token: string): Promise<AuthUser> => {
    const response = await axios.get<{ user: AuthUser }>(`${API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    // Vérifier que l'utilisateur est admin
    if (response.data.user.role !== 'admin') {
      throw new Error('Accès refusé. Seuls les administrateurs peuvent accéder au back-office.');
    }
    
    return response.data.user;
  },

  // Déconnexion
  logout: async (token: string): Promise<void> => {
    await axios.post(`${API_URL}/api/auth/logout`, {}, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

// Gestion du token dans localStorage
export const tokenStorage = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('admin_token');
  },

  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('admin_token', token);
  },

  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('admin_token');
  },
};
