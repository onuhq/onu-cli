import {Command, Flags} from '@oclif/core'
import {Table} from 'console-table-printer'
import open from 'open'

export default class Sos extends Command {
  static description = 'display contact information for the Onu team'

  static examples = [
    '<%= config.bin %> <%= command.id %>',
  ]

  static flags = {
    abba: Flags.boolean({hidden: true}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Sos)

    if (flags.abba) {
      await open('https://www.youtube.com/watch?v=cvChjHcABPA')
      this.exit(0)
    }

    this.log('\n')

    const options = [
      {
        name: 'Discord',
        value: 'https://discord.gg/FJr6Yqk79T',
      },
      {
        name: 'Email',
        value: 'help@joinonu.com',
      },
      {
        name: 'Website',
        value: 'https://joinonu.com',
      },
      {
        name: 'Docs',
        value: 'https://docs.joinonu.com',
      },
    ]

    const table = new Table({title: 'Need help? Get in touch with the Onu team!'})
    let index = 1
    for (const option of options) {
      table.addRow({index: index++, type: option.name, value: option.value}, {color: 'blue'})
    }

    table.printTable()
    this.log('\n')
  }
}
