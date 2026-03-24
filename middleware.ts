import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side middleware to protect admin routes.
 * Checks for the presence of the httpOnly "token" cookie
 * (shared across subdomains via COOKIE_DOMAIN).
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page, static assets, and API routes
  const isPublicPath =
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/api');

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Vérifier le cookie httpOnly "token" (partagé entre sous-domaines)
  const token = request.cookies.get('token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Le token est présent — la validation complète est faite par les API routes
  // Le middleware sert de garde rapide pour éviter le rendu de pages protégées
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
