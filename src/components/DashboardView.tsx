import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Printer,
  Package,
  CheckCircle2,
  Truck,
  Home,
  AlertTriangle,
  MapPin,
  Warehouse,
  ArrowUpDown,
  Layers,
} from 'lucide-react';
import { Box, Room, Floor, UserRole, BoxStatus } from '../types/index.ts';

interface DashboardViewProps {
  boxes: Box[];
  rooms: Room[];
  floors: Floor[];
  userRole: UserRole;
  onSelectBox: (box: Box) => void;
  onAddNewBox: () => void;
  onOpenPrintModal: (selectedBoxes?: Box[]) => void;
  onQuickUpdateStatus: (boxId: string, status: BoxStatus) => Promise<void>;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  boxes,
  rooms,
  floors,
  userRole,
  onSelectBox,
  onAddNewBox,
  onOpenPrintModal,
  onQuickUpdateStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [targetRoomFilter, setTargetRoomFilter] = useState<string>('ALL');
  const [fragileFilter, setFragileFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'number' | 'title' | 'status'>('number');
  const [sortAsc, setSortAsc] = useState(true);

  // Stats calculation
  const totalBoxes = boxes.length;
  const movedBoxes = boxes.filter((b) => b.status === 'MOVED').length;
  const inTransitBoxes = boxes.filter((b) => b.status === 'IN_TRANSIT').length;
  const inOldHouseBoxes = boxes.filter((b) => b.status === 'IN_OLD_HOUSE').length;
  const fragileCount = boxes.filter((b) => b.fragile).length;
  const progressPercent = totalBoxes > 0 ? Math.round((movedBoxes / totalBoxes) * 100) : 0;

  const getRoom = (roomId: string) => rooms.find((r) => r.id === roomId);

  // Filtered & Sorted Boxes
  const filteredBoxes = useMemo(() => {
    return boxes
      .filter((box) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const targetRoomName = getRoom(box.targetRoomId)?.name.toLowerCase() || '';
          const currentRoomName = getRoom(box.currentRoomId)?.name.toLowerCase() || '';
          const itemsStr = box.items.join(' ').toLowerCase();
          const matches =
            box.id.toLowerCase().includes(q) ||
            String(box.boxNumber).includes(q) ||
            (box.itemType && box.itemType.toLowerCase().includes(q)) ||
            box.title.toLowerCase().includes(q) ||
            itemsStr.includes(q) ||
            targetRoomName.includes(q) ||
            currentRoomName.includes(q) ||
            (box.notes && box.notes.toLowerCase().includes(q));

          if (!matches) return false;
        }

        // Status
        if (statusFilter !== 'ALL' && box.status !== statusFilter) {
          return false;
        }

        // Target room
        if (targetRoomFilter !== 'ALL' && box.targetRoomId !== targetRoomFilter) {
          return false;
        }

        // Fragile
        if (fragileFilter === 'YES' && !box.fragile) return false;
        if (fragileFilter === 'NO' && box.fragile) return false;

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'number') diff = a.boxNumber - b.boxNumber;
        else if (sortBy === 'title') diff = a.title.localeCompare(b.title);
        else if (sortBy === 'status') diff = a.status.localeCompare(b.status);
        return sortAsc ? diff : -diff;
      });
  }, [boxes, searchQuery, statusFilter, targetRoomFilter, fragileFilter, sortBy, sortAsc, rooms]);

  return (
    <div className="space-y-6">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Totaal Dozen</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {totalBoxes}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{fragileCount}</span> breekbaar
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Reeds Verhuisd</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {movedBoxes}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{progressPercent}%</span> gearriveerd
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">Onderweg</span>
            <Truck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {inTransitBoxes}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">in verhuiswagen</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-semibold">In Oud Huis</span>
            <Home className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-slate-700 dark:text-slate-300 mt-1">
            {inOldHouseBoxes}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">wachten op inladen</div>
        </div>
      </div>

      {/* Main Search & Control Bar */}
      <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Keyword Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek op doos #, inhoud (bv. glazen), kamer, notitie..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Wis
              </button>
            )}
          </div>

          {/* Primary Action Buttons */}
          <div className="flex gap-2 shrink-0">
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={onAddNewBox}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>Nieuwe Doos</span>
              </button>
            )}

            {userRole === 'admin' && (
              <button
                type="button"
                onClick={() => onOpenPrintModal(filteredBoxes)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer min-h-[42px]"
              >
                <Printer className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Dymo Labels Printen</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Selectors Row */}
        <div className="flex flex-wrap gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Alle statussen ({boxes.length})</option>
              <option value="IN_OLD_HOUSE">Nog in oud huis ({inOldHouseBoxes})</option>
              <option value="IN_TRANSIT">Onderweg ({inTransitBoxes})</option>
              <option value="MOVED">Verhuisd ({movedBoxes})</option>
            </select>
          </div>

          {/* Doelruimte Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Doelruimte:</span>
            <select
              value={targetRoomFilter}
              onChange={(e) => setTargetRoomFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 max-w-[160px] truncate"
            >
              <option value="ALL">Alle ruimtes</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Breekbaar Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Breekbaar:</span>
            <select
              value={fragileFilter}
              onChange={(e) => setFragileFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">Alles</option>
              <option value="YES">Alleen Breekbaar</option>
              <option value="NO">Niet Breekbaar</option>
            </select>
          </div>

          {/* Sorteer volgorde */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[11px] font-semibold text-slate-500">Sorteer:</span>
            <button
              onClick={() => {
                if (sortBy === 'number') setSortAsc(!sortAsc);
                else {
                  setSortBy('number');
                  setSortAsc(true);
                }
              }}
              className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <span>Nummer</span>
              <ArrowUpDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Table (Responsive Desktop Grid & Mobile Cards) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {filteredBoxes.length > 0 ? (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Doos #</th>
                    <th className="py-3 px-4">Titel & Inhoud</th>
                    <th className="py-3 px-4">Doelruimte</th>
                    <th className="py-3 px-4">Huidige Locatie</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredBoxes.map((box) => {
                    const targetRoom = getRoom(box.targetRoomId);
                    const currentRoom = getRoom(box.currentRoomId);
                    return (
                      <tr
                        key={box.id}
                        onClick={() => onSelectBox(box)}
                        className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-bold">#{String(box.boxNumber).padStart(3, '0')}</span>
                            <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                              {box.itemType || 'Doos'}
                            </span>
                            {box.fragile && (
                              <span
                                className="text-[9px] font-black uppercase text-red-600 bg-red-100 dark:bg-red-950 px-1 py-0.5 rounded flex items-center gap-0.5"
                                title="Breekbare inhoud!"
                              >
                                <AlertTriangle className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">{box.id}</span>
                        </td>

                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {box.title}
                          </div>
                          {box.items && box.items.length > 0 && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {box.items.slice(0, 3).join(', ')}
                              {box.items.length > 3 ? ` +${box.items.length - 3}` : ''}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{targetRoom?.name || 'Onbekend'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {floors.find((f) => f.id === targetRoom?.floorId)?.name || ''}
                          </span>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Warehouse className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{currentRoom?.name || 'Onbekend'}</span>
                          </div>
                          {box.currentOldRoomId && (
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">
                              🏠 Oud huis: {getRoom(box.currentOldRoomId)?.name || 'Kamer'}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {box.status === 'MOVED' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Verhuisd
                            </span>
                          )}
                          {box.status === 'IN_TRANSIT' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <Truck className="w-3 h-3" />
                              Onderweg
                            </span>
                          )}
                          {box.status === 'IN_OLD_HOUSE' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              <Home className="w-3 h-3" />
                              Oud huis
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectBox(box);
                            }}
                            className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 font-semibold rounded-lg border border-slate-200 dark:border-slate-700 transition-colors text-xs"
                          >
                            Bekijk / Verplaats
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Cards View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBoxes.map((box) => {
                const targetRoom = getRoom(box.targetRoomId);
                const currentRoom = getRoom(box.currentRoomId);
                return (
                  <div
                    key={box.id}
                    onClick={() => onSelectBox(box)}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer active:bg-blue-50/50 space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          #{String(box.boxNumber).padStart(3, '0')}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900">
                          {box.itemType || 'Doos'}
                        </span>
                        {box.fragile && (
                          <span className="text-[9px] font-black uppercase text-red-600 bg-red-100 dark:bg-red-950 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Breekbaar
                          </span>
                        )}
                      </div>

                      <div>
                        {box.status === 'MOVED' && (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verhuisd
                          </span>
                        )}
                        {box.status === 'IN_TRANSIT' && (
                          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5" /> Onderweg
                          </span>
                        )}
                        {box.status === 'IN_OLD_HOUSE' && (
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <Home className="w-3.5 h-3.5" /> Oud huis
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {box.title}
                    </h4>

                    {box.items && box.items.length > 0 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {box.items.join(', ')}
                      </p>
                    )}

                    <div className="flex flex-col gap-1 text-xs pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold truncate">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>Doel: {targetRoom?.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 truncate">
                          Actueel: {currentRoom?.name}
                        </span>
                      </div>
                      {box.currentOldRoomId && (
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                          Staat nu in oud huis: <strong>{getRoom(box.currentOldRoomId)?.name || 'Kamer'}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-12 px-4 text-center">
            <Package className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Geen dozen gevonden</h4>
            <p className="text-xs text-slate-500 mt-1">
              Er zijn geen dozen die voldoen aan de zoekopdracht of geselecteerde filters.
            </p>
            {userRole === 'admin' && (
              <button
                type="button"
                onClick={onAddNewBox}
                className="mt-3 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-sm inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nieuwe Doos Toevoegen</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
