import axios from 'axios';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'user' | 'admin';
}

// Instance axios dédiée à l'auth
// Les appels /api/* sont proxiés par Next.js rewrites — same-origin, pas de CORS
const authClient = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Service d'authentification
export const authService = {
  // Connexion — le token est stocké dans un cookie httpOnly par le serveur
  login: async (email: string, password: string): Promise<{ user: AuthUser }> => {
    const response = await authClient.post<{
      success: boolean;
      message: string;
      user: {
        id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        role: 'user' | 'admin';
      };
    }>('/api/auth/login', { email, password });

    const apiUser = response.data.user;

    // Vérifier que l'utilisateur est admin (case-insensitive)
    if (apiUser.role.toLowerCase() !== 'admin') {
      throw new Error('Accès refusé. Seuls les administrateurs peuvent se connecter.');
    }

    // Mapper snake_case → camelCase + normaliser le rôle en lowercase
    return {
      user: {
        id: apiUser.id,
        email: apiUser.email,
        firstName: apiUser.first_name,
        lastName: apiUser.last_name,
        role: apiUser.role.toLowerCase() as 'user' | 'admin',
      },
    };
  },

  // Récupérer l'utilisateur actuel via le cookie httpOnly
  me: async (): Promise<AuthUser> => {
    const response = await authClient.get<{
      user: {
        id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        role: 'user' | 'admin';
      };
    }>('/api/auth/me');

    const apiUser = response.data.user;

    if (apiUser.role.toLowerCase() !== 'admin') {
      throw new Error('Accès refusé. Seuls les administrateurs peuvent accéder au back-office.');
    }

    return {
      id: apiUser.id,
      email: apiUser.email,
      firstName: apiUser.first_name,
      lastName: apiUser.last_name,
      role: apiUser.role.toLowerCase() as 'user' | 'admin',
    };
  },

  // Déconnexion — supprime le cookie httpOnly côté serveur
  logout: async (): Promise<void> => {
    await authClient.post('/api/auth/logout');
  },
};
