'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { tokenStorage } from '@/lib/auth';

interface ScanResult {
  success: boolean;
  message: string;
  participant?: {
    name: string;
    email: string;
    event: string;
    type: 'booking' | 'guest';
  };
  alreadyScanned?: boolean;
  scannedAt?: string;
}

export function QRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [showManual, setShowManual] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrReaderDivId = 'qr-reader';

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrReaderDivId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' }, // Caméra arrière sur mobile
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        () => { } // Ignorer les erreurs de scan
      );

      setIsScanning(true);
      setScanResult(null);
    } catch (error: unknown) {
      console.error('Error starting scanner:', error);

      // Message d'erreur personnalisé selon le type d'erreur
      let errorMessage = 'Erreur lors du démarrage de la caméra';

      const err = error as { name?: string; message?: string };
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        errorMessage = '❌ Accès caméra refusé\n\n' +
          '1. Cliquez sur l\'icône 🔒 dans la barre d\'adresse\n' +
          '2. Autorisez l\'accès à la caméra\n' +
          '3. Rechargez la page';
      } else if (err?.name === 'NotFoundError') {
        errorMessage = '❌ Aucune caméra détectée sur cet appareil';
      } else if (err?.name === 'NotReadableError') {
        errorMessage = '❌ Caméra déjà utilisée par une autre application';
      }

      alert(errorMessage);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
      setIsScanning(false);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // Stopper le scan temporairement
    await stopScanning();
    await validateQRCode(decodedText);
  };

  const validateQRCode = async (qrToken: string, isManual: boolean = false) => {
    setIsProcessing(true);
    setScanResult(null);

    try {
      // Récupérer le token admin
      const adminToken = tokenStorage.get();

      if (!adminToken) {
        setScanResult({
          success: false,
          message: 'Session expirée. Veuillez vous reconnecter.',
        });
        return;
      }

      // Appeler l'API de app-cse
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const endpoint = isManual ? '/api/admin/scanner/validate' : '/api/admin/scanner/validateQRCode';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ qrToken }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        setScanResult({
          success: false,
          message: 'Session expirée. Veuillez vous reconnecter.',
        });
        // Optionnel : rediriger vers login
        // router.push('/login');
        return;
      }

      if (!response.ok) {
        console.error('API Error:', data);
        setScanResult({
          success: false,
          message: data.error || data.message || 'Erreur lors de la validation',
        });
        return;
      }

      setScanResult(data);

      // Son de succès/erreur
      if (data.success) {
        playSuccessSound();
      } else {
        playErrorSound();
      }

      // Auto-restart scan après 3 secondes
      setTimeout(() => {
        setScanResult(null);
        startScanning();
      }, 3000);
    } catch (error) {
      console.error('Validation error:', error);
      setScanResult({
        success: false,
        message: 'Erreur de connexion au serveur',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;

    // Nettoyer et normaliser le token (enlever espaces, mettre en majuscules)
    const cleanedToken = manualToken.trim().toUpperCase();
    await validateQRCode(cleanedToken, true);
    setManualToken('');
  };

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

  return (
    <div className="w-full space-y-4">
      {/* Scanner Webcam - Mobile First */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header simplifié blanc */}
        <div className="bg-white border-b border-neutral-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-brand" />
              <h2 className="text-sm font-semibold text-neutral-800">Scanner</h2>
            </div>
            {isScanning && (
              <button
                onClick={stopScanning}
                className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg transition-colors font-medium text-sm"
              >
                <CameraOff className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Body du scanner */}
        <div className="p-4">

          {/* Zone de scan */}
          <div className="relative">
            <div
              id={qrReaderDivId}
              className={`w-full rounded-lg overflow-hidden ${isScanning ? 'block' : 'hidden'}`}
              style={{ minHeight: '300px' }}
            />

            {!isScanning && !scanResult && (
              <button
                onClick={startScanning}
                className="w-full flex flex-col items-center justify-center py-16 px-4 bg-gradient-to-br from-brand-50 to-brand-100 rounded-lg border-2 border-dashed border-brand-200 hover:border-brand-400 hover:bg-brand-100 transition-all active:scale-98 cursor-pointer"
              >
                <Camera className="w-14 h-14 text-brand mb-3" />
                <p className="text-neutral-800 text-center font-semibold text-base">
                  Touchez pour scanner
                </p>
              </button>
            )}

            {isProcessing && (
              <div className="absolute inset-0 bg-white/95 flex items-center justify-center rounded-lg">
                <Loader2 className="w-14 h-14 text-brand animate-spin" />
              </div>
            )}
          </div>

          {/* Résultat du scan */}
          {scanResult && (
            <div className={`mt-4 p-6 rounded-xl border-2 ${scanResult.success
              ? 'bg-green-50 border-green-400'
              : scanResult.alreadyScanned
                ? 'bg-orange-50 border-orange-400'
                : 'bg-red-50 border-red-400'
              }`}>
              <div className="flex items-center gap-3">
                {scanResult.success ? (
                  <CheckCircle className="w-10 h-10 text-green-600 flex-shrink-0" />
                ) : scanResult.alreadyScanned ? (
                  <AlertCircle className="w-10 h-10 text-orange-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-600 flex-shrink-0" />
                )}

                <div className="flex-1">
                  <p className={`font-bold text-xl mb-1 ${scanResult.success
                    ? 'text-green-900'
                    : scanResult.alreadyScanned
                      ? 'text-orange-900'
                      : 'text-red-900'
                    }`}>
                    {scanResult.message}
                  </p>

                  {scanResult.participant && (
                    <p className="text-neutral-900 font-medium text-lg mt-2">
                      {scanResult.participant.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saisie manuelle - Collapsible */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <button
          onClick={() => setShowManual(!showManual)}
          className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
        >
          <span className="text-sm text-neutral-600">Saisie manuelle</span>
          <span className="text-neutral-400 text-xs">
            {showManual ? '▲' : '▼'}
          </span>
        </button>

        {showManual && (
          <div className="px-4 pb-4 border-t border-neutral-200">
            <form onSubmit={handleManualValidation} className="flex gap-2 mt-3">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Ex: BF1DE95F"
                className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent uppercase"
              />
              <button
                type="submit"
                disabled={!manualToken.trim() || isProcessing}
                className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                OK
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
