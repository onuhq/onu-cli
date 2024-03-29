import {expect, test} from '@oclif/test'
import fse from 'fs-extra'
import sinon from 'sinon'
import {demoTaskJs, demoTaskTs, tsConfig} from '../../src/helpers/starter-files'
import inquirer from 'inquirer'
import childProcess from 'node:child_process'
import path from 'node:path'
import {BASE_URL, TARGET_ONU_NODE_VERSION} from '../../src/constants'

const expectOutput = (ctx: any, language: 'ts' | 'js') => {
  expect(BASE_URL).to.equal('https://api.joinonu.com')
  const extension = language === 'ts' ? 'ts' : 'js'
  const demoTask = language === 'ts' ? demoTaskTs : demoTaskJs
  expect(ctx.stdout).to.contain('Creating onu/ directory in the current project...')
  expect(ctx.stdout).to.contain(`Creating ${path.join('onu', `demoTask.${extension}`)} file...`)
  // ensure that the fs.promises.mkdir function was called
  const fsMockMkdir = fse.mkdirSync as unknown as sinon.SinonStub
  expect(fsMockMkdir.called).to.be.true
  expect(fsMockMkdir.callCount).to.equal(1)
  expect(fsMockMkdir.getCall(0).args[0]).to.equal('onu')

  // ensure that the fs.writeFile stub function was called
  const fsMockWriteFile = fse.writeFileSync as unknown as sinon.SinonStub
  expect(fsMockWriteFile.called).to.be.true
  expect(fsMockWriteFile.callCount).to.equal(2)
  expect(fsMockWriteFile.getCall(0).args[0]).to.equal(path.join('onu', `demoTask.${extension}`))
  expect(fsMockWriteFile.getCall(0).args[1]).to.equal(demoTask)

  expect(fsMockWriteFile.getCall(1).args[0]).to.equal(path.join('package.json'))
  expect(fsMockWriteFile.getCall(1).args[1]).to.equal(JSON.stringify({version: '1', dependencies: {'@onuhq/node': TARGET_ONU_NODE_VERSION}}, null, 2))
}

