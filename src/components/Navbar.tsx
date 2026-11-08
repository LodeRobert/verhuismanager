import React, { useState } from 'react';
import {
  Package,
  Camera,
  Layers,
  Users,
  Printer,
  LogOut,
  Shield,
  Home,
  Plus,
  Gauge,
  Clock,
  CheckSquare,
  Sun,
  Moon,
  Menu,
  X,
  Building2,
  Key,
  FileText,
  ChevronRight,
  ChevronDown,
  Check,
  Globe,
} from 'lucide-react';
import { User, UserRole, AppPhase } from '../types/index.ts';

interface NavbarProps {
  currentUser: User;
  currentPhase: AppPhase;
  onSelectPhase: (phase: AppPhase) => void;
  activeTab: 'dashboard' | 'rooms' | 'tasks' | 'address-changes';
  setActiveTab: (tab: 'dashboard' | 'rooms' | 'tasks' | 'address-changes') => void;
  uncompletedTasksCount?: number;
  pendingAddressChangesCount?: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenScanner: () => void;
  onOpenPrintModal: () => void;
  onOpenLocationManager: () => void;
  onOpenUserManager: () => void;
  onOpenMeterReadings: () => void;
  onOpenMoveDayTimeline: () => void;
  onOpenHandoverAndDocs: (initialTab?: 'keys' | 'docs') => void;
  onAddNewBox: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentPhase,
  onSelectPhase,
  activeTab,
  setActiveTab,
  uncompletedTasksCount = 0,
  pendingAddressChangesCount = 0,
  theme,
  onToggleTheme,
  onOpenScanner,
  onOpenPrintModal,
  onOpenLocationManager,
  onOpenUserManager,
  onOpenMeterReadings,
  onOpenMoveDayTimeline,
  onOpenHandoverAndDocs,
  onAddNewBox,
  onLogout,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSelectPhaseAndNavigate = (phase: AppPhase) => {
    onSelectPhase(phase);
    if (phase === 'VOORBEREIDING') {
      setActiveTab('dashboard');
    } else if (phase === 'VERHUIS') {
      setActiveTab('dashboard');
    } else if (phase === 'LATER') {
      setActiveTab('rooms');
    }
    setIsMenuOpen(false);
  };

  const handleActionAndCloseMenu = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  const phaseNames: Record<AppPhase, string> = {
    VOORBEREIDING: 'Voorbereiding',
    VERHUIS: 'De Verhuis',
    LATER: 'Later & Nazorg',
  };

  const phaseColors: Record<AppPhase, { text: string; bg: string; dot: string; border: string }> = {
    VOORBEREIDING: {
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/60',
      dot: 'bg-blue-500',
      border: 'border-blue-200 dark:border-blue-800',
    },
    VERHUIS: {
      text: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/60',
      dot: 'bg-indigo-500',
      border: 'border-indigo-200 dark:border-indigo-800',
    },
    LATER: {
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/60',
      dot: 'bg-emerald-500',
      border: 'border-emerald-200 dark:border-emerald-800',
    },
  };

  return (
    <>
      {/* TOP HEADER BAR (Strictly overflow-x-hidden, fits any mobile screen without horizontal scroll) */}
      <header className="no-print sticky top-0 z-40 w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors overflow-x-hidden">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
          
          {/* ZONE 1: Left - Logo + Active Phase indicator (no text title on phone!) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            {/* Logo Icon */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('dashboard');
              }}
              className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white shadow-md shadow-blue-600/20 cursor-pointer shrink-0"
              title="Naar Totaaloverzicht"
              aria-label="VerhuisManager Home"
            >
              <Package className="w-5 h-5" />
            </button>

