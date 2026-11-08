import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  AppState,
  Box,
  Floor,
  Room,
  User,
  DymoSettings,
  MeterReading,
  MoveDayTask,
  RoomTask,
  GeneralTask,
  AddressChangeItem,
  KeyHandoverItem,
  DocumentItem,
} from '../src/types/index.ts';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure directory exists with permission fallback
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (err) {
  console.warn('Kon datamap niet direct aanmaken (mogelijk reeds bestaand of permission fallback):', err);
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'verhuismanager_salt_2026').digest('hex');
}

export interface StoredUser extends User {
  passwordHash?: string;
}

export interface StoredDatabase extends Omit<AppState, 'users'> {
  users: StoredUser[];
  initialAdminCreated?: boolean;
}

const DEFAULT_SETTINGS: DymoSettings = {
  widthMm: 89,
  heightMm: 41,
  name: 'Aangepast (89 x 41 mm)',
  fontSizeScale: 1.0,
  showContents: true,
  showFloor: true,
  qrBaseUrl: 'https://verhuis.djxload.com',
};

export const DEFAULT_ADDRESS_CHANGES: AddressChangeItem[] = [
  {
    id: 'ac_1',
    companyName: 'Gemeentehuis / Dienst Bevolking',
    category: 'OFFICIEEL',
    status: 'TE_DOEN',
    assignedTo: 'Lode',
    method: 'LOKET',
    dueDate: '2026-11-20',
    notes: 'Adreswijziging aangeven binnen 8 werkdagen na effectieve verhuis. Wijkagent komt op controle.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ac_2',
    companyName: 'Bpost Verhuisservice',
    category: 'OFFICIEEL',
    status: 'TE_DOEN',
    assignedTo: 'Lode',
    method: 'WEBSITE',
    dueDate: '2026-11-08',
    notes: 'Doorzendservice van post voor 4 maanden activeren naar nieuw adres.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ac_3',
    companyName: 'Energieleverancier (Elektriciteit & Gas)',
    category: 'NUTSBEDRIJVEN',
    status: 'IN_BEHANDELING',
    assignedTo: 'Lode',
    method: 'WEBSITE',
    dueDate: '2026-11-05',
    notes: 'Contract overzetten naar nieuw adres en overnamedocument uploaden met de meterstanden.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ac_4',
    companyName: 'Watermaatschappij',
    category: 'NUTSBEDRIJVEN',
    status: 'TE_DOEN',
    method: 'WEBSITE',
    dueDate: '2026-11-05',
    notes: 'Meterstand oud huis doorgeven en nieuw contract activeren in nieuw huis.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ac_5',
    companyName: 'Telecom (Internet, TV & Vaste Lijn)',
    category: 'NUTSBEDRIJVEN',
    status: 'IN_BEHANDELING',
    assignedTo: 'Lode',
    method: 'TELEFOON',
    dueDate: '2026-11-08',
    notes: 'Afspraak technieker bevestigd voor modeminstallatie in nieuw huis.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ac_6',
    companyName: 'Bank & Kredietinstelling',
    category: 'FINANCIEEL',
    status: 'TE_DOEN',
    method: 'APP',
    dueDate: '2026-11-25',
    notes: 'Adres aanpassen via bankapp / eID zodra nieuw adres geregistreerd is.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ac_7',
    companyName: 'Brand- en Inboedelverzekering',
    category: 'FINANCIEEL',
    status: 'IN_BEHANDELING',
    assignedTo: 'Lode',
    method: 'EMAIL',
    notes: 'Nieuwe woning polisnummer activeren op dag van intrek.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ac_8',
    companyName: 'Werkgever / Personeelsdienst (HR)',
    category: 'OFFICIEEL',
    status: 'TE_DOEN',
    method: 'EMAIL',
    dueDate: '2026-11-20',
    notes: 'Fiscaal attest en loonbriefadres aanpassen.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ac_9',
    companyName: 'Ziekenfonds / Mutualiteit',
    category: 'FINANCIEEL',
    status: 'TE_DOEN',
    method: 'WEBSITE',
    notes: 'Gegevens synchroniseren (vaak automatisch na eID update bij gemeente, even verifiëren).',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ac_10',
    companyName: 'Huisarts & Tandarts',
    category: 'MEDISCH',
    status: 'TE_DOEN',
    method: 'TELEFOON',
    notes: 'Nieuw adres noteren in medisch dossier bij volgend contact.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ac_11',
    companyName: 'Webshops (Bol.com, Amazon, Coolblue)',
    category: 'ABONNEMENTEN',
    status: 'TE_DOEN',
    method: 'WEBSITE',
    notes: 'Standaard leveradres wijzigen in webshop accounts om foute bezorgingen te vermijden.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ac_12',
    companyName: 'Streaming & Abonnementen (Netflix, Spotify, Tijdschriften)',
    category: 'ABONNEMENTEN',
    status: 'TE_DOEN',
    method: 'APP',
    notes: 'Facturatie- en leveradres aanpassen.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_KEY_HANDOVERS: KeyHandoverItem[] = [
  {
    id: 'kh_1',
    houseType: 'OLD',
    keyType: 'Voordeursleutels',
    count: 3,
    handedOver: false,
    notes: 'Inleveren aan eigenaar/koper tijdens eindinspectie',
  },
  {
    id: 'kh_2',
    houseType: 'OLD',
    keyType: 'Achterdeur / Terras',
    count: 2,
    handedOver: false,
    notes: 'Inleveren aan eigenaar/koper',
  },
  {
    id: 'kh_3',
    houseType: 'OLD',
    keyType: 'Brievenbus & Kelder',
    count: 2,
    handedOver: false,
    notes: 'Inleveren aan eigenaar/koper',
  },
  {
    id: 'kh_4',
    houseType: 'NEW',
    keyType: 'Voordeursleutels Veiligheidsslot',
    count: 3,
    handedOver: true,
    handedOverDate: '2026-11-01',
    receivedBy: 'Lode',
    notes: 'Ontvangen bij akteverlijding / sleuteloverdracht',
  },
  {
    id: 'kh_5',
    houseType: 'NEW',
    keyType: 'Garagepoort Sleutel & Handzender',
    count: 2,
    handedOver: true,
    handedOverDate: '2026-11-01',
    receivedBy: 'Lode',
    notes: 'Handzender getest en functioneel',
  },
  {
    id: 'kh_6',
    houseType: 'NEW',
    keyType: 'Tellerkast & Technische Ruimte',
    count: 1,
    handedOver: true,
    handedOverDate: '2026-11-01',
    receivedBy: 'Lode',
    notes: 'Sleutel hangt in meterkast',
  },
];

export const DEFAULT_IMPORTANT_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc_1',
    title: 'Huurovereenkomst / Notariële Aankoopakte',
    category: 'CONTRACT',
    status: 'AANWEZIG',
    policyOrFileNumber: 'AKTE-2026-784',
    notes: 'Ondertekend en digitaal gearchiveerd',
  },
  {
    id: 'doc_2',
    title: 'Plaatsbeschrijving (Intrede / Uittrede)',
    category: 'CONTRACT',
    status: 'TE_REGELEN',
    notes: 'Gezamenlijke opmaak met expert en fotobijlage',
  },
  {
    id: 'doc_3',
    title: 'Energieprestatiecertificaat (EPC)',
    category: 'KEURING',
    status: 'AANWEZIG',
    policyOrFileNumber: 'EPC-2024-00341',
    notes: 'Score B / 180 kWh/m²',
  },
  {
    id: 'doc_4',
    title: 'Elektrische Keuring & Gelijkvormigheidsattest',
    category: 'KEURING',
    status: 'AANWEZIG',
    policyOrFileNumber: 'KEUR-ELEK-892',
    notes: 'Conform AREI gekeurd',
  },
  {
    id: 'doc_5',
    title: 'Brand- en Inboedelverzekeringspolis',
    category: 'VERZEKERING',
    status: 'TE_REGELEN',
    policyOrFileNumber: 'POL-BR-99238',
    notes: 'Premie bevestigd, ingangsdatum gecontroleerd',
  },
  {
    id: 'doc_6',
    title: 'Energieovernamedocument (Water, Gas, Elektriciteit)',
    category: 'CONTRACT',
    status: 'TE_REGELEN',
    notes: 'In te vullen en te ondertekenen op de verhuisdag met de meterstanden',
  },
];

