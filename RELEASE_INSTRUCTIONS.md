# RELEASE INSTRUCTIONS

Questa guida spiega come pubblicare manualmente la **demo Windows** di NEXORA su GitHub Releases e come collegarla correttamente al pulsante download della landing page.

## Obiettivo

Pubblicare un installer demo scaricabile da questo URL:

```text
https://github.com/gaetanomeli95-lab/nexora-v4-gestionale-aziendale/releases/latest/download/NEXORA-Demo-Setup.exe
```

## 1. Genera l'installer demo

Dal progetto esegui:

```bash
npm run build:electron:demo
```

L'output viene generato in:

```text
dist-electron/demo/
```

Il file prodotto da `electron-builder` ha normalmente un nome simile a:

```text
NEXORA-Demo-Setup-4.0.0.exe
```

## 2. Prepara il file con nome stabile

Per fare in modo che il link `releases/latest/download/NEXORA-Demo-Setup.exe` funzioni sempre senza cambiare codice, il file da caricare nella release deve chiamarsi esattamente:

```text
NEXORA-Demo-Setup.exe
```

### Opzione consigliata

Rinomina il file generato prima del caricamento:

```text
Da: NEXORA-Demo-Setup-4.0.0.exe
A:  NEXORA-Demo-Setup.exe
```

## 3. Crea una nuova release su GitHub

1. Apri il repository:
   - `https://github.com/gaetanomeli95-lab/nexora-v4-gestionale-aziendale`
2. Vai su **Releases**.
3. Clicca **Draft a new release**.
4. Inserisci un tag, ad esempio:
   - `v4.0.0-demo`
5. Inserisci un titolo, ad esempio:
   - `NEXORA Demo 4.0.0`
6. Scrivi una breve descrizione release.
7. Trascina dentro il file:
   - `NEXORA-Demo-Setup.exe`
8. Pubblica la release con **Publish release**.

## 4. Verifica il link di download

Dopo la pubblicazione, controlla che questo URL funzioni nel browser:

```text
https://github.com/gaetanomeli95-lab/nexora-v4-gestionale-aziendale/releases/latest/download/NEXORA-Demo-Setup.exe
```

Se parte il download, la landing page è già correttamente collegata.

## 5. Se vuoi mantenere il nome versione nel file

Se preferisci caricare il file con nome versione, ad esempio:

```text
NEXORA-Demo-Setup-4.0.0.exe
```

allora devi aggiornare il pulsante download della landing page.

### Soluzione consigliata

Imposta la variabile ambiente:

```text
NEXT_PUBLIC_DEMO_DOWNLOAD_URL
```

con il link esatto dell'asset caricato.

Esempio:

```text
https://github.com/gaetanomeli95-lab/nexora-v4-gestionale-aziendale/releases/download/v4.0.0-demo/NEXORA-Demo-Setup-4.0.0.exe
```

## 6. Dove aggiornare il pulsante download

La landing page legge prima la variabile ambiente pubblica e, se non esiste, usa il fallback hardcoded.

File coinvolto:

```text
app/page.tsx
```

Variabile supportata:

```text
NEXT_PUBLIC_DEMO_DOWNLOAD_URL
```

## 7. Aggiornamento su Vercel

Se la landing è deployata su Vercel:

1. Apri il progetto su Vercel.
2. Vai in **Settings**.
3. Apri **Environment Variables**.
4. Aggiungi o aggiorna:
   - `NEXT_PUBLIC_DEMO_DOWNLOAD_URL`
5. Salva.
6. Esegui un nuovo deploy.

## 8. Checklist finale

- **Installer demo generato**
- **Nome file corretto per il download pubblico**
- **Release GitHub pubblicata**
- **Link `latest/download` verificato**
- **Landing page aggiornata solo se necessario**
- **Deploy Vercel riallineato se usi una URL custom**
