import {Command, ux} from '@oclif/core'
import shell from 'shelljs'
import path from 'node:path'
import fse from 'fs-extra'
import detect from 'detect-port'
import {DOT_ONU, CLIENT_PATH} from '../constants'

export const nodeModulesExists = async (): Promise<boolean> => {
  return fse.pathExists(path.join(DOT_ONU, 'studio', 'client', 'node_modules'))
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

  const answer = await ux.prompt(`Port ${port} is already in use. Use port ${_port} instead? [Y/n]\n`)

  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    return await checkPortRecursive(_port)
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
