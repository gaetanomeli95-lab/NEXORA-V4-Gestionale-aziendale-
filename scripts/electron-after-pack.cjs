const fs = require('fs')
const path = require('path')

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) {
    return
  }

  fs.mkdirSync(destination, { recursive: true })

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const sourcePath = path.join(source, entry.name)
    const destinationPath = path.join(destination, entry.name)

    if (entry.isDirectory()) {
      copyDirectory(sourcePath, destinationPath)
    } else {
      fs.copyFileSync(sourcePath, destinationPath)
    }
  }
}

module.exports = async function afterPack(context) {
  const projectRoot = context.packager.projectDir
  const appRoot = path.join(context.appOutDir, 'resources', 'app')
  const prismaClientSource = path.join(projectRoot, 'node_modules', '.prisma', 'client')
  const prismaClientDestination = path.join(appRoot, 'node_modules', '.prisma', 'client')

  if (!fs.existsSync(appRoot)) {
    throw new Error(`Packaged app not found: ${appRoot}`)
  }

  if (!fs.existsSync(prismaClientSource)) {
    throw new Error(`Prisma client not found: ${prismaClientSource}`)
  }

  copyDirectory(prismaClientSource, prismaClientDestination)
}
