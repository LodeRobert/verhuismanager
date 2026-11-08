import React, { useState } from 'react';
import {
  X,
  Gauge,
  Droplet,
  Zap,
  Flame,
  Sun,
  Calendar,
  Save,
  Check,
  Info,
  Layers,
} from 'lucide-react';
import { MeterReading, HouseType, MeterType } from '../types/index.ts';

interface MeterReadingsModalProps {
  meterReadings: MeterReading[];
  onSaveReading: (id: string, data: Partial<MeterReading>) => Promise<void>;
  onClose: () => void;
}

export const MeterReadingsModal: React.FC<MeterReadingsModalProps> = ({
  meterReadings,
  onSaveReading,
  onClose,
}) => {
  const [activeHouse, setActiveHouse] = useState<HouseType>('OLD');
  const [editingValues, setEditingValues] = useState<Record<string, { reading: string; date: string; notes: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  const filteredReadings = meterReadings.filter((m) => m.houseType === activeHouse);

  const getMeterIcon = (type: MeterType) => {
    switch (type) {
      case 'WATER':
        return <Droplet className="w-5 h-5 text-blue-500" />;
      case 'ELECTRICITY_DAY':
      case 'ELECTRICITY_NIGHT':
        return <Zap className="w-5 h-5 text-amber-500" />;
      case 'GAS':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'SOLAR':
        return <Sun className="w-5 h-5 text-yellow-500" />;
      default:
        return <Gauge className="w-5 h-5 text-slate-500" />;
    }
  };

  const getValuesForReading = (reading: MeterReading) => {
    return (
      editingValues[reading.id] || {
        reading: reading.reading || '',
        date: reading.date || new Date().toISOString().slice(0, 10),
        notes: reading.notes || '',
      }
    );
  };

  const handleChange = (id: string, field: 'reading' | 'date' | 'notes', val: string, base: MeterReading) => {
    const current = getValuesForReading(base);
    setEditingValues({
      ...editingValues,
      [id]: {
        ...current,
        [field]: val,
      },
    });
  };

  const handleSave = async (reading: MeterReading) => {
    const vals = getValuesForReading(reading);
    setSavingId(reading.id);
    try {
      await onSaveReading(reading.id, vals);
      setSavedSuccessId(reading.id);
      setTimeout(() => setSavedSuccessId(null), 2000);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Meterstanden Registratie
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Water, gas en elektriciteit registreren bij de sleuteloverdracht
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* House Switcher */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveHouse('OLD')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeHouse === 'OLD'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            <span>🏠 Oud Huis (Eindstanden)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveHouse('NEW')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeHouse === 'NEW'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            <span>🏡 Nieuw Huis (Beginstanden)</span>
          </button>
        </div>

        {/* Tip Banner */}
        <div className="mx-4 sm:mx-6 mt-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>Belangrijke tip:</strong> Maak bij sleuteloverdracht ook een foto met uw smartphone van de meters naast het invullen van deze standen.
          </span>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReadings.map((reading) => {
              const vals = getValuesForReading(reading);
              const isSaving = savingId === reading.id;
              const isSaved = savedSuccessId === reading.id;

              return (
                <div
                  key={reading.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center shadow-xs">
                        {getMeterIcon(reading.type)}
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {reading.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-semibold text-slate-500">
                      {reading.unit}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Meterstand ({reading.unit}):
                    </label>
                    <input
                      type="text"
                      value={vals.reading}
                      onChange={(e) => handleChange(reading.id, 'reading', e.target.value, reading)}
                      placeholder="bijv. 00412.5"
                      className="w-full px-3 py-2 text-base font-mono font-bold tabular-nums bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Opnamedatum:
                      </label>
                      <input
                        type="date"
                        value={vals.date}
                        onChange={(e) => handleChange(reading.id, 'date', e.target.value, reading)}
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Notities / Locatie:
                      </label>
                      <input
                        type="text"
                        value={vals.notes}
                        onChange={(e) => handleChange(reading.id, 'notes', e.target.value, reading)}
                        placeholder="bijv. Kelder"
                        className="w-full px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="pt-1 flex justify-end">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => handleSave(reading)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white'
                      }`}
                    >
                      {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{isSaved ? 'Opgeslagen!' : isSaving ? 'Bezig...' : 'Opslaan'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl cursor-pointer"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
