import React, { useState } from 'react';
import { Package, Shield, Users, ArrowRight, CheckCircle2, Info, Lock } from 'lucide-react';
import { api } from '../services/api.ts';
import { User } from '../types/index.ts';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
  isFirstRun: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, isFirstRun }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.loginAdmin(email, password);
      onLoginSuccess(res.user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Inloggen mislukt. Controleer gegevens.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.loginGuest(guestName || 'Verhuishulp (Gast)');
      onLoginSuccess(res.user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Gast inloggen mislukt.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillDefaultAdmin = () => {
    setEmail('admin@verhuizing.local');
    setPassword('admin123');
    setIsAdminMode(true);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">VerhuisManager</h1>
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded-md">
                v2.2
              </span>
            </div>
            <p className="text-xs text-blue-300 font-medium">Dozen, Labels, Oud/Nieuw Huis & Taken</p>
          </div>
        </div>

        {/* First run helper notice */}
        {isFirstRun && (
          <div className="mt-4 mb-2 p-3.5 bg-blue-950/80 border border-blue-500/30 rounded-xl text-xs text-blue-200">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-blue-100 mb-1">Eerste opstart gedetecteerd</p>
                <p className="text-blue-300/90 leading-relaxed mb-2">
                  Er is automatisch een beheerder aangemaakt:<br />
                  <span className="font-mono text-white bg-blue-900/60 px-1.5 py-0.5 rounded">admin@verhuizing.local</span> met wachtwoord <span className="font-mono text-white bg-blue-900/60 px-1.5 py-0.5 rounded">admin123</span>.
                </p>
                <button
                  type="button"
                  onClick={fillDefaultAdmin}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Vul direct in voor Admin &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs">
              {error}
            </div>
          )}

          {!isAdminMode ? (
            /* Main Choice Screen with Guest (Helper) Priority */
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white text-center">Welkom bij de Verhuizing</h2>
                <p className="text-xs text-slate-400 text-center mt-1">
                  Kies hoe u vandaag wilt inloggen om dozen te bekijken of te scannen.
                </p>
              </div>

              {/* Gast / Helper Knop (Prominent) */}
              <div className="space-y-3 p-4 rounded-xl bg-gradient-to-br from-blue-950/60 to-slate-900/80 border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Gast / Helper Inloggen</h3>
                    <p className="text-xs text-slate-400">Geen wachtwoord vereist. Direct dozen scannen en status bijwerken.</p>
                  </div>
                </div>

                <div className="pt-2">
                  <label htmlFor="guestName" className="block text-xs font-medium text-slate-300 mb-1">
                    Uw naam (optioneel voor identificatie):
                  </label>
                  <input
                    id="guestName"
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="bijv. Thomas of Familie Jansen"
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleGuestLogin}
                  disabled={loading}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[48px]"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Direct Doorgaan als Gast / Helper</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </button>
              </div>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-slate-800 text-slate-400">OF VOOR BEHEER</span>
                </div>
              </div>

              {/* Admin Button Switcher */}
              <button
                type="button"
                onClick={() => setIsAdminMode(true)}
                className="w-full py-2.5 px-4 bg-slate-700/60 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-xs rounded-xl border border-slate-600 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
              >
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Admin Inloggen (Volledig Beheer & Labels)</span>
              </button>
            </div>
          ) : (
            /* Admin Login Form */
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-400" />
                  <h2 className="text-base font-bold text-white">Beheerder Inloggen</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdminMode(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  &larr; Terug naar Gast
                </button>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    E-mailadres of Gebruikersnaam
                  </label>
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin of admin@verhuizing.local"
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Wachtwoord
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 text-sm bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[44px]"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{loading ? 'Bezig met inloggen...' : 'Inloggen als Admin'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
