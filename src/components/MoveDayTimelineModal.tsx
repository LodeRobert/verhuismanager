import React, { useState } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Check,
  User as UserIcon,
} from 'lucide-react';
import { MoveDayTask, UserRole } from '../types/index.ts';

interface MoveDayTimelineModalProps {
  tasks: MoveDayTask[];
  userRole: UserRole;
  onToggleTask: (id: string, completed: boolean) => Promise<void>;
  onAddTask: (task: Partial<MoveDayTask>) => Promise<void>;
  onUpdateTask: (id: string, task: Partial<MoveDayTask>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onClose: () => void;
}

export const MoveDayTimelineModal: React.FC<MoveDayTimelineModalProps> = ({
  tasks,
  userRole,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onClose,
}) => {
  const [newTime, setNewTime] = useState('09:00');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssigned, setNewAssigned] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Edit fields
  const [editTime, setEditTime] = useState('09:00');
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAssigned, setEditAssigned] = useState('');

  const [loading, setLoading] = useState(false);

  const sortedTasks = [...tasks].sort((a, b) => a.time.localeCompare(b.time));
  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleStartEdit = (task: MoveDayTask) => {
    setEditingTaskId(task.id);
    setEditTime(task.time);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditAssigned(task.assignedTo || '');
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    setEditingTaskId(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTaskId || !editTitle.trim()) return;
    setLoading(true);
    try {
      await onUpdateTask(editingTaskId, {
        time: editTime,
        title: editTitle.trim(),
        description: editDesc.trim(),
        assignedTo: editAssigned.trim(),
      });
      setEditingTaskId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setLoading(true);
    try {
      await onAddTask({
        time: newTime,
        title: newTitle.trim(),
        description: newDesc.trim(),
        assignedTo: newAssigned.trim(),
      });
      setNewTitle('');
      setNewDesc('');
      setNewAssigned('');
      setShowAddForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Draaiboek & Planning Verhuisdag
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Uur-tot-uur planning — Alles is direct bewerkbaar en aanpasbaar
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

        {/* Progress header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              Verhuisdag Voortgang: {completedCount} van de {tasks.length} stappen voltooid ({progressPercent}%)
            </div>
            <div className="w-48 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1.5">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {!showAddForm && !editingTaskId && userRole === 'admin' && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Stap Toevoegen</span>
            </button>
          )}
        </div>

        {/* Form to add step */}
        {showAddForm && (
          <form onSubmit={handleCreate} className="p-4 bg-blue-50/50 dark:bg-slate-800/80 border-b border-blue-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                Nieuw Tijdsmoment Toevoegen aan Draaiboek
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Annuleren
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Tijdstip:
                </label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Titel / Gebeurtenis:
                </label>
                <input
                  type="text"
                  required
                  placeholder="bijv. Koffiepauze & briefing"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Toelichting / Instructies:
                </label>
                <input
                  type="text"
                  placeholder="bijv. Broodjes klaarzetten in de keuken"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Verantwoordelijke (optioneel):
                </label>
                <input
                  type="text"
                  placeholder="bijv. Thomas of Familie"
                  value={newAssigned}
                  onChange={(e) => setNewAssigned(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
              >
                Opslaan in Draaiboek
              </button>
            </div>
          </form>
        )}

        {/* Form to EDIT an existing step */}
        {editingTaskId && (
          <form onSubmit={handleSaveEdit} className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5" />
                <span>Draaiboek Stap Aanpassen</span>
              </span>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                Annuleren
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Tijdstip:
                </label>
                <input
                  type="time"
                  required
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Titel / Gebeurtenis:
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Toelichting / Instructies:
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-0.5">
                  Verantwoordelijke:
                </label>
                <input
                  type="text"
                  value={editAssigned}
                  onChange={(e) => setEditAssigned(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-lg cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Wijzigingen Opslaan</span>
              </button>
            </div>
          </form>
        )}

        {/* Timeline list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3">
          {sortedTasks.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-colors ${
                item.completed
                  ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white shadow-2xs'
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => onToggleTask(item.id, !item.completed)}
                className={`mt-0.5 transition-colors cursor-pointer ${
                  item.completed ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {item.completed ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </button>

              {/* Time Badge */}
              <div className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 shrink-0">
                {item.time}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4
                    className={`text-xs font-bold ${
                      item.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}
                  >
                    {item.title}
                  </h4>
                  {item.assignedTo && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                      {item.assignedTo}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Actions for Admin */}
              {userRole === 'admin' && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    title="Stap bewerken"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteTask(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="Verwijder stap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl cursor-pointer transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
