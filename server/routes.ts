import { Router, Request, Response, NextFunction } from 'express';
import { loadDatabase, saveDatabase, hashPassword, StoredUser } from './db.ts';
import {
  Box,
  Floor,
  Room,
  DymoSettings,
  UserRole,
  HouseType,
  TaskCategory,
  MeterReading,
  MoveDayTask,
  GeneralTask,
  GeneralTaskCategory,
  GeneralTaskStatus,
  AddressChangeItem,
  AddressChangeCategory,
  AddressChangeStatus,
  AddressChangeMethod,
  KeyHandoverItem,
  DocumentItem,
} from '../src/types/index.ts';

export const apiRouter = Router();

// Middleware to extract user from Authorization header
interface AuthenticatedRequest extends Request {
  currentUser?: {
    id: string;
    email?: string;
    role: UserRole;
    name: string;
  };
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return next();
  }

  try {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (token.startsWith('guest_')) {
      const parts = token.split(':');
      req.currentUser = {
        id: parts[0] || 'guest_user',
        name: decodeURIComponent(parts[1] || 'Verhuishulp (Gast)'),
        role: 'guest',
      };
      return next();
    }

    if (token.startsWith('admin_')) {
      const db = loadDatabase();
      const userId = token.replace('admin_', '');
      const user = db.users.find(u => u.id === userId && u.role === 'admin');
      if (user) {
        req.currentUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'admin',
        };
      }
    }
  } catch (err) {
    console.warn('Auth token parse error:', err);
  }
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    return res.status(403).json({ error: 'Toegang geweigerd: Alleen beheerders (admins) hebben toegang tot deze actie.' });
  }
  next();
}

apiRouter.use(authMiddleware);

// --- Auth Endpoints ---

// Bootstrap info
apiRouter.get('/bootstrap', (_req: Request, res: Response) => {
  const db = loadDatabase();
  const hasAdmin = db.users.some(u => u.role === 'admin');
  res.json({
    isFirstRun: Boolean(db.isFirstRun),
    hasAdmin,
    defaultAdminEmail: 'admin@verhuizing.local',
  });
});

// Login: supports both email address AND username (e.g. 'admin')
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password, guestName, isGuest } = req.body;

  if (isGuest) {
    const cleanName = (guestName && typeof guestName === 'string' && guestName.trim()) 
      ? guestName.trim() 
      : 'Verhuishulp (Gast)';
    const guestId = `guest_${Date.now()}`;
    const token = `${guestId}:${encodeURIComponent(cleanName)}`;
    return res.json({
      token,
      user: {
        id: guestId,
        name: cleanName,
        email: 'gast@verhuizing.local',
        role: 'guest' as UserRole,
        createdAt: new Date().toISOString(),
      },
    });
  }

  // Admin login: check by email OR username (name)
  if (!email || !password) {
    return res.status(400).json({ error: 'Vul een gebruikersnaam/e-mailadres en wachtwoord in.' });
  }

  const db = loadDatabase();
  const identifier = String(email).trim().toLowerCase();

  const user = db.users.find(u => 
    u.email.toLowerCase() === identifier || 
    u.name.toLowerCase() === identifier ||
    (identifier === 'admin' && u.role === 'admin')
  );

  if (!user || user.passwordHash !== hashPassword(String(password))) {
    return res.status(401).json({ error: 'Ongeldige gebruikersnaam/e-mail of wachtwoord.' });
  }

  const token = `admin_${user.id}`;
  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    },
    isFirstRun: db.isFirstRun,
  });
});

// Dismiss first run banner
apiRouter.post('/auth/dismiss-first-run', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  db.isFirstRun = false;
  saveDatabase(db);
  res.json({ success: true });
});

// Current user profile
apiRouter.get('/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Niet ingelogd' });
  }
  res.json({ user: req.currentUser });
});

// --- Main App State ---
apiRouter.get('/data', (_req: Request, res: Response) => {
  const db = loadDatabase();
  const safeUsers = db.users.map(({ passwordHash, ...rest }) => rest);
  res.json({
    users: safeUsers,
    floors: db.floors,
    rooms: db.rooms,
    boxes: db.boxes,
    settings: db.settings,
    meterReadings: db.meterReadings || [],
    moveDayTasks: db.moveDayTasks || [],
    generalTasks: db.generalTasks || [],
    addressChanges: db.addressChanges || [],
    keyHandovers: db.keyHandovers || [],
    importantDocuments: db.importantDocuments || [],
    isFirstRun: Boolean(db.isFirstRun),
  });
});

// --- Boxes API ---

