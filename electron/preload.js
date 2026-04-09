const { contextBridge, ipcRenderer } = require('electron')

const readArgumentValue = (prefix) => {
  const entry = process.argv.find((value) => typeof value === 'string' && value.startsWith(prefix))
  return entry ? entry.slice(prefix.length) : undefined
}

const runtime = readArgumentValue('--nexora-runtime=') || 'electron'
const buildMode = readArgumentValue('--nexora-build-mode=')
const normalizedBuildMode = buildMode === 'demo' || buildMode === 'full' ? buildMode : undefined

contextBridge.exposeInMainWorld('softshopDesktop', {
  platform: process.platform,
  isDesktop: true,
  runtime,
  buildMode: normalizedBuildMode,
  getTrialStatus: () => ipcRenderer.invoke('nexora-desktop:get-trial-status'),
  refreshTrialStatus: () => ipcRenderer.invoke('nexora-desktop:refresh-trial-status'),
  activateDemoLicense: () => ipcRenderer.invoke('nexora-desktop:activate-demo-license'),
  activateFullLicense: (code) => ipcRenderer.invoke('nexora-desktop:activate-full-license', code)
})
