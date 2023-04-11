import {Command, ux} from '@oclif/core'
import inquirer from 'inquirer'
import fse from 'fs-extra'
import {BASE_URL, CONFIG_FILE_PATH} from '../constants'
import chalk from 'chalk'
import fetch from 'node-fetch'

export default class Configure extends Command {
  static description = 'Configures the CLI for your project'

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
      const configFileExists = await fse.pathExists(CONFIG_FILE_PATH)
      if (!configFileExists) {
        await fse.writeFile(CONFIG_FILE_PATH, JSON.stringify({}))
      }

      const data = await resp.json()

      const config = await fse.readJSON(CONFIG_FILE_PATH)

      if (!config.auth) {
        config.auth = {}
      }

      config.auth[data.orgId] = apiKey
      config.currentOrg = data.orgId

      await fse.writeJSON(CONFIG_FILE_PATH, config, {spaces: 2})
      ux.action.stop('Configuration stored')

      this.log(chalk.green('Configuration complete 🎉'))
    } else {
      this.error(chalk.red('API key is invalid'))
    }
  }
}
