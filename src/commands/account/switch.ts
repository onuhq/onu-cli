import {Command} from '@oclif/core'
import {BASE_URL, CONFIG_FILE_PATH, OnuConfig} from '../../constants'
import fse from 'fs-extra'
import fetch from 'node-fetch'
import inquirer from 'inquirer'
import chalk from 'chalk'

interface Org {
  id: string
  name: string
  auth: string
}

export default class Switch extends Command {
  static description = 'manage the current account'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    // Get all of the orgs from the config file
    const config: OnuConfig = await fse.readJSON(CONFIG_FILE_PATH)

    if (!config) {
      this.error('No config file found. Run `onu configure` to login to your Onu account.', {exit: 1})
    }

    if (!config.auth) {
      config.auth = {}
    }

    if (!config.orgInfo) {
      config.orgInfo = {}
    }

    const orgIds = Object.keys(config.auth)
    const orgs: Org[] = []

    await Promise.all(
      orgIds.map(async orgId => {
        if (!config.auth) {
          config.auth = {}
        }

        if (!config.orgInfo) {
          config.orgInfo = {}
        }

        // get the name if it exists. if not, fetch it from the server
        const apiKey = config.auth[orgId]

        const orgData = {
          id: orgId,
          name: '',
          auth: apiKey,
        }

        let shouldAddOrg = true

        if (!config.orgInfo[orgId]) {
          const resp = await fetch(`${BASE_URL}/v1/cli/auth/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
          })

          if (resp.status === 200) {
            const data = await resp.json()
            orgData.name = data.orgName

            // Add this org to the config file
            config.orgInfo[orgId] = {
              name: data.orgName,
            }
          } else if (resp.status === 401) {
            console.log(chalk.red(`API key for og ${orgId} is invalid. Removing from config file.`))
            // Delete this org from the config file
            delete config.auth[orgId]
            delete config.orgInfo[orgId]
            if (config.currentOrg === orgId) {
              config.currentOrg = undefined
            }

            shouldAddOrg = false
          } else {
            this.error('There was an error validating organizations. Please try again.', {exit: 1})
          }
        } else if (config.orgInfo[orgId]) {
          orgData.name = config.orgInfo[orgId].name
        }

        if (shouldAddOrg) {
          orgs.push(orgData)
        }
      }),
    )

    const responses: any = await inquirer.prompt([
      {
        name: 'accountId',
        message: 'Choose the account to switch to:',
        type: 'list',
        choices: orgs.map(org => {
          return {
            name: org.name,
            value: org.id,
          }
        }),
      },
    ])
    const accountId = responses.accountId

    // Set the current org in the config file
    config.currentOrg = accountId

    // Write the config file
    await fse.writeJSON(CONFIG_FILE_PATH, config, {spaces: 2})

    const currentOrg = config.orgInfo[accountId].name

    this.log(chalk.green(`✅ Switched to account: ${currentOrg}`))
  }
}
