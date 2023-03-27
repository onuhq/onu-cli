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
onu/0.0.1 darwin-x64 node-v16.0.0
$ onu --help [COMMAND]
USAGE
  $ onu COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`onu help [COMMANDS]`](#onu-help-commands)
* [`onu init`](#onu-init)

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
  Successfully  created an onu/ directory in the current project!
```

_See code: [dist/commands/init/index.ts](https://github.com/onuhq/onu-cli/blob/v0.0.1/dist/commands/init/index.ts)_
<!-- commandsstop -->
