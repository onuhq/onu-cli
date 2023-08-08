import {Command, ux} from '@oclif/core'
import shell from 'shelljs'
import path from 'node:path'
import fse from 'fs-extra'
import detect from 'detect-port'
import {DOT_ONU, CLIENT_PATH, CMD_EXEC_PATH} from '../constants'
import chalk from 'chalk'
import inquirer from 'inquirer'
import {ONU_DEV_JSON} from './starter-files'
import childProcess from 'node:child_process'

export const installProjectDeps = (installer: string, projectName: string, command: Command): void => {
  const installProcess = childProcess.spawnSync(installer === 'npm' ? 'npm install' : 'yarn', {
    cwd: path.join(CMD_EXEC_PATH, projectName),
    stdio: 'pipe',
    shell: true,
  })
  if (installProcess.status !== 0) {
    command.log(installProcess.stdout.toString())
    command.warn(`There was an error installing dependencies for ${projectName}`)
    command.exit(1)
  }
}

export const studioNodeModulesExists = async (): Promise<boolean> => {
  return fse.pathExists(path.join(DOT_ONU, 'studio', 'client', 'node_modules'))
}

export const execNodeModulesExists = async (): Promise<boolean> => {
  return fse.pathExists(path.join(CMD_EXEC_PATH, 'node_modules'))
}

export const execPackageExists = async (): Promise<boolean> => {
  return fse.pathExists(path.join(CMD_EXEC_PATH, 'package.json'))
}

export const onuJsonExists = async (): Promise<boolean> => {
  return fse.pathExists(path.join(CMD_EXEC_PATH, 'onu.json'))
}

export const ensureYarn = (command: Command): void => {
  const yarnInstalled = shell.which('yarn')
  if (!yarnInstalled) {
    command.warn(`yarn must be installed, run
    npm install --global yarn
    `)
    command.exit(1)
  }
}

export const installDependencies = async (command: Command): Promise<void> => {
  ensureYarn(command)
  shell.cd(CLIENT_PATH)
  shell.exec('yarn')
  command.log('Dependencies installed.')
}

export const checkPortRecursive = async (port = 3000): Promise<number | undefined> => {
  const _port = await detect(port)

  if (port === _port) {
    return port
  }

  const answer = await ux.prompt(`Port ${port} is already in use. Use port ${_port} instead? [Y/n]`)

  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    return await checkPortRecursive(_port)
  }
}

const addToGitIgnore = () => {
  const gitIgnorePath = path.join(CMD_EXEC_PATH, '.gitignore')
  const gitIgnoreExists = fse.pathExistsSync(gitIgnorePath)

  if (gitIgnoreExists) {
    const gitIgnore = fse.readFileSync(gitIgnorePath, 'utf8')
    const gitIgnoreLines = gitIgnore.split('\n')
    const onuDevJsonLine = gitIgnoreLines.find(line => line === 'onu.dev.json')

    if (!onuDevJsonLine) {
      fse.appendFileSync(gitIgnorePath, 'onu.dev.json')
    }
  } else {
    fse.writeFileSync(gitIgnorePath, 'onu.dev.json')
  }
}

export const checkOnuDevJson = async (command: Command): Promise<void> => {
  const devJsonExists = await fse.pathExists(path.join(CMD_EXEC_PATH, 'onu.dev.json'))

  if (!devJsonExists) {
    const responses: any = await inquirer.prompt([{
      name: 'answer',
      message: 'No onu.dev.json file found. Create one? [Y/n]',
      type: 'input',
    }])
    const answer = responses.answer
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      // Create the onu.dev.json file
      const onuDevJson = JSON.parse(JSON.stringify(ONU_DEV_JSON))

      const responses: any = await inquirer.prompt([
        {
          name: 'onuPath',
          message: 'Enter the path to your onu/ directory. ex: src/onu/',
          type: 'input',
        },
        {
          name: 'addGitIgnore',
          message: 'Add onu.dev.json to .gitignore? [Y/n]',
          type: 'input',
        },
      ])
      const onuPath = responses.onuPath
      const addGitIgnore = responses.addGitIgnore

      if (!onuPath) {
        command.error('`path` is required.')
      }

      onuDevJson.path = onuPath

      // Write the onu.dev.json file
      fse.writeFileSync(path.join(CMD_EXEC_PATH, 'onu.dev.json'), JSON.stringify(onuDevJson, null, 2))

      // Add onu.dev.json to .gitignore
      if (addGitIgnore.toLowerCase() === 'y' || addGitIgnore.toLowerCase() === 'yes') {
        addToGitIgnore()
      }

      command.log(chalk.green('onu.dev.json created. Continuing installation...'))
      return
    }

    command.error(chalk.red('onu.dev.json is required for the `dev` command.'))
  }

  // onu.dev.json exists. Check if it has a path
  const onuDevJson = fse.readJsonSync(path.join(CMD_EXEC_PATH, 'onu.dev.json'))

  if (!onuDevJson.path) {
    command.error(chalk.yellow('`path` is required in onu.dev.json.'))
  }
}

export const promptForYarn = async (): Promise<void> => {
  const yarnInstalled = shell.which('yarn')
  if (!yarnInstalled) {
    const answer = await ux.prompt('yarn must be globally installed. Install yarn? (y/n)')
    const confirm = answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes'

    if (confirm) {
      shell.exec('npm install --global yarn')
    } else {
      console.log('Installation cancelled.')
    }

    return
  }

  console.log('yarn is installed. Continuing installation...')
}
