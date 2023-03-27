import os from 'node:os'
import path from 'node:path'

// Change this to bump to a newer version of Onu studio
export const TARGET_STUDIO_VERSION = 'v0.0.1'

export const HOME_DIR = os.homedir()

export const DOT_ONU = path.join(HOME_DIR, '.onu')
export const VERSION_PATH = path.join(DOT_ONU, 'studio', 'onu-studio-version.txt')
export const CLIENT_PATH = path.join(DOT_ONU, 'studio', 'client')
export const STUDIO_PATH = path.join(DOT_ONU, 'studio')
// command execution location
export const CMD_EXEC_PATH = process.cwd()
