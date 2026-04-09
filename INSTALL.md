# 🚀 Guida Installazione - NEXORA v4

## 📋 **Requisiti di Sistema**

### Minimi
- **Node.js**: 18.0.0 o superiore
- **RAM**: 4GB+
- **Spazio Disco**: 2GB liberi
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 20.04+

### Consigliati
- **Node.js**: 20.0.0+
- **RAM**: 8GB+
- **Spazio Disco**: 5GB+ SSD
- **Database**: PostgreSQL 14+

### Opzionali
- **Redis**: Per cache e sessioni
- **Docker**: Per container deployment
- **Git**: Per version control

---

## ⚡ **Installazione Rapida (5 minuti)**

### 1. Download & Setup
```bash
# Clona repository (se disponibile)
git clone https://github.com/NEXORA/v4.git
cd nexora

# Oppure usa la cartella esistente
cd "c:\Users\User\Desktop\NEXORA v4"
```

### 2. Installazione Dipendenze
```bash
# Installa tutte le dipendenze
npm install --legacy-peer-deps

# Attendi 5-10 minuti per il completamento
```

### 3. Configurazione Ambiente
```bash
# Copia file di configurazione
copy .env.example .env.local

# Modifica .env.local con i tuoi dati
notepad .env.local
```

### 4. Database Setup
```bash
# Genera Prisma client
npx prisma generate

# Crea database (PostgreSQL deve essere attivo)
npx prisma db push

# Popola con dati demo (opzionale)
npx prisma db seed
```

### 5. Avvia Applicazione
```bash
# Avvia server sviluppo
npm run dev

# Visita http://localhost:3000
```

---

## 🛠️ **Installazione Dettagliata**

### Step 1: Node.js Setup
```bash
# Verifica versione Node.js
node --version  # deve essere 18+

# Se non installato, scarica da:
# https://nodejs.org/
```

### Step 2: Database Setup

#### Opzione A: PostgreSQL (Consigliato)
```bash
# Installa PostgreSQL
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Crea database
psql -U postgres
CREATE DATABASE NEXORA_v4;
CREATE USER NEXORA_user WITH PASSWORD 'tua_password';
GRANT ALL PRIVILEGES ON DATABASE NEXORA_v4 TO NEXORA_user;
\q
```

#### Opzione B: SQLite (Demo/Sviluppo)
```bash
# Modifica .env.local
DATABASE_URL="file:./dev.db"
```

### Step 3: Configurazione Environment
```bash
# Modifica .env.local
DATABASE_URL="postgresql://NEXORA_user:tua_password@localhost:5432/NEXORA_v4"
NEXTAUTH_SECRET="genera-una-secret-key-lunga-e-sicura"
NEXTAUTH_URL="http://localhost:3000"

# Per OAuth providers (opzionale)
GOOGLE_CLIENT_ID="tuo-google-client-id"
GOOGLE_CLIENT_SECRET="tuo-google-secret"
```

### Step 4: Prisma Setup
```bash
# Installa Prisma CLI
npm install -g prisma

# Genera client
npx prisma generate

# Applica schema al database
npx prisma db push

# Verifica schema
npx prisma studio  # apre browser con database
```

### Step 5: Avvio Server
```bash
# Sviluppo
npm run dev

# Produzione
npm run build
npm start
```

---

## 🐳 **Installazione con Docker**

### Docker Compose (Consigliato)
```bash
# Crea docker-compose.yml
cat > docker-compose.yml << EOF
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/NEXORA_v4
      - NEXTAUTH_SECRET=your-secret-here
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=NEXORA_v4
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
EOF

# Avvia container
docker-compose up -d

# Visita http://localhost:3000
```

### Docker Build Manuale
```bash
# Build immagine
docker build -t nexora .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e NEXTAUTH_SECRET="your-secret" \
  nexora
```

---

## 📱 **Setup Development**

### VS Code Setup
```bash
# Installa estensioni consigliate
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension bradlc.vscode-tailwindcss
code --install-extension Prisma.prisma
code --install-extension ms-vscode.vscode-json
```

