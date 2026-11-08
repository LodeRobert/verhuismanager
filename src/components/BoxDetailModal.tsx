import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  AlertTriangle,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Truck,
  Home,
  Printer,
  Edit2,
  Trash2,
  Warehouse,
  ChevronDown,
  QrCode,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Box, Room, Floor, UserRole, BoxStatus } from '../types/index.ts';
import { generateQrDataUrl } from '../utils/qr.ts';

interface BoxDetailModalProps {
  box: Box;
  rooms: Room[];
  floors: Floor[];
  userRole: UserRole;
  qrBaseUrl?: string;
  onUpdateStatus: (boxId: string, status: BoxStatus, currentRoomId?: string) => Promise<void>;
  onEditBox?: (box: Box) => void;
  onDeleteBox?: (boxId: string) => void;
  onPrintLabel?: (box: Box) => void;
  onClose: () => void;
}

export const BoxDetailModal: React.FC<BoxDetailModalProps> = ({
  box,
  rooms,
  floors,
  userRole,
  qrBaseUrl,
  onUpdateStatus,
  onEditBox,
  onDeleteBox,
  onPrintLabel,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [showOtherRoomPicker, setShowOtherRoomPicker] = useState(false);
  const [selectedCustomRoom, setSelectedCustomRoom] = useState<string>(box.targetRoomId);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const baseUrl = (qrBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/$/, '');
  const boxQrUrl = `${baseUrl}/#box=${box.id}`;

  useEffect(() => {
    let active = true;
    const generate = async () => {
      const dataUrl = await generateQrDataUrl(boxQrUrl);
      if (active) setQrDataUrl(dataUrl);
    };
    generate();
    return () => {
      active = false;
    };
  }, [boxQrUrl]);

  const targetRoom = rooms.find((r) => r.id === box.targetRoomId);
  const currentRoom = rooms.find((r) => r.id === box.currentRoomId);
  const garageRoom = rooms.find((r) => r.isDefaultFallback) || rooms.find((r) => r.name.toLowerCase().includes('garage')) || rooms[0];

  const getFloorForRoom = (room?: Room) => (room ? floors.find((f) => f.id === room.floorId) : undefined);
  const targetFloor = getFloorForRoom(targetRoom);
  const currentFloor = getFloorForRoom(currentRoom);

  const handleSetMovedToTarget = async () => {
    setLoading(true);
    try {
      await onUpdateStatus(box.id, 'MOVED', box.targetRoomId);
    } finally {
      setLoading(false);
    }
  };

  const handleSetMovedToGarage = async () => {
    setLoading(true);
    try {
      // If garage room exists, use its id; otherwise server defaults to garage fallback
      await onUpdateStatus(box.id, 'MOVED', garageRoom?.id);
    } finally {
      setLoading(false);
    }
  };

  const handleSetMovedToCustomRoom = async () => {
    if (!selectedCustomRoom) return;
    setLoading(true);
    try {
      await onUpdateStatus(box.id, 'MOVED', selectedCustomRoom);
      setShowOtherRoomPicker(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSetStatus = async (status: BoxStatus) => {
    setLoading(true);
    try {
      await onUpdateStatus(box.id, status, box.currentRoomId);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 no-print overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-mono font-bold text-lg shrink-0">
              #{box.boxNumber}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-semibold text-slate-500 dark:text-slate-400">
                  {box.id}
                </span>
                <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase">
                  {box.itemType || 'Doos'}
                </span>
                {box.fragile && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase flex items-center gap-1 shadow-sm">
                    <AlertTriangle className="w-3 h-3" />
                    BREEKBAAR
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-snug mt-0.5">
                {box.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[70vh]">
          {/* Location status strip */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                Doelruimte (Nieuw huis)
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                <span className="truncate">{targetRoom?.name || 'Onbekend'}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {targetFloor?.name || 'Onbekende verdieping'}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                Huidige fysieke locatie
              </div>
              <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1">
                <Warehouse className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="truncate">{currentRoom?.name || 'Onbekend'}</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {currentFloor?.name || 'Onbekende verdieping'}
              </div>
            </div>
          </div>

          {/* QR Code & Scan Test Section */}
          <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  QR-Code & Testen
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/70 px-2 py-0.5 rounded">
                {box.id}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5">
              {/* QR Image */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white p-2 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR Code voor ${box.id}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-[10px] text-slate-400 animate-pulse">QR laden...</div>
                )}
              </div>

              {/* QR Info & Direct Test Button */}
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Scan deze QR-code met uw smartphone camera of test de koppeling direct hieronder:
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(boxQrUrl);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2500);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
                    title="Kopieer de directe QR URL"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                    <span>{copied ? 'Link gekopieerd!' : 'Kopieer QR-link'}</span>
                  </button>

                  <a
                    href={boxQrUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs min-h-[36px]"
                    title="Open de QR-link in een nieuw venster om de scan te testen"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Test QR in browser</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {box.currentOldRoomId && (
            <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2 bg-blue-50/70 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/50">
              <Home className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>
                Fysieke standplaats in Oud Huis:{' '}
                <strong className="text-slate-900 dark:text-white font-bold">
                  {rooms.find((r) => r.id === box.currentOldRoomId)?.name || 'Onbekend'}
                </strong>
              </span>
            </div>
          )}

          {/* Current Status Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Status van {box.itemType ? box.itemType.toLowerCase() : 'dit item'}:
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              {box.status === 'MOVED' && (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                  Verhuisd (Aangekomen)
                </span>
              )}
              {box.status === 'IN_TRANSIT' && (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-800">
                  <Truck className="w-4 h-4" />
                  Onderweg in verhuiswagen
                </span>
              )}
              {box.status === 'IN_OLD_HOUSE' && (
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1 bg-slate-200/70 dark:bg-slate-700/60 px-2.5 py-1 rounded-lg">
                  <Home className="w-4 h-4" />
                  Nog in oud huis
                </span>
              )}
            </div>
          </div>

          {/* Inhoud (Items list) */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Inhoud / Onderdelen ({box.items?.length || 0})
            </h4>
            {box.items && box.items.length > 0 ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <ul className="space-y-1.5">
                  {box.items.map((item, idx) => (
                    <li key={idx} className="text-xs text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Geen specifieke inhoud ingevuld.</p>
            )}
          </div>

          {/* Notes */}
          {box.notes && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Notities & Aandachtspunten
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/60 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-800/40">
                {box.notes}
              </p>
            </div>
          )}

          {/* Quick Helper Actions: Requirement 2 Fallback Garage Rule */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Snelle Verhuisacties (1-Tik):</span>
            </h4>

            {/* Action 1: Move directly to Target Room */}
            <button
              type="button"
              disabled={loading}
              onClick={handleSetMovedToTarget}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-between transition-all cursor-pointer min-h-[48px]"
            >
              <div className="flex items-center gap-2 text-left">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <div>
                  <div>Zet op 'Verhuisd' naar doelruimte:</div>
                  <div className="font-extrabold text-sm">{targetRoom?.name || 'Doelruimte'}</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            {/* Action 2: Move to Garage (Default Fallback as required by prompt) */}
            <button
              type="button"
              disabled={loading}
              onClick={handleSetMovedToGarage}
              className="w-full py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 flex items-center justify-between transition-all cursor-pointer min-h-[44px]"
            >
              <div className="flex items-center gap-2 text-left">
                <Warehouse className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span>Plaats in <strong>Garage</strong> (Standaard Noodbuffer)</span>
                  <p className="text-[10px] text-slate-400">Automatische fallback als kamer nog niet vrij is</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 shrink-0 text-slate-400" />
            </button>

            {/* Action 3: Choose Custom Room */}
            {!showOtherRoomPicker ? (
              <button
                type="button"
                onClick={() => setShowOtherRoomPicker(true)}
                className="w-full py-2 px-3 text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Kies een andere kamer in nieuw huis</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Selecteer actuele kamer:
                </label>
                <div className="flex gap-2">
                  <select
                    value={selectedCustomRoom}
                    onChange={(e) => setSelectedCustomRoom(e.target.value)}
                    className="flex-1 text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({floors.find((f) => f.id === r.floorId)?.name || ''})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleSetMovedToCustomRoom}
                    disabled={loading}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg cursor-pointer"
                  >
                    Opslaan
                  </button>
                </div>
              </div>
            )}

            {/* Secondary status buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSetStatus('IN_TRANSIT')}
                className="py-2 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Zet op Onderweg</span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleSetStatus('IN_OLD_HOUSE')}
                className="py-2 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Nog in oud huis</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions for Admin */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex gap-2">
            {userRole === 'admin' && onPrintLabel && (
              <button
                type="button"
                onClick={() => onPrintLabel(box)}
                className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer min-h-[40px]"
              >
                <Printer className="w-3.5 h-3.5 text-blue-500" />
                <span>Print Dymo Sticker</span>
              </button>
            )}
            {userRole === 'admin' && onEditBox && (
              <button
                type="button"
                onClick={() => onEditBox(box)}
                className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer min-h-[40px]"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Bewerken</span>
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {userRole === 'admin' && onDeleteBox && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Weet u zeker dat u doos #${box.boxNumber} wilt verwijderen?`)) {
                    onDeleteBox(box.id);
                  }
                }}
                className="w-10 h-10 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 flex items-center justify-center cursor-pointer"
                title="Doos verwijderen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer min-h-[40px]"
            >
              Sluiten
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
