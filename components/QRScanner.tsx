'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { CheckCircle, XCircle, Loader2, Keyboard, AlertTriangle, User, X, Camera, CameraOff } from 'lucide-react';
import { scannerApi } from '@/lib/api';

interface ScanResultData {
  success: boolean;
  message: string;
  alreadyScanned?: boolean;
  scannedAt?: string;
  participant?: { name: string; email?: string; event?: string };
}

const RESULT_DISPLAY_MS = 5000;

export default function QRScanner() {
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const audioRef = useRef<AudioContext | null>(null);
  const recentRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);

  // Audio
  const getCtx = useCallback(() => {
    if (!audioRef.current || audioRef.current.state === 'closed') {
      audioRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioRef.current.state === 'suspended') audioRef.current.resume();
    return audioRef.current;
  }, []);

  const playSuccess = useCallback(() => {
    try {
      const ctx = getCtx();
      const t = ctx.currentTime;
      [523, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = 'sine';
        const s = t + i * 0.08;
        gain.gain.setValueAtTime(0.12, s);
        gain.gain.exponentialRampToValueAtTime(0.001, s + 0.2);
        osc.start(s); osc.stop(s + 0.2);
      });
    } catch { /* */ }
  }, [getCtx]);

  const playError = useCallback(() => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 300; osc.type = 'sine';
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } catch { /* */ }
  }, [getCtx]);

  const clearAfterDelay = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { setResult(null); timerRef.current = null; }, RESULT_DISPLAY_MS);
  }, []);

  const validate = useCallback(async (token: string) => {
    if (recentRef.current.has(token) || !token || token.length > 4096) return;
    processingRef.current = true;
    setValidating(true);
    recentRef.current.add(token);
    setTimeout(() => recentRef.current.delete(token), 10000);

    try {
      const data = await scannerApi.validate(token);
      data.success ? playSuccess() : playError();
      setResult(data);
      if (data.success) setScanCount(c => c + 1);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string; alreadyScanned?: boolean; participant?: { name: string; email: string }; scannedAt?: string } } };
      const d = ax.response?.data;
      setResult(d?.message
        ? { success: false, message: d.message, alreadyScanned: d.alreadyScanned, participant: d.participant, scannedAt: d.scannedAt }
        : { success: false, message: 'Connexion au serveur impossible' }
      );
      playError();
    } finally {
      setValidating(false);
      clearAfterDelay();
      // Resume scanning after a short pause
      setTimeout(() => { processingRef.current = false; }, 1500);
    }
  }, [playSuccess, playError, clearAfterDelay]);

  // Camera + QR scanning loop
  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setCameraReady(true);
        }
      } catch {
        if (mounted) setCameraError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      }
    };

    const scanLoop = () => {
      if (!mounted) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA && !processingRef.current) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
          if (code?.data) {
            validate(code.data);
          }
        }
      }
      rafRef.current = requestAnimationFrame(scanLoop);
    };

    startCamera().then(() => { rafRef.current = requestAnimationFrame(scanLoop); });

    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (timerRef.current) clearTimeout(timerRef.current);
      if (audioRef.current && audioRef.current.state !== 'closed') { audioRef.current.close(); audioRef.current = null; }
    };
  }, [validate]);

  const onManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim() || validating) return;
    await validate(manualCode.trim());
    setManualCode('');
  };

  const scheme = result
    ? result.success
      ? { bg: 'bg-emerald-500', text: 'text-white', sub: 'text-emerald-100', icon: CheckCircle, label: 'Validé' }
      : result.alreadyScanned
        ? { bg: 'bg-amber-500', text: 'text-white', sub: 'text-amber-100', icon: AlertTriangle, label: 'Déjà scanné' }
        : { bg: 'bg-red-500', text: 'text-white', sub: 'text-red-100', icon: XCircle, label: 'Refusé' }
    : null;

  return (
    <div className="space-y-3">
      {/* Session counter */}
      {scanCount > 0 && (
        <div className="flex items-center justify-center">
          <span className="px-3 py-1 bg-neutral-800 rounded-full text-xs text-neutral-300 font-medium">
            {scanCount} scan{scanCount > 1 ? 's' : ''} validé{scanCount > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Camera viewfinder */}
      <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3]">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Viewfinder overlay */}
        {cameraReady && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-white/40 rounded-2xl relative">
              {/* Corner accents */}
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-[3px] border-l-[3px] border-white rounded-tl-lg" />
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-[3px] border-r-[3px] border-white rounded-tr-lg" />
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-[3px] border-l-[3px] border-white rounded-bl-lg" />
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-[3px] border-r-[3px] border-white rounded-br-lg" />
              {/* Scanning line animation */}
              {!validating && (
                <div className="absolute left-2 right-2 h-0.5 bg-brand/80 rounded-full animate-pulse" style={{ top: '50%' }} />
              )}
            </div>
          </div>
        )}

        {/* Camera loading */}
        {!cameraReady && !cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <Camera className="w-8 h-8 text-neutral-500 animate-pulse" />
            <p className="text-xs text-neutral-500">Activation de la caméra...</p>
          </div>
        )}

        {/* Camera error */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6">
            <CameraOff className="w-8 h-8 text-neutral-500" />
            <p className="text-xs text-neutral-400 text-center">{cameraError}</p>
            <p className="text-xs text-neutral-600 text-center">Utilisez la saisie manuelle ci-dessous</p>
          </div>
        )}

        {/* Validating overlay */}
        {validating && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-neutral-900/90 rounded-xl px-5 py-3 flex items-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
              <span className="text-sm text-white font-medium">Vérification...</span>
            </div>
          </div>
        )}
      </div>

      {/* Result banner */}
      {result && scheme && (
        <div className={`${scheme.bg} rounded-xl overflow-hidden`}>
          <div className="px-4 py-3 flex items-start gap-3">
            <scheme.icon className={`w-5 h-5 ${scheme.text} flex-shrink-0 mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${scheme.text}`}>{scheme.label}</p>
              <p className={`text-xs mt-0.5 ${scheme.sub}`}>{result.message}</p>
            </div>
            <button onClick={() => { setResult(null); if (timerRef.current) clearTimeout(timerRef.current); }} className="p-1 -mr-1 opacity-60 hover:opacity-100">
              <X className={`w-4 h-4 ${scheme.text}`} />
            </button>
          </div>
          {result.participant && (
            <div className="px-4 py-2.5 bg-black/10 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <User className={`w-4 h-4 ${scheme.text}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-medium ${scheme.text} truncate`}>{result.participant.name}</p>
                {result.participant.email && <p className={`text-xs ${scheme.sub} truncate`}>{result.participant.email}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual input */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowManual(!showManual)}
          className="w-full px-4 py-2.5 flex items-center justify-between text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Saisie manuelle du code billet</span>
          </div>
          <span className="text-[10px] text-neutral-600">{showManual ? 'Masquer' : 'Afficher'}</span>
        </button>
        {showManual && (
          <form onSubmit={onManualSubmit} className="px-4 pb-3 flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="Ex: 7ADB6B98"
              maxLength={8}
              className="flex-1 h-10 px-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm font-mono text-white uppercase tracking-widest placeholder:text-neutral-600 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
              disabled={validating}
              autoFocus
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || validating}
              className="h-10 px-5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand-dark transition-colors disabled:opacity-40"
            >
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'OK'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
