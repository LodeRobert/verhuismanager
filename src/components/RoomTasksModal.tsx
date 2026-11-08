import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  CheckSquare,
  Package,
  Wrench,
  Brush,
  Tag,
  Edit2,
  Check,
  ArrowRight,
  Truck,
  Recycle,
  Hammer,
  Frame,
  Plug,
  PackageOpen,
  AlertTriangle,
} from 'lucide-react';
import { Room, Floor, Box, RoomTask, TaskCategory, UserRole } from '../types/index.ts';

interface RoomTasksModalProps {
  room: Room;
  floor?: Floor;
  boxesInRoom: Box[];
  userRole: UserRole;
  onToggleReadiness: (roomId: string, isReady: boolean) => Promise<void>;
  onToggleFlag?: (roomId: string, flags: { needsClearingOut?: boolean; hasContainerparkItems?: boolean; isReadyForMove?: boolean }) => Promise<void>;
  onAddTask: (roomId: string, task: { text: string; category: TaskCategory }) => Promise<void>;
  onUpdateTask: (roomId: string, taskId: string, task: { text?: string; category?: TaskCategory; completed?: boolean }) => Promise<void>;
  onToggleTask: (roomId: string, taskId: string, completed: boolean) => Promise<void>;
  onDeleteTask: (roomId: string, taskId: string) => Promise<void>;
  onSelectBox?: (box: Box) => void;
  onClose: () => void;
}

