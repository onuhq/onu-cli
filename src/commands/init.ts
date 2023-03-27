import {Command, Flags} from '@oclif/core'
import fse from 'fs-extra'
import {demoTask, tsFile} from '../helpers/starter-files'

export default class Init extends Command {
  static description = 'Initializes an `onu/` directory within the current project'

  static examples = [
    '$ <%= config.bin %> <%= command.id %> -l typescript',
  ]

  static flags = {
    language: Flags.string({char: 'l', description: 'The language to generate files in', required: true}),
  }

  async run(): Promise<void> {
    const {flags} = await this.parse(Init)

    if (fse.existsSync('./onu')) {
      // Do something
      throw new Error('An onu/ directory already exists in the current project!')
    }

    this.log('Creating onu/ directory in the current project...')
    fse.mkdirSync('onu')

    switch (flags.language) {
    case 'typescript':
    case 'ts':
      this.log('Creating onu/index.ts file...')
      fse.writeFileSync('onu/index.ts', tsFile)

      this.log('Creating onu/demoTask.ts file...')
      fse.writeFileSync('onu/demoTask.ts', demoTask)

      break
    case 'javascript':
    case 'js':
      this.log('Creating onu/index.js file...')
      fse.writeFileSync('onu/index.js', tsFile)

      this.log('Creating onu/demoTask.js file...')
      fse.writeFileSync('onu/demoTask.js', demoTask)
      break
    default:
      throw new Error('Invalid language specified. Please specify one of [`typescript`, `ts`, `javascript`, `js`].')
    }
  }
}
