# NEXORA V4

Gestionale moderno per aziende e professionisti, con interfaccia web in Next.js, moduli operativi completi e distribuzione desktop Windows tramite Electron.

> 🚀 **Stato release:** al momento è pubblica la **versione DEMO**. La versione completa sarà disponibile a breve.

## Download rapido

- **Landing pubblica:** `app/page.tsx`
- **Repository GitHub:** `https://github.com/gaetanomeli95-lab/NEXORA-V4-Gestionale-aziendale-`
- **GitHub Releases:** `https://github.com/gaetanomeli95-lab/NEXORA-V4-Gestionale-aziendale-/releases`
- **Demo Windows:** `https://github.com/gaetanomeli95-lab/NEXORA-V4-Gestionale-aziendale-/releases/latest/download/NEXORA-Demo-Setup.exe`

## Cosa include NEXORA

- **CRM e clienti**
  - anagrafiche clienti, storico, dashboard operativa
- **Documenti commerciali**
  - preventivi, ordini, DDT, fatture e pagamenti
- **Magazzino**
  - prodotti, categorie, fornitori, movimenti e giacenze
- **Riparazioni e cassa**
  - workflow tecnici, stato lavori, cash-book e stampa documenti
- **Analytics e report**
  - report vendite, indicatori sintetici e stampe PDF
- **Desktop Windows**
  - build demo e build full con installer dedicati

## Installazione per utenti finali (Windows)

### Requisiti minimi

- **Sistema operativo:** Windows 10 o Windows 11
- **Architettura:** 64 bit
- **Connessione internet:** consigliata per download e aggiornamenti

### Come installare la demo

1. Apri la pagina **Releases** del repository GitHub.
2. Scarica il file `NEXORA-Demo-Setup.exe`.
3. Avvia l'installer con doppio click.
4. Completa il wizard di installazione.
5. Avvia **NEXORA Demo** dal desktop o dal menu Start.

### Se Windows mostra un avviso SmartScreen

1. Clicca **Ulteriori informazioni**.
2. Clicca **Esegui comunque**.

## Avvio locale per sviluppatori

### Requisiti

- **Node.js:** `>= 18.17.0`
- **npm:** `>= 9`
- **Database:** SQLite o PostgreSQL
- **Git:** consigliato

### Setup rapido

```bash
git clone https://github.com/gaetanomeli95-lab/NEXORA-V4-Gestionale-aziendale-.git
cd NEXORA-V4-Gestionale-aziendale-
npm install --legacy-peer-deps
copy .env.example .env.local
npx prisma generate
npx prisma db push
npm run dev
```

Applicazione disponibile su `http://localhost:3000`.

### Verifica qualità minima

```bash
npm run type-check
```

## Variabili ambiente principali

Configura almeno queste variabili in `.env.local` o in Vercel:

- **`DATABASE_URL`**
  - stringa di connessione del database
- **`NEXTAUTH_SECRET`**
  - chiave segreta per NextAuth
- **`NEXTAUTH_URL`**
  - URL pubblico dell'app, ad esempio `http://localhost:3000` o il dominio Vercel
- **`NEXT_PUBLIC_DEMO_DOWNLOAD_URL`**
  - opzionale, usata dalla landing page per il pulsante download demo

## Script utili

```bash
npm run dev
npm run build
npm run start
npm run type-check
npm run build:electron:demo
npm run build:electron:full
```

## Build desktop

### Demo

```bash
npm run build:electron:demo
```

Output previsto in `dist-electron/demo`.

### Full

```bash
npm run build:electron:full
```

Output previsto in `dist-electron/full`.

## Release GitHub della demo

Per pubblicare correttamente l'installer demo e collegarlo al pulsante della landing page, segui la guida:

- **[RELEASE_INSTRUCTIONS.md](./RELEASE_INSTRUCTIONS.md)**

## Deploy su Vercel

### Configurazione consigliata

- **Framework:** Next.js
- **Install Command:** `npm install --legacy-peer-deps`
- **Build Command:** `npm run build`

### Variabili da impostare in Vercel

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_DEMO_DOWNLOAD_URL` (facoltativa ma consigliata)

### Note tecniche

- `next.config.js` è già configurato con `output: 'standalone'`
- è presente un file `vercel.json` per rendere espliciti i comandi di installazione e build

## Struttura principale del progetto

- **`app/`**
  - pagine e route API Next.js
- **`components/`**
  - componenti UI e form condivisi
- **`lib/`**
  - utilità, Prisma, export PDF e integrazioni
- **`prisma/`**
  - schema e seed database
- **`electron/`**
  - runtime desktop e configurazione installer
- **`scripts/`**
  - build helper, packaging e tooling interno

## Documentazione aggiuntiva

- **[INSTALL.md](./INSTALL.md)**
- **[DEVELOPMENT.md](./DEVELOPMENT.md)**
- **[CHANGELOG.md](./CHANGELOG.md)**
- **[SECURITY.md](./SECURITY.md)**

## Supporto

- **GitHub Issues:** `https://github.com/gaetanomeli95-lab/NEXORA-V4-Gestionale-aziendale-/issues`

## Licenza

Questo progetto usa la licenza presente nel file **[LICENSE](./LICENSE)**.
