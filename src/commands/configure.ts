import {Command, ux} from '@oclif/core'
import inquirer from 'inquirer'
import fse from 'fs-extra'
import {BASE_URL, CONFIG_FILE_PATH, DOT_ONU, OnuConfig} from '../constants'
import chalk from 'chalk'
import fetch from 'node-fetch'

export default class Configure extends Command {
  static description = 'configure the CLI for your project'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    const responses: any = await inquirer.prompt([
      {
        name: 'apiKey',
        message: 'Enter your API key:',
        type: 'password',
        mask: '*',
      },
    ])
    const apiKey = responses.apiKey

    ux.action.start('Validating API key')

    const resp = await fetch(`${BASE_URL}/v1/cli/auth/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (resp.status === 200) {
      ux.action.stop('API key is valid')
      ux.action.start('Storing configuration')

      // Ensure the .onu directory exists
      await fse.ensureDir(DOT_ONU)

      const configFileExists = await fse.pathExists(CONFIG_FILE_PATH)
      if (!configFileExists) {
        await fse.writeFile(CONFIG_FILE_PATH, JSON.stringify({}))
      }

      const data = await resp.json()

      const config: OnuConfig = await fse.readJSON(CONFIG_FILE_PATH)

      if (!config.auth) {
        config.auth = {}
      }

      if (!config.orgInfo) {
        config.orgInfo = {}
      }

      config.auth[data.orgId] = apiKey
      config.currentOrg = data.orgId
      if (data.orgName) {
        config.orgInfo[data.orgId] = {
          name: data.orgName,
        }
      }

      await fse.writeJSON(CONFIG_FILE_PATH, config, {spaces: 2})
      ux.action.stop('Configuration stored')

      this.log(chalk.green('Configuration complete 🎉'))
    } else {
      this.error(chalk.red('API key is invalid'))
    }
  }
}
