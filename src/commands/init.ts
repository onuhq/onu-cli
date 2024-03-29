import {Command, Flags} from '@oclif/core'
import fse from 'fs-extra'
import {ONU_DEV_JSON, demoTaskJs, demoTaskTs, tsConfig} from '../helpers/starter-files'
import inquirer from 'inquirer'
import path from 'node:path'
import {TARGET_ONU_NODE_VERSION} from '../constants'
import {installProjectDeps} from '../helpers'
import chalk from 'chalk'

export default class Init extends Command {
  static description = 'initialize an `onu/` directory within the current project'

  static examples = [
    '$ <%= config.bin %> <%= command.id %> -l typescript',
  ]

  static flags = {
    language: Flags.string({char: 'l', description: 'The language to generate files in', required: true}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Init)

    const responses: any = await inquirer.prompt([{
      name: 'createNewProject',
      message: 'Create new project or add to existing?',
      type: 'list',
      choices: [{name: 'Create new project', value: 'create'}, {name: 'Add to existing project', value: 'add'}],
    }])
    const isNewProject = responses.createNewProject === 'create'

    let installer = 'npm'
    let basePath = 'onu'
    let projectName = ''
    // eslint-disable-next-line no-negated-condition
    if (!isNewProject) {
      this.log('Creating onu/ directory in the current project...')
      if (fse.existsSync('./onu')) {
        // Do something
        this.error('An onu/ directory already exists in the current project.')
      }

      fse.mkdirSync(basePath)
    } else {
      const responses: any = await inquirer.prompt([
        {
          name: 'projectName',
          message: 'Enter a name for the new project',
          type: 'input',
          validate: (input: string) => {
            if (input.length === 0) {
              return 'Please enter a name for the project'
            }

            // ensure that the input does not have spaces
            if (input.includes(' ')) {
              return 'Project name cannot contain spaces'
            }

            // ensure that the input is a valid package.json name
            if (!/^[\da-z-]+$/.test(input)) {
              return 'Project name can only contain lowercase letters, numbers, and dashes'
            }

            return true
          },
        },
        {
          name: 'installer',
          message: 'Install dependencies with npm or yarn?',
          type: 'list',
          choices: [{name: 'npm'}, {name: 'yarn'}],
        },
      ])
      installer = responses.installer
      projectName = responses.projectName
      // if this directory already exists, throw an error
      if (fse.existsSync(projectName)) {
        this.error(`A directory with the name '${projectName}' already exists`)
      }

      this.log(`Creating ${projectName}/ directory...`)
      fse.mkdirSync(projectName)
      basePath = path.join(projectName, 'onu')

      this.log(`Creating ${basePath} directory...`)
      fse.mkdirSync(basePath)
    }

    switch (flags.language) {
    case 'typescript':
    case 'ts': {
      const pathName = path.join(basePath, 'demoTask.ts')
      this.log(`Creating ${pathName} file...`)
      fse.writeFileSync(pathName, demoTaskTs)

      if (isNewProject) {
        this.log('Creating tsconfig.json file...')
        fse.writeFileSync(path.join(projectName, 'tsconfig.json'), tsConfig)

        this.log('Creating .gitignore file...')
        fse.writeFileSync(path.join(projectName, '.gitignore'), 'node_modules\nonu.dev.json\ndist/\n')

        const onuDevJson = JSON.parse(JSON.stringify(ONU_DEV_JSON))
        onuDevJson.path = 'onu/'
        this.log('Creating onu.dev.json file...')
        fse.writeFileSync(path.join(projectName, 'onu.dev.json'), JSON.stringify(onuDevJson, null, 2))

        this.log('Creating package.json file...')
        const packageJson: any = {
          name: 'pkgtest',
          version: '1.0.0',
          description: '',
          main: 'index.js',
          scripts: {
            test: 'echo "Error: no test specified" && exit 1',
          },
          author: '',
          license: 'MIT',
          dependencies: {},
          devDependencies: {},
        }
        packageJson.name = projectName
        packageJson.main = 'dist/onu/index.js'
        packageJson.dependencies['@onuhq/node'] = TARGET_ONU_NODE_VERSION
        packageJson.dependencies['node-fetch'] = '^2.6.6'

        // add typescript as a dev dependency
        packageJson.devDependencies.typescript = '^5.0.3'
        packageJson.devDependencies['@types/node'] = '^18.15.11'

        // add a build script
        packageJson.scripts.build = 'npx tsc'

        // add a dev script
        packageJson.scripts.dev = 'npx onu@latest dev'

        fse.writeFileSync(path.join(projectName, 'package.json'), JSON.stringify(packageJson, null, 2))

        this.log('Installing dependencies...')
        installProjectDeps(installer, projectName, this)
        this.log(chalk.green(`\nDone! To start your project, run:\n\ncd ${projectName}\n${installer === 'npm' ? 'npm run dev' : 'yarn dev'}\n\n`))
      } else {
        // add onu to existing package.json
        const packageJson = fse.readJSONSync(path.join(projectName, 'package.json'))
        let dependencies = packageJson.dependencies
        if (!dependencies) {
          dependencies = {}
          packageJson.dependencies = dependencies
        }

        const hasOnu = packageJson.dependencies['@onuhq/node']
        if (!hasOnu) {
          packageJson.dependencies['@onuhq/node'] = TARGET_ONU_NODE_VERSION
          fse.writeFileSync(path.join(projectName, 'package.json'), JSON.stringify(packageJson, null, 2))
          this.log('Installing dependencies...')
          installProjectDeps(installer, projectName, this)
        }
      }

      break
    }

    case 'javascript':
    case 'js': {
      const pathName = path.join(basePath, 'demoTask.js')
      this.log(`Creating ${pathName} file...`)
      fse.writeFileSync(pathName, demoTaskJs)

      if (isNewProject) {
        this.log('Creating .gitignore file...')
        fse.writeFileSync(path.join(projectName, '.gitignore'), 'node_modules\nonu.dev.json\n')

        const onuDevJson = JSON.parse(JSON.stringify(ONU_DEV_JSON))
        onuDevJson.path = 'onu/'
        this.log('Creating onu.dev.json file...')
        fse.writeFileSync(path.join(projectName, 'onu.dev.json'), JSON.stringify(onuDevJson, null, 2))

        this.log('Creating package.json file...')
        const packageJson: any = {
          name: 'pkgtest',
          version: '1.0.0',
          description: '',
          main: 'index.js',
          scripts: {
            test: 'echo "Error: no test specified" && exit 1',
          },
          author: '',
          license: 'MIT',
          dependencies: {},
          devDependencies: {},
        }
        packageJson.name = projectName
        packageJson.main = 'onu/index.js'
        packageJson.dependencies['@onuhq/node'] = TARGET_ONU_NODE_VERSION
        packageJson.dependencies['node-fetch'] = '^2.6.6'

        // add a dev script
        packageJson.scripts.dev = 'npx onu@latest dev'

        fse.writeFileSync(path.join(projectName, 'package.json'), JSON.stringify(packageJson, null, 2))

        this.log('Installing dependencies...')
        installProjectDeps(installer, projectName, this)
        this.log(chalk.green(`\nDone! To start your project, run:\n\ncd ${projectName}\n${installer === 'npm' ? 'npm run dev' : 'yarn dev'}\n\n`))
      } else {
        // add onu to existing package.json
        const packageJson = fse.readJSONSync(path.join(projectName, 'package.json'))
        let dependencies = packageJson.dependencies
        if (!dependencies) {
          dependencies = {}
          packageJson.dependencies = dependencies
        }

        const hasOnu = packageJson.dependencies['@onuhq/node']
        if (!hasOnu) {
          packageJson.dependencies['@onuhq/node'] = TARGET_ONU_NODE_VERSION
          fse.writeFileSync(path.join(projectName, 'package.json'), JSON.stringify(packageJson, null, 2))
          this.log('Installing dependencies...')
          installProjectDeps(installer, projectName, this)
        }
      }

      break
    }

    default:
      throw new Error('Invalid language specified. Please specify one of [`typescript`, `ts`, `javascript`, `js`].')
    }
  }
}
