const fs = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')

const PRODUCT_NAMESPACE = 'NEXORA_TRIAL_V1'
const STORAGE_DIR_NAME = 'NEXORA'
const STORAGE_FILE_NAME = '.sys'
const LICENSE_FILE_NAME = '.lic'
const STATE_FILE_NAME = '.state.json'
const KEY_FILE_NAME = '.key'
const REGISTRY_STORAGE_DIR_NAME = '.registry'
const REGISTRY_VALUE_NAME = 'NEXORA_T'
const LICENSE_REGISTRY_VALUE_NAME = 'NEXORA_L'
const HIDDEN_COUNTER_VALUE_NAME = 'NEXORA_S'
const ACTIVATION_CODE_PREFIX = 'NXR1'
const TRIAL_WINDOW_HOURS = 168
const DATA_VERSION = 1
const DEMO_WATERMARK = 'DEMO - 7 GIORNI'
const SUSPICIOUS_PROCESSES = ['procmon.exe', 'procexp.exe', 'wireshark.exe', 'fiddler.exe', 'sandboxie.exe', 'vboxservice.exe', 'vmtoolsd.exe']

function createDesktopLicenseRuntime({ buildMode, licensePublicKey }) {
  const normalizedBuildMode = buildMode === 'demo' ? 'demo' : 'full'
  const normalizedLicensePublicKey = typeof licensePublicKey === 'string' ? licensePublicKey.trim().toLowerCase() : ''
  process.env.ELECTRON_BUILD_MODE = normalizedBuildMode
  process.env.NEXORA_BUILD_MODE = normalizedBuildMode
  let cachedStatus = bootstrapRuntimeStatus()

  function bootstrapRuntimeStatus() {
    try {
      const integrityFlags = collectIntegrityFlags()
      return normalizedBuildMode === 'full'
        ? bootstrapFullLicense(integrityFlags)
        : bootstrapDemoTrial(integrityFlags, { autoStart: true })
    } catch (error) {
      return blockingErrorStatus(normalizedBuildMode, getErrorMessage(error, 'Errore runtime desktop'))
    }
  }

  function bootstrapDemoTrial(integrityFlags, options = {}) {
    const autoStart = options.autoStart !== false
    const sid = currentUserSid()
    const machineIdHash = buildMachineIdHash(sid)
    const target = persistenceTarget(sid)
    const snapshot = loadSnapshot(target)
    const evaluation = evaluateTrial(machineIdHash, snapshot, integrityFlags, { autoStart })

    if (!evaluation) {
      return null
    }

    persistTrialState(target, evaluation.record, evaluation.hiddenState)
    writeRuntimeState(target.stateFilePath, evaluation.status)
    return evaluation.status
  }

  function bootstrapActivatedDemoTrial(integrityFlags) {
    return bootstrapDemoTrial(integrityFlags, { autoStart: false })
  }

  function bootstrapFullLicense(integrityFlags) {
    const sid = currentUserSid()
    const machineIdHash = buildMachineIdHash(sid)
    const target = persistenceTarget(sid)
    const storageHealth = {
      file_present: fs.existsSync(target.licenseFilePath),
      registry_present: registryValueExists(target.registrySubkey, LICENSE_REGISTRY_VALUE_NAME),
      restored_file: false,
      restored_registry: false,
      hidden_counter_detected: false,
    }

    if (!normalizedLicensePublicKey) {
      const activatedDemoStatus = bootstrapActivatedDemoTrial(integrityFlags)

      if (activatedDemoStatus) {
        writeRuntimeState(target.stateFilePath, activatedDemoStatus)
        return buildStatus(
          buildMode,
          false,
          null,
          null,
          machineIdHash,
          storageHealth,
          [...integrityFlags, 'missing_public_key'],
          'Questa build NEXORA V4 Enterprise non include la chiave pubblica di attivazione. Rigenera l\'installer con NEXORA_LICENSE_PUBLIC_KEY configurata.'
        )
      }

      const status = buildStatus(
        buildMode,
        false,
        null,
        null,
        machineIdHash,
        storageHealth,
        [...integrityFlags, 'missing_public_key'],
        'Questa build NEXORA V4 Enterprise non include la chiave pubblica di attivazione. Rigenera l\'installer con NEXORA_LICENSE_PUBLIC_KEY configurata.'
      )

      writeRuntimeState(target.stateFilePath, status)
      return status
    }

    const fileRecord = readFileRecord(target.licenseFilePath)
    const registryRecord = readRegistryRecord(target.registrySubkey, LICENSE_REGISTRY_VALUE_NAME)
    let selectedRecord = null
    let invalidMessage = null

    for (const candidate of [fileRecord, registryRecord].filter(Boolean)) {
      try {
        validateActivationRecord(candidate, machineIdHash)
        if (!selectedRecord || asTime(candidate.activated_at) > asTime(selectedRecord.activated_at)) {
          selectedRecord = candidate
        }
      } catch (error) {
        invalidMessage = getErrorMessage(error, 'Licenza non valida')
      }
    }

    if (selectedRecord) {
      writeFileRecord(target.licenseFilePath, selectedRecord)
      writeRegistryRecord(target.registrySubkey, LICENSE_REGISTRY_VALUE_NAME, selectedRecord)
      storageHealth.restored_file = !storageHealth.file_present
      storageHealth.restored_registry = !storageHealth.registry_present
      const status = activationStatusLicensed(machineIdHash, selectedRecord.payload, storageHealth, integrityFlags)
      writeRuntimeState(target.stateFilePath, status)
      return status
    }

    const activatedDemoStatus = bootstrapActivatedDemoTrial(integrityFlags)

    if (activatedDemoStatus) {
      writeRuntimeState(target.stateFilePath, activatedDemoStatus)
      return activatedDemoStatus
    }

    const status = buildStatus(
      buildMode,
      false,
      null,
      null,
      machineIdHash,
      storageHealth,
      integrityFlags,
      invalidMessage || 'Inserisci un codice di attivazione valido per sbloccare NEXORA V4 Enterprise.'
    )

    writeRuntimeState(target.stateFilePath, status)
    return status
  }

  function activateFullLicense(code) {
    if (normalizedBuildMode !== 'full') {
      throw new Error('Activation is only available in full mode')
    }

    const sid = currentUserSid()
    const machineIdHash = buildMachineIdHash(sid)
    const target = persistenceTarget(sid)
    const record = parseActivationCode(code, machineIdHash)
    writeFileRecord(target.licenseFilePath, record)
    writeRegistryRecord(target.registrySubkey, LICENSE_REGISTRY_VALUE_NAME, record)
    cachedStatus = bootstrapFullLicense(collectIntegrityFlags())
    return cachedStatus
  }

  function activateDemoLicense() {
    const status = bootstrapDemoTrial(collectIntegrityFlags(), { autoStart: true })

    if (!status) {
      throw new Error('Impossibile attivare la demo locale')
    }

    cachedStatus = status
    return cachedStatus
  }

  return {
    getStatus() {
      return cachedStatus
    },
    refreshStatus() {
      cachedStatus = bootstrapRuntimeStatus()
      return cachedStatus
    },
    activateDemoLicense,
    activateFullLicense,
  }

  function parseActivationCode(code, machineIdHash) {
    const segments = String(code || '').trim().split('.')
    if (segments.length !== 3 || segments[0] !== ACTIVATION_CODE_PREFIX) {
      throw new Error('Formato codice attivazione non valido')
    }

    const payloadBytes = base64UrlToBuffer(segments[1])
    const payload = JSON.parse(payloadBytes.toString('utf8'))
    validateActivationPayload(payload, machineIdHash)
    verifyActivationSignature(payloadBytes, segments[2])

    return {
      version: DATA_VERSION,
      payload,
      payload_base64: segments[1],
      signature_base64: segments[2],
      activated_at: new Date().toISOString(),
    }
  }

  function validateActivationRecord(record, machineIdHash) {
    const payloadBytes = base64UrlToBuffer(record.payload_base64)
    const payload = JSON.parse(payloadBytes.toString('utf8'))
    if (JSON.stringify(payload) !== JSON.stringify(record.payload)) {
      throw new Error('Licenza salvata alterata')
    }
    validateActivationPayload(payload, machineIdHash)
    verifyActivationSignature(payloadBytes, record.signature_base64)
  }

  function validateActivationPayload(payload, machineIdHash) {
    if (payload.version !== DATA_VERSION) throw new Error('Versione codice attivazione non supportata')
    if (payload.build_flavor !== 'full') throw new Error('Codice non valido per questa build')
    if (payload.machine_id_hash !== machineIdHash) throw new Error('Codice non valido per questo dispositivo')
    if (!String(payload.licensee || '').trim()) throw new Error('Codice attivazione incompleto')
    if (payload.expires_at && Date.now() > asTime(payload.expires_at)) throw new Error('Codice di attivazione scaduto')
  }

  function verifyActivationSignature(payloadBytes, signatureBase64) {
    if (!normalizedLicensePublicKey) {
      throw new Error('Missing activation public key. Rebuild the full desktop app with NEXORA_LICENSE_PUBLIC_KEY configured.')
    }

    const rawPublicKey = Buffer.from(normalizedLicensePublicKey, 'hex')
    if (rawPublicKey.length !== 32) {
      throw new Error('Invalid activation public key length')
    }

    const publicKey = crypto.createPublicKey({
      key: { kty: 'OKP', crv: 'Ed25519', x: bufferToBase64Url(rawPublicKey) },
      format: 'jwk',
    })

    if (!crypto.verify(null, payloadBytes, publicKey, base64UrlToBuffer(signatureBase64))) {
      throw new Error('Firma attivazione non valida')
    }
  }

  function evaluateTrial(machineIdHash, snapshot, integrityFlags, options = {}) {
    const autoStart = options.autoStart !== false
    const now = new Date().toISOString()
    const storageHealth = { ...snapshot.storage_health }
    const fileMatches = snapshot.file_record && snapshot.file_record.machine_id_hash === machineIdHash ? snapshot.file_record : null
    const registryMatches = snapshot.registry_record && snapshot.registry_record.machine_id_hash === machineIdHash ? snapshot.registry_record : null
    let hiddenState = { version: DATA_VERSION, ...(snapshot.hidden_state || {}) }
    let record

    if (fileMatches || registryMatches) {
      record = mergeRecords(fileMatches, registryMatches, now, integrityFlags)
      storageHealth.restored_file = !snapshot.file_record && Boolean(snapshot.registry_record)
      storageHealth.restored_registry = !snapshot.registry_record && Boolean(snapshot.file_record)
      hiddenState.last_machine_id_hash = machineIdHash
      hiddenState.last_seen_timestamp = now
      hiddenState.version = DATA_VERSION
      hiddenState.anomaly_counter = Math.max(hiddenState.anomaly_counter || 0, record.anomaly_counter || 0)
    } else if (snapshot.file_record || snapshot.registry_record || hiddenState.anomaly_counter > 0 || hiddenState.last_machine_id_hash) {
      hiddenState = {
        version: DATA_VERSION,
        anomaly_counter: (hiddenState.anomaly_counter || 0) + 1,
        last_machine_id_hash: machineIdHash,
        last_seen_timestamp: now,
      }
      storageHealth.hidden_counter_detected = true
      record = {
        version: DATA_VERSION,
        machine_id_hash: machineIdHash,
        first_run_timestamp: now,
        trial_expired: true,
        anomaly_counter: hiddenState.anomaly_counter,
        last_seen_timestamp: now,
        integrity_flags: integrityFlags,
      }
    } else if (autoStart) {
      hiddenState = { version: DATA_VERSION, anomaly_counter: 0, last_machine_id_hash: machineIdHash, last_seen_timestamp: now }
      record = {
        version: DATA_VERSION,
        machine_id_hash: machineIdHash,
        first_run_timestamp: now,
        trial_expired: false,
        anomaly_counter: 0,
        last_seen_timestamp: now,
        integrity_flags: integrityFlags,
      }
    } else {
      return null
    }

    const expiresAt = addHours(record.first_run_timestamp, TRIAL_WINDOW_HOURS)
    const trialExpired = Boolean(record.trial_expired) || Date.now() >= asTime(expiresAt)
    return {
      status: {
        build_flavor: 'demo',
        trial_enforced: true,
        trial_expired: trialExpired,
        activation_required: false,
        activation_valid: true,
        activation_holder: null,
        activation_expires_at: null,
        device_fingerprint: null,
        first_run_timestamp: record.first_run_timestamp,
        expires_at: expiresAt,
        hours_remaining: hoursRemaining(expiresAt),
        watermark_label: DEMO_WATERMARK,
        restricted_features: restrictedFeaturesFor('demo'),
        integrity_flags: integrityFlags,
        storage_health: storageHealth,
        message: trialExpired ? 'Trial scaduto' : `Trial attivo: ${hoursRemaining(expiresAt)} ore rimanenti`,
      },
      record: { ...record, trial_expired: trialExpired, last_seen_timestamp: now },
      hiddenState,
    }
  }

  function mergeRecords(fileRecord, registryRecord, now, integrityFlags) {
    const firstRunTimestamp = [fileRecord?.first_run_timestamp, registryRecord?.first_run_timestamp].filter(Boolean).sort()[0] || now
    const anomalyCounter = Math.max(fileRecord?.anomaly_counter || 0, registryRecord?.anomaly_counter || 0)
    const expired = Boolean(fileRecord?.trial_expired) || Boolean(registryRecord?.trial_expired) || Date.now() >= asTime(addHours(firstRunTimestamp, TRIAL_WINDOW_HOURS))
    return {
      version: DATA_VERSION,
      machine_id_hash: fileRecord?.machine_id_hash || registryRecord?.machine_id_hash || '',
      first_run_timestamp: firstRunTimestamp,
      trial_expired: expired,
      anomaly_counter: anomalyCounter,
      last_seen_timestamp: now,
      integrity_flags: integrityFlags,
    }
  }
}