// Create Box (Admin only)
apiRouter.post('/boxes', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, items, fragile, targetRoomId, notes, currentRoomId, currentOldRoomId, boxNumber, itemType } = req.body;
  const db = loadDatabase();

  if (!title || !targetRoomId) {
    return res.status(400).json({ error: 'Titel en doelruimte zijn verplicht.' });
  }

  // Calculate lowest available positive integer for automatic suggestion
  const usedNumbers = new Set(db.boxes.map(b => Number(b.boxNumber)).filter(n => Number.isInteger(n) && n > 0));
  let nextNum = 1;
  while (usedNumbers.has(nextNum)) {
    nextNum++;
  }

  if (boxNumber !== undefined && boxNumber !== null && boxNumber !== '') {
    const num = Number(boxNumber);
    if (!Number.isInteger(num) || num < 1) {
      return res.status(400).json({ error: 'Doosnummer moet een positief geheel getal zijn (bv. 1, 2, 3).' });
    }
    const duplicate = db.boxes.find(b => Number(b.boxNumber) === num);
    if (duplicate) {
      return res.status(400).json({
        error: `Doosnummer #${num} is al in gebruik door "${duplicate.title}". Kies een ander nummer of verwijder eerst de bestaande doos.`,
      });
    }
    nextNum = num;
  }

  const paddedNum = String(nextNum).padStart(3, '0');
  let id = `BOX-${paddedNum}`;
  if (db.boxes.some(b => b.id.toLowerCase() === id.toLowerCase())) {
    id = `BOX-${paddedNum}-${Date.now().toString().slice(-4)}`;
  }

  const defaultRoom = db.rooms.find(r => r.isDefaultFallback)?.id || db.rooms[0]?.id || targetRoomId;

  const newBox: Box = {
    id,
    boxNumber: nextNum,
    itemType: itemType && String(itemType).trim() ? String(itemType).trim() : 'Doos',
    title: String(title).trim(),
    items: Array.isArray(items) ? items.filter(Boolean) : [],
    fragile: Boolean(fragile),
    targetRoomId: String(targetRoomId),
    currentOldRoomId: currentOldRoomId ? String(currentOldRoomId) : undefined,
    currentRoomId: currentRoomId ? String(currentRoomId) : defaultRoom,
    status: 'IN_OLD_HOUSE',
    notes: notes ? String(notes).trim() : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.boxes.push(newBox);
  saveDatabase(db);

  res.status(201).json(newBox);
});

// Update Box
apiRouter.put('/boxes/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const boxIndex = db.boxes.findIndex(b => b.id.toLowerCase() === id.toLowerCase());

  if (boxIndex === -1) {
    return res.status(404).json({ error: 'Doos niet gevonden.' });
  }

  const existing = db.boxes[boxIndex];
  const isGuest = !req.currentUser || req.currentUser.role === 'guest';

  const garageRoom = db.rooms.find(r => r.isDefaultFallback) || db.rooms.find(r => r.name.toLowerCase().includes('garage')) || db.rooms[0];
  const garageId = garageRoom?.id || existing.currentRoomId;

  if (isGuest) {
    const { status, currentRoomId } = req.body;
    let newStatus = existing.status;
    let newLocation = existing.currentRoomId;

    if (status && ['IN_OLD_HOUSE', 'IN_TRANSIT', 'MOVED'].includes(status)) {
      newStatus = status;
    }

    if (newStatus === 'MOVED') {
      if (!currentRoomId || currentRoomId === '') {
        newLocation = garageId;
      } else {
        newLocation = currentRoomId;
      }
    } else if (currentRoomId) {
      newLocation = currentRoomId;
    }

    db.boxes[boxIndex] = {
      ...existing,
      status: newStatus,
      currentRoomId: newLocation,
      updatedAt: new Date().toISOString(),
    };
  } else {
    const { title, items, fragile, targetRoomId, currentRoomId, currentOldRoomId, status, notes, boxNumber, itemType } = req.body;

    let newBoxNumber = existing.boxNumber;
    if (boxNumber !== undefined && boxNumber !== null && boxNumber !== '') {
      const num = Number(boxNumber);
      if (!Number.isInteger(num) || num < 1) {
        return res.status(400).json({ error: 'Doosnummer moet een positief geheel getal zijn.' });
      }
      const duplicate = db.boxes.find(b => b.id.toLowerCase() !== id.toLowerCase() && Number(b.boxNumber) === num);
      if (duplicate) {
        return res.status(400).json({
          error: `Doosnummer #${num} is al in gebruik door "${duplicate.title}". Kies een ander nummer of verwijder eerst de bestaande doos.`,
        });
      }
      newBoxNumber = num;
    }

    let targetLocation = currentRoomId !== undefined ? currentRoomId : existing.currentRoomId;
    const newStatus = status || existing.status;

    if (newStatus === 'MOVED' && (!targetLocation || targetLocation === '')) {
      targetLocation = garageId;
    }

    db.boxes[boxIndex] = {
      ...existing,
      itemType: itemType !== undefined ? (String(itemType).trim() || 'Doos') : (existing.itemType || 'Doos'),
      title: title !== undefined ? String(title).trim() : existing.title,
      items: Array.isArray(items) ? items.filter(Boolean) : existing.items,
      fragile: fragile !== undefined ? Boolean(fragile) : existing.fragile,
      targetRoomId: targetRoomId !== undefined ? String(targetRoomId) : existing.targetRoomId,
      currentOldRoomId: currentOldRoomId !== undefined ? (currentOldRoomId ? String(currentOldRoomId) : undefined) : existing.currentOldRoomId,
      currentRoomId: targetLocation,
      status: newStatus,
      notes: notes !== undefined ? String(notes).trim() : existing.notes,
      boxNumber: newBoxNumber,
      updatedAt: new Date().toISOString(),
    };
  }

  saveDatabase(db);
  res.json(db.boxes[boxIndex]);
});

