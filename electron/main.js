const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const net = require('net')
const { spawn } = require('child_process')
const { loadLicenseEnv } = require('../scripts/license-env.cjs')
const { createDesktopLicenseRuntime } = require('./license-runtime')

loadLicenseEnv({ projectRoot: path.resolve(__dirname, '..') })

let mainWindow = null
let serverProcess = null
let serverUrlPromise = null
const DESKTOP_BIND_HOST = '127.0.0.1'

function readDesktopPackageMetadata() {
  try {
    const packageJsonPath = path.join(app.getAppPath(), 'package.json')
    if (!fs.existsSync(packageJsonPath)) {
      return null
    }

    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  } catch {
    return null
  }
}

function resolveBuildMode() {
  if (process.env.ELECTRON_BUILD_MODE === 'demo') {
    return 'demo'
  }

  if (process.env.ELECTRON_BUILD_MODE === 'full') {
    return 'full'
  }

  const packageMetadata = readDesktopPackageMetadata()
  if (packageMetadata) {
    return packageMetadata.desktopBuildMode === 'demo' ? 'demo' : 'full'
  }

  return 'full'
}

function resolveLicensePublicKey() {
  if (typeof process.env.NEXORA_LICENSE_PUBLIC_KEY === 'string' && process.env.NEXORA_LICENSE_PUBLIC_KEY.trim()) {
    return process.env.NEXORA_LICENSE_PUBLIC_KEY.trim()
  }

  const packageMetadata = readDesktopPackageMetadata()
  if (packageMetadata && typeof packageMetadata.desktopLicensePublicKey === 'string' && packageMetadata.desktopLicensePublicKey.trim()) {
    return packageMetadata.desktopLicensePublicKey.trim()
  }

  return ''
}

const BUILD_MODE = resolveBuildMode()
const APP_ID = BUILD_MODE === 'demo' ? 'com.nexora.v4.demo' : 'com.nexora.v4.full'
const PRODUCT_NAME = BUILD_MODE === 'demo' ? 'NEXORA Demo' : 'NEXORA V4 Enterprise'
const DESKTOP_LICENSE_RUNTIME = createDesktopLicenseRuntime({
  buildMode: BUILD_MODE,
  licensePublicKey: resolveLicensePublicKey(),
})

app.setName(PRODUCT_NAME)
if (process.platform === 'win32') {
  app.setAppUserModelId(APP_ID)
}

ipcMain.handle('nexora-desktop:get-trial-status', async () => DESKTOP_LICENSE_RUNTIME.getStatus())
ipcMain.handle('nexora-desktop:refresh-trial-status', async () => DESKTOP_LICENSE_RUNTIME.refreshStatus())
ipcMain.handle('nexora-desktop:activate-demo-license', async () => DESKTOP_LICENSE_RUNTIME.activateDemoLicense())
ipcMain.handle('nexora-desktop:activate-full-license', async (_event, code) => DESKTOP_LICENSE_RUNTIME.activateFullLicense(code))

function resolveDbUrl(dbPath) {
  return `file:${dbPath.replace(/\\/g, '/')}`
}

function resolveNextAuthSecret() {
  return process.env.NEXTAUTH_SECRET || 'nexora-desktop-local-secret'
}

function resolveDesktopPublicHost() {
  return BUILD_MODE === 'demo' ? 'nexora-demo.localhost' : 'nexora-full.localhost'
}

function getAppIconPath() {
  const candidatePaths = [
    path.join(app.getAppPath(), 'electron', 'assets', 'nexora-icon.png'),
    path.join(__dirname, 'assets', 'nexora-icon.png')
  ]

  return candidatePaths.find(candidatePath => fs.existsSync(candidatePath)) || candidatePaths[0]
}

function pipeServerLogs(stream, target, prefix) {
  if (!stream || !target) {
    return
  }

  stream.on('data', data => {
    if (target.destroyed || target.writableEnded) {
      return
    }

    try {
      target.write(`${prefix}${data}`)
    } catch {
    }
  })
}

