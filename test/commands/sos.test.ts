import {expect, test} from '@oclif/test'

describe('sos', () => {
  test
  .stdout()
  .command(['sos'])
  .it('displays help options', ctx => {
    expect(ctx.stdout).to.contain('help@joinonu.com')
    expect(ctx.stdout).to.contain('Discord')
    expect(ctx.stdout).to.contain('Email')
    expect(ctx.stdout).to.contain('Website')
    expect(ctx.stdout).to.contain('Docs')
    expect(ctx.stdout).to.contain('Need help? Get in touch with the Onu team! ')
  })
})