// Delete Box
apiRouter.delete('/boxes/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const initialLength = db.boxes.length;
  db.boxes = db.boxes.filter(b => b.id.toLowerCase() !== id.toLowerCase());

  if (db.boxes.length === initialLength) {
    return res.status(404).json({ error: 'Doos niet gevonden.' });
  }

  saveDatabase(db);
  res.json({ success: true, id });
});

// --- Hierarchical Location Management (Floors & Rooms) ---

// Floors
apiRouter.post('/floors', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, houseType } = req.body;
  if (!name) return res.status(400).json({ error: 'Verdiepingnaam is verplicht.' });

  const db = loadDatabase();
  const id = `floor_${houseType === 'OLD' ? 'old_' : 'new_'}${Date.now()}`;
  const newFloor: Floor = {
    id,
    name: String(name).trim(),
    houseType: houseType === 'OLD' ? 'OLD' : 'NEW',
    orderIndex: db.floors.length,
  };
  db.floors.push(newFloor);
  saveDatabase(db);
  res.status(201).json(newFloor);
});

apiRouter.put('/floors/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, houseType } = req.body;
  const db = loadDatabase();
  const floor = db.floors.find(f => f.id === id);
  if (!floor) return res.status(404).json({ error: 'Verdieping niet gevonden.' });

  if (name) floor.name = String(name).trim();
  if (houseType) floor.houseType = houseType === 'OLD' ? 'OLD' : 'NEW';
  saveDatabase(db);
  res.json(floor);
});

apiRouter.delete('/floors/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();

  const roomsInFloor = db.rooms.filter(r => r.floorId === id);
  if (roomsInFloor.length > 0) {
    return res.status(400).json({ error: `Kan verdieping niet verwijderen: bevat nog ${roomsInFloor.length} kamer(s). Verplaats of verwijder eerst de kamers.` });
  }

  db.floors = db.floors.filter(f => f.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// Rooms
apiRouter.post('/rooms', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, floorId, isDefaultFallback, houseType } = req.body;
  if (!name || !floorId) {
    return res.status(400).json({ error: 'Kamernaam en verdieping zijn verplicht.' });
  }

  const db = loadDatabase();
  const targetHouse = houseType === 'OLD' ? 'OLD' : 'NEW';

  if (isDefaultFallback && targetHouse === 'NEW') {
    db.rooms.forEach(r => {
      if (r.houseType === 'NEW') r.isDefaultFallback = false;
    });
  }

  const id = `room_${targetHouse === 'OLD' ? 'old_' : 'new_'}${Date.now()}`;
  const newRoom: Room = {
    id,
    floorId: String(floorId),
    name: String(name).trim(),
    houseType: targetHouse,
    isDefaultFallback: Boolean(isDefaultFallback && targetHouse === 'NEW'),
    isReadyForMove: false,
    tasks: [],
    orderIndex: db.rooms.length,
  };

  db.rooms.push(newRoom);
  saveDatabase(db);
  res.status(201).json(newRoom);
});

