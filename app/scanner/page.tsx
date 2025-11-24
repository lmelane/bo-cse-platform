'use client';

import React from 'react';
import { QRScanner } from '@/components/QRScanner';
import { ArrowLeft, Camera, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function ScannerPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header blanc + texte plus petit */}
      <div className="bg-white border-b border-neutral-200 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/events"
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-neutral-700" />
              </Link>
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand" />
                <h1 className="text-base font-semibold text-neutral-800">Contrôle d&apos;accès</h1>
              </div>
            </div>
            <Link
              href="/scanner/stats"
              className="flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors text-sm font-medium text-neutral-700"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Stats</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-4">
        <QRScanner />
      </div>
    </div>
  );
}
