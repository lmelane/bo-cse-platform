'use client';

import React from 'react';
import QRScanner from '@/components/QRScanner';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ArrowLeft, ScanLine, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function ScannerPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-neutral-950">
        {/* Minimal header — dark theme for scanning context */}
        <header className="bg-neutral-900 border-b border-neutral-800">
          <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
            <Link href="/scanner/stats" className="p-1.5 -ml-1.5 text-neutral-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-brand" />
              <span className="text-sm font-medium text-white">Contrôle d&apos;accès</span>
            </div>
            <Link href="/scanner/stats" className="p-1.5 -mr-1.5 text-neutral-400 hover:text-white transition-colors">
              <BarChart3 className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* Scanner — full width, dark bg optimal for camera */}
        <main className="max-w-lg mx-auto px-4 py-4">
          <QRScanner />
        </main>
      </div>
    </ProtectedRoute>
  );
}
