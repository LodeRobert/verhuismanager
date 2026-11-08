import {
  AppState,
  Box,
  Floor,
  Room,
  User,
  DymoSettings,
  RoomTask,
  TaskCategory,
  MeterReading,
  MoveDayTask,
  HouseType,
  GeneralTask,
  GeneralTaskStatus,
  AddressChangeItem,
  AddressChangeStatus,
  KeyHandoverItem,
  DocumentItem,
} from '../types/index.ts';

const TOKEN_KEY = 'verhuismanager_token';
const USER_KEY = 'verhuismanager_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setSession(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Server response ${response.status}`;
    try {
      const data = await response.json();
      if (data.error) errorMsg = data.error;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth: accepts username or email
  async loginAdmin(identifier: string, password: string): Promise<{ token: string; user: User; isFirstRun?: boolean }> {
    const data = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: identifier, password, isGuest: false }),
    });
    setSession(data.token, data.user);
    return data;
  },

  async loginGuest(guestName?: string): Promise<{ token: string; user: User }> {
    const data = await fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ guestName, isGuest: true }),
    });
    setSession(data.token, data.user);
    return data;
  },

  async dismissFirstRun(): Promise<void> {
    await fetchWithAuth('/api/auth/dismiss-first-run', { method: 'POST' });
  },

  async getBootstrapInfo(): Promise<{ isFirstRun: boolean; hasAdmin: boolean; defaultAdminEmail: string }> {
    const res = await fetch('/api/bootstrap');
    return res.json();
  },

  // Main Data
  async getAppData(): Promise<AppState> {
    return fetchWithAuth('/api/data');
  },

  // Boxes
  async createBox(box: Partial<Box>): Promise<Box> {
    return fetchWithAuth('/api/boxes', {
      method: 'POST',
      body: JSON.stringify(box),
    });
  },

  async updateBox(id: string, boxData: Partial<Box>): Promise<Box> {
    return fetchWithAuth(`/api/boxes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(boxData),
    });
  },

  async deleteBox(id: string): Promise<void> {
    await fetchWithAuth(`/api/boxes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Hierarchical Locations
  async createFloor(name: string, houseType: HouseType = 'NEW'): Promise<Floor> {
    return fetchWithAuth('/api/floors', {
      method: 'POST',
      body: JSON.stringify({ name, houseType }),
    });
  },

  async updateFloor(id: string, name: string, houseType?: HouseType): Promise<Floor> {
    return fetchWithAuth(`/api/floors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ name, houseType }),
    });
  },

  async deleteFloor(id: string): Promise<void> {
    await fetchWithAuth(`/api/floors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async createRoom(room: { name: string; floorId: string; isDefaultFallback?: boolean; houseType?: HouseType }): Promise<Room> {
    return fetchWithAuth('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(room),
    });
  },

  async updateRoom(id: string, room: { name?: string; floorId?: string; isDefaultFallback?: boolean; houseType?: HouseType; isReadyForMove?: boolean; needsClearingOut?: boolean; hasContainerparkItems?: boolean }): Promise<Room> {
    return fetchWithAuth(`/api/rooms/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(room),
    });
  },

  async deleteRoom(id: string): Promise<void> {
    await fetchWithAuth(`/api/rooms/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Room Readiness & Tasks
  async toggleRoomReadiness(roomId: string, isReady: boolean): Promise<Room> {
    return fetchWithAuth(`/api/rooms/${encodeURIComponent(roomId)}`, {
      method: 'PUT',
      body: JSON.stringify({ isReadyForMove: isReady }),
    });
  },

  async toggleRoomFlag(roomId: string, flags: { isReadyForMove?: boolean; needsClearingOut?: boolean; hasContainerparkItems?: boolean }): Promise<Room> {
    return fetchWithAuth(`/api/rooms/${encodeURIComponent(roomId)}`, {
      method: 'PUT',
      body: JSON.stringify(flags),
    });
  },

  async addRoomTask(roomId: string, task: { text: string; category?: TaskCategory }): Promise<RoomTask> {
    return fetchWithAuth(`/api/rooms/${encodeURIComponent(roomId)}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  async createRoomTask(roomId: string, task: { text: string; category?: TaskCategory }): Promise<RoomTask> {
    return this.addRoomTask(roomId, task);
  },

  async updateRoomTask(roomId: string, taskId: string, task: { completed?: boolean; text?: string; category?: TaskCategory }): Promise<RoomTask> {
    return fetchWithAuth(`/api/rooms/${encodeURIComponent(roomId)}/tasks/${encodeURIComponent(taskId)}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    });
  },

  async deleteRoomTask(roomId: string, taskId: string): Promise<void> {
    await fetchWithAuth(`/api/rooms/${encodeURIComponent(roomId)}/tasks/${encodeURIComponent(taskId)}`, {
      method: 'DELETE',
    });
  },

  // Meter Readings
  async createMeterReading(reading: Partial<MeterReading>): Promise<MeterReading> {
    return fetchWithAuth('/api/meter-readings', {
      method: 'POST',
      body: JSON.stringify(reading),
    });
  },

  async updateMeterReading(id: string, data: Partial<MeterReading>): Promise<MeterReading> {
    return fetchWithAuth(`/api/meter-readings/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Move Day Timeline Tasks
  async createMoveDayTask(task: Partial<MoveDayTask>): Promise<MoveDayTask> {
    return fetchWithAuth('/api/move-day-tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  async updateMoveDayTask(id: string, data: Partial<MoveDayTask>): Promise<MoveDayTask> {
    return fetchWithAuth(`/api/move-day-tasks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteMoveDayTask(id: string): Promise<void> {
    await fetchWithAuth(`/api/move-day-tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // General Move Tasks
  async createGeneralTask(task: Partial<GeneralTask>): Promise<GeneralTask> {
    return fetchWithAuth('/api/general-tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  },

  async updateGeneralTask(id: string, data: Partial<GeneralTask>): Promise<GeneralTask> {
    return fetchWithAuth(`/api/general-tasks/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async toggleGeneralTask(id: string, completed?: boolean, status?: GeneralTaskStatus): Promise<GeneralTask> {
    return fetchWithAuth(`/api/general-tasks/${encodeURIComponent(id)}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ completed, status }),
    });
  },

  async deleteGeneralTask(id: string): Promise<void> {
    await fetchWithAuth(`/api/general-tasks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Address Changes
  async createAddressChange(item: Partial<AddressChangeItem>): Promise<AddressChangeItem> {
    return fetchWithAuth('/api/address-changes', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async updateAddressChange(id: string, data: Partial<AddressChangeItem>): Promise<AddressChangeItem> {
    return fetchWithAuth(`/api/address-changes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateAddressChangeStatus(id: string, status: AddressChangeStatus): Promise<AddressChangeItem> {
    return fetchWithAuth(`/api/address-changes/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteAddressChange(id: string): Promise<void> {
    await fetchWithAuth(`/api/address-changes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Key Handovers
  async createKeyHandover(item: Partial<KeyHandoverItem>): Promise<KeyHandoverItem> {
    return fetchWithAuth('/api/key-handovers', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async updateKeyHandover(id: string, data: Partial<KeyHandoverItem>): Promise<KeyHandoverItem> {
    return fetchWithAuth(`/api/key-handovers/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteKeyHandover(id: string): Promise<void> {
    await fetchWithAuth(`/api/key-handovers/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Important Documents
  async createDocument(item: Partial<DocumentItem>): Promise<DocumentItem> {
    return fetchWithAuth('/api/documents', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  },

  async updateDocument(id: string, data: Partial<DocumentItem>): Promise<DocumentItem> {
    return fetchWithAuth(`/api/documents/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteDocument(id: string): Promise<void> {
    await fetchWithAuth(`/api/documents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Users
  async getUsers(): Promise<User[]> {
    return fetchWithAuth('/api/users');
  },

  async createUser(userData: { name: string; email: string; password?: string; role: 'admin' | 'guest' }): Promise<User> {
    return fetchWithAuth('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(id: string, userData: { name?: string; email?: string; password?: string; role?: 'admin' | 'guest' }): Promise<User> {
    return fetchWithAuth(`/api/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id: string): Promise<void> {
    await fetchWithAuth(`/api/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Settings
  async updateSettings(settings: DymoSettings): Promise<DymoSettings> {
    return fetchWithAuth('/api/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },
};
