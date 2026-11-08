import React, { useState } from 'react';
import { X, UserPlus, Users, Shield, Trash2, Edit2, Check, AlertCircle, Key } from 'lucide-react';
import { User, UserRole } from '../types/index.ts';

interface UserManagerModalProps {
  users: User[];
  currentUserId: string;
  onCreateUser: (data: { name: string; email: string; password?: string; role: UserRole }) => Promise<void>;
  onUpdateUser: (id: string, data: { name?: string; email?: string; password?: string; role?: UserRole }) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onClose: () => void;
}

export const UserManagerModal: React.FC<UserManagerModalProps> = ({
  users,
  currentUserId,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onClose,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('guest');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('guest');
  const [editPassword, setEditPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await onCreateUser({
        name: name.trim(),
        email: email.trim(),
        password: password ? password.trim() : undefined,
        role,
      });
      setName('');
      setEmail('');
      setPassword('');
      setRole('guest');
      setShowAddForm(false);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await onUpdateUser(id, {
        name: editName.trim(),
        role: editRole,
        password: editPassword.trim() ? editPassword.trim() : undefined,
      });
      setEditingUserId(null);
      setEditPassword('');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 no-print overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Gebruikersbeheer (Accounts & Rollen)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Voeg beheerders of verhuishulp accounts toe en wijzig rechten
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

        {error && (
          <div className="mx-4 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Actieve Accounts ({users.length})
            </h4>
            {!showAddForm && (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Nieuwe Gebruiker</span>
              </button>
            )}
          </div>

          {/* Add User Form */}
          {showAddForm && (
            <form onSubmit={handleCreate} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Nieuwe Gebruiker Toevoegen
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Annuleren
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Naam:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="bijv. Sarah De Vries"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    E-mailadres:
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@verhuizing.local"
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Rol:
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="guest">Gast / Helper (Alleen scannen & status)</option>
                    <option value="admin">Beheerder (Admin - Volledige rechten)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Wachtwoord:
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={role === 'admin' ? 'Verplicht voor admin' : 'Optioneel voor gast'}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Opslaan & Aanmaken
                </button>
              </div>
            </form>
          )}

          {/* User List */}
          <div className="space-y-2">
            {users.map((user) => {
              const isCurrent = user.id === currentUserId;
              const isAdmin = user.role === 'admin';

              return (
                <div
                  key={user.id}
                  className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs flex items-center justify-between shadow-xs"
                >
                  {editingUserId === user.id ? (
                    <div className="flex-1 space-y-2 mr-3">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border rounded"
                          placeholder="Naam"
                        />
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as UserRole)}
                          className="px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border rounded"
                        >
                          <option value="guest">Gast / Helper</option>
                          <option value="admin">Beheerder</option>
                        </select>
                      </div>
                      <input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Nieuw wachtwoord (leeg laten om te behouden)"
                        className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-900 border rounded"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{user.name}</span>
                        {isAdmin ? (
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" />
                            Admin
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                            Gast / Helper
                          </span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] text-emerald-600 font-semibold">(U bent dit)</span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                        {user.email}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    {editingUserId === user.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(user.id)}
                          className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="p-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingUserId(user.id);
                            setEditName(user.name);
                            setEditRole(user.role);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                          title="Account bewerken of wachtwoord wijzigen"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Gebruiker "${user.name}" (${user.email}) verwijderen?`)) {
                              onDeleteUser(user.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded"
                          title="Account verwijderen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
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
