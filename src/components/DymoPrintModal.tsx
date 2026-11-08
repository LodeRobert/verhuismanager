import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import {
  Printer,
  X,
  Sliders,
  Check,
  AlertTriangle,
  Eye,
  Info,
  Maximize2,
  FileText,
  Globe,
} from 'lucide-react';
import { Box, Room, Floor, DymoSettings } from '../types/index.ts';
import { generateQrDataUrl } from '../utils/qr.ts';

interface DymoPrintModalProps {
  boxes: Box[];
  rooms: Room[];
  floors: Floor[];
  settings: DymoSettings;
  onSaveSettings: (settings: DymoSettings) => void;
  onClose: () => void;
}

export const DymoPrintModal: React.FC<DymoPrintModalProps> = ({
  boxes,
  rooms,
  floors,
  settings,
  onSaveSettings,
  onClose,
}) => {
  // Configurable dimensions in mm (defaulting to user's 89 x 41 mm)
  const [widthMm, setWidthMm] = useState<number>(settings.widthMm || 89);
  const [heightMm, setHeightMm] = useState<number>(settings.heightMm || 41);
  const [showContents, setShowContents] = useState<boolean>(settings.showContents ?? true);
  const [showFloor, setShowFloor] = useState<boolean>(settings.showFloor ?? true);
  const [showOldLocation, setShowOldLocation] = useState<boolean>(true);
  const [qrBaseUrl, setQrBaseUrl] = useState<string>(settings.qrBaseUrl || 'https://verhuis.djxload.com');
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number>(0);
  const [printMode, setPrintMode] = useState<'single' | 'all'>('single');
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  // Locate the dedicated isolated print portal container
  useEffect(() => {
    let node = document.getElementById('dymo-print-portal');
    if (!node) {
      node = document.createElement('div');
      node.id = 'dymo-print-portal';
      document.body.appendChild(node);
    }
    setPortalNode(node);
  }, []);

  // Pre-generate QR codes for current boxes
  useEffect(() => {
    let active = true;
    const generateAll = async () => {
      const generated: Record<string, string> = {};
      const origin = (qrBaseUrl || window.location.origin).replace(/\/$/, '');
      for (const box of boxes) {
        const url = `${origin}/#box=${box.id}`;
        generated[box.id] = await generateQrDataUrl(url);
      }
      if (active) setQrCodes(generated);
    };
    generateAll();
    return () => {
      active = false;
    };
  }, [boxes, qrBaseUrl]);

  // Update CSS root variables dynamically for print styles
  useEffect(() => {
    document.documentElement.style.setProperty('--label-width', `${widthMm}mm`);
    document.documentElement.style.setProperty('--label-height', `${heightMm}mm`);
    document.body.style.setProperty('--label-width', `${widthMm}mm`);
    document.body.style.setProperty('--label-height', `${heightMm}mm`);
  }, [widthMm, heightMm]);

  const handleApplyPreset = (w: number, h: number, name: string) => {
    setWidthMm(w);
    setHeightMm(h);
    const updated = {
      ...settings,
      widthMm: w,
      heightMm: h,
      name,
    };
    onSaveSettings(updated);
  };

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveAllSettings = () => {
    const updated: DymoSettings = {
      ...settings,
      widthMm,
      heightMm,
      showContents,
      showFloor,
      qrBaseUrl: qrBaseUrl.trim() || 'https://verhuis.djxload.com',
    };
    onSaveSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handlePrint = () => {
    // Ensure CSS properties are updated
    document.documentElement.style.setProperty('--label-width', `${widthMm}mm`);
    document.documentElement.style.setProperty('--label-height', `${heightMm}mm`);
    window.print();
  };

  const currentBox = boxes[selectedBoxIndex] || boxes[0];

  const getRoom = (roomId?: string) => (roomId ? rooms.find((r) => r.id === roomId) : undefined);
  const getFloorForRoom = (room?: Room) => (room ? floors.find((f) => f.id === room.floorId) : undefined);

  const boxesToPrint = printMode === 'all' ? boxes : currentBox ? [currentBox] : [];

  return (
    <>
      {/* SCREEN MODAL VIEW */}
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 no-print overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Dymo & Thermische Labels Afdrukken
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Zuiver labelformaat (zonder achtergrond of navigatiebalk)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Settings & Presets */}
            <div className="lg:col-span-5 space-y-4">
              {/* Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Populaire Labelformaten:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset(89, 41, '89 x 41 mm (Uw Dymo)')}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                      widthMm === 89 && heightMm === 41
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      89 × 41 mm
                      {widthMm === 89 && heightMm === 41 && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Standaard (Uw formaat)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(89, 36, 'Dymo 99010 (89 x 36 mm)')}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                      widthMm === 89 && heightMm === 36
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      89 × 36 mm
                      {widthMm === 89 && heightMm === 36 && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Dymo 99010 (Adres)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(101, 54, 'Dymo 99014 (101 x 54 mm)')}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                      widthMm === 101 && heightMm === 54
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      101 × 54 mm
                      {widthMm === 101 && heightMm === 54 && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Dymo 99014 (Groot)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset(104, 159, 'Dymo 4XL (104 x 159 mm)')}
                    className={`p-2.5 text-left rounded-xl border text-xs transition-all cursor-pointer ${
                      widthMm === 104 && heightMm === 159
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      104 × 159 mm
                      {widthMm === 104 && heightMm === 159 && <Check className="w-3.5 h-3.5 text-blue-600" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Dymo 4XL (Verzend)</div>
                  </button>
                </div>
              </div>

              {/* Exact millimeter adjustments */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Sliders className="w-4 h-4 text-blue-500" />
                  <span>Exacte Afmetingen (mm):</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Breedte (mm):
                    </label>
                    <input
                      type="number"
                      min={30}
                      max={220}
                      value={widthMm}
                      onChange={(e) => setWidthMm(Math.max(10, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono tabular-nums"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Hoogte (mm):
                    </label>
                    <input
                      type="number"
                      min={20}
                      max={250}
                      value={heightMm}
                      onChange={(e) => setHeightMm(Math.max(10, Number(e.target.value)))}
                      className="w-full px-2.5 py-1.5 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono tabular-nums"
                    />
                  </div>
                </div>

                {/* Display options */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showContents}
                      onChange={(e) => setShowContents(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Toon inhoud (eerste items) op sticker</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showFloor}
                      onChange={(e) => setShowFloor(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Toon verdieping bij doelruimte</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showOldLocation}
                      onChange={(e) => setShowOldLocation(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Toon huidige locatie oud huis (indien ingevuld)</span>
                  </label>
                </div>
              </div>

              {/* QR-Code Webadres Domein Configuratie */}
              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                    <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Basis Web-URL voor QR-Codes</span>
                  </div>
                  <span className="text-[10px] text-blue-700 dark:text-blue-300 font-mono font-bold bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 rounded">
                    4G / 5G Helpers
                  </span>
                </div>

                <div>
                  <input
                    type="url"
                    value={qrBaseUrl}
                    onChange={(e) => setQrBaseUrl(e.target.value)}
                    placeholder="https://verhuis.djxload.com"
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                    Alle geprinte en getoonde QR-codes sturen naar dit domein (bijv. <em>https://verhuis.djxload.com/#box=...</em>) zodat verhuishulpen op hun eigen mobiele netwerk direct de juiste doos kunnen scannen en bijwerken.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleSaveAllSettings}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 min-h-[36px]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{saveSuccess ? 'Instellingen Opgeslagen!' : 'Instellingen & URL Opslaan'}</span>
                  </button>

                  {saveSuccess && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold animate-pulse">
                      Opgeslagen!
                    </span>
                  )}
                </div>
              </div>

              {/* Print selection: Single or All */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Selecteer wat u wilt afdrukken:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintMode('single')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      printMode === 'single'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Enkel Item ({currentBox ? `#${currentBox.boxNumber}` : '0'})
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintMode('all')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      printMode === 'all'
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Alle Items ({boxes.length})
                  </button>
                </div>

                {printMode === 'single' && boxes.length > 1 && (
                  <div className="mt-2">
                    <select
                      value={selectedBoxIndex}
                      onChange={(e) => setSelectedBoxIndex(Number(e.target.value))}
                      className="w-full text-xs p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      {boxes.map((b, idx) => (
                        <option key={b.id} value={idx}>
                          #{b.boxNumber} - {b.title} ({getRoom(b.targetRoomId)?.name || 'Kamer'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Print Instructions Callout */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div className="text-[11px] leading-tight space-y-1">
                  <strong>Instellingen in uw printvenster:</strong>
                  <ul className="list-disc pl-3 space-y-0.5 text-amber-800 dark:text-amber-300">
                    <li>Marges: kies <strong>"Geen"</strong> (of minimaal)</li>
                    <li>Papierformaat: selecteer uw <strong>Dymo rol ({widthMm}×{heightMm} mm)</strong></li>
                    <li>Kop- en voetteksten: uitschakelen</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Live Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-950/80 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 min-h-[300px]">
              <div className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Voorbeeld ({widthMm} × {heightMm} mm)</span>
              </div>

              {/* The Live Sticker Container */}
              <div
                style={{
                  width: `${widthMm * 3.5}px`,
                  height: `${heightMm * 3.5}px`,
                  maxWidth: '100%',
                }}
                className="bg-white text-black p-3 border-2 border-black rounded shadow-md flex flex-col justify-between overflow-hidden select-none font-sans relative"
              >
                {/* Top Row: Box Number, Fragile badge, QR Code */}
                <div className="flex items-start justify-between gap-1.5 leading-none">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-black tracking-tight font-mono">
                        #{String(currentBox?.boxNumber || 1).padStart(3, '0')}
                      </span>
                      <span className="text-[9px] font-black uppercase bg-black/10 text-black px-1.5 py-0.5 rounded">
                        {currentBox?.itemType || 'Doos'}
                      </span>
                      {currentBox?.fragile && (
                        <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-wide uppercase flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5 inline" />
                          BREEKBAAR
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-extrabold truncate text-black mt-1 leading-tight">
                      {currentBox?.title || 'Naam van doos'}
                    </div>
                    {showOldLocation && currentBox?.currentOldRoomId && (
                      <div className="text-[8px] text-neutral-600 mt-0.5">
                        Locatie oud: {getRoom(currentBox.currentOldRoomId)?.name || 'Kamer'}
                      </div>
                    )}
                  </div>

                  {/* QR Code */}
                  <div className="shrink-0 flex flex-col items-center">
                    {currentBox && qrCodes[currentBox.id] ? (
                      <img
                        src={qrCodes[currentBox.id]}
                        alt="QR Code"
                        className="w-11 h-11 border border-black/30"
                      />
                    ) : (
                      <div className="w-11 h-11 bg-slate-200 border border-black flex items-center justify-center text-[8px] font-mono">
                        QR
                      </div>
                    )}
                    <span className="text-[7px] font-mono font-bold mt-0.5">{currentBox?.id}</span>
                  </div>
                </div>

                {/* Middle: Target Room In Solid Banner */}
                <div className="my-1 border-t border-b border-black py-0.5 text-center">
                  <div className="text-[7.5pt] uppercase tracking-wider font-semibold text-neutral-600 leading-none">
                    DOELRUIMTE IN NIEUW HUIS
                  </div>
                  <div className="text-sm font-black uppercase tracking-tight leading-tight">
                    {getRoom(currentBox?.targetRoomId)?.name || 'Kamer'}
                  </div>
                  {showFloor && (
                    <div className="text-[8px] font-medium text-neutral-700 leading-none">
                      Verdieping: {getFloorForRoom(getRoom(currentBox?.targetRoomId))?.name || 'Onbekend'}
                    </div>
                  )}
                </div>

                {/* Bottom: Items preview */}
                {showContents && currentBox?.items && currentBox.items.length > 0 && (
                  <div className="text-[8px] leading-tight text-neutral-800 line-clamp-1">
                    <span className="font-bold">Inhoud: </span>
                    {currentBox.items.slice(0, 4).join(', ')}
                    {currentBox.items.length > 4 ? ` (+${currentBox.items.length - 4})` : ''}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Klaar om {boxesToPrint.length} sticker(s) te printen ({widthMm} × {heightMm} mm)
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Sluiten
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer min-h-[44px]"
              >
                <Printer className="w-4 h-4" />
                <span>Print Nu ({boxesToPrint.length} Label{boxesToPrint.length > 1 ? 's' : ''})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ISOLATED PRINT PORTAL (Mounted outside #root to avoid printing app background) */}
      {portalNode &&
        ReactDOM.createPortal(
          <div style={{ width: `${widthMm}mm`, margin: 0, padding: 0 }}>
            {boxesToPrint.map((box) => {
              const room = getRoom(box.targetRoomId);
              const floor = getFloorForRoom(room);
              const oldRoom = getRoom(box.currentOldRoomId);
              return (
                <div
                  key={box.id}
                  className="dymo-label-page"
                  style={{
                    width: `${widthMm}mm`,
                    height: `${heightMm}mm`,
                    padding: '2.5mm',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    pageBreakAfter: 'always',
                    breakAfter: 'page',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top: Box Number, fragile, title, QR */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', lineHeight: 1 }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '2mm' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2mm', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13pt', fontWeight: 900, fontFamily: 'monospace' }}>
                          #{String(box.boxNumber).padStart(3, '0')}
                        </span>
                        <span style={{ backgroundColor: '#eeeeee', border: '1px solid #000000', color: '#000000', fontSize: '7pt', fontWeight: 900, padding: '1px 3px', borderRadius: '2px', textTransform: 'uppercase' }}>
                          {box.itemType || 'Doos'}
                        </span>
                        {box.fragile && (
                          <span style={{ backgroundColor: '#000000', color: '#ffffff', fontSize: '7.5pt', fontWeight: 900, padding: '1px 4px', borderRadius: '2px' }}>
                            BREEKBAAR
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '9pt', fontWeight: 800, marginTop: '1mm', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                        {box.title}
                      </div>
                      {showOldLocation && oldRoom && (
                        <div style={{ fontSize: '6.5pt', color: '#444444', marginTop: '0.5mm' }}>
                          Van: {oldRoom.name}
                        </div>
                      )}
                    </div>

                    {/* QR Code */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      {qrCodes[box.id] && (
                        <img
                          src={qrCodes[box.id]}
                          alt="QR"
                          style={{ width: '13mm', height: '13mm' }}
                        />
                      )}
                      <span style={{ fontSize: '6pt', fontFamily: 'monospace', fontWeight: 700, marginTop: '0.5mm' }}>
                        {box.id}
                      </span>
                    </div>
                  </div>

                  {/* Doelruimte banner */}
                  <div style={{ borderTop: '1px solid #000000', borderBottom: '1px solid #000000', padding: '1mm 0', textAlign: 'center', margin: '0.5mm 0' }}>
                    <div style={{ fontSize: '6.5pt', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, color: '#333333' }}>
                      DOELRUIMTE IN NIEUW HUIS
                    </div>
                    <div style={{ fontSize: '12pt', fontWeight: 900, textTransform: 'uppercase', lineHeight: 1.1 }}>
                      {room?.name || 'Kamer'}
                    </div>
                    {showFloor && (
                      <div style={{ fontSize: '7pt', fontWeight: 600, color: '#444444' }}>
                        Verdieping: {floor?.name || 'Onbekend'}
                      </div>
                    )}
                  </div>

                  {/* Items summary */}
                  {showContents && box.items && box.items.length > 0 && (
                    <div style={{ fontSize: '6.8pt', lineHeight: 1.1, overflow: 'hidden', maxHeight: '4.5mm' }}>
                      <strong>Inhoud: </strong>{box.items.slice(0, 4).join(', ')}
                      {box.items.length > 4 ? ` (+${box.items.length - 4})` : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>,
          portalNode
        )}
    </>
  );
};
