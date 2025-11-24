'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from './Sidebar';
import ProtectedRoute from './ProtectedRoute';
import { Menu, X, Camera } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-neutral-50">
        <Sidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-60 bg-white border-b border-neutral-200 px-3 py-2.5 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-base font-bold text-brand">Admin CSE</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Icône Scanner QR - Touch optimized */}
            <Link
              href="/scanner"
              className="p-3 bg-brand text-white rounded-xl hover:bg-brand-dark transition-colors shadow-md active:scale-95"
              title="Scanner"
            >
              <Camera className="w-6 h-6" />
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 hover:bg-neutral-100 rounded-xl transition-colors active:scale-95"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-neutral-700" />
              ) : (
                <Menu className="w-6 h-6 text-neutral-700" />
              )}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 lg:ml-56 pt-16 lg:pt-0">
          <div className="p-3 md:p-4 lg:p-6 max-w-full">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
