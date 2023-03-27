export const tsFile = `import {OnuClient} from '@onuhq/node'

const onuClient = new OnuClient({
  onuPath: __dirname,
  apiKey: 'YOUR_API_KEY',  // <-- Add your API key here.
})

export default onuClient
`

export const demoTask = `import onu from '@onuhq/node'

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

    // You can import and use your project's existing code $ business logic.
    // For the purposes of this demo, we'll just make a call to Onu's demo API
    const response = await fetch('https://demo.joinonu.com/api/onboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({email, accountType}),
    })

    const user = await response.json()

    context.logger.info('User onboarded successfully!')

    return user
  },
})

export default task
`
