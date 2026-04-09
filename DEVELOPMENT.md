# 🚀 NEXORA v4 - Guida Sviluppo

## 📋 Prerequisiti

- Node.js 18+ 
- PostgreSQL 14+
- Redis (opzionale per cache)
- Git

## 🛠️ Setup Rapido

### 1. Installazione Dipendenze
```bash
cd "c:\Users\User\Desktop\NEXORA v4"
npm install --legacy-peer-deps
```

### 2. Configurazione Database
```bash
# Copia file ambiente
cp .env.example .env.local

# Modifica .env.local con le tue credenziali
DATABASE_URL="postgresql://username:password@localhost:5432/NEXORA_v4"
```

### 3. Inizializza Database
```bash
# Genera Prisma client
npx prisma generate

# Esegui migrazioni
npx prisma db push

# Seed database (opzionale)
npx prisma db seed
```

### 4. Avvia Sviluppo
```bash
npm run dev
```

Visita `http://localhost:3000`

## 🏗️ Architettura Progetto

```
NEXORA v4/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Autenticazione pages
│   ├── dashboard/         # Dashboard
│   ├── invoices/          # Gestione fatture
│   └── analytics/         # Analytics
├── components/            # React components
│   └── ui/               # UI components base
├── lib/                  # Utility libraries
│   ├── auth.ts          # NextAuth config
│   ├── prisma.ts        # Prisma client
│   └── template-engine.ts # Template system
├── prisma/               # Database schema
└── public/              # Static assets
```

## 🔧 Comandi Utili

### Sviluppo
```bash
npm run dev          # Avvia server sviluppo
npm run build        # Build produzione
npm run start        # Avvia server produzione
npm run lint         # Esegui linting
```

### Database
```bash
npx prisma studio    # Apri Prisma Studio
npx prisma generate  # Rigenera client
npx prisma db push   # Applica schema
npx prisma migrate   # Crea migrazione
```

### Testing
```bash
npm run test         # Esegui test
npm run test:watch   # Test in watch mode
npm run coverage     # Coverage report
```

## 🎯 Funzionalità Principali

### ✅ Completate
- ✅ Architettura microservices
- ✅ Database schema completo
- ✅ Sistema autenticazione avanzato
- ✅ UI components moderni
- ✅ Dashboard analytics
- ✅ Form fattura intelligente
- ✅ Template engine dinamico

### 🚧 In Sviluppo
- 🔄 API endpoints completi
- 🔄 Real-time WebSocket
- 🔄 AI integration
- 🔄 Email notifications
- 🔄 File upload system

### 📋 Piano Futuro
- 📱 Mobile app (React Native)
- 🤖 Advanced AI features
- 🌐 Multi-language support
- 📊 Advanced reporting
- 🔗 Third-party integrations

## 🎨 UI Components

### Base Components
- **Card** - Container layout
- **Button** - Pulsanti varianti
- **Input** - Form inputs
- **Select** - Dropdown menus
- **Dialog** - Modal popup
- **Badge** - Status badges

### Advanced Components
- **Dashboard** - Main dashboard
- **InvoiceForm** - Form fattura
- **AnalyticsDashboard** - Analytics real-time
- **SignInForm** - Autenticazione

## 📊 Database Schema

### Entità Principali
- **Tenant** - Multi-tenancy
- **User** - Utenti e ruoli
- **Company** - Aziende
- **Customer** - Clienti
- **Invoice** - Fatture
- **Product** - Prodotti
- **Payment** - Pagamenti

### Relazioni
- Multi-tenancy completo
- Audit logging automatico
- Soft deletes
- Timestamp tracking

## 🔐 Sicurezza

### Autenticazione
- NextAuth.js integration
- OAuth providers (Google, Microsoft)
- Biometric authentication
- JWT tokens

### Autorizzazione
- Role-based access control
- Permission system granulare
- API rate limiting
- Data encryption

## 🚀 Deploy

### Vercel (Raccomandato)
```bash
# Installa Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Docker
```bash
# Build image
docker build -t nexora .

# Run container
docker run -p 3000:3000 nexora
```

### Self-hosted
```bash
# Build
npm run build

# Start
npm run start
```

## 🐛 Debug & Troubleshooting

### Common Issues
1. **Database connection** - Verifica DATABASE_URL
2. **Port conflicts** - Cambia porta in .env.local
3. **Permission errors** - Controlla permessi file
4. **Memory issues** - Aumenta Node.js heap

### Logs
```bash
# Development logs
npm run dev

# Production logs
npm run start

# Database logs
npx prisma studio
```

## 📚 Risorse

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)

## 🤝 Contributi

1. Fork repository
2. Crea feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## 📞 Support

- 📧 Email: support@nexora.com
- 💬 Discord: [NEXORA v4 Community]
- 📖 Docs: [docs.nexora.com]

---

**NEXORA v4** - Il futuro del business management è qui! 🚀
