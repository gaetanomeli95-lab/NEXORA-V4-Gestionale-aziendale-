const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { resolveLicenseEnvFilePath } = require('./license-env.cjs')

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

function main() {
  const args = parseArgs(process.argv.slice(2))
  const writeEnvFile = args['write-env-file'] === 'true'
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519')
  const publicJwk = publicKey.export({ format: 'jwk' })
  const publicKeyHex = base64UrlToBuffer(publicJwk.x).toString('hex')
  const privateKeyPkcs8Base64 = privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64')
  const privateKeyPem = privateKey.export({ format: 'pem', type: 'pkcs8' }).toString().trim()
  let envFilePath = null

  if (writeEnvFile) {
    envFilePath = args['env-file']
      ? path.resolve(args['env-file'])
      : resolveLicenseEnvFilePath()

    if (fs.existsSync(envFilePath) && args.force !== 'true') {
      throw new Error(`Refusing to overwrite existing file: ${envFilePath}`)
    }

    fs.mkdirSync(path.dirname(envFilePath), { recursive: true })
    fs.writeFileSync(
      envFilePath,
      [
        `NEXORA_LICENSE_PUBLIC_KEY=${publicKeyHex}`,
        `NEXORA_LICENSE_PRIVATE_KEY_PKCS8=${privateKeyPkcs8Base64}`,
      ].join('\n') + '\n'
    )
  }

  const output = {
    publicKeyHex,
    envFilePath,
    buildEnv: `NEXORA_LICENSE_PUBLIC_KEY=${publicKeyHex}`,
  }

  if (!writeEnvFile || args['show-private'] === 'true') {
    output.privateKeyPkcs8Base64 = privateKeyPkcs8Base64
    output.privateKeyPem = privateKeyPem
    output.signingEnv = `NEXORA_LICENSE_PRIVATE_KEY_PKCS8=${privateKeyPkcs8Base64}`
  }

  process.stdout.write(
    `${JSON.stringify(output, null, 2)}\n`
  )
}

main()
