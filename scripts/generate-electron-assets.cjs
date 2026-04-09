const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const sizes = [16, 24, 32, 48, 64, 128, 256]

function createSvg(size) {
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="32" y1="24" x2="224" y2="232" gradientUnits="userSpaceOnUse">
        <stop stop-color="#3B82F6"/>
        <stop offset="1" stop-color="#4F46E5"/>
      </linearGradient>
      <filter id="shadow" x="0" y="0" width="256" height="256" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
        <feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#1E1B4B" flood-opacity="0.28"/>
      </filter>
    </defs>
    <rect x="24" y="24" width="208" height="208" rx="52" fill="url(#bg)" filter="url(#shadow)"/>
    <path d="M78 182V74L178 182V74" stroke="white" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  `
}

function createIco(pngBuffers) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngBuffers.length, 4)

  const entries = []
  const images = []
  let offset = 6 + pngBuffers.length * 16

  for (const { size, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16)
    entry.writeUInt8(size >= 256 ? 0 : size, 0)
    entry.writeUInt8(size >= 256 ? 0 : size, 1)
    entry.writeUInt8(0, 2)
    entry.writeUInt8(0, 3)
    entry.writeUInt16LE(1, 4)
    entry.writeUInt16LE(32, 6)
    entry.writeUInt32LE(buffer.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += buffer.length
    entries.push(entry)
    images.push(buffer)
  }

  return Buffer.concat([header, ...entries, ...images])
}

async function main() {
  const targetDir = path.join(process.cwd(), 'electron', 'assets')
  fs.mkdirSync(targetDir, { recursive: true })

  const pngBuffers = []

  for (const size of sizes) {
    const svg = createSvg(size)
    const buffer = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer()
    pngBuffers.push({ size, buffer })
  }

  const appPng = await sharp(Buffer.from(createSvg(512))).resize(512, 512).png().toBuffer()
  const icoBuffer = createIco(pngBuffers)

  fs.writeFileSync(path.join(targetDir, 'nexora-icon.png'), appPng)
  fs.writeFileSync(path.join(targetDir, 'nexora.ico'), icoBuffer)

  console.log('Electron assets generated successfully.')
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