describe('init', () => {
  test
  .stdout()
  .stub(fse, 'writeFileSync', sinon.stub().returns(true))
  .stub(fse, 'existsSync', sinon.stub().returns(false))
  .stub(fse, 'mkdirSync', sinon.stub().returns(true))
  .stub(fse, 'readJSONSync', sinon.stub().returns({version: '1'}))
  .stub(inquirer, 'prompt', sinon.stub().returns({projectName: 'test', installer: 'npm', createNewProject: 'add'}))
  .command(['init', '--language=ts'])
  .it('runs init cmd with ts flag', ctx => {
    expectOutput(ctx, 'ts')
  })

  test
  .stdout()
  .stub(fse, 'writeFileSync', sinon.stub().returns(true))
  .stub(fse, 'existsSync', sinon.stub().returns(false))
  .stub(fse, 'mkdirSync', sinon.stub().returns(true))
  .stub(fse, 'readJSONSync', sinon.stub().returns({version: '1'}))
  .stub(inquirer, 'prompt', sinon.stub().returns({projectName: 'test', installer: 'npm', createNewProject: 'add'}))
  .command(['init', '--language=typescript'])
  .it('runs init cmd with typescript flag', ctx => {
    expectOutput(ctx, 'ts')
  })

  test
  .stdout()
  .stub(fse, 'writeFileSync', sinon.stub().returns(true))
  .stub(fse, 'existsSync', sinon.stub().returns(false))
  .stub(fse, 'mkdirSync', sinon.stub().returns(true))
  .stub(fse, 'readJSONSync', sinon.stub().returns({version: '1'}))
  .stub(inquirer, 'prompt', sinon.stub().returns({projectName: 'test', installer: 'npm', createNewProject: 'add'}))
  .command(['init', '--language=js'])
  .it('runs init cmd with js flag', ctx => {
    expectOutput(ctx, 'js')
  })

  test
  .stdout()
  .stub(fse, 'writeFileSync', sinon.stub().returns(true))
  .stub(fse, 'existsSync', sinon.stub().returns(false))
  .stub(fse, 'mkdirSync', sinon.stub().returns(true))
  .stub(fse, 'readJSONSync', sinon.stub().returns({version: '1'}))
  .stub(inquirer, 'prompt', sinon.stub().returns({projectName: 'test', installer: 'npm', createNewProject: 'add'}))
  .command(['init', '--language=javascript'])
  .it('runs init cmd with javascript flag', ctx => {
    expectOutput(ctx, 'js')
  })

  test
  .stdout()
  .stub(fse, 'writeFileSync', sinon.stub().returns(true))
  .stub(fse, 'existsSync', sinon.stub().returns(false))
  .stub(fse, 'mkdirSync', sinon.stub().returns(true))
  .stub(inquirer, 'prompt', sinon.stub().returns({projectName: 'testProject', installer: 'npm', createNewProject: 'create'}))
  .stub(childProcess, 'spawnSync', sinon.stub().returns({status: 0}))
  .command(['init', '--language=ts'])
  .it('Creates a new project with ts', ctx => {
    expect(ctx.stdout).to.contain('Creating testProject/ directory...')
    // ensure that the fs.promises.mkdir function was called
    const fsMockMkdir = fse.mkdirSync as unknown as sinon.SinonStub
    expect(fsMockMkdir.called).to.be.true
    expect(fsMockMkdir.callCount).to.equal(2)
    expect(fsMockMkdir.getCall(0).args[0]).to.equal('testProject')
    expect(fsMockMkdir.getCall(1).args[0]).to.equal(path.join('testProject', 'onu'))

    // ensure that the fs.writeFile stub function was called
    const fsMockWriteFile = fse.writeFileSync as unknown as sinon.SinonStub
    expect(fsMockWriteFile.called).to.be.true
    expect(fsMockWriteFile.callCount).to.equal(5)
    expect(fsMockWriteFile.getCall(0).args[0]).to.equal(path.join('testProject', 'onu', 'demoTask.ts'))
    expect(fsMockWriteFile.getCall(0).args[1]).to.equal(demoTaskTs)
    expect(fsMockWriteFile.getCall(1).args[0]).to.equal(path.join('testProject', 'tsconfig.json'))
    expect(fsMockWriteFile.getCall(1).args[1]).to.equal(tsConfig)

    expect(fsMockWriteFile.getCall(2).args[0]).to.equal(path.join('testProject', '.gitignore'))
    expect(fsMockWriteFile.getCall(3).args[0]).to.equal(path.join('testProject', 'onu.dev.json'))
    expect(fsMockWriteFile.getCall(4).args[0]).to.equal(path.join('testProject', 'package.json'))
  })

  test
  .stdout()
  .stub(fse, 'writeFileSync', sinon.stub().returns(true))
  .stub(fse, 'existsSync', sinon.stub().returns(false))
  .stub(fse, 'mkdirSync', sinon.stub().returns(true))
  .stub(inquirer, 'prompt', sinon.stub().returns({projectName: 'testProject', installer: 'npm', createNewProject: 'create'}))
  .stub(childProcess, 'spawnSync', sinon.stub().returns({status: 0}))
  .command(['init', '--language=js'])
  .it('Creates a new project with js', ctx => {
    expect(ctx.stdout).to.contain('Creating testProject/ directory...')
    // ensure that the fs.promises.mkdir function was called
    const fsMockMkdir = fse.mkdirSync as unknown as sinon.SinonStub
    expect(fsMockMkdir.called).to.be.true
    expect(fsMockMkdir.callCount).to.equal(2)
    expect(fsMockMkdir.getCall(0).args[0]).to.equal('testProject')
    expect(fsMockMkdir.getCall(1).args[0]).to.equal(path.join('testProject', 'onu'))

    // ensure that the fs.writeFile stub function was called
    const fsMockWriteFile = fse.writeFileSync as unknown as sinon.SinonStub
    expect(fsMockWriteFile.called).to.be.true
    expect(fsMockWriteFile.callCount).to.equal(4)
    expect(fsMockWriteFile.getCall(0).args[0]).to.equal(path.join('testProject', 'onu', 'demoTask.js'))
    expect(fsMockWriteFile.getCall(0).args[1]).to.equal(demoTaskJs)

    expect(fsMockWriteFile.getCall(1).args[0]).to.equal(path.join('testProject', '.gitignore'))
    expect(fsMockWriteFile.getCall(2).args[0]).to.equal(path.join('testProject', 'onu.dev.json'))
    expect(fsMockWriteFile.getCall(3).args[0]).to.equal(path.join('testProject', 'package.json'))
  })
})