function blockingErrorStatus(buildFlavor, message) {
  return {
    build_flavor: buildFlavor,
    trial_enforced: buildFlavor === 'demo',
    trial_expired: buildFlavor === 'demo',
    activation_required: buildFlavor === 'full',
    activation_valid: buildFlavor !== 'full',
    activation_holder: null,
    activation_expires_at: null,
    device_fingerprint: null,
    first_run_timestamp: null,
    expires_at: null,
    hours_remaining: 0,
    watermark_label: buildFlavor === 'demo' ? DEMO_WATERMARK : null,
    restricted_features: restrictedFeaturesFor(buildFlavor),
    integrity_flags: ['runtime_error'],
    storage_health: { file_present: false, registry_present: false, restored_file: false, restored_registry: false, hidden_counter_detected: false },
    message,
  }
}

function activationStatusUnlicensed(deviceFingerprint, storageHealth, integrityFlags, message) {
  return {
    build_flavor: 'full',
    trial_enforced: false,
    trial_expired: false,
    activation_required: true,
    activation_valid: false,
    activation_holder: null,
    activation_expires_at: null,
    device_fingerprint: deviceFingerprint,
    first_run_timestamp: null,
    expires_at: null,
    hours_remaining: 0,
    watermark_label: null,
    restricted_features: [],
    integrity_flags: integrityFlags,
    storage_health: storageHealth,
    message,
  }
}