            {/* Desktop Brand Title */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                VerhuisManager
              </span>
            </div>

            {/* Active Phase Badge (Visible on all screens: shows which phase is currently loaded) */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer shrink-0 ${phaseColors[currentPhase].bg} ${phaseColors[currentPhase].text} ${phaseColors[currentPhase].border}`}
              title="Wissel van fase in het hamburgermenu"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${phaseColors[currentPhase].dot}`} />
              <span className="whitespace-nowrap">
                {phaseNames[currentPhase]}
              </span>
              <ChevronDown className="w-3 h-3 opacity-70 shrink-0" />
            </button>
          </div>

          {/* ZONE 2: Center - Desktop Navigation Links ONLY FOR THE ACTIVE PHASE (or Helper Nav) */}
          {!isAdmin ? (
            <nav className="hidden lg:flex items-center gap-2 xl:gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'dashboard'
                    ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Dozen & Locaties</span>
              </button>
              <button
                type="button"
                onClick={onOpenMoveDayTimeline}
                className="px-3 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Draaiboek Verhuisdag</span>
              </button>
            </nav>
          ) : (
            <nav className="hidden lg:flex items-center gap-2 xl:gap-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
              {/* FASE 1: VOORBEREIDING TABS */}
              {currentPhase === 'VOORBEREIDING' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Dozen & Inpakken
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('rooms')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'rooms'
                      ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Kamers Oud Huis
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'tasks'
                      ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-900'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                  <span>Algemene Taken</span>
                  {uncompletedTasksCount > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200">
                      {uncompletedTasksCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('address-changes')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'address-changes'
                      ? 'text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-900'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-purple-500" />
                  <span>Adreswijzigingen</span>
                  {pendingAddressChangesCount > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200">
                      {pendingAddressChangesCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenHandoverAndDocs('docs')}
                  className="px-2.5 py-1 rounded-lg hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Documenten</span>
                </button>
              </>
            )}

            {/* FASE 2: VERHUIS TABS */}
            {currentPhase === 'VERHUIS' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Dozenstatus
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('rooms')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'rooms'
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-900'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Nieuw Huis (Bestemming)
                </button>
                <button
                  type="button"
                  onClick={onOpenMoveDayTimeline}
                  className="px-2.5 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Draaiboek</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenPrintModal}
                  className="px-2.5 py-1 rounded-lg hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Dymo Labels</span>
                </button>
              </>
            )}

            {/* FASE 3: LATER TABS */}
            {currentPhase === 'LATER' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('rooms')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'rooms'
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Kamers (Uitpakken & Ophangen)
                </button>
                <button
                  type="button"
                  onClick={onOpenMeterReadings}
                  className="px-2.5 py-1 rounded-lg hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <Gauge className="w-3.5 h-3.5 text-amber-500" />
                  <span>Meterstanden</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenHandoverAndDocs('keys')}
                  className="px-2.5 py-1 rounded-lg hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Sleuteloverdracht</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-900'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Dozenarchief
                </button>
              </>
            )}
          </nav>
        )}

          {/* ZONE 3: Right - Direct Scan Button + Theme + Hamburger Menu Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Direct Scan Button (as requested by user on smartphone!) */}
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap min-h-[36px] shrink-0"
              title="Doos of meubel QR scannen"
            >
              <Camera className="w-4 h-4" />
              <span>Scan</span>
            </button>

