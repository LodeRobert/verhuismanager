import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, X, Keyboard, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { Box } from '../types/index.ts';

interface ScannerModalProps {
  boxes: Box[];
  onSelectBox: (box: Box) => void;
  onClose: () => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({ boxes, onSelectBox, onClose }) => {
  const [manualInput, setManualInput] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<'camera' | 'manual'>('camera');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef(false);
  const isMountedRef = useRef(true);
  const containerId = 'qr-reader-container';

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err) {
        // Silently catch browser play-interrupted or DOM cleanup errors
        console.warn('Scanner stop note:', err);
      } finally {
        scannerRef.current = null;
        if (isMountedRef.current) {
          setIsScanning(false);
        }
      }
    }
  }, []);

  const handleBoxMatched = useCallback((rawCode: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(100);
      } catch {
        // ignore
      }
    }

    let search = rawCode.trim();
    if (search.includes('#box=')) {
      search = search.split('#box=')[1] || search;
    } else if (search.includes('/box/')) {
      search = search.split('/box/')[1] || search;
    }

    let matched = boxes.find(b => b.id.toLowerCase() === search.toLowerCase());
    if (!matched && !isNaN(Number(search))) {
      const num = Number(search);
      matched = boxes.find(b => b.boxNumber === num);
    }
    if (!matched) {
      matched = boxes.find(b => b.id.toLowerCase().includes(search.toLowerCase()));
    }

    if (matched) {
      stopCamera();
      onSelectBox(matched);
    } else {
      setCameraError(`Geen doos gevonden voor code: "${rawCode}". Probeer handmatig nummer in te voeren.`);
    }
  }, [boxes, onSelectBox, stopCamera]);

  const startCamera = useCallback(async () => {
    if (isStartingRef.current || scannerRef.current?.isScanning) return;
    isStartingRef.current = true;
    setCameraError(null);

    try {
      // Ensure element exists in DOM
      const elem = document.getElementById(containerId);
      if (!elem) {
        isStartingRef.current = false;
        return;
      }

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId, {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (isMountedRef.current) {
            handleBoxMatched(decodedText);
          }
        },
        () => {
          // ignore scan frame misses
        }
      );

      if (isMountedRef.current) {
        setIsScanning(true);
      }
    } catch (err: unknown) {
      console.warn('Camera start error:', err);
      if (isMountedRef.current) {
        let msg = 'Camera toegang niet beschikbaar of geweigerd.';
        if (err instanceof Error) msg += ` (${err.message})`;
        setCameraError(msg);
        setActiveTab('manual');
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [containerId, handleBoxMatched]);

  useEffect(() => {
    isMountedRef.current = true;

    if (activeTab === 'camera') {
      const timer = setTimeout(() => {
        startCamera();
      }, 150);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }

    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [activeTab, startCamera, stopCamera]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleBoxMatched(manualInput);
  };

  const handleClose = async () => {
    await stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 no-print">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Doos Scannen of Zoeken</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Richt de camera op de Dymo QR-code</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch: Camera vs Handmatig */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 p-1.5 bg-slate-50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera Scanner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            <span>Nummer Invoeren</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {cameraError && (
            <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <span>{cameraError}</span>
              </div>
            </div>
          )}

          {/* Camera View Area - containerId must stay completely empty of React children to prevent removeChild crash */}
          <div className={activeTab === 'camera' ? 'flex flex-col items-center' : 'hidden'}>
            <div className="w-full aspect-square max-w-[280px] bg-slate-950 rounded-2xl overflow-hidden relative border-2 border-blue-500 shadow-inner flex items-center justify-center">
              {/* IMPORTANT: Completely empty container exclusively for Html5Qrcode DOM injection */}
              <div id={containerId} className="w-full h-full" />

              {/* Sibling loading overlay that never touches inner DOM of containerId */}
              {!isScanning && !cameraError && (
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-2 text-slate-400 pointer-events-none">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-xs">Camera opstarten...</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mt-3">
              Houd de QR-code van de Dymo-sticker stil in het scanvak.
            </p>
          </div>

          {/* Manual Input View Area */}
          <div className={activeTab === 'manual' ? 'block' : 'hidden'}>
            <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Doosnummer of Code:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="bijv. 2, 002 of BOX-002"
                    className="w-full pl-3 pr-10 py-3 text-base font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick number chips */}
              <div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">Snelle selectie recente dozen:</p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {boxes.slice(0, 10).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleBoxMatched(b.id)}
                      className="px-2.5 py-1 text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      #{b.boxNumber}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={handleClose}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
          >
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
};