### Configurazione Git
```bash
# Setup git
git config --global user.name "Tuo Nome"
git config --global user.email "tua@email.com"

# Inizializza repository
git init
git add .
git commit -m "Initial commit - NEXORA v4"
```

---

## 🔧 **Troubleshooting**

### Problemi Comuni

#### "Port already in use"
```bash
# Trova processo su porta 3000
netstat -ano | findstr :3000

# Termina processo (sostituisci PID)
taskkill /PID <PID> /F

# Oppure cambia porta in .env.local
PORT=3001 npm run dev
```

#### "Database connection failed"
```bash
# Verifica PostgreSQL
psql -U postgres -c "SELECT version();"

# Test connection string
npx prisma db pull

# Usa SQLite per demo
DATABASE_URL="file:./dev.db" npm run dev
```

#### "Module not found"
```bash
# Pulisci e reinstalla
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Clear cache
npm cache clean --force
```

#### "Permission denied"
```bash
# Windows: esegui come Administrator
# macOS/Linux: usa sudo
sudo npm install --legacy-peer-deps
```

#### "Out of memory"
```bash
# Aumenta Node.js heap
set NODE_OPTIONS=--max-old-space-size=4096
npm run dev
```

### Log Debug
```bash
# Verbose output
DEBUG=* npm run dev

# Prisma debug
DEBUG=prisma:* npx prisma db push

# Next.js debug
NEXT_DEBUG=1 npm run dev
```

---

## 🌐 **Deploy Options**

### Vercel (Più Semplice)
```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Setup dominio personalizzato
vercel domains add tuo-dominio.com
```

### Railway
```bash
# Installa Railway CLI
npm i -g @railway/cli

# Login e deploy
railway login
railway init
railway up
```

### Self-Hosted
```bash
# Build per produzione
npm run build

# Setup PM2 per production
npm install -g pm2
pm2 start npm --name "nexora" -- start
```

---

## 📋 **Checklist Post-Installazione**

### ✅ Verifica Funzionalità
- [ ] Homepage carica correttamente
- [ ] Login funziona (demo@nexora.com / demo123)
- [ ] Dashboard mostra dati
- [ ] Creazione fattura funziona
- [ ] Analytics aggiornano in real-time
- [ ] Mobile responsive

### ✅ Configurazione Production
- [ ] Environment variables settate
- [ ] Database backup configurato
- [ ] SSL certificate installato
- [ ] Monitoring attivo
- [ ] Error logging configurato
- [ ] Performance monitoring

### ✅ Security Setup
- [ ] Password di default cambiate
- [ ] HTTPS configurato
- [ ] Firewall attivo
- [ ] Access logs abilitati
- [ ] Rate limiting configurato
- [ ] Security headers settati

---

## 🆘 **Support & Risorse**

### Documentation
- 📖 [Development Guide](./DEVELOPMENT.md)
- 🗺️ [Roadmap](./ROADMAP.md)
- ⚡ [Features](./FEATURES.md)
- 📊 [Comparison](./COMPARISON.md)

### Community
- 💬 Discord: [NEXORA v4 Community]
- 📧 Email: support@nexora.com
- 🐛 Issues: GitHub Issues
- 📖 Docs: docs.nexora.com

### Quick Help
```bash
# Help commands
npm run help          # Mostra tutti i comandi
npx prisma --help     # Help Prisma
next --help           # Help Next.js
```

---

## 🎉 **Success!**

Se vedi la pagina di benvenuto di NEXORA v4, hai completato l'installazione!

**Prossimi passi:**
1. 📖 Leggi `DEVELOPMENT.md` per iniziare a sviluppare
2. 🗺️ Controlla `ROADMAP.md` per vedere le funzionalità in arrivo
3. 🎯 Esplora le feature disponibili in `FEATURES.md`

**Buon lavoro con NEXORA v4!** 🚀✨

---

*NEXORA v4 - Il futuro del business management è qui!*
