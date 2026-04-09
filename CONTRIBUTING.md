# 🤝 Contributing to NEXORA v4

Grazie per il tuo interesse a contribuire a NEXORA v4! Questo documento ti guiderà attraverso il processo di contributo.

---

## 📋 **Table of Contents**

- [Come Contribuire](#come-contribuire)
- [Setup di Sviluppo](#setup-di-sviluppo)
- [Processo di Pull Request](#processo-di-pull-request)
- [Code Guidelines](#code-guidelines)
- [Testing](#testing)
- [Documentation](#documentation)
- [Community](#community)

---

## 🚀 **Come Contribuire**

### 🎯 **Aree di Contributo**

- **Bug Fixes**: Risoluzione di problemi esistenti
- **Nuove Features**: Funzionalità innovative
- **Documentation**: Miglioramento documentazione
- **Testing**: Aumento coverage test
- **UI/UX**: Miglioramento interfaccia utente
- **Performance**: Ottimizzazione performance
- **Security**: Miglioramento sicurezza
- **Internationalization**: Traduzioni e localizzazione

### 📝 **Segnala Bug**

1. Controlla se il bug esiste già in [GitHub Issues](https://github.com/NEXORA/v4/issues)
2. Se non esiste, crea una nuova issue con:
   - Titolo descrittivo
   - Passi per riprodurre il problema
   - Comportamento atteso vs attuale
   - Ambiente (OS, browser, versione)
   - Screenshots se applicabile

### 💡 **Suggerisci Features**

1. Apri una issue con tag `enhancement`
2. Descrivi la feature proposta
3. Spiega il caso d'uso
4. Suggerisci implementazione se possibile
5. Discuti con la community prima di iniziare

---

## 🛠️ **Setup di Sviluppo**

### 1. **Fork e Clone**
```bash
# Fork il repository su GitHub
# Clona il tuo fork
git clone https://github.com/TUO_USERNAME/nexora.git
cd nexora

# Aggiungi upstream repository
git remote add upstream https://github.com/NEXORA/v4.git
```

### 2. **Setup Ambiente**
```bash
# Installa dipendenze
npm install --legacy-peer-deps

# Setup ambiente
cp .env.example .env.local

# Genera Prisma client
npx prisma generate

# Setup database
npx prisma db push
```

### 3. **Crea Branch**
```bash
# Sincronizza con upstream
git checkout main
git pull upstream main

# Crea branch feature
git checkout -b feature/nome-feature
```

---

## 📋 **Processo di Pull Request**

### 1. **Pre-Commit Checklist**
- [ ] Codice segue le guidelines
- [ ] Test passano (`npm test`)
- [ ] Linting passed (`npm run lint`)
- [ ] Documentation aggiornata
- [ ] Type checking passed (`npm run type-check`)

### 2. **Commit Guidelines**
```bash
# Formato commit
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: Nuova feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Refactoring
- `test`: Testing
- `chore`: Maintenance

**Examples:**
```bash
feat(auth): add biometric authentication
fix(invoice): resolve calculation error
docs(readme): update installation guide
```

### 3. **Pull Request**
1. Push del branch:
```bash
git push origin feature/nome-feature
```

2. Crea Pull Request su GitHub con:
   - Titolo descrittivo
   - Descrizione dettagliata
   - Screenshots se UI changes
   - Link alle issue correlate
   - Checklist di testing

3. Aspetta review e merge

---

## 📝 **Code Guidelines**

### **TypeScript**
```typescript
// Usa tipi specifici
interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'USER';
}

// Evita any
// ❌ Male
const data: any = getData();

// ✅ Bene
interface DataResponse {
  users: User[];
  total: number;
}
const data: DataResponse = getData();
```

### **React Components**
```tsx
// Usa functional components con hooks
interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary'
}) => {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

### **Naming Conventions**
- **Files**: kebab-case (`invoice-form.tsx`)
- **Components**: PascalCase (`InvoiceForm`)
- **Functions**: camelCase (`calculateTotal`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces**: PascalCase con `I` prefix (`IUser`)

### **File Structure**
```
components/
├── ui/           # Reusable UI components
├── features/     # Feature-specific components
├── layouts/      # Layout components
└── hooks/        # Custom hooks

lib/
├── api/          # API functions
├── utils/        # Utility functions
├── types/        # Type definitions
└── constants/    # Constants
```

---

## 🧪 **Testing**

### **Unit Tests**
```typescript
// __tests__/utils/calculateTotal.test.ts
import { calculateTotal } from '../utils/calculateTotal';

describe('calculateTotal', () => {
  test('should calculate total with tax', () => {
    const result = calculateTotal(100, 22);
    expect(result).toBe(122);
  });

  test('should handle zero amount', () => {
    const result = calculateTotal(0, 22);
    expect(result).toBe(0);
  });
});
```

### **Component Tests**
```typescript
// __tests__/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### **E2E Tests**
```typescript
// e2e/invoice-creation.spec.ts
import { test, expect } from '@playwright/test';

test('can create new invoice', async ({ page }) => {
  await page.goto('/invoices');
  await page.click('[data-testid="new-invoice"]');
  await page.fill('[data-testid="customer-email"]', 'test@example.com');
  await page.click('[data-testid="save-invoice"]');
  
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

### **Coverage Requirements**
- **Unit Tests**: 80% coverage minimo
- **Integration Tests**: Feature coverage
- **E2E Tests**: Critical user paths

---

## 📚 **Documentation**

### **Code Comments**
```typescript
/**
 * Calculates the total amount including tax
 * @param amount - Base amount without tax
 * @param taxRate - Tax rate as percentage (e.g., 22 for 22%)
 * @returns Total amount including tax
 * @throws {Error} When amount is negative
 */
export const calculateTotal = (amount: number, taxRate: number): number => {
  if (amount < 0) {
    throw new Error('Amount cannot be negative');
  }
  
  return amount * (1 + taxRate / 100);
};
```

### **README Updates**
- Aggiorna README per nuove features
- Includi esempi di codice
- Aggiungi screenshot per UI changes
- Aggiorna changelog

### **API Documentation**
- Usa OpenAPI/Swagger per API
- Includi esempi di richiesta/risposta
- Documenta error codes
- Aggiungi try-catch examples

---

## 🌍 **Internationalization**

### **Adding New Language**
1. Crea file in `locales/it/common.json`
2. Aggiungi traduzioni:
```json
{
  "common": {
    "save": "Salva",
    "cancel": "Annulla",
    "loading": "Caricamento..."
  }
}
```

3. Usa in componenti:
```tsx
import { useTranslation } from 'next-i18next';

export const Button: React.FC = () => {
  const { t } = useTranslation('common');
  
  return <button>{t('common.save')}</button>;
};
```

---

## 🎨 **UI/UX Guidelines**

### **Component Design**
- Usa design system esistente
- Mantieni consistenza visiva
- Responsive design obbligatorio
- Accessibility WCAG 2.1

### **Design Tokens**
```typescript
// tokens/colors.ts
export const colors = {
  primary: '#3b82f6',
  secondary: '#6b7280',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};

// tokens/spacing.ts
export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};
```

---

## 🔒 **Security Considerations**

### **Code Security**
- Valida tutti gli input
- Usa parameterized queries
- Sanitize user content
- Implementa rate limiting
- Follow OWASP guidelines

### **Data Protection**
- No hardcoded secrets
- Use environment variables
- Implement proper error handling
- Log security events

---

## 📊 **Performance Guidelines**

### **Optimization**
- Lazy loading components
- Code splitting
- Image optimization
- Bundle size monitoring
- Database query optimization

### **Monitoring**
- Performance metrics
- Error tracking
- User analytics
- A/B testing ready

---

## 🤝 **Community Guidelines**

### **Code of Conduct**
- Sii rispettoso e inclusivo
- Accetta feedback costruttivo
- Aiuta altri contributori
- Segui professional standards

### **Communication**
- Usa issue tracker per discussioni
- Sii chiaro e conciso
- Fornisci contesto adeguato
- Sii paziente con i reviewer

---

## 🏆 **Recognition**

### **Contributor Recognition**
- Hall of Fame in README
- Contributor badges
- Annual awards
- Conference speaking opportunities

### **Benefits**
- Early access to features
- Influence on roadmap
- Networking opportunities
- Learning and growth

---

## 📞 **Getting Help**

### **Resources**
- 📖 [Documentation](./docs/)
- 💬 [Discord Community](https://discord.gg/NEXORA)
- 🐛 [GitHub Issues](https://github.com/NEXORA/v4/issues)
- 📧 [Email](contributions@nexora.com)

### **Support Channels**
- New contributors: #beginners Discord
- Technical help: #help Discord
- Design reviews: #design Discord
- Code reviews: #code-review Discord

---

## 🎉 **Thank You!**

Grazie per il tuo contributo a NEXORA v4! Ogni contributo, grande o piccolo, aiuta a rendere questo progetto migliore.

### **Next Steps**
1. Leggi questo documento completamente
2. Setup il tuo ambiente di sviluppo
3. Trova una issue o proponi una feature
4. Inizia a contribuire!

---

**NEXORA v4 - Built by the community, for the community!** 🚀✨

*Last updated: March 2024*