function getInitialDatabase(): StoredDatabase {
  const initialAdminId = 'user_admin_initial';
  const initialAdmin: StoredUser = {
    id: initialAdminId,
    email: 'admin@verhuizing.local',
    name: 'admin',
    role: 'admin',
    passwordHash: hashPassword('admin123'),
    createdAt: new Date().toISOString(),
  };

  const floors: Floor[] = [
    // Nieuw Huis
    { id: 'floor_new_kelder', name: 'Kelder', houseType: 'NEW', orderIndex: 0 },
    { id: 'floor_new_gelijkvloers', name: 'Gelijkvloers', houseType: 'NEW', orderIndex: 1 },
    { id: 'floor_new_1e', name: '1e Verdieping', houseType: 'NEW', orderIndex: 2 },
    { id: 'floor_new_zolder', name: 'Zolder', houseType: 'NEW', orderIndex: 3 },
    // Oud Huis
    { id: 'floor_old_gelijkvloers', name: 'Gelijkvloers', houseType: 'OLD', orderIndex: 10 },
    { id: 'floor_old_1e', name: '1e Verdieping', houseType: 'OLD', orderIndex: 11 },
  ];

  const now = new Date().toISOString();

  const rooms: Room[] = [
    // Nieuw Huis kamers
    {
      id: 'room_new_woonkamer',
      floorId: 'floor_new_gelijkvloers',
      name: 'Woonkamer',
      houseType: 'NEW',
      tasks: [
        { id: 'task_n1', text: 'Vloerbescherming leggen voor verhuizers', completed: true, category: 'KLUSSEN', createdAt: now },
        { id: 'task_n2', text: 'Salontafel en zetel op juiste plek zetten', completed: false, category: 'INPAKKEN', createdAt: now },
      ],
      orderIndex: 1,
    },
    {
      id: 'room_new_keuken',
      floorId: 'floor_new_gelijkvloers',
      name: 'Keuken',
      houseType: 'NEW',
      tasks: [
        { id: 'task_n3', text: 'Koelkast aansluiten en aanzetten', completed: true, category: 'KLUSSEN', createdAt: now },
        { id: 'task_n4', text: 'Koffiehoekje klaarmaken voor verhuizers', completed: false, category: 'OVERIG', createdAt: now },
      ],
      orderIndex: 2,
    },
    {
      id: 'room_new_eetkamer',
      floorId: 'floor_new_gelijkvloers',
      name: 'Eetkamer',
      houseType: 'NEW',
      orderIndex: 3,
    },
    {
      id: 'room_new_hal',
      floorId: 'floor_new_gelijkvloers',
      name: 'Inkomhal',
      houseType: 'NEW',
      orderIndex: 4,
    },
    {
      id: 'room_new_garage',
      floorId: 'floor_new_gelijkvloers',
      name: 'Garage (Buffer/Noodopslag)',
      houseType: 'NEW',
      isDefaultFallback: true,
      tasks: [
        { id: 'task_n5', text: 'Looproute vrijhouden naar binnendeur', completed: true, category: 'OVERIG', createdAt: now },
      ],
      orderIndex: 5,
    },
    {
      id: 'room_new_tuin',
      floorId: 'floor_new_gelijkvloers',
      name: 'Tuin / Terras',
      houseType: 'NEW',
      orderIndex: 6,
    },
    {
      id: 'room_new_slaapkamer_master',
      floorId: 'floor_new_1e',
      name: 'Slaapkamer 1 (Master)',
      houseType: 'NEW',
      tasks: [
        { id: 'task_n6', text: 'Bedframe monteren voor de avond', completed: false, category: 'KLUSSEN', createdAt: now },
      ],
      orderIndex: 7,
    },
    {
      id: 'room_new_slaapkamer_2',
      floorId: 'floor_new_1e',
      name: 'Slaapkamer 2 (Kinderkamer)',
      houseType: 'NEW',
      orderIndex: 8,
    },
    {
      id: 'room_new_badkamer',
      floorId: 'floor_new_1e',
      name: 'Badkamer',
      houseType: 'NEW',
      tasks: [
        { id: 'task_n7', text: 'Handdoeken en zeep ophangen', completed: true, category: 'OVERIG', createdAt: now },
      ],
      orderIndex: 9,
    },
    {
      id: 'room_new_bureau',
      floorId: 'floor_new_1e',
      name: 'Bureau / Werkkamer',
      houseType: 'NEW',
      orderIndex: 10,
    },
    {
      id: 'room_new_zolder',
      floorId: 'floor_new_zolder',
      name: 'Zolderberging',
      houseType: 'NEW',
      orderIndex: 11,
    },
    {
      id: 'room_new_kelder',
      floorId: 'floor_new_kelder',
      name: 'Kelderopslag',
      houseType: 'NEW',
      orderIndex: 12,
    },

    // Oud Huis kamers met werkpunten en "Klaar voor verhuis"-vlag
    {
      id: 'room_old_keuken',
      floorId: 'floor_old_gelijkvloers',
      name: 'Keuken (Oud)',
      houseType: 'OLD',
      isReadyForMove: false,
      tasks: [
        { id: 'task_o1', text: 'Koelkast en diepvries ontdooien en leegmaken', completed: true, category: 'POETSEN', createdAt: now },
        { id: 'task_o2', text: 'Keukenkastjes uitwassen en droogmaken', completed: true, category: 'POETSEN', createdAt: now },
        { id: 'task_o3', text: 'Laatste servies en koffiemachine inpakken', completed: false, category: 'INPAKKEN', createdAt: now },
      ],
      orderIndex: 20,
    },
    {
      id: 'room_old_woonkamer',
      floorId: 'floor_old_gelijkvloers',
      name: 'Woonkamer (Oud)',
      houseType: 'OLD',
      isReadyForMove: false,
      tasks: [
        { id: 'task_o4', text: 'Boeken en decoratie inpakken', completed: true, category: 'INPAKKEN', createdAt: now },
        { id: 'task_o5', text: 'Schroeven en pluggen uit muren verwijderen en plamuren', completed: false, category: 'KLUSSEN', createdAt: now },
        { id: 'task_o6', text: 'Vloer stofzuigen en dweilen na leeghalen', completed: false, category: 'POETSEN', createdAt: now },
      ],
      orderIndex: 21,
    },
    {
      id: 'room_old_slaapkamer',
      floorId: 'floor_old_1e',
      name: 'Slaapkamer (Oud)',
      houseType: 'OLD',
      isReadyForMove: true, // Example of already completely ready!
      tasks: [
        { id: 'task_o7', text: 'Kledingkasten volledig leeggemaakt', completed: true, category: 'INPAKKEN', createdAt: now },
        { id: 'task_o8', text: 'Ramen gelapt en vensterbank schoon', completed: true, category: 'POETSEN', createdAt: now },
        { id: 'task_o9', text: 'Kamer gestofzuigd en gecontroleerd', completed: true, category: 'POETSEN', createdAt: now },
      ],
      orderIndex: 22,
    },
    {
      id: 'room_old_badkamer',
      floorId: 'floor_old_1e',
      name: 'Badkamer (Oud)',
      houseType: 'OLD',
      isReadyForMove: false,
      tasks: [
        { id: 'task_o10', text: 'Douche en kranen ontkalken', completed: true, category: 'POETSEN', createdAt: now },
        { id: 'task_o11', text: 'Toilet grondig reinigen', completed: false, category: 'POETSEN', createdAt: now },
        { id: 'task_o12', text: 'Toiletartikelen in nooddoos stoppen', completed: false, category: 'INPAKKEN', createdAt: now },
      ],
      orderIndex: 23,
    },
    {
      id: 'room_old_berging',
      floorId: 'floor_old_gelijkvloers',
      name: 'Berging / Hal (Oud)',
      houseType: 'OLD',
      isReadyForMove: false,
      tasks: [
        { id: 'task_o13', text: 'Schoenen en jassen inpakken', completed: true, category: 'INPAKKEN', createdAt: now },
        { id: 'task_o14', text: 'Meters vrijmaken voor opname meterstanden', completed: false, category: 'OVERIG', createdAt: now },
      ],
      orderIndex: 24,
    },
  ];

  const boxes: Box[] = [
    {
      id: 'BOX-001',
      boxNumber: 1,
      title: 'Boeken & Tijdschriften',
      items: ['Romans', 'Fotoboeken', 'Stripboeken', 'Documentenmappen'],
      fragile: false,
      targetRoomId: 'room_new_woonkamer',
      currentRoomId: 'room_old_woonkamer',
      status: 'IN_OLD_HOUSE',
      notes: 'Zware doos! Met twee personen tillen a.u.b.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'BOX-002',
      boxNumber: 2,
      title: 'Glazen & Wijnglazen',
      items: ['Kristallen wijnglazen (12x)', 'Champagneglazen', 'Waterglazen'],
      fragile: true,
      targetRoomId: 'room_new_keuken',
      currentRoomId: 'room_old_keuken',
      status: 'IN_OLD_HOUSE',
      notes: 'ZEER BREEKBAAR! Niet stapelen a.u.b.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'BOX-003',
      boxNumber: 3,
      title: 'Pannen & Kookgerei',
      items: ['Koekenpannen', 'Kookpotten', 'Snijplanken', 'Messenblok'],
      fragile: false,
      targetRoomId: 'room_new_keuken',
      currentRoomId: 'room_old_keuken',
      status: 'IN_OLD_HOUSE',
      notes: 'Voor eerste dag in nieuw huis.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'BOX-004',
      boxNumber: 4,
      title: 'Kantoormateriaal & IT',
      items: ['Schermen (2x)', 'Kabels en adapters', 'Toetsenbord & muis', 'Externe harde schijven'],
      fragile: true,
      targetRoomId: 'room_new_bureau',
      currentRoomId: 'room_new_bureau',
      status: 'IN_TRANSIT',
      notes: 'Voorzichtig met monitorpanelen.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'BOX-005',
      boxNumber: 5,
      title: 'Winterkleding & Jassen',
      items: ['Dikke jassen', 'Truien', 'Handschoenen & sjaals'],
      fragile: false,
      targetRoomId: 'room_new_slaapkamer_master',
      currentRoomId: 'room_new_slaapkamer_master',
      status: 'MOVED',
      notes: 'Reeds uitgepakt en gecontroleerd.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'BOX-006',
      boxNumber: 6,
      title: 'Speelgoed & Bordspellen',
      items: ['Lego sets', 'Bordspellen (Catan, Ticket to Ride)', 'Puzzels'],
      fragile: false,
      targetRoomId: 'room_new_slaapkamer_2',
      currentRoomId: 'room_new_garage', // Geparkeerd in garage
      status: 'MOVED',
      notes: 'Tijdelijk in garage geparkeerd.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'BOX-007',
      boxNumber: 7,
      title: 'Handdoeken & Bedlinnen',
      items: ['Badhanddoeken (8x)', 'Dekbedovertrekken', 'Kussenslopen'],
      fragile: false,
      targetRoomId: 'room_new_badkamer',
      currentRoomId: 'room_new_badkamer',
      status: 'MOVED',
      notes: '',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'BOX-008',
      boxNumber: 8,
      title: 'Porselein & Servies',
      items: ['Dinerborden (12x)', 'Soepkommen', 'Koffietassen', 'Schalen'],
      fragile: true,
      targetRoomId: 'room_new_eetkamer',
      currentRoomId: 'room_old_woonkamer',
      status: 'IN_TRANSIT',
      notes: 'In noppenfolie gewikkeld.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const meterReadings: MeterReading[] = [
    // Oud Huis meterstanden
    { id: 'm_old_water', houseType: 'OLD', type: 'WATER', name: 'Watermeter', reading: '00412.5', unit: 'm³', date: '2026-11-04', notes: 'Kelder bij hoofdkraan' },
    { id: 'm_old_elec_day', houseType: 'OLD', type: 'ELECTRICITY_DAY', name: 'Elektriciteit Dag / Normaal', reading: '028941', unit: 'kWh', date: '2026-11-04', notes: 'Meter 1.8.1' },
    { id: 'm_old_elec_night', houseType: 'OLD', type: 'ELECTRICITY_NIGHT', name: 'Elektriciteit Nacht / Dal', reading: '019432', unit: 'kWh', date: '2026-11-04', notes: 'Meter 1.8.2' },
    { id: 'm_old_gas', houseType: 'OLD', type: 'GAS', name: 'Aardgas', reading: '008543', unit: 'm³', date: '2026-11-04', notes: 'Meterkast gang' },
    // Nieuw Huis meterstanden
    { id: 'm_new_water', houseType: 'NEW', type: 'WATER', name: 'Watermeter', reading: '00085.2', unit: 'm³', date: '2026-11-04', notes: 'Binnenkomst waterput' },
    { id: 'm_new_elec_day', houseType: 'NEW', type: 'ELECTRICITY_DAY', name: 'Elektriciteit Dag / Normaal', reading: '012400', unit: 'kWh', date: '2026-11-04', notes: 'Digitale meter Fluvius' },
    { id: 'm_new_elec_night', houseType: 'NEW', type: 'ELECTRICITY_NIGHT', name: 'Elektriciteit Nacht / Dal', reading: '008120', unit: 'kWh', date: '2026-11-04', notes: 'Digitale meter Fluvius' },
    { id: 'm_new_gas', houseType: 'NEW', type: 'GAS', name: 'Aardgas', reading: '003210', unit: 'm³', date: '2026-11-04', notes: 'Bijkeuken' },
  ];

  const moveDayTasks: MoveDayTask[] = [
    { id: 'md_1', time: '07:30', title: 'Verhuiswagen ophalen', description: 'Rijbewijs meenemen en tank controleren', completed: false, assignedTo: 'Thomas' },
    { id: 'md_2', time: '08:30', title: 'Ontvangst helpers & koffie', description: 'Briefing geven: breekbare dozen eerst markeren', completed: false },
    { id: 'md_3', time: '09:00', title: 'Inladen grote meubels & zware dozen', description: 'Matrassen in plastic hoezen wikkelen', completed: false },
    { id: 'md_4', time: '11:30', title: 'Meterstanden oud huis noteren & foto maken', description: 'Water, gas en elektra direct in app zetten', completed: false },
    { id: 'md_5', time: '12:30', title: 'Broodjeslunch voor alle verhuizers', description: 'Broodjes en frisdrank voorzien', completed: false },
    { id: 'md_6', time: '14:00', title: 'Aankomst nieuw huis & uitladen', description: 'Helpers sturen op basis van kamerlabels', completed: false },
    { id: 'md_7', time: '17:00', title: 'Sleuteloverdracht & eindinspectie oud huis', description: 'Schoonmaak controleren met eigenaar/verhuurder', completed: false },
    { id: 'md_8', time: '19:00', title: 'Pizza & bedankje helpers', description: 'Afsluiting van de verhuisdag!', completed: false },
  ];

  const defaultGeneralTasks: GeneralTask[] = [
    {
      id: 'gt_1',
      title: 'Brand- & inboedelverzekering overzetten naar nieuw adres',
      category: 'VERZEKERING',
      completed: false,
      status: 'IN_BEHANDELING',
      dueDate: '2026-11-10',
      assignedTo: 'Lode',
      notes: 'Makelaar bellen voor ingangsdatum op dag van sleuteloverdracht',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'gt_2',
      title: 'Internet, wifi & tv verhuisdatum inplannen',
      category: 'TELECOM',
      completed: false,
      status: 'IN_BEHANDELING',
      dueDate: '2026-11-08',
      assignedTo: 'Lode',
      notes: 'Technieker inplannen voor installatie modem in nieuw huis',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'gt_3',
      title: 'Adreswijziging doorgeven bij de gemeente',
      category: 'ADMINISTRATIE',
      completed: false,
      status: 'GEPLAND',
      dueDate: '2026-11-20',
      notes: 'Binnen 8 werkdagen na effectieve verhuisdatum via e-ID/loket',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'gt_4',
      title: 'Energieovernamedocument (water, gas, elektriciteit) downloaden',
      category: 'NUTSEENHEDEN',
      completed: true,
      status: 'OK',
      notes: 'Documenten klaarleggen om samen met koper/verhuurder te ondertekenen',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'gt_5',
      title: 'Verhuiswagen of bestelwagen reserveren',
      category: 'VERVOER',
      completed: true,
      status: 'OK',
      dueDate: '2026-11-05',
      assignedTo: 'Lode',
      notes: 'Opgehaald met laadklep, spanbanden en steekkarretjes',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'gt_6',
      title: 'Parkeerverbodsborden aanvragen bij politie / gemeente',
      category: 'VERVOER',
      completed: false,
      status: 'NOK',
      dueDate: '2026-11-07',
      notes: 'OPGELET: Vergunning nog niet bevestigd door de politie voor nieuw adres!',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'gt_7',
      title: 'Afvalcontainers & afvalkalender aanvragen voor nieuw huis',
      category: 'ADMINISTRATIE',
      completed: false,
      status: 'GEPLAND',
      notes: 'Intercommunale bellen voor containerchips en ophaaldagen',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'gt_8',
      title: 'Bank, werkgever, ziekenfonds & abonnementen inlichten',
      category: 'ADMINISTRATIE',
      completed: false,
      status: 'GEPLAND',
      notes: 'Nieuw adres doorgeven',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'gt_9',
      title: 'Sleuteloverdracht & eindinspectie plannen',
      category: 'OPLEVERING',
      completed: false,
      status: 'GEPLAND',
      dueDate: '2026-11-15',
      notes: 'Alle sleutels verzamelen (ook kelder, brievenbus, garage)',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'gt_10',
      title: 'Inpakmateriaal controleren (tape, noppenfolie, etiketten)',
      category: 'OVERIG',
      completed: true,
      status: 'OK',
      notes: 'Dymo rol 41x89mm geladen en extra dozen klaar',
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    users: [initialAdmin],
    floors,
    rooms,
    boxes,
    settings: DEFAULT_SETTINGS,
    meterReadings,
    moveDayTasks,
    generalTasks: defaultGeneralTasks,
    addressChanges: DEFAULT_ADDRESS_CHANGES,
    keyHandovers: DEFAULT_KEY_HANDOVERS,
    importantDocuments: DEFAULT_IMPORTANT_DOCUMENTS,
    isFirstRun: true,
    initialAdminCreated: true,
  };
}

let memoryDb: StoredDatabase | null = null;

export function loadDatabase(): StoredDatabase {
  if (memoryDb) {
    return memoryDb;
  }

  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(content) as StoredDatabase;
      let modified = false;

      // Bootstrap verify: verify at least 1 admin exists
      const hasAdmin = parsed.users && parsed.users.some(u => u.role === 'admin');
      if (!hasAdmin) {
        parsed.users = parsed.users || [];
        parsed.users.push({
          id: 'user_admin_recovery',
          email: 'admin@verhuizing.local',
          name: 'admin',
          role: 'admin',
          passwordHash: hashPassword('admin123'),
          createdAt: new Date().toISOString(),
        });
        parsed.isFirstRun = true;
        modified = true;
      }

      // Auto-migrate: ensure every floor has houseType
      if (parsed.floors) {
        parsed.floors.forEach(f => {
          if (!f.houseType) {
            f.houseType = f.id.includes('old') ? 'OLD' : 'NEW';
            modified = true;
          }
        });
      }

      // Auto-migrate: ensure every room has houseType & tasks array
      if (parsed.rooms) {
        parsed.rooms.forEach(r => {
          if (!r.houseType) {
            r.houseType = r.id.includes('old') ? 'OLD' : 'NEW';
            modified = true;
          }
          if (r.tasks === undefined) {
            r.tasks = [];
            modified = true;
          }
          if (r.isReadyForMove === undefined && r.houseType === 'OLD') {
            r.isReadyForMove = false;
            modified = true;
          }
        });
      }

      // Ensure Old House has floors and rooms if missing
      const hasOldFloors = parsed.floors && parsed.floors.some(f => f.houseType === 'OLD');
      if (!hasOldFloors) {
        parsed.floors = parsed.floors || [];
        parsed.floors.push(
          { id: 'floor_old_gelijkvloers', name: 'Gelijkvloers', houseType: 'OLD', orderIndex: 10 },
          { id: 'floor_old_1e', name: '1e Verdieping', houseType: 'OLD', orderIndex: 11 }
        );
        modified = true;
      }

      const hasOldRooms = parsed.rooms && parsed.rooms.some(r => r.houseType === 'OLD');
      if (!hasOldRooms) {
        parsed.rooms = parsed.rooms || [];
        const now = new Date().toISOString();
        parsed.rooms.push(
          {
            id: 'room_old_keuken',
            floorId: 'floor_old_gelijkvloers',
            name: 'Keuken (Oud)',
            houseType: 'OLD',
            isReadyForMove: false,
            tasks: [
              { id: `task_${Date.now()}_1`, text: 'Kasten leegmaken en servies inpakken', completed: false, category: 'INPAKKEN', createdAt: now },
              { id: `task_${Date.now()}_2`, text: 'Oven en fornuis ontvetten', completed: false, category: 'POETSEN', createdAt: now },
            ],
            orderIndex: 20,
          },
          {
            id: 'room_old_woonkamer',
            floorId: 'floor_old_gelijkvloers',
            name: 'Woonkamer (Oud)',
            houseType: 'OLD',
            isReadyForMove: false,
            tasks: [
              { id: `task_${Date.now()}_3`, text: 'Spijkers uit muren halen en gaatjes plamuren', completed: false, category: 'KLUSSEN', createdAt: now },
              { id: `task_${Date.now()}_4`, text: 'Laatste boeken inpakken', completed: true, category: 'INPAKKEN', createdAt: now },
            ],
            orderIndex: 21,
          },
          {
            id: 'room_old_slaapkamer',
            floorId: 'floor_old_1e',
            name: 'Slaapkamer (Oud)',
            houseType: 'OLD',
            isReadyForMove: true,
            tasks: [
              { id: `task_${Date.now()}_5`, text: 'Kasten leeggemaakt en gestofzuigd', completed: true, category: 'POETSEN', createdAt: now },
            ],
            orderIndex: 22,
          }
        );
        modified = true;
      }

      // Ensure MeterReadings exists
      if (!parsed.meterReadings || parsed.meterReadings.length === 0) {
        parsed.meterReadings = [
          { id: 'm_old_water', houseType: 'OLD', type: 'WATER', name: 'Watermeter', reading: '00412.5', unit: 'm³', date: '2026-11-04' },
          { id: 'm_old_elec_day', houseType: 'OLD', type: 'ELECTRICITY_DAY', name: 'Elektriciteit Dag / Normaal', reading: '028941', unit: 'kWh', date: '2026-11-04' },
          { id: 'm_old_elec_night', houseType: 'OLD', type: 'ELECTRICITY_NIGHT', name: 'Elektriciteit Nacht / Dal', reading: '019432', unit: 'kWh', date: '2026-11-04' },
          { id: 'm_old_gas', houseType: 'OLD', type: 'GAS', name: 'Aardgas', reading: '008543', unit: 'm³', date: '2026-11-04' },
          { id: 'm_new_water', houseType: 'NEW', type: 'WATER', name: 'Watermeter', reading: '00085.2', unit: 'm³', date: '2026-11-04' },
          { id: 'm_new_elec_day', houseType: 'NEW', type: 'ELECTRICITY_DAY', name: 'Elektriciteit Dag / Normaal', reading: '012400', unit: 'kWh', date: '2026-11-04' },
          { id: 'm_new_elec_night', houseType: 'NEW', type: 'ELECTRICITY_NIGHT', name: 'Elektriciteit Nacht / Dal', reading: '008120', unit: 'kWh', date: '2026-11-04' },
          { id: 'm_new_gas', houseType: 'NEW', type: 'GAS', name: 'Aardgas', reading: '003210', unit: 'm³', date: '2026-11-04' },
        ];
        modified = true;
      }

      // Ensure MoveDayTasks exists
      if (!parsed.moveDayTasks || parsed.moveDayTasks.length === 0) {
        parsed.moveDayTasks = [
          { id: 'md_1', time: '07:30', title: 'Verhuisbus ophalen', description: 'Rijbewijs meenemen en tankstand noteren', completed: false },
          { id: 'md_2', time: '08:30', title: 'Koffie & briefing helpers', description: 'Dozen per kamer toelichten', completed: false },
          { id: 'md_3', time: '09:00', title: 'Inladen meubels & zware dozen', description: 'Grote stukken eerst vastzetten', completed: false },
          { id: 'md_4', time: '11:30', title: 'Meterstanden oud huis noteren & foto nemen', description: 'Water, gas en elektriciteit registreren in app', completed: false },
          { id: 'md_5', time: '12:30', title: 'Lunch voor helpers', description: 'Broodjes voorzien', completed: false },
          { id: 'md_6', time: '14:00', title: 'Uitladen nieuw huis via QR-scanner', description: 'Helpers scannen en plaatsen direct in juiste kamer', completed: false },
          { id: 'md_7', time: '17:00', title: 'Sleuteloverdracht & inspectie oud huis', description: 'Eindronde met eigenaar/verhuurder', completed: false },
        ];
        modified = true;
      }

      // Ensure GeneralTasks exists
      if (!parsed.generalTasks || parsed.generalTasks.length === 0) {
        const nowStr = new Date().toISOString();
        parsed.generalTasks = [
          {
            id: 'gt_1',
            title: 'Brand- & inboedelverzekering overzetten naar nieuw adres',
            category: 'VERZEKERING',
            status: 'IN_BEHANDELING',
            completed: false,
            dueDate: '2026-11-10',
            assignedTo: 'Lode',
            notes: 'Makelaar bellen voor ingangsdatum op dag van sleuteloverdracht',
            createdAt: nowStr,
            updatedAt: nowStr,
          },
          {
            id: 'gt_2',
            title: 'Internet, wifi & tv verhuisdatum inplannen',
            category: 'TELECOM',
            status: 'NOK',
            completed: false,
            dueDate: '2026-11-08',
            assignedTo: 'Lode',
            notes: 'Technieker inplannen voor installatie modem in nieuw huis (aandacht nodig: wachttijd 2 weken!)',
            createdAt: nowStr,
            updatedAt: nowStr,
          },
          {
            id: 'gt_3',
            title: 'Adreswijziging doorgeven bij de gemeente',
            category: 'ADMINISTRATIE',
            status: 'GEPLAND',
            completed: false,
            dueDate: '2026-11-20',
            notes: 'Binnen 8 werkdagen na effectieve verhuisdatum via e-ID/loket',
            createdAt: nowStr,
            updatedAt: nowStr,
          },
          {
            id: 'gt_4',
            title: 'Energieovernamedocument (water, gas, elektriciteit) downloaden',
            category: 'NUTSEENHEDEN',
            status: 'OK',
            completed: true,
            notes: 'Documenten klaarleggen om samen met koper/verhuurder te ondertekenen',
            createdAt: nowStr,
            updatedAt: nowStr,
          },
          {
            id: 'gt_5',
            title: 'Verhuiswagen of bestelwagen reserveren',
            category: 'VERVOER',
            status: 'OK',
            completed: true,
            dueDate: '2026-11-05',
            assignedTo: 'Lode',
            notes: 'Opgehaald met laadklep, spanbanden en steekkarretjes',
            createdAt: nowStr,
            updatedAt: nowStr,
          },
          {
            id: 'gt_6',
            title: 'Parkeerverbodsborden aanvragen bij politie / gemeente',
            category: 'VERVOER',
            status: 'GEPLAND',
            completed: false,
            dueDate: '2026-11-07',
            notes: 'Zowel voor oud huis als nieuw huis om vrije parkeerplek voor de vrachtwagen te garanderen',
            createdAt: nowStr,
            updatedAt: nowStr,
          },
          {
            id: 'gt_7',
            title: 'Afvalcontainers & afvalkalender aanvragen voor nieuw huis',
            category: 'ADMINISTRATIE',
            status: 'GEPLAND',
            completed: false,
            notes: 'Intercommunale bellen voor containerchips en ophaaldagen',
            createdAt: nowStr,
            updatedAt: nowStr,
          },
          {
            id: 'gt_8',
            title: 'Bank, werkgever, ziekenfonds & abonnementen inlichten',
            category: 'ADMINISTRATIE',
            status: 'GEPLAND',
            completed: false,
            notes: 'Nieuw adres doorgeven',
            createdAt: nowStr,
            updatedAt: nowStr,
          },
          {
            id: 'gt_9',
            title: 'Sleuteloverdracht & eindinspectie plannen',
            category: 'OPLEVERING',
            status: 'GEPLAND',
            completed: false,
            dueDate: '2026-11-15',
            notes: 'Alle sleutels verzamelen (ook kelder, brievenbus, garage)',
            createdAt: nowStr,
            updatedAt: nowStr,
          },
          {
            id: 'gt_10',
            title: 'Inpakmateriaal controleren (tape, noppenfolie, etiketten)',
            category: 'OVERIG',
            status: 'OK',
            completed: true,
            notes: 'Dymo rol 41x89mm geladen en extra dozen klaar',
            createdAt: nowStr,
            updatedAt: nowStr,
          },
        ];
        modified = true;
      }

      // Ensure addressChanges exists
      if (!parsed.addressChanges || parsed.addressChanges.length === 0) {
        parsed.addressChanges = DEFAULT_ADDRESS_CHANGES;
        modified = true;
      }

      // Ensure keyHandovers exists
      if (!parsed.keyHandovers || parsed.keyHandovers.length === 0) {
        parsed.keyHandovers = DEFAULT_KEY_HANDOVERS;
        modified = true;
      }

      // Ensure importantDocuments exists
      if (!parsed.importantDocuments || parsed.importantDocuments.length === 0) {
        parsed.importantDocuments = DEFAULT_IMPORTANT_DOCUMENTS;
        modified = true;
      }

      // Ensure qrBaseUrl exists in settings
      if (!parsed.settings) {
        parsed.settings = DEFAULT_SETTINGS;
        modified = true;
      } else if (!parsed.settings.qrBaseUrl) {
        parsed.settings.qrBaseUrl = 'https://verhuis.djxload.com';
        modified = true;
      }

      // Ensure every generalTask has a status field
      if (parsed.generalTasks && parsed.generalTasks.length > 0) {
        parsed.generalTasks.forEach((t) => {
          if (!t.status) {
            t.status = t.completed ? 'OK' : 'GEPLAND';
            modified = true;
          }
        });
      }

      if (modified) {
        saveDatabase(parsed);
      }

      memoryDb = parsed;
      return memoryDb;
    }
  } catch (err) {
    console.error('Fout bij laden database.json:', err);
  }

  const initial = getInitialDatabase();
  saveDatabase(initial);
  memoryDb = initial;
  return memoryDb;
}

export function saveDatabase(data: StoredDatabase): void {
  memoryDb = data;
  try {
    const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Fout bij opslaan database.json:', err);
  }
}