apiRouter.put('/rooms/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, floorId, isDefaultFallback, houseType, isReadyForMove, needsClearingOut, hasContainerparkItems } = req.body;
  const db = loadDatabase();
  const room = db.rooms.find(r => r.id === id);
  if (!room) return res.status(404).json({ error: 'Kamer niet gevonden.' });

  // Helpers and admins can toggle status flags
  if (isReadyForMove !== undefined) {
    room.isReadyForMove = Boolean(isReadyForMove);
  }
  if (needsClearingOut !== undefined) {
    room.needsClearingOut = Boolean(needsClearingOut);
  }
  if (hasContainerparkItems !== undefined) {
    room.hasContainerparkItems = Boolean(hasContainerparkItems);
  }

  // Admin-only updates for name, floor, etc.
  if (req.currentUser?.role === 'admin') {
    if (name) room.name = String(name).trim();
    if (floorId) room.floorId = String(floorId);
    if (houseType) room.houseType = houseType === 'OLD' ? 'OLD' : 'NEW';

    if (isDefaultFallback !== undefined) {
      if (isDefaultFallback && room.houseType === 'NEW') {
        db.rooms.forEach(r => { if (r.houseType === 'NEW') r.isDefaultFallback = false; });
        room.isDefaultFallback = true;
      } else {
        room.isDefaultFallback = false;
      }
    }
  }

  saveDatabase(db);
  res.json(room);
});

apiRouter.delete('/rooms/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();

  const boxesInRoom = db.boxes.filter(b => b.targetRoomId === id || b.currentRoomId === id);
  if (boxesInRoom.length > 0) {
    return res.status(400).json({ error: `Kan kamer niet verwijderen: ${boxesInRoom.length} doos/dozen hebben deze kamer als doel of huidige locatie.` });
  }

  const room = db.rooms.find(r => r.id === id);
  if (room?.isDefaultFallback) {
    return res.status(400).json({ error: 'Kan de standaard fallback locatie (Garage) niet verwijderen. Wijs eerst een andere kamer aan als fallback.' });
  }

  db.rooms = db.rooms.filter(r => r.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// --- Room Tasks API ---

const VALID_ROOM_TASK_CATEGORIES: TaskCategory[] = [
  'INPAKKEN',
  'LEEGMAKEN',
  'CONTAINERPARK',
  'POETSEN',
  'KLUSSEN',
  'UITPAKKEN',
  'MONTEREN',
  'OPHANGEN',
  'AANSLUITEN',
  'OVERIG',
];

// Add task to room
apiRouter.post('/rooms/:id/tasks', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { text, category } = req.body;
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'Taakomschrijving is verplicht.' });
  }

  const db = loadDatabase();
  const room = db.rooms.find(r => r.id === id);
  if (!room) return res.status(404).json({ error: 'Kamer niet gevonden.' });

  if (!room.tasks) room.tasks = [];

  const validCategory = VALID_ROOM_TASK_CATEGORIES.includes(category) ? category : 'OVERIG';

  const newTask = {
    id: `task_${Date.now()}`,
    text: String(text).trim(),
    completed: false,
    category: validCategory as TaskCategory,
    createdAt: new Date().toISOString(),
  };

  room.tasks.push(newTask);
  saveDatabase(db);
  res.status(201).json(newTask);
});

// Update / Toggle task in room
apiRouter.put('/rooms/:id/tasks/:taskId', (req: AuthenticatedRequest, res: Response) => {
  const { id, taskId } = req.params;
  const { completed, text, category } = req.body;
  const db = loadDatabase();
  const room = db.rooms.find(r => r.id === id);
  if (!room || !room.tasks) return res.status(404).json({ error: 'Kamer of taken niet gevonden.' });

  const task = room.tasks.find(t => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Taak niet gevonden.' });

  if (completed !== undefined) task.completed = Boolean(completed);
  if (text !== undefined) task.text = String(text).trim();
  if (category && VALID_ROOM_TASK_CATEGORIES.includes(category)) {
    task.category = category as TaskCategory;
  }

  saveDatabase(db);
  res.json(task);
});

// Delete task from room
apiRouter.delete('/rooms/:id/tasks/:taskId', (req: AuthenticatedRequest, res: Response) => {
  const { id, taskId } = req.params;
  const db = loadDatabase();
  const room = db.rooms.find(r => r.id === id);
  if (!room || !room.tasks) return res.status(404).json({ error: 'Kamer niet gevonden.' });

  room.tasks = room.tasks.filter(t => t.id !== taskId);
  saveDatabase(db);
  res.json({ success: true });
});

// --- Meter Readings API ---
apiRouter.post('/meter-readings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { houseType, type, name, reading, unit, date, notes } = req.body;
  const db = loadDatabase();

  const newReading: MeterReading = {
    id: `m_${houseType === 'OLD' ? 'old_' : 'new_'}${Date.now()}`,
    houseType: houseType === 'OLD' ? 'OLD' : 'NEW',
    type: type || 'WATER',
    name: name || 'Meter',
    reading: reading || '',
    unit: unit || '',
    date: date || new Date().toISOString().slice(0, 10),
    notes: notes || '',
  };

  db.meterReadings = db.meterReadings || [];
  db.meterReadings.push(newReading);
  saveDatabase(db);
  res.status(201).json(newReading);
});

