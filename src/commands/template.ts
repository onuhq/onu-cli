import {Args, Command, Flags} from '@oclif/core'
import {execNodeModulesExists, execPackageExists, onuJsonExists} from '../helpers'
import fse from 'fs-extra'
import path from 'node:path'
import {BASE_URL, CMD_EXEC_PATH, DOT_ONU} from '../constants'
import chalk from 'chalk'
import fetch from 'node-fetch'
import inquirer from 'inquirer'

export default class Template extends Command {
  static description = 'use a task template to create a new task'

  static examples = [
    '<%= config.bin %> <%= command.id %> template-name --language=typescript',
  ]

  static usage = '<%= command.id %> template-name [-l <value>]'

  static flags = {
    language: Flags.string({char: 'l', description: 'The coding language of the template', default: 'typescript'}),
  }

  static args = {
    templateId: Args.string(
      {
        name: 'templateId',               // name of arg to show in help and reference with args[name]
        required: true,            // make the arg required with `required: true`
        description: 'The ID of the template to download', // help description
      },
    ),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Template)

    const validLanguages = ['typescript', 'javascript', 'js', 'ts']

    if (!validLanguages.includes(flags.language)) {
      this.log(chalk.red('Invalid language. Must be one of: typescript, javascript'))
      return
    }

    // template name can either be 'ts' or 'js'
    const templateLang = flags.language === 'typescript' || flags.language === 'ts' ? 'ts' : 'js'

    const templateId = this.argv[0]

    // Ensure that command is running in the root of a project
    // Ensure that there is a package.json and node_modules
    const hasNodeModules = await execNodeModulesExists()
    const hasPackageJson = await execPackageExists()

    if (!hasNodeModules || !hasPackageJson) {
      this.log(chalk.red('You must run this command in the project\'s root directory.'))
      return
    }

    const hasOnuJson = await onuJsonExists()

    if (!hasOnuJson) {
      this.error('You must run `onu init` before using this command.', {exit: 1})
    }

    // read the onu.json file
    const onuDotJson = fse.readJSONSync(path.join(CMD_EXEC_PATH, 'onu.json'))
    const onuPathString = onuDotJson.path
    const onuPath = path.join(CMD_EXEC_PATH, onuPathString)

    // ensure that the onu path exists
    const onuPathExists = await fse.pathExists(onuPath)

    if (!onuPathExists) {
      this.error(`The path to your onu/ directory does not exist: ${onuPathString}. Please run ${'`onu init`'} to create it.`, {exit: 1})
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

    // get the api key from the config
    const currentOrg = config.currentOrg
    const apiKey = config.auth[currentOrg]

    try {
      const response = await fetch(`${BASE_URL}/v1/cli/templates/${templateId}/${templateLang}`, {
        method: 'GET',
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

      const url = json.url
      const templateName = json.templateName

      // download URL contents

      const templateResponse = await fetch(url, {
        method: 'GET',
      })

      if (templateResponse.status !== 200) {
        this.error(chalk.red('There was an error downloading the template.'), {exit: 1})
      }

      const template = await templateResponse.text()

      // write the template to the file system

      let templatePath = path.join(onuPath, `${templateName}.${templateLang}`)

      // Check if the file already exists
      const fileExists = await fse.pathExists(templatePath)

      if (fileExists) {
        const resp = await inquirer.prompt([
          {
            name: 'overwrite',
            message: `A file already exists at ${templatePath}. Overwrite?`,
            type: 'confirm',
          },
        ])

        if (!resp.overwrite) {
          // allow them to choose a new file name
          const resp2 = await inquirer.prompt([
            {
              name: 'newFileName',
              message: 'Enter a new file name:',
              type: 'input',
              validate: (input: string) => {
                if (input.length === 0) {
                  return 'Please enter a name for the file'
                }

                // ensure that the input does not have spaces
                if (input.includes(' ')) {
                  return 'File name cannot contain spaces'
                }

                // ensure that the input is a valid package.json name
                if (!/^[\w-]+$/.test(input)) {
                  return 'File name must be alphanumeric'
                }

                return true
              },
            },
          ])

          const newFileName = resp2.newFileName

          templatePath = path.join(onuPath, `${newFileName}.${templateLang}`)

          // Check if the file already exists

          const fileExists = await fse.pathExists(templatePath)

          if (fileExists) {
            this.error(chalk.red(`A file already exists at ${templatePath}. Please choose a different file name.`), {exit: 1})
          }
        }
      }

      fse.writeFileSync(templatePath, template)

      this.log(chalk.green('✨ Successfully downloaded template.'))
    } catch (error: any) {
      if (error.name === 'AbortError') {
        this.error(chalk.red('Request aborted due to timeout'), {exit: 1})
      }

      this.error(chalk.red(error), {exit: 1})
    }
  }
}
