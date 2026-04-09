const fs = require('fs')
const { spawnSync } = require('child_process')
const path = require('path')
const { loadLicenseEnv } = require('./license-env.cjs')

const mode = process.argv[2] === 'demo' ? 'demo' : 'full'
const target = process.argv[3] === 'dir' ? 'dir' : 'installer'
const projectRoot = path.resolve(__dirname, '..')
loadLicenseEnv({ projectRoot })
const outputDir = path.join(projectRoot, 'dist-electron', mode)
const stableInstallerName = mode === 'demo' ? 'NEXORA-Demo-Setup.exe' : 'NEXORA-Full-Setup.exe'
const npmCommand = 'npm'
const npxCommand = 'npx'
const sharedEnv = {
  ...process.env,
  CSC_IDENTITY_AUTO_DISCOVERY: 'false',
  ELECTRON_BUILD_MODE: mode,
  NEXORA_BUILD_MODE: mode
}

function quoteWindowsArg(value) {
  const stringValue = String(value)

  if (/^[A-Za-z0-9_./:-]+$/.test(stringValue)) {
    return stringValue
  }

  const escapedValue = stringValue.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, '$1$1')
  return `"${escapedValue}"`
}

function requireFullBuildPublicKey() {
  if (mode !== 'full') {
    return
  }

  const publicKey = process.env.NEXORA_LICENSE_PUBLIC_KEY?.trim()

  if (!publicKey) {
    console.error('Missing NEXORA_LICENSE_PUBLIC_KEY for full Electron build')
    console.error('Generate or restore the Ed25519 licensing keypair before packaging NEXORA Full.')
    process.exit(1)
  }

  if (!/^[a-fA-F0-9]{64}$/.test(publicKey)) {
    console.error('NEXORA_LICENSE_PUBLIC_KEY must contain 64 hex characters')
    process.exit(1)
  }
}

function copyStableInstaller() {
  if (target !== 'installer' || !fs.existsSync(outputDir)) {
    return
  }

  const candidates = fs
    .readdirSync(outputDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.exe') && entry.name !== stableInstallerName)
    .map((entry) => {
      const absolutePath = path.join(outputDir, entry.name)
      return {
        absolutePath,
        name: entry.name,
        mtimeMs: fs.statSync(absolutePath).mtimeMs,
      }
    })
    .sort((left, right) => right.mtimeMs - left.mtimeMs)

  const latestInstaller = candidates[0]

  if (!latestInstaller) {
    return
  }

  fs.copyFileSync(latestInstaller.absolutePath, path.join(outputDir, stableInstallerName))
}

function run(command, args) {
  const windowsCommandLine = `${command}${args.length > 0 ? ` ${args.map(quoteWindowsArg).join(' ')}` : ''}`
  const result = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', windowsCommandLine], {
        cwd: projectRoot,
        env: sharedEnv,
        stdio: 'inherit',
        windowsHide: true
      })
    : spawnSync(command, args, {
        cwd: projectRoot,
        env: sharedEnv,
        stdio: 'inherit'
      })

  if (result.error) {
    console.error(result.error)
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

requireFullBuildPublicKey()
run(npmCommand, ['run', 'build:electron'])
run(npxCommand, [
  'electron-builder',
  '--config',
  'electron-builder.config.js',
  '--win',
  target === 'dir' ? 'dir' : 'nsis'
])
copyStableInstaller()
