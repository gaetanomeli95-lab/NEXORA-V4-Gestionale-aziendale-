const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

function removeDirectory(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return
  }

  fs.rmSync(targetPath, { recursive: true, force: true })
}

function copyFile(source, destination) {
  if (!fs.existsSync(source)) {
    return
  }

  fs.mkdirSync(path.dirname(destination), { recursive: true })
  fs.copyFileSync(source, destination)
}

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

function replaceInFile(targetPath, searchValue, replaceValue) {
  if (!fs.existsSync(targetPath)) {
    return
  }

  const fileContent = fs.readFileSync(targetPath, 'utf8')
  const nextContent = fileContent.replace(searchValue, replaceValue)

  if (nextContent !== fileContent) {
    fs.writeFileSync(targetPath, nextContent)
  }
}

function quoteShellArg(value) {
  if (!/[\s"]/u.test(value)) {
    return value
  }

  return `"${value.replace(/"/g, '\\"')}"`
}

function runCommand(command, args, cwd, env = {}) {
  const options = {
    cwd,
    env: {
      ...process.env,
      ...env,
    },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  }

  const result = process.platform === 'win32'
    ? spawnSync([command, ...args.map(quoteShellArg)].join(' '), options)
    : spawnSync(command, args, options)

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`)
  }
}

function prepareDesktopTemplateDatabase(projectRoot) {
  const templateDbPath = path.join(projectRoot, 'prisma', 'desktop-template.db')
  const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma')
  const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'

  if (fs.existsSync(templateDbPath)) {
    fs.rmSync(templateDbPath, { force: true })
  }

  runCommand(
    npxCommand,
    ['prisma', 'db', 'push', '--skip-generate', '--schema', schemaPath],
    projectRoot,
    {
      DATABASE_URL: `file:${templateDbPath.replace(/\\/g, '/')}`,
    }
  )
}

function main() {
  const projectRoot = process.cwd()
  const standaloneRoot = path.join(projectRoot, '.next', 'standalone')
  const desktopAppRoot = path.join(projectRoot, 'desktop-app')
  const prismaClientRoot = path.join(projectRoot, 'node_modules', '.prisma', 'client')

  if (!fs.existsSync(standaloneRoot)) {
    throw new Error('Missing .next/standalone. Run next build first.')
  }

  if (!fs.existsSync(prismaClientRoot)) {
    throw new Error('Missing node_modules/.prisma/client. Run prisma generate before packaging.')
  }

  prepareDesktopTemplateDatabase(projectRoot)

  removeDirectory(desktopAppRoot)
  copyDirectory(standaloneRoot, desktopAppRoot)
  copyDirectory(path.join(projectRoot, '.next', 'static'), path.join(desktopAppRoot, '.next', 'static'))
  copyDirectory(path.join(projectRoot, 'public'), path.join(desktopAppRoot, 'public'))
  copyDirectory(path.join(projectRoot, 'electron'), path.join(desktopAppRoot, 'electron'))
  copyFile(path.join(projectRoot, 'scripts', 'license-env.cjs'), path.join(desktopAppRoot, 'scripts', 'license-env.cjs'))
  copyDirectory(prismaClientRoot, path.join(desktopAppRoot, 'node_modules', 'prisma-generated', 'client'))
  copyFile(path.join(projectRoot, 'package.json'), path.join(desktopAppRoot, 'package.json'))
  replaceInFile(
    path.join(desktopAppRoot, 'node_modules', '@prisma', 'client', 'default.js'),
    /\.prisma\/client\/default/g,
    'prisma-generated/client/default'
  )
  replaceInFile(
    path.join(desktopAppRoot, 'node_modules', '@prisma', 'client', 'index.js'),
    /\.prisma\/client\/default/g,
    'prisma-generated/client/default'
  )
  replaceInFile(
    path.join(desktopAppRoot, 'node_modules', '@prisma', 'client', 'index-browser.js'),
    /\.prisma\/client\/index-browser/g,
    'prisma-generated/client/index-browser'
  )
  replaceInFile(
    path.join(desktopAppRoot, 'node_modules', '@prisma', 'client', 'edge.js'),
    /\.prisma\/client\/edge/g,
    'prisma-generated/client/edge'
  )

  console.log('Electron standalone assets prepared successfully.')
}

main()