            {/* Dark / Light Mode Switch */}
            <button
              type="button"
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
              title={theme === 'dark' ? 'Schakel naar lichte stand' : 'Schakel naar donkere stand'}
              aria-label="Thema schakelen"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Hamburger Menu Toggle (Opens drawer with Phase Switcher & all modules) */}
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-800 dark:text-slate-200 transition-colors cursor-pointer shrink-0 relative"
              title="Menu & Fasen openen"
              aria-label="Navigatiemenu en fasen openen"
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              {!isMenuOpen && (uncompletedTasksCount > 0 || pendingAddressChangesCount > 0) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* User Chip & Logout (Visible on large desktop) */}
            <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[100px]">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium capitalize">
                  {isAdmin ? 'Beheerder' : 'Verhuishulp'}
                </span>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Uitloggen"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* OFF-CANVAS SLIDE-OUT MENU DRAWER WITH COMPLETE PHASE SWITCHER */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end no-print">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <aside className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  📦
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    VerhuisManager Menu
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Kies een verhuisfase of open een module
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-4 space-y-6 flex-1">
              {!isAdmin ? (
                <div className="space-y-4">
                  <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900/60">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                      <Shield className="w-4 h-4" />
                      <span>Verhuishulp Modus</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      U bent ingelogd als verhuishulp. U kunt direct QR-codes scannen, doosstatussen/locaties bijwerken en het verhuisdag-draaiboek bekijken.
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleActionAndCloseMenu(onOpenScanner)}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md shadow-blue-600/20"
                    >
                      <div className="flex items-center gap-3">
                        <Camera className="w-4 h-4" />
                        <span>Direct QR-Code Scannen</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleActionAndCloseMenu(() => setActiveTab('dashboard'))}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Dozen & Locaties Bijwerken</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleActionAndCloseMenu(onOpenMoveDayTimeline)}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white">Draaiboek Verhuisdag</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* PRIMARY SECTION: KIES DE VERHUISFASE */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Kies Verhuisfase
                      </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Past boven- & onderbalk aan
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {/* Fase 1: Voorbereiding */}
                  <button
                    type="button"
                    onClick={() => handleSelectPhaseAndNavigate('VOORBEREIDING')}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      currentPhase === 'VOORBEREIDING'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 ring-2 ring-blue-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        1
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Voorbereiding</span>
                          {currentPhase === 'VOORBEREIDING' && (
                            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 rounded">
                              Actief
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Inpakken, kamers oud huis, taken, adressen & documenten
                        </div>
                      </div>
                    </div>
                    {currentPhase === 'VOORBEREIDING' ? (
                      <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {/* Fase 2: De Verhuis */}
                  <button
                    type="button"
                    onClick={() => handleSelectPhaseAndNavigate('VERHUIS')}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      currentPhase === 'VERHUIS'
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        2
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>De Verhuis</span>
                          {currentPhase === 'VERHUIS' && (
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/60 px-1.5 py-0.2 rounded">
                              Actief
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Dozenstatus, nieuw huis bestemming, draaiboek & labels
                        </div>
                      </div>
                    </div>
                    {currentPhase === 'VERHUIS' ? (
                      <Check className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {/* Fase 3: Later & Nazorg */}
                  <button
                    type="button"
                    onClick={() => handleSelectPhaseAndNavigate('LATER')}
                    className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      currentPhase === 'LATER'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        3
                      </div>
                      <div>
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Later & Nazorg</span>
                          {currentPhase === 'LATER' && (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded">
                              Actief
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Kamers uitpakken & ophangen, meterstanden & sleutels
                        </div>
                      </div>
                    </div>
                    {currentPhase === 'LATER' ? (
                      <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                </div>
              </div>

              {/* MODULE OVERZICHT VOOR DE ACTIEVE FASE */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Onderdelen van {phaseNames[currentPhase]}
                </span>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-2 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  {currentPhase === 'VOORBEREIDING' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(() => setActiveTab('dashboard'))}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Dozen & Spullen Inpakken</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(() => setActiveTab('rooms'))}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Home className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Kamers Oud Huis (Leegmaken)</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(() => setActiveTab('tasks'))}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <CheckSquare className="w-4 h-4 text-emerald-500" />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">Algemene Verhuistaken</span>
                            {uncompletedTasksCount > 0 && (
                              <span className="text-[10px] font-mono px-1.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">
                                {uncompletedTasksCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(() => setActiveTab('address-changes'))}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="w-4 h-4 text-purple-500" />
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">Adreswijzigingen Bedrijven</span>
                            {pendingAddressChangesCount > 0 && (
                              <span className="text-[10px] font-mono px-1.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold">
                                {pendingAddressChangesCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(() => onOpenHandoverAndDocs('docs'))}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Belangrijke Documenten</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </>
                  )}

                  {currentPhase === 'VERHUIS' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(onOpenScanner)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Camera className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">QR Sticker Direct Scannen</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(() => setActiveTab('dashboard'))}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Dozenstatus (Onderweg / Geleverd)</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(() => setActiveTab('rooms'))}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Home className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Nieuw Huis (Kamers & Garage)</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(onOpenMoveDayTimeline)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Draaiboek & Tijdlijn</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(onOpenPrintModal)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Printer className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Dymo Labels Afdrukken</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </>
                  )}

                  {currentPhase === 'LATER' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(() => setActiveTab('rooms'))}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Layers className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Kamers (Uitpakken & Ophangen)</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(onOpenMeterReadings)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Gauge className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Meterstanden Opnemen</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(() => onOpenHandoverAndDocs('keys'))}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Key className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Sleuteloverdracht & Oplevering</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleActionAndCloseMenu(() => setActiveTab('dashboard'))}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">Dozenarchief (Uitgepakt)</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* BEHEER & CONFIGURATIE (Admin only) */}
              {isAdmin && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Beheer & Configuratie
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleActionAndCloseMenu(onOpenLocationManager)}
                      className="p-2.5 text-left rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-2"
                    >
                      <Home className="w-4 h-4 text-blue-500" />
                      <span>Locaties</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleActionAndCloseMenu(onOpenUserManager)}
                      className="p-2.5 text-left rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-2"
                    >
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span>Gebruikers</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleActionAndCloseMenu(onOpenPrintModal)}
                      className="p-2.5 text-left rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer flex items-center gap-2 col-span-2"
                    >
                      <Globe className="w-4 h-4 text-purple-500" />
                      <span>Dymo & QR-Domein Instellingen</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300">
                  {currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 capitalize">
                    {isAdmin ? 'Beheerder' : 'Verhuishulp'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleActionAndCloseMenu(onLogout)}
                className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Afmelden</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <div className="lg:hidden no-print fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe">
        {!isAdmin ? (
          <div className="grid grid-cols-4 items-center h-16 px-2">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Dozen</span>
            </button>

            {/* Prominent Center Scanner */}
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex flex-col items-center justify-center min-h-[44px] text-blue-600 dark:text-blue-400 cursor-pointer"
            >
              <div className="w-11 h-11 -mt-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-0.5">Scannen</span>
            </button>

            <button
              type="button"
              onClick={onOpenMoveDayTimeline}
              className="flex flex-col items-center justify-center min-h-[44px] text-slate-500 dark:text-slate-400 cursor-pointer hover:text-emerald-600"
            >
              <Clock className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Draaiboek</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex flex-col items-center justify-center min-h-[44px] text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Menu</span>
            </button>
          </div>
        ) : (
          <>
            {/* FASE 1: VOORBEREIDING BOTTOM BAR */}
            {currentPhase === 'VOORBEREIDING' && (
          <div className="grid grid-cols-5 items-center h-16 px-1">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Dozen</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rooms')}
              className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                activeTab === 'rooms' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Oud Huis</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer relative ${
                activeTab === 'tasks' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Taken</span>
              {uncompletedTasksCount > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 bg-blue-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {uncompletedTasksCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('address-changes')}
              className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer relative ${
                activeTab === 'address-changes' ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Adressen</span>
              {pendingAddressChangesCount > 0 && (
                <span className="absolute top-1 right-2 w-4 h-4 bg-purple-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {pendingAddressChangesCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex flex-col items-center justify-center min-h-[44px] text-slate-500 dark:text-slate-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Fasen</span>
            </button>
          </div>
        )}

        {/* FASE 2: DE VERHUIS BOTTOM BAR */}
        {currentPhase === 'VERHUIS' && (
          <div className="grid grid-cols-5 items-center h-16 px-1">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                activeTab === 'dashboard' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Status</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rooms')}
              className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                activeTab === 'rooms' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Nieuw Huis</span>
            </button>

            {/* Prominent Center Scanner */}
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex flex-col items-center justify-center min-h-[44px] text-blue-600 dark:text-blue-400 cursor-pointer"
            >
              <div className="w-11 h-11 -mt-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-0.5">Scannen</span>
            </button>

            <button
              type="button"
              onClick={onOpenMoveDayTimeline}
              className="flex flex-col items-center justify-center min-h-[44px] text-slate-500 dark:text-slate-400 cursor-pointer hover:text-emerald-600"
            >
              <Clock className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Draaiboek</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex flex-col items-center justify-center min-h-[44px] text-slate-500 dark:text-slate-400 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Fasen</span>
            </button>
          </div>
        )}

        {/* FASE 3: LATER & NAZORG BOTTOM BAR */}
        {currentPhase === 'LATER' && (
          <div className="grid grid-cols-5 items-center h-16 px-1">
            <button
              type="button"
              onClick={() => setActiveTab('rooms')}
              className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                activeTab === 'rooms' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Layers className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Uitpakken</span>
            </button>

            <button
              type="button"
              onClick={onOpenMeterReadings}
              className="flex flex-col items-center justify-center min-h-[44px] text-slate-500 dark:text-slate-400 cursor-pointer hover:text-amber-500"
            >
              <Gauge className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Meterstanden</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenHandoverAndDocs('keys')}
              className="flex flex-col items-center justify-center min-h-[44px] text-slate-500 dark:text-slate-400 cursor-pointer hover:text-indigo-500"
            >
              <Key className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Sleutels</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center min-h-[44px] cursor-pointer ${
                activeTab === 'dashboard' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Archief</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="flex flex-col items-center justify-center min-h-[44px] text-slate-500 dark:text-slate-400 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-1">Fasen</span>
            </button>
          </div>
        )}
      </>
    )}
  </div>
    </>
  );
};