apiRouter.put('/meter-readings/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reading, date, notes, name } = req.body;
  const db = loadDatabase();

  db.meterReadings = db.meterReadings || [];
  const item = db.meterReadings.find(m => m.id === id);
  if (!item) return res.status(404).json({ error: 'Meterstand niet gevonden.' });

  if (reading !== undefined) item.reading = String(reading);
  if (date !== undefined) item.date = String(date);
  if (notes !== undefined) item.notes = String(notes);
  if (name !== undefined) item.name = String(name);

  saveDatabase(db);
  res.json(item);
});

// --- Move Day Tasks / Timeline API ---
apiRouter.post('/move-day-tasks', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { time, title, description, assignedTo } = req.body;
  if (!title) return res.status(400).json({ error: 'Titel is verplicht.' });

  const db = loadDatabase();
  const newTask: MoveDayTask = {
    id: `md_${Date.now()}`,
    time: time || '09:00',
    title: String(title).trim(),
    description: description ? String(description).trim() : '',
    assignedTo: assignedTo ? String(assignedTo).trim() : '',
    completed: false,
  };

  db.moveDayTasks = db.moveDayTasks || [];
  db.moveDayTasks.push(newTask);
  saveDatabase(db);
  res.status(201).json(newTask);
});

apiRouter.put('/move-day-tasks/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { completed, time, title, description, assignedTo } = req.body;
  const db = loadDatabase();

  db.moveDayTasks = db.moveDayTasks || [];
  const task = db.moveDayTasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Draaiboek-taak niet gevonden.' });

  if (completed !== undefined) task.completed = Boolean(completed);
  if (time !== undefined) task.time = String(time);
  if (title !== undefined) task.title = String(title).trim();
  if (description !== undefined) task.description = String(description).trim();
  if (assignedTo !== undefined) task.assignedTo = String(assignedTo).trim();

  saveDatabase(db);
  res.json(task);
});

apiRouter.delete('/move-day-tasks/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  db.moveDayTasks = (db.moveDayTasks || []).filter(t => t.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// --- General Move Tasks API ---
apiRouter.post('/general-tasks', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, category, dueDate, assignedTo, notes, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Titel van de taak is verplicht.' });

  const db = loadDatabase();
  const now = new Date().toISOString();
  const validCategories: GeneralTaskCategory[] = [
    'ADMINISTRATIE',
    'VERZEKERING',
    'TELECOM',
    'NUTSEENHEDEN',
    'VERVOER',
    'OPLEVERING',
    'OVERIG',
  ];
  const validStatuses: GeneralTaskStatus[] = ['GEPLAND', 'IN_BEHANDELING', 'OK', 'NOK', 'GEANNULEERD'];
  const taskStatus: GeneralTaskStatus = validStatuses.includes(status) ? status : 'GEPLAND';

  const newTask: GeneralTask = {
    id: `gt_${Date.now()}`,
    title: String(title).trim(),
    category: (validCategories.includes(category) ? category : 'OVERIG') as GeneralTaskCategory,
    status: taskStatus,
    completed: taskStatus === 'OK',
    dueDate: dueDate ? String(dueDate) : undefined,
    assignedTo: assignedTo ? String(assignedTo).trim() : undefined,
    notes: notes ? String(notes).trim() : undefined,
    createdAt: now,
    updatedAt: now,
  };

  db.generalTasks = db.generalTasks || [];
  db.generalTasks.push(newTask);
  saveDatabase(db);
  res.status(201).json(newTask);
});

apiRouter.put('/general-tasks/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, category, dueDate, assignedTo, notes, completed, status } = req.body;
  const db = loadDatabase();

  db.generalTasks = db.generalTasks || [];
  const task = db.generalTasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Algemene taak niet gevonden.' });

  if (title !== undefined) task.title = String(title).trim();
  if (category !== undefined) task.category = category as GeneralTaskCategory;
  if (dueDate !== undefined) task.dueDate = dueDate ? String(dueDate) : undefined;
  if (assignedTo !== undefined) task.assignedTo = assignedTo ? String(assignedTo).trim() : undefined;
  if (notes !== undefined) task.notes = notes ? String(notes).trim() : undefined;

  const validStatuses: GeneralTaskStatus[] = ['GEPLAND', 'IN_BEHANDELING', 'OK', 'NOK', 'GEANNULEERD'];
  if (status !== undefined && validStatuses.includes(status)) {
    task.status = status;
    task.completed = status === 'OK';
  } else if (completed !== undefined) {
    task.completed = Boolean(completed);
    task.status = task.completed ? 'OK' : 'GEPLAND';
  }
  task.updatedAt = new Date().toISOString();

  saveDatabase(db);
  res.json(task);
});