export const RoomTasksModal: React.FC<RoomTasksModalProps> = ({
  room,
  floor,
  boxesInRoom,
  userRole,
  onToggleReadiness,
  onToggleFlag,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onSelectBox,
  onClose,
}) => {
  const isOldHouse = room.houseType === 'OLD';
  const tasks = room.tasks || [];
  const completedTasks = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // House-specific categories
  const oldHouseCategories: { id: TaskCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'INPAKKEN', label: 'Inpakken', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'LEEGMAKEN', label: 'Leeghalen / Demonteren', icon: <Truck className="w-3.5 h-3.5" /> },
    { id: 'CONTAINERPARK', label: 'Containerpark / Grofvuil', icon: <Recycle className="w-3.5 h-3.5" /> },
    { id: 'POETSEN', label: 'Poetsen', icon: <Brush className="w-3.5 h-3.5" /> },
    { id: 'KLUSSEN', label: 'Klussen / Herstellen', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'OVERIG', label: 'Overig', icon: <Tag className="w-3.5 h-3.5" /> },
  ];

  const newHouseCategories: { id: TaskCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'UITPAKKEN', label: 'Uitpakken', icon: <PackageOpen className="w-3.5 h-3.5" /> },
    { id: 'MONTEREN', label: 'Monteren / Ineensteken', icon: <Hammer className="w-3.5 h-3.5" /> },
    { id: 'OPHANGEN', label: 'Ophangen (lampen/kaders)', icon: <Frame className="w-3.5 h-3.5" /> },
    { id: 'AANSLUITEN', label: 'Aansluiten (elektra/water)', icon: <Plug className="w-3.5 h-3.5" /> },
    { id: 'POETSEN', label: 'Poetsen', icon: <Brush className="w-3.5 h-3.5" /> },
    { id: 'KLUSSEN', label: 'Klussen / Schilderen', icon: <Wrench className="w-3.5 h-3.5" /> },
    { id: 'OVERIG', label: 'Overig', icon: <Tag className="w-3.5 h-3.5" /> },
  ];

  const activeCategories = isOldHouse ? oldHouseCategories : newHouseCategories;
  const defaultCategory: TaskCategory = isOldHouse ? 'INPAKKEN' : 'UITPAKKEN';

  const [newTaskText, setNewTaskText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>(defaultCategory);
  const [loading, setLoading] = useState(false);

  // Edit task state
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState<TaskCategory>(defaultCategory);

  const handleToggleRoomReady = async () => {
    setLoading(true);
    try {
      await onToggleReadiness(room.id, !room.isReadyForMove);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClearingOut = async () => {
    if (!onToggleFlag) return;
    setLoading(true);
    try {
      // Toggle: if undefined or true -> false, if false -> true
      const current = room.needsClearingOut ?? true;
      await onToggleFlag(room.id, { needsClearingOut: !current });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleContainerpark = async () => {
    if (!onToggleFlag) return;
    setLoading(true);
    try {
      const current = Boolean(room.hasContainerparkItems);
      await onToggleFlag(room.id, { hasContainerparkItems: !current });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newTaskText.trim()) return;
    setLoading(true);
    try {
      await onAddTask(room.id, { text: newTaskText.trim(), category: selectedCategory });
      setNewTaskText('');
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (task: RoomTask) => {
    setEditingTaskId(task.id);
    setEditText(task.text);
    setEditCategory(task.category);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaskId || !editText.trim()) return;
    setLoading(true);
    try {
      await onUpdateTask(room.id, editingTaskId, {
        text: editText.trim(),
        category: editCategory,
      });
      setEditingTaskId(null);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryBadge = (cat: TaskCategory) => {
    switch (cat) {
      case 'INPAKKEN':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center gap-1">
            <Package className="w-2.5 h-2.5" /> Inpakken
          </span>
        );
      case 'LEEGMAKEN':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 flex items-center gap-1">
            <Truck className="w-2.5 h-2.5" /> Leeghalen
          </span>
        );
      case 'CONTAINERPARK':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-1">
            <Recycle className="w-2.5 h-2.5" /> Containerpark
          </span>
        );
      case 'UITPAKKEN':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 flex items-center gap-1">
            <PackageOpen className="w-2.5 h-2.5" /> Uitpakken
          </span>
        );
      case 'MONTEREN':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 flex items-center gap-1">
            <Hammer className="w-2.5 h-2.5" /> Monteren
          </span>
        );
      case 'OPHANGEN':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 flex items-center gap-1">
            <Frame className="w-2.5 h-2.5" /> Ophangen
          </span>
        );
      case 'AANSLUITEN':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 flex items-center gap-1">
            <Plug className="w-2.5 h-2.5" /> Aansluiten
          </span>
        );
      case 'POETSEN':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
            <Brush className="w-2.5 h-2.5" /> Poetsen
          </span>
        );
      case 'KLUSSEN':
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
            <Wrench className="w-2.5 h-2.5" /> Klussen
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" /> Overig
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${
                isOldHouse ? 'text-amber-600 dark:text-amber-400' : 'text-blue-600 dark:text-blue-400'
              }`}>
                {isOldHouse ? '🏠 Oud Huis (Vertrek)' : '🏡 Nieuw Huis (Bestemming)'}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Verdieping: {floor?.name || 'Onbekend'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {room.name} — Werkpunten & Status
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* PROMINENT "KLAAR VOOR VERHUIS" VINKJE */}
          <div
            onClick={handleToggleRoomReady}
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between shadow-xs ${
              room.isReadyForMove
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-950 dark:text-emerald-100'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-300 dark:border-slate-700 hover:border-emerald-400 text-slate-700 dark:text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-transform active:scale-95 ${
                  room.isReadyForMove
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-extrabold">
                    {room.isReadyForMove
                      ? isOldHouse
                        ? '✓ Deze kamer is 100% KLAAR voor de verhuis!'
                        : '✓ Deze kamer is ingericht en 100% KLAAR!'
                      : isOldHouse
                      ? 'Kamer gereed voor verhuis?'
                      : 'Kamer klaar & ingericht?'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {room.isReadyForMove
                    ? isOldHouse
                      ? 'Alles is ingepakt, gepoetst en klaar om direct in te laden zonder extra werk.'
                      : 'Alle dozen zijn uitgepakt, meubels staan en apparaten zijn aangesloten.'
                    : isOldHouse
                    ? 'Klik hier zodra alles in deze kamer is ingepakt en schoongemaakt.'
                    : 'Klik hier zodra alles in deze nieuwe kamer is afgewerkt.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 hidden sm:block">
              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${
                  room.isReadyForMove
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {room.isReadyForMove ? 'KLAAR' : 'NIET KLAAR'}
              </span>
            </div>
          </div>

          {/* OUD HUIS SPECIFIEKE SCHAKELKNOPPEN: LEEGHALEN & CONTAINERPARK */}
          {isOldHouse && onToggleFlag && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Knop 1: Moet nog leeggehaald worden */}
              <button
                type="button"
                onClick={handleToggleClearingOut}
                disabled={loading}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  room.needsClearingOut
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    room.needsClearingOut
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  <Truck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>{room.needsClearingOut ? 'Moet nog leeggehaald worden' : 'Kamer is leeggemaakt'}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-black uppercase ${
                      room.needsClearingOut
                        ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-100'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                    }`}>
                      {room.needsClearingOut ? 'TE DOEN' : 'LEEG'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {room.needsClearingOut
                      ? 'Kasten of meubels moeten nog gedemonteerd en verhuisd worden.'
                      : 'Alle meubels en kasten zijn uit deze kamer verwijderd.'}
                  </p>
                </div>
              </button>

              {/* Knop 2: Zaken naar containerpark brengen */}
              <button
                type="button"
                onClick={handleToggleContainerpark}
                disabled={loading}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  room.hasContainerparkItems
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-rose-400'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    room.hasContainerparkItems
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  <Recycle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold flex items-center justify-between">
                    <span>Containerpark / Grofvuil</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-black uppercase ${
                      room.hasContainerparkItems
                        ? 'bg-rose-200 text-rose-900 dark:bg-rose-900 dark:text-rose-100'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                      {room.hasContainerparkItems ? 'AANWEZIG' : 'GEEN'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {room.hasContainerparkItems
                      ? 'Er staan spullen of afval die naar het recyclagepark moeten.'
                      : 'Geen afval of containerpark-spullen in deze ruimte.'}
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* BOXEN DIE NOG IN DEZE KAMER STAAN */}
          {boxesInRoom.length > 0 && (
            <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-950 dark:text-blue-200">
                <span className="flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Items die momenteel in deze kamer staan ({boxesInRoom.length}):</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {boxesInRoom.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      if (onSelectBox) {
                        onClose();
                        onSelectBox(b);
                      }
                    }}
                    className="px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 hover:border-blue-500 rounded-lg text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span className="font-mono text-blue-600">#{b.boxNumber}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">[{b.itemType || 'Doos'}]</span>
                    <span className="truncate max-w-[140px]">{b.title}</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* WERKPUNTEN CHECKLIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Werkpunten Checklist ({completedTasks}/{tasks.length})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isOldHouse
                    ? 'Taken om in te pakken, meubels te demonteren, afval op te ruimen of te poetsen'
                    : 'Taken om uit te pakken, kasten te monteren, lampen op te hangen of aan te sluiten'}
                </p>
              </div>

              {tasks.length > 0 && (
                <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                  {progressPercent}% voltooid
                </div>
              )}
            </div>

            {/* Progress bar */}
            {tasks.length > 0 && (
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Snel Nieuw Werkpunt Toevoegen */}
            {!editingTaskId && (
              <form onSubmit={handleCreateTask} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder={
                      isOldHouse
                        ? 'Nieuw werkpunt (bv. Kleerkast demonteren, vuilniszakken naar containerpark...)'
                        : 'Nieuw werkpunt (bv. Bed ineensteken, hanglamp ophangen, wasmachine aansluiten...)'
                    }
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !newTaskText.trim()}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer min-h-[38px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Toevoegen</span>
                  </button>
                </div>

                {/* Category selector buttons: context-aware for Old House vs New House */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-[11px] font-semibold text-slate-500 mr-1">Categorie:</span>
                  {activeCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                        selectedCategory === cat.id
                          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold border-transparent shadow-xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {cat.icon}
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </form>
            )}

            {/* EDIT FORM WHEN EDITING A TASK */}
            {editingTaskId && (
              <form onSubmit={handleSaveEdit} className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Werkpunt Aanpassen</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingTaskId(null)}
                    className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Annuleren
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />

                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setEditCategory(cat.id)}
                        className={`px-2.5 py-1 text-xs rounded-full border transition-all cursor-pointer flex items-center gap-1 ${
                          editCategory === cat.id
                            ? 'bg-amber-600 text-white font-bold border-transparent'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {cat.icon}
                        <span>{cat.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingTaskId(null)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Annuleren
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-600 hover:bg-amber-500 text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Opslaan</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Takenlijst */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      task.completed
                        ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/80 text-slate-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs'
                    }`}
                  >
                    <div
                      onClick={() => onToggleTask(room.id, task.id, !task.completed)}
                      className="flex items-center gap-2.5 flex-1 cursor-pointer select-none"
                    >
                      <button
                        type="button"
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                          task.completed
                            ? 'text-emerald-500 dark:text-emerald-400'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {task.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>

                      <div className="flex-1">
                        <span
                          className={`text-xs ${
                            task.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'font-medium'
                          }`}
                        >
                          {task.text}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {getCategoryBadge(task.category)}

                      <button
                        type="button"
                        onClick={() => handleStartEdit(task)}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded cursor-pointer"
                        title="Werkpunt bewerken"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteTask(room.id, task.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                        title="Verwijder werkpunt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 italic bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  {isOldHouse
                    ? 'Nog geen werkpunten voor deze ruimte. Voeg taken toe zoals kleerkast demonteren of afval sorteren.'
                    : 'Nog geen werkpunten voor deze ruimte. Voeg taken toe zoals uitpakken, kasten monteren of lampen ophangen.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            Klaar
          </button>
        </div>
      </div>
    </div>
  );
};