function activationStatusLicensed(deviceFingerprint, payload, storageHealth, integrityFlags) {
  return {
    build_flavor: 'full',
    trial_enforced: false,
    trial_expired: false,
    activation_required: true,
    activation_valid: true,
    activation_holder: payload.licensee,
    activation_expires_at: payload.expires_at || null,
    device_fingerprint: deviceFingerprint,
    first_run_timestamp: null,
    expires_at: null,
    hours_remaining: payload.expires_at ? hoursRemaining(payload.expires_at) : Number.MAX_SAFE_INTEGER,
    watermark_label: null,
    restricted_features: [],
    integrity_flags: integrityFlags,
    storage_health: storageHealth,
    message: payload.expires_at ? `Licenza attiva per ${payload.licensee} fino al ${formatItalianDate(payload.expires_at)}` : `Licenza attiva per ${payload.licensee}`,
  }
}

function loadSnapshot(target) {
  return {
    file_record: readFileRecord(target.filePath),
    registry_record: readRegistryRecord(target.registrySubkey, REGISTRY_VALUE_NAME),
    hidden_state: readRegistryRecord(target.registrySubkey, HIDDEN_COUNTER_VALUE_NAME) || { version: DATA_VERSION, anomaly_counter: 0, last_machine_id_hash: null, last_seen_timestamp: null },
    storage_health: {
      file_present: fs.existsSync(target.filePath),
      registry_present: registryValueExists(target.registrySubkey, REGISTRY_VALUE_NAME),
      restored_file: false,
      restored_registry: false,
      hidden_counter_detected: registryValueExists(target.registrySubkey, HIDDEN_COUNTER_VALUE_NAME),
    },
  }
}

