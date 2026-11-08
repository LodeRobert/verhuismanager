export type UserRole = 'admin' | 'guest';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export type HouseType = 'OLD' | 'NEW';

export type TaskCategory =
  // Oud Huis (vertrek)
  | 'INPAKKEN'
  | 'LEEGMAKEN'
  | 'CONTAINERPARK'
  | 'POETSEN'
  | 'KLUSSEN'
  // Nieuw Huis (bestemming)
  | 'UITPAKKEN'
  | 'MONTEREN'
  | 'OPHANGEN'
  | 'AANSLUITEN'
  // Algemeen
  | 'OVERIG';

export interface RoomTask {
  id: string;
  text: string;
  completed: boolean;
  category: TaskCategory;
  createdAt: string;
}

export interface Floor {
  id: string;
  name: string;
  houseType: HouseType;
  orderIndex: number;
}

export interface Room {
  id: string;
  floorId: string;
  name: string;
  houseType: HouseType;
  isDefaultFallback?: boolean; // Typically the Garage in the new house
  isReadyForMove?: boolean; // Big checkmark: room is completely packed & clean, ready for move day
  needsClearingOut?: boolean; // Oud Huis: Moet nog leeggehaald worden
  hasContainerparkItems?: boolean; // Oud Huis: Bevat zaken voor het containerpark / grofvuil
  tasks?: RoomTask[];
  orderIndex: number;
}

export type BoxStatus = 'IN_OLD_HOUSE' | 'IN_TRANSIT' | 'MOVED';

export interface Box {
  id: string; // e.g. "BOX-001"
  boxNumber: number;
  itemType?: string; // e.g. 'Doos' (standaard), 'Kast', 'Meubel', 'Apparaat', of zelf gekozen
  title: string;
  items: string[];
  fragile: boolean;
  targetRoomId: string; // Destination room in new house
  currentOldRoomId?: string; // Optional: Current room in old house before moving
  currentRoomId: string; // Current physical location
  status: BoxStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DymoSettings {
  widthMm: number;
  heightMm: number;
  name: string;
  fontSizeScale: number;
  showContents: boolean;
  showFloor: boolean;
  qrBaseUrl?: string;
}

export type MeterType = 'WATER' | 'ELECTRICITY_DAY' | 'ELECTRICITY_NIGHT' | 'GAS' | 'SOLAR';

export interface MeterReading {
  id: string;
  houseType: HouseType;
  type: MeterType;
  name: string;
  reading: string;
  unit: string;
  date: string;
  notes?: string;
}

export interface MoveDayTask {
  id: string;
  time: string;
  title: string;
  description?: string;
  completed: boolean;
  assignedTo?: string;
}

export type GeneralTaskCategory =
  | 'ADMINISTRATIE'
  | 'VERZEKERING'
  | 'TELECOM'
  | 'NUTSEENHEDEN'
  | 'VERVOER'
  | 'OPLEVERING'
  | 'OVERIG';

export type GeneralTaskStatus = 'GEPLAND' | 'IN_BEHANDELING' | 'OK' | 'NOK' | 'GEANNULEERD';

export interface GeneralTask {
  id: string;
  title: string;
  category: GeneralTaskCategory;
  completed: boolean;
  status: GeneralTaskStatus;
  dueDate?: string;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AppPhase = 'VOORBEREIDING' | 'VERHUIS' | 'LATER';

export type AddressChangeCategory =
  | 'OFFICIEEL'
  | 'NUTSBEDRIJVEN'
  | 'FINANCIEEL'
  | 'MEDISCH'
  | 'ABONNEMENTEN'
  | 'OVERIG';

export type AddressChangeStatus = 'TE_DOEN' | 'IN_BEHANDELING' | 'VOLTOOID';

export type AddressChangeMethod =
  | 'TELEFOON'
  | 'EMAIL'
  | 'WEBSITE'
  | 'BRIEF'
  | 'LOKET'
  | 'APP'
  | 'OVERIG';

export interface AddressChangeItem {
  id: string;
  companyName: string;
  category: AddressChangeCategory;
  status: AddressChangeStatus;
  assignedTo?: string; // Wie gaat dit doen
  completedBy?: string; // Wie heeft dit gedaan
  completedDate?: string; // Wanneer gedaan
  method?: AddressChangeMethod; // Op welke manier (telefoon, mail, brief...)
  referenceNumber?: string; // Dossiernummer / klantnummer
  notes?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KeyHandoverItem {
  id: string;
  houseType: HouseType;
  keyType: string; // bv. Voordeur, Achterdeur, Brievenbus, Garagepoort, Tellerkast
  count: number;
  notes?: string;
  handedOver: boolean;
  handedOverDate?: string;
  handedOverBy?: string;
  receivedBy?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: 'CONTRACT' | 'KEURING' | 'VERZEKERING' | 'OVERIG';
  status: 'AANWEZIG' | 'TE_REGELEN' | 'VERLOPEN';
  policyOrFileNumber?: string;
  notes?: string;
  dueDate?: string;
}

export interface AppState {
  users: User[];
  floors: Floor[];
  rooms: Room[];
  boxes: Box[];
  settings: DymoSettings;
  meterReadings: MeterReading[];
  moveDayTasks: MoveDayTask[];
  generalTasks: GeneralTask[];
  addressChanges: AddressChangeItem[];
  keyHandovers: KeyHandoverItem[];
  importantDocuments: DocumentItem[];
  isFirstRun: boolean;
}
