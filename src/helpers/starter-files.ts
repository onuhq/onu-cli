
export const demoTaskTs = `import onu from '@onuhq/node'
import fetch from 'node-fetch'


const task = new onu.Task({
  name: 'Demo Task - Onboard a user',
  description: 'This is a demo task that onboards a user to your app.',
  slug: 'onboard-user',
  input: {
    email: {
      type: 'string',
      name: 'Email',
    },
    accountType: {
      type: 'select',
      name: 'Account Type',
      options: ['basic', 'pro'],
    },
  },
  run: async (input, context) => {
    const {email, accountType} = input

    // You can import and use your project's existing code & business logic.
    // For the purposes of this demo, we'll just make a call to Onu's demo API
    const response = await fetch('https://demo.joinonu.com/api/onboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({email, accountType}),
    })

    const user = await response.json()

    return user
  },
})

export default task
`

export const demoTaskJs = `const onu = require('@onuhq/node')
const fetch = require('node-fetch')


const task = new onu.Task({
  name: 'Demo Task - Onboard a user',
  description: 'This is a demo task that onboards a user to your app.',
  slug: 'onboard-user',
  input: {
    email: {
      type: 'string',
      name: 'Email',
    },
    accountType: {
      type: 'select',
      name: 'Account Type',
      options: ['basic', 'pro'],
    },
  },
  run: async (input, context) => {
    const {email, accountType} = input

    // You can import and use your project's existing code & business logic.
    // For the purposes of this demo, we'll just make a call to Onu's demo API
    const response = await fetch('https://demo.joinonu.com/api/onboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({email, accountType}),
    })

    const user = await response.json()

    return user
  },
})

module.exports = {
  default: task,
}
`

export const tsConfig = `{
  "compilerOptions": {
    "target": "esnext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "module": "commonjs",
    "rootDir": "./",
    "outDir": "./dist"
  }
}
`

export const ONU_DEV_JSON = {
  path: '',
  env: {},
}

export const ONU_DOT_JSON = {
  path: '',
  runtime: '',
}
