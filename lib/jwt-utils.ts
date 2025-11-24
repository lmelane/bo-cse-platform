/**
 * Utilitaires pour la gestion des JWT
 */

interface JWTPayload {
  exp?: number;
  iat?: number;
  [key: string]: unknown;
}

/**
 * Décode un JWT sans vérification de signature (client-side)
 * ATTENTION: Ne jamais faire confiance au contenu côté serveur
 */
export function decodeJWT(token: string): JWTPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Vérifie si un JWT est expiré
 * @param token - Le token JWT
 * @param bufferSeconds - Marge de sécurité en secondes (défaut: 60s)
 * @returns true si le token est expiré ou invalide
 */
export function isTokenExpired(token: string, bufferSeconds: number = 60): boolean {
  const payload = decodeJWT(token);
  
  if (!payload || !payload.exp) {
    return true; // Token invalide = considéré expiré
  }

  const now = Math.floor(Date.now() / 1000);
  const expirationWithBuffer = payload.exp - bufferSeconds;
  
  return now >= expirationWithBuffer;
}

/**
 * Obtient le temps restant avant expiration en secondes
 * @returns nombre de secondes, ou null si token invalide
 */
export function getTokenTimeToExpiry(token: string): number | null {
  const payload = decodeJWT(token);
  
  if (!payload || !payload.exp) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const timeLeft = payload.exp - now;
  
  return timeLeft > 0 ? timeLeft : 0;
}

/**
 * Extrait une claim spécifique du JWT
 */
export function getTokenClaim<T = unknown>(token: string, claim: string): T | null {
  const payload = decodeJWT(token);
  return (payload?.[claim] as T) ?? null;
}