function persistTrialState(target, record, hiddenState) {
  writeFileRecord(target.filePath, record)
  writeRegistryRecord(target.registrySubkey, REGISTRY_VALUE_NAME, record)
  writeRegistryRecord(target.registrySubkey, HIDDEN_COUNTER_VALUE_NAME, hiddenState)
}

function storageRoot() {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
  return path.join(localAppData, STORAGE_DIR_NAME)
}

function persistenceTarget(sid) {
  const rootDir = storageRoot()
  const registryHex = sha256Hex(`${PRODUCT_NAMESPACE}::registry::${sid}`)
  const registryMirrorDir = path.join(rootDir, REGISTRY_STORAGE_DIR_NAME)
  return {
    filePath: path.join(rootDir, STORAGE_FILE_NAME),
    licenseFilePath: path.join(rootDir, LICENSE_FILE_NAME),
    stateFilePath: path.join(rootDir, STATE_FILE_NAME),
    keyFilePath: path.join(rootDir, KEY_FILE_NAME),
    registrySubkey: `Software\\${registryHex.slice(0, 18).toUpperCase()}`,
    registryMirrorDir,
  }
}

function writeRuntimeState(targetPath, status) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.writeFileSync(targetPath, JSON.stringify({
    version: DATA_VERSION,
    build_flavor: status.build_flavor,
    trial_expired: Boolean(status.trial_expired),
    activation_valid: Boolean(status.activation_valid),
    expires_at: status.expires_at || null,
    updated_at: new Date().toISOString(),
  }))
  hideSystemFile(targetPath)
}

