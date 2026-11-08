# 📦 VerhuisManager — Docker-Ready Verhuisbeheer

Een complete, mobielvriendelijke webapplicatie ontworpen om uw verhuizing soepel en overzichtelijk te laten verlopen. Beheer verhuisdozen, genereer en print **Dymo-stickers op maat** (inclusief QR-codes), scan dozen op de verhuisdag met de smartphone-camera en wijs kamers toe in uw nieuwe woning.

---

## 🚀 Snelle Start met Docker

De applicatie is direct voorzien van een productie-klare `Dockerfile` en `docker-compose.yml`.

### 1. Starten met Docker Compose
Navigeer in de terminal naar de map van dit project en start de container:

```bash
docker compose up -d --build
```

De applicatie start op **`http://localhost:3000`** (of het lokale IP-adres van uw server/NAS).

### 2. Gegevenspersistentie (Data Volume)
Alle data (dozen, kamers, verdiepingen, gebruikers en instellingen) wordt persistent opgeslagen in de lokale map `./data` op uw host-systeem, gemount naar `/app/data` in de container. Zelfs als u de container herstart of update, blijft alle verhuisdata veilig bewaard.

---

## 🔑 Eerste Opstart & Inloggen (Bootstrap)

Bij de allereerste keer opstarten controleert VerhuisManager automatisch of er al een beheerder bestaat. Zo niet, dan wordt automatisch het volgende initiële admin-account aangemaakt:

- **E-mailadres / Gebruikersnaam:** `admin@verhuizing.local`
- **Wachtwoord:** `admin123`

### Twee Inlogmethoden:
1. **Admin Inloggen:** Voor het aanmaken van dozen, printen van labels, instellen van verdiepingen/kamers en beheren van accounts.
2. **Gast / Helper Inloggen (1-Tik):** Op de verhuisdag kunnen familieleden, vrienden en verhuizers via hun mobiel met één klik direct binnenkomen **zonder wachtwoord**. Zij krijgen direct toegang tot de mobiele camera-scanner en kunnen dozen op *Verhuisd* zetten.

---

## 🏷️ Dymo-Labelprinter & Stickerformaat

De applicatie ondersteunt thermische labelprinters (zoals de Dymo LabelWriter-serie).

- **Standaard Formaat:** **89 mm breed × 41 mm hoog** (exact geconfigureerd volgens uw specificatie).
- **Aanpasbare Afmetingen:** In het printscherm of in de instellingen kunt u de breedte en hoogte in millimeters te allen tijde live aanpassen (bv. naar Dymo 99010 89×36 mm, Dymo 99014 101×54 mm of Dymo 4XL 104×159 mm).
- **Wat staat er op de sticker?**
  - Groot en duidelijk doosnummer (`#001`, `#002`, ...)
  - Unieke QR-code (wanneer gescand met een smartphone opent direct de doospagina)
  - Doelruimte in het nieuwe huis in vette opvallende balk
  - Breekbaar-indicator (**BREEKBAAR / FRAGILE**) met waarschuwingsicoon indien van toepassing
  - Beknopte inhoudsopgave van de eerste items in de doos

### Print-instructies:
1. Klik in het dashboard op **Dymo Labels** of bij een doos op **Print Dymo Sticker**.
2. Selecteer in de afdrukdialoog van uw browser uw Dymo-printer.
3. Zet de paginamarges op **"Geen"** (of "None") voor een perfecte randloze thermische afdruk.

---

## 🏠 Hiërarchisch Locatiebeheer & Garage Fallback

1. **Verdiepingen & Kamers:**
   - Maak eenvoudig verdiepingen aan (bijv. *Kelder*, *Gelijkvloers*, *1e Verdieping*, *Zolder*).
   - Voeg per verdieping kamers toe (bijv. *Keuken*, *Woonkamer*, *Master Slaapkamer*, *Garage*).
2. **Standaard Fallback Locatie (Garage):**
   - Wanneer een helper een doos scant en op 'Verhuisd' tikt zonder een specifieke kamer te selecteren, wijst het systeem de doos automatisch toe aan de **Garage (Buffer / Noodopslag)**.
   - Het dashboard toont een duidelijke melding wanneer er dozen in de garage staan die eigenlijk naar een andere ruimte moeten zodra die kamer vrij is.

---

## 🛠️ Lokale Ontwikkeling Zonder Docker

Wilt u de app lokaal ontwikkelen met Node.js:

```bash
# Dependencies installeren
npm install

# Ontwikkelserver starten (Express + Vite HMR op poort 3000)
npm run dev

# Productie-build testen
npm run build
npm start
```

---

## ⚙️ Omgevingsvariabelen

| Variabele | Standaardwaarde | Omschrijving |
| :--- | :--- | :--- |
| `PORT` | `3000` | Poort waarop de Express server luistert |
| `NODE_ENV` | `production` | Omgeving (`development` of `production`) |
| `DATA_DIR` | `/app/data` | Map waarin de database en backup-bestanden worden opgeslagen |
