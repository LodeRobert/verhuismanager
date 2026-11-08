import React, { useState, useMemo } from 'react';
import { X, Plus, Trash2, AlertTriangle, Package, Check, Home, Layers, Armchair } from 'lucide-react';
import { Box, Room, Floor } from '../types/index.ts';

interface BoxFormModalProps {
  initialBox?: Box | null;
  rooms: Room[];
  floors: Floor[];
  existingBoxesCount?: number;
  existingBoxes?: Box[];
  onSave: (boxData: Partial<Box>) => Promise<void>;
  onClose: () => void;
}

const PRESET_ITEM_TYPES = [
  { id: 'Doos', label: '📦 Doos' },
  { id: 'Kast', label: '🚪 Kast' },
  { id: 'Meubel', label: '🪑 Meubel / Tafel' },
  { id: 'Apparaat', label: '🔌 Apparaat / Witgoed' },
  { id: 'Bed', label: '🛏️ Bed / Matras' },
];

export const BoxFormModal: React.FC<BoxFormModalProps> = ({
  initialBox,
  rooms,
  floors,
  existingBoxesCount = 0,
  existingBoxes = [],
  onSave,
  onClose,
}) => {
  const isEditing = Boolean(initialBox);

  const newHouseRooms = rooms.filter((r) => r.houseType === 'NEW');
  const oldHouseRooms = rooms.filter((r) => r.houseType === 'OLD');

  // Set of box numbers currently in use (excluding the box being edited)
  const usedNumbers = useMemo(() => {
    return new Set(
      existingBoxes
        .filter((b) => !initialBox || b.id !== initialBox.id)
        .map((b) => Number(b.boxNumber))
        .filter((n) => Number.isInteger(n) && n > 0)
    );
  }, [existingBoxes, initialBox]);

  // Smallest available positive integer (allows reusing deleted numbers!)
  const lowestAvailableNumber = useMemo(() => {
    let candidate = 1;
    while (usedNumbers.has(candidate)) {
      candidate++;
    }
    return candidate;
  }, [usedNumbers]);

  const [boxNumber, setBoxNumber] = useState<number>(
    initialBox ? initialBox.boxNumber : lowestAvailableNumber
  );

  const duplicateBox = useMemo(() => {
    return existingBoxes.find(
      (b) => (!initialBox || b.id !== initialBox.id) && Number(b.boxNumber) === Number(boxNumber)
    );
  }, [existingBoxes, initialBox, boxNumber]);

  const isDuplicateNumber = Boolean(duplicateBox);
  const [itemType, setItemType] = useState<string>(
    initialBox?.itemType || 'Doos'
  );
  const [isCustomType, setIsCustomType] = useState<boolean>(
    Boolean(initialBox?.itemType && !PRESET_ITEM_TYPES.some((p) => p.id === initialBox.itemType))
  );
  const [customTypeInput, setCustomTypeInput] = useState<string>(
    initialBox?.itemType && !PRESET_ITEM_TYPES.some((p) => p.id === initialBox.itemType)
      ? initialBox.itemType
      : ''
  );

  const [title, setTitle] = useState(initialBox ? initialBox.title : '');
  const [fragile, setFragile] = useState(initialBox ? initialBox.fragile : false);
  const [targetRoomId, setTargetRoomId] = useState<string>(
    initialBox ? initialBox.targetRoomId : newHouseRooms[0]?.id || rooms[0]?.id || ''
  );
  const [currentOldRoomId, setCurrentOldRoomId] = useState<string>(
    initialBox ? initialBox.currentOldRoomId || '' : ''
  );
  const [currentRoomId, setCurrentRoomId] = useState<string>(
    initialBox ? initialBox.currentRoomId : ''
  );
  const [notes, setNotes] = useState(initialBox ? initialBox.notes || '' : '');
  const [items, setItems] = useState<string[]>(initialBox ? [...initialBox.items] : []);
  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemText.trim()) return;
    setItems([...items, newItemText.trim()]);
    setNewItemText('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(`Vul een titel of omschrijving in voor het item (${itemType}).`);
      return;
    }
    if (!boxNumber || Number(boxNumber) < 1 || !Number.isInteger(Number(boxNumber))) {
      setError('Vul een geldig doosnummer in (bv. 1, 2, 3).');
      return;
    }
    if (isDuplicateNumber) {
      setError(
        `Doosnummer #${boxNumber} is al in gebruik door "${duplicateBox?.title}". Kies een ander nummer of verwijder eerst de bestaande doos.`
      );
      return;
    }
    if (!targetRoomId) {
      setError('Selecteer een doelruimte in het nieuwe huis.');
      return;
    }

    const finalType = isCustomType ? (customTypeInput.trim() || 'Overig') : itemType;

    setLoading(true);
    setError(null);
    try {
      await onSave({
        boxNumber: Number(boxNumber),
        itemType: finalType,
        title: title.trim(),
        fragile,
        targetRoomId,
        currentOldRoomId: currentOldRoomId || undefined,
        currentRoomId: currentOldRoomId || currentRoomId || targetRoomId,
        items,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Fout bij opslaan van het item.');
    } finally {
      setLoading(false);
    }
  };

  const getRoomsForFloor = (floorId: string, houseRooms: Room[]) =>
    houseRooms.filter((r) => r.floorId === floorId);

  const newFloors = floors.filter((f) => f.houseType === 'NEW');
  const oldFloors = floors.filter((f) => f.houseType === 'OLD');

  const currentDisplayType = isCustomType ? (customTypeInput.trim() || 'Item') : itemType;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 no-print overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? `${currentDisplayType} #${initialBox?.boxNumber} Bewerken` : `Nieuw Verhuisitem (${currentDisplayType}) Toevoegen`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kies type (doos, kast, meubel of eigen keuze) en vul details in
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Item Type Selector (Doos, Kast, Meubel, Apparaat, Bed, of Zelf Kiezen) */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Wat gaat u verhuizen? (Standaard: Doos)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ITEM_TYPES.map((p) => {
                const isSelected = !isCustomType && itemType === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setIsCustomType(false);
                      setItemType(p.id);
                    }}
                    className={`px-3 py-1.5 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setIsCustomType(true);
                }}
                className={`px-3 py-1.5 text-xs rounded-xl border font-bold transition-all cursor-pointer ${
                  isCustomType
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                }`}
              >
                ✏️ Zelf invullen...
              </button>
            </div>

            {isCustomType && (
              <div className="pt-1.5">
                <input
                  type="text"
                  required={isCustomType}
                  value={customTypeInput}
                  onChange={(e) => setCustomTypeInput(e.target.value)}
                  placeholder="Typ zelf het type (bijv. Fiets, Bureau, Spiegel, Werkbank...)"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-blue-400 dark:border-blue-500 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nummer #{boxNumber}:
              </label>
              <input
                type="number"
                min={1}
                required
                value={boxNumber || ''}
                onChange={(e) => setBoxNumber(Number(e.target.value))}
                className={`w-full px-3 py-2 text-sm font-mono font-bold bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white transition-colors ${
                  isDuplicateNumber
                    ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/50 dark:bg-red-950/30'
                    : 'border-slate-300 dark:border-slate-700'
                }`}
              />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Titel / Korte Omschrijving:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  itemType === 'Kast'
                    ? 'bijv. Grote kleerkast slaapkamer (in 3 delen)'
                    : itemType === 'Apparaat'
                    ? 'bijv. Wasmachine Miele of TV 55 inch'
                    : 'bijv. Keukenpannen & Bestek'
                }
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Duplicate number warning & suggestion */}
            {isDuplicateNumber && (
              <div className="col-span-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Nummer #{boxNumber} is al bezet!</span>
                    <p className="text-[11px] text-red-600/90 dark:text-red-300/90 mt-0.5">
                      In gebruik door "{duplicateBox?.title}". Elk verhuisitem moet een uniek nummer hebben voor de QR-code.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBoxNumber(lowestAvailableNumber)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 rounded-lg cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Kies #{lowestAvailableNumber}
                </button>
              </div>
            )}
          </div>

          {/* Fragile Switch */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                  fragile ? 'bg-red-100 text-red-600 dark:bg-red-950/70 dark:text-red-400' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Breekbare Inhoud / Voorzichtig Tillen?</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Toont grote waarschuwing op het Dymo-label
                </div>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={fragile}
                onChange={(e) => setFragile(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
            </label>
          </div>

          {/* Target Room in New House */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Doelruimte in Nieuwe Huis (Waar moet dit naartoe?):
            </label>
            <select
              value={targetRoomId}
              onChange={(e) => setTargetRoomId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
            >
              {newFloors.map((floor) => {
                const floorRooms = getRoomsForFloor(floor.id, newHouseRooms);
                if (floorRooms.length === 0) return null;
                return (
                  <optgroup key={floor.id} label={`Nieuw Huis - ${floor.name}`}>
                    {floorRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} {r.isDefaultFallback ? '(Standaard Buffer)' : ''}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          {/* Optional Current Location in Old House */}
          <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Waar staat dit momenteel in het oude huis? (Optioneel):</span>
              </label>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 rounded">
                Niet verplicht
              </span>
            </div>
            <select
              value={currentOldRoomId}
              onChange={(e) => setCurrentOldRoomId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="">-- Nog niet toegewezen of onbekend --</option>
              {oldFloors.map((floor) => {
                const floorRooms = getRoomsForFloor(floor.id, oldHouseRooms);
                if (floorRooms.length === 0) return null;
                return (
                  <optgroup key={floor.id} label={`Oud Huis - ${floor.name}`}>
                    {floorRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Zo vindt u dozen en meubels direct terug in het oude huis vóór of tijdens het inladen.
            </p>
          </div>

          {/* Inhoud (Items toevoegen) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Inhoud / Onderdelen / Losse stukken:
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddItem();
                  }
                }}
                placeholder="Typ item of onderdeel en druk op Enter (bijv. Legplanken, schroefjeszakje...)"
                className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => handleAddItem()}
                className="px-3 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Toevoegen</span>
              </button>
            </div>

            {items.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl max-h-36 overflow-y-auto">
                {items.map((it, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm"
                  >
                    <span>{it}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-slate-400 hover:text-red-500 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Nog geen specifieke onderdelen of inhoud toegevoegd.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Extra instructies of montagetips:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="bijv. Eerst demonteren, schroeven zitten in zakje met tape"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              Annuleren
            </button>
            <button
              type="submit"
              disabled={loading || isDuplicateNumber}
              className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-2 min-h-[44px] transition-all ${
                isDuplicateNumber
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 shadow-blue-600/20 cursor-pointer'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Bezig met opslaan...' : isEditing ? 'Wijzigingen Opslaan' : `${currentDisplayType} Aanmaken`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
