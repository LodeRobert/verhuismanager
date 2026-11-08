import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Layers,
  MapPin,
  Warehouse,
  Check,
  AlertCircle,
  Home,
} from 'lucide-react';
import { Floor, Room, HouseType } from '../types/index.ts';

interface LocationManagerModalProps {
  floors: Floor[];
  rooms: Room[];
  onCreateFloor: (name: string, houseType: HouseType) => Promise<void>;
  onUpdateFloor: (id: string, name: string, houseType?: HouseType) => Promise<void>;
  onDeleteFloor: (id: string) => Promise<void>;
  onCreateRoom: (data: { name: string; floorId: string; isDefaultFallback?: boolean; houseType: HouseType }) => Promise<void>;
  onUpdateRoom: (id: string, data: { name?: string; floorId?: string; isDefaultFallback?: boolean; houseType?: HouseType }) => Promise<void>;
  onDeleteRoom: (id: string) => Promise<void>;
  onClose: () => void;
}

export const LocationManagerModal: React.FC<LocationManagerModalProps> = ({
  floors,
  rooms,
  onCreateFloor,
  onUpdateFloor,
  onDeleteFloor,
  onCreateRoom,
  onUpdateRoom,
  onDeleteRoom,
  onClose,
}) => {
  const [activeHouse, setActiveHouse] = useState<HouseType>('OLD');
  const filteredFloors = floors.filter((f) => (f.houseType || 'NEW') === activeHouse);
  const [activeFloorId, setActiveFloorId] = useState<string>(filteredFloors[0]?.id || '');
  const [newFloorName, setNewFloorName] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [isDefaultFallbackRoom, setIsDefaultFallbackRoom] = useState(false);
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editingFloorName, setEditingFloorName] = useState('');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [editingRoomName, setEditingRoomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If activeFloorId is not in the current house floors, select first
  const currentFloorId = filteredFloors.some((f) => f.id === activeFloorId)
    ? activeFloorId
    : filteredFloors[0]?.id || '';

  const activeFloorRooms = rooms.filter((r) => r.floorId === currentFloorId);

  const handleHouseSwitch = (house: HouseType) => {
    setActiveHouse(house);
    const houseFlrs = floors.filter((f) => (f.houseType || 'NEW') === house);
    setActiveFloorId(houseFlrs[0]?.id || '');
    setError(null);
  };

  const handleCreateFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFloorName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onCreateFloor(newFloorName.trim(), activeHouse);
      setNewFloorName('');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !currentFloorId) return;
    setLoading(true);
    setError(null);
    try {
      await onCreateRoom({
        name: newRoomName.trim(),
        floorId: currentFloorId,
        isDefaultFallback: activeHouse === 'NEW' ? isDefaultFallbackRoom : false,
        houseType: activeHouse,
      });
      setNewRoomName('');
      setIsDefaultFallbackRoom(false);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFloor = async (id: string) => {
    if (!editingFloorName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onUpdateFloor(id, editingFloorName.trim(), activeHouse);
      setEditingFloorId(null);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoom = async (id: string) => {
    if (!editingRoomName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onUpdateRoom(id, { name: editingRoomName.trim(), houseType: activeHouse });
      setEditingRoomId(null);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFallback = async (room: Room) => {
    setLoading(true);
    setError(null);
    try {
      await onUpdateRoom(room.id, { isDefaultFallback: !room.isDefaultFallback, houseType: 'NEW' });
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Hiërarchisch Locatiebeheer (Twee Huizen)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Beheer verdiepingen en kamers voor zowel uw vertrekwoning als uw nieuwe woning
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

        {/* House Switcher Tabs */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => handleHouseSwitch('OLD')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeHouse === 'OLD'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>🏠 Oud Huis (Vertrekwoning)</span>
          </button>

          <button
            type="button"
            onClick={() => handleHouseSwitch('NEW')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeHouse === 'NEW'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>🏡 Nieuw Huis (Bestemming)</span>
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Columns: Floors on left, Rooms on right */}
        <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-y-auto">
          {/* Left Column: Floors List */}
          <div className="md:col-span-5 space-y-4 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-4 md:pb-0 md:pr-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                1. Verdiepingen ({activeHouse === 'OLD' ? 'Oud' : 'Nieuw'})
              </h4>
              <span className="text-[11px] text-slate-400">{filteredFloors.length} verdiepingen</span>
            </div>

            {/* Add Floor Form */}
            <form onSubmit={handleCreateFloor} className="flex gap-1.5">
              <input
                type="text"
                placeholder="Nieuwe verdieping..."
                value={newFloorName}
                onChange={(e) => setNewFloorName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                disabled={loading || !newFloorName.trim()}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Floors List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {filteredFloors.map((floor) => {
                const isSelected = floor.id === currentFloorId;
                const roomCount = rooms.filter((r) => r.floorId === floor.id).length;

                return (
                  <div
                    key={floor.id}
                    onClick={() => setActiveFloorId(floor.id)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 font-bold text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {editingFloorId === floor.id ? (
                      <div className="flex items-center gap-1 flex-1 mr-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingFloorName}
                          onChange={(e) => setEditingFloorName(e.target.value)}
                          className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border rounded flex-1"
                        />
                        <button
                          onClick={() => handleUpdateFloor(floor.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingFloorId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{floor.name}</span>
                        <span className="text-[10px] font-normal text-slate-400">({roomCount})</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          setEditingFloorId(floor.id);
                          setEditingFloorName(floor.name);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Verdieping "${floor.name}" verwijderen?`)) {
                            onDeleteFloor(floor.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Rooms for selected Floor */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                2. Kamers in:{' '}
                <span className="text-slate-900 dark:text-white">
                  {filteredFloors.find((f) => f.id === currentFloorId)?.name || 'Geen verdieping gekozen'}
                </span>
              </h4>
              <span className="text-[11px] text-slate-400">{activeFloorRooms.length} kamers</span>
            </div>

            {/* Add Room Form */}
            <form onSubmit={handleCreateRoom} className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={activeHouse === 'OLD' ? 'Kamer in oud huis (bv. Keuken)' : 'Kamer in nieuw huis'}
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={loading || !newRoomName.trim() || !currentFloorId}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Kamer Toevoegen</span>
                </button>
              </div>

              {activeHouse === 'NEW' && (
                <label className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isDefaultFallbackRoom}
                    onChange={(e) => setIsDefaultFallbackRoom(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Instellen als standaard fallback locatie (Garage buffer)</span>
                </label>
              )}
            </form>

            {/* Rooms List */}
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {activeFloorRooms.length > 0 ? (
                activeFloorRooms.map((room) => (
                  <div
                    key={room.id}
                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs flex items-center justify-between shadow-xs"
                  >
                    {editingRoomId === room.id ? (
                      <div className="flex items-center gap-1 flex-1 mr-2">
                        <input
                          type="text"
                          value={editingRoomName}
                          onChange={(e) => setEditingRoomName(e.target.value)}
                          className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border rounded flex-1"
                        />
                        <button
                          onClick={() => handleUpdateRoom(room.id)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingRoomId(null)}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{room.name}</span>
                        {room.isDefaultFallback && activeHouse === 'NEW' && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <Warehouse className="w-3 h-3" />
                            Standaard Fallback
                          </span>
                        )}
                        {room.isReadyForMove && activeHouse === 'OLD' && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                            ✓ Verhuisklaar
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      {activeHouse === 'NEW' && (
                        <button
                          type="button"
                          onClick={() => handleToggleFallback(room)}
                          className={`px-2 py-1 text-[10px] font-semibold rounded border transition-colors cursor-pointer ${
                            room.isDefaultFallback
                              ? 'bg-amber-500 text-white border-amber-500'
                              : 'text-slate-500 hover:text-amber-600 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {room.isDefaultFallback ? 'Is Fallback' : 'Maak Fallback'}
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setEditingRoomId(room.id);
                          setEditingRoomName(room.name);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Kamer "${room.name}" verwijderen?`)) {
                            onDeleteRoom(room.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  Geen kamers gevonden op deze verdieping van het {activeHouse === 'OLD' ? 'Oude Huis' : 'Nieuwe Huis'}.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-xl cursor-pointer"
          >
            Klaar
          </button>
        </div>
      </div>
    </div>
  );
};
