import {expect, test} from '@oclif/test'
import fse from 'fs-extra'
import sinon from 'sinon'
import inquirer from 'inquirer'
import fetch from 'node-fetch'

describe('template', () => {
  test
  .stdout()
  .stub(fse, 'pathExists', sinon.stub().onCall(0).returns(true).onCall(1).returns(true).onCall(2).returns(true).onCall(3).returns(true).onCall(4).returns(true).onCall(5).returns(false))
  .stub(fse, 'readJSON', sinon.stub().returns({currentOrg: 'testOrg', auth: {testOrg: 'testKey'}}))
  // stub the fetch api call
  .stub(fetch, 'default', sinon.stub().returns({status: 200, json: sinon.stub().returns({url: '123', templateName: 'hi'}), text: sinon.stub().returns('')} as any))
  .stub(fse, 'readJSONSync', sinon.stub().returns({path: '/onu'}))
  .stub(inquirer, 'prompt', sinon.stub().returns({overwrite: false}))
  .stub(fse, 'writeFileSync', sinon.stub().returns(true))
  .command(['template', 'send-welcome-email',  '--language=ts'])
  .it('runs template command', ctx => {
    expect(ctx.stdout).to.contain('✨ Successfully downloaded template')
  })

  test
  .stdout()
  .stub(fse, 'pathExists', sinon.stub().onCall(0).returns(true).onCall(1).returns(true).onCall(2).returns(true).onCall(3).returns(true).onCall(4).returns(true).onCall(5).returns(false))
  .stub(fse, 'readJSON', sinon.stub().returns({currentOrg: 'testOrg', auth: {testOrg: 'testKey'}}))
  // stub the fetch api call
  .stub(fetch, 'default', sinon.stub().returns({status: 200, json: sinon.stub().returns({url: '123', templateName: 'hi'}), text: sinon.stub().returns('')} as any))
  .stub(fse, 'readJSONSync', sinon.stub().returns({path: '/onu'}))
  .stub(inquirer, 'prompt', sinon.stub().returns({overwrite: false}))
  .stub(fse, 'writeFileSync', sinon.stub().returns(true))
  .command(['template', 'send-welcome-email', '--language=python'])
  .it('does not allow invalid language input', ctx => {
    expect(ctx.stdout).to.contain('Invalid language. Must be one of: typescript, javascript')
  })
})
