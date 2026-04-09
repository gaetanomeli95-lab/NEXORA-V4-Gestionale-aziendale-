const fs = require('fs')
const path = require('path')

const LICENSE_ENV_KEYS = new Set([
  'NEXORA_LICENSE_PUBLIC_KEY',
  'NEXORA_LICENSE_PRIVATE_KEY_PKCS8',
  'NEXORA_LICENSE_PRIVATE_KEY_PEM',
])

function resolveLicenseProjectRoot(projectRoot) {
  if (projectRoot) {
    return path.resolve(projectRoot)
  }

  return path.resolve(__dirname, '..')
}

function resolveLicenseEnvFilePath(projectRoot, fileName = '.env.license.local') {
  return path.join(resolveLicenseProjectRoot(projectRoot), fileName)
}

function normalizeEnvValue(rawValue) {
  const trimmedValue = String(rawValue || '').trim()

  if (!trimmedValue) {
    return ''
  }

  if ((trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) || (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))) {
    const quote = trimmedValue[0]
    const innerValue = trimmedValue.slice(1, -1)

    if (quote === '"') {
      return innerValue
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    }

    return innerValue
  }

  const inlineCommentIndex = trimmedValue.indexOf(' #')
  return inlineCommentIndex === -1 ? trimmedValue : trimmedValue.slice(0, inlineCommentIndex).trim()
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }

  const values = {}
  const content = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '')

  for (const line of content.split(/\r?\n/)) {
    const trimmedLine = line.trim()

    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue
    }

    const normalizedLine = trimmedLine.startsWith('export ') ? trimmedLine.slice(7).trim() : trimmedLine
    const separatorIndex = normalizedLine.indexOf('=')

    if (separatorIndex <= 0) {
      continue
    }

    const key = normalizedLine.slice(0, separatorIndex).trim()
    const rawValue = normalizedLine.slice(separatorIndex + 1)

    if (!key) {
      continue
    }

    values[key] = normalizeEnvValue(rawValue)
  }

  return values
}

function applyLicenseEnv(values) {
  let loaded = false

  for (const [key, value] of Object.entries(values)) {
    if (!LICENSE_ENV_KEYS.has(key)) {
      continue
    }

    if (typeof process.env[key] === 'string' && process.env[key].trim()) {
      continue
    }

    const normalizedValue = String(value || '').trim()
    if (!normalizedValue) {
      continue
    }

    process.env[key] = normalizedValue
    loaded = true
  }

  return loaded
}

function loadLicenseEnv(options = {}) {
  const projectRoot = resolveLicenseProjectRoot(options.projectRoot)
  const envFiles = Array.isArray(options.envFiles) && options.envFiles.length > 0
    ? options.envFiles
    : ['.env.license.local', '.env.local', '.env']
  const loadedFiles = []

  for (const fileName of envFiles) {
    const filePath = path.isAbsolute(fileName) ? fileName : path.join(projectRoot, fileName)

    if (!fs.existsSync(filePath)) {
      continue
    }

    if (applyLicenseEnv(parseEnvFile(filePath))) {
      loadedFiles.push(filePath)
    }
  }

  return {
    projectRoot,
    loadedFiles,
    publicKeyPresent: Boolean(process.env.NEXORA_LICENSE_PUBLIC_KEY && process.env.NEXORA_LICENSE_PUBLIC_KEY.trim()),
    privateKeyPresent: Boolean(
      (process.env.NEXORA_LICENSE_PRIVATE_KEY_PKCS8 && process.env.NEXORA_LICENSE_PRIVATE_KEY_PKCS8.trim()) ||
      (process.env.NEXORA_LICENSE_PRIVATE_KEY_PEM && process.env.NEXORA_LICENSE_PRIVATE_KEY_PEM.trim())
    ),
  }
}

module.exports = {
  loadLicenseEnv,
  resolveLicenseEnvFilePath,
  resolveLicenseProjectRoot,
}