apiRouter.patch('/general-tasks/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { completed, status } = req.body;
  const db = loadDatabase();

  db.generalTasks = db.generalTasks || [];
  const task = db.generalTasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Algemene taak niet gevonden.' });

  const validStatuses: GeneralTaskStatus[] = ['GEPLAND', 'IN_BEHANDELING', 'OK', 'NOK', 'GEANNULEERD'];
  if (status !== undefined && validStatuses.includes(status)) {
    task.status = status;
    task.completed = status === 'OK';
  } else {
    const nextCompleted = completed !== undefined ? Boolean(completed) : !task.completed;
    task.completed = nextCompleted;
    task.status = nextCompleted ? 'OK' : 'GEPLAND';
  }
  task.updatedAt = new Date().toISOString();

  saveDatabase(db);
  res.json(task);
});

apiRouter.delete('/general-tasks/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const initLen = (db.generalTasks || []).length;
  db.generalTasks = (db.generalTasks || []).filter(t => t.id !== id);

  if (db.generalTasks.length === initLen) {
    return res.status(404).json({ error: 'Algemene taak niet gevonden.' });
  }

  saveDatabase(db);
  res.json({ success: true, id });
});

// --- Address Changes API ---
apiRouter.post('/address-changes', (req: AuthenticatedRequest, res: Response) => {
  const { companyName, category, status, assignedTo, completedBy, completedDate, method, referenceNumber, notes, dueDate } = req.body;
  if (!companyName) {
    return res.status(400).json({ error: 'Bedrijfsnaam is verplicht.' });
  }

  const db = loadDatabase();
  const now = new Date().toISOString();
  const validCategories: AddressChangeCategory[] = [
    'OFFICIEEL',
    'NUTSBEDRIJVEN',
    'FINANCIEEL',
    'MEDISCH',
    'ABONNEMENTEN',
    'OVERIG',
  ];

  const newItem: AddressChangeItem = {
    id: `ac_${Date.now()}`,
    companyName: String(companyName).trim(),
    category: (validCategories.includes(category) ? category : 'OVERIG') as AddressChangeCategory,
    status: (['TE_DOEN', 'IN_BEHANDELING', 'VOLTOOID'].includes(status) ? status : 'TE_DOEN') as AddressChangeStatus,
    assignedTo: assignedTo ? String(assignedTo).trim() : undefined,
    completedBy: completedBy ? String(completedBy).trim() : undefined,
    completedDate: completedDate ? String(completedDate) : undefined,
    method: method ? (method as AddressChangeMethod) : undefined,
    referenceNumber: referenceNumber ? String(referenceNumber).trim() : undefined,
    notes: notes ? String(notes).trim() : undefined,
    dueDate: dueDate ? String(dueDate) : undefined,
    createdAt: now,
    updatedAt: now,
  };

  db.addressChanges = db.addressChanges || [];
  db.addressChanges.push(newItem);
  saveDatabase(db);
  res.status(201).json(newItem);
});

apiRouter.put('/address-changes/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { companyName, category, status, assignedTo, completedBy, completedDate, method, referenceNumber, notes, dueDate } = req.body;
  const db = loadDatabase();

  db.addressChanges = db.addressChanges || [];
  const item = db.addressChanges.find(a => a.id === id);
  if (!item) return res.status(404).json({ error: 'Adreswijziging niet gevonden.' });

  if (companyName !== undefined) item.companyName = String(companyName).trim();
  if (category !== undefined) item.category = category as AddressChangeCategory;
  if (status !== undefined) {
    item.status = status as AddressChangeStatus;
    if (status === 'VOLTOOID' && !item.completedDate) {
      item.completedDate = new Date().toISOString().slice(0, 10);
      if (!item.completedBy && req.currentUser?.name) {
        item.completedBy = req.currentUser.name;
      }
    }
  }
  if (assignedTo !== undefined) item.assignedTo = assignedTo ? String(assignedTo).trim() : undefined;
  if (completedBy !== undefined) item.completedBy = completedBy ? String(completedBy).trim() : undefined;
  if (completedDate !== undefined) item.completedDate = completedDate ? String(completedDate) : undefined;
  if (method !== undefined) item.method = method ? (method as AddressChangeMethod) : undefined;
  if (referenceNumber !== undefined) item.referenceNumber = referenceNumber ? String(referenceNumber).trim() : undefined;
  if (notes !== undefined) item.notes = notes ? String(notes).trim() : undefined;
  if (dueDate !== undefined) item.dueDate = dueDate ? String(dueDate) : undefined;
  item.updatedAt = new Date().toISOString();

  saveDatabase(db);
  res.json(item);
});