function ensureDatabaseFile() {
  const sourceDbPath = app.isPackaged
    ? path.join(process.resourcesPath, 'db', 'dev.db')
    : path.join(app.getAppPath(), 'prisma', 'dev.db')

  const targetDir = path.join(app.getPath('userData'), 'db')
  const targetDbPath = path.join(targetDir, 'dev.db')

  fs.mkdirSync(targetDir, { recursive: true })

  if (!fs.existsSync(targetDbPath) && fs.existsSync(sourceDbPath)) {
    fs.copyFileSync(sourceDbPath, targetDbPath)
  }

  return targetDbPath
}

function getStandaloneServerPath() {
  const candidatePaths = app.isPackaged
    ? [
        path.join(app.getAppPath(), 'server.js'),
        path.join(app.getAppPath(), '.next', 'standalone', 'server.js')
      ]
    : [
        path.join(app.getAppPath(), '.next', 'standalone', 'server.js'),
        path.join(app.getAppPath(), 'server.js')
      ]

  const resolvedPath = candidatePaths.find(candidatePath => fs.existsSync(candidatePath))

  return resolvedPath || candidatePaths[0]
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, DESKTOP_BIND_HOST, () => {
      const address = server.address()
      const port = typeof address === 'object' && address ? address.port : null
      server.close(() => {
        if (port) resolve(port)
        else reject(new Error('Unable to resolve a free port'))
      })
    })
    server.on('error', reject)
  })
}

async function waitForServer(url, attempts = 60) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
    }

    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  throw new Error('Next.js server did not start in time')
}

function ensureNextServer() {
  if (!serverUrlPromise) {
    serverUrlPromise = startNextServer().catch(error => {
      serverUrlPromise = null
      throw error
    })
  }

  return serverUrlPromise
}

async function startNextServer() {
  const serverPath = getStandaloneServerPath()

  if (!fs.existsSync(serverPath)) {
    throw new Error(`Standalone server not found: ${serverPath}`)
  }

  const databasePath = ensureDatabaseFile()
  const port = await getFreePort()
  const bindUrl = `http://${DESKTOP_BIND_HOST}:${port}`
  const publicBaseUrl = `http://${resolveDesktopPublicHost()}:${port}`
  const appUrl = `${publicBaseUrl}/auth/signin`
  const shouldPipeLogs = !app.isPackaged

  serverProcess = spawn(process.execPath, [serverPath], {
    cwd: path.dirname(serverPath),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      ELECTRON_BUILD_MODE: BUILD_MODE,
      NEXORA_BUILD_MODE: BUILD_MODE,
      NODE_ENV: 'production',
      PORT: String(port),
      HOSTNAME: DESKTOP_BIND_HOST,
      DATABASE_URL: resolveDbUrl(databasePath),
      NEXTAUTH_URL: publicBaseUrl,
      NEXTAUTH_SECRET: resolveNextAuthSecret()
    },
    stdio: shouldPipeLogs ? 'pipe' : 'ignore',
    windowsHide: app.isPackaged
  })

  if (shouldPipeLogs) {
    pipeServerLogs(serverProcess.stdout, process.stdout, '[next] ')
    pipeServerLogs(serverProcess.stderr, process.stderr, '[next:error] ')
  }

  serverProcess.on('exit', code => {
    serverProcess = null
    serverUrlPromise = null

    if (code && code !== 0) {
      console.error(`Next.js server exited with code ${code}`)
    }
  })

  await waitForServer(bindUrl)
  return appUrl
}

async function createWindow() {
  const appUrl = await ensureNextServer()

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1200,
    minHeight: 760,
    title: PRODUCT_NAME,
    icon: getAppIconPath(),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      additionalArguments: [
        `--nexora-runtime=electron`,
        `--nexora-build-mode=${BUILD_MODE}`
      ]
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  await mainWindow.loadURL(appUrl)
}

app.whenReady().then(async () => {
  try {
    await createWindow()
  } catch (error) {
    console.error('Failed to start Electron app:', error)
    app.quit()
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill()
  }
})
