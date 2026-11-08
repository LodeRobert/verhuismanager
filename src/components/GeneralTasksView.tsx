import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  User as UserIcon,
  Shield,
  Wifi,
  FileText,
  Zap,
  Truck,
  Key,
  Tag,
  Filter,
  Check,
  X,
  AlertCircle,
  Clock,
  RotateCcw,
  ChevronDown,
} from 'lucide-react';
import { GeneralTask, GeneralTaskCategory, GeneralTaskStatus, UserRole } from '../types/index.ts';

interface GeneralTasksViewProps {
  tasks: GeneralTask[];
  userRole: UserRole;
  onAddTask: (task: Partial<GeneralTask>) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<GeneralTask>) => Promise<void>;
  onToggleTask: (id: string, completed?: boolean, status?: GeneralTaskStatus) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
}

export const GeneralTasksView: React.FC<GeneralTasksViewProps> = ({
  tasks,
  userRole,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
}) => {
  const isAdmin = userRole === 'admin';
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | GeneralTaskStatus>('ALL');
  const [activeStatusMenuTaskId, setActiveStatusMenuTaskId] = useState<string | null>(null);

  // Form modal state (for both add and edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<GeneralTaskCategory>('ADMINISTRATIE');
  const [formStatus, setFormStatus] = useState<GeneralTaskStatus>('GEPLAND');
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categories: { key: GeneralTaskCategory; label: string; icon: React.ReactNode }[] = [
    { key: 'ADMINISTRATIE', label: 'Administratie', icon: <FileText className="w-3.5 h-3.5" /> },
    { key: 'VERZEKERING', label: 'Verzekering', icon: <Shield className="w-3.5 h-3.5" /> },
    { key: 'TELECOM', label: 'Internet & Telecom', icon: <Wifi className="w-3.5 h-3.5" /> },
    { key: 'NUTSEENHEDEN', label: 'Nutsvoorzieningen', icon: <Zap className="w-3.5 h-3.5" /> },
    { key: 'VERVOER', label: 'Vervoer & Parkeren', icon: <Truck className="w-3.5 h-3.5" /> },
    { key: 'OPLEVERING', label: 'Sleutels & Borg', icon: <Key className="w-3.5 h-3.5" /> },
    { key: 'OVERIG', label: 'Overig', icon: <Tag className="w-3.5 h-3.5" /> },
  ];

  const statusConfig: Record<
    GeneralTaskStatus,
    { label: string; shortLabel: string; bg: string; text: string; border: string; dot: string; icon: React.ReactNode }
  > = {
    GEPLAND: {
      label: 'Gepland',
      shortLabel: 'Gepland',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      dot: 'bg-blue-500',
      icon: <Clock className="w-3.5 h-3.5 text-blue-500" />,
    },
    IN_BEHANDELING: {
      label: 'In Behandeling',
      shortLabel: 'In Behandeling',
      bg: 'bg-amber-50 dark:bg-amber-950/60',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      dot: 'bg-amber-500',
      icon: <Clock className="w-3.5 h-3.5 text-amber-500" />,
    },
    OK: {
      label: 'OK (In Orde)',
      shortLabel: 'OK',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      text: 'text-emerald-700 dark:text-emerald-300 font-bold',
      border: 'border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    },
    NOK: {
      label: 'NOK (Aandacht Nodig)',
      shortLabel: 'NOK',
      bg: 'bg-red-50 dark:bg-red-950/70',
      text: 'text-red-700 dark:text-red-300 font-extrabold',
      border: 'border-red-300 dark:border-red-800 ring-1 ring-red-400/40',
      dot: 'bg-red-500',
      icon: <AlertCircle className="w-3.5 h-3.5 text-red-600" />,
    },
    GEANNULEERD: {
      label: 'Geannuleerd',
      shortLabel: 'Geannuleerd',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-600 dark:text-slate-400',
      border: 'border-slate-200 dark:border-slate-700',
      dot: 'bg-slate-400',
      icon: <X className="w-3.5 h-3.5 text-slate-400" />,
    },
  };

  const getTaskStatus = (task: GeneralTask): GeneralTaskStatus => {
    if (task.status) return task.status;
    return task.completed ? 'OK' : 'GEPLAND';
  };

  const filteredTasks = tasks.filter((t) => {
    if (selectedFilter !== 'ALL' && t.category !== selectedFilter) return false;
    const taskStatus = getTaskStatus(t);
    if (statusFilter !== 'ALL' && taskStatus !== statusFilter) return false;
    return true;
  });

  const totalCount = tasks.length;
  const okCount = tasks.filter((t) => getTaskStatus(t) === 'OK').length;
  const nokCount = tasks.filter((t) => getTaskStatus(t) === 'NOK').length;
  const inBehandelingCount = tasks.filter((t) => getTaskStatus(t) === 'IN_BEHANDELING').length;
  const geplandCount = tasks.filter((t) => getTaskStatus(t) === 'GEPLAND').length;
  const geannuleerdCount = tasks.filter((t) => getTaskStatus(t) === 'GEANNULEERD').length;
  const progressPercent = totalCount > 0 ? Math.round((okCount / totalCount) * 100) : 0;

  const handleOpenAdd = () => {
    setEditingTaskId(null);
    setFormTitle('');
    setFormCategory('ADMINISTRATIE');
    setFormStatus('GEPLAND');
    setFormDueDate('');
    setFormAssignedTo('');
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (task: GeneralTask) => {
    setEditingTaskId(task.id);
    setFormTitle(task.title);
    setFormCategory(task.category);
    setFormStatus(getTaskStatus(task));
    setFormDueDate(task.dueDate || '');
    setFormAssignedTo(task.assignedTo || '');
    setFormNotes(task.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Vul een taaktitel in.');
      return;
    }

    setLoading(true);
    setFormError(null);
    try {
      if (editingTaskId) {
        await onUpdateTask(editingTaskId, {
          title: formTitle.trim(),
          category: formCategory,
          status: formStatus,
          completed: formStatus === 'OK',
          dueDate: formDueDate || undefined,
          assignedTo: formAssignedTo.trim() || undefined,
          notes: formNotes.trim() || undefined,
        });
      } else {
        await onAddTask({
          title: formTitle.trim(),
          category: formCategory,
          status: formStatus,
          completed: formStatus === 'OK',
          dueDate: formDueDate || undefined,
          assignedTo: formAssignedTo.trim() || undefined,
          notes: formNotes.trim() || undefined,
        });
      }
      setIsModalOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) setFormError(err.message);
      else setFormError('Fout bij opslaan van taak.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusChange = async (taskId: string, newStatus: GeneralTaskStatus) => {
    setActiveStatusMenuTaskId(null);
    await onToggleTask(taskId, newStatus === 'OK', newStatus);
  };

  const handleCheckboxClick = async (task: GeneralTask) => {
    const current = getTaskStatus(task);
    if (current === 'OK') {
      await onToggleTask(task.id, false, 'GEPLAND');
    } else {
      await onToggleTask(task.id, true, 'OK');
    }
  };

  const getCategoryInfo = (cat: GeneralTaskCategory) => {
    const item = categories.find((c) => c.key === cat);
    return item || { key: cat, label: cat, icon: <Tag className="w-3.5 h-3.5" /> };
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Verhuis Checklist & Administratie
              </span>
              {nokCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse">
                  {nokCount} NOK actie vereist
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              Algemene Verhuistaken
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Beheer officiële contracten, administratie en verhuisstappen met statussen: <strong>Gepland</strong>, <strong>In behandeling</strong>, <strong>OK</strong> en <strong>NOK</strong>.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Nieuwe Taak Toevoegen</span>
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Voortgang (OK afgerond)</span>
              <span className="font-mono tabular-nums">{okCount} van {totalCount} in orde ({progressPercent}%)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Quick status tabs filter bar */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto scrollbar-none shrink-0 self-start md:self-auto max-w-full">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Alle ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('GEPLAND')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'GEPLAND'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
              }`}
            >
              Gepland ({geplandCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('IN_BEHANDELING')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'IN_BEHANDELING'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
              }`}
            >
              In behandeling ({inBehandelingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OK')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'OK'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              OK ({okCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('NOK')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === 'NOK'
                  ? 'bg-red-600 text-white shadow-xs font-extrabold'
                  : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
              }`}
            >
              NOK ({nokCount})
            </button>
            {geannuleerdCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('GEANNULEERD')}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === 'GEANNULEERD'
                    ? 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Geannuleerd ({geannuleerdCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Filter Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedFilter('ALL')}
          className={`px-3.5 py-2 text-xs font-bold rounded-xl border whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            selectedFilter === 'ALL'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Alle Categorieën</span>
        </button>

        {categories.map((c) => {
          const catCount = tasks.filter((t) => t.category === c.key).length;
          const isSelected = selectedFilter === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => setSelectedFilter(c.key)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl border whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {c.icon}
              <span>{c.label}</span>
              <span
                className={`text-[10px] font-mono ml-0.5 px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {catCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => {
            const catInfo = getCategoryInfo(task.category);
            const status = getTaskStatus(task);
            const cfg = statusConfig[status];
            const isMenuOpen = activeStatusMenuTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative ${
                  status === 'OK'
                    ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 text-slate-400'
                    : status === 'NOK'
                    ? 'bg-red-50/40 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white shadow-xs hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Left zone: Checkbox + Status badge + Title + Metadata */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleCheckboxClick(task)}
                    className={`mt-0.5 shrink-0 transition-colors cursor-pointer ${
                      status === 'OK'
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : status === 'NOK'
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-slate-400 hover:text-blue-600'
                    }`}
                    title={status === 'OK' ? 'Zet terug op Gepland' : 'Markeer als OK'}
                  >
                    {status === 'OK' ? (
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : status === 'NOK' ? (
                      <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    ) : (
                      <Circle className="w-5 h-5 sm:w-6 sm:h-6" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Interactive Status Badge with 1-click status switcher */}
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={() => setActiveStatusMenuTaskId(isMenuOpen ? null : task.id)}
                          className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${cfg.bg} ${cfg.text} ${cfg.border}`}
                          title="Klik om status direct te wijzigen"
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                          <span>{cfg.shortLabel}</span>
                          <ChevronDown className="w-3 h-3 opacity-60" />
                        </button>

                        {/* Dropdown status switcher */}
                        {isMenuOpen && (
                          <>
                            <div
                              className="fixed inset-0 z-30"
                              onClick={() => setActiveStatusMenuTaskId(null)}
                            />
                            <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-40 p-1.5 space-y-1">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                                Wijzig Status:
                              </div>
                              {(['GEPLAND', 'IN_BEHANDELING', 'OK', 'NOK', 'GEANNULEERD'] as GeneralTaskStatus[]).map(
                                (st) => {
                                  const c = statusConfig[st];
                                  const isCurrent = status === st;
                                  return (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => handleQuickStatusChange(task.id, st)}
                                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors cursor-pointer ${
                                        isCurrent
                                          ? `${c.bg} ${c.text} font-bold`
                                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                                        <span>{c.label}</span>
                                      </div>
                                      {isCurrent && <Check className="w-3.5 h-3.5" />}
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        {catInfo.icon}
                        <span>{catInfo.label}</span>
                      </span>

                      {task.dueDate && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-amber-500" />
                            <span>Streefdatum: {task.dueDate}</span>
                          </span>
                        </>
                      )}

                      {task.assignedTo && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <UserIcon className="w-3 h-3 text-blue-500" />
                            <span>{task.assignedTo}</span>
                          </span>
                        </>
                      )}
                    </div>

                    <h3
                      onClick={() => handleCheckboxClick(task)}
                      className={`text-sm sm:text-base font-bold cursor-pointer select-none ${
                        status === 'OK'
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : status === 'NOK'
                          ? 'text-red-950 dark:text-red-200'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {task.title}
                    </h3>

                    {task.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right zone: Edit / Delete action buttons */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0 border-t md:border-t-0 pt-2 md:pt-0 w-full md:w-auto justify-end border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(task)}
                    className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold min-h-[36px]"
                    title="Taak bewerken"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="md:hidden">Aanpassen</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onDeleteTask(task.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer min-h-[36px]"
                      title="Taak verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-60" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Geen algemene taken in dit overzicht
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Pas de filters aan of voeg een nieuwe verhuistaak toe via de knop hierboven.
            </p>
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-auto flex flex-col">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
                  {editingTaskId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingTaskId ? 'Algemene Taak Aanpassen' : 'Nieuwe Algemene Taak'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Administratie, contracten of verhuisverplichtingen
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[75vh]">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Taak Omschrijving / Titel:
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="bijv. Brandverzekering overzetten naar nieuw adres"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Picker Buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status van de taak:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['GEPLAND', 'IN_BEHANDELING', 'OK', 'NOK', 'GEANNULEERD'] as GeneralTaskStatus[]).map((st) => {
                    const c = statusConfig[st];
                    const isSelected = formStatus === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setFormStatus(st)}
                        className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
                            ? `${c.bg} ${c.text} ${c.border} ring-2 ring-blue-500/30`
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
                        <span>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categorie:
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as GeneralTaskCategory)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Streefdatum (optioneel):
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Toegewezen aan (optioneel):
                  </label>
                  <input
                    type="text"
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    placeholder="bijv. Lode of Familie"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notities of instructies:
                </label>
                <textarea
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="bijv. Polisnummer vermelden, bellen voor de 15e van de maand..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer min-h-[44px]"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer min-h-[44px]"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? 'Opslaan...' : editingTaskId ? 'Wijziging Opslaan' : 'Taak Aanmaken'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
