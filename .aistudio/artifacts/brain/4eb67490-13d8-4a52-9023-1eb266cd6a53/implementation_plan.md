# Functieschakelaars (Feature Toggles), Responsieve Bovenbalk, Home Assistant Add-on & Data-Anonimisering

Dit implementatieplan breidt VerhuisManager uit met modulaire functie-schakelaars in de instellingen, lost de weergaveproblemen op halve laptopschermen op, anonimiseert alle privégegevens uit de broncode, en levert een kant-en-klaar downloadbaar Home Assistant Add-on & GitHub-pakket inclusief een gedetailleerde stap-voor-stap handleiding.

## Gebruikersbevestiging & Kernkeuzes

> [!IMPORTANT]
> Bevestigde keuzes uit de verduidelijkingsfase:
> 1. **Modulaire Functie-schakelaars (Feature Toggles):**
>    - In de instellingen kan de beheerder functies aan- of uitzetten:
>      - `Dozen & Inpakken` (`boxes`)
>      - `Werkpunten & Taken per Kamer` (`roomTasks`)
>      - `Draaiboek Verhuisdag` (`moveDayTimeline`)
>      - `Dymo Labels Afdrukken` (`dymoLabels`)
>      - `Sleuteloverdracht & Oplevering` (`keyHandover`)
>      - `Meterstanden Opnemen` (`meterReadings`)
>    - **Gedrag bij uitschakelen:** Uitgeschakelde functies worden **volledig verborgen** in de bovenbalk, de mobiele onderbalk, het hamburgermenu en overzichten.
>    - **Standaardstatus:** Bij nieuwe installaties staan **alle functies standaard ingeschakeld**.
> 2. **Bovenbalk op halve schermen (Splitscreen):**
>    - Schakelt op halve vensters en schermen onder 1280px (`xl`) automatisch over naar het compacte hamburgermenu.
>    - Knoppen aan de rechterzijde (Scan, Thema, Menu, Afmelden) blijven altijd 100% zichtbaar en bereikbaar zonder horizontale schuifbalk.
> 3. **Data-Anonimisering & Demomodus:**
>    - Verwijdering van alle hardcoded privégegevens (`verhuis.djxload.com`, "Lode", specifieke datums) uit de codebase.
>    - Reset-opties in instellingen: met 1 klik schakelen tussen **"Neutrale Demodata Laden"** (om de app te testen) of **"Volledig Blanco Starten"** (voor eigen verhuizing).
> 4. **GitHub & Home Assistant Add-on Documentatie:**
>    - Een compleet document `HANDLEIDING_GITHUB_HOME_ASSISTANT.md` in het downloadbare pakket met stap-voor-stap instructies voor:
>      - Het aanmaken van een publieke/private GitHub repository.
>      - Het importeren als Home Assistant Add-on (lokaal via `/addons` of via custom repository).
>      - Configuratie en gebruik met Ingress binnen Home Assistant.

---

## 1. Overzicht & Functionele Werking