function readFileRecord(targetPath) {
  try {
    if (!fs.existsSync(targetPath)) return null
    return JSON.parse(unprotectBuffer(fs.readFileSync(targetPath)).toString('utf8'))
  } catch {
    return null
  }
}

function writeFileRecord(targetPath, value) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.writeFileSync(targetPath, protectBuffer(Buffer.from(JSON.stringify(value), 'utf8')))
  hideSystemFile(targetPath)
}

function readRegistryRecord(subkey, valueName) {
  try {
    const targetPath = registryMirrorPath(subkey, valueName)
    if (!fs.existsSync(targetPath)) {
      return null
    }

    const encoded = fs.readFileSync(targetPath, 'utf8').trim()
    return encoded ? JSON.parse(unprotectBuffer(Buffer.from(encoded, 'base64')).toString('utf8')) : null
  } catch {
    return null
  }
}

function writeRegistryRecord(subkey, valueName, value) {
  const targetPath = registryMirrorPath(subkey, valueName)
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.writeFileSync(targetPath, protectBuffer(Buffer.from(JSON.stringify(value), 'utf8')).toString('base64'))
  hideSystemFile(targetPath)
}

function registryValueExists(subkey, valueName) {
  try {
    return fs.existsSync(registryMirrorPath(subkey, valueName))
  } catch {
    return false
  }
}

function protectBuffer(buffer) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKeys().current, iv)
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([Buffer.from('NXR2'), iv, authTag, encrypted])
}

function unprotectBuffer(buffer) {
  if (buffer.subarray(0, 4).toString('utf8') !== 'NXR2') {
    throw new Error('Formato archivio licensing non supportato')
  }

  const iv = buffer.subarray(4, 16)
  const authTag = buffer.subarray(16, 32)
  const encrypted = buffer.subarray(32)

  for (const key of encryptionKeys().all) {
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
      decipher.setAuthTag(authTag)
      return Buffer.concat([decipher.update(encrypted), decipher.final()])
    } catch {
    }
  }

  throw new Error('Impossibile decifrare l\'archivio licensing locale')
}

function currentUserSid() {
  const userInfo = os.userInfo()
  return `${process.env.USERDOMAIN || os.hostname()}\\${userInfo.username}`
}