apiRouter.patch('/address-changes/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = loadDatabase();

  db.addressChanges = db.addressChanges || [];
  const item = db.addressChanges.find(a => a.id === id);
  if (!item) return res.status(404).json({ error: 'Adreswijziging niet gevonden.' });

  item.status = status as AddressChangeStatus;
  if (status === 'VOLTOOID') {
    item.completedDate = new Date().toISOString().slice(0, 10);
    if (!item.completedBy && req.currentUser?.name) {
      item.completedBy = req.currentUser.name;
    }
  }
  item.updatedAt = new Date().toISOString();

  saveDatabase(db);
  res.json(item);
});

apiRouter.delete('/address-changes/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const initLen = (db.addressChanges || []).length;
  db.addressChanges = (db.addressChanges || []).filter(a => a.id !== id);

  if (db.addressChanges.length === initLen) {
    return res.status(404).json({ error: 'Adreswijziging niet gevonden.' });
  }

  saveDatabase(db);
  res.json({ success: true, id });
});

// --- Key Handovers API ---
apiRouter.post('/key-handovers', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { houseType, keyType, count, notes, handedOver, handedOverDate, handedOverBy, receivedBy } = req.body;
  if (!keyType) return res.status(400).json({ error: 'Type sleutel is verplicht.' });

  const db = loadDatabase();
  const newItem: KeyHandoverItem = {
    id: `kh_${Date.now()}`,
    houseType: houseType === 'OLD' ? 'OLD' : 'NEW',
    keyType: String(keyType).trim(),
    count: Number(count) || 1,
    notes: notes ? String(notes).trim() : undefined,
    handedOver: Boolean(handedOver),
    handedOverDate: handedOverDate ? String(handedOverDate) : undefined,
    handedOverBy: handedOverBy ? String(handedOverBy).trim() : undefined,
    receivedBy: receivedBy ? String(receivedBy).trim() : undefined,
  };

  db.keyHandovers = db.keyHandovers || [];
  db.keyHandovers.push(newItem);
  saveDatabase(db);
  res.status(201).json(newItem);
});

apiRouter.put('/key-handovers/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { houseType, keyType, count, notes, handedOver, handedOverDate, handedOverBy, receivedBy } = req.body;
  const db = loadDatabase();

  db.keyHandovers = db.keyHandovers || [];
  const item = db.keyHandovers.find(k => k.id === id);
  if (!item) return res.status(404).json({ error: 'Sleuteloverdracht item niet gevonden.' });

  if (houseType !== undefined) item.houseType = houseType === 'OLD' ? 'OLD' : 'NEW';
  if (keyType !== undefined) item.keyType = String(keyType).trim();
  if (count !== undefined) item.count = Number(count) || 1;
  if (notes !== undefined) item.notes = notes ? String(notes).trim() : undefined;
  if (handedOver !== undefined) item.handedOver = Boolean(handedOver);
  if (handedOverDate !== undefined) item.handedOverDate = handedOverDate ? String(handedOverDate) : undefined;
  if (handedOverBy !== undefined) item.handedOverBy = handedOverBy ? String(handedOverBy).trim() : undefined;
  if (receivedBy !== undefined) item.receivedBy = receivedBy ? String(receivedBy).trim() : undefined;

  saveDatabase(db);
  res.json(item);
});

apiRouter.delete('/key-handovers/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const initLen = (db.keyHandovers || []).length;
  db.keyHandovers = (db.keyHandovers || []).filter(k => k.id !== id);

  if (db.keyHandovers.length === initLen) {
    return res.status(404).json({ error: 'Sleuteloverdracht item niet gevonden.' });
  }

  saveDatabase(db);
  res.json({ success: true, id });
});

