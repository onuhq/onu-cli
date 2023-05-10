import {Command} from '@oclif/core'
import fse from 'fs-extra'
import {BASE_URL, CONFIG_FILE_PATH, OnuConfig} from '../constants'

export default class Whoami extends Command {
  static description = 'show the org you are currently logged in as'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    const errorMessage = 'You are not logged in. Run `onu configure` to login to your Onu account.'
    const config: OnuConfig = await fse.readJSON(CONFIG_FILE_PATH)

    if (!config) {
      this.log(errorMessage)
      return
    }

    if (!config.auth) {
      // user is not logged in
      this.log(errorMessage)
      return
    }

    if (!config.orgInfo) {
      config.orgInfo = {}
    }

    if (!config.currentOrg) {
      this.log(errorMessage)
      return
    }

    const orgId = config.currentOrg

    const apiKey = config.auth[orgId]

    if (!apiKey) {
      this.log(errorMessage)
      return
    }

    let name
    if (!config.orgInfo[orgId]) {
      // get the org info from the server
      const resp = await fetch(`${BASE_URL}/v1/cli/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (resp.status === 200) {
        const data = await resp.json()

        // Add this org to the config file
        config.orgInfo[orgId] = {
          name: data.orgName,
        }
        name = data.orgName
      } else if (resp.status === 401) {
        // Delete this org from the config file
        delete config.auth[orgId]
        delete config.orgInfo[orgId]
        if (config.currentOrg === orgId) {
          config.currentOrg = undefined
        }
      } else {
        this.error('There was an error validating your login. Please try again.', {exit: 1})
      }
    } else if (config.orgInfo[orgId]) {
      name = config.orgInfo[orgId].name
    }

    await fse.writeJSON(CONFIG_FILE_PATH, config, {spaces: 2})

    this.log(`You are currently logged in as ${name} (${orgId})`)
  }
}
