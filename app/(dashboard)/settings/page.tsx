"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Download, 
  Upload,
  Bell,
  Shield,
  Database,
  Globe,
  Palette,
  Mail,
  CreditCard,
  FileText,
  Users,
  Building,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { PageShell } from '@/components/layout/page-shell'
import { useDesktopRuntime } from '@/components/desktop/desktop-runtime-provider'

const SETTINGS_STORAGE_KEY = 'softshop-v4-settings'

interface SystemSettings {
  company: {
    name: string
    logo: string
    address: string
    city: string
    postalCode: string
    country: string
    phone: string
    email: string
    vatNumber: string
    website: string
  }
  preferences: {
    language: string
    timezone: string
    currency: string
    dateFormat: string
    numberFormat: string
    theme: string
  }
  notifications: {
    emailEnabled: boolean
    smsEnabled: boolean
    pushEnabled: boolean
    lowStockAlerts: boolean
    paymentReminders: boolean
    invoiceOverdue: boolean
    newOrderAlerts: boolean
  }
  integrations: {
    emailProvider: string
    smsProvider: string
    paymentProvider: string
    accountingProvider: string
    stripeKey: string
    paypalKey: string
    quickbooksKey: string
  }
  security: {
    twoFactorAuth: boolean
    ipWhitelist: boolean
    sessionTimeout: number
    passwordPolicy: boolean
    auditLogging: boolean
  }
  backup: {
    enabled: boolean
    frequency: string
    retentionDays: number
    cloudStorage: boolean
    encryption: boolean
  }
  demo: {
    enabled: boolean
    watermark: boolean
    maskSensitiveData: boolean
    disableOutboundMessages: boolean
  }
}

