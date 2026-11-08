import React, { useState, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Globe,
  FileText,
  Landmark,
  Smartphone,
  Tag,
  Edit2,
  Trash2,
  Calendar,
  User as UserIcon,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import {
  AddressChangeItem,
  AddressChangeCategory,
  AddressChangeStatus,
  AddressChangeMethod,
  UserRole,
} from '../types/index.ts';

interface AddressChangesViewProps {
  items: AddressChangeItem[];
  userRole: UserRole;
  onAddItem: (item: Partial<AddressChangeItem>) => Promise<void>;
  onUpdateItem: (id: string, data: Partial<AddressChangeItem>) => Promise<void>;
  onUpdateStatus: (id: string, status: AddressChangeStatus) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

const CATEGORIES: { id: AddressChangeCategory; label: string }[] = [
  { id: 'OFFICIEEL', label: 'Overheid & Domicilie' },
  { id: 'NUTSBEDRIJVEN', label: 'Nutsvoorzieningen & Telecom' },
  { id: 'FINANCIEEL', label: 'Bank & Verzekering' },
  { id: 'MEDISCH', label: 'Gezondheidszorg & Artsen' },
  { id: 'ABONNEMENTEN', label: 'Abonnementen & Webshops' },
  { id: 'OVERIG', label: 'Overig' },
];

const METHODS: { id: AddressChangeMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'WEBSITE', label: 'Website / Portaal', icon: <Globe className="w-3.5 h-3.5" /> },
  { id: 'EMAIL', label: 'E-mail', icon: <Mail className="w-3.5 h-3.5" /> },
  { id: 'TELEFOON', label: 'Telefonisch', icon: <Phone className="w-3.5 h-3.5" /> },
  { id: 'APP', label: 'Mobiele App', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { id: 'LOKET', label: 'Loket / Afspraak', icon: <Landmark className="w-3.5 h-3.5" /> },
  { id: 'BRIEF', label: 'Aangetekende Brief', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'OVERIG', label: 'Anders', icon: <Tag className="w-3.5 h-3.5" /> },
];

export const AddressChangesView: React.FC<AddressChangesViewProps> = ({
  items,
  userRole,
  onAddItem,
  onUpdateItem,
  onUpdateStatus,
  onDeleteItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AddressChangeItem | null>(null);

  // Form inputs
  const [formCompany, setFormCompany] = useState('');
  const [formCategory, setFormCategory] = useState<AddressChangeCategory>('OFFICIEEL');
  const [formStatus, setFormStatus] = useState<AddressChangeStatus>('TE_DOEN');
  const [formAssignedTo, setFormAssignedTo] = useState('');
  const [formCompletedBy, setFormCompletedBy] = useState('');
  const [formCompletedDate, setFormCompletedDate] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formMethod, setFormMethod] = useState<AddressChangeMethod>('WEBSITE');
  const [formReferenceNumber, setFormReferenceNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Stats calculation
  const totalCount = items.length;
  const completedCount = items.filter((i) => i.status === 'VOLTOOID').length;
  const inProgressCount = items.filter((i) => i.status === 'IN_BEHANDELING').length;
  const pendingCount = items.filter((i) => i.status === 'TE_DOEN').length;
  const percentDone = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          item.companyName.toLowerCase().includes(q) ||
          (item.assignedTo && item.assignedTo.toLowerCase().includes(q)) ||
          (item.completedBy && item.completedBy.toLowerCase().includes(q)) ||
          (item.referenceNumber && item.referenceNumber.toLowerCase().includes(q)) ||
          (item.notes && item.notes.toLowerCase().includes(q));
        if (!matches) return false;
      }

      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormCompany('');
    setFormCategory('OFFICIEEL');
    setFormStatus('TE_DOEN');
    setFormAssignedTo('');
    setFormCompletedBy('');
    setFormCompletedDate('');
    setFormDueDate('');
    setFormMethod('WEBSITE');
    setFormReferenceNumber('');
    setFormNotes('');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: AddressChangeItem) => {
    setEditingItem(item);
    setFormCompany(item.companyName);
    setFormCategory(item.category);
    setFormStatus(item.status);
    setFormAssignedTo(item.assignedTo || '');
    setFormCompletedBy(item.completedBy || '');
    setFormCompletedDate(item.completedDate || '');
    setFormDueDate(item.dueDate || '');
    setFormMethod(item.method || 'WEBSITE');
    setFormReferenceNumber(item.referenceNumber || '');
    setFormNotes(item.notes || '');
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany.trim()) {
      setFormError('Vul een bedrijfsnaam of instantie in.');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    try {
      const payload: Partial<AddressChangeItem> = {
        companyName: formCompany.trim(),
        category: formCategory,
        status: formStatus,
        assignedTo: formAssignedTo.trim() || undefined,
        completedBy: formCompletedBy.trim() || undefined,
        completedDate: formCompletedDate || undefined,
        dueDate: formDueDate || undefined,
        method: formMethod,
        referenceNumber: formReferenceNumber.trim() || undefined,
        notes: formNotes.trim() || undefined,
      };

      if (editingItem) {
        await onUpdateItem(editingItem.id, payload);
      } else {
        await onAddItem(payload);
      }
      setIsFormOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) setFormError(err.message);
      else setFormError('Fout bij opslaan.');
    } finally {
      setFormLoading(false);
    }
  };

  const cycleStatus = async (item: AddressChangeItem) => {
    const nextStatus: Record<AddressChangeStatus, AddressChangeStatus> = {
      TE_DOEN: 'IN_BEHANDELING',
      IN_BEHANDELING: 'VOLTOOID',
      VOLTOOID: 'TE_DOEN',
    };
    await onUpdateStatus(item.id, nextStatus[item.status]);
  };

  const getMethodBadge = (m?: AddressChangeMethod) => {
    if (!m) return null;
    const match = METHODS.find((x) => x.id === m);
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {match?.icon}
        <span>{match?.label || m}</span>
      </span>
    );
  };

  const getStatusBadge = (status: AddressChangeStatus) => {
    switch (status) {
      case 'VOLTOOID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Voltooid</span>
          </span>
        );
      case 'IN_BEHANDELING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" />
            <span>In Behandeling</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Te Doen</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <span>Adreswijzigingen per Bedrijf & Instantie</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Houd bij wie welk bedrijf heeft ingelicht, wanneer en via welke methode
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Bedrijf Toevoegen</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Totaal Instanties</div>
          <div className="text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {totalCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Bedrijven & diensten</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Reeds Doorgegeven</div>
          <div className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-6 h-6" />
            <span>{completedCount}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="font-bold text-emerald-600 dark:text-emerald-400">{percentDone}%</span> voltooid
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="text-xs font-semibold text-slate-500">In Behandeling</div>
          <div className="text-2xl font-black font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
            <Clock className="w-6 h-6" />
            <span>{inProgressCount}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Lopend contact</div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Nog Te Doen</div>
          <div className="text-2xl font-black font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1">
            {pendingCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Nog te contacteren</div>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              percentDone === 100 ? 'bg-emerald-500' : 'bg-blue-600'
            }`}
            style={{ width: `${percentDone}%` }}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Zoek bedrijf, contactpersoon, notities..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Alle Categorieën</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200"
          >
            <option value="ALL">Alle Statussen</option>
            <option value="TE_DOEN">Te Doen</option>
            <option value="IN_BEHANDELING">In Behandeling</option>
            <option value="VOLTOOID">Voltooid</option>
          </select>
        </div>
      </div>

      {/* List / Cards */}
      <div className="space-y-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.status === 'VOLTOOID'
                  ? 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20'
                  : item.status === 'IN_BEHANDELING'
                  ? 'border-amber-200 dark:border-amber-900/60'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.companyName}
                  </h4>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {CATEGORIES.find((c) => c.id === item.category)?.label || item.category}
                  </span>
                  {getMethodBadge(item.method)}
                </div>

                {item.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {item.notes}
                  </p>
                )}

                {/* Who & When Meta */}
                <div className="flex items-center gap-3 flex-wrap text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  {item.assignedTo && (
                    <span className="flex items-center gap-1">
                      <UserIcon className="w-3 h-3 text-blue-500" />
                      <span>Toegewezen: <strong>{item.assignedTo}</strong></span>
                    </span>
                  )}
                  {item.completedBy && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check className="w-3 h-3" />
                      <span>Uitgevoerd door: <strong>{item.completedBy}</strong></span>
                    </span>
                  )}
                  {item.completedDate && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>Datum: {item.completedDate}</span>
                    </span>
                  )}
                  {item.dueDate && !item.completedDate && (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Calendar className="w-3 h-3" />
                      <span>Uiterlijk: {item.dueDate}</span>
                    </span>
                  )}
                  {item.referenceNumber && (
                    <span className="font-mono text-slate-400">
                      Ref: {item.referenceNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-between sm:justify-end">
                <button
                  type="button"
                  onClick={() => cycleStatus(item)}
                  className="cursor-pointer hover:opacity-85 transition-opacity"
                  title="Klik om status te wijzigen"
                >
                  {getStatusBadge(item.status)}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg cursor-pointer"
                    title="Bewerken"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                    title="Verwijderen"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 px-4 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Geen adreswijzigingen gevonden
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Er zijn geen instanties die voldoen aan de zoekfilter. Voeg gerust een bedrijf toe.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nieuw Bedrijf Toevoegen</span>
            </button>
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 no-print overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-auto flex flex-col">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {editingItem ? 'Adreswijziging Bewerken' : 'Nieuw Bedrijf / Instantie Toevoegen'}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Registreer wie de adreswijziging doorgeeft en via welke methode
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveForm} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto max-h-[75vh]">
              {formError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bedrijfsnaam of Instantie:
                </label>
                <input
                  type="text"
                  required
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="bijv. Bpost, Fluvius, KBC, Partena, Netflix..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categorie:
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as AddressChangeCategory)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as AddressChangeStatus)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="TE_DOEN">Te Doen</option>
                    <option value="IN_BEHANDELING">In Behandeling</option>
                    <option value="VOLTOOID">Voltooid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Methode van doorgave:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setFormMethod(m.id)}
                      className={`px-2.5 py-1.5 text-[11px] rounded-lg border font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                        formMethod === m.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                      }`}
                    >
                      {m.icon}
                      <span className="truncate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Wie gaat dit doen? (Toegewezen):
                  </label>
                  <input
                    type="text"
                    value={formAssignedTo}
                    onChange={(e) => setFormAssignedTo(e.target.value)}
                    placeholder="bijv. Lode, Sarah..."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Wie heeft dit gedaan?:
                  </label>
                  <input
                    type="text"
                    value={formCompletedBy}
                    onChange={(e) => setFormCompletedBy(e.target.value)}
                    placeholder="bijv. Lode"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Uiterste datum (Deadline):
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
                    Datum uitgevoerd:
                  </label>
                  <input
                    type="date"
                    value={formCompletedDate}
                    onChange={(e) => setFormCompletedDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Klantnummer of Dossiercode (Optioneel):
                </label>
                <input
                  type="text"
                  value={formReferenceNumber}
                  onChange={(e) => setFormReferenceNumber(e.target.value)}
                  placeholder="bijv. Klantnr: 884920 of polisnummer"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notities of instructies:
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="bijv. Eerst eID chip uitlezen of online via itsme doorgeven"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 cursor-pointer min-h-[40px]"
                >
                  <Check className="w-4 h-4" />
                  <span>{formLoading ? 'Opslaan...' : editingItem ? 'Wijzigingen Opslaan' : 'Toevoegen'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