// --- Important Documents API ---
apiRouter.post('/documents', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { title, category, status, policyOrFileNumber, notes, dueDate } = req.body;
  if (!title) return res.status(400).json({ error: 'Titel van het document is verplicht.' });

  const db = loadDatabase();
  const newItem: DocumentItem = {
    id: `doc_${Date.now()}`,
    title: String(title).trim(),
    category: (['CONTRACT', 'KEURING', 'VERZEKERING', 'OVERIG'].includes(category) ? category : 'OVERIG') as any,
    status: (['AANWEZIG', 'TE_REGELEN', 'VERLOPEN'].includes(status) ? status : 'AANWEZIG') as any,
    policyOrFileNumber: policyOrFileNumber ? String(policyOrFileNumber).trim() : undefined,
    notes: notes ? String(notes).trim() : undefined,
    dueDate: dueDate ? String(dueDate) : undefined,
  };

  db.importantDocuments = db.importantDocuments || [];
  db.importantDocuments.push(newItem);
  saveDatabase(db);
  res.status(201).json(newItem);
});

apiRouter.put('/documents/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, category, status, policyOrFileNumber, notes, dueDate } = req.body;
  const db = loadDatabase();

  db.importantDocuments = db.importantDocuments || [];
  const item = db.importantDocuments.find(d => d.id === id);
  if (!item) return res.status(404).json({ error: 'Document niet gevonden.' });

  if (title !== undefined) item.title = String(title).trim();
  if (category !== undefined) item.category = category;
  if (status !== undefined) item.status = status;
  if (policyOrFileNumber !== undefined) item.policyOrFileNumber = policyOrFileNumber ? String(policyOrFileNumber).trim() : undefined;
  if (notes !== undefined) item.notes = notes ? String(notes).trim() : undefined;
  if (dueDate !== undefined) item.dueDate = dueDate ? String(dueDate) : undefined;

  saveDatabase(db);
  res.json(item);
});

apiRouter.delete('/documents/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();
  const initLen = (db.importantDocuments || []).length;
  db.importantDocuments = (db.importantDocuments || []).filter(d => d.id !== id);

  if (db.importantDocuments.length === initLen) {
    return res.status(404).json({ error: 'Document niet gevonden.' });
  }

  saveDatabase(db);
  res.json({ success: true, id });
});

// --- User Management (Admin only) ---
apiRouter.get('/users', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const db = loadDatabase();
  const safeUsers = db.users.map(({ passwordHash, ...rest }) => rest);
  res.json(safeUsers);
});

apiRouter.post('/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, role } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Naam en e-mailadres zijn verplicht.' });
  }

  const db = loadDatabase();
  const normalizedEmail = String(email).trim().toLowerCase();
  if (db.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
    return res.status(400).json({ error: 'Er bestaat al een gebruiker met dit e-mailadres.' });
  }

  const newUser: StoredUser = {
    id: `user_${Date.now()}`,
    name: String(name).trim(),
    email: normalizedEmail,
    role: (role === 'admin' ? 'admin' : 'guest') as UserRole,
    passwordHash: password ? hashPassword(String(password)) : undefined,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  saveDatabase(db);

  const { passwordHash, ...safe } = newUser;
  res.status(201).json(safe);
});

apiRouter.put('/users/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;
  const db = loadDatabase();
  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'Gebruiker niet gevonden.' });

  if (name) user.name = String(name).trim();
  if (email) user.email = String(email).trim().toLowerCase();
  if (role && ['admin', 'guest'].includes(role)) {
    if (user.role === 'admin' && role === 'guest') {
      const adminCount = db.users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Kan de enige admin niet degraderen naar gast.' });
      }
    }
    user.role = role;
  }
  if (password) {
    user.passwordHash = hashPassword(String(password));
  }

  saveDatabase(db);
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

apiRouter.delete('/users/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const db = loadDatabase();

  const user = db.users.find(u => u.id === id);
  if (!user) return res.status(404).json({ error: 'Gebruiker niet gevonden.' });

  if (user.role === 'admin') {
    const adminCount = db.users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Kan de laatste beheerder (admin) niet verwijderen.' });
    }
  }

  db.users = db.users.filter(u => u.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// --- Dymo Settings (Admin only) ---
apiRouter.post('/settings', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { widthMm, heightMm, name, fontSizeScale, showContents, showFloor, qrBaseUrl } = req.body;
  const db = loadDatabase();

  db.settings = {
    widthMm: Number(widthMm) || 89,
    heightMm: Number(heightMm) || 41,
    name: name ? String(name) : `${Number(widthMm)} x ${Number(heightMm)} mm`,
    fontSizeScale: Number(fontSizeScale) || 1.0,
    showContents: showContents !== undefined ? Boolean(showContents) : true,
    showFloor: showFloor !== undefined ? Boolean(showFloor) : true,
    qrBaseUrl: qrBaseUrl !== undefined && qrBaseUrl !== '' ? String(qrBaseUrl).trim() : (db.settings?.qrBaseUrl || 'https://verhuis.djxload.com'),
  };

  saveDatabase(db);
  res.json(db.settings);
});
