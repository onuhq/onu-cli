import {Command, Flags, Help, ux} from '@oclif/core'
import {Octokit} from '@octokit/rest'
import shell from 'shelljs'
import childProcess, {ChildProcess} from 'node:child_process'
// @ts-ignore
import {isInternetAvailable} from 'is-internet-available'
import path from 'node:path'
import fse from 'fs-extra'
import {CLIENT_PATH, CMD_EXEC_PATH, DEV_CACHE_PATH, HOME_DIR, ONU_DEV_JSON_PATH, STUDIO_PATH, TARGET_STUDIO_VERSION, TS_FILES_DIST_PATH, VERSION_PATH} from '../constants'
import {checkPortRecursive, ensureYarn, studioNodeModulesExists, promptForYarn, execNodeModulesExists, execPackageExists, checkOnuDevJson, installDependencies} from '../helpers'
import chalk from 'chalk'
import open from 'open'
import chokidar from 'chokidar'

const downloadTargetOnuStudio = async (command: Command) => {
  fse.emptyDirSync(STUDIO_PATH)

  command.log('Downloading Onu framework...')

  const octokit = new Octokit()
  const downloadRes = await octokit.repos.downloadTarballArchive({
    owner: 'onuhq',
    repo: 'studio',
    ref: TARGET_STUDIO_VERSION,
  })

  command.log('Extracting Onu framework...')
  const TAR_PATH = path.join(STUDIO_PATH, 'onu.tar.gz')
  fse.writeFileSync(TAR_PATH, Buffer.from(downloadRes.data as any))

  // strip-components 1 removes the top level directory from the unzipped content
  // which is a folder with the release sha
  fse.mkdirSync(path.join(STUDIO_PATH, 'onu-tmp'))
  shell.exec('tar -xzf onu.tar.gz -C onu-tmp --strip-components 1', {
    silent: true,
  })

  fse.removeSync(TAR_PATH)
  fse.moveSync(
    path.join(STUDIO_PATH, 'onu-tmp'),
    path.join(CLIENT_PATH),
  )

  fse.writeFileSync(VERSION_PATH, TARGET_STUDIO_VERSION)

  // Delete unnecessary content downloaded from GitHub
  fse.removeSync(path.join(STUDIO_PATH, 'onu-tmp'))

  // add an empty tasks.json file to avoid errors
  fse.writeFileSync(path.join(CLIENT_PATH, 'tasks.json'), '[]')

  command.log('Installing dependencies...')

  ensureYarn(command)
  shell.cd(CLIENT_PATH)
  shell.exec('yarn', {silent: true})
}

const refreshFiles = async (command: Command, installDeps: boolean, tsconfig?: string, onuStudioProcess?: ChildProcess) => {
  const hasTypescriptConfig = await fse.pathExists(path.join(CMD_EXEC_PATH, 'tsconfig.json'))

  if (installDeps) {
    shell.rm('-rf', TS_FILES_DIST_PATH)
  }

  if (hasTypescriptConfig) {
    // compile the files
    const tsConfigFilePath = tsconfig || 'tsconfig.json'
    const tscAliasCommand = `&& npx --yes tsc-alias -p ${tsConfigFilePath} --outDir ${TS_FILES_DIST_PATH}`
    const typescriptProcess = childProcess.spawnSync(`npx --yes tsc -p ${tsConfigFilePath} --outDir ${TS_FILES_DIST_PATH} ${tscAliasCommand}`, [], {
      shell: true,
      cwd: CMD_EXEC_PATH,
      stdio: 'pipe',
    })

    if (typescriptProcess.status !== 0) {
      ux.action.stop()
      console.log(typescriptProcess.stdout.toString())
      console.log(typescriptProcess.stderr.toString())
      console.log('There was an error compiling your Typescript files')
      if (onuStudioProcess) {
        console.log(chalk.red(`Your changes were not synced. Please check any errors above and try again. \n\nTo avoid unexpected behavior, press ${chalk.bold('CTRL + C')} to exit the Onu Studio process and then run ${chalk.bold('onu dev')} again.`))
      } else {
        command.exit(1)
      }
    }

    if (installDeps) {
      // install node modules
      shell.cp('-R', path.join(CMD_EXEC_PATH, 'package.json'), TS_FILES_DIST_PATH)
      shell.cd(TS_FILES_DIST_PATH)
      shell.exec('yarn', {silent: true})
      command.log('Compiled Typescript files')
    }
  } else {
    const rsyncProcess = childProcess.spawnSync('rsync', ['-a', '--exclude=node_modules', '--exclude=.git', CMD_EXEC_PATH + '/', TS_FILES_DIST_PATH], {
      shell: true,
      cwd: CMD_EXEC_PATH,
      stdio: 'pipe',
    })
    if (rsyncProcess.status !== 0) {
      ux.action.stop()
      console.log(rsyncProcess.stdout.toString())
      console.log(rsyncProcess.stderr.toString())
      console.log('There was an error syncing your Javascript files')
      command.exit(1)
    }

    if (installDeps) {
      // install node modules
      shell.cd(TS_FILES_DIST_PATH)
      shell.exec('yarn', {silent: true})
    }
  }
}