function buildMachineIdHash(sid) {
  const userInfo = os.userInfo()
  const cpu = process.arch || 'cpu:unknown'
  const board = os.hostname() || 'board:unknown'
  const mac = primaryMacAddress()
  const normalized = `cpu=${normalizeComponent(cpu)}|board=${normalizeComponent(board)}|mac=${normalizeComponent(mac)}|sid=${normalizeComponent(sid)}|user=${normalizeComponent(userInfo.username)}|home=${normalizeComponent(userInfo.homedir)}`
  return sha256Hex(`${normalized}::${sha256Hex(`${PRODUCT_NAMESPACE}::salt::${normalized}`)}`)
}

function primaryMacAddress() {
  const candidates = []
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (!entry || entry.internal || !entry.mac || entry.mac === '00:00:00:00:00:00') continue
      const score = /ethernet|wi-?fi|wlan/i.test(name) ? 2 : 1
      candidates.push({ score, mac: entry.mac })
    }
  }
  return candidates.sort((left, right) => right.score - left.score || left.mac.localeCompare(right.mac))[0]?.mac || 'mac:unknown'
}

function hideSystemFile(targetPath) {
  try {
  } catch {
  }
}

function collectIntegrityFlags() {
  const flags = []
  if (process.execArgv.some(value => value.includes('inspect'))) flags.push('debugger_present')
  const suspicious = sandboxProcessesDetected()
  if (suspicious.length) flags.push(`sandbox_processes:${suspicious.join(',')}`)
  return flags
}

function sandboxProcessesDetected() {
  return []
}

function restrictedFeaturesFor(buildFlavor) {
  return buildFlavor === 'demo' ? ['export', 'ai', 'advanced_reports'] : []
}

function dpapiEntropy() {
  return `${PRODUCT_NAMESPACE}::${process.env.ELECTRON_BUILD_MODE === 'demo' ? 'demo' : process.env.ELECTRON_BUILD_MODE === 'full' ? 'full' : 'full'}::dpapi`
}

function encryptionKeys() {
  const current = localSecretEncryptionKey()
  const legacy = legacyEncryptionKey()
  return {
    current,
    all: current.equals(legacy) ? [current] : [current, legacy],
  }
}

function localSecretEncryptionKey() {
  const target = persistenceTarget(currentUserSid())

  try {
    if (fs.existsSync(target.keyFilePath)) {
      const encoded = fs.readFileSync(target.keyFilePath, 'utf8').trim()
      const storedKey = Buffer.from(encoded, 'hex')
      if (storedKey.length === 32) {
        return storedKey
      }
    }
  } catch {
  }

  const createdKey = crypto.randomBytes(32)
  fs.mkdirSync(path.dirname(target.keyFilePath), { recursive: true })
  fs.writeFileSync(target.keyFilePath, createdKey.toString('hex'))
  hideSystemFile(target.keyFilePath)
  return createdKey
}

function legacyEncryptionKey() {
  return crypto.createHash('sha256').update(`${dpapiEntropy()}::${currentUserSid()}::${os.hostname()}::${primaryMacAddress()}`).digest()
}

function registryMirrorPath(subkey, valueName) {
  const safeSubkey = sha256Hex(`${subkey}::${valueName}`)
  return path.join(storageRoot(), REGISTRY_STORAGE_DIR_NAME, `${safeSubkey}.dat`)
}

function addHours(isoValue, hours) {
  return new Date(asTime(isoValue) + hours * 60 * 60 * 1000).toISOString()
}

function hoursRemaining(isoValue) {
  return Math.max(0, Math.floor((asTime(isoValue) - Date.now()) / (60 * 60 * 1000)))
}

function asTime(value) {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) throw new Error('Timestamp non valido')
  return time
}

function normalizeComponent(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function sha256Hex(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function bufferToBase64Url(value) {
  return value.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBuffer(value) {
  const normalized = String(value).replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(normalized + '='.repeat((4 - (normalized.length % 4)) % 4), 'base64')
}

function formatItalianDate(value) {
  return new Intl.DateTimeFormat('it-IT').format(new Date(value))
}

function getErrorMessage(error, fallback) {
  return error instanceof Error && error.message ? error.message : fallback
}

module.exports = { createDesktopLicenseRuntime }
