'use client';

import React, { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader } from '@zxing/browser';
import { Camera, CameraOff, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
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
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [isValidatingManual, setIsValidatingManual] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);

  useEffect(() => {
    // Initialiser le code reader
    codeReaderRef.current = new BrowserQRCodeReader();

    return () => {
      // Cleanup au démontage
      stopScanning();
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

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      // Demander explicitement la permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      // Arrêter immédiatement le stream de test
      stream.getTracks().forEach(track => track.stop());

      return true;
    } catch (error: unknown) {
      const err = error as { name?: string; message?: string };

      let errorMessage = 'Erreur lors de la demande d\'accès caméra';

      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission denied')) {
        errorMessage = '❌ Accès caméra refusé\n\n' +
          '📱 Sur mobile:\n' +
          '1. Autorisez la caméra dans les paramètres du navigateur\n' +
          '2. Rechargez la page\n\n' +
          '💻 Sur ordinateur:\n' +
          '1. Cliquez sur l\'icône 🔒 dans la barre d\'adresse\n' +
          '2. Autorisez l\'accès à la caméra\n' +
          '3. Rechargez la page';
      } else if (err?.name === 'NotFoundError') {
        errorMessage = '❌ Aucune caméra détectée sur cet appareil';
      } else if (err?.name === 'NotReadableError') {
        errorMessage = '❌ Caméra déjà utilisée par une autre application';
      }

      setCameraError(errorMessage);
      return false;
    }
  };

  const startScanning = async () => {
    if (!codeReaderRef.current || !videoRef.current) return;

    // Demander d'abord la permission
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      setCameraError(null);
      setScanResult(null);

      // Démarrer le scanner avec la caméra arrière
      await codeReaderRef.current.decodeFromVideoDevice(
        undefined, // undefined = utiliser la caméra par défaut
        videoRef.current,
        async (result, error) => {
          if (result) {
            // QR code détecté !
            await stopScanning();
            await validateQRCode(result.getText());
          }
          // Ignorer les erreurs de décodage (pas encore de QR code détecté)
        }
      );

      setIsScanning(true);
    } catch (error: unknown) {
      console.error('Error starting scanner:', error);

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
      } else if (err?.message?.includes('HTTPS')) {
        errorMessage = '❌ HTTPS requis pour utiliser la caméra';
      }

      setCameraError(errorMessage);
    }
  };

  const stopScanning = () => {
    // Arrêter le flux vidéo
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const validateQRCode = async (qrCodeData: string) => {
    try {
      const token = tokenStorage.get();
      if (!token) {
        setScanResult({
          success: false,
          message: 'Session expirée. Veuillez vous reconnecter.',
        });
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const endpoint = '/api/admin/scanner/validate';

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ qrCode: qrCodeData }),
      });

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        setScanResult({
          success: false,
          message: 'Session expirée. Veuillez vous reconnecter.',
        });
        return;
      }

      if (!response.ok) {
        console.error('API Error:', data);
        setScanResult({
          success: false,
          message: data.error || data.message || 'Erreur lors de la validation',
        });
        playErrorSound();
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
      console.error('Error validating QR code:', error);
      setScanResult({
        success: false,
        message: 'Erreur de connexion au serveur',
      });
      playErrorSound();
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;

    setIsValidatingManual(true);
    await validateQRCode(manualCode.trim());
    setIsValidatingManual(false);
    setManualCode('');
  };

  return (
    <div className="space-y-6">
      {/* Saisie manuelle */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Saisie manuelle du code</h3>
        <form onSubmit={handleManualSubmit} className="flex gap-3">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Entrez le code QR manuellement"
            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
            disabled={isValidatingManual}
          />
          <button
            type="submit"
            disabled={!manualCode.trim() || isValidatingManual}
            className="px-6 py-2 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isValidatingManual ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validation...
              </>
            ) : (
              'Valider'
            )}
          </button>
        </form>
      </div>

      {/* Contrôles */}
      <div className="flex justify-center gap-4">
        {!isScanning ? (
          <button
            onClick={startScanning}
            className="flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors font-medium"
          >
            <Camera className="w-5 h-5" />
            Démarrer le scan
          </button>
        ) : (
          <button
            onClick={stopScanning}
            className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
          >
            <CameraOff className="w-5 h-5" />
            Arrêter le scan
          </button>
        )}
      </div>

      {/* Erreur caméra */}
      {cameraError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-1">Erreur caméra</h3>
              <p className="text-sm text-red-700 whitespace-pre-line">{cameraError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Zone de scan - Vidéo */}
      <div className="relative w-full max-w-md mx-auto rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="w-full h-auto"
          style={{ maxHeight: '400px', objectFit: 'cover' }}
        />

        {!isScanning && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/50">
            <p className="text-white text-center px-4">
              Cliquez sur &quot;Démarrer le scan&quot; pour activer la caméra
            </p>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Overlay avec carré de scan */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-4 border-brand rounded-lg relative">
                {/* Coins animés */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Résultat du scan */}
      {scanResult && (
        <div className={`rounded-lg p-6 border ${scanResult.success
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
          }`}>
          <div className="flex items-start gap-4">
            {scanResult.success ? (
              <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h3 className={`text-xl font-bold mb-2 ${scanResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                {scanResult.success ? '✓ Succès' : '✗ Échec'}
              </h3>
              <p className={`text-sm mb-3 ${scanResult.success ? 'text-green-700' : 'text-red-700'
                }`}>
                {scanResult.message}
              </p>
              {scanResult.participant && (
                <div className="mt-3 pt-3 border-t border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Participant:</strong> {scanResult.participant.name}
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>Événement:</strong> {scanResult.participant.event}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
