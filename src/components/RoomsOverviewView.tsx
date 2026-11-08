import React, { useState } from 'react';
import {
  Layers,
  MapPin,
  CheckCircle2,
  Clock,
  Warehouse,
  ChevronRight,
  Package,
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Home,
  Check,
  Circle,
  Plus,
} from 'lucide-react';
import { Box, Room, Floor, UserRole, HouseType } from '../types/index.ts';
import { Truck, Recycle } from 'lucide-react';

interface RoomsOverviewViewProps {
  rooms: Room[];
  floors: Floor[];
  boxes: Box[];
  userRole: UserRole;
  onSelectBox: (box: Box) => void;
  onOpenLocationManager: () => void;
  onOpenRoomTasks: (room: Room) => void;
  onToggleRoomReadiness: (roomId: string, isReady: boolean) => Promise<void>;
  onToggleRoomFlag?: (roomId: string, flags: { needsClearingOut?: boolean; hasContainerparkItems?: boolean; isReadyForMove?: boolean }) => Promise<void>;
}

export const RoomsOverviewView: React.FC<RoomsOverviewViewProps> = ({
  rooms,
  floors,
  boxes,
  userRole,
  onSelectBox,
  onOpenLocationManager,
  onOpenRoomTasks,
  onToggleRoomReadiness,
  onToggleRoomFlag,
}) => {
  const [activeHouse, setActiveHouse] = useState<HouseType>('OLD');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Filter floors & rooms by active house
  const houseFloors = floors.filter((f) => (f.houseType || 'NEW') === activeHouse);
  const houseRooms = rooms.filter((r) => (r.houseType || 'NEW') === activeHouse);

  // Old house metrics
  const oldRooms = rooms.filter((r) => r.houseType === 'OLD');
  const readyOldRoomsCount = oldRooms.filter((r) => r.isReadyForMove).length;
  const boxesInOldHouse = boxes.filter((b) => b.status === 'IN_OLD_HOUSE');

  // New house metrics
  const garageRoom = rooms.find((r) => r.isDefaultFallback && (r.houseType || 'NEW') === 'NEW') || rooms.find((r) => r.name.toLowerCase().includes('garage'));
  const parkedInGarageBoxes = garageRoom
    ? boxes.filter((b) => b.currentRoomId === garageRoom.id && b.targetRoomId !== garageRoom.id && b.status === 'MOVED')
    : [];

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId);
  const selectedRoomBoxes = selectedRoom
    ? activeHouse === 'OLD'
      ? boxes.filter((b) => (b.currentOldRoomId === selectedRoom.id || b.currentRoomId === selectedRoom.id) && b.status === 'IN_OLD_HOUSE')
      : boxes.filter((b) => b.targetRoomId === selectedRoom.id)
    : [];

  return (
    <div className="space-y-6">
      {/* House Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Home className="w-5 h-5 text-blue-600" />
            <span>Kamer- & Werkpunten Beheer</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Schakel tussen uw vertrekwoning en uw nieuwe woning
          </p>
        </div>

        {/* Big Dual-House Selector Tabs */}
        <div className="flex bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-300/80 dark:border-slate-700 shadow-inner">
          <button
            type="button"
            onClick={() => {
              setActiveHouse('OLD');
              setSelectedRoomId(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeHouse === 'OLD'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>🏠 Oud Huis (Vertrek)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200">
              {readyOldRoomsCount}/{oldRooms.length} klaar
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveHouse('NEW');
              setSelectedRoomId(null);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${
              activeHouse === 'NEW'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-md font-extrabold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>🏡 Nieuw Huis (Bestemming)</span>
          </button>
        </div>
      </div>

      {/* Overview KPI Cards depending on selected house */}
      {activeHouse === 'OLD' ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: Verhuisklaar tellers */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="text-xs font-semibold text-slate-500">Kamers Volledig Verhuisklaar</div>
            <div className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              <span>{readyOldRoomsCount} / {oldRooms.length}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {readyOldRoomsCount === oldRooms.length && oldRooms.length > 0
                ? '🎉 Geweldig! Alle kamers zijn 100% ingepakt en verhuisklaar.'
                : `${oldRooms.length - readyOldRoomsCount} kamer(s) hebben nog openstaande werkpunten`}
            </p>
          </div>

          {/* Card 2: Dozen nog in oud huis */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
            <div className="text-xs font-semibold text-slate-500">Dozen Nog Te Verhuizen</div>
            <div className="text-2xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-2">
              <Package className="w-6 h-6" />
              <span>{boxesInOldHouse.length} dozen</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Staan fysiek klaar in het oude huis om in te laden
            </p>
          </div>

          {/* Card 3: Beheer shortcut */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-slate-800/60 dark:to-slate-900 border border-blue-200 dark:border-blue-900 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-blue-900 dark:text-blue-200">
                Oud Huis Kamers & Werkpunten
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Vink per kamer af wat ingepakt, gepoetst of hersteld moet worden.
              </p>
            </div>
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={onOpenLocationManager}
                className="mt-2 self-start px-2.5 py-1 text-xs font-semibold bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg shadow-2xs hover:bg-blue-50 cursor-pointer"
              >
                + Kamers toevoegen / bewerken
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Nieuw Huis: Garage Buffer Alert if any boxes are parked there */
        parkedInGarageBoxes.length > 0 && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl flex items-start gap-3 shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Warehouse className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-200">
                  Garage Noodbuffer Actief
                </span>
                <span className="bg-amber-200 text-amber-900 dark:bg-amber-800 dark:text-amber-100 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {parkedInGarageBoxes.length} dozen
                </span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                Er staan momenteel {parkedInGarageBoxes.length} dozen in de garage geparkeerd die een andere doelruimte hebben (bijv. omdat de kamer nog niet klaar was).
              </p>
            </div>
          </div>
        )
      )}

      {/* Grid of Floors & Rooms for the selected House */}
      <div className="space-y-6">
        {houseFloors.map((floor) => {
          const floorRooms = houseRooms.filter((r) => r.floorId === floor.id);
          if (floorRooms.length === 0) return null;

          return (
            <div key={floor.id} className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Verdieping
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{floor.name}</h3>
                <span className="text-xs text-slate-500 ml-auto">
                  {floorRooms.length} ruimte{floorRooms.length > 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {floorRooms.map((room) => {
                  const tasks = room.tasks || [];
                  const completedTasks = tasks.filter((t) => t.completed).length;

                  // For Old House: boxes standing currently in this room waiting to move
                  const boxesCurrentlyHere = boxes.filter(
                    (b) => (b.currentOldRoomId === room.id || b.currentRoomId === room.id) && b.status === 'IN_OLD_HOUSE'
                  );

                  // For New House: boxes expected and arrived
                  const targetBoxes = boxes.filter((b) => b.targetRoomId === room.id);
                  const arrivedBoxes = targetBoxes.filter((b) => b.status === 'MOVED');
                  const percent = targetBoxes.length > 0 ? Math.round((arrivedBoxes.length / targetBoxes.length) * 100) : 0;

                  return (
                    <div
                      key={room.id}
                      className={`p-4 rounded-2xl border transition-all bg-white dark:bg-slate-900 flex flex-col justify-between ${
                        room.isReadyForMove && activeHouse === 'OLD'
                          ? 'border-emerald-500/80 ring-1 ring-emerald-500/20'
                          : selectedRoomId === room.id
                          ? 'border-blue-500 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                      }`}
                    >
                      <div>
                        {/* Room Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {room.name}
                              </h4>
                              {room.isDefaultFallback && (
                                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded">
                                  Buffer
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              {activeHouse === 'OLD'
                                ? `${boxesCurrentlyHere.length} doos/dozen staan hier`
                                : `${targetBoxes.length} doos/dozen verwacht`}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => onOpenRoomTasks(room)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                            title="Bekijk of bewerk werkpunten"
                          >
                            <CheckSquare className="w-4 h-4" />
                            <span className="text-[11px]">Werkpunten ({completedTasks}/{tasks.length})</span>
                          </button>
                        </div>

                        {/* GROOT DUIDELIJK VINKJE VOOR OUD HUIS (Crucial requirement from prompt) */}
                        {activeHouse === 'OLD' ? (
                          <div className="mt-3 space-y-2">
                            <button
                              type="button"
                              onClick={() => onToggleRoomReadiness(room.id, !room.isReadyForMove)}
                              className={`w-full py-2.5 px-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                                room.isReadyForMove
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-600 shadow-sm'
                                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 text-left">
                                <div
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                                    room.isReadyForMove
                                      ? 'bg-white text-emerald-600'
                                      : 'bg-white dark:bg-slate-900 text-slate-400'
                                  }`}
                                >
                                  <Check className="w-4 h-4" />
                                </div>
                                <span>
                                  {room.isReadyForMove
                                    ? 'Kamer 100% Klaar voor Verhuis!'
                                    : 'Klik als kamer klaar is'}
                                </span>
                              </div>
                              <span className="text-[10px] uppercase font-black tracking-wider opacity-80">
                                {room.isReadyForMove ? 'GEREED' : 'OPEN'}
                              </span>
                            </button>

                            {/* Twee snelle schakelknoppen: Leeghalen & Containerpark */}
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => onToggleRoomFlag?.(room.id, { needsClearingOut: !(room.needsClearingOut ?? true) })}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                                  room.needsClearingOut
                                    ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                                title="Klik om te wisselen tussen nog leeg te halen of reeds leeggemaakt"
                              >
                                <Truck className="w-3 h-3 shrink-0" />
                                <span className="truncate">{room.needsClearingOut ? 'Nog leeg te halen' : '✓ Leeggemaakt'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onToggleRoomFlag?.(room.id, { hasContainerparkItems: !room.hasContainerparkItems })}
                                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                                  room.hasContainerparkItems
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }`}
                                title="Klik om aan te duiden of er spullen voor het containerpark staan"
                              >
                                <Recycle className="w-3 h-3 shrink-0" />
                                <span className="truncate">{room.hasContainerparkItems ? 'Containerpark!' : 'Geen grofvuil'}</span>
                              </button>
                            </div>

                            {/* Summary of boxes standing here */}
                            {boxesCurrentlyHere.length > 0 && (
                              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                                <span>Items klaar om in te laden:</span>
                                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                                  {boxesCurrentlyHere.length} stuks
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* NIEUW HUIS VOORTGANG */
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-xs font-semibold mb-1">
                              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                {arrivedBoxes.length} / {targetBoxes.length} aangekomen
                              </span>
                              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                                {percent}%
                              </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 rounded-full ${
                                  percent === 100
                                    ? 'bg-emerald-500'
                                    : percent > 0
                                    ? 'bg-blue-600'
                                    : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Detail Link */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSelectedRoomId(selectedRoomId === room.id ? null : room.id)}
                          className="text-slate-600 dark:text-slate-400 hover:text-blue-600 flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <span>{selectedRoomId === room.id ? 'Verberg details' : 'Bekijk details & dozen'}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenRoomTasks(room)}
                          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          + Werkpunt
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Room Details Drawer */}
      {selectedRoom && (
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>
                  {selectedRoom.name} ({activeHouse === 'OLD' ? 'Oud Huis' : 'Nieuw Huis'})
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeHouse === 'OLD'
                  ? `${selectedRoomBoxes.length} doos/dozen staan fysiek in deze kamer om in te laden`
                  : `${selectedRoomBoxes.length} doos/dozen hebben deze kamer als bestemming`}
              </p>
            </div>
            <button
              onClick={() => setSelectedRoomId(null)}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
            >
              Sluiten &times;
            </button>
          </div>

          {selectedRoomBoxes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {selectedRoomBoxes.map((box) => (
                <div
                  key={box.id}
                  onClick={() => onSelectBox(box)}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50 dark:bg-slate-800/50 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        #{String(box.boxNumber).padStart(3, '0')}
                      </span>
                      {box.fragile && (
                        <span className="text-[9px] font-black uppercase text-red-600 bg-red-100 dark:bg-red-950 px-1.5 py-0.5 rounded">
                          Breekbaar
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                      {box.title}
                    </h4>
                    {box.items && box.items.length > 0 && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                        {box.items.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {box.status === 'MOVED' ? 'Verhuisd' : box.status === 'IN_TRANSIT' ? 'Onderweg' : 'In oud huis'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-4">
              Geen dozen gekoppeld aan deze kamer.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
