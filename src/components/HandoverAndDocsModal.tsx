import React, { useState } from 'react';
import {
  Key,
  FileText,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Home,
  Check,
  Trash2,
  Edit2,
  Calendar,
  User as UserIcon,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import {
  KeyHandoverItem,
  DocumentItem,
  HouseType,
  UserRole,
} from '../types/index.ts';

interface HandoverAndDocsModalProps {
  keyHandovers: KeyHandoverItem[];
  documents: DocumentItem[];
  userRole: UserRole;
  initialTab?: 'keys' | 'docs';
  onAddKey: (item: Partial<KeyHandoverItem>) => Promise<void>;
  onUpdateKey: (id: string, data: Partial<KeyHandoverItem>) => Promise<void>;
  onDeleteKey: (id: string) => Promise<void>;
  onAddDoc: (item: Partial<DocumentItem>) => Promise<void>;
  onUpdateDoc: (id: string, data: Partial<DocumentItem>) => Promise<void>;
  onDeleteDoc: (id: string) => Promise<void>;
  onClose: () => void;
}

export const HandoverAndDocsModal: React.FC<HandoverAndDocsModalProps> = ({
  keyHandovers,
  documents,
  userRole,
  initialTab = 'keys',
  onAddKey,
  onUpdateKey,
  onDeleteKey,
  onAddDoc,
  onUpdateDoc,
  onDeleteDoc,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'docs'>(initialTab);

  // Key form state
  const [isKeyFormOpen, setIsKeyFormOpen] = useState(false);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [keyType, setKeyType] = useState('');
  const [keyHouseType, setKeyHouseType] = useState<HouseType>('OLD');
  const [keyCount, setKeyCount] = useState<number>(1);
  const [keyNotes, setKeyNotes] = useState('');
  const [keyHandedOver, setKeyHandedOver] = useState(false);
  const [keyHandedOverDate, setKeyHandedOverDate] = useState('');
  const [keyHandedOverBy, setKeyHandedOverBy] = useState('');
  const [keyReceivedBy, setKeyReceivedBy] = useState('');

  // Doc form state
  const [isDocFormOpen, setIsDocFormOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<'CONTRACT' | 'KEURING' | 'VERZEKERING' | 'OVERIG'>('CONTRACT');
  const [docStatus, setDocStatus] = useState<'AANWEZIG' | 'TE_REGELEN' | 'VERLOPEN'>('AANWEZIG');
  const [docFileNumber, setDocFileNumber] = useState('');
  const [docNotes, setDocNotes] = useState('');
  const [docDueDate, setDocDueDate] = useState('');

  const [loading, setLoading] = useState(false);

  // Key handlers
  const handleOpenAddKey = () => {
    setEditingKeyId(null);
    setKeyType('');
    setKeyHouseType('OLD');
    setKeyCount(1);
    setKeyNotes('');
    setKeyHandedOver(false);
    setKeyHandedOverDate('');
    setKeyHandedOverBy('');
    setKeyReceivedBy('');
    setIsKeyFormOpen(true);
  };

  const handleOpenEditKey = (k: KeyHandoverItem) => {
    setEditingKeyId(k.id);
    setKeyType(k.keyType);
    setKeyHouseType(k.houseType);
    setKeyCount(k.count);
    setKeyNotes(k.notes || '');
    setKeyHandedOver(k.handedOver);
    setKeyHandedOverDate(k.handedOverDate || '');
    setKeyHandedOverBy(k.handedOverBy || '');
    setKeyReceivedBy(k.receivedBy || '');
    setIsKeyFormOpen(true);
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyType.trim()) return;
    setLoading(true);
    try {
      const data: Partial<KeyHandoverItem> = {
        keyType: keyType.trim(),
        houseType: keyHouseType,
        count: Number(keyCount) || 1,
        notes: keyNotes.trim() || undefined,
        handedOver: keyHandedOver,
        handedOverDate: keyHandedOverDate || undefined,
        handedOverBy: keyHandedOverBy.trim() || undefined,
        receivedBy: keyReceivedBy.trim() || undefined,
      };

      if (editingKeyId) {
        await onUpdateKey(editingKeyId, data);
      } else {
        await onAddKey(data);
      }
      setIsKeyFormOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Doc handlers
  const handleOpenAddDoc = () => {
    setEditingDocId(null);
    setDocTitle('');
    setDocCategory('CONTRACT');
    setDocStatus('AANWEZIG');
    setDocFileNumber('');
    setDocNotes('');
    setDocDueDate('');
    setIsDocFormOpen(true);
  };

  const handleOpenEditDoc = (d: DocumentItem) => {
    setEditingDocId(d.id);
    setDocTitle(d.title);
    setDocCategory(d.category);
    setDocStatus(d.status);
    setDocFileNumber(d.policyOrFileNumber || '');
    setDocNotes(d.notes || '');
    setDocDueDate(d.dueDate || '');
    setIsDocFormOpen(true);
  };

  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim()) return;
    setLoading(true);
    try {
      const data: Partial<DocumentItem> = {
        title: docTitle.trim(),
        category: docCategory,
        status: docStatus,
        policyOrFileNumber: docFileNumber.trim() || undefined,
        notes: docNotes.trim() || undefined,
        dueDate: docDueDate || undefined,
      };

      if (editingDocId) {
        await onUpdateDoc(editingDocId, data);
      } else {
        await onAddDoc(data);
      }
      setIsDocFormOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Oplevering & Documenten
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              Sleuteloverdracht & Documentenbewaarplaats
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('keys')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'keys'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Sleuteloverdracht ({keyHandovers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'docs'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Belangrijke Documenten ({documents.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh] space-y-4">
          {activeTab === 'keys' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registreer het aantal sleutels per buitendeur, poort of kast bij vertrek en intrek.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddKey}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sleutelset Toevoegen</span>
                </button>
              </div>

              {/* Keys list grouped by house */}
              <div className="space-y-3">
                {keyHandovers.map((k) => (
                  <div
                    key={k.id}
                    className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      k.handedOver
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                        : 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          k.houseType === 'OLD'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200'
                            : 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
                        }`}>
                          {k.houseType === 'OLD' ? 'Oud Huis (Inleveren)' : 'Nieuw Huis (Ontvangen)'}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {k.keyType} ({k.count} {k.count === 1 ? 'sleutel' : 'sleutels'})
                        </h4>
                      </div>

                      {k.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {k.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 flex-wrap">
                        {k.handedOverBy && (
                          <span>Overgedragen door: <strong>{k.handedOverBy}</strong></span>
                        )}
                        {k.receivedBy && (
                          <span>Ontvangen door: <strong>{k.receivedBy}</strong></span>
                        )}
                        {k.handedOverDate && (
                          <span>Datum: <strong>{k.handedOverDate}</strong></span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => onUpdateKey(k.id, { handedOver: !k.handedOver, handedOverDate: !k.handedOver ? new Date().toISOString().slice(0, 10) : undefined })}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                          k.handedOver
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{k.handedOver ? 'Overgedragen' : 'Nog Overdragen'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEditKey(k)}
                        className="p-1 text-slate-400 hover:text-blue-600"
                        title="Bewerken"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteKey(k.id)}
                        className="p-1 text-slate-400 hover:text-red-500"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Centrale bewaarplaats voor akten, plaatsbeschrijvingen, keuringen en polissen.
                </p>
                <button
                  type="button"
                  onClick={handleOpenAddDoc}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Document Toevoegen</span>
                </button>
              </div>

              {/* Documents list */}
              <div className="space-y-3">
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                          {d.category}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {d.title}
                        </h4>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                          d.status === 'AANWEZIG'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                            : d.status === 'TE_REGELEN'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                        }`}>
                          {d.status}
                        </span>
                      </div>

                      {d.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                          {d.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5 flex-wrap">
                        {d.policyOrFileNumber && (
                          <span className="font-mono">Polis/Dossier: <strong>{d.policyOrFileNumber}</strong></span>
                        )}
                        {d.dueDate && (
                          <span>Uiterlijk: {d.dueDate}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleOpenEditDoc(d)}
                        className="p-1.5 text-slate-400 hover:text-blue-600"
                        title="Bewerken"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteDoc(d.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500"
                        title="Verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl cursor-pointer"
          >
            Sluiten
          </button>
        </div>
      </div>

      {/* Sub-form: Add/Edit Key */}
      {isKeyFormOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-3">
          <form onSubmit={handleSaveKey} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-3.5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {editingKeyId ? 'Sleutelset Bewerken' : 'Nieuwe Sleutelset Toevoegen'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Type Sleutel:
              </label>
              <input
                type="text"
                required
                value={keyType}
                onChange={(e) => setKeyType(e.target.value)}
                placeholder="bv. Voordeur, Achterdeur, Garagepoort..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Woning:
                </label>
                <select
                  value={keyHouseType}
                  onChange={(e) => setKeyHouseType(e.target.value as HouseType)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="OLD">Oud Huis (Inleveren)</option>
                  <option value="NEW">Nieuw Huis (Ontvangen)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Aantal sleutels:
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={keyCount}
                  onChange={(e) => setKeyCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Overgedragen door:
                </label>
                <input
                  type="text"
                  value={keyHandedOverBy}
                  onChange={(e) => setKeyHandedOverBy(e.target.value)}
                  placeholder="Naam"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Ontvangen door:
                </label>
                <input
                  type="text"
                  value={keyReceivedBy}
                  onChange={(e) => setKeyReceivedBy(e.target.value)}
                  placeholder="Naam"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notities / Nummering:
              </label>
              <textarea
                rows={2}
                value={keyNotes}
                onChange={(e) => setKeyNotes(e.target.value)}
                placeholder="bv. Inclusief veiligheidscertificaat van het slot"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsKeyFormOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
              >
                Opslaan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-form: Add/Edit Doc */}
      {isDocFormOpen && (
        <div className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-3">
          <form onSubmit={handleSaveDoc} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-3.5 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {editingDocId ? 'Document Bewerken' : 'Nieuw Document Toevoegen'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Titel van het document:
              </label>
              <input
                type="text"
                required
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="bv. Huurovereenkomst, EPC keuring..."
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categorie:
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="CONTRACT">Contract</option>
                  <option value="KEURING">Keuring / Attest</option>
                  <option value="VERZEKERING">Verzekering</option>
                  <option value="OVERIG">Overig</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status:
                </label>
                <select
                  value={docStatus}
                  onChange={(e) => setDocStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                >
                  <option value="AANWEZIG">Aanwezig</option>
                  <option value="TE_REGELEN">Te Regelen</option>
                  <option value="VERLOPEN">Verlopen</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Polis- of Dossiernummer:
              </label>
              <input
                type="text"
                value={docFileNumber}
                onChange={(e) => setDocFileNumber(e.target.value)}
                placeholder="bv. POL-123456"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Notities:
              </label>
              <textarea
                rows={2}
                value={docNotes}
                onChange={(e) => setDocNotes(e.target.value)}
                placeholder="bv. Origineel bewaard in blauwe map"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDocFormOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl"
              >
                Opslaan
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