export default function SettingsPage() {
  const { toast } = useToast()
  const { buildFlavor, runtimeType, trialStatus } = useDesktopRuntime()
  const [settings, setSettings] = useState<SystemSettings>({
    company: {
      name: 'NEXORA v4 Enterprise',
      logo: '',
      address: 'Via Roma 123',
      city: 'Roma',
      postalCode: '00100',
      country: 'IT',
      phone: '+39 06 12345678',
      email: 'info@nexora.com',
      vatNumber: 'IT01234567890',
      website: 'https://nexora.com'
    },
    preferences: {
      language: 'it',
      timezone: 'Europe/Rome',
      currency: 'EUR',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'it-IT',
      theme: 'light'
    },
    notifications: {
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      lowStockAlerts: true,
      paymentReminders: true,
      invoiceOverdue: true,
      newOrderAlerts: true
    },
    integrations: {
      emailProvider: 'SMTP',
      smsProvider: 'TWILIO',
      paymentProvider: 'STRIPE',
      accountingProvider: 'NONE',
      stripeKey: '',
      paypalKey: '',
      quickbooksKey: ''
    },
    security: {
      twoFactorAuth: false,
      ipWhitelist: false,
      sessionTimeout: 480,
      passwordPolicy: true,
      auditLogging: true
    },
    backup: {
      enabled: true,
      frequency: 'daily',
      retentionDays: 30,
      cloudStorage: true,
      encryption: true
    },
    demo: {
      enabled: true,
      watermark: true,
      maskSensitiveData: true,
      disableOutboundMessages: true
    }
  })

  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('company')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [resettingDemo, setResettingDemo] = useState(false)
  const [clearingDemo, setClearingDemo] = useState(false)
  const isFullDesktopExperience = buildFlavor === 'full'
  const showLicensingCard = runtimeType === 'electron' && buildFlavor === 'full' && Boolean(trialStatus)
  const missingActivationKey = Boolean(trialStatus?.integrity_flags?.includes('missing_public_key'))
  const showDemoControls = buildFlavor !== 'full'

  const normalizeSettingsForBuildFlavor = (nextSettings: SystemSettings): SystemSettings => {
    if (buildFlavor !== 'full') {
      return nextSettings
    }

    return {
      ...nextSettings,
      demo: {
        enabled: false,
        watermark: false,
        maskSensitiveData: false,
        disableOutboundMessages: false,
      },
    }
  }

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setSettings(prev => normalizeSettingsForBuildFlavor({
            ...prev,
            ...parsed,
            company: { ...prev.company, ...(parsed.company || {}) },
            preferences: { ...prev.preferences, ...(parsed.preferences || {}) },
            notifications: { ...prev.notifications, ...(parsed.notifications || {}) },
            integrations: { ...prev.integrations, ...(parsed.integrations || {}) },
            security: { ...prev.security, ...(parsed.security || {}) },
            backup: { ...prev.backup, ...(parsed.backup || {}) },
            demo: { ...prev.demo, ...(parsed.demo || {}) }
          }))
        }

        const response = await fetch('/api/settings/company')
        const result = await response.json()
        if (result.success && result.data) {
          setSettings(prev => ({
            ...prev,
            company: {
              ...prev.company,
              ...result.data,
              logo: result.data.logo || prev.company.logo
            }
          }))
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }

    loadSettings()
  }, [buildFlavor])

  const handleSave = async () => {
    setLoading(true)
    setSaveStatus('saving')
    
    try {
      const normalizedSettings = normalizeSettingsForBuildFlavor(settings)

      setSettings(normalizedSettings)
      window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalizedSettings))
      const response = await fetch('/api/settings/company', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedSettings.company)
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Errore salvataggio impostazioni azienda')
      }

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }))
  }

  const handleExportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'NEXORA-settings.json'
    link.click()
  }

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string) as SystemSettings
          setSettings(normalizeSettingsForBuildFlavor(imported))
        } catch (error) {
          console.error('Error importing settings:', error)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleResetDemoData = async () => {
    if (!confirm('Ripristinare tutti i demo data enterprise? I dati demo correnti verranno sovrascritti.')) return

    setResettingDemo(true)

    try {
      const response = await fetch('/api/settings/demo/reset', { method: 'POST' })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Errore durante il reset demo')
      }

      toast({
        title: 'Demo data ripristinati',
        description: `${result.data.customers} clienti, ${result.data.invoices} fatture, ${result.data.lowStockProducts} prodotti a scorta bassa, ${result.data.outOfStockProducts} esauriti e ${result.data.readyRepairs} riparazioni pronte.`
      })
    } catch (error) {
      toast({
        title: 'Errore reset demo',
        description: error instanceof Error ? error.message : 'Errore durante il ripristino demo',
        variant: 'destructive'
      })
    } finally {
      setResettingDemo(false)
    }
  }

  const handleClearDemoData = async () => {
    if (!confirm('Eliminare tutti i dati demo di questa installazione? Il gestionale tornerà ad un workspace pulito.')) return

    setClearingDemo(true)

    try {
      const response = await fetch('/api/settings/demo/reset', { method: 'DELETE' })
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Errore durante l\'eliminazione demo')
      }

      toast({
        title: 'Demo data eliminati',
        description: `${result.data.customers} clienti, ${result.data.invoices} fatture, ${result.data.estimates} preventivi e ${result.data.repairs} riparazioni rimossi. Alla prossima apertura troverai un workspace pulito.`
      })
    } catch (error) {
      toast({
        title: 'Errore eliminazione demo',
        description: error instanceof Error ? error.message : 'Errore durante l\'eliminazione demo',
        variant: 'destructive'
      })
    } finally {
      setClearingDemo(false)
    }
  }

  return (
    <PageShell
      title="Impostazioni"
      description="Configura il tuo sistema gestionale"
      icon={Settings}
      theme="settings"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={handleExportSettings} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Download className="h-4 w-4 mr-2" />
            Esporta
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Upload className="h-4 w-4 mr-2" />
              Importa
            </Button>
          </div>
          <Button size="sm" onClick={handleSave} disabled={loading} className="border border-gray-400/40 bg-gray-600 text-white hover:bg-gray-700 font-semibold shadow-[0_14px_30px_-18px_rgba(75,85,99,0.75)]">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Salvaggio...' : 'Salva'}
          </Button>
        </>
      }
    >
      <div className="space-y-6">

        {/* Save Status */}
        {saveStatus !== 'idle' && (
          <Card className={saveStatus === 'error' ? 'border-red-200 bg-red-50' : saveStatus === 'saved' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'}>
            <CardContent className="p-4">
              <div className="flex items-center">
                {saveStatus === 'saving' && <RefreshCw className="h-4 w-4 mr-2 animate-spin text-blue-600" />}
                {saveStatus === 'saved' && <CheckCircle className="h-4 w-4 mr-2 text-green-600" />}
                {saveStatus === 'error' && <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />}
                <span className={`font-medium ${
                  saveStatus === 'saved' ? 'text-green-800' : 
                  saveStatus === 'error' ? 'text-red-800' : 'text-blue-800'
                }`}>
                  {saveStatus === 'saving' && 'Salvataggio in corso...'}
                  {saveStatus === 'saved' && 'Impostazioni salvate con successo!'}
                  {saveStatus === 'error' && 'Errore durante il salvataggio'}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {showLicensingCard && trialStatus ? (
          <Card className={trialStatus.activation_valid ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}>
            <CardContent className="p-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Shield className="h-4 w-4" />
                  Licensing NEXORA V4 Enterprise
                </div>
                <div className="text-sm text-slate-700">
                  {trialStatus.message || (trialStatus.activation_valid ? 'Licenza valida' : 'Licenza non attiva')}
                </div>
                {trialStatus.activation_holder ? (
                  <div className="text-xs text-slate-600">
                    Intestatario: <strong>{trialStatus.activation_holder}</strong>
                  </div>
                ) : null}
                {trialStatus.activation_expires_at ? (
                  <div className="text-xs text-slate-600">
                    Scadenza: <strong>{new Date(trialStatus.activation_expires_at).toLocaleDateString('it-IT')}</strong>
                  </div>
                ) : null}
                {trialStatus.device_fingerprint ? (
                  <div className="rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-xs text-slate-600">
                    <div className="font-medium text-slate-900">ID dispositivo</div>
                    <div className="mt-1 break-all font-mono">{trialStatus.device_fingerprint}</div>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Badge variant="outline" className="bg-white">
                  {trialStatus.activation_valid ? 'Licenza attiva' : missingActivationKey ? 'Build da rigenerare' : 'Attivazione richiesta'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {showDemoControls ? (
          <Card className="border-teal-200 bg-teal-50">
            <CardContent className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-teal-900">Ambiente dimostrativo</div>
                <div className="text-sm text-teal-800">
                  Ripristina il dataset dimostrativo di questa installazione per demo commerciali, test rapidi e presentazioni del prodotto.
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Badge variant="outline" className="bg-white text-teal-800 border-teal-300">
                  {settings.demo.enabled ? 'Dataset dimostrativo attivo' : 'Dataset dimostrativo disponibile'}
                </Badge>
                <Button variant="outline" onClick={handleResetDemoData} disabled={resettingDemo} className="border-teal-300 text-teal-900 hover:bg-teal-100">
                  <RefreshCw className={`h-4 w-4 mr-2 ${resettingDemo ? 'animate-spin' : ''}`} />
                  {resettingDemo ? 'Caricamento...' : 'Carica dati demo'}
                </Button>
                <Button variant="outline" onClick={handleClearDemoData} disabled={clearingDemo} className="border-rose-300 text-rose-900 hover:bg-rose-100">
                  <AlertTriangle className={`h-4 w-4 mr-2 ${clearingDemo ? 'animate-pulse' : ''}`} />
                  {clearingDemo ? 'Eliminazione...' : 'Elimina dati demo'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-white p-2 lg:grid-cols-6">
            <TabsTrigger value="company" className="flex items-center justify-center rounded-xl px-4 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Building className="h-4 w-4 mr-2" />
              Azienda
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center justify-center rounded-xl px-4 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Palette className="h-4 w-4 mr-2" />
              Preferenze
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center justify-center rounded-xl px-4 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Bell className="h-4 w-4 mr-2" />
              Notifiche
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center justify-center rounded-xl px-4 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Zap className="h-4 w-4 mr-2" />
              Integrazioni
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center justify-center rounded-xl px-4 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Shield className="h-4 w-4 mr-2" />
              Sicurezza
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center justify-center rounded-xl px-4 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white">
              <Database className="h-4 w-4 mr-2" />
              Backup
            </TabsTrigger>
          </TabsList>

          {/* Company Settings */}
          <TabsContent value="company" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Informazioni Azienda
                </CardTitle>
                <CardDescription>
                  Configura i dettagli della tua azienda
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="company-logo">Logo Aziendale (Carica file o inserisci URL)</Label>
                    <div className="flex flex-col sm:flex-row gap-3 mt-1.5">
                      <div className="flex-1 flex flex-col gap-2">
                        <Input
                          id="company-logo-file"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (e) => {
                                updateSettings('company', 'logo', e.target?.result as string)
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="cursor-pointer"
                        />
                        <Input
                          id="company-logo"
                          placeholder="Oppure inserisci URL logo (es. https://esempio.com/logo.png)"
                          value={settings.company.logo.startsWith('data:') ? '' : settings.company.logo}
                          onChange={(e) => updateSettings('company', 'logo', e.target.value)}
                        />
                      </div>
                      {settings.company.logo && (
                        <div className="h-20 w-20 border rounded-lg flex items-center justify-center bg-white overflow-hidden flex-shrink-0 shadow-sm">
                          <img src={settings.company.logo} alt="Logo" className="max-h-full max-w-full object-contain p-1" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Il logo verrà utilizzato nella generazione dei documenti PDF (Fatture, Preventivi, DDT). Supporta immagini locali (JPG, PNG, ecc.) o link esterni.</p>
                  </div>
                  <div>
                    <Label htmlFor="company-name">Nome Azienda</Label>
                    <Input
                      id="company-name"
                      value={settings.company.name}
                      onChange={(e) => updateSettings('company', 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-email">Email</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={settings.company.email}
                      onChange={(e) => updateSettings('company', 'email', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-phone">Telefono</Label>
                    <Input
                      id="company-phone"
                      value={settings.company.phone}
                      onChange={(e) => updateSettings('company', 'phone', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-vat">Partita IVA</Label>
                    <Input
                      id="company-vat"
                      value={settings.company.vatNumber}
                      onChange={(e) => updateSettings('company', 'vatNumber', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company-address">Indirizzo</Label>
                  <Input
                    id="company-address"
                    value={settings.company.address}
                    onChange={(e) => updateSettings('company', 'address', e.target.value)}
                    placeholder="Via/Piazza e numero civico"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="company-city">Città</Label>
                    <Input
                      id="company-city"
                      value={settings.company.city}
                      onChange={(e) => updateSettings('company', 'city', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-postal-code">CAP</Label>
                    <Input
                      id="company-postal-code"
                      value={settings.company.postalCode}
                      onChange={(e) => updateSettings('company', 'postalCode', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company-country">Paese</Label>
                    <Input
                      id="company-country"
                      value={settings.company.country}
                      onChange={(e) => updateSettings('company', 'country', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company-website">Sito Web</Label>
                  <Input
                    id="company-website"
                    value={settings.company.website}
                    onChange={(e) => updateSettings('company', 'website', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {showDemoControls ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2" />
                    Ambiente demo e presentazioni
                  </CardTitle>
                  <CardDescription>
                    Fondazioni per demo commerciali, video walkthrough e ambienti prova sicuri.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Abilita ambiente demo</Label>
                      <p className="text-sm text-gray-500">Applica le impostazioni dedicate alle dimostrazioni in tutto il prodotto</p>
                    </div>
                    <Switch
                      checked={settings.demo.enabled}
                      onCheckedChange={(checked) => updateSettings('demo', 'enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Watermark demo</Label>
                      <p className="text-sm text-gray-500">Prepara overlay e indicatori visivi per le registrazioni</p>
                    </div>
                    <Switch
                      checked={settings.demo.watermark}
                      onCheckedChange={(checked) => updateSettings('demo', 'watermark', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Maschera dati sensibili</Label>
                      <p className="text-sm text-gray-500">Nasconde importi o riferimenti sensibili durante la demo</p>
                    </div>
                    <Switch
                      checked={settings.demo.maskSensitiveData}
                      onCheckedChange={(checked) => updateSettings('demo', 'maskSensitiveData', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Blocca email/SMS reali</Label>
                      <p className="text-sm text-gray-500">Mantiene sicuro l'ambiente demo evitando invii reali</p>
                    </div>
                    <Switch
                      checked={settings.demo.disableOutboundMessages}
                      onCheckedChange={(checked) => updateSettings('demo', 'disableOutboundMessages', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Preferenze Sistema
                </CardTitle>
                <CardDescription>
                  Personalizza l'esperienza utente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Lingua</Label>
                    <Select value={settings.preferences.language} onValueChange={(value) => updateSettings('preferences', 'language', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="it">Italiano</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fuso Orario</Label>
                    <Select value={settings.preferences.timezone} onValueChange={(value) => updateSettings('preferences', 'timezone', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Rome">Europe/Rome</SelectItem>
                        <SelectItem value="Europe/London">Europe/London</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valuta</Label>
                    <Select value={settings.preferences.currency} onValueChange={(value) => updateSettings('preferences', 'currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Tema</Label>
                    <Select value={settings.preferences.theme} onValueChange={(value) => updateSettings('preferences', 'theme', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Chiaro</SelectItem>
                        <SelectItem value="dark">Scuro</SelectItem>
                        <SelectItem value="auto">Automatico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Impostazioni Notifiche
                </CardTitle>
                <CardDescription>
                  Configura le notifiche del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Notifiche Email</Label>
                      <p className="text-sm text-gray-500">Ricevi notifiche via email</p>
                    </div>
                    <Switch
                      checked={settings.notifications.emailEnabled}
                      onCheckedChange={(checked) => updateSettings('notifications', 'emailEnabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Notifiche SMS</Label>
                      <p className="text-sm text-gray-500">Ricevi notifiche via SMS</p>
                    </div>
                    <Switch
                      checked={settings.notifications.smsEnabled}
                      onCheckedChange={(checked) => updateSettings('notifications', 'smsEnabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Notifiche Push</Label>
                      <p className="text-sm text-gray-500">Notifiche in-app in tempo reale</p>
                    </div>
                    <Switch
                      checked={settings.notifications.pushEnabled}
                      onCheckedChange={(checked) => updateSettings('notifications', 'pushEnabled', checked)}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-4">Eventi Notificabili</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Alert Scorte Basse</Label>
                        <p className="text-sm text-gray-500">Notifica quando le scorte sono basse</p>
                      </div>
                      <Switch
                        checked={settings.notifications.lowStockAlerts}
                        onCheckedChange={(checked) => updateSettings('notifications', 'lowStockAlerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Promemoria Pagamenti</Label>
                        <p className="text-sm text-gray-500">Promemoria scadenze pagamenti</p>
                      </div>
                      <Switch
                        checked={settings.notifications.paymentReminders}
                        onCheckedChange={(checked) => updateSettings('notifications', 'paymentReminders', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Fatture Scadute</Label>
                        <p className="text-sm text-gray-500">Notifica fatture in ritardo</p>
                      </div>
                      <Switch
                        checked={settings.notifications.invoiceOverdue}
                        onCheckedChange={(checked) => updateSettings('notifications', 'invoiceOverdue', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Nuovi Ordini</Label>
                        <p className="text-sm text-gray-500">Notifica nuovi ordini clienti</p>
                      </div>
                      <Switch
                        checked={settings.notifications.newOrderAlerts}
                        onCheckedChange={(checked) => updateSettings('notifications', 'newOrderAlerts', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations */}
          <TabsContent value="integrations" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2" />
                  Integrazioni Esterne
                </CardTitle>
                <CardDescription>
                  Configura le integrazioni con servizi esterni
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Provider Email</Label>
                    <Select value={settings.integrations.emailProvider} onValueChange={(value) => updateSettings('integrations', 'emailProvider', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SMTP">SMTP</SelectItem>
                        <SelectItem value="SENDGRID">SendGrid</SelectItem>
                        <SelectItem value="MAILGUN">Mailgun</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Provider SMS</Label>
                    <Select value={settings.integrations.smsProvider} onValueChange={(value) => updateSettings('integrations', 'smsProvider', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TWILIO">Twilio</SelectItem>
                        <SelectItem value="MESSAGEBIRD">MessageBird</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Gateway Pagamenti</Label>
                    <Select value={settings.integrations.paymentProvider} onValueChange={(value) => updateSettings('integrations', 'paymentProvider', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STRIPE">Stripe</SelectItem>
                        <SelectItem value="PAYPAL">PayPal</SelectItem>
                        <SelectItem value="SQUARE">Square</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Software Contabilità</Label>
                    <Select value={settings.integrations.accountingProvider} onValueChange={(value) => updateSettings('integrations', 'accountingProvider', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Nessuno</SelectItem>
                        <SelectItem value="QUICKBOOKS">QuickBooks</SelectItem>
                        <SelectItem value="XERO">Xero</SelectItem>
                        <SelectItem value="SAGE">Sage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-4">Chiavi API</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="stripe-key">Stripe API Key</Label>
                      <Input
                        id="stripe-key"
                        type="password"
                        value={settings.integrations.stripeKey}
                        onChange={(e) => updateSettings('integrations', 'stripeKey', e.target.value)}
                        placeholder="sk_test_..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="paypal-key">PayPal API Key</Label>
                      <Input
                        id="paypal-key"
                        type="password"
                        value={settings.integrations.paypalKey}
                        onChange={(e) => updateSettings('integrations', 'paypalKey', e.target.value)}
                        placeholder="AQ..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="quickbooks-key">QuickBooks API Key</Label>
                      <Input
                        id="quickbooks-key"
                        type="password"
                        value={settings.integrations.quickbooksKey}
                        onChange={(e) => updateSettings('integrations', 'quickbooksKey', e.target.value)}
                        placeholder="QBO..."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Impostazioni Sicurezza
                </CardTitle>
                <CardDescription>
                  Configura le impostazioni di sicurezza del sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Autenticazione a Due Fattori</Label>
                      <p className="text-sm text-gray-500">Richiedi 2FA per tutti gli utenti</p>
                    </div>
                    <Switch
                      checked={settings.security.twoFactorAuth}
                      onCheckedChange={(checked) => updateSettings('security', 'twoFactorAuth', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Whitelist IP</Label>
                      <p className="text-sm text-gray-500">Limita accessi da IP autorizzati</p>
                    </div>
                    <Switch
                      checked={settings.security.ipWhitelist}
                      onCheckedChange={(checked) => updateSettings('security', 'ipWhitelist', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Audit Logging</Label>
                      <p className="text-sm text-gray-500">Tracciamento completo operazioni</p>
                    </div>
                    <Switch
                      checked={settings.security.auditLogging}
                      onCheckedChange={(checked) => updateSettings('security', 'auditLogging', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Policy Password</Label>
                      <p className="text-sm text-gray-500">Requisiti password complesse</p>
                    </div>
                    <Switch
                      checked={settings.security.passwordPolicy}
                      onCheckedChange={(checked) => updateSettings('security', 'passwordPolicy', checked)}
                    />
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div>
                    <Label htmlFor="session-timeout">Timeout Sessione (minuti)</Label>
                    <Input
                      id="session-timeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSettings('security', 'sessionTimeout', parseInt(e.target.value))}
                      min={5}
                      max={1440}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Backup */}
          <TabsContent value="backup" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Backup e Recovery
                </CardTitle>
                <CardDescription>
                  Configura le impostazioni di backup automatico
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Backup Automatico</Label>
                      <p className="text-sm text-gray-500">Abilita backup programmato</p>
                    </div>
                    <Switch
                      checked={settings.backup.enabled}
                      onCheckedChange={(checked) => updateSettings('backup', 'enabled', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Storage Cloud</Label>
                      <p className="text-sm text-gray-500">Salva backup su cloud storage</p>
                    </div>
                    <Switch
                      checked={settings.backup.cloudStorage}
                      onCheckedChange={(checked) => updateSettings('backup', 'cloudStorage', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="font-medium">Crittografia</Label>
                      <p className="text-sm text-gray-500">Crittografa i backup</p>
                    </div>
                    <Switch
                      checked={settings.backup.encryption}
                      onCheckedChange={(checked) => updateSettings('backup', 'encryption', checked)}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Frequenza Backup</Label>
                    <Select value={settings.backup.frequency} onValueChange={(value) => updateSettings('backup', 'frequency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Ogni ora</SelectItem>
                        <SelectItem value="daily">Giornaliero</SelectItem>
                        <SelectItem value="weekly">Settimanale</SelectItem>
                        <SelectItem value="monthly">Mensile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="retention">Giorni di Retention</Label>
                    <Input
                      id="retention"
                      type="number"
                      value={settings.backup.retentionDays}
                      onChange={(e) => updateSettings('backup', 'retentionDays', parseInt(e.target.value))}
                      min={1}
                      max={365}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  )
}

