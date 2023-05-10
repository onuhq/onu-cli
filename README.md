Onu CLI
=================


<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g onu
$ onu COMMAND
running command...
$ onu (--version|-v)
onu/0.3.5 darwin-x64 node-v18.0.0
$ onu --help [COMMAND]
USAGE
  $ onu COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`onu accounts switch`](#onu-accounts-switch)
* [`onu configure`](#onu-configure)
* [`onu deploy`](#onu-deploy)
* [`onu dev [-p <value>]`](#onu-dev--p-value)
* [`onu help [COMMANDS]`](#onu-help-commands)
* [`onu init`](#onu-init)
* [`onu sos`](#onu-sos)
* [`onu whoami`](#onu-whoami)

## `onu accounts switch`

manage the current account

```
USAGE
  $ onu accounts switch

DESCRIPTION
  manage the current account

EXAMPLES
  $ onu accounts switch
```

## `onu configure`

configure the CLI for your project

```
USAGE
  $ onu configure

DESCRIPTION
  configure the CLI for your project

EXAMPLES
  $ onu configure
```

_See code: [dist/commands/configure.ts](https://github.com/onuhq/onu-cli/blob/v0.3.5/dist/commands/configure.ts)_

## `onu deploy`

deploy your Onu tasks

```
USAGE
  $ onu deploy

DESCRIPTION
  deploy your Onu tasks

EXAMPLES
  $ onu deploy
```

_See code: [dist/commands/deploy.ts](https://github.com/onuhq/onu-cli/blob/v0.3.5/dist/commands/deploy.ts)_

## `onu dev [-p <value>]`

run a local dev studio [experimental 🧪]

```
USAGE
  $ onu dev [-p <value>]

FLAGS
  -h, --help              Show help
  -p, --port=<value>      [default: 3000] Port to run on
  -t, --tsconfig=<value>  [default: ./tsconfig.json] Path to a custom tsconfig file
  --install-deps          Re-install the studio app dependencies

DESCRIPTION
  run a local dev studio [experimental 🧪]

EXAMPLES
  $ onu dev -p 8000
```

_See code: [dist/commands/dev.ts](https://github.com/onuhq/onu-cli/blob/v0.3.5/dist/commands/dev.ts)_

## `onu help [COMMANDS]`

Display help for onu.

```
USAGE
  $ onu help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for onu.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.8/src/commands/help.ts)_

## `onu init`

initialize an `onu/` directory within the current project

```
USAGE
  $ onu init -l <value>

FLAGS
  -l, --language=<value>  (required) The language to generate files in

DESCRIPTION
  initialize an `onu/` directory within the current project

EXAMPLES
  $ onu init -l typescript
```

_See code: [dist/commands/init.ts](https://github.com/onuhq/onu-cli/blob/v0.3.5/dist/commands/init.ts)_

## `onu sos`

display contact information for the Onu team

```
USAGE
  $ onu sos

DESCRIPTION
  display contact information for the Onu team

EXAMPLES
  $ onu sos
```

_See code: [dist/commands/sos.ts](https://github.com/onuhq/onu-cli/blob/v0.3.5/dist/commands/sos.ts)_

## `onu whoami`

show the org you are currently logged in as

```
USAGE
  $ onu whoami

DESCRIPTION
  show the org you are currently logged in as

EXAMPLES
  $ onu whoami
```

_See code: [dist/commands/whoami.ts](https://github.com/onuhq/onu-cli/blob/v0.3.5/dist/commands/whoami.ts)_
<!-- commandsstop -->
