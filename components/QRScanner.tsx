'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { scannerApi } from '@/lib/api';

interface ScanResult {
  success: boolean;
  message: string;
  participant?: {
    name: string;
    event: string;
  };
}

const RESULT_DISPLAY_DURATION_MS = 3000;

export default function QRScanner() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  // Deduplication: track recently scanned tokens to avoid double submissions
  const recentTokensRef = useRef<Set<string>>(new Set());
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lazy-init a single AudioContext (avoids leak)
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    // Resume suspended context (browsers suspend after user interaction)
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((frequency: number, type: OscillatorType, duration: number) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Audio playback is best-effort
    }
  }, [getAudioContext]);

  const playSuccessSound = useCallback(() => playSound(800, 'sine', 0.2), [playSound]);
  const playErrorSound = useCallback(() => playSound(200, 'sawtooth', 0.3), [playSound]);

  const clearResultAfterDelay = useCallback(() => {
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
    }
    resultTimerRef.current = setTimeout(() => {
      setScanResult(null);
      resultTimerRef.current = null;
    }, RESULT_DISPLAY_DURATION_MS);
  }, []);

  const validateQRCode = useCallback(async (qrToken: string): Promise<void> => {
    // Client-side deduplication: skip if we just validated this token
    if (recentTokensRef.current.has(qrToken)) {
      return;
    }

    // Basic format validation for camera scans
    if (!qrToken || qrToken.length > 4096) {
      setScanResult({ success: false, message: 'QR code invalide' });
      playErrorSound();
      clearResultAfterDelay();
      return;
    }

    setIsValidating(true);

    // Add to recent tokens; remove after 10s to allow re-scan
    recentTokensRef.current.add(qrToken);
    setTimeout(() => recentTokensRef.current.delete(qrToken), 10000);

    try {
      const data = await scannerApi.validate(qrToken);

      if (data.success) {
        playSuccessSound();
      } else {
        playErrorSound();
      }

      setScanResult(data);
    } catch (error) {
      console.error('Erreur validation:', error);
      const message = error instanceof Error ? error.message : 'Erreur de connexion au serveur';
      setScanResult({ success: false, message });
      playErrorSound();
    } finally {
      setIsValidating(false);
      clearResultAfterDelay();
    }
  }, [playSuccessSound, playErrorSound, clearResultAfterDelay]);

  useEffect(() => {
    if (!scannerRef.current) {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        async (decodedText) => {
          // Pause scanner during validation
          scanner.pause();

          await validateQRCode(decodedText);

          // Resume AFTER validation completes (not on a fixed timer)
          if (scannerRef.current) {
            try {
              scanner.resume();
            } catch (e) {
              console.log('Scanner resume error:', e);
            }
          }
        },
        () => {
          // Silent scan errors (no QR code detected)
        }
      );
    }

    return () => {
      if (resultTimerRef.current) {
        clearTimeout(resultTimerRef.current);
      }
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error('Failed to clear html5-qrcode scanner', error);
        });
        scannerRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [validateQRCode]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || isValidating) return;

    await validateQRCode(manualCode.trim());
    setManualCode('');
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-center mb-6 text-neutral-800">Scanner QR Code</h1>

        {/* Zone de scan */}
        <div className="mb-6 overflow-hidden rounded-lg bg-black">
          <div id="qr-reader" className="w-full"></div>
        </div>

        {/* Résultat */}
        {scanResult && (
          <div className={`mb-6 rounded-lg p-4 border ${scanResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
            }`}>
            <div className="flex items-start gap-3">
              {scanResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              <div>
                <h3 className={`font-bold ${scanResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                  {scanResult.success ? 'Présence confirmée' : 'Erreur'}
                </h3>
                <p className={`text-sm mt-1 ${scanResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                  {scanResult.message}
                </p>
                {scanResult.participant && (
                  <div className="mt-2 text-sm text-green-800">
                    <p className="font-medium">{scanResult.participant.name}</p>
                    <p className="opacity-75">{scanResult.participant.event}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Saisie manuelle */}
        <div className="border-t border-neutral-100 pt-6">
          <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-3">
            Saisie manuelle
          </h3>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Code à 8 caractères"
              maxLength={8}
              className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              disabled={isValidating}
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || isValidating}
              className="px-4 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'OK'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
