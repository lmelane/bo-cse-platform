'use client';

import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/AdminLayout';
import { ScanLine, CheckCircle, XCircle, Users, Clock, Loader2, Copy } from 'lucide-react';
import Link from 'next/link';
import { scannerApi } from '@/lib/api';
import { SCANNER_REFETCH_INTERVAL } from '@/lib/config';

type ScanStats = Awaited<ReturnType<typeof scannerApi.getStats>>;

function Stat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0">
      <span className="text-xs text-neutral-500">{label}</span>
      <div className="text-right">
        <span className={`text-sm font-semibold ${accent || 'text-neutral-900'}`}>{value}</span>
        {sub && <span className="text-[10px] text-neutral-400 ml-1.5">{sub}</span>}
      </div>
    </div>
  );
}

export default function ScannerStatsPage() {
  const { data: stats, isLoading, error: queryError } = useQuery<ScanStats>({
    queryKey: ['scanner-stats'],
    queryFn: () => scannerApi.getStats(),
    refetchInterval: SCANNER_REFETCH_INTERVAL,
  });

  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Erreur de chargement') : null;
  const pct = (a: number, b: number) => b > 0 ? ((a / b) * 100).toFixed(1) : '0';

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold text-neutral-900">Scanner QR</h1>
            <p className="text-xs text-neutral-500 mt-0.5">Temps réel — rafraîchissement auto</p>
          </div>
          <Link
            href="/scanner"
            className="px-3 py-1.5 text-xs bg-brand text-white rounded-md hover:bg-brand-dark transition-colors flex items-center gap-1.5 font-medium"
          >
            <ScanLine className="w-3.5 h-3.5" />
            Ouvrir le scanner
          </Link>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}

        {stats && (
          <>
            {/* KPI row — 4 compact cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total scans', value: stats.totalScans, sub: `${stats.todayScans} aujourd'hui`, color: 'text-neutral-900' },
                { label: 'Réussis', value: stats.successfulScans, sub: `${pct(stats.successfulScans, stats.totalScans)}%`, color: 'text-green-600' },
                { label: 'Échecs', value: stats.failedScans, sub: `${stats.duplicateScans} doublons`, color: 'text-red-600' },
                { label: 'Taux présence', value: `${stats.attendanceRate.toFixed(1)}%`, sub: 'moyen', color: 'text-brand' },
              ].map((kpi) => (
                <div key={kpi.label} className="bg-white rounded-lg border border-neutral-200 p-3">
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">{kpi.label}</p>
                  <p className={`text-lg font-semibold ${kpi.color}`}>{kpi.value}</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">{kpi.sub}</p>
                </div>
              ))}
            </div>

            {/* Two columns: chart + events */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">

              {/* Scans par heure — bar chart */}
              <div className="lg:col-span-3 bg-white rounded-lg border border-neutral-200 p-4">
                <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-3">Scans par heure</p>
                <div className="flex items-end gap-1 h-24">
                  {stats.scansPerHour.map((item) => {
                    const max = Math.max(...stats.scansPerHour.map(s => s.count), 1);
                    const h = item.count > 0 ? Math.max((item.count / max) * 100, 8) : 0;
                    return (
                      <div key={item.hour} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-neutral-400 font-medium">{item.count || ''}</span>
                        <div className="w-full flex items-end" style={{ height: '64px' }}>
                          <div
                            className={`w-full rounded-t transition-all ${item.count > 0 ? 'bg-brand' : 'bg-neutral-100'}`}
                            style={{ height: `${h}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-neutral-400">{item.hour}h</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top events — compact list */}
              <div className="lg:col-span-2 bg-white rounded-lg border border-neutral-200">
                <div className="px-4 py-2.5 border-b border-neutral-100">
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Top événements</p>
                </div>
                {stats.topEvents.length === 0 ? (
                  <p className="px-4 py-6 text-xs text-neutral-400 text-center">Aucun événement scanné</p>
                ) : (
                  <div className="divide-y divide-neutral-50">
                    {stats.topEvents.map((event, idx) => (
                      <div key={idx} className="px-4 py-2.5 flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-neutral-900 truncate">{event.eventTitle}</p>
                          <p className="text-[10px] text-neutral-400">{event.scannedCount}/{event.totalParticipants} participants</p>
                        </div>
                        <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                          <div className="w-12 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-brand rounded-full" style={{ width: `${event.attendanceRate}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-neutral-700 w-8 text-right">{event.attendanceRate.toFixed(0)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent scans — compact table */}
            <div className="bg-white rounded-lg border border-neutral-200">
              <div className="px-4 py-2.5 border-b border-neutral-100 flex items-center justify-between">
                <p className="text-[11px] text-neutral-500 uppercase tracking-wider">Derniers scans</p>
                <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                  <Clock className="w-3 h-3" />
                  Temps réel
                </div>
              </div>
              {stats.recentScans.length === 0 ? (
                <p className="px-4 py-8 text-xs text-neutral-400 text-center">Aucun scan récent</p>
              ) : (
                <div className="divide-y divide-neutral-50">
                  {stats.recentScans.map((scan) => (
                    <div key={scan.id} className="px-4 py-2 flex items-center gap-3">
                      {scan.success ? (
                        <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                          <XCircle className="w-3.5 h-3.5 text-red-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-900 truncate">{scan.participantName}</p>
                        <p className="text-[10px] text-neutral-400 truncate">{scan.eventTitle}</p>
                      </div>
                      <span className="text-[11px] text-neutral-400 tabular-nums flex-shrink-0">
                        {new Date(scan.scannedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