const performHotReload = async (command: Command, onuStudioProcess: ChildProcess, tsconfig?: string) => {
  ux.action.start('Refreshing local Onu Studio instance...')
  await refreshFiles(command, false, tsconfig, onuStudioProcess)
  shell.cd(CLIENT_PATH)
  const onuDevJson = getOnuDevJson()
  childProcess.spawnSync('yarn preconfigure', {
    shell: true,
    env: {
      ...process.env,
      ONU_PATH: path.join(TS_FILES_DIST_PATH, onuDevJson.path),
      ...onuDevJson.env,
    },
  })
  ux.action.stop()
}

const listener = async (command: Command, onuStudioProcess: ChildProcess, tsconfig?: string) => {
  const watcher = chokidar
  .watch(CMD_EXEC_PATH, {
    ignoreInitial: true,
    ignored: ['node_modules', '.git', '.idea', '.vscode'],
    cwd: CMD_EXEC_PATH,
  })
  .on('add', async (filename: string) => {
    console.log(chalk.magenta('\nfile added:', filename))
    await performHotReload(command, onuStudioProcess, tsconfig)
  })
  .on('change', async (filename: string) => {
    console.log(chalk.magenta('\nfile changed:', filename))
    await performHotReload(command, onuStudioProcess, tsconfig)
  })
  .on('unlink', async (filename: string) => {
    console.log(chalk.magenta('\nfile removed:', filename))
    await performHotReload(command, onuStudioProcess, tsconfig)
  })

  process.on('SIGINT', () => {
    watcher.close()
  })

  process.on('SIGTERM', () => {
    watcher.close()
  })
}

const runDevStudio = async (command: Command, port: string | undefined, tsconfig: string | undefined) => {
  shell.cd(HOME_DIR)
  await promptForYarn()
  ux.action.start('Preparing local Onu Studio instance...')
  await fse.ensureDir(STUDIO_PATH)
  shell.cd(STUDIO_PATH)

  const internet = await isInternetAvailable()
  if (!internet && !(await fse.pathExists(CLIENT_PATH))) {
    ux.action.stop(
      'Running Onu Studio for the first time requires an internet connection.',
    )
    command.exit(1)
  }

  if (internet) {
    const onuStudioVersionExists = await fse.pathExists(VERSION_PATH)

    let needToDownloadTargetOnuStudio = !onuStudioVersionExists

    if (onuStudioVersionExists) {
      const currVersion = fse.readFileSync(VERSION_PATH, 'utf8')
      if (currVersion !== TARGET_STUDIO_VERSION) {
        needToDownloadTargetOnuStudio = true
      }
    }

    if (needToDownloadTargetOnuStudio) {
      await downloadTargetOnuStudio(command)
    }
  }

  if (!(await studioNodeModulesExists())) {
    // eslint-disable-next-line no-negated-condition
    if (!internet) {
      ux.action.stop(`Dependencies are missing and you are offline. Connect to the internet and run
  
      npx onu@latest dev --install-deps
      
      `)
    } else {
      ux.action.stop(`Dependencies were not installed correctly, run
  
      npx onu@latest dev --install-deps
      
      `)
    }

    command.exit(1)
  }

  await refreshFiles(command, true, tsconfig)

  // remove the devCache file
  shell.rm('-rf', DEV_CACHE_PATH)

  shell.cd(CLIENT_PATH)
  const onuDevJson = getOnuDevJson()
  const preconfigureProcess = childProcess.spawnSync('yarn preconfigure', {shell: true,
    env: {
      ...process.env,
      PORT: port,
      ONU_PATH: path.join(TS_FILES_DIST_PATH, onuDevJson.path),
      ...onuDevJson.env,
    },
  })
  if (preconfigureProcess.status !== 0) {
    ux.action.stop()
    console.log(preconfigureProcess.stdout.toString())
    console.log(preconfigureProcess.stderr.toString())
    console.log('There was an error configuring your Onu Studio instance')
    command.exit(1)
  }

  ux.action.stop('done')
  command.log('Local Onu Studio instance is ready. Launching your site...')
  await runSite(command, (port as string) || '3000', tsconfig)
}

