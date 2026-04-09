const { spawnSync } = require('child_process')
const path = require('path')
const { loadLicenseEnv } = require('./license-env.cjs')

const mode = process.argv[2] === 'demo' ? 'demo' : 'full'
const projectRoot = path.resolve(__dirname, '..')
const npmCommand = 'npm'
const npxCommand = 'npx'

loadLicenseEnv({ projectRoot })

const sharedEnv = {
  ...process.env,
  ELECTRON_BUILD_MODE: mode,
  NEXORA_BUILD_MODE: mode,
}

function quoteWindowsArg(value) {
  const stringValue = String(value)

  if (/^[A-Za-z0-9_./:-]+$/.test(stringValue)) {
    return stringValue
  }

  const escapedValue = stringValue.replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/g, '$1$1')
  return `"${escapedValue}"`
}

function run(command, args) {
  const windowsCommandLine = `${command}${args.length > 0 ? ` ${args.map(quoteWindowsArg).join(' ')}` : ''}`
  const result = process.platform === 'win32'
    ? spawnSync('cmd.exe', ['/d', '/s', '/c', windowsCommandLine], {
        cwd: projectRoot,
        env: sharedEnv,
        stdio: 'inherit',
        windowsHide: true,
      })
    : spawnSync(command, args, {
        cwd: projectRoot,
        env: sharedEnv,
        stdio: 'inherit',
      })

  if (result.error) {
    console.error(result.error)
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run(npmCommand, ['run', 'build:electron'])
run(npxCommand, ['electron', '.'])
