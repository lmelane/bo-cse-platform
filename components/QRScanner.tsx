'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { tokenStorage } from '@/lib/auth';

interface ScanResult {
  success: boolean;
  message: string;
  participant?: {
    name: string;
    event: string;
  };
}

export default function QRScanner() {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    // Initialiser le scanner uniquement si on n'a pas encore de scanner
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
          // Pause le scanner pendant la validation
          scanner.pause();

          await validateQRCode(decodedText);

          // Reprendre le scan après 3 secondes si succès ou erreur
          setTimeout(() => {
            // On vérifie si le scanner existe toujours avant de resume
            if (scannerRef.current) {
              try {
                scanner.resume();
              } catch (e) {
                console.log('Scanner resume error:', e);
              }
            }
            setScanResult(null);
          }, 3000);
        },
        (error) => {
          // Erreurs de scan silencieuses (pas de QR code détecté)
          // console.warn(error);
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error('Failed to clear html5-qrcode scanner', error);
        });
        scannerRef.current = null;
      }
    };
  }, []);

  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const playErrorSound = () => {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 200;
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const validateQRCode = async (qrToken: string) => {
    setIsValidating(true);

    try {
      const token = tokenStorage.get();
      if (!token) {
        setScanResult({
          success: false,
          message: 'Session expirée. Veuillez vous reconnecter.',
        });
        playErrorSound();
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const response = await fetch(`${API_URL}/api/admin/scanner/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token, // Header spécifique demandé
        },
        body: JSON.stringify({ qrToken }),
      });

      const data = await response.json();

      if (data.success) {
        playSuccessSound();
      } else {
        playErrorSound();
      }

      setScanResult(data);

    } catch (error) {
      console.error('Erreur validation:', error);
      setScanResult({
        success: false,
        message: 'Erreur de connexion au serveur',
      });
      playErrorSound();
    } finally {
      setIsValidating(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    await validateQRCode(manualCode.trim());
    setManualCode('');

    // Clear result after 3 seconds for manual entry too
    setTimeout(() => {
      setScanResult(null);
    }, 3000);
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