```
┌────────────────────────────────────────────────────────────────────────┐
│                        BEHEERPANEEL: INSTELLINGEN                      │
│                                                                        │
│  [x] Dozen & Scanning      [x] Werkpunten kamers    [x] Draaiboek      │
│  [x] Dymo labelprinter     [x] Sleuteloverdracht    [x] Meterstanden   │
│                                                                        │
│  [ Herstel Fictieve Testdata ]     [ Start Blanco Eigen Verhuizing ]   │
│  [ 📦 Download GitHub & Home Assistant Add-on Pakket (.zip) ]          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   DYNAMISCHE EN RESPONSIEVE INTERFACE                  │
│                                                                        │
│  - Actieve functies: zichtbaar in navigatie, drawer en dashboard       │
│  - Gedeactiveerde functies: volledig onzichtbaar (schone interface)    │
│  - Schermbreedte < 1280px: automatische overgang naar hamburgermenu    │
│  - 0% horizontale scroll op laptop splitscreen of tablets             │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Gebruikerservaring & Visueel Ontwerp

### A. Instellingenpaneel voor Functieschakelaars
- In het beheer/instellingenvenster komt een sectie **"Actieve Modules & Functies"**:
  - Elke functie heeft een duidelijke schakelaar (toggle) met een helder label en beschrijving.
  - Zodra een functie wordt uitgeschakeld (bv. *Sleuteloverdracht* of *Dymo Labels*), verdwijnt de bijbehorende navigatieknop direct uit:
    - De desktop bovenbalk
    - Het off-canvas hamburgermenu
    - De mobiele onderbalk
    - De kameroverzichten (voor kamertaken)
  - Dit maakt de app extreem modulair: wie enkel dozen wil beheren, kan een minimalistische app overhouden; wie de volledige verhuizing plant, gebruikt alle modules.

### B. Bovenbalk Layout op Halve Schermen
- Navigatieknoppen in het midden worden enkel getoond bij vol scherm op grote displays (`xl:flex`, $\ge 1280\text{px}$).
- Op split-screen / halve vensters (bv. 800–1100px) worden de middenlinks verborgen en is alle navigatie gecentraliseerd in het **hamburgermenu**.
- De rechter utility-zone (`Scan`, `Thema`, `Menu`, `Afmelden`) behoudt `flex shrink-0` zodat knoppen nooit van het scherm worden geduwd.

### C. Testdata vs. Blanco Eigen Verhuizing
- Twee duidelijke beheeracties met bevestigingsdialoog:
  - **"Fictieve Testdata Laden":** Vult de database met 10 representatieve dozen, kamers (Keuken, Woonkamer, Slaapkamer 1, Badkamer), taken met gevarieerde statussen (OK, NOK, In behandeling) en een neutraal lokaal QR-domein.
  - **"Alles Wissen & Schone Start":** Wist alle testdozen, kamertaken, meterstanden en notities voor een schone start.

### D. Downloadbaar Add-on Pakket & Handleiding
- Knop **"Download GitHub & Home Assistant Add-on Pakket"** genereert een kant-en-klare `.zip` met:
  - Volledige geanonimiseerde broncode (geen privégegevens).
  - `config.yaml`: Home Assistant add-on configuratie met Ingress-ondersteuning en poortmapping.
  - `Dockerfile`: Geoptimaliseerde container voor Home Assistant Supervised / OS.
  - `build.yaml`: Architectuurbeschrijving (amd64, aarch64, armv7).
  - `HANDLEIDING_GITHUB_HOME_ASSISTANT.md`: Uitgebreide Nederlandstalige handleiding met screenshots-stijl instructies, git-commando's en Home Assistant configuratiestappen.

---

## 3. Technische Architectuur & Data Strategy

### 1. Types & Database Schema (`src/types/index.ts` & `server/db.ts`)
```typescript
export interface AppFeatures {
  boxes: boolean;          // Dozen & QR-scanning
  roomTasks: boolean;      // Werkpunten kamers
  moveDayTimeline: boolean;// Draaiboek verhuisdag
  dymoLabels: boolean;     // Dymo labelprinter
  keyHandover: boolean;    // Sleuteloverdracht
  meterReadings: boolean;  // Meterstanden
}

export interface DymoSettings {
  widthMm: number;
  heightMm: number;
  name?: string;
  fontSizeScale?: number;
  showContents?: boolean;
  showFloor?: boolean;
  qrBaseUrl?: string;
  features?: AppFeatures;   // Actieve modules
}
```

### 2. Backend Routes (`server/routes.ts`)
- `POST /api/settings`: Ondersteunt het opslaan van `features` en `qrBaseUrl`.
- `POST /api/settings/reset-demo`: Reset naar neutrale demodata zonder persoonsgegevens.
- `POST /api/settings/reset-clean`: Reset naar blanco database.
- `GET /api/export/addon-bundle`: Downloadt de geanonimiseerde ZIP met add-on bestanden en handleiding.

### 3. Frontend Componenten
- **`src/components/Navbar.tsx`**: Respecteert `appData.settings.features` om menu-items conditioneel te renderen, en schakelt onder `1280px` (`xl`) over naar het hamburgermenu.
- **`src/components/DymoPrintModal.tsx` / Settings**: Bevat de schakelaars voor de modules, de testdata-knoppen en de downloadknop voor het GitHub/HA-pakket.
- **`src/components/RoomsOverviewView.tsx`**: Verbergt werkpunten als `features.roomTasks` uit staat.
- **`src/components/DashboardView.tsx`**: Verbergt Dymo labelprinten als `features.dymoLabels` uit staat.

---

## 4. Uitvoeringsstappen

1. **Schema & Typen:** `AppFeatures` toevoegen aan `src/types/index.ts` en migreren in `server/db.ts` met veilige defaults (alles `true`).
2. **Data-Anonimisering:** Alle hardcoded instanties van `verhuis.djxload.com` en "Lode" vervangen door dynamische defaults (`window.location.origin` / neutrale labels).
3. **API Endpoints:** Reset-demo, reset-clean en export-routes implementeren in `server/routes.ts`.
4. **Home Assistant Bestanden & Handleiding:** Aanmaken van `config.yaml`, `Dockerfile`, `build.yaml` en `HANDLEIDING_GITHUB_HOME_ASSISTANT.md`.
5. **UI Functieschakelaars:** Toevoegen van de feature-toggles en beheeracties in het instellingenpaneel.
6. **Responsieve Navbar:** Aanpassen van breakpoints en verbergen van uitgeschakelde modules.
7. **Verificatie:** Duale verificatie via `compile_applet` en `lint_applet`, controle op halve schermen en testen van de ZIP-export.