const getOnuDevJson = () => {
  const onuDevJson = JSON.parse(fse.readFileSync(ONU_DEV_JSON_PATH, 'utf8'))
  onuDevJson.env = onuDevJson.env || {}
  for (const key in onuDevJson.env) {
    // if the value if an object, stringify it
    if (typeof onuDevJson.env[key] === 'object') {
      onuDevJson.env[key] = JSON.stringify(onuDevJson.env[key])
    }
  }

  return onuDevJson
}

const runSite = async (command: Command, port: string, tsconfig: string | undefined) => {
  // get the path from the onu.dev.json file
  const onuDevJson = getOnuDevJson()
  shell.cd(CLIENT_PATH)

  const onuStudioProcess = childProcess.spawn('npm run dev', {
    env: {
      ...process.env,
      PORT: port,
      ONU_PATH: path.join(TS_FILES_DIST_PATH, onuDevJson.path),
      ...onuDevJson.env,
    },
    cwd: CLIENT_PATH,
    stdio: 'pipe',
    shell: true,
  })
  onuStudioProcess.stdout.on('data', async (data: any) => {
    const output = data.toString()
    if (output.includes('started server on')) {
      console.log(
        chalk.green(`Onu Studio is available at http://localhost:${port}`),
      )
      console.log(
        chalk.green('Press Ctrl+C any time to stop the local studio.'),
      )
      await open(`http://localhost:${port}`)
    }

    if (output.includes('[debug][onu]')) {
      console.log(output)
    }
  })

  onuStudioProcess.stderr.on('data', async (data: any) => {
    const output = data.toString()
    if (output.includes('ExperimentalWarning') || output.includes('Fast Refresh had to perform a full reload')) {
      return
    }

    console.log(output)
  })
  const onExit = (signal?: 'SIGINT' | 'SIGTERM') => {
    if (signal === 'SIGINT') {
      command.log(chalk.magenta('\n✨ Successfully exited Onu Studio\n'))
    }

    onuStudioProcess.kill('SIGINT')
  }

  onuStudioProcess.on('SIGKILL', () => command.exit())

  process.on('SIGINT', () => onExit('SIGINT'))
  process.on('SIGTERM', () => onExit('SIGTERM'))

  listener(command, onuStudioProcess, tsconfig)
}

export default class Dev extends Command {
  static description = 'run a local dev studio [experimental 🧪]'

  static examples = [
    '<%= config.bin %> <%= command.id %> -p 8000',
  ]

  static usage = '<%= command.id %> [-p <value>]'

  static flags = {
    port: Flags.integer({char: 'p', description: 'Port to run on', default: 3000}),
    help: Flags.boolean({char: 'h', description: 'Show help'}),
    tsconfig: Flags.string({char: 't', description: 'Path to a custom tsconfig file', default: './tsconfig.json'}),
    'install-deps': Flags.boolean({description: 'Re-install the studio app dependencies'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Dev)

    if (flags.help) {
      const help = new Help(this.config)
      help.showHelp(['dev'])
      return
    }

    // ensure that there is a package.json and node_modules
    const hasNodeModules = await execNodeModulesExists()
    const hasPackageJson = await execPackageExists()
    if (!hasNodeModules || !hasPackageJson) {
      this.error('You must run this command in the project\'s root directory.', {exit: 1})
    }

    await checkOnuDevJson(this)

    const port = await checkPortRecursive(flags.port)

    if (!port) {
      this.error('No available port found.')
    }

    const internet = await isInternetAvailable()

    if (!internet && flags['install-deps']) {
      this.error('You must be connected to the internet to install dependencies.')
    }

    if (flags['install-deps']) {
      await installDependencies(this)
    }

    await runDevStudio(this, port.toString(), flags.tsconfig)
  }
}
