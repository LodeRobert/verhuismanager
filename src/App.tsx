import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Layers,
  MapPin,
  Users,
  Printer,
  Camera,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { api, getStoredUser, clearSession } from './services/api.ts';
import {
  AppState,
  Box,
  Floor,
  Room,
  User,
  DymoSettings,
  BoxStatus,
  TaskCategory,
  MeterReading,
  MoveDayTask,
  GeneralTask,
  GeneralTaskStatus,
  HouseType,
  AppPhase,
  AddressChangeItem,
  AddressChangeStatus,
  KeyHandoverItem,
  DocumentItem,
} from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { LoginView } from './components/LoginView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { RoomsOverviewView } from './components/RoomsOverviewView.tsx';
import { GeneralTasksView } from './components/GeneralTasksView.tsx';
import { AddressChangesView } from './components/AddressChangesView.tsx';
import { HandoverAndDocsModal } from './components/HandoverAndDocsModal.tsx';
import { BoxDetailModal } from './components/BoxDetailModal.tsx';
import { BoxFormModal } from './components/BoxFormModal.tsx';
import { DymoPrintModal } from './components/DymoPrintModal.tsx';
import { LocationManagerModal } from './components/LocationManagerModal.tsx';
import { UserManagerModal } from './components/UserManagerModal.tsx';
import { ScannerModal } from './components/ScannerModal.tsx';
import { RoomTasksModal } from './components/RoomTasksModal.tsx';
import { MeterReadingsModal } from './components/MeterReadingsModal.tsx';
import { MoveDayTimelineModal } from './components/MoveDayTimelineModal.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [appData, setAppData] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState<AppPhase>('VOORBEREIDING');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rooms' | 'tasks' | 'address-changes'>('dashboard');
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Theme: light / dark mode with memory in localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('verhuis_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('verhuis_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Modals
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [editingBox, setEditingBox] = useState<Box | null>(null);
  const [isAddingBox, setIsAddingBox] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [boxesToPrint, setBoxesToPrint] = useState<Box[]>([]);
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false);
  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false);
  const [selectedRoomForTasks, setSelectedRoomForTasks] = useState<Room | null>(null);
  const [isMeterReadingsOpen, setIsMeterReadingsOpen] = useState(false);
  const [isMoveDayTimelineOpen, setIsMoveDayTimelineOpen] = useState(false);
  const [isHandoverDocsOpen, setIsHandoverDocsOpen] = useState(false);
  const [handoverInitialTab, setHandoverInitialTab] = useState<'keys' | 'docs'>('keys');

  const [successTimer, setSuccessTimer] = useState<any>(null);

  const showToast = (message: string, isError = false) => {
    if (isError) {
      setErrorToast(message);
      setTimeout(() => setErrorToast(null), 5000);
    } else {
      setSuccessToast(message);
      if (successTimer) clearTimeout(successTimer);
      const timer = setTimeout(() => setSuccessToast(null), 15000);
      setSuccessTimer(timer);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAppData();
      setAppData(data);
    } catch (err: unknown) {
      console.error('Fout bij ophalen van data:', err);
      if (err instanceof Error && err.message.includes('401')) {
        clearSession();
        setCurrentUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData, currentUser]);

  // Handle URL hash changes (e.g. from smartphone scanning the Dymo QR code: /#box=BOX-002)
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('box=') && appData?.boxes) {
        const rawParam = hash.split('box=')[1];
        const boxId = decodeURIComponent(rawParam.split('&')[0]).trim();
        const found = appData.boxes.find(
          (b) => b.id.toLowerCase() === boxId.toLowerCase() || String(b.boxNumber) === boxId
        );
        if (found) {
          setSelectedBox(found);
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [appData]);

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setAppData(null);
    showToast('U bent uitgelogd.');
  };

  // --- Box Handlers ---
  const handleUpdateBoxStatus = async (boxId: string, status: BoxStatus, currentRoomId?: string) => {
    try {
      const updated = await api.updateBox(boxId, { status, currentRoomId });
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          boxes: prev.boxes.map((b) => (b.id === updated.id ? updated : b)),
        };
      });
      setSelectedBox(updated);
      showToast(`Status van doos #${updated.boxNumber} succesvol bijgewerkt.`);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleSaveBox = async (boxData: Partial<Box>) => {
    try {
      if (editingBox) {
        const updated = await api.updateBox(editingBox.id, boxData);
        setAppData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            boxes: prev.boxes.map((b) => (b.id === updated.id ? updated : b)),
          };
        });
        showToast(`Doos #${updated.boxNumber} bijgewerkt!`);
      } else {
        const created = await api.createBox(boxData);
        setAppData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            boxes: [...prev.boxes, created],
          };
        });
        showToast(`Doos #${created.boxNumber} (${created.id}) aangemaakt!`);
      }
      setIsAddingBox(false);
      setEditingBox(null);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
      throw err;
    }
  };

  const handleDeleteBox = async (boxId: string) => {
    try {
      await api.deleteBox(boxId);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          boxes: prev.boxes.filter((b) => b.id !== boxId),
        };
      });
      setSelectedBox(null);
      showToast('Doos succesvol verwijderd.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  // --- Settings Handlers ---
  const handleSaveSettings = async (settings: DymoSettings) => {
    try {
      const updated = await api.updateSettings(settings);
      setAppData((prev) => (prev ? { ...prev, settings: updated } : null));
      showToast('Dymo formaat-instellingen opgeslagen.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  // --- Location Management Handlers ---
  const handleCreateFloor = async (name: string, houseType: HouseType = 'NEW') => {
    try {
      const created = await api.createFloor(name, houseType);
      setAppData((prev) => (prev ? { ...prev, floors: [...prev.floors, created] } : null));
      showToast(`Verdieping "${name}" aangemaakt.`);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleUpdateFloor = async (id: string, name: string) => {
    try {
      const updated = await api.updateFloor(id, name);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          floors: prev.floors.map((f) => (f.id === id ? updated : f)),
        };
      });
      showToast('Verdieping bijgewerkt.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleDeleteFloor = async (id: string) => {
    try {
      await api.deleteFloor(id);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          floors: prev.floors.filter((f) => f.id !== id),
        };
      });
      showToast('Verdieping verwijderd.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleCreateRoom = async (data: {
    name: string;
    floorId: string;
    isDefaultFallback?: boolean;
    houseType: HouseType;
  }) => {
    try {
      const created = await api.createRoom(data);
      setAppData((prev) => (prev ? { ...prev, rooms: [...prev.rooms, created] } : null));
      showToast(`Kamer "${data.name}" aangemaakt.`);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleUpdateRoom = async (
    id: string,
    data: { name?: string; floorId?: string; isDefaultFallback?: boolean }
  ) => {
    try {
      const updated = await api.updateRoom(id, data);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          rooms: prev.rooms.map((r) => (r.id === id ? updated : r)),
        };
      });
      showToast('Kamer bijgewerkt.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      await api.deleteRoom(id);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          rooms: prev.rooms.filter((r) => r.id !== id),
        };
      });
      showToast('Kamer verwijderd.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  // --- User Management Handlers ---
  const handleCreateUser = async (userData: {
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'guest';
  }) => {
    try {
      const created = await api.createUser(userData);
      setAppData((prev) => (prev ? { ...prev, users: [...prev.users, created] } : null));
      showToast(`Gebruiker "${created.name}" aangemaakt.`);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleUpdateUser = async (
    id: string,
    userData: { name?: string; email?: string; password?: string; role?: 'admin' | 'guest' }
  ) => {
    try {
      const updated = await api.updateUser(id, userData);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          users: prev.users.map((u) => (u.id === id ? updated : u)),
        };
      });
      showToast('Gebruiker bijgewerkt.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteUser(id);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          users: prev.users.filter((u) => u.id !== id),
        };
      });
      showToast('Gebruiker verwijderd.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  // --- Room Readiness & Tasks Handlers ---
  const handleToggleRoomReadiness = async (roomId: string, isReady: boolean) => {
    try {
      const updatedRoom = await api.toggleRoomReadiness(roomId, isReady);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          rooms: prev.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
        };
      });
      setSelectedRoomForTasks((prev) => (prev && prev.id === roomId ? updatedRoom : prev));
      showToast(
        isReady
          ? `✓ Kamer "${updatedRoom.name}" gemarkeerd als 100% KLAAR voor verhuis!`
          : `Kamer "${updatedRoom.name}" weer als nog niet klaar ingesteld.`
      );
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleToggleRoomFlag = async (
    roomId: string,
    flags: { isReadyForMove?: boolean; needsClearingOut?: boolean; hasContainerparkItems?: boolean }
  ) => {
    try {
      const updatedRoom = await api.toggleRoomFlag(roomId, flags);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          rooms: prev.rooms.map((r) => (r.id === roomId ? updatedRoom : r)),
        };
      });
      setSelectedRoomForTasks((prev) => (prev && prev.id === roomId ? updatedRoom : prev));
      showToast('Kamerstatus bijgewerkt.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleAddTask = async (
    roomId: string,
    task: { text: string; category: TaskCategory }
  ) => {
    try {
      const createdTask = await api.createRoomTask(roomId, task);
      setAppData((prev) => {
        if (!prev) return null;
        const updatedRooms = prev.rooms.map((r) => {
          if (r.id === roomId) {
            const tasks = [...(r.tasks || []), createdTask];
            return { ...r, tasks };
          }
          return r;
        });
        return { ...prev, rooms: updatedRooms };
      });
      setSelectedRoomForTasks((prev) => {
        if (!prev || prev.id !== roomId) return prev;
        return { ...prev, tasks: [...(prev.tasks || []), createdTask] };
      });
      showToast('Werkpunt toegevoegd.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleUpdateRoomTask = async (
    roomId: string,
    taskId: string,
    task: { text?: string; category?: TaskCategory; completed?: boolean }
  ) => {
    try {
      const updatedTask = await api.updateRoomTask(roomId, taskId, task);
      setAppData((prev) => {
        if (!prev) return null;
        const updatedRooms = prev.rooms.map((r) => {
          if (r.id === roomId) {
            const tasks = (r.tasks || []).map((t) => (t.id === taskId ? updatedTask : t));
            return { ...r, tasks };
          }
          return r;
        });
        return { ...prev, rooms: updatedRooms };
      });
      setSelectedRoomForTasks((prev) => {
        if (!prev || prev.id !== roomId) return prev;
        return {
          ...prev,
          tasks: (prev.tasks || []).map((t) => (t.id === taskId ? updatedTask : t)),
        };
      });
      showToast('Werkpunt aangepast.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleToggleTask = async (roomId: string, taskId: string, completed: boolean) => {
    try {
      const updatedTask = await api.updateRoomTask(roomId, taskId, { completed });
      setAppData((prev) => {
        if (!prev) return null;
        const updatedRooms = prev.rooms.map((r) => {
          if (r.id === roomId) {
            const tasks = (r.tasks || []).map((t) => (t.id === taskId ? updatedTask : t));
            return { ...r, tasks };
          }
          return r;
        });
        return { ...prev, rooms: updatedRooms };
      });
      setSelectedRoomForTasks((prev) => {
        if (!prev || prev.id !== roomId) return prev;
        return {
          ...prev,
          tasks: (prev.tasks || []).map((t) => (t.id === taskId ? updatedTask : t)),
        };
      });
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleDeleteTask = async (roomId: string, taskId: string) => {
    try {
      await api.deleteRoomTask(roomId, taskId);
      setAppData((prev) => {
        if (!prev) return null;
        const updatedRooms = prev.rooms.map((r) => {
          if (r.id === roomId) {
            return { ...r, tasks: (r.tasks || []).filter((t) => t.id !== taskId) };
          }
          return r;
        });
        return { ...prev, rooms: updatedRooms };
      });
      setSelectedRoomForTasks((prev) => {
        if (!prev || prev.id !== roomId) return prev;
        return { ...prev, tasks: (prev.tasks || []).filter((t) => t.id !== taskId) };
      });
      showToast('Werkpunt verwijderd.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  // --- General Move Tasks Handlers ---
  const handleCreateGeneralTask = async (task: Partial<GeneralTask>) => {
    try {
      const created = await api.createGeneralTask(task);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          generalTasks: [...(prev.generalTasks || []), created],
        };
      });
      showToast('Algemene taak toegevoegd.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
      throw err;
    }
  };

  const handleUpdateGeneralTask = async (id: string, data: Partial<GeneralTask>) => {
    try {
      const updated = await api.updateGeneralTask(id, data);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          generalTasks: (prev.generalTasks || []).map((t) => (t.id === id ? updated : t)),
        };
      });
      showToast('Taak bijgewerkt.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
      throw err;
    }
  };

  const handleToggleGeneralTask = async (id: string, completed?: boolean, status?: GeneralTaskStatus) => {
    try {
      const updated = await api.toggleGeneralTask(id, completed, status);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          generalTasks: (prev.generalTasks || []).map((t) => (t.id === id ? updated : t)),
        };
      });
      if (status) {
        showToast(`Status van taak gewijzigd naar "${status}".`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleDeleteGeneralTask = async (id: string) => {
    try {
      await api.deleteGeneralTask(id);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          generalTasks: (prev.generalTasks || []).filter((t) => t.id !== id),
        };
      });
      showToast('Algemene taak verwijderd.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  // --- Meter Readings Handlers ---
  const handleSaveMeterReading = async (id: string, data: Partial<MeterReading>) => {
    try {
      const updated = await api.updateMeterReading(id, data);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          meterReadings: (prev.meterReadings || []).map((m) => (m.id === id ? updated : m)),
        };
      });
      showToast('Meterstand succesvol opgeslagen.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
      throw err;
    }
  };

  // --- Move Day Timeline Handlers ---
  const handleToggleMoveDayTask = async (id: string, completed: boolean) => {
    try {
      const updated = await api.updateMoveDayTask(id, { completed });
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          moveDayTasks: (prev.moveDayTasks || []).map((t) => (t.id === id ? updated : t)),
        };
      });
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleAddMoveDayTask = async (task: Partial<MoveDayTask>) => {
    try {
      const created = await api.createMoveDayTask(task);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          moveDayTasks: [...(prev.moveDayTasks || []), created],
        };
      });
      showToast('Draaiboek taak toegevoegd.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleUpdateMoveDayTask = async (id: string, task: Partial<MoveDayTask>) => {
    try {
      const updated = await api.updateMoveDayTask(id, task);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          moveDayTasks: (prev.moveDayTasks || []).map((t) => (t.id === id ? updated : t)),
        };
      });
      showToast('Draaiboek taak aangepast.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleDeleteMoveDayTask = async (id: string) => {
    try {
      await api.deleteMoveDayTask(id);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          moveDayTasks: (prev.moveDayTasks || []).filter((t) => t.id !== id),
        };
      });
      showToast('Taak verwijderd uit draaiboek.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleDismissFirstRun = async () => {
    try {
      await api.dismissFirstRun();
      setAppData((prev) => (prev ? { ...prev, isFirstRun: false } : null));
    } catch {
      // ignore
    }
  };

  // --- Address Changes Handlers ---
  const handleCreateAddressChange = async (item: Partial<AddressChangeItem>) => {
    try {
      const created = await api.createAddressChange(item);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          addressChanges: [...(prev.addressChanges || []), created],
        };
      });
      showToast(`Adreswijziging voor "${created.companyName}" toegevoegd.`);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleUpdateAddressChange = async (id: string, data: Partial<AddressChangeItem>) => {
    try {
      const updated = await api.updateAddressChange(id, data);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          addressChanges: (prev.addressChanges || []).map((a) => (a.id === id ? updated : a)),
        };
      });
      showToast(`Adreswijziging voor "${updated.companyName}" bijgewerkt.`);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleUpdateAddressChangeStatus = async (id: string, status: AddressChangeStatus) => {
    try {
      const updated = await api.updateAddressChangeStatus(id, status);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          addressChanges: (prev.addressChanges || []).map((a) => (a.id === id ? updated : a)),
        };
      });
      showToast(
        `Status aangepast: ${
          status === 'VOLTOOID'
            ? 'voltooid'
            : status === 'IN_BEHANDELING'
            ? 'in behandeling'
            : 'te doen'
        }.`
      );
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleDeleteAddressChange = async (id: string) => {
    try {
      await api.deleteAddressChange(id);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          addressChanges: (prev.addressChanges || []).filter((a) => a.id !== id),
        };
      });
      showToast('Adreswijziging verwijderd.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  // --- Key Handover Handlers ---
  const handleCreateKeyHandover = async (item: Partial<KeyHandoverItem>) => {
    try {
      const created = await api.createKeyHandover(item);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          keyHandovers: [...(prev.keyHandovers || []), created],
        };
      });
      showToast(`Sleutel "${created.keyType}" toegevoegd.`);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleUpdateKeyHandover = async (id: string, data: Partial<KeyHandoverItem>) => {
    try {
      const updated = await api.updateKeyHandover(id, data);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          keyHandovers: (prev.keyHandovers || []).map((k) => (k.id === id ? updated : k)),
        };
      });
      showToast('Sleuteloverdracht bijgewerkt.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleDeleteKeyHandover = async (id: string) => {
    try {
      await api.deleteKeyHandover(id);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          keyHandovers: (prev.keyHandovers || []).filter((k) => k.id !== id),
        };
      });
      showToast('Sleutelvermelding verwijderd.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  // --- Important Documents Handlers ---
  const handleCreateDocument = async (item: Partial<DocumentItem>) => {
    try {
      const created = await api.createDocument(item);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          importantDocuments: [...(prev.importantDocuments || []), created],
        };
      });
      showToast(`Document "${created.title}" toegevoegd.`);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleUpdateDocument = async (id: string, data: Partial<DocumentItem>) => {
    try {
      const updated = await api.updateDocument(id, data);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          importantDocuments: (prev.importantDocuments || []).map((d) => (d.id === id ? updated : d)),
        };
      });
      showToast(`Document "${updated.title}" bijgewerkt.`);
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setAppData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          importantDocuments: (prev.importantDocuments || []).filter((d) => d.id !== id),
        };
      });
      showToast('Document verwijderd.');
    } catch (err: unknown) {
      if (err instanceof Error) showToast(err.message, true);
    }
  };

  const handleSelectPhase = (phase: AppPhase) => {
    setCurrentPhase(phase);
    if (phase === 'VOORBEREIDING') {
      // Keep activeTab if suitable
    } else if (phase === 'VERHUIS') {
      if (activeTab === 'tasks' || activeTab === 'address-changes') {
        setActiveTab('dashboard');
      }
    } else if (phase === 'LATER') {
      if (activeTab === 'tasks' || activeTab === 'address-changes') {
        setActiveTab('rooms');
      }
    }
  };

  // If user is not logged in, show Startscherm / LoginView
  if (!currentUser) {
    return (
      <LoginView
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welkom, ${user.name}!`);
        }}
        isFirstRun={Boolean(appData?.isFirstRun)}
      />
    );
  }

  const uncompletedTasksCount = (appData?.generalTasks || []).filter((t) => !t.completed).length;
  const pendingAddressChangesCount = (appData?.addressChanges || []).filter(
    (a) => a.status !== 'VOLTOOID'
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-100 selection:text-blue-900 transition-colors">
      {/* Top Navbar & Mobile Bottom Tab Bar */}
      <Navbar
        currentUser={currentUser}
        currentPhase={currentPhase}
        onSelectPhase={handleSelectPhase}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        uncompletedTasksCount={uncompletedTasksCount}
        pendingAddressChangesCount={pendingAddressChangesCount}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenPrintModal={() => {
          setBoxesToPrint(appData?.boxes || []);
          setIsPrintModalOpen(true);
        }}
        onOpenLocationManager={() => setIsLocationManagerOpen(true)}
        onOpenUserManager={() => setIsUserManagerOpen(true)}
        onOpenMeterReadings={() => setIsMeterReadingsOpen(true)}
        onOpenMoveDayTimeline={() => setIsMoveDayTimelineOpen(true)}
        onOpenHandoverAndDocs={(tab) => {
          setHandoverInitialTab(tab || 'keys');
          setIsHandoverDocsOpen(true);
        }}
        onAddNewBox={() => {
          setEditingBox(null);
          setIsAddingBox(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {/* First Run Admin Banner (if logged in as initial admin) */}
        {appData?.isFirstRun && currentUser.role === 'admin' && (
          <div className="mb-6 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex items-start justify-between shadow-xs">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-blue-950 dark:text-white">
                  Eerste opstart: VerhuisManager v2.2 is gereed!
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-1 leading-relaxed">
                  U bent ingelogd als beheerder (<span className="font-mono font-semibold">admin</span>). Schakel direct tussen lichte en donkere stand via het zon/maan icoontje in het menu.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissFirstRun}
              className="text-blue-500 hover:text-blue-800 dark:hover:text-blue-200 p-1 rounded-lg cursor-pointer"
              title="Melding sluiten"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Views */}
        {appData && (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                boxes={appData.boxes}
                rooms={appData.rooms}
                floors={appData.floors}
                userRole={currentUser.role}
                onSelectBox={(box) => setSelectedBox(box)}
                onAddNewBox={() => {
                  setEditingBox(null);
                  setIsAddingBox(true);
                }}
                onOpenPrintModal={(filtered) => {
                  setBoxesToPrint(filtered || appData.boxes);
                  setIsPrintModalOpen(true);
                }}
                onQuickUpdateStatus={async (id, status) => {
                  await handleUpdateBoxStatus(id, status);
                }}
              />
            )}

            {activeTab === 'rooms' && (
              <RoomsOverviewView
                rooms={appData.rooms}
                floors={appData.floors}
                boxes={appData.boxes}
                userRole={currentUser.role}
                onSelectBox={(box) => setSelectedBox(box)}
                onOpenLocationManager={() => setIsLocationManagerOpen(true)}
                onOpenRoomTasks={(room) => setSelectedRoomForTasks(room)}
                onToggleRoomReadiness={handleToggleRoomReadiness}
                onToggleRoomFlag={handleToggleRoomFlag}
              />
            )}

            {activeTab === 'tasks' && (
              <GeneralTasksView
                tasks={appData.generalTasks || []}
                userRole={currentUser.role}
                onAddTask={handleCreateGeneralTask}
                onUpdateTask={handleUpdateGeneralTask}
                onToggleTask={handleToggleGeneralTask}
                onDeleteTask={handleDeleteGeneralTask}
              />
            )}

            {activeTab === 'address-changes' && (
              <AddressChangesView
                items={appData.addressChanges || []}
                userRole={currentUser.role}
                onAddItem={handleCreateAddressChange}
                onUpdateItem={handleUpdateAddressChange}
                onUpdateStatus={handleUpdateAddressChangeStatus}
                onDeleteItem={handleDeleteAddressChange}
              />
            )}
          </>
        )}
      </main>

      {/* Floating Action Toasts */}
      {errorToast && (
        <div className="no-print fixed bottom-20 md:bottom-6 right-4 z-50 p-4 bg-red-600 text-white text-xs font-semibold rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="ml-2 text-white/80 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successToast && (
        <div className="no-print fixed bottom-20 md:bottom-6 right-4 z-50 p-3.5 bg-emerald-600 text-white text-xs font-semibold rounded-2xl shadow-xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="ml-2 text-white/80 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Modals */}
      {selectedBox && appData && (
        <BoxDetailModal
          box={selectedBox}
          rooms={appData.rooms}
          floors={appData.floors}
          userRole={currentUser.role}
          qrBaseUrl={appData.settings?.qrBaseUrl}
          onUpdateStatus={handleUpdateBoxStatus}
          onEditBox={(b) => {
            setSelectedBox(null);
            setEditingBox(b);
          }}
          onDeleteBox={handleDeleteBox}
          onPrintLabel={(b) => {
            setBoxesToPrint([b]);
            setIsPrintModalOpen(true);
          }}
          onClose={() => setSelectedBox(null)}
        />
      )}

      {(isAddingBox || editingBox) && appData && (
        <BoxFormModal
          initialBox={editingBox}
          rooms={appData.rooms}
          floors={appData.floors}
          existingBoxesCount={appData.boxes.length}
          existingBoxes={appData.boxes}
          onSave={handleSaveBox}
          onClose={() => {
            setIsAddingBox(false);
            setEditingBox(null);
          }}
        />
      )}

      {isPrintModalOpen && appData && (
        <DymoPrintModal
          boxes={boxesToPrint.length > 0 ? boxesToPrint : appData.boxes}
          rooms={appData.rooms}
          floors={appData.floors}
          settings={appData.settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}

      {isScannerOpen && appData && (
        <ScannerModal
          boxes={appData.boxes}
          onSelectBox={(box) => {
            setIsScannerOpen(false);
            setSelectedBox(box);
          }}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      {isLocationManagerOpen && appData && (
        <LocationManagerModal
          floors={appData.floors}
          rooms={appData.rooms}
          onCreateFloor={handleCreateFloor}
          onUpdateFloor={handleUpdateFloor}
          onDeleteFloor={handleDeleteFloor}
          onCreateRoom={handleCreateRoom}
          onUpdateRoom={handleUpdateRoom}
          onDeleteRoom={handleDeleteRoom}
          onClose={() => setIsLocationManagerOpen(false)}
        />
      )}

      {isUserManagerOpen && appData && (
        <UserManagerModal
          users={appData.users}
          currentUserId={currentUser.id}
          onCreateUser={handleCreateUser}
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser}
          onClose={() => setIsUserManagerOpen(false)}
        />
      )}

      {selectedRoomForTasks && appData && (
        <RoomTasksModal
          room={appData.rooms.find((r) => r.id === selectedRoomForTasks.id) || selectedRoomForTasks}
          floor={appData.floors.find((f) => f.id === selectedRoomForTasks.floorId)}
          boxesInRoom={appData.boxes.filter(
            (b) => (b.currentOldRoomId === selectedRoomForTasks.id || b.currentRoomId === selectedRoomForTasks.id) && b.status === 'IN_OLD_HOUSE'
          )}
          userRole={currentUser.role}
          onToggleReadiness={handleToggleRoomReadiness}
          onToggleFlag={handleToggleRoomFlag}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateRoomTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          onSelectBox={(box) => {
            setSelectedRoomForTasks(null);
            setSelectedBox(box);
          }}
          onClose={() => setSelectedRoomForTasks(null)}
        />
      )}

      {isMeterReadingsOpen && appData && (
        <MeterReadingsModal
          meterReadings={appData.meterReadings || []}
          onSaveReading={handleSaveMeterReading}
          onClose={() => setIsMeterReadingsOpen(false)}
        />
      )}

      {isMoveDayTimelineOpen && appData && (
        <MoveDayTimelineModal
          tasks={appData.moveDayTasks || []}
          userRole={currentUser.role}
          onToggleTask={handleToggleMoveDayTask}
          onAddTask={handleAddMoveDayTask}
          onUpdateTask={handleUpdateMoveDayTask}
          onDeleteTask={handleDeleteMoveDayTask}
          onClose={() => setIsMoveDayTimelineOpen(false)}
        />
      )}

      {isHandoverDocsOpen && appData && (
        <HandoverAndDocsModal
          keyHandovers={appData.keyHandovers || []}
          documents={appData.importantDocuments || []}
          userRole={currentUser.role}
          initialTab={handoverInitialTab}
          onAddKey={handleCreateKeyHandover}
          onUpdateKey={handleUpdateKeyHandover}
          onDeleteKey={handleDeleteKeyHandover}
          onAddDoc={handleCreateDocument}
          onUpdateDoc={handleUpdateDocument}
          onDeleteDoc={handleDeleteDocument}
          onClose={() => setIsHandoverDocsOpen(false)}
        />
      )}
    </div>
  );
}
