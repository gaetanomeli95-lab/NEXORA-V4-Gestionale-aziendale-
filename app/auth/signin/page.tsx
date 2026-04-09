import { Suspense } from 'react'
import SignInForm from '@/components/ui/auth/signin-form'
import { ensureRuntimeAuthBootstrap } from '@/lib/auth-bootstrap'

const demoDownloadUrl = process.env.NEXT_PUBLIC_DEMO_DOWNLOAD_URL || 'https://github.com/gaetanomeli95-lab/nexora-v4-gestionale-aziendale/releases/latest/download/NEXORA-Demo-Setup.exe'
const githubRepoUrl = 'https://github.com/gaetanomeli95-lab/nexora-v4-gestionale-aziendale'
const isPublicShowcaseDeployment = Boolean(process.env.VERCEL)

export default async function SignInPage() {
  if (isPublicShowcaseDeployment) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(147,51,234,0.24),_transparent_32%),linear-gradient(135deg,_#020617_0%,_#0f172a_30%,_#172554_68%,_#312e81_100%)] p-4">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 text-white shadow-[0_30px_80px_rgba(2,6,23,0.78)] backdrop-blur-xl">
          <div className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
            NEXORA Public Preview
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Accesso web completo in arrivo
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
            Questa versione pubblica online è dedicata alla landing page e al download della demo desktop. L&apos;accesso cloud completo richiede l&apos;infrastruttura dati dedicata, attualmente in preparazione.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={demoDownloadUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 px-6 text-sm font-semibold text-white shadow-[0_16px_35px_rgba(37,99,235,0.35)] hover:from-cyan-400 hover:via-blue-500 hover:to-fuchsia-500">
              Scarica Demo Windows
            </a>
            <a href={githubRepoUrl} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-6 text-sm font-semibold text-slate-100 hover:bg-white/10 hover:text-white">
              Apri GitHub
            </a>
          </div>
          <div className="mt-6 text-sm text-slate-400">
            <a href="/" className="transition hover:text-white">Torna alla landing page</a>
          </div>
        </div>
      </div>
    )
  }

  await ensureRuntimeAuthBootstrap().catch(() => null)

  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}
