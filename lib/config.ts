// ============================================
// Centralized configuration — no magic numbers
// ============================================

// --- Network ---
export const API_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30_000;
export const AUTH_TIMEOUT = Number(process.env.NEXT_PUBLIC_AUTH_TIMEOUT) || 15_000;

// --- Session ---
/** How often to re-validate the session cookie (ms). */
export const SESSION_CHECK_INTERVAL = Number(process.env.NEXT_PUBLIC_SESSION_CHECK_INTERVAL) || 5 * 60 * 1000;

// --- Pagination ---
export const ITEMS_PER_PAGE_USERS = 50;
export const ITEMS_PER_PAGE_PARTICIPANTS = 50;
export const ITEMS_PER_PAGE_EVENTS = 20;

// --- API defaults ---
export const API_DEFAULT_LIMIT = 1000;

// --- Search ---
export const SEARCH_DEBOUNCE_MS = 300;

// --- Cache ---
export const DASHBOARD_STALE_TIME = 30_000;
export const SCANNER_REFETCH_INTERVAL = 30_000;

// --- Business defaults ---
export const DEFAULT_TIMEZONE = 'Europe/Paris';
export const DEFAULT_CURRENCY = 'EUR';

// --- Subscription pricing (fallback if API doesn't provide it) ---
export const SUBSCRIPTION_PRICES = {
  event_based: { cents: 3500, label: 'Adhésion Événementielle' },
  unlimited: { cents: 23500, label: 'Adhésion Illimitée' },
} as const;

// --- URLs ---
export const FRONTEND_URL = process.env.NEXT_PUBLIC_FRONTEND_URL || '';

/**
 * Validate that required environment variables are set.
 * Call this at build-time or app init in production.
 */
export function validateEnv() {
  const missing: string[] = [];

  if (!process.env.NEXT_PUBLIC_API_URL) missing.push('NEXT_PUBLIC_API_URL');
  if (!process.env.NEXT_PUBLIC_FRONTEND_URL) missing.push('NEXT_PUBLIC_FRONTEND_URL');

  if (missing.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Set them in your deployment platform (Vercel, etc.).`
    );
  }
}
