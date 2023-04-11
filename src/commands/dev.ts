import {Command, Flags, Help, ux} from '@oclif/core'
import {Octokit} from '@octokit/rest'
import shell from 'shelljs'
import childProcess from 'node:child_process'
// @ts-ignore
import {isInternetAvailable} from 'is-internet-available'
import path from 'node:path'
import fse from 'fs-extra'
import {CLIENT_PATH, CMD_EXEC_PATH, DEV_CACHE_PATH, HOME_DIR, ONU_DEV_JSON_PATH, STUDIO_PATH, TARGET_STUDIO_VERSION, TS_FILES_DIST_PATH, VERSION_PATH} from '../constants'
import {checkPortRecursive, ensureYarn, studioNodeModulesExists, promptForYarn, execNodeModulesExists, execPackageExists, checkOnuDevJson} from '../helpers'
import chalk from 'chalk'
import open from 'open'

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

  command.log('Installing dependencies...')

  ensureYarn(command)
  shell.cd(CLIENT_PATH)
  shell.exec('yarn', {silent: true})
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
  
      onu install
      
      `)
    } else {
      ux.action.stop(`Dependencies were not installed correctly, run
  
      onu install
      
      `)
    }

    command.exit(1)
  }

  const hasTypescriptConfig = await fse.pathExists(path.join(CMD_EXEC_PATH, 'tsconfig.json'))

  shell.rm('-rf', TS_FILES_DIST_PATH)
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
      command.exit(1)
    }

    // install node modules
    shell.cp('-R', path.join(CMD_EXEC_PATH, 'package.json'), TS_FILES_DIST_PATH)
    shell.cd(TS_FILES_DIST_PATH)
    shell.exec('yarn', {silent: true})

    command.log('Compiled Typescript files')
  } else {
    shell.cp('-R', CMD_EXEC_PATH, TS_FILES_DIST_PATH)
  }

  // remove the devCache file
  shell.rm('-rf', DEV_CACHE_PATH)

  shell.cd(CLIENT_PATH)
  const relativePath = path.relative(CLIENT_PATH, CMD_EXEC_PATH)
  childProcess.spawnSync('yarn preconfigure', [relativePath], {shell: true})
  ux.action.stop('done')
  command.log('Local Onu Studio instance is ready. Launching your site...')
  await runSite(command, (port as string) || '3000')
}

const runSite = async (command: Command, port: string) => {
  // get the path from the onu.dev.json file
  const onuDevJson = JSON.parse(fse.readFileSync(ONU_DEV_JSON_PATH, 'utf8'))
  onuDevJson.env = onuDevJson.env || {}
  shell.cd(CLIENT_PATH)

  for (const key in onuDevJson.env) {
    // if the value if an object, stringify it
    if (typeof onuDevJson.env[key] === 'object') {
      onuDevJson.env[key] = JSON.stringify(onuDevJson.env[key])
    }
  }

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
  })

  onuStudioProcess.stderr.on('data', async (data: any) => {
    const output = data.toString()
    if (output.includes('ExperimentalWarning') || output.includes('Fast Refresh had to perform a full reload')) {
      return
    }

    console.log(output)
  })
  const onExit = (signal: 'SIGINT' | 'SIGTERM') => {
    if (signal === 'SIGINT') {
      command.log(chalk.magenta('\n✨ Successfully exited Onu Studio\n'))
    }

    onuStudioProcess.kill('SIGINT')
  }

  process.on('SIGINT', () => onExit('SIGINT'))
  process.on('SIGTERM', () => onExit('SIGTERM'))
  // listener()
}

export default class Dev extends Command {
  static description = 'Runs a local dev studio [experimental 🧪]'

  static examples = [
    '<%= config.bin %> <%= command.id %> -p 8000',
  ]

  static usage = '<%= command.id %> [-p <value>]'

  static flags = {
    port: Flags.integer({char: 'p', description: 'Port to run on', default: 3000}),
    help: Flags.boolean({char: 'h', description: 'Show help'}),
    tsconfig: Flags.string({char: 't', description: 'Path to a custom tsconfig file', default: './tsconfig.json'}),
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

    await runDevStudio(this, port.toString(), flags.tsconfig)
  }
}
