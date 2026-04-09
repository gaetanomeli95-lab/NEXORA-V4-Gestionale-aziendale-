import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Download, Github, Package, Shield, Sparkles, Zap } from 'lucide-react'

const demoDownloadUrl = process.env.NEXT_PUBLIC_DEMO_DOWNLOAD_URL || 'https://github.com/gaetanomeli95-lab/NEXORA-V4-Gestionale-aziendale-/releases/latest/download/NEXORA-Demo-Setup.exe'
const githubRepoUrl = 'https://github.com/gaetanomeli95-lab/NEXORA-V4-Gestionale-aziendale-'

const featureCards = [
  {
    title: 'AI Assistant',
    description: 'Dashboard operativa, suggerimenti intelligenti e supporto guidato per lavorare più velocemente.',
    icon: Sparkles,
  },
  {
    title: 'Full Management',
    description: 'Preventivi, ordini, magazzino, fatture e clienti in un solo ambiente professionale.',
    icon: Package,
  },
  {
    title: 'Offline Mode',
    description: 'Esperienza desktop stabile anche in locale, pensata per lavorare senza dipendere dal cloud.',
    icon: Shield,
  },
] as const

const proofPoints = ['Demo gratuita 7 giorni', 'Installazione Windows', 'Esperienza desktop + web'] as const

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.20),_transparent_28%),radial-gradient(circle_at_80%_18%,_rgba(168,85,247,0.18),_transparent_24%),linear-gradient(180deg,_#020617_0%,_#020617_42%,_#0f172a_100%)]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 text-white">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-[0_18px_45px_-18px_rgba(96,165,250,0.65)]">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-[0.28em] text-blue-200">NEXORA V4</div>
              <div className="text-xs text-slate-400">Gestionale intelligente</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#download" className="transition hover:text-white">Download</a>
            <a href="#contact" className="transition hover:text-white">Contact</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden text-slate-200 shadow-none hover:bg-white/10 hover:text-white md:inline-flex">
              <a href={githubRepoUrl} target="_blank" rel="noreferrer">Apri GitHub</a>
            </Button>
            <Button asChild className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white shadow-[0_22px_50px_-20px_rgba(96,165,250,0.7)] hover:from-blue-400 hover:via-indigo-500 hover:to-purple-500">
              <a href={demoDownloadUrl} target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" />
                Scarica Demo
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main>
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-100">
                <Sparkles className="h-4 w-4" />
                Software gestionale moderno per PMI e studi professionali
              </div>

              <div className="mt-5 inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-100">
                🚀 Versione Completa disponibile a breve
              </div>

              <h1 className="mt-8 max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-7xl">
                Il Gestionale Intelligente per la Tua Azienda
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                Gestisci preventivi, magazzino e clienti con l'AI. Un'esperienza elegante, veloce e pronta per il lavoro quotidiano in desktop e web.
              </p>

              <div id="download" className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button asChild size="lg" className="h-14 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 px-8 text-base font-semibold text-white shadow-[0_30px_80px_-28px_rgba(99,102,241,0.85)] animate-pulse hover:animate-none hover:from-blue-400 hover:via-indigo-500 hover:to-purple-500">
                  <a href={demoDownloadUrl} target="_blank" rel="noreferrer">
                    ⬇️ Scarica Demo Gratuita (7 giorni)
                  </a>
                </Button>

                <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl border-white/15 bg-white/5 px-8 text-base font-semibold text-slate-100 hover:bg-white/10 hover:text-white">
                  <a href={githubRepoUrl} target="_blank" rel="noreferrer">
                    Vedi il progetto
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {proofPoints.map((item) => (
                  <div key={item} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur-sm">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-blue-500/20 via-indigo-500/10 to-purple-500/20 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_30px_80px_-32px_rgba(15,23,42,0.85)] backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Overview</div>
                    <div className="mt-1 text-lg font-semibold text-white">Console NEXORA</div>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                    Demo live
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
                    <div className="text-sm font-medium text-slate-300">Dashboard AI</div>
                    <div className="mt-2 text-3xl font-bold text-white">+28%</div>
                    <div className="mt-2 text-sm text-slate-400">Insight operativi, priorità giornaliere e analisi trend in un'unica vista.</div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="text-sm font-medium text-slate-300">Clienti & Preventivi</div>
                      <div className="mt-2 text-2xl font-bold text-white">Centralizzati</div>
                      <div className="mt-2 text-sm text-slate-400">Pipeline commerciale, documenti e follow-up sempre allineati.</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="text-sm font-medium text-slate-300">Modalità offline</div>
                      <div className="mt-2 text-2xl font-bold text-white">Pronta</div>
                      <div className="mt-2 text-sm text-slate-400">Desktop Windows stabile per uso locale e rilascio progressivo della suite completa.</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Features Grid */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-200">Features</div>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">Pensato per sembrare già pronto alla vendita</h2>
          <p className="mt-4 text-lg text-slate-300">
            Un design professionale, flussi gestionali completi e una demo concreta per presentare il prodotto in modo credibile fin dal primo accesso.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {featureCards.map((feature) => {
            const Icon = feature.icon

            return (
              <Card key={feature.title} className="border-white/10 bg-white/5 text-white shadow-[0_24px_70px_-35px_rgba(15,23,42,0.9)] backdrop-blur-xl">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-100">
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-white">{feature.title}</CardTitle>
                  <CardDescription className="text-slate-300">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm font-medium text-slate-200">
                  Ideale per demo commerciali, onboarding rapido e presentazione del valore del prodotto già dal sito pubblico.
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/10 bg-white/5">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div>
            <div className="text-3xl font-bold text-white">7 giorni</div>
            <div className="mt-2 text-sm text-slate-300">Demo gratuita per testare il prodotto senza attriti.</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">Windows Ready</div>
            <div className="mt-2 text-sm text-slate-300">Installer desktop pronto per la distribuzione pubblica della demo.</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-white">UI professionale</div>
            <div className="mt-2 text-sm text-slate-300">Look moderno SaaS con focus su chiarezza, fiducia e conversione.</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-blue-600/20 via-indigo-500/15 to-purple-600/20 px-6 py-10 shadow-[0_28px_80px_-36px_rgba(79,70,229,0.8)] backdrop-blur-xl sm:px-10 lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-200">Download & Contact</div>
            <h3 className="mt-3 text-3xl font-bold text-white">Lancia subito la demo pubblica di NEXORA V4</h3>
            <p className="mt-4 text-lg text-slate-200">
              Pubblica la landing, collega la release GitHub della demo e usa questa pagina come entry point professionale per prospect e clienti.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-4 lg:mt-0 lg:min-w-[320px]">
            <Button asChild size="lg" className="h-14 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-base font-semibold text-white shadow-[0_24px_60px_-24px_rgba(99,102,241,0.85)] hover:from-blue-400 hover:via-indigo-500 hover:to-purple-500">
              <a href={demoDownloadUrl} target="_blank" rel="noreferrer">
                <Download className="mr-2 h-5 w-5" />
                Scarica Demo Gratuita
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-2xl border-white/15 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white">
              <a href={githubRepoUrl} target="_blank" rel="noreferrer">
                <Github className="mr-2 h-5 w-5" />
                Apri GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-slate-950/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>© 2026 NEXORA V4. Tutti i diritti riservati.</div>
          <div className="flex items-center gap-4">
            <a href={githubRepoUrl} target="_blank" rel="noreferrer" className="transition hover:text-white">
              GitHub
            </a>
            <a href={demoDownloadUrl} target="_blank" rel="noreferrer" className="transition hover:text-white">
              Scarica demo
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
