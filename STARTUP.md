# 🚀 Quick Start - NEXORA v4

## ⚡ Avvio Rapido (5 minuti)

### 1. Installazione
```bash
cd "c:\Users\User\Desktop\NEXORA v4"
npm install --legacy-peer-deps
```

### 2. Configurazione Base
```bash
# Copia ambiente
copy .env.example .env.local

# Modifica .env.local con i tuoi dati
# DATABASE_URL="postgresql://user:pass@localhost:5432/NEXORA_v4"
# NEXTAUTH_SECRET="tua-secret-key"
```

### 3. Database
```bash
# Genera client Prisma
npx prisma generate

# Crea database (PostgreSQL deve essere attivo)
npx prisma db push
```

### 4. Avvia Applicazione
```bash
npm run dev
```

### 5. Visita
**🌐 http://localhost:3000**

## 🎯 Demo Immediata

Se vuoi testare subito senza configurare database:

```bash
# Avvia con database demo (SQLite)
npm run dev:demo
```

## 📱 Pagine Disponibili

- **Homepage**: `http://localhost:3000`
- **Dashboard**: `http://localhost:3000/dashboard`
- **Fatture**: `http://localhost:3000/invoices`
- **Analytics**: `http://localhost:3000/analytics`
- **Login**: `http://localhost:3000/auth/signin`

## 🔑 Credenziali Demo

```
Email: demo@nexora.com
Password: demo123
```

## 🛠️ Requisiti Minimi

- **Node.js**: 18+
- **Database**: PostgreSQL 14+ (o SQLite per demo)
- **RAM**: 4GB+
- **Spazio**: 2GB

## ⚠️ Note Importanti

1. **Prima avvio**: L'installazione delle dipendenze richiede ~5-10 minuti
2. **Database**: Assicurati che PostgreSQL sia attivo o usa modalità demo
3. **Porta**: Se la porta 3000 è occupata, il server userà automaticamente la 3001
4. **Environment**: Copia SEMPRE `.env.example` in `.env.local`

## 🆘 Problemi Comuni

### "Port already in use"
```bash
# Trova processo sulla porta 3000
netstat -ano | findstr :3000

# Termina processo (sostituisci PID)
taskkill /PID <PID> /F
```

### "Database connection failed"
```bash
# Verifica PostgreSQL
psql -U postgres -c "SELECT version();"

# O usa demo mode
npm run dev:demo
```

### "Module not found"
```bash
# Reinstalla dipendenze
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

## 🎉 Successo!

Se vedi la pagina di benvenuto di NEXORA v4, hai completato l'installazione!

**Prossimo passo**: Leggi `DEVELOPMENT.md` per iniziare a sviluppare.

---

**NEXORA v4** - Pronto in 5 minuti! ⚡
