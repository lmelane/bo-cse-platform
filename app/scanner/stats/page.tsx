'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Camera, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { tokenStorage } from '@/lib/auth';

interface ScanStats {
  totalScans: number;
  successfulScans: number;
  failedScans: number;
  duplicateScans: number;
  todayScans: number;
  attendanceRate: number;
  scansPerHour: { hour: string; count: number }[];
  recentScans: {
    id: string;
    participantName: string;
    eventTitle: string;
    scannedAt: string;
    success: boolean;
  }[];
  topEvents: {
    eventTitle: string;
    totalParticipants: number;
    scannedCount: number;
    attendanceRate: number;
  }[];
}

export default function ScannerStatsPage() {
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    // Auto-refresh toutes les 30 secondes
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const adminToken = tokenStorage.get();
      if (!adminToken) {
        setError('Token admin manquant - Veuillez vous reconnecter');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/admin/scanner/stats`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) throw new Error('Erreur chargement stats');

      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Statistiques Scanner</h1>
            <p className="text-sm text-neutral-500 mt-1">Analyse des scans QR en temps réel</p>
          </div>
          <Link
            href="/scanner"
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            Scanner
          </Link>
        </div>

        {loading && (
          <div className="text-center py-12 text-neutral-500">
            Chargement...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* KPIs Principaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Scans */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:border-brand transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-brand-50 rounded-lg">
                    <Camera className="w-5 h-5 text-brand" />
                  </div>
                  <p className="text-sm text-neutral-600">Total Scans</p>
                </div>
                <p className="text-3xl font-bold text-neutral-900">{stats.totalScans}</p>
                <p className="text-xs text-neutral-500 mt-2">Aujourd&apos;hui: {stats.todayScans}</p>
              </div>

              {/* Scans Réussis */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:border-green-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-sm text-neutral-600">Réussis</p>
                </div>
                <p className="text-3xl font-bold text-green-600">{stats.successfulScans}</p>
                <p className="text-xs text-neutral-500 mt-2">
                  {stats.totalScans > 0 ? ((stats.successfulScans / stats.totalScans) * 100).toFixed(1) : 0}% du total
                </p>
              </div>

              {/* Échecs */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:border-red-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <p className="text-sm text-neutral-600">Échecs</p>
                </div>
                <p className="text-3xl font-bold text-red-600">{stats.failedScans}</p>
                <p className="text-xs text-neutral-500 mt-2">
                  {stats.duplicateScans} doublons
                </p>
              </div>

              {/* Taux de Présence */}
              <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-sm text-neutral-600">Présence</p>
                </div>
                <p className="text-3xl font-bold text-blue-600">{stats.attendanceRate.toFixed(1)}%</p>
                <p className="text-xs text-neutral-500 mt-2">Taux moyen</p>
              </div>
            </div>

            {/* Scans par Heure */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Scans par heure</h2>
              <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                {stats.scansPerHour.map((item) => (
                  <div key={item.hour} className="text-center">
                    <div
                      className="bg-brand-50 rounded-lg mb-1 flex items-end justify-center"
                      style={{ height: '80px' }}
                    >
                      <div
                        className="bg-brand rounded-t w-full transition-all"
                        style={{
                          height: `${item.count > 0 ? Math.max((item.count / Math.max(...stats.scansPerHour.map(s => s.count))) * 100, 10) : 0}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-neutral-600">{item.hour}h</p>
                    <p className="text-xs font-semibold text-neutral-900">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Événements */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Top Événements</h2>
              <div className="space-y-3">
                {stats.topEvents.map((event, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-neutral-900">{event.eventTitle}</p>
                      <p className="text-sm text-neutral-500">
                        {event.scannedCount} / {event.totalParticipants} participants
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-brand">{event.attendanceRate.toFixed(0)}%</p>
                      <p className="text-xs text-neutral-500">présence</p>
                    </div>
                  </div>
                ))}
                {stats.topEvents.length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    Aucun événement scanné
                  </p>
                )}
              </div>
            </div>

            {/* Derniers Scans */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Derniers scans</h2>
              <div className="space-y-2">
                {stats.recentScans.map((scan) => (
                  <div
                    key={scan.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${scan.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}
                  >
                    {scan.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{scan.participantName}</p>
                      <p className="text-sm text-neutral-600 truncate">{scan.eventTitle}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-neutral-500">
                        {new Date(scan.scannedAt).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {stats.recentScans.length === 0 && (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    Aucun scan récent
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
