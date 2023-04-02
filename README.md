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
$ onu (--version)
onu/0.2.0 darwin-x64 node-v18.0.0
$ onu --help [COMMAND]
USAGE
  $ onu COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`onu dev [-p <value>]`](#onu-dev--p-value)
* [`onu help [COMMANDS]`](#onu-help-commands)
* [`onu init`](#onu-init)
* [`onu sos`](#onu-sos)

## `onu dev [-p <value>]`

Runs a local dev studio [experimental 🧪]

```
USAGE
  $ onu dev [-p <value>]

FLAGS
  -h, --help          Show help
  -p, --port=<value>  [default: 3000] Port to run on

DESCRIPTION
  Runs a local dev studio [experimental 🧪]

EXAMPLES
  $ onu dev -p 8000
```

_See code: [dist/commands/dev.ts](https://github.com/onuhq/onu-cli/blob/v0.2.0/dist/commands/dev.ts)_

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

Initializes an `onu/` directory within the current project

```
USAGE
  $ onu init -l <value>

FLAGS
  -l, --language=<value>  (required) The language to generate files in

DESCRIPTION
  Initializes an `onu/` directory within the current project

EXAMPLES
  $ onu init -l typescript
```

_See code: [dist/commands/init.ts](https://github.com/onuhq/onu-cli/blob/v0.2.0/dist/commands/init.ts)_

## `onu sos`

Displays contact information for the Onu team

```
USAGE
  $ onu sos

DESCRIPTION
  Displays contact information for the Onu team

EXAMPLES
  $ onu sos
```

_See code: [dist/commands/sos.ts](https://github.com/onuhq/onu-cli/blob/v0.2.0/dist/commands/sos.ts)_
<!-- commandsstop -->
