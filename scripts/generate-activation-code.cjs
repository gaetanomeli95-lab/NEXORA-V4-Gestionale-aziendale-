const crypto = require('crypto')
const { loadLicenseEnv } = require('./license-env.cjs')

const ACTIVATION_CODE_PREFIX = 'NXR1'
const DATA_VERSION = 1
const BUILD_FLAVOR = 'full'

loadLicenseEnv()

function parseArgs(argv) {
  const parsed = {}

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]

    if (!token.startsWith('--')) {
      continue
    }

    const key = token.slice(2)
    const next = argv[index + 1]

    if (!next || next.startsWith('--')) {
      parsed[key] = 'true'
      continue
    }

    parsed[key] = next
    index += 1
  }

  return parsed
}

function base64UrlToBuffer(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  return Buffer.from(normalized + padding, 'base64')
}

function bufferToBase64Url(value) {
  return value.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function requireValue(value, message) {
  if (!value || !String(value).trim()) {
    throw new Error(message)
  }

  return String(value).trim()
}

function normalizeIsoDate(value, label) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} is not a valid ISO date`)
  }

  return date.toISOString()
}

function loadPrivateKey(args) {
  const pkcs8Base64 = args['private-key-pkcs8'] || process.env.NEXORA_LICENSE_PRIVATE_KEY_PKCS8
  if (pkcs8Base64 && String(pkcs8Base64).trim()) {
    return crypto.createPrivateKey({
      key: Buffer.from(String(pkcs8Base64).trim(), 'base64'),
      format: 'der',
      type: 'pkcs8',
    })
  }

  const privateKeyPem = args['private-key-pem'] || process.env.NEXORA_LICENSE_PRIVATE_KEY_PEM
  if (privateKeyPem && String(privateKeyPem).trim()) {
    return crypto.createPrivateKey(String(privateKeyPem).trim())
  }

  throw new Error('Missing private key. Use --private-key-pkcs8 or set NEXORA_LICENSE_PRIVATE_KEY_PKCS8.')
}

function getPublicKeyHex(privateKey) {
  const publicKey = crypto.createPublicKey(privateKey)
  const publicJwk = publicKey.export({ format: 'jwk' })
  return base64UrlToBuffer(publicJwk.x).toString('hex')
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const licensee = requireValue(args.licensee, 'Missing --licensee')
  const machineIdHash = requireValue(args.machine || args['machine-id-hash'], 'Missing --machine')
  const issuedAt = normalizeIsoDate(args.issued || new Date().toISOString(), '--issued')
  const expiresAt = args.expires ? normalizeIsoDate(args.expires, '--expires') : null

  if (expiresAt && new Date(expiresAt).getTime() <= new Date(issuedAt).getTime()) {
    throw new Error('--expires must be later than --issued')
  }

  const privateKey = loadPrivateKey(args)
  const publicKeyHex = getPublicKeyHex(privateKey)
  const expectedPublicKeyHex = process.env.NEXORA_LICENSE_PUBLIC_KEY?.trim().toLowerCase()

  if (expectedPublicKeyHex && expectedPublicKeyHex !== publicKeyHex) {
    throw new Error('Private key does not match NEXORA_LICENSE_PUBLIC_KEY')
  }

  const payload = {
    version: DATA_VERSION,
    licensee,
    machine_id_hash: machineIdHash,
    build_flavor: BUILD_FLAVOR,
    issued_at: issuedAt,
    expires_at: expiresAt,
  }

  const payloadBytes = Buffer.from(JSON.stringify(payload), 'utf8')
  const signature = crypto.sign(null, payloadBytes, privateKey)
  const activationCode = `${ACTIVATION_CODE_PREFIX}.${bufferToBase64Url(payloadBytes)}.${bufferToBase64Url(signature)}`

  process.stdout.write(
    `${JSON.stringify({
      activationCode,
      publicKeyHex,
      payload,
    }, null, 2)}\n`
  )
}

main()
