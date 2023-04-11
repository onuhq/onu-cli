import {Command, ux} from '@oclif/core'
import {execNodeModulesExists, execPackageExists} from '../helpers'
import fse from 'fs-extra'
import path from 'node:path'
import {BASE_URL, CMD_EXEC_PATH, DOT_ONU} from '../constants'
import inquirer from 'inquirer'
import {ONU_DOT_JSON} from '../helpers/starter-files'
import chalk from 'chalk'
import shell from 'shelljs'
import FormData from 'form-data'
import fetch from 'node-fetch'

export const checkOnuDotJson = async (command: Command): Promise<void> => {
  // Check if the onu.json file exists

  const onuDotJsonExists = await fse.pathExists(path.join(CMD_EXEC_PATH, 'onu.json'))

  if (!onuDotJsonExists) {
    const responses: any = await inquirer.prompt([{
      name: 'answer',
      message: 'No onu.json file found. Create one? [Y/n]',
      type: 'input',
    }])
    const answer = responses.answer
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      // Create the onu.dev.json file
      const onuDotJson = JSON.parse(JSON.stringify(ONU_DOT_JSON))

      const responses: any = await inquirer.prompt([
        {
          name: 'onuPath',
          message: 'Enter the path to your onu/ directory. ex: src/onu/',
          type: 'input',
        },
        {
          name: 'runtime',
          message: 'Select a runtime',
          type: 'list',
          choices: [
            'nodejs18',
            'nodejs16',
            'nodejs14',
            'nodejs12',
            'nodejs10',
          ],
        },
      ])
      const runtime = responses.runtime
      const onuPath = responses.onuPath

      onuDotJson.runtime = runtime
      onuDotJson.path = onuPath

      // Write the onu.json file
      fse.writeFileSync(path.join(CMD_EXEC_PATH, 'onu.json'), JSON.stringify(onuDotJson, null, 2))

      command.log(chalk.green('onu.json created. Continuing deployment...'))
      return
    }

    command.error(chalk.red('onu.json is required for the `deploy` command.'))
  }

  // Check if the onu.json file has a path
  const onuDotJson = fse.readJSONSync(path.join(CMD_EXEC_PATH, 'onu.json'))
  if (!onuDotJson.path) {
    command.error(chalk.red('onu.json must have a path property.'))
  }
}

export default class Deploy extends Command {
  static description = 'Deploy your Onu tasks'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  public async run(): Promise<void> {
    // Ensure that command is running in the root of a project
    // Ensure that there is a package.json and node_modules
    const hasNodeModules = await execNodeModulesExists()
    const hasPackageJson = await execPackageExists()

    if (!hasNodeModules || !hasPackageJson) {
      this.error('You must run this command in the project\'s root directory.', {exit: 1})
    }

    // ensure there is a config file with a current org and api key
    const configFileExists = await fse.pathExists(path.join(DOT_ONU, 'config.json'))
    if (!configFileExists) {
      this.error('No config file found. Run `onu configure` to login to your Onu account.', {exit: 1})
    }

    const config = await fse.readJSON(path.join(DOT_ONU, 'config.json'))

    if (!config.currentOrg) {
      this.error('No current org found. Please run `onu configure` to login to your Onu account.', {exit: 1})
    }

    if (!config.auth[config.currentOrg]) {
      this.error('No api key found for current org. Please run `onu configure` to login to your Onu account.', {exit: 1})
    }

    await checkOnuDotJson(this)

    await fse.ensureDir(path.join(DOT_ONU, 'staging'))
    const fileDestination = path.join(DOT_ONU, 'staging', 'onuupload.tar.gz')

    // remove existing tar file
    await fse.remove(fileDestination)

    let tarCommand = 'tar --exclude \'node_modules\'  --exclude=\'.git\' '

    // add an exlude flag for every line in the .gitignore file

    if (await fse.pathExists(path.join(CMD_EXEC_PATH, '.gitignore'))) {
      const gitIgnore = await fse.readFile(path.join(CMD_EXEC_PATH, '.gitignore'), 'utf8')
      const lines = gitIgnore.split('\n')
      for (const line of lines) {
        if (line.length > 0) {
          tarCommand += ` --exclude='${line.trim()}'`
        }
      }
    }

    tarCommand += ` -cvzf ${fileDestination} .`

    ux.action.start('Packaging files for deployment')

    shell.cd(CMD_EXEC_PATH)
    shell.exec(tarCommand, {silent: true})

    ux.action.stop('done')
    ux.action.start('Deploying tasks')

    // get the api key from the config
    const currentOrg = config.currentOrg
    const apiKey = config.auth[currentOrg]

    const onuDotJson = await fse.readJSON(path.join(CMD_EXEC_PATH, 'onu.json'))

    const formData = new FormData()
    const buffer = fse.createReadStream(fileDestination)
    formData.append('tarFile', buffer)
    formData.append('onuPath', onuDotJson.path)
    formData.append('runtime', onuDotJson.runtime || undefined)

    const response = await fetch(`${BASE_URL}/v1/cli/deploy`, {
      method: 'POST',
      body: formData,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (response.status === 401) {
      this.error(chalk.red('Unauthorized. Please run `onu configure` to login to your Onu account.'), {exit: 1})
    }

    const json = await response.json()

    if (response.status !== 200) {
      this.error(chalk.red(json), {exit: 1})
    }

    this.log(json)
  }
}
