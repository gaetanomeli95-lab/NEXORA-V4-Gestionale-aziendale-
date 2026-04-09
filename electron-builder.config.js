const { loadLicenseEnv } = require('./scripts/license-env.cjs')

loadLicenseEnv()

const mode = process.env.ELECTRON_BUILD_MODE === 'demo' ? 'demo' : 'full'
const isDemo = mode === 'demo'
const appId = isDemo ? 'com.nexora.v4.demo' : 'com.nexora.v4.full'
const productName = isDemo ? 'NEXORA Demo' : 'NEXORA V4 Enterprise'
const executableName = isDemo ? 'NEXORA-Demo' : 'NEXORA-V4-Enterprise'
const artifactName = isDemo ? 'NEXORA-Demo-Setup-${version}.${ext}' : 'NEXORA-V4-Enterprise-Setup-${version}.${ext}'
const desktopLicensePublicKey = process.env.NEXORA_LICENSE_PUBLIC_KEY?.trim() || null

module.exports = {
  appId,
  productName,
  artifactName,
  executableName,
  asar: false,
  directories: {
    output: isDemo ? 'dist-electron/demo' : 'dist-electron/full'
  },
  afterPack: 'scripts/electron-after-pack.cjs',
  extraMetadata: {
    main: 'electron/main.js',
    desktopBuildMode: mode,
    desktopLicensePublicKey
  },
  files: [
    {
      from: 'desktop-app',
      to: '.',
      filter: ['**/*']
    }
  ],
  extraResources: [
    {
      from: 'prisma/desktop-template.db',
      to: 'db/dev.db'
    }
  ],
  win: {
    icon: 'electron/assets/nexora.ico',
    signAndEditExecutable: false,
    verifyUpdateCodeSignature: false,
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ]
  },
  linux: {
    icon: 'electron/assets/nexora-icon.png',
    category: 'Office',
    maintainer: 'NEXORA <support@nexora.local>',
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      }
    ]
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    include: 'electron/installer.nsh',
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: false,
    createStartMenuShortcut: false,
    shortcutName: 'NEXORA',
    runAfterFinish: true,
    uninstallDisplayName: productName,
    installerIcon: 'electron/assets/nexora.ico',
    installerHeaderIcon: 'electron/assets/nexora.ico',
    uninstallerIcon: 'electron/assets/nexora.ico'
  }
}
